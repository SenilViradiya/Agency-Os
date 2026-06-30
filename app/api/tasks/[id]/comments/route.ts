import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import { hasPermission } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'tasks', 'update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ success: false, error: 'Comment text is required' }, { status: 400 });
    }

    const task = await Task.findById(id);
    if (!task || task.organizationId !== (user as any).organizationId) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const newComment = {
      text,
      postedBy: (user as any).id,
      createdAt: new Date(),
    };

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $push: { comments: newComment } },
      { new: true }
    ).populate('comments.postedBy', 'name avatar');

    const addedComment = updatedTask?.comments[updatedTask.comments.length - 1];

    return NextResponse.json({ success: true, data: addedComment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
