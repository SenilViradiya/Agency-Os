import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string(),
  department: z.string(),
  designation: z.string(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const role = searchParams.get('role');
  const search = searchParams.get('search');

  await dbConnect();

  const query: any = { organizationId: orgId };
  if (status) query.status = status;
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query).populate('role').sort({ createdAt: -1 }).select('-password');
  return NextResponse.json({ success: true, data: users });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const body = await req.json();

  try {
    const validatedData = userSchema.parse(body);
    await dbConnect();

    // Check if email already exists in this org
    const existingUser = await User.findOne({ organizationId: orgId, email: validatedData.email });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    const newUser = await User.create({
      ...validatedData,
      password: hashedPassword,
      organizationId: orgId,
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json({ success: true, data: userResponse, message: 'User created successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
