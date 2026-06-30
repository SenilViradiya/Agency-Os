import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayroll extends Document {
  organizationId: string;
  payrollNumber: string;
  employeeId: mongoose.Types.ObjectId;
  month: string; // 'YYYY-MM'
  year: number;
  monthName: string;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  overtimeHours: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  overtimePay: number;
  variablePay: number;
  variableReason?: string;
  absentDeduction: number;
  leaveDeduction: number;
  otherDeductions: number;
  deductionReason?: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  paidAt?: Date;
  paidBy?: mongoose.Types.ObjectId;
  paymentMode?: string;
  transactionId?: string;
  paymentNotes?: string;
  generatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    payrollNumber: { type: String, required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: String, required: true, index: true }, // 'YYYY-MM'
    year: { type: Number, required: true },
    monthName: { type: String, required: true },
    workingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    basicSalary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    variablePay: { type: Number, default: 0 },
    variableReason: { type: String },
    absentDeduction: { type: Number, default: 0 },
    leaveDeduction: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    deductionReason: { type: String },
    grossSalary: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'approved', 'paid'],
      default: 'draft',
      index: true,
    },
    paidAt: { type: Date },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
    paymentMode: { type: String },
    transactionId: { type: String },
    paymentNotes: { type: String },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Enforce unique employee payroll per month
PayrollSchema.index({ organizationId: 1, employeeId: 1, month: 1 }, { unique: true });
PayrollSchema.index({ organizationId: 1, payrollNumber: 1 }, { unique: true });

const Payroll: Model<IPayroll> = mongoose.models.Payroll || mongoose.model<IPayroll>('Payroll', PayrollSchema);

export default Payroll;
