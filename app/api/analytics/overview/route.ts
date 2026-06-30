import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import ContentItem from '@/models/ContentItem';
import Project from '@/models/Project';
import Lead from '@/models/Lead';
import Client from '@/models/Client';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate') as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate') as string)
      : new Date();

    const dateFilter = { $gte: startDate, $lte: endDate };

    // ── Summary Stats ──
    const totalTasks = await Task.countDocuments({ organizationId: orgId, createdAt: dateFilter });
    const completedTasks = await Task.countDocuments({ organizationId: orgId, status: 'done', completedAt: dateFilter });
    const overdueTasks = await Task.countDocuments({
      organizationId: orgId,
      status: { $ne: 'done' },
      dueDate: { $lt: new Date() },
    });
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0;

    const totalContentItems = await ContentItem.countDocuments({ organizationId: orgId, createdAt: dateFilter });
    const publishedContent = await ContentItem.countDocuments({
      organizationId: orgId,
      'publishData.status': 'published',
      createdAt: dateFilter,
    });
    const contentDeliveryRate = totalContentItems > 0
      ? Math.round((publishedContent / totalContentItems) * 1000) / 10
      : 0;

    const revisionAgg = await ContentItem.aggregate([
      { $match: { organizationId: orgId, createdAt: dateFilter } },
      { $group: { _id: null, totalRevisions: { $sum: '$approvalData.totalRevisions' }, count: { $sum: 1 } } },
    ]);
    const totalRevisions = revisionAgg.length > 0 ? revisionAgg[0].totalRevisions : 0;
    const avgRevisionsPerContent = revisionAgg.length > 0 && revisionAgg[0].count > 0
      ? Math.round((revisionAgg[0].totalRevisions / revisionAgg[0].count) * 10) / 10
      : 0;

    const activeProjects = await Project.countDocuments({ organizationId: orgId, status: 'active' });
    const completedProjects = await Project.countDocuments({ organizationId: orgId, status: 'completed' });
    const activeClients = await Client.countDocuments({ organizationId: orgId, status: 'active' });

    const totalLeads = await Lead.countDocuments({ organizationId: orgId, createdAt: dateFilter });
    const wonLeads = await Lead.countDocuments({ organizationId: orgId, status: 'won', createdAt: dateFilter });
    const leadConversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 1000) / 10 : 0;

    // ── Task Completion Trend (per day) ──
    const taskTrendAgg = await Task.aggregate([
      { $match: { organizationId: orgId, createdAt: dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          created: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const taskCompletionTrend = taskTrendAgg.map((d) => ({
      date: d._id,
      created: d.created,
      completed: d.completed,
    }));

    // ── Tasks by Type ──
    const tasksByTypeAgg = await Task.aggregate([
      { $match: { organizationId: orgId, createdAt: dateFilter } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const tasksByType = tasksByTypeAgg.map((d) => ({ type: d._id, count: d.count }));

    // ── Content Published Trend (per week) ──
    const contentTrendAgg = await ContentItem.aggregate([
      { $match: { organizationId: orgId, createdAt: dateFilter } },
      {
        $group: {
          _id: { $isoWeek: '$createdAt' },
          year: { $first: { $isoWeekYear: '$createdAt' } },
          created: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ['$publishData.status', 'published'] }, 1, 0] },
          },
        },
      },
      { $sort: { year: 1, _id: 1 } },
    ]);
    const contentPublishedTrend = contentTrendAgg.map((d, i) => ({
      week: `Week ${i + 1}`,
      created: d.created,
      published: d.published,
    }));

    // ── Content by Platform ──
    const contentByPlatformAgg = await ContentItem.aggregate([
      { $match: { organizationId: orgId, createdAt: dateFilter } },
      { $unwind: '$platforms' },
      { $group: { _id: '$platforms', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const contentByPlatform = contentByPlatformAgg.map((d) => ({ platform: d._id, count: d.count }));

    // ── Content by Stage (Pipeline Distribution) ──
    const contentByStageAgg = await ContentItem.aggregate([
      { $match: { organizationId: orgId, createdAt: dateFilter } },
      { $group: { _id: '$currentStage', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const stageOrder = ['script', 'shoot', 'edit', 'thumbnail', 'caption', 'approval', 'publish', 'completed'];
    const contentByStage = stageOrder
      .map((stage) => {
        const found = contentByStageAgg.find((d) => d._id === stage);
        return { stage, count: found ? found.count : 0 };
      })
      .filter((d) => d.count > 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalTasks,
          completedTasks,
          overdueTasks,
          taskCompletionRate,
          totalContentItems,
          publishedContent,
          contentDeliveryRate,
          totalRevisions,
          avgRevisionsPerContent,
          activeProjects,
          completedProjects,
          activeClients,
          newLeadsThisPeriod: totalLeads,
          wonLeadsThisPeriod: wonLeads,
          leadConversionRate,
        },
        taskCompletionTrend,
        tasksByType,
        contentPublishedTrend,
        contentByPlatform,
        contentByStage,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
