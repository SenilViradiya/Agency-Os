import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ContentItem from '@/models/ContentItem';
import Notification from '@/models/Notification';
import Task from '@/models/Task';
import User from '@/models/User';
import Role from '@/models/Role';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId } = await params;
    const { approvalNotes } = await req.json();

    await dbConnect();

    const organizationId = (session.user as any).organizationId;
    
    // RBAC Check: Manager or Super Admin only
    const user = await User.findById((session.user as any).id).populate('role');
    const roleSlug = (user?.role as any)?.slug;
    
    if (roleSlug !== 'manager' && roleSlug !== 'super-admin' && roleSlug !== 'admin') {
        return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const contentItem = await ContentItem.findOne({ _id: contentId, organizationId });

    if (!contentItem) {
      return NextResponse.json({ success: false, error: 'Content item not found' }, { status: 404 });
    }

    // Conflict of interest check
    if (contentItem.approvalData.submittedBy?.toString() === (session.user as any).id) {
        return NextResponse.json({ success: false, error: 'Cannot approve your own submission' }, { status: 400 });
    }

    if (contentItem.approvalData.status !== 'pending_review') {
      return NextResponse.json({ success: false, error: 'Content is not pending review' }, { status: 400 });
    }

    // Update ContentItem
    contentItem.approvalData.status = 'approved';
    contentItem.approvalData.approvedAt = new Date();
    contentItem.approvalData.reviewedBy = (session.user as any).id as any;
    contentItem.approvalData.reviewedAt = new Date();
    contentItem.approvalData.approvalNotes = approvalNotes;
    
    contentItem.status = 'approved';
    contentItem.currentStage = 'publish';
    contentItem.stageStatuses.approval = 'done';
    contentItem.stageStatuses.publish = 'in_progress';
    contentItem.publishData.status = 'ready_to_publish';

    await contentItem.save();

    // Auto-create publish Task
    const dueDate = contentItem.publishData.scheduledAt || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    
    const publishTask = await Task.create({
        organizationId,
        title: `Publish — ${contentItem.title}`,
        type: 'publish',
        isPipelineTask: true,
        pipelineStage: 'publish',
        entityType: 'content_item',
        entityId: contentItem._id,
        assignedTo: [contentItem.assignedTo],
        dueDate,
        status: 'todo',
        priority: contentItem.priority,
        createdBy: (session.user as any).id,
    });

    contentItem.stageTasks.publish = publishTask._id as any;
    await contentItem.save();

    // Create notification for subitter
    if (contentItem.approvalData.submittedBy) {
        await Notification.create({
            organizationId,
            recipientId: contentItem.approvalData.submittedBy,
            type: 'content_approved',
            title: 'Content Approved ✓',
            message: `${session.user?.name} approved ${contentItem.title} ✓`,
            link: `/content/${contentItem._id}`,
            entityType: 'content_item',
            entityId: contentItem._id,
        });
    }

    return NextResponse.json({ success: true, data: contentItem });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
