// src/routes/employeeRoutes.js
import { Router } from "express";
import {
  getAll, createEmployee, updateEmployee, deleteEmployee,
  login, resetPassword, changePassword, getEmployeePassword,
  getTasks, addTask, updateTask, deleteTask, getEmployeeTasks, getEmployeeAttendance, getEmployeePerformance,
  getEmployeeById, getCurrentEmployee, updateProfile,updateTaskByEmployee,getEmployeeWithTasks,getMyTasks
} from "../controllers/employeeController.js";
import { protectEmployee } from "../middleware/authEmployee.js";
const router = Router();

// PUBLIC ROUTES - NO PROTECTION
router.post("/login", login);

// EMPLOYEE ROUTES - NO PROTECTION
router.get("/me",protectEmployee, getCurrentEmployee);
router.patch("/me/change-password",protectEmployee, changePassword);
router.patch("/me/update-profile", protectEmployee, updateProfile); 
// routes/employeeRoutes.js
router.get('/my/tasks',protectEmployee, getMyTasks);
router.get("/:id/tasks", getEmployeeWithTasks);
router.get("/task", getTasks);
router.post("/task", protectEmployee,addTask);
router.put("/employee/:employeeId/task/:taskId",protectEmployee, updateTaskByEmployee);
router.patch("/task/:id",protectEmployee, updateTask);
router.delete("/task/:id", protectEmployee,deleteTask);
router.get("/employee/:id/tasks", getEmployeeTasks);
router.get("/employee/:id/", getEmployeeById);

// ADMIN ROUTES - NO PROTECTION
router.get("/get/employee", getAll);
router.post("/create/employee", createEmployee);
router.patch("/update/:id", updateEmployee);
router.delete("/delete/:id", deleteEmployee);
router.post("/:id/reset-password", resetPassword);
router.get("/:id/password", getEmployeePassword);
router.get("/admin/employee/:id/tasks", getEmployeeTasks);
router.get("/employee/:id/performance", getEmployeePerformance);
router.get("/:id/tasks", getEmployeeTasks);
router.get("/:id/attendance", getEmployeeAttendance);
// In your attendance controller/routes
router.get("/admin/all-attendance", protectAdmin, async (req, res) => {
  try {
    // Fetch all attendance records with populated employee details
    const attendance = await Attendance.find()
      .populate('employeeId', 'name email department position loginId')
      .sort({ date: -1 });
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;