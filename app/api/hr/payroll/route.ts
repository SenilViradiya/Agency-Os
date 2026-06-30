import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import * as z from 'zod';
import dayjs from 'dayjs';

const payrollGenerateSchema = z.object({
  employeeId: z.string(),
  month: z.string(), // 'YYYY-MM'
  variablePay: z.number().default(0),
  variableReason: z.string().optional().default(''),
  otherDeductions: z.number().default(0),
  deductionReason: z.string().optional().default(''),
  paymentMode: z.string().optional().default('bank_transfer'),
});

function getWorkingDaysInMonth(year: number, monthZeroBased: number): number {
  let count = 0;
  const startDay = dayjs().year(year).month(monthZeroBased).date(1);
  const daysInMonth = startDay.daysInMonth();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = dayjs().year(year).month(monthZeroBased).date(i);
    if (d.day() !== 0) { // Exclude Sundays
      count++;
    }
  }
  return count;
}

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);

    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = { organizationId: orgId };

    if (employeeId) query.employeeId = employeeId;
    if (month) query.month = month;
    if (status) query.status = status;

    const payrolls = await Payroll.find(query)
      .populate('employeeId', 'fullName department designation employeeNumber avatar')
      .sort({ month: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Payroll.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: payrolls,
      meta: {
        total,
        page,
        limit,
      },
    });

  } catch (error: any) {
    console.error('[PAYROLL_GET_API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_payroll', 'create')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const body = await req.json();
    const parsedData = payrollGenerateSchema.parse(body);

    const employee = await Employee.findOne({ organizationId: orgId, _id: parsedData.employeeId });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee profile not found' }, { status: 404 });
    }

    // Check for duplicate payroll for same employeeId + month
    const existingPayroll = await Payroll.findOne({
      organizationId: orgId,
      employeeId: parsedData.employeeId,
      month: parsedData.month,
    });
    if (existingPayroll) {
      return NextResponse.json(
        { success: false, error: `Payroll has already been generated/drafted for this employee in ${parsedData.month}.` },
        { status: 400 }
      );
    }

    // Parse year and month
    const monthDate = dayjs(parsedData.month, 'YYYY-MM');
    const year = monthDate.year();
    const monthZeroBased = monthDate.month();
    const monthName = monthDate.format('MMMM YYYY');

    const startOfMonth = monthDate.startOf('month').toDate();
    const endOfMonth = monthDate.endOf('month').toDate();

    // 1. Calculate workingDays (Mon-Sat)
    const workingDays = getWorkingDaysInMonth(year, monthZeroBased);

    // 2. Fetch attendance records
    const attendances = await Attendance.find({
      organizationId: orgId,
      employeeId: parsedData.employeeId,
      month: parsedData.month,
    }).lean();

    const presentDays = attendances.filter(a => ['present', 'work_from_home'].includes(a.status)).length;
    const halfDays = attendances.filter(a => a.status === 'half_day').length;
    const leaveDays = attendances.filter(a => a.status === 'on_leave').length;
    const overtimeHours = attendances.reduce((sum, a) => sum + (a.overtime || 0), 0);

    // absentDays = workingDays - presentDays - leaveDays - (halfDays * 0.5)
    const absentDays = Math.max(0, workingDays - presentDays - leaveDays - (halfDays * 0.5));

    // 3. Unpaid leave computation
    const unpaidLeaves = await Leave.find({
      organizationId: orgId,
      employeeId: parsedData.employeeId,
      status: 'approved',
      leaveType: 'unpaid',
      $or: [
        { startDate: { $gte: startOfMonth, $lte: endOfMonth } },
        { endDate: { $gte: startOfMonth, $lte: endOfMonth } }
      ]
    }).lean();

    let unpaidLeaveDays = 0;
    for (const leave of unpaidLeaves) {
      let curr = dayjs(leave.startDate);
      const end = dayjs(leave.endDate);
      while (curr.isBefore(end) || curr.isSame(end)) {
        if (curr.format('YYYY-MM') === parsedData.month && curr.day() !== 0) { // Exclude Sundays
          unpaidLeaveDays += leave.isHalfDay ? 0.5 : 1;
        }
        curr = curr.add(1, 'day');
      }
    }

    // 4. Financial Calculations
    const salary = employee.salaryStructure;
    const basicSalary = salary.basicSalary || 0;
    const hra = salary.hra || 0;
    const allowances = salary.allowances || 0;

    const dailyRate = workingDays > 0 ? basicSalary / workingDays : 0;
    const hourlyRate = dailyRate / 8;
    const overtimePay = overtimeHours * hourlyRate * 1.5;

    const absentDeduction = dailyRate * absentDays;
    const leaveDeduction = dailyRate * unpaidLeaveDays;

    const grossSalary = basicSalary + hra + allowances + overtimePay + parsedData.variablePay;
    const totalDeductions = absentDeduction + leaveDeduction + parsedData.otherDeductions;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    // Auto-generate payrollNumber (PAY-0001)
    const lastPayroll = await Payroll.findOne({ organizationId: orgId })
      .sort({ payrollNumber: -1 })
      .select('payrollNumber')
      .lean();
    let nextNum = 1;
    if (lastPayroll?.payrollNumber) {
      const match = lastPayroll.payrollNumber.match(/PAY-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const payrollNumber = `PAY-${String(nextNum).padStart(4, '0')}`;

    // Create Draft Payroll record
    const newPayroll = new Payroll({
      organizationId: orgId,
      payrollNumber,
      employeeId: parsedData.employeeId,
      month: parsedData.month,
      year,
      monthName,
      workingDays,
      presentDays,
      absentDays,
      leaveDays,
      halfDays,
      overtimeHours,
      basicSalary,
      hra,
      allowances,
      overtimePay: Math.round(overtimePay * 100) / 100,
      variablePay: parsedData.variablePay,
      variableReason: parsedData.variableReason || undefined,
      absentDeduction: Math.round(absentDeduction * 100) / 100,
      leaveDeduction: Math.round(leaveDeduction * 100) / 100,
      otherDeductions: parsedData.otherDeductions,
      deductionReason: parsedData.deductionReason || undefined,
      grossSalary: Math.round(grossSalary * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100,
      status: 'draft',
      paymentMode: parsedData.paymentMode,
      generatedBy: session.user.id,
    });

    await newPayroll.save();

    return NextResponse.json({
      success: true,
      data: newPayroll,
      message: `Payroll draft generated successfully for ${monthName}`,
    });

  } catch (error: any) {
    console.error('[PAYROLL_POST_API] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
