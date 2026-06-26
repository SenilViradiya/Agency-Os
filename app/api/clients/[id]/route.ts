import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';
import Project from '@/models/Project';
import { hasPermission } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'clients', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const client = await Client.findOne({
      _id: id,
      organizationId: (user as any).organizationId,
    })
      .populate('assignedManager', 'name email avatar')
      .populate('assignedTeam', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Get all projects for this client
    const projects = await Project.find({ clientId: client._id })
      .select('projectNumber name type status priority completionPercentage deadline')
      .sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      data: { ...client.toObject(), projects } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'clients', 'update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const organizationId = (user as any).organizationId;

    const client = await Client.findOneAndUpdate(
      { _id: id, organizationId },
      body,
      { new: true }
    );

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'clients', 'delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const organizationId = (user as any).organizationId;

    // Block if client has active projects
    const activeProjects = await Project.countDocuments({ 
      clientId: id, 
      status: 'active' 
    });

    if (activeProjects > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete client with active projects' 
      }, { status: 400 });
    }

    const client = await Client.findOne({ _id: id, organizationId });
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Soft delete
    client.status = 'inactive';
    await client.save();

    return NextResponse.json({ success: true, message: 'Client mark as inactive' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
