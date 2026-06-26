import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Client from '@/models/Client';
import { hasPermission } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const lead = await Lead.findOne({ _id: params.id, organizationId });
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    if (lead.convertedToClient) {
      return NextResponse.json({ success: false, error: 'Lead is already converted' }, { status: 400 });
    }

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

    // Create Client
    const client = await Client.create({
      organizationId,
      clientNumber,
      businessName: lead.businessName,
      contactPerson: lead.name,
      email: lead.email,
      phone: lead.phone,
      whatsappNumber: lead.whatsappNumber,
      industry: lead.industry,
      services: lead.services,
      monthlyRetainerValue: body.monthlyRetainerValue || lead.budget,
      tier: body.tier || 'standard',
      contractStartDate: body.contractStartDate,
      contractEndDate: body.contractEndDate,
      assignedManager: body.assignedManager || lead.assignedTo,
      assignedTeam: body.assignedTeam || [],
      sourceLeadId: lead._id,
      createdBy: (user as any).id,
    });

    // Update Lead
    lead.convertedToClient = true;
    lead.convertedClientId = client._id as any;
    lead.status = 'won';
    lead.convertedAt = new Date();
    lead.timeline.push({
      action: 'Lead converted to Client',
      performedBy: (user as any).id,
      createdAt: new Date(),
    } as any);

    await lead.save();

    return NextResponse.json({ 
      success: true, 
      data: { client, lead } 
    });
  } catch (error: any) {
    console.error('Lead Convert Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
