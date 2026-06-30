import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import * as z from 'zod';

const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  category: z.enum([
    'equipment',
    'software_subscription',
    'travel',
    'shoot_location',
    'office_rent',
    'utilities',
    'marketing',
    'salary',
    'vendor_payment',
    'misc',
    'other',
  ]),
  amount: z.number().positive('Amount must be positive'),
  expenseDate: z.string().optional(),
  projectId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  paymentMode: z.enum(['bank_transfer', 'upi', 'cheque', 'cash', 'other']),
  receiptUrl: z.string().optional().or(z.literal('')),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(['monthly', 'quarterly', 'yearly']).nullable().optional(),
  notes: z.string().optional().or(z.literal('')),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(session.user, 'finance_expenses', 'read') &&
      !hasPermission(session.user, 'finance', 'read')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { searchParams } = new URL(req.url);

    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = { organizationId: orgId, isDeleted: { $ne: true } };
    if (category) query.category = category;
    if (status) query.status = status;
    if (projectId) query.projectId = projectId;
    if (clientId) query.clientId = clientId;

    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('projectId', 'name')
      .populate('clientId', 'businessName')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name')
      .populate('createdBy', 'name')
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Expense.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('[EXPENSES_GET] Error:', error);
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
      !hasPermission(session.user, 'finance_expenses', 'create') &&
      !hasPermission(session.user, 'finance', 'create')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const body = await req.json();

    const parsedData = createExpenseSchema.parse(body);

    // Auto-generate expenseNumber
    const lastExpense = await Expense.findOne({ organizationId: orgId })
      .sort({ expenseNumber: -1 })
      .select('expenseNumber')
      .lean();

    let nextNum = 1;
    if (lastExpense?.expenseNumber) {
      const match = lastExpense.expenseNumber.match(/EXP-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const expenseNumber = `EXP-${String(nextNum).padStart(4, '0')}`;
    const eDate = parsedData.expenseDate ? new Date(parsedData.expenseDate) : new Date();

    const expense = new Expense({
      ...parsedData,
      organizationId: orgId,
      expenseNumber,
      expenseDate: eDate,
      status: 'pending',
      createdBy: (session.user as any).id,
    });

    await expense.save();

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Expense created successfully',
    });
  } catch (error: any) {
    console.error('[EXPENSES_POST] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
