import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ClientPortalUser from '@/models/ClientPortalUser';
import bcrypt from 'bcryptjs';
import { registerModels } from '@/models';

registerModels();

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'clients', 'update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const organizationId = (session.user as any).organizationId;
    const { id } = await params;
    const body = await req.json();

    const portalUser = await ClientPortalUser.findOne({
      _id: id,
      organizationId,
    });

    if (!portalUser) {
      return NextResponse.json({ success: false, error: 'Client portal user not found.' }, { status: 404 });
    }

    const { name, designation, phone, status, newPassword } = body;

    if (name !== undefined) portalUser.name = name;
    if (designation !== undefined) portalUser.designation = designation;
    if (phone !== undefined) portalUser.phone = phone;
    if (status !== undefined) {
      if (['active', 'inactive'].includes(status)) {
        portalUser.status = status;
      } else {
        return NextResponse.json({ success: false, error: 'Invalid status value.' }, { status: 400 });
      }
    }
    if (newPassword !== undefined && newPassword !== '') {
      portalUser.password = await bcrypt.hash(newPassword, 12);
    }

    await portalUser.save();

    const userObj = portalUser.toObject();
    delete userObj.password;

    return NextResponse.json({
      success: true,
      data: userObj,
      message: 'Client portal user updated successfully.'
    });

  } catch (error: any) {
    console.error('[API ADMIN PORTAL USERS PUT]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'clients', 'update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const organizationId = (session.user as any).organizationId;
    const { id } = await params;

    const portalUser = await ClientPortalUser.findOne({
      _id: id,
      organizationId,
    });

    if (!portalUser) {
      return NextResponse.json({ success: false, error: 'Client portal user not found.' }, { status: 404 });
    }

    // Soft delete: set status to inactive
    portalUser.status = 'inactive';
    await portalUser.save();

    return NextResponse.json({
      success: true,
      message: 'Client portal user access deactivated (soft-deleted) successfully.'
    });

  } catch (error: any) {
    console.error('[API ADMIN PORTAL USERS DELETE]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
