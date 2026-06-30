import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import VendorBill from '@/models/VendorBill';
import Vendor from '@/models/Vendor';
import * as z from 'zod';

const createBillSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  billDate: z.string().optional(),
  dueDate: z.string(),
  projectId: z.string().optional().nullable(),
  contentItemId: z.string().optional().nullable(),
  attachmentUrl: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);

    const vendorId = searchParams.get('vendorId');
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = { organizationId: orgId };
    if (vendorId) query.vendorId = vendorId;
    if (status) query.status = status;
    if (projectId) query.projectId = projectId;

    const bills = await VendorBill.find(query)
      .populate('vendorId', 'name vendorType')
      .populate('projectId', 'name')
      .populate('contentItemId', 'title')
      .sort({ billDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await VendorBill.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: bills,
      pagination: {
        total,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('[VENDOR_BILLS_GET] Error:', error);
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
      !hasPermission(session.user, 'finance_vendors', 'create') &&
      !hasPermission(session.user, 'vendors', 'create') &&
      !hasPermission(session.user, 'finance', 'create')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const body = await req.json();

    const parsedData = createBillSchema.parse(body);

    const vendor = await Vendor.findOne({ _id: parsedData.vendorId, organizationId: orgId });
    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    // Auto-generate billNumber
    const lastBill = await VendorBill.findOne({ organizationId: orgId })
      .sort({ billNumber: -1 })
      .select('billNumber')
      .lean();

    let nextNum = 1;
    if (lastBill?.billNumber) {
      const match = lastBill.billNumber.match(/VBL-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const billNumber = `VBL-${String(nextNum).padStart(4, '0')}`;

    const bDate = parsedData.billDate ? new Date(parsedData.billDate) : new Date();
    const dDate = new Date(parsedData.dueDate);

    const bill = new VendorBill({
      ...parsedData,
      organizationId: orgId,
      billNumber,
      vendorName: vendor.name,
      billDate: bDate,
      dueDate: dDate,
      status: 'pending',
      createdBy: (session.user as any).id,
    });

    await bill.save();

    // Increment vendor totals
    await Vendor.updateOne(
      { _id: parsedData.vendorId, organizationId: orgId },
      { $inc: { totalBilled: parsedData.amount, totalPending: parsedData.amount } }
    );

    return NextResponse.json({
      success: true,
      data: bill,
      message: 'Vendor bill logged successfully',
    });
  } catch (error: any) {
    console.error('[VENDOR_BILLS_POST] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
