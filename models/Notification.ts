import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  organizationId: string;
  recipientId: mongoose.Types.ObjectId;
  type: 'approval_requested' | 'content_approved' | 'revision_requested' | 'content_published' | 'task_assigned' | 'task_due_soon';
  title: string;
  message: string;
  link: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['approval_requested', 'content_approved', 'revision_requested', 'content_published', 'task_assigned', 'task_due_soon'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
