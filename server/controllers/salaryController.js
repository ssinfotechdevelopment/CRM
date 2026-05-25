// src/controllers/salaryController.js
import Employee from "../models/employeeModel.js";
import Salary from "../models/salaryModel.js";
import Attendance from "../models/attendenceModel.js";
import Leave from "../models/leave.js";

// Helper function to calculate daily rate (24 working days per month)
const calculateDailyRate = (monthlySalary) => {
  return monthlySalary / 24;
};

// Helper function to calculate hourly rate (9 hours per day)
const calculateHourlyRate = (monthlySalary) => {
  return calculateDailyRate(monthlySalary) / 9;
};

// Helper function to calculate leave days from leave records
const calculateLeaveDays = (leaves, startDate, endDate) => {
  let totalLeaveDays = 0;
  
  leaves.forEach(leave => {
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    
    // Calculate leave days within the month range
    const effectiveStart = leaveStart < startDate ? startDate : leaveStart;
    const effectiveEnd = leaveEnd > endDate ? endDate : leaveEnd;
    
    if (effectiveStart <= effectiveEnd) {
      const days = Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;
      totalLeaveDays += days;
    }
  });
  
  return totalLeaveDays;
};

// Helper function to calculate total overtime hours
const calculateOvertimeHours = (attendanceRecords) => {
  let totalOvertimeHours = 0;
  
  attendanceRecords.forEach(record => {
    if (record.hoursWorked && record.hoursWorked > 9) {
      totalOvertimeHours += (record.hoursWorked - 9);
    }
  });
  
  return totalOvertimeHours;
};

