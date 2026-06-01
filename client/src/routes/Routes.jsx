import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "../pages/AdminLogin";
import EmployeeLogin from "../pages/EmployeeLogin";
import StudentForm from "../pages/StudentForm";
import DashboardAdmin from "../admin/components/DashboardAdmin";
import DashboardEmployee from "../employee/components/DashboardEmployee";
import AdminAttendanceMonitor from "../admin/pages/AdminAttendanceMonitor";
import SalaryManagement from "../admin/pages/SalaryManagement"; // 👈 ADD THIS IMPORT
import EmployeeDocumentation from "../employee/pages/Employeedocumentation";
import AdminEmployeeSalaryDetails from "../employee/pages/EmployeeSalaryDetails"; 
import EmployeeSalaryDetails from "../employee/pages/EmployeeSalaryDetails";

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  // Check for appropriate token based on role
  const adminToken = localStorage.getItem("adminToken");
  const employeeToken = localStorage.getItem("employeeToken");
  const userRole = localStorage.getItem("userRole");

  if (requiredRole === "admin") {
    if (!adminToken || userRole !== "admin") {
      return <Navigate to="/admin" replace />;
    }
  } else if (requiredRole === "employee") {
    if (!employeeToken || userRole !== "employee") {
      return <Navigate to="/employee/login" replace />;
    }
  } else {
    // Generic protection - require any valid token
    if (!adminToken && !employeeToken) {
      return <Navigate to="/employee/login" replace />;
    }
  }

  return children;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children, restrictedFor }) => {
  const adminToken = localStorage.getItem("adminToken");
  const employeeToken = localStorage.getItem("employeeToken");
  const userRole = localStorage.getItem("userRole");

  if (restrictedFor === "admin" && adminToken && userRole === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  if (restrictedFor === "employee" && employeeToken && userRole === "employee") {
    return <Navigate to="/employee/dashboard" replace />;
  }

  // If no specific restriction but user is authenticated, redirect to appropriate dashboard
  if (!restrictedFor && (adminToken || employeeToken)) {
    if (userRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === "employee") {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route 
      path="/" 
      element={
        <PublicRoute>
          <Navigate to="/employee/login" replace />
        </PublicRoute>
      } 
    />
    
    <Route path="/student-form" element={<StudentForm />} />
    
    {/* Admin Login */}
    <Route 
      path="/admin" 
      element={
        <PublicRoute restrictedFor="admin">
          <AdminLogin />
        </PublicRoute>
      } 
    />
    
    {/* Employee Login */}
    <Route 
      path="/employee/login" 
      element={
        <PublicRoute restrictedFor="employee">
          <EmployeeLogin />
        </PublicRoute>
      } 
    />
    
    {/* ==================== PROTECTED ADMIN ROUTES ==================== */}
    
    {/* Admin Dashboard */}
    <Route 
      path="/admin/dashboard/*" 
      element={
        <ProtectedRoute requiredRole="admin">
          <DashboardAdmin />
        </ProtectedRoute>
      } 
    />

    {/* Admin Attendance Monitor */}
    <Route 
      path="/admin/attendance-monitor" 
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminAttendanceMonitor />
        </ProtectedRoute>
      } 
    />

    {/* Admin Salary Management */}
    <Route 
      path="/admin/salary-management" 
      element={
        <ProtectedRoute requiredRole="admin">
          <SalaryManagement />
        </ProtectedRoute>
      } 
    />

    {/* Admin View Employee Salary Details (Admin can see any employee's salary) */}
    <Route 
      path="/admin/salary-details/:employeeId" 
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminEmployeeSalaryDetails />
        </ProtectedRoute>
      } 
    />
    
    {/* ==================== PROTECTED EMPLOYEE ROUTES ==================== */}
    
    {/* Employee Dashboard (All employee routes are inside this) */}
    <Route 
      path="/employee/dashboard/*" 
      element={
        <ProtectedRoute requiredRole="employee">
          <DashboardEmployee />
        </ProtectedRoute>
      } 
    />
    
    {/* Employee Task Route (Backward compatibility) */}
    <Route 
      path="/employee/task" 
      element={
        <ProtectedRoute requiredRole="employee">
          <EmployeeDocumentation />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/employee/documentation" 
      element={
        <ProtectedRoute requiredRole="employee">
          <DashboardEmployee />
        </ProtectedRoute>
      } 
    />
    
    {/* Employee Salary Details (Employee views their own salary) */}
    {/* This route is actually handled inside DashboardEmployee, but kept for direct access */}
    <Route 
      path="/employee/salary-details" 
      element={
        <ProtectedRoute requiredRole="employee">
          <EmployeeSalaryDetails />
        </ProtectedRoute>
      } 
    />
    
    {/* Catch all route - redirect to appropriate dashboard based on role */}
    <Route 
      path="*" 
      element={
        <Navigate to="/employee/login" replace />
      } 
    />
  </Routes>
);

export default AppRoutes;