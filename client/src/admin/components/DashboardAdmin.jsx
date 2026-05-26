// src/pages/DashboardAdmin.jsx
import React, { useState } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import ClientManagement from "../pages/ClientManagement";
import { PiCoins, PiChartLineUp, PiGearSix, PiBell, PiUserCircle } from "react-icons/pi";
import { IoLocationSharp, IoDocumentTextOutline, IoPeopleOutline, IoCalendarOutline } from "react-icons/io5";
import { GiExitDoor, GiHamburgerMenu } from "react-icons/gi";
import { HiOutlineX } from "react-icons/hi";
import { FiUsers, FiBookOpen, FiCalendar, FiBriefcase, FiTrendingUp, FiSettings, FiLogOut, FiUserPlus } from "react-icons/fi";
import { MdOutlineDashboard, MdOutlineSchool, MdOutlineMonitor, MdOutlineEvent, MdOutlineMonitorHeart } from "react-icons/md";
// Import your components
import StudentManagement from "../pages/StudentManagement";
import EmployeeManagement from "../pages/EmployeeManagement";
import CourseManagement from "../pages/CourseManagement";
import AttendanceManagement from "../pages/AttendanceManagement";
import ProjectManagement from "../pages/ProjectManagement";
import LeadInsensitiveManagement from "../pages/LeadInsensitiveManagement";
import Dashboard from "../pages/Dashboard ";
import ExpenseManagement from "../pages/ExpenseManagement";
import EmployeeLiveStatus from "../pages/EmployeeLiveStatus";
import AdminLeaveDashboard from "../pages/AdminLeaveDashboard";
import TaskAdmin from "../pages/TaskAdmin";
import AdminEventGuestManager from "../pages/AdminEventGuestManager";
import AdminAttendanceMonitor from "../pages/AdminAttendanceMonitor";
import SalaryManagement from "../pages/SalaryManagement"; // 👈 ADD THIS IMPORT

