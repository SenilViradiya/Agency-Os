import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Employee from '@/models/Employee';
import User from '@/models/User';
import * as z from 'zod';

const employeeSchema = z.object({
  userId: z.string(),
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
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_employees', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const employmentType = searchParams.get('employmentType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = { organizationId: orgId };
    
    // Regular employees see only their own profile, unless they have broader permissions.
    // However, the employee page is typically for HR/Managers. We enforce normal hasPermission checks.
    // If they only have view own, they shouldn't query list, or the list should be restricted.
    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';
    if (!isManager) {
      // Find the employee profile associated with the current user
      const selfEmployee = await Employee.findOne({ organizationId: orgId, userId: session.user.id });
      if (selfEmployee) {
        query._id = selfEmployee._id;
      } else {
        // No profile exists yet, return empty list
        return NextResponse.json({ success: true, data: [], meta: { total: 0, page, limit } });
      }
    } else {
      if (status) query.status = status;
      if (department) query.department = department;
      if (employmentType) query.employmentType = employmentType;
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeNumber: { $regex: search, $options: 'i' } },
        ];
      }
    }

    const employees = await Employee.find(query)
      .populate('userId', 'name avatar email')
      .populate('reportingManager', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Employee.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: employees,
      meta: {
        total,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('[EMPLOYEES_GET_API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_employees', 'create')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const body = await req.json();
    const parsedData = employeeSchema.parse(body);

    // Validate: userId must not already have an Employee record in the same organization
    const existingEmployee = await Employee.findOne({ organizationId: orgId, userId: parsedData.userId });
    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'An employee profile already exists for this user account.' },
        { status: 400 }
      );
    }

    // Auto-generate employeeNumber (EMP-0001)
    const lastEmployee = await Employee.findOne({ organizationId: orgId })
      .sort({ employeeNumber: -1 })
      .select('employeeNumber')
      .lean();
    
    let nextNum = 1;
    if (lastEmployee?.employeeNumber) {
      const match = lastEmployee.employeeNumber.match(/EMP-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const employeeNumber = `EMP-${String(nextNum).padStart(4, '0')}`;

    // Compute totalFixedCTC = basicSalary + hra + allowances
    const basic = parsedData.salaryStructure.basicSalary || 0;
    const hra = parsedData.salaryStructure.hra || 0;
    const allowances = parsedData.salaryStructure.allowances || 0;
    const totalFixedCTC = basic + hra + allowances;

    const newEmployee = new Employee({
      ...parsedData,
      organizationId: orgId,
      employeeNumber,
      salaryStructure: {
        ...parsedData.salaryStructure,
        totalFixedCTC,
      },
      dateOfBirth: parsedData.dateOfBirth ? new Date(parsedData.dateOfBirth) : undefined,
      joiningDate: new Date(parsedData.joiningDate),
      probationEndDate: parsedData.probationEndDate ? new Date(parsedData.probationEndDate) : undefined,
      confirmationDate: parsedData.confirmationDate ? new Date(parsedData.confirmationDate) : undefined,
      reportingManager: parsedData.reportingManager || undefined,
      createdBy: session.user.id,
    });

    await newEmployee.save();

    return NextResponse.json({
      success: true,
      data: newEmployee,
      message: 'Employee profile created successfully',
    });
  } catch (error: any) {
    console.error('[EMPLOYEES_POST_API] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
