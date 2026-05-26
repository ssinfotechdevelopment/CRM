// src/components/employee/DashboardEmployee.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";

import {
  RiDashboardHorizontalFill,
  RiTaskLine,
  RiCalendarScheduleLine,
  RiMenuLine,
  RiCloseLine,
} from "react-icons/ri";
import {
  FaBusinessTime,
  FaUserClock,
  FaTasks,
  FaFileSignature,
  FaMoneyBillWave,
  FaUserGraduate,
  FaUserPlus,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import { SiGoogletasks, SiGoogleforms } from "react-icons/si";
import { BsQrCodeScan } from "react-icons/bs";
import { FiSettings, FiLogOut } from "react-icons/fi";
import { IoMdAlert } from "react-icons/io";
import { MdSecurity, MdWarning } from "react-icons/md";

// Pages
import EmployeeAttendance from "../pages/EmployeeAttendance";
import EmployeeSettings from "../pages/EmployeeSettings";
import Expense from "../pages/Expense";
import QRStudentAttendance from "../pages/QRStudentAttendance";
import StudentAttendance from "../pages/StudentAttendance";
import TaskTracker from "../pages/TaskTracker";
import CourseManagement from "../pages/CourseMagement";
import StudentForm from "../../pages/StudentForm";
import EmployeeData from "../pages/EmployeeData";
import LeadManagement from "../pages/LeadManagement";
import LeaveApplicationForm from "../pages/LeaveApplicaationForm";
import EmployeeTasks from "../pages/EmployeeTasks";
import EmployeeSalaryDetails from "../pages/EmployeeSalaryDetails"; // 👈 ADD THIS IMPORT

/* ==================== DASHBOARD CONTENT ==================== */
const DashboardContent = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    attendanceRate: 0,
    workingHours: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickActionLoading, setQuickActionLoading] = useState(null);

  const token = localStorage.getItem("employeeToken");
  const employee = useMemo(() => {
    const data = localStorage.getItem("employeeData");
    return data ? JSON.parse(data) : null;
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [tasksRes, attRes] = await Promise.all([
        fetch("/api/employee/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/employee/attendance", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const tasksJson = tasksRes.ok ? await tasksRes.json() : { success: false, tasks: [] };
      const attJson = attRes.ok ? await attRes.json() : { success: false, attendance: [] };

      if (tasksJson.success) {
        const tasks = tasksJson.tasks || [];
        const completed = tasks.filter(t => t.status === "Completed").length;
        const pending = tasks.filter(t => ["Pending", "In Progress"].includes(t.status)).length;

        setRecentTasks(tasks.slice(0, 5));
        setStats(s => ({
          ...s,
          totalTasks: tasks.length,
          completedTasks: completed,
          pendingTasks: pending,
        }));
      }

      if (attJson.success) {
        const att = attJson.attendance || [];
        const recent = att.slice(0, 5);
        setRecentAttendance(recent);

        const totalHours = att.reduce((sum, r) => sum + (r.workingHours || 0), 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const last30 = att.filter(r => new Date(r.date) >= thirtyDaysAgo);
        const present = last30.filter(r => r.status === "Present").length;
        const rate = last30.length > 0 ? Math.round((present / last30.length) * 100) : 0;

        setStats(s => ({
          ...s,
          workingHours: Math.round(totalHours),
          attendanceRate: Math.min(rate, 100),
        }));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleQuickAction = async (action) => {
    if (!token) return;

    setQuickActionLoading(action);
    try {
      const endpoint = action === "clockIn" ? "clock-in" : "clock-out";
      const res = await fetch(`/api/employee/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Action failed");

      toast.success(data.message || `Clocked ${action === "clockIn" ? "in" : "out"} successfully!`);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setQuickActionLoading(null);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section - Responsive */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
          Welcome back, {employee?.name?.split(" ")[0] || "Employee"}!
        </h1>
        <p className="text-purple-100 text-sm sm:text-base">
          {employee?.employeeType === "Intern" 
            ? "Intern Dashboard - Limited Access Mode" 
            : "Here's your dashboard overview for today."}
        </p>
        <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4">
          {["Position", "Department", "Status", "Type"].map((label, i) => (
            <div key={i} className="bg-white/20 backdrop-blur-sm rounded-lg px-2 sm:px-4 py-1 sm:py-2">
              <p className="text-[10px] sm:text-xs opacity-90">{label}</p>
              <p className="text-xs sm:text-sm font-semibold">
                {label === "Department"
                  ? employee?.department === 1 ? "Sales"
                    : employee?.department === 2 ? "Marketing"
                      : employee?.department === 3 ? "Development" : "Other"
                  : label === "Status" ? employee?.status || "Active"
                  : label === "Type" ? employee?.employeeType || "Employee"
                    : employee?.position || "Employee"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        {[
          ...(employee?.employeeType !== "Intern" ? [
            { action: "clockIn", label: "Clock In", color: "green", icon: <FaUserClock className="text-sm sm:text-base" /> },
            { action: "clockOut", label: "Clock Out", color: "red", icon: <FaUserClock className="text-sm sm:text-base" /> },
          ] : []),
          { to: "/employee/dashboard/all/tasks", label: "My Tasks", color: "blue", icon: <FaTasks className="text-sm sm:text-base" /> },
          { to: "/employee/dashboard/attendance", label: "Attendance", color: "purple", icon: <RiCalendarScheduleLine className="text-sm sm:text-base" /> },
          { to: "/employee/dashboard/salary", label: "Salary", color: "indigo", icon: <FaMoneyBillWave className="text-sm sm:text-base" /> }, // 👈 ADD SALARY BUTTON
        ].map((btn, i) => (
          btn.to ? (
            <Link 
              key={i} 
              to={btn.to} 
              className={`bg-${btn.color}-500 hover:bg-${btn.color}-600 text-white p-2 sm:p-4 rounded-lg sm:rounded-xl flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-3 transition-colors text-center`}
            >
              <span className="text-sm sm:text-base">{btn.icon}</span> 
              <span className="text-xs sm:text-sm font-semibold">{btn.label}</span>
            </Link>
          ) : (
            <button 
              key={i} 
              onClick={() => handleQuickAction(btn.action)} 
              disabled={quickActionLoading === btn.action}
              className={`bg-${btn.color}-500 hover:bg-${btn.color}-600 disabled:bg-${btn.color}-400 text-white p-2 sm:p-4 rounded-lg sm:rounded-xl flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-3 transition-colors`}
            >
              {quickActionLoading === btn.action ? (
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
              ) : (
                <span className="text-sm sm:text-base">{btn.icon}</span>
              )}
              <span className="text-xs sm:text-sm font-semibold">
                {quickActionLoading === btn.action ? "..." : btn.label}
              </span>
            </button>
          )
        ))}
      </div>

      {/* Stats Cards - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[
          { label: "Total Tasks", value: stats.totalTasks, icon: <RiTaskLine className="text-xl sm:text-2xl" />, color: "blue", extra: `${stats.completedTasks} done • ${stats.pendingTasks} pending` },
          { label: "Attendance Rate", value: `${stats.attendanceRate}%`, icon: <FaBusinessTime className="text-xl sm:text-2xl" />, color: "green", progress: stats.attendanceRate },
          { label: "Working Hours", value: `${stats.workingHours}h`, icon: <RiCalendarScheduleLine className="text-xl sm:text-2xl" />, color: "purple" },
          { label: "Performance", value: `${employee?.performance ?? 0}%`, icon: <RiDashboardHorizontalFill className="text-xl sm:text-2xl" />, color: "orange" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">{stat.label}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2 sm:p-3 bg-${stat.color}-100 rounded-lg`}>
                <span className={`text-${stat.color}-600`}>{stat.icon}</span>
              </div>
            </div>
            {stat.progress !== undefined && (
              <div className="mt-3 sm:mt-4">
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div className={`bg-${stat.color}-600 h-1.5 sm:h-2 rounded-full transition-all duration-500`} style={{ width: `${stat.progress}%` }}></div>
                </div>
              </div>
            )}
            {stat.extra && <p className="mt-2 text-[10px] sm:text-xs text-gray-500">{stat.extra}</p>}
          </div>
        ))}
      </div>

      {/* Recent Sections - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[
          {
            title: "Recent Tasks", data: recentTasks, link: "/employee/dashboard/all/tasks", key: "_id", render: t => (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 gap-2">
                <div className="flex items-start sm:items-center space-x-3">
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mt-1 sm:mt-0 ${t.priority === "High" ? "bg-red-500" : t.priority === "Medium" ? "bg-yellow-500" : "bg-green-500"}`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">{t.title}</p>
                    <p className="text-xs text-gray-500">Due: {t.dueDate ? formatDate(t.dueDate) : "No due date"}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium self-start sm:self-center ${
                  t.status === "Completed" ? "bg-green-100 text-green-800" : 
                  t.status === "In Progress" ? "bg-blue-100 text-blue-800" : 
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {t.status}
                </span>
              </div>
            )
          },
          {
            title: "Recent Attendance", data: recentAttendance, link: "/employee/dashboard/attendance", key: "_id", render: r => (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 gap-2">
                <div>
                  <p className="font-medium text-sm sm:text-base">{formatDate(r.date)}</p>
                  <p className="text-xs text-gray-500">
                    {r.clockIn && `In: ${formatTime(r.clockIn)}`}
                    {r.clockOut && ` • Out: ${formatTime(r.clockOut)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    r.status === "Present" ? "bg-green-100 text-green-800" : 
                    r.status === "Absent" ? "bg-red-100 text-red-800" : 
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {r.status}
                  </span>
                  {r.workingHours && <p className="text-xs text-gray-500">{r.workingHours}h</p>}
                </div>
              </div>
            )
          }
        ].map((section, i) => (
          <div key={i} className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">{section.title}</h3>
              <Link to={section.link} className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {section.data.length > 0 ? section.data.map(item => (
                <div key={item[section.key]}>{section.render(item)}</div>
              )) : <p className="text-gray-500 text-center py-4 text-sm">No records found</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==================== MAIN LAYOUT ==================== */
const DashboardEmployee = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check screen size for responsive sidebar
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Check authentication on mount only
  useEffect(() => {
    const token = localStorage.getItem("employeeToken");
    if (!token) {
      navigate("/employee/login", { replace: true });
    }
  }, [navigate]);

  const employee = useMemo(() => {
    const raw = localStorage.getItem("employeeData");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("employeeData");
    localStorage.removeItem("userRole");
    localStorage.removeItem("employeeId");
    localStorage.removeItem("employeeEmail");
    navigate("/employee/login", { replace: true });
  };

  // Define all possible menu items
  const allMenuItems = [
    { path: "/employee/dashboard", label: "Dashboard", icon: <RiDashboardHorizontalFill className="text-base sm:text-xl" /> },
    { path: "/employee/dashboard/students", label: "Students Attendance", icon: <FaUserGraduate className="text-base sm:text-xl" /> },
    { path: "/employee/dashboard/attendance", label: "My Attendance", icon: <FaBusinessTime className="text-base sm:text-xl" /> },
    { path: "/employee/dashboard/QRstudentattendance", label: "Student QR", icon: <BsQrCodeScan className="text-base sm:text-xl" /> },
    { path: "/employee/dashboard/leaverequest", label: "Leave Request", icon: <SiGoogleforms className="text-base sm:text-xl" /> },
    { path: "/employee/dashboard/leadmanagement", label: "Lead Management", icon: <FaUserPlus className="text-base sm:text-xl" /> },
    { path: "/employee/dashboard/all/tasks", label: "My Tasks", icon: <SiGoogletasks className="text-base sm:text-xl" /> },
    { path: "/employee/dashboard/expense", label: "Expense", icon: <FaMoneyBillWave className="text-base sm:text-xl" /> },
    { path: "/employee/dashboard/salary", label: "Salary Details", icon: <FaMoneyBillWave className="text-base sm:text-xl" /> }, // 👈 ADD SALARY MENU ITEM
    { path: "/employee/dashboard/settings", label: "Settings", icon: <FiSettings className="text-base sm:text-xl" /> },
  ];

  // Filter menu items based on employeeType
  const getFilteredMenuItems = () => {
    if (!employee) return allMenuItems;
    
    if (employee.employeeType === "Intern") {
      return allMenuItems.filter(item => {
        const allowedRoutes = [
          "/employee/dashboard",
          "/employee/dashboard/attendance",
          "/employee/dashboard/leaverequest",
          "/employee/dashboard/leadmanagement",
          "/employee/dashboard/expense",
          "/employee/dashboard/all/tasks",
          "/employee/dashboard/salary", // 👈 ALLOW INTERNS TO VIEW SALARY
          "/employee/dashboard/settings",
        ];
        return allowedRoutes.includes(item.path);
      });
    }
    
    return allMenuItems;
  };

  const menuItems = getFilteredMenuItems();

  // Check if current route is allowed for the employee
  const isRouteAllowed = (path) => {
    if (!employee) return true;
    
    if (employee.employeeType === "Intern") {
      const allowedRoutes = [
        "/employee/dashboard",
        "/employee/dashboard/attendance",
        "/employee/dashboard/leaverequest",
        "/employee/dashboard/leadmanagement",
        "/employee/dashboard/expense",
        "/employee/dashboard/all/tasks",
        "/employee/dashboard/salary", // 👈 ALLOW INTERNS TO VIEW SALARY
        "/employee/dashboard/settings",
      ];
      
      if (path.startsWith("/employee/dashboard")) {
        return allowedRoutes.some(allowedPath => 
          path === allowedPath || path.startsWith(allowedPath + "/")
        );
      }
      
      return allowedRoutes.includes(path);
    }
    
    return true;
  };

  // Redirect if trying to access unauthorized route
  useEffect(() => {
    if (employee && !isRouteAllowed(location.pathname)) {
      navigate("/employee/dashboard", { replace: true });
    }
  }, [location.pathname, employee, navigate]);

  // Check authentication and redirect if needed
  if (!localStorage.getItem("employeeToken")) {
    return <Navigate to="/employee/login" replace />;
  }

  // Show unauthorized message if intern tries to access restricted pages
  const isIntern = employee?.employeeType === "Intern";
  const currentRoute = menuItems.find(i => i.path === location.pathname);
  const isRestrictedRoute = !currentRoute && location.pathname !== "/employee/dashboard";

  // Overlay for mobile sidebar
  const sidebarOverlay = sidebarOpen && isMobile && (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300"
      onClick={() => setSidebarOpen(false)}
    />
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar Overlay */}
      {sidebarOverlay}
      
      {/* Sidebar - Responsive */}
      <aside className={`fixed md:relative z-30 bg-gray-800 text-white transition-all duration-300 flex flex-col ${
        sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:translate-x-0 md:w-20"
      } h-full overflow-y-auto shadow-lg`}>
        <div className="p-3 sm:p-4 flex items-center justify-between border-b border-gray-700">
          {sidebarOpen && !isMobile && (
            <div className="flex-1">
              <h2 className="text-base sm:text-xl font-bold">Employee Portal</h2>
              {isIntern && (
                <p className="text-[10px] sm:text-xs text-yellow-300 mt-1">Intern Mode</p>
              )}
            </div>
          )}
          {sidebarOpen && isMobile && (
            <div className="flex-1">
              <h2 className="text-base font-bold">Menu</h2>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {sidebarOpen ? <FaChevronLeft className="text-sm sm:text-base" /> : <FaChevronRight className="text-sm sm:text-base" />}
          </button>
        </div>

        <nav className="mt-2 sm:mt-4 flex-1 overflow-y-auto">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`flex items-center p-3 sm:p-4 hover:bg-gray-700 transition-colors ${
                location.pathname === item.path ? "bg-gray-900 border-r-4 border-purple-500" : ""
              }`}
            >
              <span className="text-base sm:text-xl mr-2 sm:mr-3">{item.icon}</span>
              {(sidebarOpen || !isMobile) && <span className="text-xs sm:text-base">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {employee && (
          <div className="p-3 sm:p-4 border-t border-gray-700 bg-gray-900 text-xs sm:text-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm sm:text-base">{employee.name}</p>
                <p className="text-gray-400 text-[10px] sm:text-xs truncate">{employee.position}</p>
                <p className="text-gray-400 text-[10px] sm:text-xs truncate">
                  {employee.department === 1 ? "Sales" :
                    employee.department === 2 ? "Marketing" :
                      employee.department === 3 ? "Development" : "Other"}
                </p>
              </div>
              <div className="text-right ml-2">
                <p className={`text-[10px] sm:text-xs ${employee.status === "Active" ? "text-green-400" : "text-red-400"}`}>
                  {employee.status === "Active" ? "Active" : "Inactive"}
                </p>
                <p className={`text-[10px] sm:text-xs mt-1 ${employee.employeeType === "Intern" ? "text-yellow-400" : "text-blue-400"}`}>
                  {employee.employeeType === "Intern" ? "Intern" : "Employee"}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header - Responsive */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <RiMenuLine className="text-lg sm:text-xl" />
              </button>
              <div>
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800">
                  {currentRoute?.label || "Employee Dashboard"}
                </h1>
                {isIntern && (
                  <p className="text-[10px] sm:text-xs text-gray-500">Intern Access Mode</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {employee && (
                <div className="text-right hidden sm:block">
                  <p className="text-gray-700 font-medium text-sm sm:text-base">{employee.name}</p>
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-gray-500 text-xs">{employee.position}</p>
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-medium ${
                      employee.employeeType === "Intern" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {employee.employeeType === "Intern" ? "Intern" : "Employee"}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors font-medium text-sm sm:text-base flex items-center gap-1 sm:gap-2"
              >
                <FiLogOut className="text-sm sm:text-base" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50">
          {isRestrictedRoute ? (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MdWarning className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                As an intern, you don't have permission to access this page.
              </p>
              <Link
                to="/employee/dashboard"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors font-medium inline-block text-sm sm:text-base"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <Routes>
              <Route index element={<EmployeeData />} />
              
              {!isIntern && (
                <>
                  <Route path="students" element={<StudentAttendance />} />
                  <Route path="QRstudentattendance" element={<QRStudentAttendance />} />
                </>
              )}
              
              <Route path="attendance" element={<EmployeeAttendance />} />
              <Route path="leaverequest" element={<LeaveApplicationForm />} />
              <Route path="leadmanagement" element={<LeadManagement />} />
              <Route path="all/tasks" element={<EmployeeTasks />} />
              <Route path="expense" element={<Expense />} />
              <Route path="salary" element={<EmployeeSalaryDetails />} /> {/* 👈 ADD SALARY ROUTE */}
              <Route path="settings" element={<EmployeeSettings />} />
              
              <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
            </Routes>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardEmployee;