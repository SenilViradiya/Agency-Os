import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Performance from '@/models/Performance';
import Employee from '@/models/Employee';
import Notification from '@/models/Notification';
import * as z from 'zod';

const performanceUpdateSchema = z.object({
  ratings: z.object({
    workQuality: z.number().min(1).max(5),
    punctuality: z.number().min(1).max(5),
    teamwork: z.number().min(1).max(5),
    communication: z.number().min(1).max(5),
    initiative: z.number().min(1).max(5),
  }).optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  goalsForNextMonth: z.string().optional(),
  managerNotes: z.string().optional(),
  selfRating: z.number().min(1).max(5).optional(),
  selfReview: z.string().optional(),
  action: z.enum(['publish']).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_performance', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const review = await Performance.findOne({ organizationId: orgId, _id: id })
      .populate('employeeId', 'fullName department designation employeeNumber avatar userId')
      .populate('reviewedBy', 'name');

    if (!review) {
      return NextResponse.json({ success: false, error: 'Performance review not found' }, { status: 404 });
    }

    const employeeNode = review.employeeId as any;
    const isSelf = employeeNode?.userId?.toString() === session.user.id;
    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';

    if (!isManager && !isSelf) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Hide draft reviews from the employee
    if (review.status === 'draft' && !isManager) {
      return NextResponse.json({ success: false, error: 'Review is not published yet.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: review });

  } catch (error: any) {
    console.error('[PERFORMANCE_ID_GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const review = await Performance.findOne({ organizationId: orgId, _id: id });
    if (!review) {
      return NextResponse.json({ success: false, error: 'Performance review not found' }, { status: 404 });
    }

    const employee = await Employee.findOne({ organizationId: orgId, _id: review.employeeId });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsedData = performanceUpdateSchema.parse(body);

    const isSelf = employee.userId.toString() === session.user.id;
    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';

    // If currentUser is the reviewed employee
    if (isSelf && !isManager) {
      // Only allow updating selfRating + selfReview fields!
      if (parsedData.selfRating !== undefined) {
        review.selfRating = parsedData.selfRating;
      }
      if (parsedData.selfReview !== undefined) {
        review.selfReview = parsedData.selfReview;
      }
      await review.save();

      return NextResponse.json({
        success: true,
        data: review,
        message: 'Self-review saved successfully',
      });
    }

    // Manager updates
    if (!isManager) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Publish action
    if (parsedData.action === 'publish') {
      review.status = 'published';
      review.publishedAt = new Date();
      await review.save();

      // Notify employee
      await Notification.create({
        organizationId: orgId,
        recipientId: employee.userId,
        type: 'approval_requested', // Valid Enum fallback mapping
        title: 'Performance Review Published',
        message: `Your performance review for ${review.monthName} is ready.`,
        link: `/hr/employees/${employee._id}?tab=performance`,
        entityType: 'Performance',
        entityId: review._id,
        isRead: false,
      });

      return NextResponse.json({
        success: true,
        data: review,
        message: 'Performance review published successfully',
      });
    }

    // Standard draft update: allow edit only if status = 'draft'
    if (review.status !== 'draft') {
      return NextResponse.json({
        success: false,
        error: 'Only draft performance reviews can be updated by managers.'
      }, { status: 400 });
    }

    if (parsedData.ratings) {
      const rats = parsedData.ratings;
      const overallRating = Math.round(((rats.workQuality + rats.punctuality + rats.teamwork + rats.communication + rats.initiative) / 5) * 10) / 10;
      review.ratings = {
        ...rats,
        overallRating,
      };
    }

    if (parsedData.strengths !== undefined) review.strengths = parsedData.strengths;
    if (parsedData.improvements !== undefined) review.improvements = parsedData.improvements;
    if (parsedData.goalsForNextMonth !== undefined) review.goalsForNextMonth = parsedData.goalsForNextMonth;
    if (parsedData.managerNotes !== undefined) review.managerNotes = parsedData.managerNotes;

    await review.save();

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Performance review updated successfully',
    });

  } catch (error: any) {
    console.error('[PERFORMANCE_ID_PUT] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
