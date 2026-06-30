import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(session.user, 'finance_profitability', 'read') &&
      (session.user as any).role !== 'Super Admin' &&
      (session.user as any).role !== 'Manager' &&
      (session.user as any).role !== 'Admin'
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { searchParams } = new URL(req.url);

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const clientIdStr = searchParams.get('clientId');

    const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    const clientFilter: any = { organizationId: orgId };
    if (clientIdStr && mongoose.isValidObjectId(clientIdStr)) {
      clientFilter._id = new mongoose.Types.ObjectId(clientIdStr);
    }

    // Build the aggregation pipeline
    const pipeline: any[] = [
      { $match: clientFilter },
      // 1. Join payments within date range to find revenue
      {
        $lookup: {
          from: 'payments',
          let: { clientId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$clientId', '$$clientId'] },
                    { $eq: ['$organizationId', orgId] },
                    { $gte: ['$paymentDate', startDate] },
                    { $lte: ['$paymentDate', endDate] },
                  ],
                },
              },
            },
          ],
          as: 'paymentsMatched',
        },
      },
      // 2. Join expenses linked directly to client within range (direct expenses)
      {
        $lookup: {
          from: 'expenses',
          let: { clientId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$clientId', '$$clientId'] },
                    { $eq: ['$organizationId', orgId] },
                    { $eq: ['$status', 'paid'] },
                    { $ne: ['$isDeleted', true] },
                    { $gte: ['$expenseDate', startDate] },
                    { $lte: ['$expenseDate', endDate] },
                  ],
                },
              },
            },
          ],
          as: 'expensesMatched',
        },
      },
      // 3. Get projects for this client
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'clientId',
          as: 'projectsMatched',
        },
      },
      // 4. Join VendorBills matching project specific bills (when project matches current client)
      {
        $lookup: {
          from: 'vendorbills',
          let: { projectIds: '$projectsMatched._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$projectId', { $ifNull: ['$$projectIds', []] }] },
                    { $eq: ['$organizationId', orgId] },
                    { $eq: ['$status', 'paid'] },
                    { $gte: ['$billDate', startDate] },
                    { $lte: ['$billDate', endDate] },
                  ],
                },
              },
            },
          ],
          as: 'vendorBillsMatched',
        },
      },
      // 5. Join invoices to compute billing status (outstanding, paid, sent counts)
      {
        $lookup: {
          from: 'invoices',
          let: { clientId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$clientId', '$$clientId'] },
                    { $eq: ['$organizationId', orgId] },
                    { $ne: ['$status', 'cancelled'] },
                    { $gte: ['$invoiceDate', startDate] },
                    { $lte: ['$invoiceDate', endDate] },
                  ],
                },
              },
            },
          ],
          as: 'invoicesMatched',
        },
      },
      // 6. Project the computed stats
      {
        $project: {
          clientId: '$_id',
          businessName: 1,
          tier: '$tier',
          revenue: { $sum: '$paymentsMatched.amount' },
          directExpenses: { $sum: '$expensesMatched.amount' },
          vendorCosts: { $sum: '$vendorBillsMatched.amount' },
          invoicesSent: {
            $size: {
              $filter: {
                input: '$invoicesMatched',
                as: 'inv',
                cond: { $in: ['$$inv.status', ['sent', 'partially_paid', 'paid', 'overdue']] },
              },
            },
          },
          invoicesPaid: {
            $size: {
              $filter: {
                input: '$invoicesMatched',
                as: 'inv',
                cond: { $eq: ['$$inv.status', 'paid'] },
              },
            },
          },
          outstandingAmount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$invoicesMatched',
                    as: 'inv',
                    cond: { $in: ['$$inv.status', ['sent', 'partially_paid', 'overdue', 'draft']] },
                  },
                },
                as: 'unpaidInv',
                in: '$$unpaidInv.amountDue',
              },
            },
          },
        },
      },
      // 7. Calculate calculations totals
      {
        $project: {
          clientId: 1,
          businessName: 1,
          tier: 1,
          revenue: 1,
          directExpenses: 1,
          vendorCosts: 1,
          totalCost: { $add: ['$directExpenses', '$vendorCosts'] },
          netProfit: { $subtract: ['$revenue', { $add: ['$directExpenses', '$vendorCosts'] }] },
          invoicesSent: 1,
          invoicesPaid: 1,
          outstandingAmount: 1,
        },
      },
      // 8. Profit Margin
      {
        $project: {
          clientId: 1,
          businessName: 1,
          tier: 1,
          revenue: 1,
          directExpenses: 1,
          vendorCosts: 1,
          totalCost: 1,
          netProfit: 1,
          profitMargin: {
            $cond: [
              { $gt: ['$revenue', 0] },
              { $multiply: [{ $divide: ['$netProfit', '$revenue'] }, 100] },
              0,
            ],
          },
          invoicesSent: 1,
          invoicesPaid: 1,
          outstandingAmount: 1,
        },
      },
    ];

    const clientsData = await Client.aggregate(pipeline);

    // Compute Summary values
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalProfit = 0;
    let totalOutstanding = 0;

    clientsData.forEach((client) => {
      totalRevenue += client.revenue;
      totalCosts += client.totalCost;
      totalProfit += client.netProfit;
      totalOutstanding += client.outstandingAmount;
    });

    const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const summary = {
      totalRevenue,
      totalCosts,
      totalProfit,
      avgProfitMargin,
      totalOutstanding,
    };

    // Format charts data
    const profitByClient = clientsData.map((client) => ({
      clientName: client.businessName,
      revenue: client.revenue,
      cost: client.totalCost,
      profit: client.netProfit,
    }));

    return NextResponse.json({
      success: true,
      data: {
        clients: clientsData,
        summary,
        profitByClient,
      },
    });
  } catch (error: any) {
    console.error('[PROFITABILITY_GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
