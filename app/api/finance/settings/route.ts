import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import FinanceSettings from '@/models/FinanceSettings';
import * as z from 'zod';

const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company Name is required'),
  companyAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('India'),
  }),
  companyEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  companyPhone: z.string().optional(),
  companyLogo: z.string().optional(),
  gstEnabled: z.boolean().default(false),
  gstNumber: z.string().optional(),
  gstType: z.enum(['regular', 'composition']).nullable().optional(),
  bankDetails: z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    bankName: z.string().optional(),
    branch: z.string().optional(),
  }),
  upiId: z.string().optional(),
  invoicePrefix: z.string().default('INV'),
  quotationPrefix: z.string().default('QUO'),
  invoiceTermsAndConditions: z.string().optional(),
  invoiceNotes: z.string().optional(),
  defaultPaymentDueDays: z.number().default(7),
  currency: z.string().default('INR'),
  currencySymbol: z.string().default('₹'),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;

    let settings = await FinanceSettings.findOne({ organizationId: orgId }).lean();
    if (!settings) {
      // Return default empty structure if none exists
      settings = {
        organizationId: orgId,
        companyName: 'My Marketing Agency',
        companyAddress: { country: 'India' },
        gstEnabled: false,
        bankDetails: {},
        invoicePrefix: 'INV',
        quotationPrefix: 'QUO',
        defaultPaymentDueDays: 7,
        currency: 'INR',
        currencySymbol: '₹',
      } as any;
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('[FINANCE_SETTINGS_GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: Super Admin only
    const isSuperAdmin = (session.user as any).role === 'Super Admin';
    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const body = await req.json();

    const parsedData = settingsSchema.parse(body);

    if (parsedData.gstEnabled && !parsedData.gstNumber) {
      return NextResponse.json(
        { success: false, error: 'GST Number is required when GST is enabled.' },
        { status: 400 }
      );
    }

    const updatedSettings = await FinanceSettings.findOneAndUpdate(
      { organizationId: orgId },
      {
        ...parsedData,
        updatedBy: (session.user as any).id,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Finance settings updated successfully',
    });
  } catch (error: any) {
    console.error('[FINANCE_SETTINGS_PUT] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
