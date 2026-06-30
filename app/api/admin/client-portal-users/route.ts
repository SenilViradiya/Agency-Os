import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ClientPortalUser from '@/models/ClientPortalUser';
import Client from '@/models/Client';
import bcrypt from 'bcryptjs';
import { registerModels } from '@/models';

registerModels();

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'clients', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const organizationId = (session.user as any).organizationId;

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const query: any = { organizationId };

    if (clientId) {
      query.clientId = clientId;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      ClientPortalUser.find(query)
        .populate({
          path: 'clientId',
          model: Client,
          select: 'businessName contactPerson clientNumber'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password'),
      ClientPortalUser.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error: any) {
    console.error('[API ADMIN PORTAL USERS GET]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    const body = await req.json();

    const { clientId, name, email, designation, phone, password } = body;

    if (!clientId || !name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Missing required fields: clientId, name, email, password' }, { status: 400 });
    }

    // Verify email is unique within current organizationId
    const emailLower = email.toLowerCase().trim();
    const existingUser = await ClientPortalUser.findOne({
      organizationId,
      email: emailLower
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'A portal login with this email already exists for this organization.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await ClientPortalUser.create({
      organizationId,
      clientId,
      name,
      email: emailLower,
      password: hashedPassword,
      designation,
      phone,
      status: 'active',
      createdBy: (session.user as any).id,
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    return NextResponse.json({
      success: true,
      data: userObj,
      message: 'Client portal credentials created successfully.'
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API ADMIN PORTAL USERS POST]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
