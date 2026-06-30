import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Employee from '@/models/Employee';
import User from '@/models/User';
import Payroll from '@/models/Payroll';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import * as z from 'zod';
import dayjs from 'dayjs';

const employeeUpdateSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  whatsappNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().optional(),
  personalEmail: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    relation: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  avatar: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  employmentType: z.enum(['full_time', 'part_time', 'freelancer', 'intern']),
  joiningDate: z.string(),
  probationEndDate: z.string().optional(),
  confirmationDate: z.string().optional(),
  reportingManager: z.string().optional().nullable(),
  skills: z.array(z.string()).optional(),
  equipmentAssigned: z.array(z.object({
    name: z.string(),
    serialNumber: z.string(),
    assignedDate: z.string().optional(),
  })).optional(),
  salaryStructure: z.object({
    basicSalary: z.number().default(0),
    hra: z.number().default(0),
    allowances: z.number().default(0),
    variableComponent: z.number().default(0),
    paymentMode: z.enum(['bank_transfer', 'cash', 'upi']).default('bank_transfer'),
    bankDetails: z.object({
      accountName: z.string().optional(),
      accountNumber: z.string().optional(),
      ifscCode: z.string().optional(),
      bankName: z.string().optional(),
    }).optional(),
    upiId: z.string().optional(),
  }),
  leaveBalance: z.object({
    annual: z.number().default(12),
    sick: z.number().default(6),
    casual: z.number().default(6),
    unpaid: z.number().default(0),
  }).optional(),
  status: z.enum(['active', 'on_leave', 'resigned', 'terminated']).optional(),
  exitDate: z.string().optional(),
  exitReason: z.string().optional(),
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

    const employee = await Employee.findOne({ organizationId: orgId, _id: id })
      .populate('userId', 'name avatar email role')
      .populate('reportingManager', 'fullName')
      .lean();

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Role verification: check if this is the employee themselves or a manager
    const isSelf = employee.userId && (employee.userId as any)._id?.toString() === session.user.id;
    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';

    if (!isSelf && !isManager) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Include last 3 months payroll summary
    const threeMonthsAgo = dayjs().subtract(3, 'month').format('YYYY-MM');
    const payrolls = await Payroll.find({
      organizationId: orgId,
      employeeId: id,
      month: { $gte: threeMonthsAgo }
    })
      .sort({ month: -1 })
      .limit(3)
      .lean();

    // Include current month attendance summary & records
    const currentMonth = dayjs().format('YYYY-MM');
    const attendanceRecords = await Attendance.find({
      organizationId: orgId,
      employeeId: id,
      month: currentMonth
    }).lean();

    const attendanceSummary = {
      presentDays: attendanceRecords.filter(r => ['present', 'work_from_home'].includes(r.status)).length,
      absentDays: attendanceRecords.filter(r => r.status === 'absent').length,
      halfDays: attendanceRecords.filter(r => r.status === 'half_day').length,
      leaveDays: attendanceRecords.filter(r => r.status === 'on_leave').length,
      totalHours: attendanceRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0),
      overtimeHours: attendanceRecords.reduce((sum, r) => sum + (r.overtime || 0), 0),
    };

    // Include pending leave requests
    const pendingLeaves = await Leave.find({
      organizationId: orgId,
      employeeId: id,
      status: 'pending'
    })
      .sort({ startDate: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        employee,
        payrolls,
        attendanceSummary,
        attendanceRecords,
        pendingLeaves,
      }
    });

  } catch (error: any) {
    console.error('[EMPLOYEE_ID_GET_API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_employees', 'update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const employee = await Employee.findOne({ organizationId: orgId, _id: id });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsedData = employeeUpdateSchema.parse(body);

    // Recompute totalFixedCTC
    const basic = parsedData.salaryStructure.basicSalary ?? employee.salaryStructure.basicSalary ?? 0;
    const hra = parsedData.salaryStructure.hra ?? employee.salaryStructure.hra ?? 0;
    const allowances = parsedData.salaryStructure.allowances ?? employee.salaryStructure.allowances ?? 0;
    const totalFixedCTC = basic + hra + allowances;

    // Apply updates
    const updatedFields: any = {
      ...parsedData,
      salaryStructure: {
        ...parsedData.salaryStructure,
        totalFixedCTC,
      },
      dateOfBirth: parsedData.dateOfBirth ? new Date(parsedData.dateOfBirth) : undefined,
      joiningDate: new Date(parsedData.joiningDate),
      probationEndDate: parsedData.probationEndDate ? new Date(parsedData.probationEndDate) : undefined,
      confirmationDate: parsedData.confirmationDate ? new Date(parsedData.confirmationDate) : undefined,
      exitDate: parsedData.exitDate ? new Date(parsedData.exitDate) : undefined,
      reportingManager: parsedData.reportingManager || undefined,
    };

    const updatedEmployee = await Employee.findOneAndUpdate(
      { organizationId: orgId, _id: id },
      { $set: updatedFields },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee profile updated successfully',
    });

  } catch (error: any) {
    console.error('[EMPLOYEE_ID_PUT_API] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_employees', 'delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const employee = await Employee.findOne({ organizationId: orgId, _id: id });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Soft delete: block if status is active, otherwise set status to 'terminated'
    if (employee.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Active employee profiles cannot be deleted. Change the employee status first.' },
        { status: 400 }
      );
    }

    employee.status = 'terminated';
    employee.exitDate = new Date();
    employee.exitReason = 'Terminated via administrative request';
    await employee.save();

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Employee profile terminated successfully (soft deleted).',
    });

  } catch (error: any) {
    console.error('[EMPLOYEE_ID_DELETE_API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
