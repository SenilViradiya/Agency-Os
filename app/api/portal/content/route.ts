import { NextRequest, NextResponse } from 'next/server';
import { verifyPortalSession } from '@/lib/portalAuth';
import ContentItem from '@/models/ContentItem';
import dayjs from 'dayjs';
import { registerModels } from '@/models';

registerModels();

export async function GET(req: NextRequest) {
  try {
    const sessionContext = await verifyPortalSession();
    if ('error' in sessionContext) {
      return NextResponse.json({ success: false, error: sessionContext.error }, { status: sessionContext.status });
    }

    const { session } = sessionContext;
    const clientId = (session.user as any).clientId;
    const organizationId = (session.user as any).organizationId;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const month = searchParams.get('month'); // YYYY-MM
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '500', 10); // larger limit default for calendar views
    const skip = (page - 1) * limit;

    const query: any = {
      clientId,
      organizationId,
    };

    if (projectId && projectId !== 'all') {
      query.projectId = projectId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (month) {
      const startOfMonth = dayjs(month).startOf('month').toDate();
      const endOfMonth = dayjs(month).endOf('month').toDate();
      query.plannedPublishDate = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    }

    const [items, total] = await Promise.all([
      ContentItem.find(query)
        .select('title contentType platforms currentStage stageStatuses plannedPublishDate publishData.publishedUrl publishData.status status totalRevisions approvalData.status approvalData.totalRevisions')
        .sort({ plannedPublishDate: 1 })
        .skip(skip)
        .limit(limit),
      ContentItem.countDocuments(query),
    ]);

    // Format output to be client-safe and clean up structure
    const clientSafeItems = items.map((item: any) => {
      const plainObj = item.toObject();
      
      // Calculate total revisions from approval data cleanly
      const totalRevisions = plainObj.approvalData?.totalRevisions || 0;
      delete plainObj.approvalData; // remove detailed internal approval notes

      return {
        ...plainObj,
        totalRevisions,
      };
    });

    return NextResponse.json({
      success: true,
      data: clientSafeItems,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error: any) {
    console.error('[API PORTAL CONTENT GET]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
