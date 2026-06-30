import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Leave from '@/models/Leave';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import Notification from '@/models/Notification';
import * as z from 'zod';
import dayjs from 'dayjs';

const leaveActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewNotes: z.string().optional().default(''),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: Manager or Super Admin only
    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';
    if (!isManager) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const leave = await Leave.findOne({ organizationId: orgId, _id: id });
    if (!leave) {
      return NextResponse.json({ success: false, error: 'Leave request not found' }, { status: 404 });
    }

    if (leave.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'This leave request has already been processed.' }, { status: 400 });
    }

    const body = await req.json();
    const { action, reviewNotes } = leaveActionSchema.parse(body);

    const employee = await Employee.findOne({ organizationId: orgId, _id: leave.employeeId });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee profile not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Deduct from Employee.leaveBalance[leaveType]
      const type = leave.leaveType;
      
      if (type !== 'unpaid' && type !== 'other') {
        const balanceKey = type as keyof typeof employee.leaveBalance;
        const currentBalance = employee.leaveBalance[balanceKey] ?? 0;
        if (currentBalance < leave.totalDays) {
          return NextResponse.json({ success: false, error: 'Insufficient leave balance' }, { status: 400 });
        }
        // Deduct
        employee.leaveBalance[balanceKey] = Number((currentBalance - leave.totalDays).toFixed(2));
      } else if (type === 'unpaid') {
        // Increment unpaid count
        employee.leaveBalance.unpaid = Number(((employee.leaveBalance.unpaid ?? 0) + leave.totalDays).toFixed(2));
      }

      // Mark status as approved
      leave.status = 'approved';
      leave.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
      leave.reviewedAt = new Date();
      leave.reviewNotes = reviewNotes;
      leave.balanceDeducted = true;

      await leave.save();
      await employee.save();

      // Create Attendance records for each leave day (status: 'on_leave')
      let current = dayjs(leave.startDate).startOf('day');
      const last = dayjs(leave.endDate).startOf('day');
      let leaveDaysCount = 0;

      while (current.isBefore(last) || current.isSame(last)) {
        const dayOfWeek = current.day();
        if (dayOfWeek !== 0) { // Exclude Sunday
          const dateVal = current.toDate();
          const monthVal = current.format('YYYY-MM');

          // Check if attendance already exists
          const existingAttendance = await Attendance.findOne({
            organizationId: orgId,
            employeeId: leave.employeeId,
            date: dateVal,
          });

          // Create or update status to 'on_leave'
          await Attendance.findOneAndUpdate(
            { organizationId: orgId, employeeId: leave.employeeId, date: dateVal },
            {
              $set: {
                organizationId: orgId,
                employeeId: leave.employeeId,
                userId: leave.userId,
                date: dateVal,
                month: monthVal,
                status: 'on_leave',
                totalHours: 0,
                overtime: 0,
                notes: `Leave approved: ${leave.leaveNumber}. Reason: ${leave.reason}`,
                markedBy: session.user.id,
                isManualEntry: false,
              }
            },
            { upsert: true, new: true }
          );

          // Update metrics counts on Employee
          let workDayInc = 1;
          let leaveInc = 1;
          let presentDec = 0;
          let absentDec = 0;

          if (existingAttendance) {
            // Deduct old state counts
            workDayInc = 0; // Already counted as working day
            if (['present', 'work_from_home'].includes(existingAttendance.status)) {
              presentDec = -1;
            } else if (existingAttendance.status === 'absent') {
              absentDec = -1;
            } else if (existingAttendance.status === 'half_day') {
              presentDec = -0.5;
              absentDec = -0.5;
            } else if (existingAttendance.status === 'on_leave') {
              leaveInc = 0; // Already on leave
            }
          }

          if (workDayInc !== 0 || leaveInc !== 0 || presentDec !== 0 || absentDec !== 0) {
            await Employee.findByIdAndUpdate(leave.employeeId, {
              $inc: {
                totalWorkingDays: workDayInc,
                totalLeaveDays: leaveInc,
                totalPresentDays: presentDec,
                totalAbsentDays: absentDec,
              }
            });
          }
        }
        current = current.add(1, 'day');
      }

      // Notify employee
      await Notification.create({
        organizationId: orgId,
        recipientId: leave.userId,
        type: 'approval_requested', // Valid Enum mapping
        title: 'Leave Request Approved',
        message: `Your ${leave.leaveType} leave request (${leave.totalDays} days) has been approved.`,
        link: '/hr/leaves',
        entityType: 'Leave',
        entityId: leave._id,
        isRead: false,
      });

    } else if (action === 'reject') {
      leave.status = 'rejected';
      leave.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
      leave.reviewedAt = new Date();
      leave.reviewNotes = reviewNotes;

      await leave.save();

      // Notify employee
      await Notification.create({
        organizationId: orgId,
        recipientId: leave.userId,
        type: 'approval_requested', // Valid Enum mapping
        title: 'Leave Request Rejected',
        message: `Your leave request was rejected: ${reviewNotes}`,
        link: '/hr/leaves',
        entityType: 'Leave',
        entityId: leave._id,
        isRead: false,
      });
    }

    return NextResponse.json({
      success: true,
      data: leave,
      message: `Leave request has been successfully ${action}ed.`
    });

  } catch (error: any) {
    console.error('[LEAVE_ACTION_API] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
