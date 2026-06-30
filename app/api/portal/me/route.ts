import { NextRequest, NextResponse } from 'next/server';
import { verifyPortalSession } from '@/lib/portalAuth';
import ClientPortalUser from '@/models/ClientPortalUser';
import Client from '@/models/Client';
import User from '@/models/User';
import { registerModels } from '@/models';

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
    console.error('[API PORTAL ME]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
