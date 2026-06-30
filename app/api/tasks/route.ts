import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import ContentItem from '@/models/ContentItem';
import User from '@/models/User';
import { hasPermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'tasks', 'read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const isPipelineTask = searchParams.get('isPipelineTask');
    const pipelineStage = searchParams.get('pipelineStage');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = { organizationId: (user as any).organizationId };

    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (isPipelineTask) query.isPipelineTask = isPipelineTask === 'true';
    if (pipelineStage) query.pipelineStage = pipelineStage;
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignedTo', 'name avatar')
        .populate('createdBy', 'name avatar')
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'tasks', 'create')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const organizationId = (user as any).organizationId;

    // Auto-generate taskNumber
    const lastTask = await Task.findOne({ organizationId }).sort({ createdAt: -1 });
    let nextNumber = 1;
    if (lastTask && lastTask.taskNumber) {
      const currentNumber = parseInt(lastTask.taskNumber.split('-')[1]);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }
    const taskNumber = `TSK-${nextNumber.toString().padStart(4, '0')}`;

    const taskData = {
      ...body,
      organizationId,
      taskNumber,
      createdBy: (user as any).id,
    };

    const task = await Task.create(taskData);

    // If it's a pipeline task, link it to the content item
    if (task.isPipelineTask && task.entityType === 'content_item' && task.entityId && task.pipelineStage) {
      const stage = task.pipelineStage;
      await ContentItem.findByIdAndUpdate(task.entityId, {
        [`stageTasks.${stage}`]: task._id,
        [`stageStatuses.${stage}`]: 'in_progress',
        currentStage: stage,
      });
    }

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
