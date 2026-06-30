import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Vendor from '@/models/Vendor';
import VendorBill from '@/models/VendorBill';
import * as z from 'zod';

const updateVendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  vendorType: z.enum([
    'freelance_editor',
    'freelance_shooter',
    'freelance_designer',
    'freelance_writer',
    'studio',
    'agency',
    'other',
  ]),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  whatsappNumber: z.string().optional().or(z.literal('')),
  paymentMode: z.enum(['bank_transfer', 'upi', 'cheque', 'cash']),
  bankDetails: z.object({
    accountName: z.string().optional().or(z.literal('')),
    accountNumber: z.string().optional().or(z.literal('')),
    ifscCode: z.string().optional().or(z.literal('')),
    bankName: z.string().optional().or(z.literal('')),
  }),
  upiId: z.string().optional().or(z.literal('')),
  defaultRateType: z.enum(['per_project', 'per_day', 'per_hour', 'fixed_monthly']),
  defaultRate: z.number().nonnegative().default(0),
  skills: z.array(z.string()).optional(),
  rating: z.number().min(1).max(5).default(5),
  notes: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional(),
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
      !hasPermission(session.user, 'finance_vendors', 'read') &&
      !hasPermission(session.user, 'vendors', 'read') &&
      !hasPermission(session.user, 'finance', 'read')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const vendor = await Vendor.findOne({ _id: id, organizationId: orgId });
    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    // Fetch vendor bills
    const bills = await VendorBill.find({ vendorId: id, organizationId: orgId })
      .populate('projectId', 'name')
      .populate('contentItemId', 'title')
      .populate('paidBy', 'name')
      .sort({ billDate: -1 });

    // Compute stats
    const totalBilled = bills.reduce((acc, b) => acc + b.amount, 0);
    const totalPaid = bills.filter((b) => b.status === 'paid').reduce((acc, b) => acc + b.amount, 0);
    const totalPending = bills.filter((b) => b.status !== 'paid').reduce((acc, b) => acc + b.amount, 0);

    return NextResponse.json({
      success: true,
      data: {
        vendor,
        bills,
        stats: {
          totalBilled,
          totalPaid,
          totalPending,
        },
      },
    });
  } catch (error: any) {
    console.error('[VENDOR_GET_ID] Error:', error);
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
      !hasPermission(session.user, 'finance_vendors', 'update') &&
      !hasPermission(session.user, 'vendors', 'update') &&
      !hasPermission(session.user, 'finance', 'update')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;
    const body = await req.json();

    const parsedData = updateVendorSchema.parse(body);

    const updatedVendor = await Vendor.findOneAndUpdate(
      { _id: id, organizationId: orgId },
      parsedData,
      { new: true }
    );

    if (!updatedVendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedVendor,
      message: 'Vendor details updated successfully',
    });
  } catch (error: any) {
    console.error('[VENDOR_PUT] Error:', error);
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
      !hasPermission(session.user, 'finance_vendors', 'delete') &&
      !hasPermission(session.user, 'vendors', 'delete') &&
      !hasPermission(session.user, 'finance', 'delete')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const vendor = await Vendor.findOne({ _id: id, organizationId: orgId });
    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    // Check if pending bills exist
    const pendingBill = await VendorBill.findOne({
      vendorId: id,
      organizationId: orgId,
      status: { $ne: 'paid' },
    });

    if (pendingBill) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete/deactivate vendor with pending unpaid bills.' },
        { status: 400 }
      );
    }

    // Soft delete: set status to inactive
    vendor.status = 'inactive';
    await vendor.save();

    return NextResponse.json({
      success: true,
      message: 'Vendor has been marked as inactive (soft-deleted).',
    });
  } catch (error: any) {
    console.error('[VENDOR_DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
