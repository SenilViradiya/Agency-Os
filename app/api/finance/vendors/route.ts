import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Vendor from '@/models/Vendor';
import VendorBill from '@/models/VendorBill';
import * as z from 'zod';

const createVendorSchema = z.object({
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

    const vendorType = searchParams.get('vendorType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = { organizationId: orgId };
    if (vendorType) query.vendorType = vendorType;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { vendorNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const vendors = await Vendor.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Vendor.countDocuments(query);

    // Compute actual sums on the fly from VendorBill to return absolute correct values
    const vendorIds = vendors.map((v) => v._id);
    const billsAgg = await VendorBill.aggregate([
      { $match: { orgId, vendorId: { $in: vendorIds } } },
      {
        $group: {
          _id: '$vendorId',
          totalBilled: { $sum: '$amount' },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0],
            },
          },
          totalPending: {
            $sum: {
              $cond: [{ $ne: ['$status', 'paid'] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    const statsMap: Record<string, { totalBilled: number; totalPaid: number; totalPending: number }> = {};
    billsAgg.forEach((item) => {
      statsMap[item._id.toString()] = {
        totalBilled: item.totalBilled,
        totalPaid: item.totalPaid,
        totalPending: item.totalPending,
      };
    });

    const enrichedVendors = vendors.map((vendor) => {
      const stats = statsMap[vendor._id.toString()] || { totalBilled: 0, totalPaid: 0, totalPending: 0 };
      return {
        ...vendor,
        // Override with real-time aggregates or fallback to denormalized if aggregates empty
        totalBilled: stats.totalBilled || vendor.totalBilled || 0,
        totalPaid: stats.totalPaid || vendor.totalPaid || 0,
        totalPending: stats.totalPending || vendor.totalPending || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedVendors,
      pagination: {
        total,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('[VENDORS_GET] Error:', error);
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

    const parsedData = createVendorSchema.parse(body);

    // Auto-generate vendorNumber
    const lastVendor = await Vendor.findOne({ organizationId: orgId })
      .sort({ vendorNumber: -1 })
      .select('vendorNumber')
      .lean();

    let nextNum = 1;
    if (lastVendor?.vendorNumber) {
      const match = lastVendor.vendorNumber.match(/VEN-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const vendorNumber = `VEN-${String(nextNum).padStart(4, '0')}`;

    const vendor = new Vendor({
      ...parsedData,
      organizationId: orgId,
      vendorNumber,
      status: 'active',
      totalBilled: 0,
      totalPaid: 0,
      totalPending: 0,
      createdBy: (session.user as any).id,
    });

    await vendor.save();

    return NextResponse.json({
      success: true,
      data: vendor,
      message: 'Vendor added successfully',
    });
  } catch (error: any) {
    console.error('[VENDORS_POST] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
