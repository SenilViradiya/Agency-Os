import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ClientPortalUser from '@/models/ClientPortalUser';
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserRole = (session.user as any).role; // e.g. 'Manager' or 'Super Admin'
    if (currentUserRole !== 'Super Admin' && currentUserRole !== 'Manager') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const organizationId = (session.user as any).organizationId;

    const portalUser = await ClientPortalUser.findOne({
      _id: id,
      organizationId,
    });

    if (!portalUser) {
      return NextResponse.json({ success: false, error: 'Client portal user not found.' }, { status: 404 });
    }

    const body = await req.json();
    const result = passwordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0]?.message || 'Invalid password' }, { status: 400 });
    }

    const { newPassword } = result.data;
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    portalUser.password = hashedPassword;
    await portalUser.save();

    return NextResponse.json({
      success: true,
      message: 'Portal password reset successfully'
    });

  } catch (error: any) {
    console.error('[API ADMIN PORTAL USERS RESET PASSWORD]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
