import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Role from '@/models/Role';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const orgId = (session.user as any).organizationId;
  const body = await req.json();

  await dbConnect();
  
  const role = await Role.findOne({ _id: id, organizationId: orgId });
  if (!role) {
    return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
  }

  // System roles cannot have their slug changed, but permissions can be updated maybe?
  // Usually system roles are limited. Let's allow updating everything but slug if isSystem.
  if (role.isSystem && body.slug && body.slug !== role.slug) {
      return NextResponse.json({ success: false, error: 'Cannot change slug of a system role' }, { status: 400 });
  }

  const updatedRole = await Role.findOneAndUpdate(
    { _id: id, organizationId: orgId },
    body,
    { new: true }
  );

  return NextResponse.json({ success: true, data: updatedRole, message: 'Role updated successfully' });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const orgId = (session.user as any).organizationId;

  await dbConnect();
  const role = await Role.findOne({ _id: id, organizationId: orgId });
  
  if (!role) {
    return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
  }

  if (role.isSystem) {
    return NextResponse.json({ success: false, error: 'System roles cannot be deleted' }, { status: 400 });
  }

  await Role.deleteOne({ _id: id, organizationId: orgId });
  return NextResponse.json({ success: true, message: 'Role deleted successfully' });
}
