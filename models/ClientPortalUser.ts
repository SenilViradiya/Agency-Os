import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClientPortalUser extends Document {
  organizationId: string;
  clientId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  designation?: string;
  phone?: string;
  status: 'active' | 'inactive';
  lastLogin?: Date;
  loginCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClientPortalUserSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    designation: { type: String },
    phone: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Ensure unique email per organization
ClientPortalUserSchema.index({ organizationId: 1, email: 1 }, { unique: true });

const ClientPortalUser: Model<IClientPortalUser> =
  mongoose.models.ClientPortalUser ||
  mongoose.model<IClientPortalUser>('ClientPortalUser', ClientPortalUserSchema);

export default ClientPortalUser;
