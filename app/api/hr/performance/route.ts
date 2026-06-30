import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Performance from '@/models/Performance';
import Employee from '@/models/Employee';
import Task from '@/models/Task';
import ContentItem from '@/models/ContentItem';
import * as z from 'zod';
import dayjs from 'dayjs';

const performanceCreateSchema = z.object({
  employeeId: z.string(),
  month: z.string(), // YYYY-MM
  ratings: z.object({
    workQuality: z.number().min(1).max(5),
    punctuality: z.number().min(1).max(5),
    teamwork: z.number().min(1).max(5),
    communication: z.number().min(1).max(5),
    initiative: z.number().min(1).max(5),
  }),
  strengths: z.string().min(1, 'Strengths are required'),
  improvements: z.string().min(1, 'Improvements are required'),
  goalsForNextMonth: z.string().min(1, 'Goals are required'),
  managerNotes: z.string().optional().default(''),
});

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);

    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';

    let query: any = { organizationId: orgId };

    if (!isManager) {
      // Find current user's employee profile
      const selfEmployee = await Employee.findOne({ organizationId: orgId, userId: session.user.id });
      if (!selfEmployee) {
        return NextResponse.json({ success: true, data: [], meta: { total: 0, page, limit } });
      }
      query.employeeId = selfEmployee._id;
      // Normal users only see published performance reviews
      query.status = 'published';
    } else {
      if (employeeId) query.employeeId = employeeId;
      if (status) query.status = status;
    }

    if (month) query.month = month;

    const reviews = await Performance.find(query)
      .populate('employeeId', 'fullName department designation employeeNumber avatar')
      .populate('reviewedBy', 'name')
      .sort({ month: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Performance.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: reviews,
      meta: {
        total,
        page,
        limit
      }
    });

  } catch (error: any) {
    console.error('[PERFORMANCE_GET_API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_performance', 'create')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const body = await req.json();
    const parsedData = performanceCreateSchema.parse(body);

    const employee = await Employee.findOne({ organizationId: orgId, _id: parsedData.employeeId });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Target employee profile not found.' }, { status: 404 });
    }

    // Check unique constraint per employee per month
    const existingReview = await Performance.findOne({
      organizationId: orgId,
      employeeId: parsedData.employeeId,
      month: parsedData.month,
    });
    if (existingReview) {
      return NextResponse.json({
        success: false,
        error: `A performance review has already been created for this employee in ${parsedData.month}.`
      }, { status: 400 });
    }

    // Compute Date filter
    const monthDate = dayjs(parsedData.month, 'YYYY-MM');
    const monthName = monthDate.format('MMMM YYYY');
    const start = monthDate.startOf('month').toDate();
    const end = monthDate.endOf('month').toDate();
    const dateFilter = { $gte: start, $lte: end };

    const userId = employee.userId;

    // Pull Analytics Snapshot
    const tasksAssigned = await Task.countDocuments({
      organizationId: orgId,
      assignedTo: userId,
      createdAt: dateFilter,
    });

    const tasksCompleted = await Task.countDocuments({
      organizationId: orgId,
      assignedTo: userId,
      status: 'done',
      completedAt: dateFilter,
    });

    const taskCompletionRate = tasksAssigned > 0
      ? Math.round((tasksCompleted / tasksAssigned) * 100)
      : 0;

    const tasksCompletedOnTime = await Task.countDocuments({
      organizationId: orgId,
      assignedTo: userId,
      status: 'done',
      completedAt: dateFilter,
      $expr: { $lte: ['$completedAt', '$dueDate'] },
    });

    const onTimeDeliveryRate = tasksCompleted > 0
      ? Math.round((tasksCompletedOnTime / tasksCompleted) * 100)
      : 0;

    const contentItemsDelivered = await ContentItem.countDocuments({
      organizationId: orgId,
      assignedTo: userId,
      'publishData.status': 'published',
      createdAt: dateFilter,
    });

    const contentRevAgg = await ContentItem.aggregate([
      {
        $match: {
          organizationId: orgId,
          assignedTo: userId,
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalRevisions: { $sum: '$approvalData.totalRevisions' },
          totalSubmitted: {
            $sum: {
              $cond: [{ $ne: ['$approvalData.status', 'not_submitted'] }, 1, 0],
            },
          },
          firstPass: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$approvalData.status', 'not_submitted'] },
                    { $eq: ['$approvalData.totalRevisions', 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const totalRevisionsSent = contentRevAgg.length > 0 ? contentRevAgg[0].totalRevisions : 0;
    const totalSubmitted = contentRevAgg.length > 0 ? contentRevAgg[0].totalSubmitted : 0;
    const firstPass = contentRevAgg.length > 0 ? contentRevAgg[0].firstPass : 0;
    const approvalFirstPassRate = totalSubmitted > 0
      ? Math.round((firstPass / totalSubmitted) * 100)
      : 100;

    const analyticsSnapshot = {
      tasksAssigned,
      tasksCompleted,
      taskCompletionRate,
      onTimeDeliveryRate,
      contentItemsDelivered,
      totalRevisionsSent,
      approvalFirstPassRate,
    };

    // Calculate overall average rating
    const rats = parsedData.ratings;
    const overallRating = Math.round(((rats.workQuality + rats.punctuality + rats.teamwork + rats.communication + rats.initiative) / 5) * 10) / 10;

    const newPerformance = new Performance({
      organizationId: orgId,
      employeeId: parsedData.employeeId,
      reviewedBy: session.user.id,
      month: parsedData.month,
      monthName,
      analyticsSnapshot,
      ratings: {
        ...rats,
        overallRating,
      },
      strengths: parsedData.strengths,
      improvements: parsedData.improvements,
      goalsForNextMonth: parsedData.goalsForNextMonth,
      managerNotes: parsedData.managerNotes || undefined,
      status: 'draft',
    });

    await newPerformance.save();

    return NextResponse.json({
      success: true,
      data: newPerformance,
      message: 'Performance review draft successfully created',
    });

  } catch (error: any) {
    console.error('[PERFORMANCE_POST_API] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
