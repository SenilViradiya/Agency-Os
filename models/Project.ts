import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
  organizationId: string;
  projectNumber: string;
  name: string;
  description?: string;
  clientId: mongoose.Types.ObjectId;
  type: 'retainer' | 'campaign';
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  services: string[];
  platforms: string[];
  
  // Retainer-specific
  retainerMonth?: string; // e.g. "2025-01"
  contentQuota: {
    reels: number;
    shorts: number;
    youtubeVideos: number;
    posts: number;
    stories: number;
    other: number;
  };

  // Campaign-specific
  campaignObjective?: string;
  
  // Dates
  startDate: Date;
  endDate?: Date;
  deadline?: Date;

  // Budget
  budget: number;
  budgetSpent: number;

  // Team
  projectManager: mongoose.Types.ObjectId;
  teamMembers: mongoose.Types.ObjectId[];

  // Progress
  completionPercentage: number;
  totalTasks: number;
  completedTasks: number;

  // Meta
  tags: string[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    projectNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    type: {
      type: String,
      enum: ['retainer', 'campaign'],
      required: true,
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
      default: 'planning',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    services: [{ type: String }],
    platforms: [{ type: String }],
    retainerMonth: { type: String },
    contentQuota: {
      reels: { type: Number, default: 0 },
      shorts: { type: Number, default: 0 },
      youtubeVideos: { type: Number, default: 0 },
      posts: { type: Number, default: 0 },
      stories: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    campaignObjective: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    deadline: { type: Date },
    budget: { type: Number, default: 0 },
    budgetSpent: { type: Number, default: 0 },
    projectManager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    completionPercentage: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    tags: [{ type: String }],
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ProjectSchema.index({ organizationId: 1, status: 1 });
ProjectSchema.index({ organizationId: 1, clientId: 1 });

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
