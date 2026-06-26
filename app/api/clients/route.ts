import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';
import Project from '@/models/Project';
import { hasPermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'clients', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const assignedManager = searchParams.get('assignedManager');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = { organizationId: (user as any).organizationId };

    if (status) query.status = status;
    if (tier) query.tier = tier;
    if (assignedManager) query.assignedManager = assignedManager;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { clientNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      Client.find(query)
        .populate('assignedManager', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Client.countDocuments(query),
    ]);

    // Fetch active project counts for each client
    const clientIds = clients.map(c => c._id);
    const projectCounts = await Project.aggregate([
      { $match: { clientId: { $in: clientIds }, status: 'active' } },
      { $group: { _id: '$clientId', count: { $sum: 1 } } }
    ]);

    const projectCountMap = projectCounts.reduce((acc: any, curr: any) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const enrichedClients = clients.map(c => ({
      ...c,
      activeProjectsCount: projectCountMap[c._id.toString()] || 0
    }));

    return NextResponse.json({
      success: true,
      data: enrichedClients,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'clients', 'create')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const organizationId = (user as any).organizationId;

    // Auto-generate clientNumber
    const lastClient = await Client.findOne({ organizationId }).sort({ createdAt: -1 });
    let nextNumber = 1;
    if (lastClient && lastClient.clientNumber) {
      const currentNumber = parseInt(lastClient.clientNumber.split('-')[1]);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }
    const clientNumber = `CLT-${nextNumber.toString().padStart(4, '0')}`;

    const clientData = {
      ...body,
      organizationId,
      clientNumber,
      createdBy: (user as any).id,
    };

    const client = await Client.create(clientData);

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
