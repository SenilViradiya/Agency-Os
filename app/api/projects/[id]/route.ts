import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { hasPermission } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const project = await Project.findOne({
      _id: params.id,
      organizationId: (user as any).organizationId,
    })
      .populate('clientId', 'businessName email phone contactPerson industry')
      .populate('projectManager', 'name email avatar')
      .populate('teamMembers', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'projects', 'update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const organizationId = (user as any).organizationId;

    const project = await Project.findOne({ _id: params.id, organizationId });
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Auto-recalculate completionPercentage
    if (typeof body.completedTasks === 'number' || typeof body.totalTasks === 'number') {
      const completed = typeof body.completedTasks === 'number' ? body.completedTasks : project.completedTasks;
      const total = typeof body.totalTasks === 'number' ? body.totalTasks : project.totalTasks;
      
      if (total > 0) {
        body.completionPercentage = Math.round((completed / total) * 100);
      } else {
        body.completionPercentage = 0;
      }
    }

    Object.assign(project, body);
    await project.save();

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'projects', 'delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const organizationId = (user as any).organizationId;

    const project = await Project.findOne({ _id: params.id, organizationId });
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Block if status = 'active'
    if (project.status === 'active') {
      return NextResponse.json({ success: false, error: 'Cannot delete an active project' }, { status: 400 });
    }

    // Soft delete / Cancel
    project.status = 'cancelled';
    await project.save();

    return NextResponse.json({ success: true, message: 'Project marked as cancelled' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
