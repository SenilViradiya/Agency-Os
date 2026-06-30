import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import Notification from '@/models/Notification';
import * as z from 'zod';

const payrollUpdateSchema = z.object({
  variablePay: z.number().optional(),
  variableReason: z.string().optional(),
  otherDeductions: z.number().optional(),
  deductionReason: z.string().optional(),
  paymentNotes: z.string().optional(),
  action: z.enum(['approve', 'mark_paid']).optional(),
  transactionId: z.string().optional(),
  paymentMode: z.string().optional(),
  paidAt: z.string().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const payroll = await Payroll.findOne({ organizationId: orgId, _id: id })
      .populate('employeeId', 'fullName department designation employeeNumber joiningDate salaryStructure')
      .populate('paidBy', 'name')
      .populate('generatedBy', 'name');

    if (!payroll) {
      return NextResponse.json({ success: false, error: 'Payroll record not found' }, { status: 404 });
    }

    // Role check: Admin/Manager can read all, normal employee can only read their own payslip
    const employeeNode = payroll.employeeId as any;
    const selfEmployee = await Employee.findOne({ organizationId: orgId, userId: session.user.id });
    const isSelf = employeeNode?.userId?.toString() === session.user.id || 
                   (selfEmployee ? selfEmployee._id.toString() === payroll.employeeId.toString() : false);

    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';
    if (!isManager && !isSelf) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: payroll });

  } catch (error: any) {
    console.error('[PAYROLL_ID_GET_API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_payroll', 'update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const payroll = await Payroll.findOne({ organizationId: orgId, _id: id });
    if (!payroll) {
      return NextResponse.json({ success: false, error: 'Payroll record not found' }, { status: 404 });
    }

    // Rule: Payroll is immutable once status = 'paid' — block all edits!
    if (payroll.status === 'paid') {
      return NextResponse.json({ success: false, error: 'Paid payroll records are immutable and cannot be updated.' }, { status: 400 });
    }

    const body = await req.json();
    const parsedData = payrollUpdateSchema.parse(body);

    if (parsedData.action === 'approve') {
      payroll.status = 'approved';
      await payroll.save();
      return NextResponse.json({ success: true, data: payroll, message: 'Payroll approved successfully' });
    }

    if (parsedData.action === 'mark_paid') {
      if (payroll.status !== 'approved') {
        return NextResponse.json({ success: false, error: 'Only approved payroll drafts can be marked as paid.' }, { status: 400 });
      }

      if (!parsedData.transactionId) {
        return NextResponse.json({ success: false, error: 'Transaction ID is required when marking as paid.' }, { status: 400 });
      }

      payroll.status = 'paid';
      payroll.paidAt = parsedData.paidAt ? new Date(parsedData.paidAt) : new Date();
      payroll.transactionId = parsedData.transactionId;
      payroll.paymentMode = parsedData.paymentMode || 'bank_transfer';
      payroll.paidBy = new mongoose.Types.ObjectId(session.user.id);
      if (parsedData.paymentNotes) payroll.paymentNotes = parsedData.paymentNotes;

      await payroll.save();

      // Find the employee user Id to notify them
      const employee = await Employee.findById(payroll.employeeId);
      if (employee) {
        // Notify employee
        await Notification.create({
          organizationId: orgId,
          recipientId: employee.userId,
          type: 'approval_requested', // Valid Enum fallback mapping
          title: 'Salary Credited',
          message: `Your salary for ${payroll.monthName} has been credited ₹${payroll.netSalary.toLocaleString('en-IN')}`,
          link: `/hr/employees/${employee._id}`,
          entityType: 'Payroll',
          entityId: payroll._id,
          isRead: false,
        });
      }

      return NextResponse.json({ success: true, data: payroll, message: 'Payroll marked as paid' });
    }

    // Normal Update: allow edit variablePay, otherDeductions, reasons, notes before approval
    if (payroll.status !== 'draft') {
      return NextResponse.json({ success: false, error: 'Only draft payrolls can have their amounts modified.' }, { status: 400 });
    }

    if (parsedData.variablePay !== undefined) {
      payroll.variablePay = parsedData.variablePay;
    }
    if (parsedData.variableReason !== undefined) {
      payroll.variableReason = parsedData.variableReason;
    }
    if (parsedData.otherDeductions !== undefined) {
      payroll.otherDeductions = parsedData.otherDeductions;
    }
    if (parsedData.deductionReason !== undefined) {
      payroll.deductionReason = parsedData.deductionReason;
    }
    if (parsedData.paymentNotes !== undefined) {
      payroll.paymentNotes = parsedData.paymentNotes;
    }

    // Recompute gross, total deductions, and net salary
    const basicSalary = payroll.basicSalary || 0;
    const hra = payroll.hra || 0;
    const allowances = payroll.allowances || 0;
    const overtimePay = payroll.overtimePay || 0;
    const absentDeduction = payroll.absentDeduction || 0;
    const leaveDeduction = payroll.leaveDeduction || 0;

    const grossSalary = basicSalary + hra + allowances + overtimePay + payroll.variablePay;
    const totalDeductions = absentDeduction + leaveDeduction + payroll.otherDeductions;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    payroll.grossSalary = Math.round(grossSalary * 100) / 100;
    payroll.totalDeductions = Math.round(totalDeductions * 100) / 100;
    payroll.netSalary = Math.round(netSalary * 100) / 100;

    await payroll.save();

    return NextResponse.json({
      success: true,
      data: payroll,
      message: 'Payroll details updated and recomputed successfully'
    });

  } catch (error: any) {
    console.error('[PAYROLL_ID_PUT_API] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
