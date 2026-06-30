import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendor extends Document {
  organizationId: string;
  vendorNumber: string;
  name: string;
  vendorType:
    | 'freelance_editor'
    | 'freelance_shooter'
    | 'freelance_designer'
    | 'freelance_writer'
    | 'studio'
    | 'agency'
    | 'other';
  email: string;
  phone: string;
  whatsappNumber?: string;
  paymentMode: 'bank_transfer' | 'upi' | 'cheque' | 'cash';
  bankDetails: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  upiId?: string;
  defaultRateType: 'per_project' | 'per_day' | 'per_hour' | 'fixed_monthly';
  defaultRate: number;
  skills: string[];
  rating: number;
  status: 'active' | 'inactive';
  notes?: string;
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    vendorNumber: { type: String, required: true },
    name: { type: String, required: true },
    vendorType: {
      type: String,
      enum: [
        'freelance_editor',
        'freelance_shooter',
        'freelance_designer',
        'freelance_writer',
        'studio',
        'agency',
        'other',
      ],
      required: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    whatsappNumber: { type: String },
    paymentMode: {
      type: String,
      enum: ['bank_transfer', 'upi', 'cheque', 'cash'],
      required: true,
      default: 'bank_transfer',
    },
    bankDetails: {
      accountName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
    },
    upiId: { type: String },
    defaultRateType: {
      type: String,
      enum: ['per_project', 'per_day', 'per_hour', 'fixed_monthly'],
      required: true,
      default: 'per_project',
    },
    defaultRate: { type: Number, required: true, default: 0 },
    skills: [{ type: String }],
    rating: { type: Number, default: 5 },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    notes: { type: String },
    totalBilled: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalPending: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

VendorSchema.index({ organizationId: 1, vendorNumber: 1 }, { unique: true });
VendorSchema.index({ organizationId: 1, name: 1 });

const Vendor: Model<IVendor> =
  mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);

export default Vendor;
