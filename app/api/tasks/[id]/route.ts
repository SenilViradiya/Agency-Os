import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import ContentItem from '@/models/ContentItem';
import { hasPermission } from '@/lib/auth';
import mongoose from 'mongoose';

const PIPELINE_STAGES = [
  'script', 'shoot', 'edit',
  'thumbnail', 'caption', 'approval', 'publish'
];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'tasks', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const task = await Task.findById(id)
      .populate('assignedTo', 'name avatar email')
      .populate('createdBy', 'name avatar')
      .populate('reviewedBy', 'name avatar')
      .populate('comments.postedBy', 'name avatar')
      .lean();

    if (!task || task.organizationId !== (user as any).organizationId) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: task });
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
    if (!hasPermission(user, 'tasks', 'update')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    
    const task = await Task.findById(id);
    if (!task || task.organizationId !== (user as any).organizationId) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const oldStatus = task.status;
    const newStatus = body.status;

    // Handle status changes
    if (newStatus === 'done' && oldStatus !== 'done') {
      body.completedAt = new Date();
      
      // Pipeline auto-advance logic
      if (task.isPipelineTask && task.entityType === 'content_item' && task.entityId && task.pipelineStage) {
        const currentStage = task.pipelineStage;
        const nextStageIndex = PIPELINE_STAGES.indexOf(currentStage) + 1;
        const nextStage = PIPELINE_STAGES[nextStageIndex];

        const updateData: any = {
          [`stageStatuses.${currentStage}`]: 'done',
        };

        if (nextStage) {
          updateData.currentStage = nextStage;
          updateData[`stageStatuses.${nextStage}`] = 'in_progress';
          
          // Auto-create next task
          const nextTaskNumber = await generateNextTaskNumber((user as any).organizationId);
          const nextTask = await Task.create({
            organizationId: (user as any).organizationId,
            taskNumber: nextTaskNumber,
            title: `${nextStage.charAt(0).toUpperCase() + nextStage.slice(1)} — ${task.title.split('—')[1] || task.title}`,
            type: nextStage as any,
            isPipelineTask: true,
            pipelineStage: nextStage as any,
            entityType: 'content_item',
            entityId: task.entityId,
            assignedTo: task.assignedTo,
            status: 'todo',
            priority: task.priority,
            createdBy: (user as any).id,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days
          });
          
          updateData[`stageTasks.${nextStage}`] = nextTask._id;
        } else {
          updateData.currentStage = 'completed';
          updateData.status = 'approved'; // Or published depending on flow
        }

        await ContentItem.findByIdAndUpdate(task.entityId, updateData);
      }
    } else if (newStatus === 'in_progress' && oldStatus !== 'in_progress') {
       if (task.isPipelineTask && task.entityType === 'content_item' && task.entityId && task.pipelineStage) {
          await ContentItem.findByIdAndUpdate(task.entityId, {
            [`stageStatuses.${task.pipelineStage}`]: 'in_progress'
          });
       }
    }

    const updatedTask = await Task.findByIdAndUpdate(id, body, { returnDocument: 'after' });

    return NextResponse.json({ success: true, data: updatedTask });
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
    if (!hasPermission(user, 'tasks', 'delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const task = await Task.findById(id);
    if (!task || task.organizationId !== (user as any).organizationId) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Block deletion of in-progress pipeline tasks
    if (task.isPipelineTask && task.status !== 'todo') {
       return NextResponse.json({ 
         success: false, 
         error: 'Cannot delete a pipeline task that is already in progress or completed. Cancel it instead.' 
       }, { status: 400 });
    }

    await Task.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function generateNextTaskNumber(organizationId: string) {
    const lastTask = await Task.findOne({ organizationId }).sort({ createdAt: -1 });
    let nextNumber = 1;
    if (lastTask && lastTask.taskNumber) {
      const currentNumber = parseInt(lastTask.taskNumber.split('-')[1]);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }
    return `TSK-${nextNumber.toString().padStart(4, '0')}`;
}
