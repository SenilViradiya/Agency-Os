import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import * as z from 'zod';
import mongoose from 'mongoose';

const logPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().optional(),
  paymentMode: z.enum(['bank_transfer', 'upi', 'cheque', 'cash', 'other']),
  referenceNumber: z.string().optional().or(z.literal('')),
  bankName: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  attachmentUrl: z.string().optional().or(z.literal('')),
});

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);

    const clientId = searchParams.get('clientId');
    const invoiceId = searchParams.get('invoiceId');
    const paymentMode = searchParams.get('paymentMode');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = { organizationId: orgId };
    if (clientId) query.clientId = clientId;
    if (invoiceId) query.invoiceId = invoiceId;
    if (paymentMode) query.paymentMode = paymentMode;

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('invoiceId', 'invoiceNumber totalAmount')
      .populate('clientId', 'businessName')
      .populate('receivedBy', 'name')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Payment.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        total,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('[PAYMENTS_GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(session.user, 'finance_payments', 'create') &&
      !hasPermission(session.user, 'finance', 'create')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const body = await req.json();

    const parsedData = logPaymentSchema.parse(body);

    const invoice = await Invoice.findOne({ _id: parsedData.invoiceId, organizationId: orgId });
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (parsedData.amount > Number(invoice.amountDue.toFixed(2))) {
      return NextResponse.json(
        { success: false, error: `Payment amount (${parsedData.amount}) cannot exceed the due amount (₹${invoice.amountDue.toFixed(2)}).` },
        { status: 400 }
      );
    }

    // Auto-generate paymentNumber
    const lastPayment = await Payment.findOne({ organizationId: orgId })
      .sort({ paymentNumber: -1 })
      .select('paymentNumber')
      .lean();

    let nextNum = 1;
    if (lastPayment?.paymentNumber) {
      const match = lastPayment.paymentNumber.match(/PMT-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const paymentNumber = `PMT-${String(nextNum).padStart(4, '0')}`;

    // Create payment using Mongoose transaction or session updates
    const paymentDateObj = parsedData.paymentDate ? new Date(parsedData.paymentDate) : new Date();

    const payment = new Payment({
      organizationId: orgId,
      paymentNumber,
      invoiceId: invoice._id,
      clientId: invoice.clientId,
      amount: parsedData.amount,
      paymentDate: paymentDateObj,
      paymentMode: parsedData.paymentMode,
      referenceNumber: parsedData.referenceNumber,
      bankName: parsedData.bankName,
      notes: parsedData.notes,
      attachmentUrl: parsedData.attachmentUrl,
      receivedBy: (session.user as any).id,
    });

    await payment.save();

    // Update invoice calculations
    invoice.amountPaid = Number((invoice.amountPaid + parsedData.amount).toFixed(2));
    invoice.amountDue = Number((invoice.totalAmount - invoice.amountPaid).toFixed(2));

    if (invoice.amountDue <= 0) {
      invoice.status = 'paid';
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'partially_paid';
    }
    await invoice.save();

    // Update client totalRevenue
    await Client.updateOne(
      { _id: invoice.clientId, organizationId: orgId },
      { $inc: { totalRevenue: parsedData.amount } }
    );

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment logged successfully',
    });
  } catch (error: any) {
    console.error('[PAYMENTS_POST] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
