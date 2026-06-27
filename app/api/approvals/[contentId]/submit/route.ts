import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ContentItem from '@/models/ContentItem';
import Notification from '@/models/Notification';
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
    const { driveLink, submissionNotes } = await req.json();

    if (!driveLink) {
      return NextResponse.json({ success: false, error: 'Drive link is required' }, { status: 400 });
    }

    await dbConnect();

    const organizationId = (session.user as any).organizationId;
    const contentItem = await ContentItem.findOne({ _id: contentId, organizationId });

    if (!contentItem) {
      return NextResponse.json({ success: false, error: 'Content item not found' }, { status: 404 });
    }

    if (contentItem.currentStage !== 'approval') {
      // Allow re-submission if it was revision_requested even if currentStage was set back to edit
      if (contentItem.approvalData.status !== 'revision_requested') {
         return NextResponse.json({ success: false, error: 'Content is not in approval stage' }, { status: 400 });
      }
    }

    if (contentItem.approvalData.status === 'pending_review') {
      return NextResponse.json({ success: false, error: 'Content is already pending review' }, { status: 400 });
    }

    const oldStatus = contentItem.approvalData.status;

    // Update ContentItem
    contentItem.approvalData.status = 'pending_review';
    contentItem.approvalData.submittedForReviewAt = new Date();
    contentItem.approvalData.submittedBy = (session.user as any).id as any;
    contentItem.approvalData.driveLink = driveLink;
    contentItem.approvalData.submissionNotes = submissionNotes;
    contentItem.status = 'pending_approval';
    
    // If it was a revision, mark the last history entry as resolved
    if (oldStatus === 'revision_requested' && contentItem.approvalData.revisionHistory.length > 0) {
        const lastRev = contentItem.approvalData.revisionHistory[contentItem.approvalData.revisionHistory.length - 1];
        if (!lastRev.resolvedAt) {
            lastRev.resolvedAt = new Date();
            lastRev.driveLink = driveLink;
        }
    }

    await contentItem.save();

    // Create notifications for Managers and Super Admins
    const adminRoles = await Role.find({ organizationId, slug: { $in: ['manager', 'super-admin', 'admin'] } });
    const adminRoleIds = adminRoles.map(r => r._id);
    
    const admins = await User.find({ 
        organizationId, 
        role: { $in: adminRoleIds },
        _id: { $ne: (session.user as any).id }
    });

    const notifications = admins.map(admin => ({
        organizationId,
        recipientId: admin._id,
        type: 'approval_requested',
        title: 'New Approval Requested',
        message: `${session.user?.name} submitted ${contentItem.title} for review`,
        link: '/approvals',
        entityType: 'content_item',
        entityId: contentItem._id,
    }));

    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
    }

    return NextResponse.json({ success: true, data: contentItem });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
