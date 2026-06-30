import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  organizationId: string;
  employeeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  month: string; // 'YYYY-MM'
  status: 'present' | 'absent' | 'half_day' | 'on_leave' | 'holiday' | 'work_from_home';
  checkIn?: Date;
  checkOut?: Date;
  totalHoursValue?: number; // Internal tracking helper
  totalHours: number;       // computed in hours, rounded
  overtime: number;
  notes?: string;
  markedBy: mongoose.Types.ObjectId;
  isManualEntry: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    month: { type: String, required: true, index: true }, // 'YYYY-MM'
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'on_leave', 'holiday', 'work_from_home'],
      required: true,
      index: true,
    },
    checkIn: { type: Date },
    checkOut: { type: Date },
    totalHours: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    notes: { type: String },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isManualEntry: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Unique index: an employee can only have one attendance record per day per organization
AttendanceSchema.index({ organizationId: 1, employeeId: 1, date: 1 }, { unique: true });

const Attendance: Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
