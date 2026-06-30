import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Payment from '@/models/Payment';
import FinanceSettings from '@/models/FinanceSettings';
import * as z from 'zod';

const updateInvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  projectId: z.string().optional().nullable(),
  businessName: z.string().min(1, 'Business Name is required'),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('India'),
  }).optional(),
  contactPerson: z.string().min(1, 'Contact Person is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  invoiceType: z.enum(['retainer', 'project', 'milestone', 'custom']),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  billingPeriod: z.string().optional(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().default(1),
      unitPrice: z.number().nonnegative(),
    })
  ).min(1, 'At least one line item is required'),
  discountType: z.enum(['percentage', 'fixed']).nullable().optional(),
  discountValue: z.number().default(0),
  gstApplicable: z.boolean().default(false),
  gstRate: z.number().default(18),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  status: z.enum(['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled']).optional(),
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
      !hasPermission(session.user, 'finance_invoices', 'read') &&
      !hasPermission(session.user, 'finance', 'read')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const invoice = await Invoice.findOne({ _id: id, organizationId: orgId })
      .populate('clientId')
      .populate('projectId');

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    // Lazy overdue update for this single invoice
    const now = new Date();
    if (invoice.status === 'sent' && new Date(invoice.dueDate) < now) {
      invoice.status = 'overdue';
      await invoice.save();
    }

    // Fetch linked payments
    const payments = await Payment.find({ invoiceId: id, organizationId: orgId })
      .populate('receivedBy', 'name')
      .sort({ paymentDate: -1 });

    return NextResponse.json({
      success: true,
      data: {
        invoice,
        payments,
      },
    });
  } catch (error: any) {
    console.error('[INVOICE_GET_ID] Error:', error);
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
      !hasPermission(session.user, 'finance_invoices', 'update') &&
      !hasPermission(session.user, 'finance', 'update')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;
    const body = await req.json();

    const invoice = await Invoice.findOne({ _id: id, organizationId: orgId });
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (['paid', 'cancelled'].includes(invoice.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot edit an invoice that is ${invoice.status}.` },
        { status: 400 }
      );
    }

    const parsedData = updateInvoiceSchema.parse(body);

    // Fetch settings
    let settings = await FinanceSettings.findOne({ organizationId: orgId });
    if (!settings) {
      settings = new FinanceSettings({
        organizationId: orgId,
        companyName: 'My Marketing Agency',
      });
      await settings.save();
    }

    // Line items amounts calculation
    const lineItems = parsedData.lineItems.map((item) => {
      const amount = Number((item.quantity * item.unitPrice).toFixed(2));
      return {
        ...item,
        amount,
      };
    });

    const subtotal = Number(lineItems.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2));

    let discountAmount = 0;
    if (parsedData.discountType === 'percentage') {
      discountAmount = Number(((subtotal * parsedData.discountValue) / 100).toFixed(2));
    } else if (parsedData.discountType === 'fixed') {
      discountAmount = Number(parsedData.discountValue.toFixed(2));
    }

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    if (parsedData.gstApplicable && settings.gstEnabled) {
      const taxableAmount = Math.max(0, subtotal - discountAmount);
      const totalGst = Number(((taxableAmount * parsedData.gstRate) / 100).toFixed(2));
      cgstAmount = Number((totalGst / 2).toFixed(2));
      sgstAmount = Number((totalGst / 2).toFixed(2));
    }

    const totalAmount = Number((subtotal - discountAmount + cgstAmount + sgstAmount).toFixed(2));
    const amountDue = Number((totalAmount - invoice.amountPaid).toFixed(2));

    const invDate = parsedData.invoiceDate ? new Date(parsedData.invoiceDate) : invoice.invoiceDate;
    const dDate = parsedData.dueDate ? new Date(parsedData.dueDate) : invoice.dueDate;

    let finalStatus = parsedData.status || invoice.status;
    if (amountDue <= 0 && invoice.amountPaid > 0) {
      finalStatus = 'paid';
    } else if (invoice.amountPaid > 0 && amountDue > 0) {
      finalStatus = 'partially_paid';
    } else if (finalStatus === 'sent' && dDate < new Date()) {
      finalStatus = 'overdue';
    }

    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: id, organizationId: orgId },
      {
        ...parsedData,
        lineItems,
        subtotal,
        discountAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount,
        amountDue,
        status: finalStatus,
        invoiceDate: invDate,
        dueDate: dDate,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice updated successfully',
    });
  } catch (error: any) {
    console.error('[INVOICE_PUT] Error:', error);
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
      !hasPermission(session.user, 'finance_invoices', 'delete') &&
      !hasPermission(session.user, 'finance', 'delete')
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

    // Check if any payments are logged
    if (invoice.amountPaid > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete an invoice that has payments logged against it. Please delete the payments first.' },
        { status: 400 }
      );
    }

    // Soft delete pattern: status: cancelled
    invoice.status = 'cancelled';
    invoice.amountDue = 0;
    await invoice.save();

    return NextResponse.json({
      success: true,
      message: 'Invoice marked as cancelled successfully (soft-deleted).',
    });
  } catch (error: any) {
    console.error('[INVOICE_DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
