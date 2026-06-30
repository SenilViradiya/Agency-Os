import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ContentItem from '@/models/ContentItem';
import Task from '@/models/Task';
import { hasPermission } from '@/lib/auth';

const PIPELINE_STAGES = [
  'script', 'shoot', 'edit',
  'thumbnail', 'caption', 'approval', 'publish'
];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { action, stage, notes } = await req.json();

    const item = await ContentItem.findById(id);
    if (!item || item.organizationId !== (user as any).organizationId) {
      return NextResponse.json({ success: false, error: 'Content item not found' }, { status: 404 });
    }

    const currentStage = item.currentStage;
    const currentTaskId = currentStage !== 'completed' ? (item.stageTasks as any)[currentStage] : null;

    if (action === 'advance') {
      // Mark current task as done
      if (currentTaskId) {
        await Task.findByIdAndUpdate(currentTaskId, { 
          status: 'done', 
          completedAt: new Date() 
        });
      }

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
          title: `${nextStage.charAt(0).toUpperCase() + nextStage.slice(1)} — ${item.title}`,
          type: nextStage as any,
          isPipelineTask: true,
          pipelineStage: nextStage as any,
          entityType: 'content_item',
          entityId: item._id,
          assignedTo: [item.assignedTo],
          status: 'todo',
          priority: item.priority,
          createdBy: (user as any).id,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days
        });
        
        (updateData as any)[`stageTasks.${nextStage}`] = (nextTask as any)._id;
      } else {
        updateData.currentStage = 'completed';
        updateData.status = 'published';
        updateData['publishData.publishedAt'] = new Date();
      }

      await ContentItem.findByIdAndUpdate(id, updateData);
    } 
    else if (action === 'skip') {
      if (!stage) return NextResponse.json({ success: false, error: 'Stage is required for skip' }, { status: 400 });

      const updateData: any = {
        [`stageStatuses.${stage}`]: 'skipped',
      };

      const nextStageIndex = PIPELINE_STAGES.indexOf(stage) + 1;
      const nextStage = PIPELINE_STAGES[nextStageIndex];

      if (nextStage) {
        updateData.currentStage = nextStage;
        updateData[`stageStatuses.${nextStage}`] = 'in_progress';
      }

      await ContentItem.findByIdAndUpdate(id, updateData);
    } 
    else if (action === 'revert') {
      const prevStageIndex = PIPELINE_STAGES.indexOf(currentStage) - 1;
      if (prevStageIndex < 0) return NextResponse.json({ success: false, error: 'Cannot revert from the first stage' }, { status: 400 });

      const prevStage = PIPELINE_STAGES[prevStageIndex];
      const updateData: any = {
        currentStage: prevStage,
        [`stageStatuses.${prevStage}`]: 'in_progress',
        $inc: { totalRevisions: 1 },
        $push: { 
          comments: { 
            stage: currentStage, 
            text: notes || `Reverted from ${currentStage} to ${prevStage}`, 
            postedBy: (user as any).id, 
            createdAt: new Date() 
          } 
        }
      };

      await ContentItem.findByIdAndUpdate(id, updateData);
    }

    const result = await ContentItem.findById(id);
    return NextResponse.json({ success: true, data: result });
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
