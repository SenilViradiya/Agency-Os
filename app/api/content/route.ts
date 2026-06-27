import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ContentItem from '@/models/ContentItem';
import Task from '@/models/Task';
import { hasPermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    if (!hasPermission(user, 'projects', 'read')) { // Mapping content to projects module
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const currentStage = searchParams.get('currentStage');
    const contentType = searchParams.get('contentType');
    const assignedTo = searchParams.get('assignedTo');
    const month = searchParams.get('month'); // YYYY-MM
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = { organizationId: (user as any).organizationId };

    if (projectId) query.projectId = projectId;
    if (clientId) query.clientId = clientId;
    if (status) query.status = status;
    if (currentStage) query.currentStage = currentStage;
    if (contentType) query.contentType = contentType;
    if (assignedTo) query.assignedTo = assignedTo;
    
    if (month) {
      const start = new Date(`${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      query.plannedPublishDate = { $gte: start, $lt: end };
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ContentItem.find(query)
        .populate('projectId', 'name projectNumber')
        .populate('clientId', 'businessName')
        .populate('assignedTo', 'name avatar')
        .sort({ plannedPublishDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContentItem.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
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
    if (!hasPermission(user, 'projects', 'create')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const organizationId = (user as any).organizationId;

    // Auto-generate contentNumber
    const lastItem = await ContentItem.findOne({ organizationId }).sort({ createdAt: -1 });
    let nextNumber = 1;
    if (lastItem && lastItem.contentNumber) {
      const currentNumber = parseInt(lastItem.contentNumber.split('-')[1]);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }
    const contentNumber = `CNT-${nextNumber.toString().padStart(4, '0')}`;

    const contentData = {
      ...body,
      organizationId,
      contentNumber,
      currentStage: 'script',
      stageStatuses: {
        script: 'in_progress',
        shoot: 'pending',
        edit: 'pending',
        thumbnail: 'pending',
        caption: 'pending',
        approval: 'pending',
        publish: 'pending',
      },
      createdBy: (user as any).id,
    };

    const contentItem = await ContentItem.create(contentData);

    // Auto-create first Task (Script)
    const lastTask = await Task.findOne({ organizationId }).sort({ createdAt: -1 });
    let taskNextNumber = 1;
    if (lastTask && lastTask.taskNumber) {
      const currentTaskNumber = parseInt(lastTask.taskNumber.split('-')[1]);
      if (!isNaN(currentTaskNumber)) {
        taskNextNumber = currentTaskNumber + 1;
      }
    }
    const taskNumber = `TSK-${taskNextNumber.toString().padStart(4, '0')}`;

    const dueDate = body.plannedPublishDate 
      ? new Date(new Date(body.plannedPublishDate).getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const task = await Task.create({
      organizationId,
      taskNumber,
      title: `Script — ${contentItem.title}`,
      type: 'script',
      isPipelineTask: true,
      pipelineStage: 'script',
      entityType: 'content_item',
      entityId: contentItem._id,
      assignedTo: [contentItem.assignedTo],
      dueDate,
      status: 'in_progress',
      priority: contentItem.priority,
      createdBy: (user as any).id,
    });

    await ContentItem.findByIdAndUpdate(contentItem._id, {
      'stageTasks.script': task._id
    });

    return NextResponse.json({ success: true, data: { contentItem, task } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
