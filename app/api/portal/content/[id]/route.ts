import { NextRequest, NextResponse } from 'next/server';
import { verifyPortalSession } from '@/lib/portalAuth';
import ContentItem from '@/models/ContentItem';
import { registerModels } from '@/models';

registerModels();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionContext = await verifyPortalSession();
    if ('error' in sessionContext) {
      return NextResponse.json({ success: false, error: sessionContext.error }, { status: sessionContext.status });
    }

    const { session } = sessionContext;
    const clientId = (session.user as any).clientId;
    const organizationId = (session.user as any).organizationId;
    const { id } = await params;

    const content = await ContentItem.findOne({
      _id: id,
      clientId,
      organizationId,
    });

    if (!content) {
      return NextResponse.json({ success: false, error: 'Content item not found or access denied.' }, { status: 403 });
    }

    // Prepare client-safe payload
    const clientSafeDetails = {
      _id: content._id,
      contentNumber: content.contentNumber,
      projectId: content.projectId,
      title: content.title,
      description: content.description,
      contentType: content.contentType,
      platforms: content.platforms,
      currentStage: content.currentStage,
      stageStatuses: content.stageStatuses,
      status: content.status,
      plannedPublishDate: content.plannedPublishDate,
      publishData: {
        publishedAt: content.publishData?.publishedAt,
        publishedUrl: content.publishData?.publishedUrl,
        platforms: content.publishData?.platforms || [],
        status: content.publishData?.status,
      },
      approvalData: {
        status: content.approvalData?.status,
        totalRevisions: content.approvalData?.totalRevisions || 0,
        currentRevisionNumber: content.approvalData?.currentRevisionNumber || 0,
      },
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: clientSafeDetails,
    });

  } catch (error: any) {
    console.error('[API PORTAL CONTENT ID GET]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
