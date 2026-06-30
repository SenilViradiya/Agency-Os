import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import * as z from 'zod';
import dayjs from 'dayjs';

const attendanceUpdateSchema = z.object({
  status: z.enum(['present', 'absent', 'half_day', 'on_leave', 'holiday', 'work_from_home']),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_attendance', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const record = await Attendance.findOne({ organizationId: orgId, _id: id })
      .populate('employeeId', 'fullName department designation');

    if (!record) {
      return NextResponse.json({ success: false, error: 'Attendance record not found' }, { status: 404 });
    }

    // Role check: employees can only fetch their own attendance
    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';
    if (!isManager) {
      const selfEmployee = await Employee.findOne({ organizationId: orgId, userId: session.user.id });
      if (!selfEmployee || selfEmployee._id.toString() !== record.employeeId.toString()) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, data: record });

  } catch (error: any) {
    console.error('[ATTENDANCE_ID_GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_attendance', 'update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const record = await Attendance.findOne({ organizationId: orgId, _id: id });
    if (!record) {
      return NextResponse.json({ success: false, error: 'Attendance record not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsedData = attendanceUpdateSchema.parse(body);

    const oldStatus = record.status;
    const newStatus = parsedData.status;

    // Recompute totalHours and overtime
    let checkInVal: Date | undefined;
    let checkOutVal: Date | undefined;
    let totalHours = 0;
    let overtime = 0;

    if (parsedData.checkIn && parsedData.checkOut) {
      checkInVal = new Date(parsedData.checkIn);
      checkOutVal = new Date(parsedData.checkOut);
      const diffMs = checkOutVal.getTime() - checkInVal.getTime();
      if (diffMs > 0) {
        totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        overtime = Math.max(0, Math.round((totalHours - 8) * 100) / 100);
      }
    }

    // Apply fields to record
    record.status = parsedData.status;
    record.checkIn = checkInVal;
    record.checkOut = checkOutVal;
    record.totalHours = totalHours;
    record.overtime = overtime;
    record.notes = parsedData.notes || undefined;
    record.markedBy = new mongoose.Types.ObjectId(session.user.id);
    record.isManualEntry = true;

    await record.save();

    // Adjust employee stats counts
    let workDayInc = 0;
    let presentInc = 0;
    let absentInc = 0;
    let leaveInc = 0;

    // Deduct old metrics
    if (['present', 'work_from_home'].includes(oldStatus)) {
      workDayInc -= 1;
      presentInc -= 1;
    } else if (oldStatus === 'absent') {
      workDayInc -= 1;
      absentInc -= 1;
    } else if (oldStatus === 'half_day') {
      workDayInc -= 1;
      presentInc -= 0.5;
      absentInc -= 0.5;
    } else if (oldStatus === 'on_leave') {
      workDayInc -= 1;
      leaveInc -= 1;
    }

    // Add new metrics
    if (['present', 'work_from_home'].includes(newStatus)) {
      workDayInc += 1;
      presentInc += 1;
    } else if (newStatus === 'absent') {
      workDayInc += 1;
      absentInc += 1;
    } else if (newStatus === 'half_day') {
      workDayInc += 1;
      presentInc += 0.5;
      absentInc += 0.5;
    } else if (newStatus === 'on_leave') {
      workDayInc += 1;
      leaveInc += 1;
    }

    await Employee.findByIdAndUpdate(record.employeeId, {
      $inc: {
        totalWorkingDays: workDayInc,
        totalPresentDays: presentInc,
        totalAbsentDays: absentInc,
        totalLeaveDays: leaveInc,
      }
    });

    return NextResponse.json({
      success: true,
      data: record,
      message: 'Attendance record updated successfully',
    });

  } catch (error: any) {
    console.error('[ATTENDANCE_ID_PUT] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