// Professional color palette
const colors = {
  primary: "#0A2540",
  primaryDark: "#051a2c",
  primaryLight: "#1a3a5a",
  accent: "#00A6B4",
  accentHover: "#008a96",
  textPrimary: "#1F2937",
  textSecondary: "#4B5563",
  textLight: "#9CA3AF",
  bgLight: "#F9FAFB",
  bgWhite: "#FFFFFF",
  borderLight: "#E5E7EB",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

// SVG Icons with professional styling
const DashboardIcon = ({ className = "w-5 h-5" }) => (
  <MdOutlineDashboard className={className} />
);

const StudentIcon = ({ className = "w-5 h-5" }) => (
  <MdOutlineSchool className={className} />
);

const EmployeeIcon = ({ className = "w-5 h-5" }) => (
  <FiUsers className={className} />
);

const CourseIcon = ({ className = "w-5 h-5" }) => (
  <FiBookOpen className={className} />
);

const AttendanceIcon = ({ className = "w-5 h-5" }) => (
  <FiCalendar className={className} />
);

const ProjectIcon = ({ className = "w-5 h-5" }) => (
  <FiBriefcase className={className} />
);

const ClientIcon = ({ className = "w-5 h-5" }) => (
  <IoPeopleOutline className={className} />
);

const LeadIcon = ({ className = "w-5 h-5" }) => (
  <FiTrendingUp className={className} />
);

const ReportIcon = ({ className = "w-5 h-5" }) => (
  <PiChartLineUp className={className} />
);

const SettingsIcon = ({ className = "w-5 h-5" }) => (
  <FiSettings className={className} />
);

const LogoutIcon = ({ className = "w-5 h-5" }) => (
  <FiLogOut className={className} />
);

const MenuIcon = ({ className = "w-5 h-5" }) => (
  <GiHamburgerMenu className={className} />
);

const CloseIcon = ({ className = "w-5 h-5" }) => (
  <HiOutlineX className={className} />
);

// New Icons for Event & Guest & Attendance Monitor
const EventIcon = ({ className = "w-5 h-5" }) => (
  <MdOutlineEvent className={className} />
);

const GuestIcon = ({ className = "w-5 h-5" }) => (
  <FiUserPlus className={className} />
);

const MonitorIcon = ({ className = "w-5 h-5" }) => (
  <MdOutlineMonitorHeart className={className} />
);

// 👈 ADD SALARY ICON
const SalaryIcon = ({ className = "w-5 h-5" }) => (
  <PiCoins className={className} />
);

/* ----------  MAIN DASHBOARD LAYOUT  ---------- */
const DashboardAdmin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("userRole");
    navigate("/admin");
  };

  const menuItems = [
    { path: ".", label: "Dashboard", icon: DashboardIcon },
    { path: "attendance-monitor", label: "Attendance Monitor", icon: MonitorIcon },
    { path: "salary-management", label: "Salary Management", icon: SalaryIcon }, // 👈 ADD THIS MENU ITEM
    { path: "employees", label: "Employee Management", icon: EmployeeIcon },
    { path: "student-management", label: "Student Management", icon: StudentIcon },
    { path: "monitoring-task", label: "Monitoring Task", icon: MdOutlineMonitor },
    { path: "employeeLiveStatus", label: "Employee Live Status", icon: IoLocationSharp },
    { path: "employeeLeaveStatus", label: "Leave Request", icon: GiExitDoor },
    { path: "project-management", label: "Project Management", icon: ProjectIcon },
    { path: "client-management", label: "Client Management", icon: ClientIcon },
    { path: "expense-management", label: "Expense Management", icon: PiCoins },
    { path: "leadinsensitivemanagement", label: "Lead Management", icon: LeadIcon },
    { path: "courses", label: "Course Management", icon: CourseIcon },
    { path: "attendance", label: "Attendance", icon: AttendanceIcon },
    { path: "events", label: "Event Management", icon: EventIcon },
    { path: "reports", label: "Reports & Analytics", icon: ReportIcon },
    { path: "settings", label: "Settings", icon: SettingsIcon },
  ];

  /* ----  PROTECTED ROUTE CHECK  ---- */
  const token = localStorage.getItem("adminToken");
  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  // Determine active item based on relative path
  const basePath = "/admin/dashboard";
  const cleanPath = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length) || "/"
    : "/";
  const isActive = (item) =>
    item.path === "." ? cleanPath === "/" : cleanPath === `/${item.path}`;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ----------  SIDEBAR  ---------- */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 
          ${sidebarOpen ? "w-72" : "w-20"} 
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          bg-gradient-to-b from-[#0A2540] to-[#051a2c] text-white 
          transition-all duration-300 flex flex-col shadow-2xl`}
      >
        {/* Sidebar Header */}
        <div className={`p-6 flex items-center ${sidebarOpen ? "justify-between" : "justify-center"} border-b border-white/10`}>
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00A6B4] to-[#008a96] rounded-xl flex items-center justify-center shadow-lg">
                <img src="/logo.jpg" alt="ssgroup" className="w-8 h-8 object-cover rounded-lg" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">SS Group</h2>
                <p className="text-xs text-[#00A6B4] font-medium">Admin Portal</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg hover:bg-white/10 transition-all duration-200 ${!sidebarOpen && "mx-auto"}`}
          >
            {sidebarOpen ? <CloseIcon className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 px-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path === "." ? "/admin/dashboard" : `/admin/dashboard/${item.path}`}
                className={`flex items-center p-3 rounded-xl transition-all duration-200 group
                  ${active
                    ? "bg-white/10 text-white shadow-lg border-l-4 border-[#00A6B4]"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <IconComponent
                  className={`w-5 h-5 transition-colors ${active ? "text-[#00A6B4]" : "text-gray-400 group-hover:text-white"}`}
                />
                {sidebarOpen && (
                  <span className={`ml-3 font-medium transition-colors ${active ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                    {item.label}
                  </span>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-14 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/10 mt-auto">
          <div className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"}`}>
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00A6B4] to-[#008a96] rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">Admin User</p>
                  <p className="text-xs text-gray-400 truncate">Administrator</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg hover:bg-red-500/20 transition-colors group relative
                ${sidebarOpen ? "text-red-400 hover:text-red-300" : "text-gray-400"}`}
              title="Logout"
            >
              <LogoutIcon className="w-5 h-5" />
              {!sidebarOpen && (
                <div className="absolute left-14 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ----------  MAIN CONTENT  ---------- */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFE]">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden text-gray-600"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                {menuItems.find((i) => isActive(i))?.label || "Admin Dashboard"}
              </h1>
            </div>

            <div className="flex items-center space-x-6">
              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-[#00A6B4] transition-colors">
                <PiBell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-700">Admin User</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-[#0A2540] to-[#1a3a5a] rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                  A
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route index element={<Dashboard />} />
              
              {/* Attendance Monitor */}
              <Route path="attendance-monitor" element={<AdminAttendanceMonitor />} />
              
              {/* 👇 NEW ROUTE - Salary Management */}
              <Route path="salary-management" element={<SalaryManagement />} />
              
              <Route path="student-management" element={<StudentManagement />} />
              <Route path="employees" element={<EmployeeManagement />} />
              <Route path="monitoring-task" element={<TaskAdmin />} />
              <Route path="courses" element={<CourseManagement />} />
              <Route path="attendance" element={<AttendanceManagement />} />
              <Route path="project-management" element={<ProjectManagement />} />
              <Route path="client-management" element={<ClientManagement />} />
              <Route path="expense-management" element={<ExpenseManagement />} />
              <Route path="employeeLiveStatus" element={<EmployeeLiveStatus />} />
              <Route path="employeeLeaveStatus" element={<AdminLeaveDashboard />} />
              <Route path="leadinsensitivemanagement" element={<LeadInsensitiveManagement />} />
              <Route path="events" element={<AdminEventGuestManager />} />
              <Route path="guests" element={<AdminEventGuestManager />} />
              <Route path="reports" element={
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-[#0A2540]/10 rounded-xl">
                      <PiChartLineUp className="w-6 h-6 text-[#0A2540]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
                  </div>
                  <p className="text-gray-600">Comprehensive reports and analytics will appear here...</p>
                </div>
              } />
              <Route path="settings" element={
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-[#0A2540]/10 rounded-xl">
                      <FiSettings className="w-6 h-6 text-[#0A2540]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
                  </div>
                  <p className="text-gray-600">System configuration and settings will appear here...</p>
                </div>
              } />
              <Route path="*" element={<Navigate to="." replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardAdmin;