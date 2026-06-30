import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Announcement from '@/models/Announcement';
import mongoose from 'mongoose';
import * as z from 'zod';
const announcementUpdateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  type: z.enum(['general', 'policy', 'holiday', 'event', 'urgent']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  targetAudience: z.enum(['all', 'department', 'specific_users']).optional(),
  targetDepartments: z.array(z.string()).optional(),
  targetUsers: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional(),
  isPinned: z.boolean().optional(),
  expiresAt: z.string().optional().nullable(),
  action: z.enum(['mark_read']).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_announcements', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const announcement = await Announcement.findOne({ organizationId: orgId, _id: id, isActive: true })
      .populate('createdBy', 'name avatar');

    if (!announcement) {
      return NextResponse.json({ success: false, error: 'Announcement not found' }, { status: 404 });
    }

    const readByMe = announcement.readBy?.some(
      (userId: any) => userId.toString() === session.user.id
    ) || false;

    return NextResponse.json({
      success: true,
      data: {
        ...announcement.toObject(),
        readByMe,
      }
    });

  } catch (error: any) {
    console.error('[ANNOUNCEMENT_ID_GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const announcement = await Announcement.findOne({ organizationId: orgId, _id: id, isActive: true });
    if (!announcement) {
      return NextResponse.json({ success: false, error: 'Announcement not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsedData = announcementUpdateSchema.parse(body);

    // If marking as read
    if (parsedData.action === 'mark_read') {
      const alreadyRead = announcement.readBy?.some(
        (userId: any) => userId.toString() === session.user.id
      );

      if (!alreadyRead) {
        announcement.readBy.push(new mongoose.Types.ObjectId(session.user.id));
        await announcement.save();
      }

      return NextResponse.json({
        success: true,
        data: {
          readByCount: announcement.readBy.length,
          readByMe: true,
        },
        message: 'Announcement marked as read',
      });
    }

    // Else: full update (Manager only)
    if (!hasPermission(session.user, 'hr_announcements', 'update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (parsedData.title !== undefined) announcement.title = parsedData.title;
    if (parsedData.content !== undefined) announcement.content = parsedData.content;
    if (parsedData.type !== undefined) announcement.type = parsedData.type;
    if (parsedData.priority !== undefined) announcement.priority = parsedData.priority;
    if (parsedData.targetAudience !== undefined) announcement.targetAudience = parsedData.targetAudience;
    if (parsedData.targetDepartments !== undefined) announcement.targetDepartments = parsedData.targetDepartments;
    if (parsedData.targetUsers !== undefined) {
      announcement.targetUsers = parsedData.targetUsers.map(uid => new mongoose.Types.ObjectId(uid));
    }
    if (parsedData.attachments !== undefined) announcement.attachments = parsedData.attachments;
    if (parsedData.isPinned !== undefined) announcement.isPinned = parsedData.isPinned;
    if (parsedData.expiresAt !== undefined) {
      announcement.expiresAt = parsedData.expiresAt ? new Date(parsedData.expiresAt) : undefined;
    }

    await announcement.save();

    return NextResponse.json({
      success: true,
      data: announcement,
      message: 'Announcement updated successfully',
    });

  } catch (error: any) {
    console.error('[ANNOUNCEMENT_ID_PUT] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_announcements', 'delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const { id } = await props.params;

    const announcement = await Announcement.findOne({ organizationId: orgId, _id: id });
    if (!announcement) {
      return NextResponse.json({ success: false, error: 'Announcement not found' }, { status: 404 });
    }

    announcement.isActive = false; // Soft delete
    await announcement.save();

    return NextResponse.json({
      success: true,
      data: announcement,
      message: 'Announcement deleted successfully (soft deleted)',
    });

  } catch (error: any) {
    console.error('[ANNOUNCEMENT_ID_DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
