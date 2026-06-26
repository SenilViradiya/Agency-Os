import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClient extends Document {
  organizationId: string;
  clientNumber: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  website?: string;
  industry?: string;
  logo?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country: string;
  };
  socialHandles: {
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    twitter?: string;
  };
  status: 'active' | 'inactive' | 'churned' | 'on_hold';
  tier: 'standard' | 'premium' | 'enterprise';
  services: string[];
  contractStartDate?: Date;
  contractEndDate?: Date;
  monthlyRetainerValue: number;
  totalRevenue: number;
  currency: string;
  assignedManager: mongoose.Types.ObjectId;
  assignedTeam: mongoose.Types.ObjectId[];
  sourceLeadId?: mongoose.Types.ObjectId;
  notes?: string;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    clientNumber: { type: String, required: true, unique: true },
    businessName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    whatsappNumber: { type: String },
    website: { type: String },
    industry: { type: String },
    logo: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String, default: 'India' },
    },
    socialHandles: {
      instagram: { type: String },
      youtube: { type: String },
      linkedin: { type: String },
      twitter: { type: String },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'churned', 'on_hold'],
      default: 'active',
    },
    tier: {
      type: String,
      enum: ['standard', 'premium', 'enterprise'],
      default: 'standard',
    },
    services: [{ type: String }],
    contractStartDate: { type: Date },
    contractEndDate: { type: Date },
    monthlyRetainerValue: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    assignedManager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTeam: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    sourceLeadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    notes: { type: String },
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ClientSchema.index({ organizationId: 1, status: 1 });
ClientSchema.index({ organizationId: 1, email: 1 });

const Client: Model<IClient> = mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);

export default Client;
