import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeave extends Document {
  organizationId: string;
  leaveNumber: string;
  employeeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  leaveType: 'annual' | 'sick' | 'casual' | 'unpaid' | 'other';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod?: 'morning' | 'afternoon' | null;
  reason: string;
  supportingDocument?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedAt: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  balanceDeducted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    leaveNumber: { type: String, required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: {
      type: String,
      enum: ['annual', 'sick', 'casual', 'unpaid', 'other'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true },
    isHalfDay: { type: Boolean, default: false },
    halfDayPeriod: { type: String, enum: ['morning', 'afternoon', null], default: null },
    reason: { type: String, required: true },
    supportingDocument: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    appliedAt: { type: Date, default: Date.now },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
    balanceDeducted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

LeaveSchema.index({ organizationId: 1, leaveNumber: 1 }, { unique: true });

const Leave: Model<ILeave> = mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);

export default Leave;
