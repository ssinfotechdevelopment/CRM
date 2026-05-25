// src/models/salaryModel.js
import mongoose from "mongoose";

const salarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true,
    min: 0
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: 2100
  },
  // Leave tracking
  totalLeaves: {
    type: Number,
    default: 0
  },
  paidLeaves: {
    type: Number,
    default: 0
  },
  unpaidLeaves: {
    type: Number,
    default: 0
  },
  leaveDeduction: {
    type: Number,
    default: 0
  },
  // Overtime tracking
  totalOvertimeHours: {
    type: Number,
    default: 0
  },
  overtimePay: {
    type: Number,
    default: 0
  },
  // Final calculations
  finalSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending"
  },
  paidAt: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ["Bank Transfer", "Cash", "Cheque", "Online"],
    default: "Bank Transfer"
  },
  transactionId: {
    type: String
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, { 
  timestamps: true 
});

// Compound index for unique salary per employee per month
salarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Method to calculate daily rate (based on 24 working days per month)
salarySchema.methods.calculateDailyRate = function() {
  return this.baseSalary / 24;
};

// Method to calculate hourly rate (based on 9 hours per day)
salarySchema.methods.calculateHourlyRate = function() {
  return this.calculateDailyRate() / 9;
};

// Method to calculate salary with leaves and overtime
salarySchema.methods.calculateFinalSalary = function() {
  const dailyRate = this.calculateDailyRate();
  const hourlyRate = this.calculateHourlyRate();
  
  // Deduction for unpaid leaves
  this.leaveDeduction = this.unpaidLeaves * dailyRate;
  
  // Overtime pay (1.5x for overtime hours)
  this.overtimePay = this.totalOvertimeHours * hourlyRate * 1.5;
  
  // Final salary = base salary - leave deduction + overtime pay
  this.finalSalary = this.baseSalary - this.leaveDeduction + this.overtimePay;
  
  return this.finalSalary;
};

const Salary = mongoose.models.Salary || mongoose.model("Salary", salarySchema);

export default Salary;