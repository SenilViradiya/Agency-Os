import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ContentItem from '@/models/ContentItem';
import Client from '@/models/Client';
import Project from '@/models/Project';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const projectId = searchParams.get('projectId');
    const submittedBy = searchParams.get('submittedBy');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const organizationId = (session.user as any).organizationId;

    let query: any = {
      organizationId,
      'approvalData.status': { $in: ['pending_review', 'approved', 'revision_requested'] },
    };

    if (status) query['approvalData.status'] = status;
    if (clientId) query.clientId = clientId;
    if (projectId) query.projectId = projectId;
    if (submittedBy) query['approvalData.submittedBy'] = submittedBy;

    // Filter by assignedTo if the user is an Editor (internal logic could be added here if needed)

    const items = await ContentItem.find(query)
      .populate('clientId', 'businessName')
      .populate('projectId', 'name')
      .populate('approvalData.submittedBy', 'name avatar')
      .populate('approvalData.reviewedBy', 'name avatar')
      .sort({ 'approvalData.submittedForReviewAt': 1 })
      .skip(skip)
      .limit(limit);

    const total = await ContentItem.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
