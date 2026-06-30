import { NextRequest, NextResponse } from 'next/server';
import { verifyPortalSession } from '@/lib/portalAuth';
import Invoice from '@/models/Invoice';
import { registerModels } from '@/models';

registerModels();

export async function GET(req: NextRequest) {
  try {
    const sessionContext = await verifyPortalSession();
    if ('error' in sessionContext) {
      return NextResponse.json({ success: false, error: sessionContext.error }, { status: sessionContext.status });
    }

    const { session } = sessionContext;
    const clientId = (session.user as any).clientId;
    const organizationId = (session.user as any).organizationId;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const query: any = {
      clientId,
      organizationId,
    };

    // Filter out draft invoices for clients (they should only see sent, paid, partially_paid, overdue, cancelled)
    query.status = { $ne: 'draft' };

    if (status && status !== 'all') {
      if (status === 'overdue') {
        query.status = 'overdue';
      } else if (status === 'pending') {
        query.status = { $in: ['sent', 'partially_paid'] };
      } else if (status === 'paid') {
        query.status = 'paid';
      }
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ invoiceDate: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error: any) {
    console.error('[API PORTAL INVOICES GET]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
