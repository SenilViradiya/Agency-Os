import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeadTimeline {
  action: string;
  note?: string;
  performedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ILead extends Document {
  organizationId: string;
  leadNumber: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  source: 'whatsapp' | 'referral' | 'cold_email' | 'cold_call' | 'instagram' | 'website' | 'other';
  referredBy?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';
  stage: string;
  priority: 'low' | 'medium' | 'high';
  budget: number;
  currency: string;
  industry: string;
  services: string[];
  notes?: string;
  lostReason?: string;
  followUpDate?: Date;
  assignedTo: mongoose.Types.ObjectId;
  convertedToClient: boolean;
  convertedClientId?: mongoose.Types.ObjectId;
  convertedAt?: Date;
  timeline: ILeadTimeline[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    leadNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    businessName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    whatsappNumber: { type: String },
    source: {
      type: String,
      enum: ['whatsapp', 'referral', 'cold_email', 'cold_call', 'instagram', 'website', 'other'],
      required: true,
    },
    referredBy: { type: String },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'],
      default: 'new',
    },
    stage: { type: String, default: 'new' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    budget: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    industry: { type: String },
    services: [{ type: String }],
    notes: { type: String },
    lostReason: { type: String },
    followUpDate: { type: Date },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    convertedToClient: { type: Boolean, default: false },
    convertedClientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    convertedAt: { type: Date },
    timeline: [
      {
        action: { type: String, required: true },
        note: { type: String },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Indexes
LeadSchema.index({ organizationId: 1, status: 1 });
LeadSchema.index({ organizationId: 1, assignedTo: 1 });

const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
