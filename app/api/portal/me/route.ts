import { NextRequest, NextResponse } from 'next/server';
import { verifyPortalSession } from '@/lib/portalAuth';
import ClientPortalUser from '@/models/ClientPortalUser';
import Client from '@/models/Client';
import User from '@/models/User';
import { registerModels } from '@/models';
import bcrypt from 'bcryptjs';

registerModels();

export async function GET(req: NextRequest) {
  try {
    const sessionContext = await verifyPortalSession();
    if ('error' in sessionContext) {
      return NextResponse.json({ success: false, error: sessionContext.error }, { status: sessionContext.status });
    }

    const { user } = sessionContext;

    // Fetch the client details, excluding internal-only fields
    const client = await Client.findOne({
      _id: user.clientId,
      organizationId: user.organizationId
    })
    .select('-notes -tags -monthlyRetainerValue -totalRevenue -createdBy -sourceLeadId -assignedTeam')
    .populate({
      path: 'assignedManager',
      model: User,
      select: 'name email avatar phone designation'
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          designation: user.designation,
          phone: user.phone,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount,
        },
        client
      }
    });

  } catch (error: any) {
    console.error('[API PORTAL ME GET]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionContext = await verifyPortalSession();
    if ('error' in sessionContext) {
      return NextResponse.json({ success: false, error: sessionContext.error }, { status: sessionContext.status });
    }

    const { user } = sessionContext;
    const body = await req.json();
    const { name, phone, currentPassword, newPassword } = body;

    const dbUser = await ClientPortalUser.findById(user._id).select('+password');
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    if (name !== undefined) dbUser.name = name;
    if (phone !== undefined) dbUser.phone = phone;

    // If password fields are submitted
    if (currentPassword || newPassword) {
      if (!dbUser.password) {
        return NextResponse.json({ success: false, error: 'Incorrect current password.' }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword || '', dbUser.password);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Incorrect current password.' }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'New password must be at least 6 characters.' }, { status: 400 });
      }

      dbUser.password = await bcrypt.hash(newPassword, 12);
    }

    await dbUser.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.'
    });

  } catch (error: any) {
    console.error('[API PORTAL ME PUT]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
