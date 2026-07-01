import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { registerModels } from '@/models';

registerModels();

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .refine((val) => /[A-Z]/.test(val), { message: 'Password must contain at least one uppercase letter' })
    .refine((val) => /[0-9]/.test(val), { message: 'Password must contain at least one number' }),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserRole = (session.user as any).role; // e.g. 'Manager' or 'Super Admin'
    const currentUserId = (session.user as any).id;

    if (currentUserRole !== 'Super Admin' && currentUserRole !== 'Manager') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // A user cannot reset their own password this way
    if (id === currentUserId) {
      return NextResponse.json({ success: false, error: 'You cannot reset your own password this way.' }, { status: 400 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;

    // Find target user and populate role
    const targetUser = await User.findOne({ _id: id, organizationId: orgId }).populate('role');
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const targetUserRole = (targetUser.role as any)?.name;

    // A Manager cannot reset a Super Admin's password
    if (targetUserRole === 'Super Admin' && currentUserRole === 'Manager') {
      return NextResponse.json({ success: false, error: 'Managers are not allowed to reset Super Admin passwords.' }, { status: 403 });
    }

    const body = await req.json();
    const result = passwordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0]?.message || 'Invalid password' }, { status: 400 });
    }

    const { newPassword } = result.data;
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    targetUser.password = hashedPassword;
    await targetUser.save();

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('[API USER RESET PASSWORD]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
