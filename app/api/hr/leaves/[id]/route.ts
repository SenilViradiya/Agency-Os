import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Leave from '@/models/Leave';
import Employee from '@/models/Employee';
import * as z from 'zod';
import dayjs from 'dayjs';

const leaveUpdateSchema = z.object({
  leaveType: z.enum(['annual', 'sick', 'casual', 'unpaid', 'other']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(1, 'Reason is required'),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(['morning', 'afternoon']).optional().nullable(),
  supportingDocument: z.string().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_leaves', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const leave = await Leave.findOne({ organizationId: orgId, _id: id })
      .populate('employeeId', 'fullName avatar department employeeNumber')
      .populate('reviewedBy', 'name');

    if (!leave) {
      return NextResponse.json({ success: false, error: 'Leave request not found' }, { status: 404 });
    }

    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';
    const isSelf = leave.userId.toString() === session.user.id;

    if (!isManager && !isSelf) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: leave });

  } catch (error: any) {
    console.error('[LEAVE_ID_GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const leave = await Leave.findOne({ organizationId: orgId, _id: id });
    if (!leave) {
      return NextResponse.json({ success: false, error: 'Leave request not found' }, { status: 404 });
    }

    // Allow edit only if status = 'pending' AND by the same employee
    if (leave.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Only pending leave requests can be edited.' }, { status: 400 });
    }

    if (leave.userId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'You can only edit your own leave requests.' }, { status: 403 });
    }

    const body = await req.json();
    const parsedData = leaveUpdateSchema.parse(body);

    const start = dayjs(parsedData.startDate).startOf('day').toDate();
    const end = dayjs(parsedData.endDate).startOf('day').toDate();

    if (start.getTime() > end.getTime()) {
      return NextResponse.json({ success: false, error: 'End date must be on or after start date.' }, { status: 400 });
    }

    // Compute working days count
    let totalDays = 0;
    if (parsedData.isHalfDay) {
      totalDays = 0.5;
    } else {
      let current = dayjs(start).startOf('day');
      const last = dayjs(end).startOf('day');
      while (current.isBefore(last) || current.isSame(last)) {
        const dayOfWeek = current.day();
        if (dayOfWeek === 0) {
          // Sunday
        } else if (dayOfWeek === 6) {
          totalDays += 0.5;
        } else {
          totalDays += 1;
        }
        current = current.add(1, 'day');
      }
    }

    // Validate balance
    if (parsedData.leaveType !== 'unpaid') {
      const employee = await Employee.findById(leave.employeeId);
      if (employee) {
        const type = parsedData.leaveType as keyof typeof employee.leaveBalance;
        const remainingBalance = employee.leaveBalance[type] ?? 0;
        if (remainingBalance < totalDays) {
          return NextResponse.json({
            success: false,
            error: `Insufficient leave balance. You requested ${totalDays} days but only have ${remainingBalance} ${parsedData.leaveType} leave days remaining.`
          }, { status: 400 });
        }
      }
    }

    // Update fields
    leave.leaveType = parsedData.leaveType;
    leave.startDate = start;
    leave.endDate = end;
    leave.totalDays = totalDays;
    leave.isHalfDay = parsedData.isHalfDay;
    leave.halfDayPeriod = parsedData.isHalfDay ? parsedData.halfDayPeriod : null;
    leave.reason = parsedData.reason;
    leave.supportingDocument = parsedData.supportingDocument || undefined;

    await leave.save();

    return NextResponse.json({
      success: true,
      data: leave,
      message: 'Leave request updated successfully',
    });

  } catch (error: any) {
    console.error('[LEAVE_ID_PUT] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
