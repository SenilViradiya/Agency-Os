import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Quotation from '@/models/Quotation';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import FinanceSettings from '@/models/FinanceSettings';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(session.user, 'finance_invoices', 'create') &&
      !hasPermission(session.user, 'finance', 'create')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const quotation = await Quotation.findOne({ _id: id, organizationId: orgId, isDeleted: { $ne: true } });
    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
    }

    if (quotation.status !== 'accepted') {
      return NextResponse.json(
        { success: false, error: 'Only accepted quotations can be converted to invoices.' },
        { status: 400 }
      );
    }

    if (!quotation.clientId) {
      return NextResponse.json(
        { success: false, error: 'Quotation must be linked to a Client to convert to an invoice. Please link a client first.' },
        { status: 400 }
      );
    }

    // Get client info to populate address
    const client = await Client.findOne({ _id: quotation.clientId, organizationId: orgId });
    if (!client) {
      return NextResponse.json({ success: false, error: 'Linked client not found.' }, { status: 404 });
    }

    // Fetch settings
    let settings = await FinanceSettings.findOne({ organizationId: orgId });
    if (!settings) {
      settings = new FinanceSettings({
        organizationId: orgId,
        companyName: 'My Marketing Agency',
        invoicePrefix: 'INV',
        defaultPaymentDueDays: 7,
      });
      await settings.save();
    }

    // Generate Invoice Number
    const lastInvoice = await Invoice.findOne({ organizationId: orgId })
      .sort({ invoiceNumber: -1 })
      .select('invoiceNumber')
      .lean();

    const prefix = settings.invoicePrefix || 'INV';
    let nextNum = 1;
    if (lastInvoice?.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(new RegExp(`${prefix}-(\\d+)`));
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      } else {
        const fallbackMatch = lastInvoice.invoiceNumber.match(/-(\d+)/);
        if (fallbackMatch) {
          nextNum = parseInt(fallbackMatch[1], 10) + 1;
        }
      }
    }
    const invoiceNumber = `${prefix}-${String(nextNum).padStart(4, '0')}`;

    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(invoiceDate.getDate() + (settings.defaultPaymentDueDays || 7));

    // Create new Invoice
    const invoice = new Invoice({
      organizationId: orgId,
      invoiceNumber,
      clientId: quotation.clientId,
      businessName: quotation.businessName,
      billingAddress: {
        street: client.address?.street || '',
        city: client.address?.city || '',
        state: client.address?.state || '',
        pincode: client.address?.pincode || '',
        country: client.address?.country || 'India',
      },
      contactPerson: quotation.contactPerson,
      email: quotation.email,
      phone: quotation.phone,
      invoiceType: 'project',
      invoiceDate,
      dueDate,
      lineItems: quotation.lineItems,
      subtotal: quotation.subtotal,
      discountType: quotation.discountType,
      discountValue: quotation.discountValue,
      discountAmount: quotation.discountAmount,
      gstApplicable: quotation.gstApplicable,
      gstRate: quotation.gstRate,
      cgstAmount: quotation.cgstAmount,
      sgstAmount: quotation.sgstAmount,
      igstAmount: quotation.igstAmount,
      totalAmount: quotation.totalAmount,
      amountPaid: 0,
      amountDue: quotation.totalAmount,
      status: 'draft',
      notes: quotation.notes || settings.invoiceNotes || '',
      termsAndConditions: quotation.termsAndConditions || settings.invoiceTermsAndConditions || '',
      createdBy: (session.user as any).id,
    });

    await invoice.save();

    // Mark quotation converted
    quotation.status = 'converted';
    quotation.convertedToInvoiceId = invoice._id as any;
    await quotation.save();

    return NextResponse.json({
      success: true,
      data: { quotation, invoice },
      message: 'Quotation successfully converted to Invoice draft.',
    });
  } catch (error: any) {
    console.error('[QUOTATION_CONVERT] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
