import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
  organizationId: string;
  expenseNumber: string;
  category:
    | 'equipment'
    | 'software_subscription'
    | 'travel'
    | 'shoot_location'
    | 'office_rent'
    | 'utilities'
    | 'marketing'
    | 'salary'
    | 'vendor_payment'
    | 'misc'
    | 'other';
  title: string;
  description?: string;
  amount: number;
  expenseDate: Date;
  projectId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  paymentMode: 'bank_transfer' | 'upi' | 'cheque' | 'cash' | 'other';
  receiptUrl?: string;
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly' | null;
  status: 'pending' | 'approved' | 'paid';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  paidBy?: mongoose.Types.ObjectId;
  notes?: string;
  isDeleted?: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    expenseNumber: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'equipment',
        'software_subscription',
        'travel',
        'shoot_location',
        'office_rent',
        'utilities',
        'marketing',
        'salary',
        'vendor_payment',
        'misc',
        'other',
      ],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    expenseDate: { type: Date, required: true, default: Date.now },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    paymentMode: {
      type: String,
      enum: ['bank_transfer', 'upi', 'cheque', 'cash', 'other'],
      required: true,
    },
    receiptUrl: { type: String },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', null],
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid'],
      default: 'pending',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ organizationId: 1, expenseNumber: 1 }, { unique: true });
ExpenseSchema.index({ organizationId: 1, status: 1 });
ExpenseSchema.index({ organizationId: 1, category: 1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
