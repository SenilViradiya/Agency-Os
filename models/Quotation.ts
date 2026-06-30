import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILineItem {
  _id?: mongoose.Types.ObjectId;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface IQuotation extends Document {
  organizationId: string;
  quotationNumber: string;
  leadId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  quotationDate: Date;
  validUntil: Date;
  lineItems: ILineItem[];
  subtotal: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue: number;
  discountAmount: number;
  gstApplicable: boolean;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  notes?: string;
  termsAndConditions?: string;
  sentAt?: Date;
  respondedAt?: Date;
  convertedToInvoiceId?: mongoose.Types.ObjectId;
  isDeleted?: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const QuotationSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    quotationNumber: { type: String, required: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    businessName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    quotationDate: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date, required: true },
    lineItems: [LineItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    discountType: { type: String, enum: ['percentage', 'fixed', null], default: null },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    gstApplicable: { type: Boolean, default: false },
    gstRate: { type: Number, default: 18 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'],
      default: 'draft',
    },
    notes: { type: String },
    termsAndConditions: { type: String },
    sentAt: { type: Date },
    respondedAt: { type: Date },
    convertedToInvoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

QuotationSchema.index({ organizationId: 1, quotationNumber: 1 }, { unique: true });
QuotationSchema.index({ organizationId: 1, status: 1 });

const Quotation: Model<IQuotation> =
  mongoose.models.Quotation || mongoose.model<IQuotation>('Quotation', QuotationSchema);

export default Quotation;
