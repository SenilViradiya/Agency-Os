import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';
import Project from '@/models/Project';
import ContentItem from '@/models/ContentItem';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const orgId = session.user.organizationId;

    const allClients = await Client.find({ organizationId: orgId, status: 'active' })
      .populate('assignedManager', 'name')
      .lean();

    const clients = await Promise.all(
      allClients.map(async (client) => {
        const clientId = client._id;

        // Project health
        const totalProjects = await Project.countDocuments({ organizationId: orgId, clientId });
        const activeProjectsCount = await Project.countDocuments({ organizationId: orgId, clientId, status: 'active' });
        const completedProjectsCount = await Project.countDocuments({ organizationId: orgId, clientId, status: 'completed' });

        const projCompAgg = await Project.aggregate([
          { $match: { organizationId: orgId, clientId } },
          { $group: { _id: null, avgCompletion: { $avg: '$completionPercentage' } } },
        ]);
        const avgProjectCompletion = projCompAgg.length > 0
          ? Math.round((projCompAgg[0].avgCompletion || 0) * 10) / 10
          : 0;

        // Content delivery
        const totalContentItems = await ContentItem.countDocuments({ organizationId: orgId, clientId });
        const publishedContentItems = await ContentItem.countDocuments({
          organizationId: orgId,
          clientId,
          'publishData.status': 'published',
        });
        const pendingContentItems = totalContentItems - publishedContentItems;
        const contentDeliveryRate = totalContentItems > 0
          ? Math.round((publishedContentItems / totalContentItems) * 1000) / 10
          : 0;

        // Quality
        const revAgg = await ContentItem.aggregate([
          { $match: { organizationId: orgId, clientId } },
          {
            $group: {
              _id: null,
              totalRevisions: { $sum: '$approvalData.totalRevisions' },
              count: { $sum: 1 },
            },
          },
        ]);
        const totalRevisions = revAgg.length > 0 ? revAgg[0].totalRevisions : 0;
        const avgRevisionsPerContent = revAgg.length > 0 && revAgg[0].count > 0
          ? Math.round((revAgg[0].totalRevisions / revAgg[0].count) * 10) / 10
          : 0;

        // Contract
        const contractEndDate = (client as unknown as { contractEndDate: Date | null }).contractEndDate;
        const now = new Date();
        const daysUntilRenewal = contractEndDate
          ? Math.ceil((new Date(contractEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // Health score
        const qualityScore = Math.min(100, Math.max(0, 100 - avgRevisionsPerContent * 10));
        const healthScore = Math.round(
          contentDeliveryRate * 0.4 + qualityScore * 0.3 + avgProjectCompletion * 0.3
        );
        let healthStatus: 'excellent' | 'good' | 'at_risk' | 'critical' = 'critical';
        if (healthScore >= 80) healthStatus = 'excellent';
        else if (healthScore >= 60) healthStatus = 'good';
        else if (healthScore >= 40) healthStatus = 'at_risk';

        const manager = client.assignedManager as unknown as { name?: string };

        return {
          clientId: clientId.toString(),
          businessName: client.businessName,
          tier: client.tier,
          status: client.status,
          assignedManager: manager?.name || 'Unassigned',
          totalProjects,
          activeProjects: activeProjectsCount,
          completedProjects: completedProjectsCount,
          avgProjectCompletion,
          totalContentItems,
          publishedContentItems,
          pendingContentItems,
          contentDeliveryRate,
          totalRevisions,
          avgRevisionsPerContent,
          contractEndDate,
          daysUntilRenewal,
          monthlyRetainerValue: client.monthlyRetainerValue || 0,
          healthScore,
          healthStatus,
        };
      })
    );

    // Delivery rate by client for bar chart
    const deliveryRateByClient = clients.map((c) => ({
      clientName: c.businessName,
      deliveryRate: c.contentDeliveryRate,
      healthStatus: c.healthStatus,
    }));

    // Expiring contracts
    const expiringContracts = clients
      .filter((c) => c.daysUntilRenewal <= 30 && c.daysUntilRenewal > -999)
      .map((c) => ({
        clientId: c.clientId,
        businessName: c.businessName,
        contractEndDate: c.contractEndDate,
        daysUntilRenewal: c.daysUntilRenewal,
        monthlyRetainerValue: c.monthlyRetainerValue,
      }));

    return NextResponse.json({
      success: true,
      data: { clients, deliveryRateByClient, expiringContracts },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
