import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import FinanceSettings from '@/models/FinanceSettings';
import * as z from 'zod';

const createInvoiceSchema = z.object({
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
});

export async function GET(req: NextRequest) {
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

    // LAZY OVERDUE STATUS UPDATE
    const now = new Date();
    await Invoice.updateMany(
      {
        organizationId: orgId,
        status: 'sent',
        dueDate: { $lt: now },
      },
      {
        $set: { status: 'overdue' },
      }
    );

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const projectId = searchParams.get('projectId');
    const invoiceType = searchParams.get('invoiceType');
    const billingPeriod = searchParams.get('billingPeriod');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = { organizationId: orgId };
    if (status) query.status = status;
    if (clientId) query.clientId = clientId;
    if (projectId) query.projectId = projectId;
    if (invoiceType) query.invoiceType = invoiceType;
    if (billingPeriod) query.billingPeriod = billingPeriod;
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('clientId', 'businessName email contactPerson phone address')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Invoice.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('[INVOICES_GET] Error:', error);
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
      !hasPermission(session.user, 'finance_invoices', 'create') &&
      !hasPermission(session.user, 'finance', 'create')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const body = await req.json();

    const parsedData = createInvoiceSchema.parse(body);

    // Fetch settings
    let settings = await FinanceSettings.findOne({ organizationId: orgId });
    if (!settings) {
      settings = new FinanceSettings({
        organizationId: orgId,
        companyName: 'My Marketing Agency',
        invoicePrefix: 'INV',
        defaultPaymentDueDays: 7,
      });
      await settings.save();
    }

    // Auto-generate invoiceNumber
    const lastInvoice = await Invoice.findOne({ organizationId: orgId })
      .sort({ invoiceNumber: -1 })
      .select('invoiceNumber')
      .lean();

    const prefix = settings.invoicePrefix || 'INV';
    let nextNum = 1;
    if (lastInvoice?.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(new RegExp(`${prefix}-(\\d+)`));
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      } else {
        const fallbackMatch = lastInvoice.invoiceNumber.match(/-(\d+)/);
        if (fallbackMatch) {
          nextNum = parseInt(fallbackMatch[1], 10) + 1;
        }
      }
    }
    const invoiceNumber = `${prefix}-${String(nextNum).padStart(4, '0')}`;

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

    const invDate = parsedData.invoiceDate ? new Date(parsedData.invoiceDate) : new Date();
    const dDate = parsedData.dueDate ? new Date(parsedData.dueDate) : new Date(invDate.getTime() + (settings.defaultPaymentDueDays || 7) * 24 * 60 * 60 * 1000);

    const invoice = new Invoice({
      ...parsedData,
      organizationId: orgId,
      invoiceNumber,
      lineItems,
      subtotal,
      discountAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      amountPaid: 0,
      amountDue: totalAmount,
      invoiceDate: invDate,
      dueDate: dDate,
      status: 'draft',
      notes: parsedData.notes || settings.invoiceNotes || '',
      termsAndConditions: parsedData.termsAndConditions || settings.invoiceTermsAndConditions || '',
      createdBy: (session.user as any).id,
    });

    await invoice.save();

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully',
    });
  } catch (error: any) {
    console.error('[INVOICES_POST] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
