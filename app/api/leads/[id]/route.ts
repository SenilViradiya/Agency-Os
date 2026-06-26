import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
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
    if (!hasPermission(user, 'leads', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const lead = await Lead.findOne({
      _id: id,
      organizationId: (user as any).organizationId,
    })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('timeline.performedBy', 'name');

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: lead });
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
    if (!hasPermission(user, 'leads', 'update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const organizationId = (user as any).organizationId;

    const lead = await Lead.findOne({ _id: id, organizationId });
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Handle timeline for status changes
    if (body.status && body.status !== lead.status) {
      lead.timeline.push({
        action: `Status changed to ${body.status}`,
        note: body.statusNote || 'Status updated',
        performedBy: (user as any).id,
        createdAt: new Date(),
      } as any);
      
      // Mirror status to stage for kanban
      lead.stage = body.status;
    }

    // Check for won status to prompt conversion
    let needsConversion = false;
    if (body.status === 'won' && !lead.convertedToClient) {
      needsConversion = true;
    }

    // Check for lost status to require lost reason
    if (body.status === 'lost' && !body.lostReason) {
      return NextResponse.json({ success: false, error: 'Lost reason is required' }, { status: 400 });
    }

    Object.assign(lead, body);
    await lead.save();

    return NextResponse.json({ 
      success: true, 
      data: lead,
      needsConversion
    });
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
    if (!hasPermission(user, 'leads', 'delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const organizationId = (user as any).organizationId;

    const lead = await Lead.findOne({ _id: id, organizationId });
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    if (lead.convertedToClient) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete a lead that has been converted to a client' 
      }, { status: 400 });
    }

    await Lead.deleteOne({ _id: id });

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
