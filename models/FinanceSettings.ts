import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFinanceSettings extends Document {
  organizationId: string;
  companyName: string;
  companyAddress: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country: string;
  };
  companyEmail?: string;
  companyPhone?: string;
  companyLogo?: string;
  gstEnabled: boolean;
  gstNumber?: string;
  gstType?: 'regular' | 'composition' | null;
  bankDetails: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branch?: string;
  };
  upiId?: string;
  invoicePrefix: string;
  quotationPrefix: string;
  invoiceTermsAndConditions?: string;
  invoiceNotes?: string;
  defaultPaymentDueDays: number;
  currency: string;
  currencySymbol: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceSettingsSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, unique: true, index: true },
    companyName: { type: String, required: true },
    companyAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String, default: 'India' },
    },
    companyEmail: { type: String },
    companyPhone: { type: String },
    companyLogo: { type: String },
    gstEnabled: { type: Boolean, default: false },
    gstNumber: { type: String },
    gstType: { type: String, enum: ['regular', 'composition', null], default: null },
    bankDetails: {
      accountName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
      branch: { type: String },
    },
    upiId: { type: String },
    invoicePrefix: { type: String, default: 'INV' },
    quotationPrefix: { type: String, default: 'QUO' },
    invoiceTermsAndConditions: { type: String },
    invoiceNotes: { type: String },
    defaultPaymentDueDays: { type: Number, default: 7 },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const FinanceSettings: Model<IFinanceSettings> =
  mongoose.models.FinanceSettings ||
  mongoose.model<IFinanceSettings>('FinanceSettings', FinanceSettingsSchema);

export default FinanceSettings;
