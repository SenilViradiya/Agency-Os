import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPermission {
  module: string;
  actions: string[];
}

export interface IRole extends Document {
  organizationId: string;
  name: string;
  slug: string;
  permissions: IPermission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    permissions: [
      {
        module: { type: String, required: true },
        actions: [{ type: String }],
      },
    ],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure unique role slug per organization
RoleSchema.index({ organizationId: 1, slug: 1 }, { unique: true });

const Role: Model<IRole> = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);

export default Role;
