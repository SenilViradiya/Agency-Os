import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import * as z from 'zod';

const updateExpenseSchema = z.object({
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
      !hasPermission(session.user, 'finance_expenses', 'read') &&
      !hasPermission(session.user, 'finance', 'read')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const expense = await Expense.findOne({ _id: id, organizationId: orgId, isDeleted: { $ne: true } })
      .populate('projectId', 'name')
      .populate('clientId', 'businessName')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name')
      .populate('createdBy', 'name');

    if (!expense) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: expense });
  } catch (error: any) {
    console.error('[EXPENSE_GET_ID] Error:', error);
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
      !hasPermission(session.user, 'finance_expenses', 'update') &&
      !hasPermission(session.user, 'finance', 'update')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;
    const body = await req.json();

    const expense = await Expense.findOne({ _id: id, organizationId: orgId, isDeleted: { $ne: true } });
    if (!expense) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    // Special status change actions
    if (body.action === 'approve') {
      // Check manager permission
      const isManager =
        (session.user as any).role === 'Super Admin' ||
        (session.user as any).role === 'Manager' ||
        (session.user as any).role === 'Admin';
      if (!isManager) {
        return NextResponse.json({ success: false, error: 'Only managers can approve expenses' }, { status: 403 });
      }
      expense.status = 'approved';
      expense.approvedBy = (session.user as any).id;
      expense.approvedAt = new Date();
      await expense.save();
      return NextResponse.json({ success: true, data: expense, message: 'Expense approved successfully' });
    }

    if (body.action === 'mark_paid') {
      expense.status = 'paid';
      expense.paidBy = (session.user as any).id;
      await expense.save();
      return NextResponse.json({ success: true, data: expense, message: 'Expense marked as paid successfully' });
    }

    // Check if status is paid, block edits
    if (expense.status === 'paid') {
      return NextResponse.json({ success: false, error: 'Cannot edit a paid expense' }, { status: 400 });
    }

    const parsedData = updateExpenseSchema.parse(body);

    const expenseDateObj = parsedData.expenseDate ? new Date(parsedData.expenseDate) : expense.expenseDate;

    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, organizationId: orgId },
      {
        ...parsedData,
        expenseDate: expenseDateObj,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedExpense,
      message: 'Expense updated successfully',
    });
  } catch (error: any) {
    console.error('[EXPENSE_PUT] Error:', error);
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
      !hasPermission(session.user, 'finance_expenses', 'delete') &&
      !hasPermission(session.user, 'finance', 'delete')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const expense = await Expense.findOne({ _id: id, organizationId: orgId });
    if (!expense) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    if (expense.status === 'paid') {
      return NextResponse.json({ success: false, error: 'Cannot delete/soft-delete a paid expense' }, { status: 400 });
    }

    // Soft delete
    expense.isDeleted = true;
    await expense.save();

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error: any) {
    console.error('[EXPENSE_DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
