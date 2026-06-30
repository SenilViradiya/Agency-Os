import { NextRequest, NextResponse } from 'next/server';
import { verifyPortalSession } from '@/lib/portalAuth';
import Project from '@/models/Project';
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

    // Fetch the project and verify it belongs to this client
    const project = await Project.findOne({
      _id: id,
      clientId,
      organizationId,
    }).select('name type status completionPercentage startDate endDate deadline projectNumber description contentQuota campaignObjective services platforms');

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found or access denied.' }, { status: 403 });
    }

    // Aggregate counts of ContentItems by stage for this project
    const contentItems = await ContentItem.find({
      projectId: id,
      clientId,
      organizationId,
    }).select('currentStage status');

    const totalContent = contentItems.length;
    const published = contentItems.filter(item => item.status === 'published').length;
    const inProduction = contentItems.filter(item => 
      ['in_production', 'in_approval', 'pending_approval', 'revision_requested', 'draft'].includes(item.status)
    ).length;
    const planned = contentItems.filter(item => item.status === 'on_hold').length; // or draft depending on definition

    const stageCounts = {
      script: contentItems.filter(item => item.currentStage === 'script').length,
      shoot: contentItems.filter(item => item.currentStage === 'shoot').length,
      edit: contentItems.filter(item => item.currentStage === 'edit').length,
      thumbnail: contentItems.filter(item => item.currentStage === 'thumbnail').length,
      caption: contentItems.filter(item => item.currentStage === 'caption').length,
      approval: contentItems.filter(item => item.currentStage === 'approval').length,
      publish: contentItems.filter(item => item.currentStage === 'publish').length,
      completed: contentItems.filter(item => item.currentStage === 'completed').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        project,
        summary: {
          totalContent,
          published,
          inProduction,
          planned,
          stageCounts
        }
      }
    });

  } catch (error: any) {
    console.error('[API PORTAL PROJECT BY ID GET]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
