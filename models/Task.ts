import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
  organizationId: string;
  taskNumber: string;

  title: string;
  description?: string;

  // Generic entity linking
  entityType: 'project' | 'content_item' | 'lead' | 'client' | 'general';
  entityId?: mongoose.Types.ObjectId;

  // Pipeline task fields
  isPipelineTask: boolean;
  pipelineStage?: 'script' | 'shoot' | 'edit' | 'thumbnail' | 'caption' | 'approval' | 'publish';

  type: 'script' | 'shoot' | 'edit' | 'thumbnail' | 'caption' | 'approval' | 'publish' | 'review' | 'research' | 'meeting' | 'admin' | 'other';
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';

  assignedTo: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;

  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;

  estimatedHours: number;
  loggedHours: number;

  attachments: {
    name: string;
    url: string;
    type: 'image' | 'video' | 'document';
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
  }[];

  comments: {
    _id: mongoose.Types.ObjectId;
    text: string;
    postedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    editedAt?: Date;
  }[];

  checklist: {
    _id: mongoose.Types.ObjectId;
    text: string;
    isDone: boolean;
    completedAt?: Date;
  }[];

  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    taskNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },

    entityType: {
      type: String,
      enum: ['project', 'content_item', 'lead', 'client', 'general'],
      default: 'general',
    },
    entityId: { type: Schema.Types.ObjectId },

    isPipelineTask: { type: Boolean, default: false },
    pipelineStage: {
      type: String,
      enum: ['script', 'shoot', 'edit', 'thumbnail', 'caption', 'approval', 'publish'],
    },

    type: {
      type: String,
      enum: ['script', 'shoot', 'edit', 'thumbnail', 'caption', 'approval', 'publish', 'review', 'research', 'meeting', 'admin', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'done', 'blocked'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    startDate: { type: Date },
    dueDate: { type: Date },
    completedAt: { type: Date },

    estimatedHours: { type: Number, default: 0 },
    loggedHours: { type: Number, default: 0 },

    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video', 'document'], required: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    comments: [
      {
        text: { type: String, required: true },
        postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
        editedAt: { type: Date },
      },
    ],

    checklist: [
      {
        text: { type: String, required: true },
        isDone: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],

    tags: [{ type: String }],
  },
  { timestamps: true }
);

TaskSchema.index({ organizationId: 1, status: 1 });
TaskSchema.index({ organizationId: 1, assignedTo: 1 });
TaskSchema.index({ entityType: 1, entityId: 1 });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
