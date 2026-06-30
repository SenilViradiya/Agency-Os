import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttachment {
  name: string;
  url: string;
}

export interface IAnnouncement extends Document {
  organizationId: string;
  title: string;
  content: string;
  type: 'general' | 'policy' | 'holiday' | 'event' | 'urgent';
  priority: 'low' | 'medium' | 'high';
  targetAudience: 'all' | 'department' | 'specific_users';
  targetDepartments: string[];
  targetUsers: mongoose.Types.ObjectId[];
  attachments: IAttachment[];
  isPinned: boolean;
  isActive: boolean;
  expiresAt?: Date;
  readBy: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['general', 'policy', 'holiday', 'event', 'urgent'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
      index: true,
    },
    targetAudience: {
      type: String,
      enum: ['all', 'department', 'specific_users'],
      default: 'all',
    },
    targetDepartments: [{ type: String }],
    targetUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    isPinned: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Announcement: Model<IAnnouncement> = mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

export default Announcement;
