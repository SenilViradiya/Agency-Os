import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Leave from '@/models/Leave';
import Employee from '@/models/Employee';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Role from '@/models/Role';
import * as z from 'zod';
import dayjs from 'dayjs';

const leaveApplySchema = z.object({
  leaveType: z.enum(['annual', 'sick', 'casual', 'unpaid', 'other']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(1, 'Reason is required'),
  isHalfDay: z.boolean().default(false),
  halfDayPeriod: z.enum(['morning', 'afternoon']).optional().nullable(),
  supportingDocument: z.string().optional().nullable(),
  employeeId: z.string().optional(), // For managers applying on behalf of employee
});

function calculateLeaveDays(start: Date, end: Date, isHalfDay: boolean): number {
  if (isHalfDay) return 0.5;
  let total = 0;
  let current = dayjs(start).startOf('day');
  const last = dayjs(end).startOf('day');
  while (current.isBefore(last) || current.isSame(last)) {
    const dayOfWeek = current.day(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0) {
      // Exclude Sunday
    } else if (dayOfWeek === 6) {
      // Count Saturday as 0.5
      total += 0.5;
    } else {
      total += 1;
    }
    current = current.add(1, 'day');
  }
  return total;
}

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);

    const queryEmployeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const leaveType = searchParams.get('leaveType');
    const month = searchParams.get('month'); // YYYY-MM
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';

    let query: any = { organizationId: orgId };

    if (!isManager) {
      query.userId = session.user.id;
    } else {
      if (queryEmployeeId) {
        query.employeeId = queryEmployeeId;
      }
    }

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    
    if (month) {
      const startOfMonth = dayjs(month).startOf('month').toDate();
      const endOfMonth = dayjs(month).endOf('month').toDate();
      query.$or = [
        { startDate: { $gte: startOfMonth, $lte: endOfMonth } },
        { endDate: { $gte: startOfMonth, $lte: endOfMonth } },
      ];
    }

    const leaves = await Leave.find(query)
      .populate({
        path: 'employeeId',
        select: 'fullName avatar department employeeNumber'
      })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Leave.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: leaves,
      meta: {
        total,
        page,
        limit
      }
    });

  } catch (error: any) {
    console.error('[LEAVES_GET_API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_leaves', 'create')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const body = await req.json();
    const parsedData = leaveApplySchema.parse(body);

    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';

    // Identify target employee profile
    let employeeId = parsedData.employeeId;
    if (!isManager || !employeeId) {
      const selfEmployee = await Employee.findOne({ organizationId: orgId, userId: session.user.id });
      if (!selfEmployee) {
        return NextResponse.json({
          success: false,
          error: 'You do not have an active employee profile. Please contact an administrator.'
        }, { status: 400 });
      }
      employeeId = selfEmployee._id.toString();
    }

    const employee = await Employee.findOne({ organizationId: orgId, _id: employeeId });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Target employee profile not found.' }, { status: 404 });
    }

    const start = dayjs(parsedData.startDate).startOf('day').toDate();
    const end = dayjs(parsedData.endDate).startOf('day').toDate();

    if (start.getTime() > end.getTime()) {
      return NextResponse.json({ success: false, error: 'End date must be on or after start date.' }, { status: 400 });
    }

    // Compute totalDays
    const totalDays = calculateLeaveDays(start, end, parsedData.isHalfDay);
    if (totalDays <= 0) {
      return NextResponse.json({ success: false, error: 'Leave request results in 0 valid leave days.' }, { status: 400 });
    }

    // Validate: enough balance remaining (unless type is unpaid)
    if (parsedData.leaveType !== 'unpaid') {
      const type = parsedData.leaveType as keyof typeof employee.leaveBalance;
      const remainingBalance = employee.leaveBalance[type] ?? 0;
      if (remainingBalance < totalDays) {
        return NextResponse.json({
          success: false,
          error: `Insufficient leave balance. You requested ${totalDays} days but only have ${remainingBalance} ${parsedData.leaveType} leave days remaining.`
        }, { status: 400 });
      }
    }

    // Validate: no overlapping approved leave for same employee
    const overlappingApproved = await Leave.findOne({
      organizationId: orgId,
      employeeId,
      status: 'approved',
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });
    if (overlappingApproved) {
      return NextResponse.json({
        success: false,
        error: 'An approved leave request already exists that overlaps with these dates.'
      }, { status: 400 });
    }

    // Auto-generate leaveNumber (LVE-0001)
    const lastLeave = await Leave.findOne({ organizationId: orgId })
      .sort({ leaveNumber: -1 })
      .select('leaveNumber')
      .lean();
    let nextNum = 1;
    if (lastLeave?.leaveNumber) {
      const match = lastLeave.leaveNumber.match(/LVE-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const leaveNumber = `LVE-${String(nextNum).padStart(4, '0')}`;

    const newLeave = new Leave({
      organizationId: orgId,
      leaveNumber,
      employeeId,
      userId: employee.userId,
      leaveType: parsedData.leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      isHalfDay: parsedData.isHalfDay,
      halfDayPeriod: parsedData.isHalfDay ? parsedData.halfDayPeriod : null,
      reason: parsedData.reason,
      supportingDocument: parsedData.supportingDocument || undefined,
      status: 'pending',
      appliedAt: new Date(),
      balanceDeducted: false,
    });

    await newLeave.save();

    // Create notifications for all managers & super admins in the organization
    const managerRoles = await Role.find({ organizationId: orgId, slug: { $in: ['superadmin', 'manager'] } }).select('_id');
    const managerRoleIds = managerRoles.map(r => r._id);
    const usersToNotify = await User.find({ organizationId: orgId, role: { $in: managerRoleIds } }).select('_id');

    for (const managerUser of usersToNotify) {
      await Notification.create({
        organizationId: orgId,
        recipientId: managerUser._id,
        type: 'approval_requested',
        title: 'New Leave Request',
        message: `${employee.fullName} applied for ${parsedData.leaveType} leave (${totalDays} days)`,
        link: '/hr/leaves',
        entityType: 'Leave',
        entityId: newLeave._id,
        isRead: false
      });
    }

    return NextResponse.json({
      success: true,
      data: newLeave,
      message: 'Leave request submitted successfully',
    });

  } catch (error: any) {
    console.error('[LEAVES_POST_API] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
