import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyticsSnapshot {
  tasksAssigned: number;
  tasksCompleted: number;
  taskCompletionRate: number;
  onTimeDeliveryRate: number;
  contentItemsDelivered: number;
  totalRevisionsSent: number;
  approvalFirstPassRate: number;
}

export interface IRatings {
  workQuality: number;
  punctuality: number;
  teamwork: number;
  communication: number;
  initiative: number;
  overallRating: number;
}

export interface IPerformance extends Document {
  organizationId: string;
  employeeId: mongoose.Types.ObjectId;
  reviewedBy: mongoose.Types.ObjectId;
  month: string; // 'YYYY-MM'
  monthName: string;
  analyticsSnapshot: IAnalyticsSnapshot;
  ratings: IRatings;
  strengths: string;
  improvements: string;
  goalsForNextMonth: string;
  managerNotes?: string;
  selfRating?: number;
  selfReview?: string;
  status: 'draft' | 'published';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true, index: true }, // 'YYYY-MM'
    monthName: { type: String, required: true },
    analyticsSnapshot: {
      tasksAssigned: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
      taskCompletionRate: { type: Number, default: 0 },
      onTimeDeliveryRate: { type: Number, default: 0 },
      contentItemsDelivered: { type: Number, default: 0 },
      totalRevisionsSent: { type: Number, default: 0 },
      approvalFirstPassRate: { type: Number, default: 0 },
    },
    ratings: {
      workQuality: { type: Number, required: true },
      punctuality: { type: Number, required: true },
      teamwork: { type: Number, required: true },
      communication: { type: Number, required: true },
      initiative: { type: Number, required: true },
      overallRating: { type: Number, required: true },
    },
    strengths: { type: String, required: true },
    improvements: { type: String, required: true },
    goalsForNextMonth: { type: String, required: true },
    managerNotes: { type: String },
    selfRating: { type: Number },
    selfReview: { type: String },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Enforce unique review per employee per month
PerformanceSchema.index({ organizationId: 1, employeeId: 1, month: 1 }, { unique: true });

const Performance: Model<IPerformance> = mongoose.models.Performance || mongoose.model<IPerformance>('Performance', PerformanceSchema);

export default Performance;
