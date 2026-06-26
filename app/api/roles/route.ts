import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Role from '@/models/Role';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const roleSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  permissions: z.array(z.object({
    module: z.string(),
    actions: z.array(z.string())
  })),
  isSystem: z.boolean().default(false),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const orgId = (session.user as any).organizationId;

  await dbConnect();
  const roles = await Role.find({ organizationId: orgId }).sort({ createdAt: 1 });
  return NextResponse.json({ success: true, data: roles });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const body = await req.json();

  try {
    const validatedData = roleSchema.parse(body);
    await dbConnect();

    const existingRole = await Role.findOne({ organizationId: orgId, slug: validatedData.slug });
    if (existingRole) {
      return NextResponse.json({ success: false, error: 'Role with this slug already exists' }, { status: 400 });
    }

    const newRole = await Role.create({
      ...validatedData,
      organizationId: orgId,
    });

    return NextResponse.json({ success: true, data: newRole, message: 'Role created successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
