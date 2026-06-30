import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Quotation from '@/models/Quotation';
import FinanceSettings from '@/models/FinanceSettings';
import * as z from 'zod';

const createQuotationSchema = z.object({
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
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
});

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const leadId = searchParams.get('leadId');
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = { organizationId: orgId, isDeleted: { $ne: true } };
    if (status) query.status = status;
    if (leadId) query.leadId = leadId;
    if (clientId) query.clientId = clientId;
    if (search) {
      query.$or = [
        { quotationNumber: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }

    const quotations = await Quotation.find(query)
      .populate('leadId', 'businessName contactPerson email phone')
      .populate('clientId', 'businessName contactPerson email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Quotation.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: quotations,
      pagination: {
        total,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('[QUOTATIONS_GET] Error:', error);
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
      !hasPermission(session.user, 'finance_quotations', 'create') &&
      !hasPermission(session.user, 'finance', 'create')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const body = await req.json();

    const parsedData = createQuotationSchema.parse(body);

    // Fetch settings
    let settings = await FinanceSettings.findOne({ organizationId: orgId });
    if (!settings) {
      settings = new FinanceSettings({
        organizationId: orgId,
        companyName: 'My Marketing Agency',
        quotationPrefix: 'QUO',
        invoicePrefix: 'INV',
        defaultPaymentDueDays: 7,
      });
      await settings.save();
    }

    // Auto-generate quotationNumber
    const lastQuotation = await Quotation.findOne({ organizationId: orgId })
      .sort({ quotationNumber: -1 })
      .select('quotationNumber')
      .lean();

    const prefix = settings.quotationPrefix || 'QUO';
    let nextNum = 1;
    if (lastQuotation?.quotationNumber) {
      const match = lastQuotation.quotationNumber.match(new RegExp(`${prefix}-(\\d+)`));
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      } else {
        // fallback match of any digits
        const fallbackMatch = lastQuotation.quotationNumber.match(/-(\d+)/);
        if (fallbackMatch) {
          nextNum = parseInt(fallbackMatch[1], 10) + 1;
        }
      }
    }
    const quotationNumber = `${prefix}-${String(nextNum).padStart(4, '0')}`;

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

    const totalAmount = Number((subtotal - discountAmount + cgstAmount + sgstAmount + igstAmount).toFixed(2));

    const qDate = parsedData.quotationDate ? new Date(parsedData.quotationDate) : new Date();
    const vUntil = parsedData.validUntil ? new Date(parsedData.validUntil) : new Date(qDate.getTime() + 15 * 24 * 60 * 60 * 1000);

    const quotation = new Quotation({
      ...parsedData,
      organizationId: orgId,
      quotationNumber,
      lineItems,
      subtotal,
      discountAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      quotationDate: qDate,
      validUntil: vUntil,
      createdBy: (session.user as any).id,
      status: 'draft',
    });

    await quotation.save();

    return NextResponse.json({
      success: true,
      data: quotation,
      message: 'Quotation created successfully',
    });
  } catch (error: any) {
    console.error('[QUOTATIONS_POST] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
