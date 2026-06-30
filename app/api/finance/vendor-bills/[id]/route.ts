import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import VendorBill from '@/models/VendorBill';
import Vendor from '@/models/Vendor';
import * as z from 'zod';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(session.user, 'finance_vendors', 'read') &&
      !hasPermission(session.user, 'vendors', 'read') &&
      !hasPermission(session.user, 'finance', 'read')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const bill = await VendorBill.findOne({ _id: id, organizationId: orgId })
      .populate('vendorId')
      .populate('projectId')
      .populate('contentItemId');

    if (!bill) {
      return NextResponse.json({ success: false, error: 'Vendor bill not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: bill });
  } catch (error: any) {
    console.error('[VENDOR_BILL_GET_ID] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !hasPermission(session.user, 'finance_vendors', 'update') &&
      !hasPermission(session.user, 'vendors', 'update') &&
      !hasPermission(session.user, 'finance', 'update')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;
    const body = await req.json();

    const bill = await VendorBill.findOne({ _id: id, organizationId: orgId });
    if (!bill) {
      return NextResponse.json({ success: false, error: 'Vendor bill not found' }, { status: 404 });
    }

    if (body.action === 'approve') {
      if (bill.status !== 'pending') {
        return NextResponse.json({ success: false, error: 'Only pending bills can be approved.' }, { status: 400 });
      }
      bill.status = 'approved';
      await bill.save();
      return NextResponse.json({ success: true, data: bill, message: 'Vendor bill approved.' });
    }

    if (body.action === 'mark_paid') {
      if (bill.status === 'paid') {
        return NextResponse.json({ success: false, error: 'Bill is already paid.' }, { status: 400 });
      }

      bill.status = 'paid';
      bill.paidAt = new Date();
      bill.paidBy = (session.user as any).id;
      bill.paymentMode = body.paymentMode || 'bank_transfer';
      bill.referenceNumber = body.referenceNumber || '';
      await bill.save();

      // Update Vendor totals: pending drops, paid rises
      await Vendor.updateOne(
        { _id: bill.vendorId, organizationId: orgId },
        {
          $inc: {
            totalPaid: bill.amount,
            totalPending: -bill.amount,
          },
        }
      );

      return NextResponse.json({
        success: true,
        data: bill,
        message: 'Vendor bill marked as paid successfully.',
      });
    }

    // Normal edits (only allowed if not paid)
    if (bill.status === 'paid') {
      return NextResponse.json({ success: false, error: 'Cannot edit a paid bill.' }, { status: 400 });
    }

    const oldAmount = bill.amount;
    const newAmount = body.amount !== undefined ? Number(body.amount) : oldAmount;
    const amountDiff = newAmount - oldAmount;

    // Standard fields updates
    if (body.description) bill.description = body.description;
    if (body.amount !== undefined) bill.amount = newAmount;
    if (body.dueDate) bill.dueDate = new Date(body.dueDate);
    if (body.billDate) bill.billDate = new Date(body.billDate);
    if (body.projectId !== undefined) bill.projectId = body.projectId || undefined;
    if (body.contentItemId !== undefined) bill.contentItemId = body.contentItemId || undefined;
    if (body.attachmentUrl !== undefined) bill.attachmentUrl = body.attachmentUrl;
    if (body.notes !== undefined) bill.notes = body.notes;

    await bill.save();

    if (amountDiff !== 0) {
      // Adjust Vendor totals
      await Vendor.updateOne(
        { _id: bill.vendorId, organizationId: orgId },
        {
          $inc: {
            totalBilled: amountDiff,
            totalPending: amountDiff,
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: bill,
      message: 'Vendor bill updated successfully.',
    });
  } catch (error: any) {
    console.error('[VENDOR_BILL_PUT] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

    if (
      !hasPermission(session.user, 'finance_vendors', 'delete') &&
      !hasPermission(session.user, 'vendors', 'delete') &&
      !hasPermission(session.user, 'finance', 'delete')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = (session.user as any).organizationId;
    const { id } = await params;

    const bill = await VendorBill.findOne({ _id: id, organizationId: orgId });
    if (!bill) {
      return NextResponse.json({ success: false, error: 'Vendor bill not found' }, { status: 404 });
    }

    if (bill.status === 'paid') {
      return NextResponse.json({ success: false, error: 'Cannot delete a paid vendor bill.' }, { status: 400 });
    }

    // Deduct vendor totals
    await Vendor.updateOne(
      { _id: bill.vendorId, organizationId: orgId },
      {
        $inc: {
          totalBilled: -bill.amount,
          totalPending: -bill.amount,
        },
      }
    );

    await VendorBill.deleteOne({ _id: id });

    return NextResponse.json({
      success: true,
      message: 'Vendor bill deleted successfully.',
    });
  } catch (error: any) {
    console.error('[VENDOR_BILL_DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
