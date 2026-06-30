import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendorBill extends Document {
  organizationId: string;
  billNumber: string;
  vendorId: mongoose.Types.ObjectId;
  vendorName: string;
  projectId?: mongoose.Types.ObjectId;
  contentItemId?: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  billDate: Date;
  dueDate: Date;
  status: 'pending' | 'approved' | 'paid';
  paymentMode?: string;
  paidAt?: Date;
  paidBy?: mongoose.Types.ObjectId;
  referenceNumber?: string;
  attachmentUrl?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VendorBillSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    billNumber: { type: String, required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    vendorName: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    contentItemId: { type: Schema.Types.ObjectId, ref: 'ContentItem' },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    billDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid'],
      default: 'pending',
    },
    paymentMode: { type: String },
    paidAt: { type: Date },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
    referenceNumber: { type: String },
    attachmentUrl: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

VendorBillSchema.index({ organizationId: 1, billNumber: 1 }, { unique: true });
VendorBillSchema.index({ organizationId: 1, vendorId: 1 });
VendorBillSchema.index({ organizationId: 1, status: 1 });

const VendorBill: Model<IVendorBill> =
  mongoose.models.VendorBill || mongoose.model<IVendorBill>('VendorBill', VendorBillSchema);

export default VendorBill;
