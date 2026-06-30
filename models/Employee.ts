import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEquipment {
  name: string;
  serialNumber: string;
  assignedDate: Date;
}

export interface ISalaryStructure {
  basicSalary: number;
  hra: number;
  allowances: number;
  totalFixedCTC: number;
  variableComponent: number;
  paymentMode: 'bank_transfer' | 'cash' | 'upi';
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  upiId: string;
}

export interface ILeaveBalance {
  annual: number;
  sick: number;
  casual: number;
  unpaid: number;
}

export interface IEmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IEmployee extends Document {
  organizationId: string;
  employeeNumber: string;
  userId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  personalEmail: string;
  emergencyContact: IEmergencyContact;
  address: IAddress;
  avatar: string;
  department: string;
  designation: string;
  employmentType: 'full_time' | 'part_time' | 'freelancer' | 'intern';
  joiningDate: Date;
  probationEndDate?: Date;
  confirmationDate?: Date;
  reportingManager?: mongoose.Types.ObjectId | IEmployee;
  skills: string[];
  equipmentAssigned: IEquipment[];
  salaryStructure: ISalaryStructure;
  leaveBalance: ILeaveBalance;
  status: 'active' | 'on_leave' | 'resigned' | 'terminated';
  exitDate?: Date;
  exitReason?: string;
  totalWorkingDays: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalLeaveDays: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    employeeNumber: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    whatsappNumber: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    bloodGroup: { type: String },
    personalEmail: { type: String },
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String },
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    avatar: { type: String },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'freelancer', 'intern'],
      required: true,
    },
    joiningDate: { type: Date, required: true },
    probationEndDate: { type: Date },
    confirmationDate: { type: Date },
    reportingManager: { type: Schema.Types.ObjectId, ref: 'Employee' },
    skills: [{ type: String }],
    equipmentAssigned: [
      {
        name: { type: String, required: true },
        serialNumber: { type: String, required: true },
        assignedDate: { type: Date, default: Date.now },
      },
    ],
    salaryStructure: {
      basicSalary: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      totalFixedCTC: { type: Number, default: 0 },
      variableComponent: { type: Number, default: 0 },
      paymentMode: {
        type: String,
        enum: ['bank_transfer', 'cash', 'upi'],
        default: 'bank_transfer',
      },
      bankDetails: {
        accountName: { type: String },
        accountNumber: { type: String },
        ifscCode: { type: String },
        bankName: { type: String },
      },
      upiId: { type: String },
    },
    leaveBalance: {
      annual: { type: Number, default: 12 },
      sick: { type: Number, default: 6 },
      casual: { type: Number, default: 6 },
      unpaid: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'resigned', 'terminated'],
      default: 'active',
      index: true,
    },
    exitDate: { type: Date },
    exitReason: { type: String },
    totalWorkingDays: { type: Number, default: 0 },
    totalPresentDays: { type: Number, default: 0 },
    totalAbsentDays: { type: Number, default: 0 },
    totalLeaveDays: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Unique employeeNumber or userId per organization
EmployeeSchema.index({ organizationId: 1, employeeNumber: 1 }, { unique: true });
EmployeeSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

const Employee: Model<IEmployee> = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);

export default Employee;
