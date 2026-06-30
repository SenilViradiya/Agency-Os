import { NextRequest, NextResponse } from 'next/server';
import { verifyPortalSession } from '@/lib/portalAuth';
import Invoice from '@/models/Invoice';
import FinanceSettings from '@/models/FinanceSettings';
import { registerModels } from '@/models';

registerModels();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionContext = await verifyPortalSession();
    if ('error' in sessionContext) {
      return NextResponse.json({ success: false, error: sessionContext.error }, { status: sessionContext.status });
    }

    const { session } = sessionContext;
    const clientId = (session.user as any).clientId;
    const organizationId = (session.user as any).organizationId;
    const { id } = await params;

    // Fetch the single invoice and verify that it belongs to this client and is not a draft
    const invoice = await Invoice.findOne({
      _id: id,
      clientId,
      organizationId,
      status: { $ne: 'draft' },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found or access denied.' }, { status: 403 });
    }

    // Fetch database finance settings (like bank details etc.)
    const financeSettings = await FinanceSettings.findOne({ organizationId });

    return NextResponse.json({
      success: true,
      data: {
        invoice,
        financeSettings,
      },
    });

  } catch (error: any) {
    console.error('[API PORTAL INVOICE BY ID GET]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
