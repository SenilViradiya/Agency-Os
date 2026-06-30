import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  organizationId: string;
  paymentNumber: string;
  invoiceId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMode: 'bank_transfer' | 'upi' | 'cheque' | 'cash' | 'other';
  referenceNumber?: string;
  bankName?: string;
  notes?: string;
  receivedBy: mongoose.Types.ObjectId;
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    paymentNumber: { type: String, required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMode: {
      type: String,
      enum: ['bank_transfer', 'upi', 'cheque', 'cash', 'other'],
      required: true,
    },
    referenceNumber: { type: String },
    bankName: { type: String },
    notes: { type: String },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attachmentUrl: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ organizationId: 1, paymentNumber: 1 }, { unique: true });
PaymentSchema.index({ organizationId: 1, invoiceId: 1 });
PaymentSchema.index({ organizationId: 1, clientId: 1 });

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
