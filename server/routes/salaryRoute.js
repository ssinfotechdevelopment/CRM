// routes/salaryRoutes.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import { protectEmployee } from '../middleware/authEmployee.js';
import {
  paySalary,
  getSalaryHistory,
  getAllSalaryRecords,
  getSalaryRecordById,
  updateSalaryRecord,
  deleteSalaryRecord,
  getSalaryStatistics,
  getPendingSalaries,
  calculateSalaryBreakdown,
  processBulkPayroll
} from '../controllers/salaryController.js';

const router = express.Router();

// ==================== ADMIN ONLY ROUTES ====================
router.use(protect); // Admin authentication for all routes below

// Process bulk payroll for all employees (Admin only)
router.post('/process-bulk-payroll', processBulkPayroll);

// Pay salary to employee (Admin only)
router.post('/pay/:id', paySalary);

// Get all salary records with filters (Admin only)
router.get('/records', getAllSalaryRecords);

// Get salary statistics (Admin only)
router.get('/statistics', getSalaryStatistics);

// Get pending salaries (Admin only)
router.get('/pending', getPendingSalaries);

// Update salary record (Admin only)
router.put('/record/:id', updateSalaryRecord);

// Delete salary record (Admin only)
router.delete('/record/:id', deleteSalaryRecord);

// ==================== EMPLOYEE ACCESSIBLE ROUTES ====================
// These routes work with BOTH admin AND employee tokens

// Calculate salary breakdown (Employee can see their own)
router.get('/calculate/:id', async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const isEmployee = token && token === localStorage.getItem('employeeToken');
  
  // If employee, check if they're requesting their own data
  if (isEmployee) {
    const employeeId = req.employee?._id;
    if (employeeId && employeeId.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: "You can only view your own salary" });
    }
  }
  next();
}, calculateSalaryBreakdown);

// Get salary history (Employee can see their own)
router.get('/history/:id', async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const isEmployee = token && localStorage.getItem('employeeToken');
  
  // If employee, check if they're requesting their own data
  if (isEmployee) {
    const employeeId = req.employee?._id;
    if (employeeId && employeeId.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: "You can only view your own salary history" });
    }
  }
  next();
}, getSalaryHistory);

// Get salary record by ID (Employee can see their own)
router.get('/record/:id', async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const isEmployee = token && localStorage.getItem('employeeToken');
  
  // If employee, check if they're requesting their own record
  if (isEmployee) {
    const salaryRecord = await Salary.findById(req.params.id);
    if (salaryRecord && salaryRecord.employeeId.toString() !== req.employee?._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only view your own salary records" });
    }
  }
  next();
}, getSalaryRecordById);

export default router;