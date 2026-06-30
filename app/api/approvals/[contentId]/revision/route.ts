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
    const { revisionNotes } = await req.json();

    if (!revisionNotes) {
        return NextResponse.json({ success: false, error: 'Revision notes are required' }, { status: 400 });
    }

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

    if (contentItem.approvalData.status !== 'pending_review') {
      return NextResponse.json({ success: false, error: 'Content is not pending review' }, { status: 400 });
    }

    // Update ContentItem
    contentItem.approvalData.totalRevisions += 1;
    contentItem.approvalData.currentRevisionNumber += 1;
    
    contentItem.approvalData.revisionHistory.push({
        revisionNumber: contentItem.approvalData.currentRevisionNumber,
        requestedBy: (session.user as any).id as any,
        requestedAt: new Date(),
        revisionNotes: revisionNotes,
    });

    contentItem.approvalData.status = 'revision_requested';
    contentItem.status = 'revision_requested';
    contentItem.currentStage = 'edit';
    contentItem.stageStatuses.approval = 'pending';
    contentItem.stageStatuses.edit = 'in_progress';

    await contentItem.save();

    // Auto-create revision Task
    const editorId = contentItem.editData?.editorAssigned || contentItem.assignedTo;
    
    const revisionTask = await Task.create({
        organizationId,
        title: `Revision #${contentItem.approvalData.currentRevisionNumber} — ${contentItem.title}`,
        type: 'edit',
        isPipelineTask: true,
        pipelineStage: 'edit',
        description: revisionNotes,
        entityType: 'content_item',
        entityId: contentItem._id,
        assignedTo: [editorId],
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'todo',
        priority: 'high',
        createdBy: (session.user as any).id,
    });

    contentItem.stageTasks.edit = revisionTask._id as any;
    await contentItem.save();

    // Create notification for subitter
    if (contentItem.approvalData.submittedBy) {
        await Notification.create({
            organizationId,
            recipientId: contentItem.approvalData.submittedBy,
            type: 'revision_requested',
            title: 'Revision Requested ↩',
            message: `${session.user?.name} requested revision on ${contentItem.title}`,
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
