import mongoose, { Schema, Document, Model } from 'mongoose';
import { IRole } from './Role';

export interface IUser extends Document {
  organizationId: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  phone?: string;
  role: mongoose.Types.ObjectId | IRole;
  department: string;
  designation: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String },
    phone: { type: String },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Ensure unique email per organization
UserSchema.index({ organizationId: 1, email: 1 }, { unique: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
