import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import Notification from '@/models/Notification';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(session.user, 'finance_invoices', 'update') &&
      !hasPermission(session.user, 'finance', 'update')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const invoice = await Invoice.findOne({ _id: id, organizationId: orgId });
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    invoice.status = 'sent';
    invoice.sentAt = new Date();
    await invoice.save();

    // Notify the client's assigned manager if there is one
    const client = await Client.findOne({ _id: invoice.clientId, organizationId: orgId });
    if (client && client.assignedManager) {
      const notification = new Notification({
        organizationId: orgId,
        recipientId: client.assignedManager,
        type: 'approval_requested', // standard type from notification enum
        title: 'Invoice Sent',
        message: `Invoice ${invoice.invoiceNumber} has been marked as sent to ${invoice.businessName}.`,
        link: `/finance/invoices/${invoice._id}`,
        entityType: 'invoice',
        entityId: invoice._id,
        isRead: false,
      });
      await notification.save();
    }

    return NextResponse.json({
      success: true,
      data: invoice,
      message: `Invoice ${invoice.invoiceNumber} marked as sent.`,
    });
  } catch (error: any) {
    console.error('[INVOICE_SEND] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
