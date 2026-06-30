import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContentItem extends Document {
  organizationId: string;
  contentNumber: string;

  projectId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;

  title: string;
  description?: string;

  contentType: 'youtube_video' | 'reel' | 'short' | 'static_post' | 'carousel' | 'story' | 'podcast' | 'blog' | 'other';
  platforms: string[];

  currentStage: 'script' | 'shoot' | 'edit' | 'thumbnail' | 'caption' | 'approval' | 'publish' | 'completed';

  stageStatuses: {
    script: 'pending' | 'in_progress' | 'done' | 'skipped';
    shoot: 'pending' | 'in_progress' | 'done' | 'skipped';
    edit: 'pending' | 'in_progress' | 'done' | 'skipped';
    thumbnail: 'pending' | 'in_progress' | 'done' | 'skipped';
    caption: 'pending' | 'in_progress' | 'done' | 'skipped';
    approval: 'pending' | 'in_progress' | 'done' | 'skipped';
    publish: 'pending' | 'in_progress' | 'done' | 'skipped';
  };

  stageTasks: {
    script?: mongoose.Types.ObjectId;
    shoot?: mongoose.Types.ObjectId;
    edit?: mongoose.Types.ObjectId;
    thumbnail?: mongoose.Types.ObjectId;
    caption?: mongoose.Types.ObjectId;
    approval?: mongoose.Types.ObjectId;
    publish?: mongoose.Types.ObjectId;
  };

  scriptData?: {
    googleDocLink?: string;
    scriptText?: string;
    version: number;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
  };

  shootData?: {
    scheduledDate?: Date;
    location?: string;
    shooterAssigned?: mongoose.Types.ObjectId;
    rawFootageLink?: string;
    shootNotes?: string;
  };

  editData?: {
    editorAssigned?: mongoose.Types.ObjectId;
    draftVideoLink?: string;
    finalVideoLink?: string;
    editNotes?: string;
    version: number;
  };

  thumbnailData?: {
    designerAssigned?: mongoose.Types.ObjectId;
    thumbnailUrl?: string;
    version: number;
  };

  captionData?: {
    captionText?: string;
    hashtags: string[];
    mentions: string[];
    ctaText?: string;
  };

  approvalData: {
    submittedForReviewAt?: Date;
    submittedBy?: mongoose.Types.ObjectId;
    driveLink?: string;
    submissionNotes?: string;

    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;

    status: 'not_submitted' | 'pending_review' | 'approved' | 'revision_requested';
    approvedAt?: Date;
    approvalNotes?: string;

    revisionHistory: {
      revisionNumber: number;
      requestedBy: mongoose.Types.ObjectId;
      requestedAt: Date;
      revisionNotes: string;
      resolvedAt?: Date;
      driveLink?: string;
    }[];
    totalRevisions: number;
    currentRevisionNumber: number;
  };

  publishData: {
    scheduledAt?: Date;
    publishedAt?: Date;
    publishedBy?: mongoose.Types.ObjectId;
    publishedUrl?: string;
    platform?: string;
    platforms: {
      platform: string;
      url: string;
      publishedAt: Date;
    }[];
    publishNotes?: string;
    status: 'not_ready' | 'ready_to_publish' | 'scheduled' | 'published';
  };

  status: 'draft' | 'in_production' | 'in_approval' | 'pending_approval' | 'approved' | 'revision_requested' | 'published' | 'on_hold' | 'cancelled';
  plannedPublishDate?: Date;
  priority: 'low' | 'medium' | 'high';
  assignedTo: mongoose.Types.ObjectId;

  comments: {
    _id: mongoose.Types.ObjectId;
    stage: string;
    text: string;
    postedBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }[];

  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContentItemSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    contentNumber: { type: String, required: true, unique: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    title: { type: String, required: true },
    description: { type: String },

    contentType: {
      type: String,
      enum: ['youtube_video', 'reel', 'short', 'static_post', 'carousel', 'story', 'podcast', 'blog', 'other'],
      required: true,
    },
    platforms: [{ type: String }],

    currentStage: {
      type: String,
      enum: ['script', 'shoot', 'edit', 'thumbnail', 'caption', 'approval', 'publish', 'completed'],
      default: 'script',
    },

    stageStatuses: {
      script: { type: String, enum: ['pending', 'in_progress', 'done', 'skipped'], default: 'pending' },
      shoot: { type: String, enum: ['pending', 'in_progress', 'done', 'skipped'], default: 'pending' },
      edit: { type: String, enum: ['pending', 'in_progress', 'done', 'skipped'], default: 'pending' },
      thumbnail: { type: String, enum: ['pending', 'in_progress', 'done', 'skipped'], default: 'pending' },
      caption: { type: String, enum: ['pending', 'in_progress', 'done', 'skipped'], default: 'pending' },
      approval: { type: String, enum: ['pending', 'in_progress', 'done', 'skipped'], default: 'pending' },
      publish: { type: String, enum: ['pending', 'in_progress', 'done', 'skipped'], default: 'pending' },
    },

    stageTasks: {
      script: { type: Schema.Types.ObjectId, ref: 'Task' },
      shoot: { type: Schema.Types.ObjectId, ref: 'Task' },
      edit: { type: Schema.Types.ObjectId, ref: 'Task' },
      thumbnail: { type: Schema.Types.ObjectId, ref: 'Task' },
      caption: { type: Schema.Types.ObjectId, ref: 'Task' },
      approval: { type: Schema.Types.ObjectId, ref: 'Task' },
      publish: { type: Schema.Types.ObjectId, ref: 'Task' },
    },

    scriptData: {
      googleDocLink: { type: String },
      scriptText: { type: String },
      version: { type: Number, default: 1 },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
    },

    shootData: {
      scheduledDate: { type: Date },
      location: { type: String },
      shooterAssigned: { type: Schema.Types.ObjectId, ref: 'User' },
      rawFootageLink: { type: String },
      shootNotes: { type: String },
    },

    editData: {
      editorAssigned: { type: Schema.Types.ObjectId, ref: 'User' },
      draftVideoLink: { type: String },
      finalVideoLink: { type: String },
      editNotes: { type: String },
      version: { type: Number, default: 1 },
    },

    thumbnailData: {
      designerAssigned: { type: Schema.Types.ObjectId, ref: 'User' },
      thumbnailUrl: { type: String },
      version: { type: Number, default: 1 },
    },

    captionData: {
      captionText: { type: String },
      hashtags: [{ type: String }],
      mentions: [{ type: String }],
      ctaText: { type: String },
    },

    approvalData: {
      submittedForReviewAt: { type: Date },
      submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      driveLink: { type: String },
      submissionNotes: { type: String },

      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date },

      status: { 
        type: String, 
        enum: ['not_submitted', 'pending_review', 'approved', 'revision_requested'], 
        default: 'not_submitted' 
      },
      approvedAt: { type: Date },
      approvalNotes: { type: String },

      revisionHistory: [{
        revisionNumber: { type: Number },
        requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        requestedAt: { type: Date },
        revisionNotes: { type: String },
        resolvedAt: { type: Date },
        driveLink: { type: String },
      }],
      totalRevisions: { type: Number, default: 0 },
      currentRevisionNumber: { type: Number, default: 0 },
    },

    publishData: {
      scheduledAt: { type: Date },
      publishedAt: { type: Date },
      publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      publishedUrl: { type: String },
      platform: { type: String },
      platforms: [{
        platform: { type: String },
        url: { type: String },
        publishedAt: { type: Date }
      }],
      publishNotes: { type: String },
      status: { 
        type: String, 
        enum: ['not_ready', 'ready_to_publish', 'scheduled', 'published'], 
        default: 'not_ready' 
      },
    },

    status: {
      type: String,
      enum: ['draft', 'in_production', 'in_approval', 'pending_approval', 'approved', 'revision_requested', 'published', 'on_hold', 'cancelled'],
      default: 'draft',
    },
    plannedPublishDate: { type: Date },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    comments: [
      {
        stage: { type: String },
        text: { type: String, required: true },
        postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ContentItemSchema.index({ organizationId: 1, projectId: 1 });
ContentItemSchema.index({ organizationId: 1, status: 1 });

const ContentItem: Model<IContentItem> = mongoose.models.ContentItem || mongoose.model<IContentItem>('ContentItem', ContentItemSchema);

export default ContentItem;