// Calculate full salary breakdown for an employee
export const calculateSalaryBreakdown = async (req, res) => {
  const { id } = req.params; // employee ID
  const { month, year } = req.query;
  
  const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  
  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    
    // Date range for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    
    // Get attendance for the month
    const attendanceRecords = await Attendance.find({
      employeeId: id,
      date: { $gte: startDate, $lte: endDate }
    });
    
    // Get approved leaves for the month
    const leaveRecords = await Leave.find({
      employeeId: id,
      status: "approved",
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });
    
    // Calculate leave days
    const totalLeaveDays = calculateLeaveDays(leaveRecords, startDate, endDate);
    const PAID_LEAVES_ALLOWED = 2; // 2 paid leaves per month
    const paidLeaves = Math.min(totalLeaveDays, PAID_LEAVES_ALLOWED);
    const unpaidLeaves = Math.max(0, totalLeaveDays - PAID_LEAVES_ALLOWED);
    
    // Calculate overtime hours
    const totalOvertimeHours = calculateOvertimeHours(attendanceRecords);
    
    // Calculate rates
    const dailyRate = calculateDailyRate(employee.salary || 0);
    const hourlyRate = calculateHourlyRate(employee.salary || 0);
    
    // Calculate deductions and additions
    const leaveDeduction = unpaidLeaves * dailyRate;
    const overtimePay = totalOvertimeHours * hourlyRate * 1.5; // 1.5x for overtime
    
    // Final salary calculation
    const finalSalary = (employee.salary || 0) - leaveDeduction + overtimePay;
    
    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          position: employee.position,
          department: employee.department
        },
        month: targetMonth,
        year: targetYear,
        baseSalary: employee.salary || 0,
        attendance: {
          totalDays: attendanceRecords.length,
          presentDays: attendanceRecords.filter(r => r.status === "Present" || r.clockOut).length,
          absentDays: attendanceRecords.filter(r => r.status === "Absent" || (!r.clockIn && !r.clockOut)).length,
          lateDays: attendanceRecords.filter(r => r.status === "Late" || (r.clockIn && !r.clockOut)).length
        },
        leaves: {
          total: totalLeaveDays,
          paid: paidLeaves,
          unpaid: unpaidLeaves,
          deduction: leaveDeduction
        },
        overtime: {
          totalHours: totalOvertimeHours,
          rate: hourlyRate * 1.5,
          pay: overtimePay
        },
        rates: {
          dailyRate: dailyRate,
          hourlyRate: hourlyRate,
          overtimeRate: hourlyRate * 1.5
        },
        finalSalary: finalSalary,
        calculation: {
          formula: `${employee.salary} - ${leaveDeduction} + ${overtimePay} = ${finalSalary}`,
          breakdown: `${employee.salary} (Base) - ${unpaidLeaves}×${dailyRate.toFixed(2)} (Unpaid Leave) + ${totalOvertimeHours}×${(hourlyRate * 1.5).toFixed(2)} (Overtime)`
        }
      }
    });
    
  } catch (err) {
    console.error("Calculate salary breakdown error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Pay salary with automatic leave and overtime calculations
export const paySalary = async (req, res) => {
  const { id } = req.params; // employee ID
  const { month, year, notes, paymentMethod, transactionId } = req.body;
  
  const targetMonth = month || new Date().getMonth() + 1;
  const targetYear = year || new Date().getFullYear();
  
  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    
    // Check if salary already paid for this month
    const existingSalary = await Salary.findOne({
      employeeId: id,
      month: targetMonth,
      year: targetYear
    });
    
    if (existingSalary && existingSalary.status === "Paid") {
      return res.status(400).json({ 
        success: false, 
        message: `Salary already paid for ${targetMonth}/${targetYear}` 
      });
    }
    
    // Date range for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    
    // Get attendance for the month
    const attendanceRecords = await Attendance.find({
      employeeId: id,
      date: { $gte: startDate, $lte: endDate }
    });
    
    // Get approved leaves for the month
    const leaveRecords = await Leave.find({
      employeeId: id,
      status: "approved",
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });
    
    // Calculate leave days
    const totalLeaveDays = calculateLeaveDays(leaveRecords, startDate, endDate);
    const PAID_LEAVES_ALLOWED = 2;
    const paidLeaves = Math.min(totalLeaveDays, PAID_LEAVES_ALLOWED);
    const unpaidLeaves = Math.max(0, totalLeaveDays - PAID_LEAVES_ALLOWED);
    
    // Calculate overtime hours
    const totalOvertimeHours = calculateOvertimeHours(attendanceRecords);
    
    // Calculate rates
    const dailyRate = calculateDailyRate(employee.salary || 0);
    const hourlyRate = calculateHourlyRate(employee.salary || 0);
    
    // Calculate deductions and additions
    const leaveDeduction = unpaidLeaves * dailyRate;
    const overtimePay = totalOvertimeHours * hourlyRate * 1.5;
    
    // Final salary calculation
    const finalSalary = (employee.salary || 0) - leaveDeduction + overtimePay;
    
    // Update employee salary fields
    employee.paidSalary = (employee.paidSalary || 0) + finalSalary;
    employee.pendingSalary = Math.max(0, (employee.pendingSalary || 0) - finalSalary);
    await employee.save();
    
    // Create or update salary payment record
    const salaryRecord = await Salary.findOneAndUpdate(
      {
        employeeId: id,
        month: targetMonth,
        year: targetYear
      },
      {
        employeeId: id,
        employeeName: employee.name,
        baseSalary: employee.salary || 0,
        amount: finalSalary,
        month: targetMonth,
        year: targetYear,
        status: "Paid",
        paidAt: new Date(),
        paymentMethod: paymentMethod || "Bank Transfer",
        transactionId: transactionId || "",
        notes: notes || "",
        // Leave tracking fields
        totalLeaves: totalLeaveDays,
        paidLeaves: paidLeaves,
        unpaidLeaves: unpaidLeaves,
        leaveDeduction: leaveDeduction,
        // Overtime tracking fields
        totalOvertimeHours: totalOvertimeHours,
        overtimePay: overtimePay,
        finalSalary: finalSalary
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: `Salary paid successfully for ${targetMonth}/${targetYear}`,
      data: {
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          position: employee.position
        },
        month: targetMonth,
        year: targetYear,
        baseSalary: employee.salary,
        breakdown: {
          leaveDeduction: leaveDeduction,
          overtimePay: overtimePay,
          unpaidLeaves: unpaidLeaves,
          totalOvertimeHours: totalOvertimeHours
        },
        finalSalary: finalSalary,
        salaryRecord: salaryRecord,
        employeeStats: {
          totalPaid: employee.paidSalary,
          pendingSalary: employee.pendingSalary
        }
      }
    });
    
  } catch (err) {
    console.error("Pay salary error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get salary history for an employee with detailed breakdowns
export const getSalaryHistory = async (req, res) => {
  const { id } = req.params; // employee ID
  
  try {
    const salaryHistory = await Salary.find({ employeeId: id })
      .sort({ year: -1, month: -1 })
      .lean();
    
    const employee = await Employee.findById(id).select('name email position department salary');
    
    // Add summary statistics
    const totalPaid = salaryHistory.reduce((sum, record) => sum + (record.amount || 0), 0);
    const totalOvertimePaid = salaryHistory.reduce((sum, record) => sum + (record.overtimePay || 0), 0);
    const totalLeaveDeductions = salaryHistory.reduce((sum, record) => sum + (record.leaveDeduction || 0), 0);
    
    res.json({
      success: true,
      employee: employee,
      summary: {
        totalPaid: totalPaid,
        totalOvertimePaid: totalOvertimePaid,
        totalLeaveDeductions: totalLeaveDeductions,
        monthsPaid: salaryHistory.length
      },
      history: salaryHistory.map(record => ({
        ...record,
        monthName: new Date(record.year, record.month - 1, 1).toLocaleString('default', { month: 'long' })
      }))
    });
    
  } catch (err) {
    console.error("Get salary history error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get all salary records with filters and summary
export const getAllSalaryRecords = async (req, res) => {
  try {
    const { month, year, status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const salaryRecords = await Salary.find(filter)
      .populate('employeeId', 'name email position department salary')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Salary.countDocuments(filter);
    
    // Calculate summary statistics
    const summary = {
      totalSalaryPaid: salaryRecords.reduce((sum, r) => sum + (r.amount || 0), 0),
      totalOvertimePaid: salaryRecords.reduce((sum, r) => sum + (r.overtimePay || 0), 0),
      totalLeaveDeductions: salaryRecords.reduce((sum, r) => sum + (r.leaveDeduction || 0), 0),
      totalEmployees: salaryRecords.length,
      totalUnpaidLeaves: salaryRecords.reduce((sum, r) => sum + (r.unpaidLeaves || 0), 0),
      totalOvertimeHours: salaryRecords.reduce((sum, r) => sum + (r.totalOvertimeHours || 0), 0)
    };
    
    res.json({
      success: true,
      summary: summary,
      salaryRecords: salaryRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        recordsPerPage: parseInt(limit)
      }
    });
    
  } catch (err) {
    console.error("Get all salary records error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get salary record by ID with full details
export const getSalaryRecordById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const salaryRecord = await Salary.findById(id)
      .populate('employeeId', 'name email position department phone joiningDate salary')
      .lean();
    
    if (!salaryRecord) {
      return res.status(404).json({ success: false, message: "Salary record not found" });
    }
    
    // Add additional calculation details
    const dailyRate = calculateDailyRate(salaryRecord.baseSalary || salaryRecord.employeeId?.salary || 0);
    
    res.json({
      success: true,
      data: {
        ...salaryRecord,
        calculations: {
          dailyRate: dailyRate,
          hourlyRate: dailyRate / 9,
          monthlyWorkingDays: 24,
          dailyWorkingHours: 9
        }
      }
    });
    
  } catch (err) {
    console.error("Get salary record error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Update salary record
export const updateSalaryRecord = async (req, res) => {
  const { id } = req.params;
  const { amount, month, year, status, notes, paymentMethod, transactionId } = req.body;
  
  try {
    const salaryRecord = await Salary.findById(id);
    if (!salaryRecord) {
      return res.status(404).json({ success: false, message: "Salary record not found" });
    }
    
    const oldAmount = salaryRecord.amount;
    const newAmount = amount || salaryRecord.amount;
    
    // If amount changed, adjust employee's salary fields
    if (amount && amount !== oldAmount && salaryRecord.status === "Paid") {
      const employee = await Employee.findById(salaryRecord.employeeId);
      if (employee) {
        const amountDiff = newAmount - oldAmount;
        employee.paidSalary += amountDiff;
        employee.pendingSalary -= amountDiff;
        await employee.save();
      }
    }
    
    // Update salary record
    const updatedRecord = await Salary.findByIdAndUpdate(
      id,
      {
        amount: newAmount,
        finalSalary: newAmount,
        month: month || salaryRecord.month,
        year: year || salaryRecord.year,
        status: status || salaryRecord.status,
        notes: notes !== undefined ? notes : salaryRecord.notes,
        paymentMethod: paymentMethod || salaryRecord.paymentMethod,
        transactionId: transactionId || salaryRecord.transactionId,
        paidAt: status === "Paid" && salaryRecord.status !== "Paid" ? new Date() : salaryRecord.paidAt
      },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name email position department');
    
    res.json({
      success: true,
      message: "Salary record updated successfully",
      data: updatedRecord
    });
    
  } catch (err) {
    console.error("Update salary record error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Delete salary record
export const deleteSalaryRecord = async (req, res) => {
  const { id } = req.params;
  
  try {
    const salaryRecord = await Salary.findById(id);
    if (!salaryRecord) {
      return res.status(404).json({ success: false, message: "Salary record not found" });
    }
    
    // Adjust employee's salary fields if the record was paid
    if (salaryRecord.status === "Paid") {
      const employee = await Employee.findById(salaryRecord.employeeId);
      if (employee) {
        employee.paidSalary -= salaryRecord.amount;
        employee.pendingSalary += salaryRecord.amount;
        await employee.save();
      }
    }
    
    await Salary.findByIdAndDelete(id);
    
    res.json({ 
      success: true, 
      message: "Salary record deleted successfully" 
    });
    
  } catch (err) {
    console.error("Delete salary record error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get salary statistics with trends
export const getSalaryStatistics = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Get current month statistics
    const currentMonthStats = await Salary.aggregate([
      {
        $match: {
          year: currentYear,
          month: currentMonth,
          status: "Paid"
        }
      },
      {
        $group: {
          _id: null,
          totalSalary: { $sum: "$amount" },
          totalOvertime: { $sum: "$overtimePay" },
          totalDeductions: { $sum: "$leaveDeduction" },
          totalEmployees: { $sum: 1 },
          totalOvertimeHours: { $sum: "$totalOvertimeHours" },
          totalUnpaidLeaves: { $sum: "$unpaidLeaves" }
        }
      }
    ]);
    
    // Get current year statistics
    const yearlyStats = await Salary.aggregate([
      {
        $match: {
          year: currentYear,
          status: "Paid"
        }
      },
      {
        $group: {
          _id: null,
          totalSalary: { $sum: "$amount" },
          totalOvertime: { $sum: "$overtimePay" },
          totalDeductions: { $sum: "$leaveDeduction" },
          totalEmployees: { $sum: 1 }
        }
      }
    ]);
    
    // Monthly breakdown for current year
    const monthlyBreakdown = await Salary.aggregate([
      {
        $match: {
          year: currentYear,
          status: "Paid"
        }
      },
      {
        $group: {
          _id: { month: "$month" },
          totalSalary: { $sum: "$amount" },
          totalOvertime: { $sum: "$overtimePay" },
          totalDeductions: { $sum: "$leaveDeduction" },
          employeeCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.month": 1 }
      }
    ]);
    
    // Get pending salaries count
    const pendingCount = await Salary.countDocuments({ status: "Pending" });
    
    // Get employees with highest overtime
    const topOvertimeEmployees = await Salary.aggregate([
      {
        $match: {
          year: currentYear,
          status: "Paid"
        }
      },
      {
        $group: {
          _id: "$employeeId",
          totalOvertimeHours: { $sum: "$totalOvertimeHours" },
          totalOvertimePay: { $sum: "$overtimePay" }
        }
      },
      {
        $sort: { totalOvertimeHours: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employee"
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        currentMonth: {
          month: currentMonth,
          year: currentYear,
          ...currentMonthStats[0],
          averageSalary: currentMonthStats[0]?.totalSalary / currentMonthStats[0]?.totalEmployees || 0,
          averageOvertimeHours: currentMonthStats[0]?.totalOvertimeHours / currentMonthStats[0]?.totalEmployees || 0
        },
        yearlyTotal: yearlyStats[0] || { totalSalary: 0, totalOvertime: 0, totalDeductions: 0, totalEmployees: 0 },
        monthlyBreakdown: monthlyBreakdown.map(item => ({
          month: item._id.month,
          monthName: new Date(currentYear, item._id.month - 1, 1).toLocaleString('default', { month: 'long' }),
          totalSalary: item.totalSalary,
          totalOvertime: item.totalOvertime,
          totalDeductions: item.totalDeductions,
          employeeCount: item.employeeCount
        })),
        pendingCount: pendingCount,
        topOvertimeEmployees: topOvertimeEmployees.map(item => ({
          employee: item.employee[0],
          totalOvertimeHours: item.totalOvertimeHours,
          totalOvertimePay: item.totalOvertimePay
        }))
      }
    });
    
  } catch (err) {
    console.error("Get salary statistics error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get pending salaries (employees with pending payments)
export const getPendingSalaries = async (req, res) => {
  try {
    // Get pending salary records
    const pendingSalaryRecords = await Salary.find({
      status: "Pending"
    }).populate('employeeId', 'name email position department salary');
    
    // Get employees with pending salaries
    const employeesWithPending = await Employee.find({
      pendingSalary: { $gt: 0 }
    }).select('name email position department pendingSalary paidSalary salary');
    
    // Get current month pending status
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const currentMonthPending = await Salary.find({
      month: currentMonth,
      year: currentYear,
      status: "Pending"
    }).populate('employeeId', 'name email position');
    
    res.json({
      success: true,
      summary: {
        totalPendingRecords: pendingSalaryRecords.length,
        totalEmployeesWithPending: employeesWithPending.length,
        totalPendingAmount: employeesWithPending.reduce((sum, emp) => sum + (emp.pendingSalary || 0), 0),
        currentMonthPending: currentMonthPending.length
      },
      pendingRecords: pendingSalaryRecords,
      employeesWithPending: employeesWithPending,
      currentMonthPending: currentMonthPending
    });
    
  } catch (err) {
    console.error('Error fetching pending salaries:', err);
    res.status(500).json({
      success: false,
      message: "Error fetching pending salaries",
      error: err.message
    });
  }
};

// Bulk payroll processing for all employees
export const processBulkPayroll = async (req, res) => {
  const { month, year, paymentMethod } = req.body;
  
  const targetMonth = month || new Date().getMonth() + 1;
  const targetYear = year || new Date().getFullYear();
  
  try {
    // Get all active employees
    const employees = await Employee.find({ status: "active" });
    
    const results = [];
    const errors = [];
    
    for (const employee of employees) {
      try {
        // Date range for the month
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0);
        
        // Get attendance and leaves
        const [attendanceRecords, leaveRecords] = await Promise.all([
          Attendance.find({
            employeeId: employee._id,
            date: { $gte: startDate, $lte: endDate }
          }),
          Leave.find({
            employeeId: employee._id,
            status: "approved",
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
          })
        ]);
        
        // Calculate leave days
        const totalLeaveDays = calculateLeaveDays(leaveRecords, startDate, endDate);
        const PAID_LEAVES_ALLOWED = 2;
        const paidLeaves = Math.min(totalLeaveDays, PAID_LEAVES_ALLOWED);
        const unpaidLeaves = Math.max(0, totalLeaveDays - PAID_LEAVES_ALLOWED);
        
        // Calculate overtime
        const totalOvertimeHours = calculateOvertimeHours(attendanceRecords);
        
        // Calculate rates and final salary
        const dailyRate = calculateDailyRate(employee.salary || 0);
        const hourlyRate = calculateHourlyRate(employee.salary || 0);
        const leaveDeduction = unpaidLeaves * dailyRate;
        const overtimePay = totalOvertimeHours * hourlyRate * 1.5;
        const finalSalary = (employee.salary || 0) - leaveDeduction + overtimePay;
        
        // Update employee salary fields
        employee.paidSalary = (employee.paidSalary || 0) + finalSalary;
        employee.pendingSalary = Math.max(0, (employee.pendingSalary || 0) - finalSalary);
        await employee.save();
        
        // Create salary record
        const salaryRecord = await Salary.findOneAndUpdate(
          {
            employeeId: employee._id,
            month: targetMonth,
            year: targetYear
          },
          {
            employeeId: employee._id,
            employeeName: employee.name,
            baseSalary: employee.salary || 0,
            amount: finalSalary,
            month: targetMonth,
            year: targetYear,
            status: "Paid",
            paidAt: new Date(),
            paymentMethod: paymentMethod || "Bank Transfer",
            totalLeaves: totalLeaveDays,
            paidLeaves: paidLeaves,
            unpaidLeaves: unpaidLeaves,
            leaveDeduction: leaveDeduction,
            totalOvertimeHours: totalOvertimeHours,
            overtimePay: overtimePay,
            finalSalary: finalSalary
          },
          { upsert: true, new: true }
        );
        
        results.push({
          employee: employee.name,
          salary: finalSalary,
          status: "Success"
        });
        
      } catch (err) {
        errors.push({
          employee: employee.name,
          error: err.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Payroll processed for ${results.length} employees`,
      data: {
        totalProcessed: results.length,
        totalErrors: errors.length,
        totalAmount: results.reduce((sum, r) => sum + r.salary, 0),
        results: results,
        errors: errors
      }
    });
    
  } catch (err) {
    console.error("Bulk payroll processing error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};