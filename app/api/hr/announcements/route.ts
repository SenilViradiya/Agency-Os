import { NextRequest, NextResponse } from 'next/server';
import { auth, hasPermission } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Announcement from '@/models/Announcement';
import User from '@/models/User';
import * as z from 'zod';

const announcementCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['general', 'policy', 'holiday', 'event', 'urgent']),
  priority: z.enum(['low', 'medium', 'high']),
  targetAudience: z.enum(['all', 'department', 'specific_users']),
  targetDepartments: z.array(z.string()).optional().default([]),
  targetUsers: z.array(z.string()).optional().default([]),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional().default([]),
  isPinned: z.boolean().optional().default(false),
  expiresAt: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);

    const type = searchParams.get('type');
    const priority = searchParams.get('priority');

    // Fetch user details for department/targeting checks
    const targetUser = await User.findById(session.user.id).lean();
    const userDept = targetUser?.department || '';

    const now = new Date();
    
    // Core query: isActive = true, in same organization, and not expired
    let query: any = {
      organizationId: orgId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    };

    const isManager = session.user.role === 'Super Admin' || session.user.role === 'Manager';
    
    // Filter by targeting if not a manager
    if (!isManager) {
      query.$and = [
        {
          $or: [
            { targetAudience: 'all' },
            { targetAudience: 'department', targetDepartments: userDept },
            { targetAudience: 'specific_users', targetUsers: session.user.id }
          ]
        }
      ];
    }

    if (type) query.type = type;
    if (priority) query.priority = priority;

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name avatar')
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    // Map to include readByMe flag
    const mappedAnnouncements = announcements.map((ann: any) => {
      const readByMe = ann.readBy?.some(
        (userId: any) => userId.toString() === session.user.id
      ) || false;
      return {
        ...ann,
        readByMe,
      };
    });

    // Count unread count
    const unreadCount = mappedAnnouncements.filter(ann => !ann.readByMe).length;

    return NextResponse.json({
      success: true,
      data: mappedAnnouncements,
      meta: {
        total: mappedAnnouncements.length,
        unreadCount
      }
    });

  } catch (error: any) {
    console.error('[ANNOUNCEMENTS_GET_API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user, 'hr_announcements', 'create')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const orgId = session.user.organizationId;
    const body = await req.json();
    const parsedData = announcementCreateSchema.parse(body);

    const newAnnouncement = new Announcement({
      ...parsedData,
      organizationId: orgId,
      expiresAt: parsedData.expiresAt ? new Date(parsedData.expiresAt) : undefined,
      readBy: [],
      createdBy: session.user.id,
      isActive: true,
    });

    await newAnnouncement.save();

    return NextResponse.json({
      success: true,
      data: newAnnouncement,
      message: 'Announcement posted successfully',
    });

  } catch (error: any) {
    console.error('[ANNOUNCEMENTS_POST_API] Error:', error);
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
