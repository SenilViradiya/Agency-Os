import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ContentItem from '@/models/ContentItem';
import { hasPermission } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'projects', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const item = await ContentItem.findById(id)
      .populate('projectId', 'name projectNumber')
      .populate('clientId', 'businessName')
      .populate('assignedTo', 'name avatar email')
      .populate('stageTasks.script')
      .populate('stageTasks.shoot')
      .populate('stageTasks.edit')
      .populate('stageTasks.thumbnail')
      .populate('stageTasks.caption')
      .populate('stageTasks.approval')
      .populate('stageTasks.publish')
      .populate('comments.postedBy', 'name avatar')
      .lean();

    if (!item || item.organizationId !== (user as any).organizationId) {
      return NextResponse.json({ success: false, error: 'Content item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'projects', 'update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    
    const item = await ContentItem.findById(id);
    if (!item || item.organizationId !== (user as any).organizationId) {
      return NextResponse.json({ success: false, error: 'Content item not found' }, { status: 404 });
    }

    const updatedItem = await ContentItem.findByIdAndUpdate(id, body, { new: true });

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'projects', 'delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const item = await ContentItem.findById(id);
    if (!item || item.organizationId !== (user as any).organizationId) {
      return NextResponse.json({ success: false, error: 'Content item not found' }, { status: 404 });
    }

    if (!['draft', 'cancelled'].includes(item.status)) {
       return NextResponse.json({ 
         success: false, 
         error: 'Only draft or cancelled content items can be deleted.' 
       }, { status: 400 });
    }

    await ContentItem.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Content item deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
