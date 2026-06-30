import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Quotation from '@/models/Quotation';
import FinanceSettings from '@/models/FinanceSettings';
import * as z from 'zod';

const updateQuotationSchema = z.object({
  leadId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  businessName: z.string().min(1, 'Business Name is required'),
  contactPerson: z.string().min(1, 'Contact Person is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  quotationDate: z.string().optional(),
  validUntil: z.string().optional(),
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
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']).optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
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
      !hasPermission(session.user, 'finance_quotations', 'read') &&
      !hasPermission(session.user, 'finance', 'read')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const quotation = await Quotation.findOne({ _id: id, organizationId: orgId, isDeleted: { $ne: true } })
      .populate('leadId')
      .populate('clientId')
      .populate('convertedToInvoiceId');

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: quotation });
  } catch (error: any) {
    console.error('[QUOTATION_GET_ID] Error:', error);
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
      !hasPermission(session.user, 'finance_quotations', 'update') &&
      !hasPermission(session.user, 'finance', 'update')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;
    const body = await req.json();

    const quotation = await Quotation.findOne({ _id: id, organizationId: orgId, isDeleted: { $ne: true } });
    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
    }

    if (quotation.status === 'converted') {
      return NextResponse.json(
        { success: false, error: 'Cannot edit a quotation that has already been converted to an invoice.' },
        { status: 400 }
      );
    }

    const parsedData = updateQuotationSchema.parse(body);

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

    const qDate = parsedData.quotationDate ? new Date(parsedData.quotationDate) : quotation.quotationDate;
    const vUntil = parsedData.validUntil ? new Date(parsedData.validUntil) : quotation.validUntil;

    // Build update object
    const updateObj: any = {
      ...parsedData,
      lineItems,
      subtotal,
      discountAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      quotationDate: qDate,
      validUntil: vUntil,
    };

    if (parsedData.status && parsedData.status !== quotation.status) {
      updateObj.status = parsedData.status;
      if (parsedData.status === 'sent') {
        updateObj.sentAt = new Date();
      } else if (['accepted', 'rejected'].includes(parsedData.status)) {
        updateObj.respondedAt = new Date();
      }
    }

    const updatedQuotation = await Quotation.findOneAndUpdate(
      { _id: id, organizationId: orgId },
      updateObj,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedQuotation,
      message: 'Quotation updated successfully',
    });
  } catch (error: any) {
    console.error('[QUOTATION_PUT] Error:', error);
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
      !hasPermission(session.user, 'finance_quotations', 'delete') &&
      !hasPermission(session.user, 'finance', 'delete')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const quotation = await Quotation.findOne({ _id: id, organizationId: orgId });
    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
    }

    if (quotation.status === 'converted') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a quotation that has already been converted to an invoice.' },
        { status: 400 }
      );
    }

    // Soft delete
    quotation.isDeleted = true;
    await quotation.save();

    return NextResponse.json({
      success: true,
      message: 'Quotation deleted successfully',
    });
  } catch (error: any) {
    console.error('[QUOTATION_DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
