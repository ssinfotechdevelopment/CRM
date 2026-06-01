// routes/salaryRoutes.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import Employee from '../models/employeeModel.js';
import Salary from '../models/salaryModel.js';
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
// Middleware to check if employee is requesting their own data
const allowEmployeeAccess = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Try to verify as employee token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decoded.id;
    
    // Check if employee is requesting their own data
    if (req.params.id && employeeId !== req.params.id) {
      return res.status(403).json({ success: false, message: "You can only view your own salary data" });
    }
    
    // Attach employee to request
    req.employee = await Employee.findById(employeeId);
    next();
  } catch (err) {
    // If not employee token, try admin token via protect middleware
    protect(req, res, next);
  }
};

// Get salary history - Employee can see their own
router.get('/history/:id', allowEmployeeAccess, getSalaryHistory);

// Calculate salary breakdown - Employee can see their own
router.get('/calculate/:id', allowEmployeeAccess, calculateSalaryBreakdown);

// Get salary record by ID - Employee can see their own
router.get('/record/:id', allowEmployeeAccess, getSalaryRecordById);

export default router;