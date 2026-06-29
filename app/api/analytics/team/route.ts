import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import ContentItem from '@/models/ContentItem';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const orgId = session.user.organizationId;
    const currentUserId = session.user.id;
    const currentRole = session.user.role;
    const { searchParams } = new URL(req.url);

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate') as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate') as string)
      : new Date();
    const filterUserId = searchParams.get('userId');

    const dateFilter = { $gte: startDate, $lte: endDate };

    // Get users - filter by role for editors
    const isManager = ['Super Admin', 'Admin', 'Manager'].includes(currentRole);
    let userQuery: Record<string, unknown> = { organizationId: orgId, status: 'active' };
    if (!isManager) {
      userQuery._id = new mongoose.Types.ObjectId(currentUserId);
    } else if (filterUserId) {
      userQuery._id = new mongoose.Types.ObjectId(filterUserId);
    }

    const users = await User.find(userQuery).select('name email avatar role').lean();

    const members = await Promise.all(
      users.map(async (user) => {
        const userId = user._id;

        // Task metrics
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
        const tasksInProgress = await Task.countDocuments({
          organizationId: orgId,
          assignedTo: userId,
          status: 'in_progress',
        });
        const tasksOverdue = await Task.countDocuments({
          organizationId: orgId,
          assignedTo: userId,
          status: { $ne: 'done' },
          dueDate: { $lt: new Date() },
        });

        const taskCompletionRate = tasksAssigned > 0
          ? Math.round((tasksCompleted / tasksAssigned) * 1000) / 10
          : 0;

        // On-time delivery
        const tasksCompletedOnTime = await Task.countDocuments({
          organizationId: orgId,
          assignedTo: userId,
          status: 'done',
          completedAt: dateFilter,
          $expr: { $lte: ['$completedAt', '$dueDate'] },
        });
        const tasksCompletedLate = tasksCompleted - tasksCompletedOnTime;
        const onTimeDeliveryRate = tasksCompleted > 0
          ? Math.round((tasksCompletedOnTime / tasksCompleted) * 1000) / 10
          : 0;

        // Content metrics
        const contentItemsOwned = await ContentItem.countDocuments({
          organizationId: orgId,
          assignedTo: userId,
          createdAt: dateFilter,
        });
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
              avgRevisions: { $avg: '$approvalData.totalRevisions' },
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

        const contentRevisionRate = contentRevAgg.length > 0
          ? Math.round((contentRevAgg[0].avgRevisions || 0) * 10) / 10
          : 0;
        const totalSubmitted = contentRevAgg.length > 0 ? contentRevAgg[0].totalSubmitted : 0;
        const firstPass = contentRevAgg.length > 0 ? contentRevAgg[0].firstPass : 0;
        const approvalFirstPassRate = totalSubmitted > 0
          ? Math.round((firstPass / totalSubmitted) * 1000) / 10
          : 100;
        const totalRevisionsSent = contentRevAgg.length > 0 ? contentRevAgg[0].totalRevisions : 0;

        // Weekly task completion (last 4 weeks)
        const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
        const weeklyAgg = await Task.aggregate([
          {
            $match: {
              organizationId: orgId,
              assignedTo: userId,
              status: 'done',
              completedAt: { $gte: fourWeeksAgo },
            },
          },
          {
            $group: {
              _id: { $isoWeek: '$completedAt' },
              completed: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);
        const weeklyTaskCompletion = weeklyAgg.map((w, i) => ({
          week: `W${i + 1}`,
          completed: w.completed,
        }));

        return {
          userId: userId.toString(),
          name: user.name,
          avatar: (user as unknown as { avatar?: string }).avatar || '',
          role: user.role,
          tasksAssigned,
          tasksCompleted,
          tasksInProgress,
          tasksOverdue,
          taskCompletionRate,
          tasksCompletedOnTime,
          tasksCompletedLate,
          onTimeDeliveryRate,
          contentItemsOwned,
          contentItemsDelivered,
          contentRevisionRate,
          approvalFirstPassRate,
          totalRevisionsSent,
          weeklyTaskCompletion,
        };
      })
    );

    // Team comparison for bar chart
    const teamComparison = members.map((m) => ({
      name: m.name,
      tasksCompleted: m.tasksCompleted,
      onTimeRate: m.onTimeDeliveryRate,
      contentDelivered: m.contentItemsDelivered,
    }));

    return NextResponse.json({
      success: true,
      data: { members, teamComparison },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
