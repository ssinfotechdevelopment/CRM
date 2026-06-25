import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  RiDashboardFill,
  RiTaskLine,
  RiCalendarScheduleLine,
  RiLogoutBoxLine,
  RiUser3Line,
  RiMoneyDollarCircleLine,
  RiFileListLine,
  RiNotificationLine,
  RiSettingsLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
} from "react-icons/ri";
import { FaTasks, FaRegClock, FaRegFileAlt } from "react-icons/fa";
import { HiOutlineClipboardList } from "react-icons/hi";

const SidebarEmployee = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { 
      path: "/employee/dashboard", 
      label: "Dashboard", 
      icon: <RiDashboardFill />,
      description: "Overview & Stats"
    },
    { 
      path: "/employee/dashboard/task", 
      label: "Tasks", 
      icon: <RiTaskLine />,
      description: "Manage your tasks"
    },
    { 
      path: "/employee/dashboard/attendance", 
      label: "Attendance", 
      icon: <RiCalendarScheduleLine />,
      description: "Mark attendance"
    },
    { 
      path: "/employee/dashboard/leaves", 
      label: "Leave Requests", 
      icon: <HiOutlineClipboardList />,
      description: "Apply for leaves"
    },
    { 
      // 👇 NEW SALARY DETAILS OPTION
      path: "/employee/dashboard/salary", 
      label: "Salary Details", 
      icon: <RiMoneyDollarCircleLine />,
      description: "View salary & payslips"
    },
    { 
      path: "/employee/dashboard/reports", 
      label: "Reports", 
      icon: <RiFileListLine />,
      description: "Download reports"
    },
    { 
      path: "/employee/dashboard/profile", 
      label: "Profile", 
      icon: <RiUser3Line />,
      description: "Your information"
    },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("employeeToken");
      localStorage.removeItem("currentEmployee");
      localStorage.removeItem("userRole");
      localStorage.removeItem("employeeEmail");
      sessionStorage.clear();
      window.location.href = "/employee/login";
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Get current employee name from localStorage
  const currentEmployee = JSON.parse(localStorage.getItem("currentEmployee") || "{}");
  const employeeName = currentEmployee?.name || "Employee";
  const employeeRole = currentEmployee?.position || "Team Member";

  return (
    <>
      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 text-white flex flex-col shadow-2xl fixed left-0 top-0 z-50 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 bg-white text-purple-900 rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
        >
          {isCollapsed ? <RiMenuUnfoldLine size={18} /> : <RiMenuFoldLine size={18} />}
        </button>

        {/* Logo Section */}
        <div className={`p-6 border-b border-purple-700/50 transition-all duration-300 ${
          isCollapsed ? "px-4" : ""
        }`}>
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <FaTasks className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  EmpTrack
                </h1>
                <p className="text-xs text-purple-300">Employee Portal</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <FaTasks className="text-white text-xl" />
              </div>
            </div>
          )}
        </div>

        {/* Employee Profile (when expanded) */}
        {!isCollapsed && (
          <div className="p-4 border-b border-purple-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center shadow-md">
                <RiUser3Line className="text-white text-lg" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm truncate">{employeeName}</p>
                <p className="text-xs text-purple-300 truncate">{employeeRole}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-white/20 to-white/10 shadow-lg backdrop-blur-sm border border-white/20"
                    : "hover:bg-white/10"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.label : ""}
              >
                <span className={`text-xl ${isActive ? "text-yellow-300" : "text-purple-300 group-hover:text-white"}`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${isActive ? "text-white" : "text-purple-100"}`}>
                      {item.label}
                    </span>
                    <p className="text-xs text-purple-300/70">{item.description}</p>
                  </div>
                )}
                {isActive && !isCollapsed && (
                  <div className="w-1 h-8 bg-yellow-400 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-purple-700/50 p-4 space-y-2">
          {/* Notifications (when expanded) */}
          {!isCollapsed && (
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-all">
              <RiNotificationLine className="text-xl text-purple-300" />
              <span className="text-sm text-purple-100">Notifications</span>
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
            </button>
          )}

          {/* Settings (when expanded) */}
          {!isCollapsed && (
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-all">
              <RiSettingsLine className="text-xl text-purple-300" />
              <span className="text-sm text-purple-100">Settings</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-red-500/20 text-red-300 hover:text-red-200 ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? "Logout" : ""}
          >
            <RiLogoutBoxLine className="text-xl" />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </>
  );
};

export default SidebarEmployee;