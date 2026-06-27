import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ContentItem from '@/models/ContentItem';
import Task from '@/models/Task';
import Project from '@/models/Project';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId } = await params;
    const { 
        publishedUrl, 
        platform, 
        publishedAt = new Date(), 
        publishNotes,
        additionalPlatforms = []
    } = await req.json();

    if (!publishedUrl) {
      return NextResponse.json({ success: false, error: 'Published URL is required' }, { status: 400 });
    }

    await dbConnect();

    const organizationId = (session.user as any).organizationId;
    const contentItem = await ContentItem.findOne({ _id: contentId, organizationId });

    if (!contentItem) {
      return NextResponse.json({ success: false, error: 'Content item not found' }, { status: 404 });
    }

    if (contentItem.publishData.status !== 'ready_to_publish' && contentItem.publishData.status !== 'scheduled') {
      return NextResponse.json({ success: false, error: 'Content is not ready to publish' }, { status: 400 });
    }

    // Update ContentItem
    contentItem.publishData.status = 'published';
    contentItem.publishData.publishedAt = new Date(publishedAt);
    contentItem.publishData.publishedBy = (session.user as any).id as any;
    contentItem.publishData.publishedUrl = publishedUrl;
    contentItem.publishData.platform = platform;
    contentItem.publishData.publishNotes = publishNotes;
    
    if (additionalPlatforms && additionalPlatforms.length > 0) {
        contentItem.publishData.platforms = additionalPlatforms.map((ap: any) => ({
            platform: ap.platform,
            url: ap.url,
            publishedAt: new Date(publishedAt)
        }));
    }

    contentItem.status = 'published';
    contentItem.currentStage = 'completed';
    contentItem.stageStatuses.publish = 'done';

    await contentItem.save();

    // Mark pipeline Task as done
    if (contentItem.stageTasks.publish) {
        await Task.findByIdAndUpdate(contentItem.stageTasks.publish, {
            status: 'done',
            completedAt: new Date()
        });
    }

    // Update parent Project
    const project = await Project.findById(contentItem.projectId);
    if (project) {
        // Recalculate completed tasks
        const completedTasks = await ContentItem.countDocuments({
            projectId: project._id,
            status: 'published'
        });
        
        const totalItems = await ContentItem.countDocuments({
            projectId: project._id
        });
        
        project.completedTasks = completedTasks;
        project.completionPercentage = totalItems > 0 ? Math.round((completedTasks / totalItems) * 100) : 0;
        
        if (project.completionPercentage === 100) {
            project.status = 'completed';
        }
        
        await project.save();
    }

    return NextResponse.json({ success: true, data: contentItem });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
