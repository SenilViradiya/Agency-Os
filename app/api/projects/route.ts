import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import Client from '@/models/Client';
import { hasPermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'projects', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const projectManager = searchParams.get('projectManager');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = { organizationId: (user as any).organizationId };

    if (clientId) query.clientId = clientId;
    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (projectManager) query.projectManager = projectManager;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { projectNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('clientId', 'businessName')
        .populate('projectManager', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: projects,
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
    if (!hasPermission(user, 'projects', 'create')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const organizationId = (user as any).organizationId;

    // Validate type-specific fields
    if (body.type === 'retainer') {
      if (!body.retainerMonth || !body.contentQuota) {
        return NextResponse.json({ 
          success: false, 
          error: 'Retainer month and content quota are required for retainer projects' 
        }, { status: 400 });
      }
    } else if (body.type === 'campaign') {
      if (!body.campaignObjective || !body.deadline) {
        return NextResponse.json({ 
          success: false, 
          error: 'Campaign objective and deadline are required for campaign projects' 
        }, { status: 400 });
      }
    }

    // Auto-generate projectNumber
    const lastProject = await Project.findOne({ organizationId }).sort({ createdAt: -1 });
    let nextNumber = 1;
    if (lastProject && lastProject.projectNumber) {
      const currentNumber = parseInt(lastProject.projectNumber.split('-')[1]);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }
    const projectNumber = `PRJ-${nextNumber.toString().padStart(4, '0')}`;

    const projectData: any = {
      ...body,
      organizationId,
      projectNumber,
      createdBy: user.id,
    };

    // Calculate completion percentage if tasks are provided
    if (typeof body.completedTasks === 'number' && typeof body.totalTasks === 'number' && body.totalTasks > 0) {
      projectData.completionPercentage = Math.round((body.completedTasks / body.totalTasks) * 100);
    }

    const project = await Project.create(projectData);

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
