import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import User from '@/models/User';
import * as z from 'zod';
import dayjs from 'dayjs';

const attendanceMarkSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  status: z.enum(['present', 'absent', 'half_day', 'on_leave', 'holiday', 'work_from_home']),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);

    const queryEmployeeId = searchParams.get('employeeId');
    const month = searchParams.get('month') || dayjs().format('YYYY-MM'); // Default to current month YYYY-MM
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100'); // Higher limit for calendars
    const skip = (page - 1) * limit;

    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';

    let employeeId = queryEmployeeId;
    if (!isManager) {
      // Find current user's employee profile
      const selfEmployee = await Employee.findOne({ organizationId: orgId, userId: session.user.id });
      if (!selfEmployee) {
        return NextResponse.json({
          success: true,
          data: [],
          summary: { presentDays: 0, absentDays: 0, halfDays: 0, leaveDays: 0, totalHours: 0, overtimeHours: 0 },
          meta: { total: 0, page, limit }
        });
      }
      employeeId = selfEmployee._id.toString();
    }

    let query: any = { organizationId: orgId, month };
    if (employeeId) {
      query.employeeId = employeeId;
    }
    if (status) {
      query.status = status;
    }

    const records = await Attendance.find(query)
      .populate({
        path: 'employeeId',
        select: 'fullName department designation employeeNumber avatar'
      })
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Attendance.countDocuments(query);

    // Compute monthly summary if we are viewing a specific employee's attendance
    let summary = null;
    if (employeeId) {
      const allMonthRecords = await Attendance.find({ organizationId: orgId, employeeId, month }).lean();
      summary = {
        presentDays: allMonthRecords.filter(r => ['present', 'work_from_home'].includes(r.status)).length,
        absentDays: allMonthRecords.filter(r => r.status === 'absent').length,
        halfDays: allMonthRecords.filter(r => r.status === 'half_day').length,
        leaveDays: allMonthRecords.filter(r => r.status === 'on_leave').length,
        totalHours: Math.round(allMonthRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0) * 100) / 100,
        overtimeHours: Math.round(allMonthRecords.reduce((sum, r) => sum + (r.overtime || 0), 0) * 100) / 100,
      };
    }

    return NextResponse.json({
      success: true,
      data: records,
      summary,
      meta: {
        total,
        page,
        limit
      }
    });

  } catch (error: any) {
    console.error('[ATTENDANCE_GET_API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_attendance', 'create')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const body = await req.json();
    const parsedData = attendanceMarkSchema.parse(body);

    const targetEmployee = await Employee.findOne({ organizationId: orgId, _id: parsedData.employeeId });
    if (!targetEmployee) {
      return NextResponse.json({ success: false, error: 'Employee profile not found' }, { status: 404 });
    }

    // Normalize date to midnight (no time component)
    const normalizedDate = dayjs(parsedData.date).startOf('day').toDate();
    const month = dayjs(normalizedDate).format('YYYY-MM');

    // Check for duplicate entry for same employee + date
    const existing = await Attendance.findOne({
      organizationId: orgId,
      employeeId: parsedData.employeeId,
      date: normalizedDate,
    });
    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'An attendance record already exists for this employee on this date. Use update instead.'
      }, { status: 400 });
    }

    // Compute check-in check-out times, total hours and overtime
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

    // Check if manual entry (marked by manager for someone else)
    const isManualEntry = targetEmployee.userId.toString() !== session.user.id;

    const newAttendance = new Attendance({
      organizationId: orgId,
      employeeId: parsedData.employeeId,
      userId: targetEmployee.userId,
      date: normalizedDate,
      month,
      status: parsedData.status,
      checkIn: checkInVal,
      checkOut: checkOutVal,
      totalHours,
      overtime,
      notes: parsedData.notes || undefined,
      markedBy: session.user.id,
      isManualEntry,
    });

    await newAttendance.save();

    // Increment working summary on Employee
    if (parsedData.status === 'present' || parsedData.status === 'work_from_home') {
      await Employee.findByIdAndUpdate(parsedData.employeeId, {
        $inc: { totalWorkingDays: 1, totalPresentDays: 1 }
      });
    } else if (parsedData.status === 'absent') {
      await Employee.findByIdAndUpdate(parsedData.employeeId, {
        $inc: { totalWorkingDays: 1, totalAbsentDays: 1 }
      });
    } else if (parsedData.status === 'half_day') {
      await Employee.findByIdAndUpdate(parsedData.employeeId, {
        $inc: { totalWorkingDays: 1, totalPresentDays: 0.5, totalAbsentDays: 0.5 }
      });
    } else if (parsedData.status === 'on_leave') {
      await Employee.findByIdAndUpdate(parsedData.employeeId, {
        $inc: { totalWorkingDays: 1, totalLeaveDays: 1 }
      });
    }

    return NextResponse.json({
      success: true,
      data: newAttendance,
      message: 'Attendance marked successfully',
    });

  } catch (error: any) {
    console.error('[ATTENDANCE_POST_API] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
