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
router.post('/process-bulk-payroll', protect, processBulkPayroll);
router.post('/pay/:id', protect, paySalary);
router.get('/records', protect, getAllSalaryRecords);
router.get('/statistics', protect, getSalaryStatistics);
router.get('/pending', protect, getPendingSalaries);
router.put('/record/:id', protect, updateSalaryRecord);
router.delete('/record/:id', protect, deleteSalaryRecord);

// ==================== EMPLOYEE ACCESSIBLE ROUTES ====================
// 🔑 IMPORTANT: Employee can view their own salary data

// Get salary history - Employee can see their own
router.get('/history/:id', async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const isEmployee = token && localStorage.getItem('employeeToken');
  
  if (isEmployee) {
    // Check if employee is requesting their own data
    try {
      const employee = await Employee.findById(req.params.id);
      if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });
      
      // Use employee token to verify
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.id !== req.params.id) {
        return res.status(403).json({ success: false, message: "You can only view your own salary" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  } else {
    // Admin access - use protect middleware
    protect(req, res, next);
  }
}, getSalaryHistory);

// Calculate salary breakdown - Employee can see their own
router.get('/calculate/:id', async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const isEmployee = token && localStorage.getItem('employeeToken');
  
  if (isEmployee) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.id !== req.params.id) {
        return res.status(403).json({ success: false, message: "You can only view your own salary" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  } else {
    protect(req, res, next);
  }
}, calculateSalaryBreakdown);

// Get salary record by ID - Employee can see their own
router.get('/record/:id', async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const isEmployee = token && localStorage.getItem('employeeToken');
  
  if (isEmployee) {
    try {
      const salaryRecord = await Salary.findById(req.params.id);
      if (!salaryRecord) return res.status(404).json({ success: false, message: "Record not found" });
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.id !== salaryRecord.employeeId.toString()) {
        return res.status(403).json({ success: false, message: "You can only view your own salary records" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  } else {
    protect(req, res, next);
  }
}, getSalaryRecordById);

export default router;