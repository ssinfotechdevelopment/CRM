// routes/salaryRoutes.js
import express from 'express';
import { protect } from '../middleware/auth.js';
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

// Apply protection to all routes
router.use(protect);

// ==================== PAYROLL PROCESSING ====================

// Process bulk payroll for all employees
router.post('/process-bulk-payroll', processBulkPayroll);

// Pay salary to employee (with automatic leave & overtime calculation)
router.post('/pay/:id', paySalary);

// Calculate salary breakdown without making payment (preview)
router.get('/calculate/:id', calculateSalaryBreakdown);

// ==================== PENDING SALARIES ====================

// Get pending salaries
router.get('/pending', getPendingSalaries);

// ==================== SALARY HISTORY ====================

// Get salary history for an employee
router.get('/history/:id', getSalaryHistory);

// Get all salary records with filters
router.get('/records', getAllSalaryRecords);

// Get salary record by ID
router.get('/record/:id', getSalaryRecordById);

// ==================== SALARY RECORD MANAGEMENT ====================

// Update salary record
router.put('/record/:id', updateSalaryRecord);

// Delete salary record
router.delete('/record/:id', deleteSalaryRecord);

// ==================== STATISTICS & REPORTS ====================

// Get salary statistics with trends
router.get('/statistics', getSalaryStatistics);

export default router;