import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const orgId = (session.user as any).organizationId;

  await dbConnect();
  const user = await User.findOne({ _id: id, organizationId: orgId }).populate('role').select('-password');
  
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: user });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const body = await req.json();

  try {
    const validatedData = updateSchema.parse(body);
    await dbConnect();

    // If password is provided in body (though not in schema for PUT simple update, maybe handle separately)
    const updatePayload: any = { ...validatedData };
    if (body.password) {
      updatePayload.password = await bcrypt.hash(body.password, 12);
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, organizationId: orgId },
      updatePayload,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedUser, message: 'User updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const orgId = (session.user as any).organizationId;

  await dbConnect();
  // Soft delete: set status to inactive
  const user = await User.findOneAndUpdate(
    { _id: id, organizationId: orgId },
    { status: 'inactive' },
    { new: true }
  );

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'User deactivated successfully' });
}
