import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import * as z from 'zod';

const updatePaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().optional(),
  paymentMode: z.enum(['bank_transfer', 'upi', 'cheque', 'cash', 'other']),
  referenceNumber: z.string().optional().or(z.literal('')),
  bankName: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  attachmentUrl: z.string().optional().or(z.literal('')),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(session.user, 'finance_payments', 'read') &&
      !hasPermission(session.user, 'finance', 'read')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const payment = await Payment.findOne({ _id: id, organizationId: orgId })
      .populate('invoiceId')
      .populate('clientId')
      .populate('receivedBy', 'name');

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error: any) {
    console.error('[PAYMENT_GET_ID] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(session.user, 'finance_payments', 'update') &&
      !hasPermission(session.user, 'finance', 'update')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;
    const body = await req.json();

    const payment = await Payment.findOne({ _id: id, organizationId: orgId });
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    const parsedData = updatePaymentSchema.parse(body);

    const invoice = await Invoice.findOne({ _id: payment.invoiceId, organizationId: orgId });
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Linked invoice not found' }, { status: 404 });
    }

    const amountDiff = parsedData.amount - payment.amount;

    // Check if new amount exceeds allowed range
    const maxAllowed = Number((invoice.amountDue + payment.amount).toFixed(2));
    if (parsedData.amount > maxAllowed) {
      return NextResponse.json(
        { success: false, error: `Updated payment amount (${parsedData.amount}) cannot exceed the allowed limit (₹${maxAllowed.toFixed(2)}).` },
        { status: 400 }
      );
    }

    // Update payment record fields
    payment.amount = parsedData.amount;
    payment.paymentDate = parsedData.paymentDate ? new Date(parsedData.paymentDate) : payment.paymentDate;
    payment.paymentMode = parsedData.paymentMode;
    payment.referenceNumber = parsedData.referenceNumber;
    payment.bankName = parsedData.bankName;
    payment.notes = parsedData.notes;
    payment.attachmentUrl = parsedData.attachmentUrl;
    await payment.save();

    // Adjust Invoice
    invoice.amountPaid = Number((invoice.amountPaid + amountDiff).toFixed(2));
    invoice.amountDue = Number((invoice.totalAmount - invoice.amountPaid).toFixed(2));

    if (invoice.amountDue <= 0) {
      invoice.status = 'paid';
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'partially_paid';
    } else {
      // payment.amount = 0 or similar (already handled positive constraint in z.object)
      invoice.status = 'sent';
    }
    await invoice.save();

    // Adjust Client
    await Client.updateOne(
      { _id: invoice.clientId, organizationId: orgId },
      { $inc: { totalRevenue: amountDiff } }
    );

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment updated successfully',
    });
  } catch (error: any) {
    console.error('[PAYMENT_PUT_ID] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(session.user, 'finance_payments', 'delete') &&
      !hasPermission(session.user, 'finance', 'delete')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const payment = await Payment.findOne({ _id: id, organizationId: orgId });
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    const invoice = await Invoice.findOne({ _id: payment.invoiceId, organizationId: orgId });
    if (invoice) {
      // Reverse invoice calculations
      invoice.amountPaid = Number(Math.max(0, invoice.amountPaid - payment.amount).toFixed(2));
      invoice.amountDue = Number((invoice.totalAmount - invoice.amountPaid).toFixed(2));

      if (invoice.amountPaid === 0) {
        // Fall back to sent or overdue
        if (new Date(invoice.dueDate) < new Date()) {
          invoice.status = 'overdue';
        } else {
          invoice.status = 'sent';
        }
      } else {
        invoice.status = 'partially_paid';
      }
      await invoice.save();

      // Reverse Client revenue count
      await Client.updateOne(
        { _id: invoice.clientId, organizationId: orgId },
        { $inc: { totalRevenue: -payment.amount } }
      );
    }

    await Payment.deleteOne({ _id: id });

    return NextResponse.json({
      success: true,
      message: 'Payment deleted and invoice balances reverted successfully',
    });
  } catch (error: any) {
    console.error('[PAYMENT_DELETE_ID] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
