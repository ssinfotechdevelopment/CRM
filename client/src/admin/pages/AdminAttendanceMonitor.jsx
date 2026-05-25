// src/admin/components/AdminAttendanceMonitor.jsx (Updated - with Database Storage)

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  Search,
  Download,
  RefreshCw,
  UserCheck,
  UserX,
  TrendingUp,
  Clock3,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Gift,
  Heart,
  Briefcase,
  Sun,
  Edit,
  Save,
} from "lucide-react";
import { format, parseISO, isToday, isSameMonth, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isWeekend, addMonths, subMonths } from "date-fns";
import * as XLSX from "xlsx";
import { toast, Toaster } from "react-hot-toast";

const AdminAttendanceMonitor = () => {
  // ==================== ATTENDANCE STATE ====================
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("attendance");
  
  // ==================== LEAVE REQUESTS STATE ====================
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveFilter, setLeaveFilter] = useState("all");
  
  // ==================== HOLIDAY STATE (DATABASE STORED) ====================
  const [holidays, setHolidays] = useState([]);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [showEditHolidayModal, setShowEditHolidayModal] = useState(false);
  const [showDeleteHolidayModal, setShowDeleteHolidayModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [holidayMonth, setHolidayMonth] = useState(new Date());
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: "",
    type: "public",
    description: "",
  });
  
  const [summaryStats, setSummaryStats] = useState({
    totalEmployees: 0,
    clockedInNow: 0,
    completedToday: 0,
    absentToday: 0,
    avgHoursToday: 0,
  });

  const token = localStorage.getItem("adminToken");

  // Holiday Types
  const holidayTypes = {
    public: { name: "Public Holiday", icon: Calendar, color: "bg-red-100 text-red-700", bg: "bg-red-50", border: "border-red-200" },
    religious: { name: "Religious", icon: Heart, color: "bg-purple-100 text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
    festival: { name: "Festival", icon: Gift, color: "bg-pink-100 text-pink-700", bg: "bg-pink-50", border: "border-pink-200" },
    company: { name: "Company Event", icon: Briefcase, color: "bg-blue-100 text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    optional: { name: "Optional", icon: Sun, color: "bg-yellow-100 text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  };

  // ==================== FETCH HOLIDAYS FROM DATABASE ====================
  const fetchHolidays = useCallback(async () => {
    if (!token) return;
    setHolidayLoading(true);
    try {
      const response = await fetch("https://crm-backend-v2.onrender.com/api/holidays/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        let holidaysList = [];
        if (Array.isArray(data)) holidaysList = data;
        else if (data.holidays && Array.isArray(data.holidays)) holidaysList = data.holidays;
        else if (data.data && Array.isArray(data.data)) holidaysList = data.data;
        setHolidays(holidaysList);
        console.log("✅ Holidays loaded from database:", holidaysList.length);
      } else {
        console.error("Failed to fetch holidays");
        setHolidays([]);
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setHolidays([]);
    } finally {
      setHolidayLoading(false);
    }
  }, [token]);

  // ==================== ADD HOLIDAY TO DATABASE ====================
  const addHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      toast.error("Please fill holiday name and date");
      return;
    }

    try {
      const response = await fetch("https://crm-backend-v2.onrender.com/api/holidays/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newHoliday),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("✅ Holiday added to database!");
        setShowAddHolidayModal(false);
        setNewHoliday({ name: "", date: "", type: "public", description: "" });
        fetchHolidays(); // Refresh holidays from database
      } else {
        toast.error(data.error || "Failed to add holiday");
      }
    } catch (error) {
      console.error("Error adding holiday:", error);
      toast.error("Network error");
    }
  };

  // ==================== UPDATE HOLIDAY IN DATABASE ====================
  const updateHoliday = async () => {
    if (!selectedHoliday) return;
    
    try {
      const response = await fetch(`https://crm-backend-v2.onrender.com/api/holidays/update/${selectedHoliday._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedHoliday),
      });

      if (response.ok) {
        toast.success("✅ Holiday updated in database!");
        setShowEditHolidayModal(false);
        setSelectedHoliday(null);
        fetchHolidays();
      } else {
        toast.error("Failed to update holiday");
      }
    } catch (error) {
      console.error("Error updating holiday:", error);
      toast.error("Network error");
    }
  };

  // ==================== DELETE HOLIDAY FROM DATABASE ====================
  const deleteHoliday = async () => {
    if (!selectedHoliday) return;

    try {
      const response = await fetch(`https://crm-backend-v2.onrender.com/api/holidays/delete/${selectedHoliday._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("✅ Holiday deleted from database!");
        setShowDeleteHolidayModal(false);
        setSelectedHoliday(null);
        fetchHolidays();
      } else {
        toast.error("Failed to delete holiday");
      }
    } catch (error) {
      console.error("Error deleting holiday:", error);
      toast.error("Network error");
    }
  };

  // Get holiday for a specific date
  const getHolidayForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return holidays.find(h => h.date === dateStr);
  };

  // Calendar helpers
  const getDaysInMonth = () => {
    const start = startOfMonth(holidayMonth);
    const end = endOfMonth(holidayMonth);
    const days = eachDayOfInterval({ start, end });
    const leadingBlanks = getDay(start);
    return { days, leadingBlanks };
  };

  const { days: holidayDays, leadingBlanks: holidayLeadingBlanks } = getDaysInMonth();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousHolidayMonth = () => setHolidayMonth(prev => subMonths(prev, 1));
  const goToNextHolidayMonth = () => setHolidayMonth(prev => addMonths(prev, 1));
  const goToTodayHoliday = () => setHolidayMonth(new Date());

  // ==================== FETCH LEAVE REQUESTS ====================
  const fetchLeaveRequests = useCallback(async () => {
    if (!token) return;
    setLeaveLoading(true);
    try {
      const response = await fetch("https://crm-backend-v2.onrender.com/api/leaves/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        let leaves = [];
        if (Array.isArray(data)) leaves = data;
        else if (data.leaves && Array.isArray(data.leaves)) leaves = data.leaves;
        else if (data.data && Array.isArray(data.data)) leaves = data.data;
        setLeaveRequests(leaves);
      } else {
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      setLeaveRequests([]);
    } finally {
      setLeaveLoading(false);
    }
  }, [token]);

  const approveLeave = async (leaveId) => {
    try {
      const response = await fetch(`https://crm-backend-v2.onrender.com/api/leaves/${leaveId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "approved" }),
      });

      if (response.ok) {
        toast.success("Leave request approved");
        fetchLeaveRequests();
      } else {
        toast.error("Failed to approve leave");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const rejectLeave = async (leaveId) => {
    try {
      const response = await fetch(`https://crm-backend-v2.onrender.com/api/leaves/${leaveId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (response.ok) {
        toast.success("Leave request rejected");
        fetchLeaveRequests();
      } else {
        toast.error("Failed to reject leave");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // ==================== FETCH ATTENDANCE DATA ====================
  const fetchAllEmployees = useCallback(async () => {
    if (!token) return [];
    try {
      const response = await fetch("https://crm-backend-v2.onrender.com/api/employee/get/employee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : data.employees || data.data || [];
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
    return [];
  }, [token]);

  const fetchEmployeeAttendance = async (employeeId, token) => {
    try {
      const response = await fetch(
        `https://crm-backend-v2.onrender.com/api/attendance/admin/employee/${employeeId}/attendance`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        let records = [];
        if (Array.isArray(data)) records = data;
        else if (data.attendance && Array.isArray(data.attendance)) records = data.attendance;
        else if (data.data && Array.isArray(data.data)) records = data.data;
        return records;
      }
    } catch (error) {
      console.error(`Error fetching attendance:`, error);
    }
    return [];
  };

  const fetchAllAttendance = useCallback(async () => {
    if (!token) {
      toast.error("Admin not logged in");
      return;
    }
    
    setLoading(true);
    toast.loading("Fetching attendance data...", { id: "fetch-attendance" });
    
    try {
      const employees = await fetchAllEmployees();
      
      if (employees.length === 0) {
        toast.error("No employees found", { id: "fetch-attendance" });
        setLoading(false);
        return;
      }
      
      const allAttendanceRecords = [];
      
      for (const employee of employees) {
        const attendanceRecords = await fetchEmployeeAttendance(employee._id, token);
        
        attendanceRecords.forEach(record => {
          allAttendanceRecords.push({
            _id: record._id,
            employeeId: {
              _id: employee._id,
              name: employee.name,
              email: employee.email,
              department: employee.department,
              position: employee.position,
              loginId: employee.loginId,
            },
            date: record.date,
            clockIn: record.clockIn,
            clockOut: record.clockOut,
            hoursWorked: record.hoursWorked || 0,
            status: record.status || (record.clockIn && record.clockOut ? "Present" : record.clockIn ? "Late" : "Absent"),
            location: record.location,
          });
        });
      }
      
      allAttendanceRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAttendanceData(allAttendanceRecords);
      applyFilters(allAttendanceRecords, searchTerm, dateFilter, selectedMonth);
      toast.success(`Loaded ${allAttendanceRecords.length} attendance records`, { id: "fetch-attendance" });
      
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance data", { id: "fetch-attendance" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, fetchAllEmployees, searchTerm, dateFilter, selectedMonth]);

  const applyFilters = (data, term, filterType, month) => {
    let filtered = [...data];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filterType) {
      case "today":
        filtered = filtered.filter((rec) => isSameDay(parseISO(rec.date), today));
        break;
      case "month":
        filtered = filtered.filter((rec) => isSameMonth(parseISO(rec.date), month));
        break;
      default:
        break;
    }

    if (term.trim() !== "") {
      const lowerTerm = term.toLowerCase();
      filtered = filtered.filter((rec) => {
        const emp = rec.employeeId;
        return (
          emp?.name?.toLowerCase().includes(lowerTerm) ||
          emp?.email?.toLowerCase().includes(lowerTerm) ||
          emp?.loginId?.toLowerCase().includes(lowerTerm) ||
          emp?.position?.toLowerCase().includes(lowerTerm)
        );
      });
    }

    setFilteredRecords(filtered);
    calculateStats(data, filterType, month);
  };

  const calculateStats = (allData, filterType, month) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRecords = allData.filter((rec) => isSameDay(parseISO(rec.date), today));

    const uniqueEmpIds = new Set();
    todayRecords.forEach((rec) => {
      if (rec.employeeId?._id) uniqueEmpIds.add(rec.employeeId._id);
    });

    let clockedInCount = 0;
    let completedCount = 0;
    let totalHours = 0;

    todayRecords.forEach((rec) => {
      if (rec.clockIn) clockedInCount++;
      if (rec.clockIn && rec.clockOut) {
        completedCount++;
        totalHours += rec.hoursWorked || 0;
      }
    });

    const allUniqueEmployees = new Set();
    allData.forEach((rec) => {
      if (rec.employeeId?._id) allUniqueEmployees.add(rec.employeeId._id);
    });
    const totalEmployees = allUniqueEmployees.size || 0;
    const absentTodayCount = Math.max(0, totalEmployees - uniqueEmpIds.size);

    setSummaryStats({
      totalEmployees: totalEmployees,
      clockedInNow: clockedInCount,
      completedToday: completedCount,
      absentToday: absentTodayCount,
      avgHoursToday: completedCount > 0 ? parseFloat((totalHours / completedCount).toFixed(1)) : 0,
    });
  };

  const uniqueEmployeesForMonth = useMemo(() => {
    if (dateFilter !== "month") return [];
    
    const employees = new Map();
    filteredRecords.forEach(record => {
      if (!employees.has(record.employeeId._id)) {
        employees.set(record.employeeId._id, {
          ...record.employeeId,
          records: []
        });
      }
      employees.get(record.employeeId._id).records.push(record);
    });
    
    return Array.from(employees.values()).map(emp => {
      const records = emp.records;
      const presentDays = records.filter(r => r.status === "Present").length;
      const absentDays = records.filter(r => r.status === "Absent").length;
      const lateDays = records.filter(r => r.status === "Late").length;
      const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
      const totalDays = records.length;
      const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
      
      return {
        ...emp,
        presentDays,
        absentDays,
        lateDays,
        totalHours,
        attendancePercent,
        records
      };
    });
  }, [filteredRecords, dateFilter]);

  const filteredLeaves = useMemo(() => {
    if (leaveFilter === "all") return leaveRequests;
    return leaveRequests.filter(leave => leave.status === leaveFilter);
  }, [leaveRequests, leaveFilter]);

  const pendingCount = leaveRequests.filter(l => l.status === "pending").length;
  const approvedCount = leaveRequests.filter(l => l.status === "approved").length;
  const rejectedCount = leaveRequests.filter(l => l.status === "rejected").length;

  const handleViewDetails = (employee) => {
    setSelectedEmployeeDetails(employee);
    setShowDetailModal(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllAttendance();
    fetchLeaveRequests();
    fetchHolidays();
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  useEffect(() => {
    fetchAllAttendance();
    fetchLeaveRequests();
    fetchHolidays();
  }, []);

  useEffect(() => {
    if (attendanceData.length > 0) {
      applyFilters(attendanceData, searchTerm, dateFilter, selectedMonth);
    }
  }, [searchTerm, dateFilter, selectedMonth, attendanceData]);

  const exportToExcel = () => {
    if (filteredRecords.length === 0) {
      toast.error("No records to export");
      return;
    }

    const exportData = filteredRecords.map((rec) => ({
      "Employee Name": rec.employeeId?.name || "Unknown",
      "Email": rec.employeeId?.email || "-",
      "Department": getDepartmentName(rec.employeeId?.department),
      "Position": rec.employeeId?.position || "-",
      "Date": format(parseISO(rec.date), "dd MMM yyyy"),
      "Clock In": rec.clockIn ? format(parseISO(rec.clockIn), "hh:mm:ss a") : "--",
      "Clock Out": rec.clockOut ? format(parseISO(rec.clockOut), "hh:mm:ss a") : "--",
      "Hours Worked": rec.hoursWorked ? rec.hoursWorked.toFixed(2) : "0",
      "Status": rec.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance_Monitor");
    XLSX.writeFile(wb, `attendance_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Exported successfully");
  };

  const formatTime = (isoString) => {
    if (!isoString) return "--";
    return format(parseISO(isoString), "hh:mm a");
  };

  const getDepartmentName = (deptId) => {
    const departments = {
      1: "Sales", 2: "Marketing", 3: "Development",
      4: "HR", 5: "Finance", 6: "Operations"
    };
    return departments[deptId] || deptId || "--";
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "present":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Present</span>;
      case "absent":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Absent</span>;
      case "late":
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Late</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{status || "--"}</span>;
    }
  };

  const getLeaveStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Approved</span>;
      case "rejected":
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejected</span>;
      case "pending":
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, selectedMonth]);

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-7 h-7 text-indigo-600" />
                Employee Management Dashboard
              </h1>
              <p className="text-gray-500 text-sm mt-1">Attendance, Leave Requests & Holiday Calendar (Data stored in Database)</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition text-gray-700 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              {activeTab === "attendance" && (
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </button>
              )}
              {activeTab === "holidays" && (
                <button
                  onClick={() => setShowAddHolidayModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Holiday (Save to DB)
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards - Only show in attendance tab */}
          {activeTab === "attendance" && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <StatCard icon={UserCheck} label="Total Employees" value={summaryStats.totalEmployees} color="blue" />
              <StatCard icon={Clock3} label="Clocked In Today" value={summaryStats.clockedInNow} color="orange" />
              <StatCard icon={TrendingUp} label="Completed Today" value={summaryStats.completedToday} color="green" />
              <StatCard icon={UserX} label="Absent Today" value={summaryStats.absentToday} color="red" />
              <StatCard icon={Calendar} label="Avg Hours (Today)" value={`${summaryStats.avgHoursToday}h`} color="purple" />
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("attendance")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  activeTab === "attendance"
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                📋 Attendance & Leaves
              </button>
              <button
                onClick={() => setActiveTab("holidays")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  activeTab === "holidays"
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                📅 Holiday Calendar (Database)
              </button>
            </div>
          </div>

          {/* ==================== ATTENDANCE TAB CONTENT ==================== */}
          {activeTab === "attendance" && (
            <>
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">View:</span>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setDateFilter("today")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                          dateFilter === "today"
                            ? "bg-indigo-600 text-white shadow"
                            : "text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setDateFilter("month")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                          dateFilter === "month"
                            ? "bg-indigo-600 text-white shadow"
                            : "text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Month View
                      </button>
                    </div>
                    
                    {dateFilter === "month" && (
                      <div className="flex items-center gap-2 ml-2">
                        <button onClick={handlePreviousMonth} className="p-1 hover:bg-gray-100 rounded">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
                          {format(selectedMonth, "MMMM yyyy")}
                        </span>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full md:w-72 text-sm focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                </div>
              </div>

              {/* Two Column Layout for Table and Leaves */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Attendance Table Section */}
                <div className="lg:col-span-2">
                  {dateFilter === "today" && (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Employee</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Dept / Role</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Clock In</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Clock Out</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Hours</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                              <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {loading ? (
                              [...Array(6)].map((_, i) => (
                                <tr key={i}>
                                  <td colSpan={7} className="px-4 py-6 text-center">
                                    <div className="flex justify-center items-center gap-2 text-gray-400">
                                      <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : paginatedRecords.length === 0 ? (
                              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No records found</td></tr>
                            ) : (
                              paginatedRecords.map((record, idx) => (
                                <tr key={record._id || idx} className="hover:bg-gray-50 transition">
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-gray-800">{record.employeeId?.name || "—"}</p>
                                    <p className="text-xs text-gray-400">{record.employeeId?.email || ""}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{getDepartmentName(record.employeeId?.department)}</span>
                                    <p className="text-xs text-gray-500 mt-1">{record.employeeId?.position || ""}</p>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-sm">{formatTime(record.clockIn)}</td>
                                  <td className="px-4 py-3 font-mono text-sm">{formatTime(record.clockOut)}</td>
                                  <td className="px-4 py-3">{record.hoursWorked ? `${record.hoursWorked.toFixed(1)} hrs` : "--"}</td>
                                  <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                                  <td className="px-4 py-3 text-center">
                                    <button onClick={() => handleViewDetails({...record.employeeId, records: [record]})} className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50">
                                      <Eye className="w-4 h-4" />
                                    </button>
                                   </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {!loading && totalPages > 1 && (
                        <div className="flex justify-between items-center px-4 py-3 border-t">
                          <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 rounded disabled:opacity-40"><ChevronLeft className="w-5 h-5" /></button>
                          <span className="text-sm">Page {currentPage} of {totalPages}</span>
                          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 rounded disabled:opacity-40"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                      )}
                    </div>
                  )}

                  {dateFilter === "month" && (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr><th className="px-4 py-3 text-left">Employee</th><th className="px-4 py-3 text-left">Dept</th><th className="px-4 py-3 text-left">Position</th><th className="px-4 py-3 text-center">Present</th><th className="px-4 py-3 text-center">Absent</th><th className="px-4 py-3 text-center">Late</th><th className="px-4 py-3 text-center">Total Hours</th><th className="px-4 py-3 text-center">Attendance %</th><th className="px-4 py-3 text-center">Actions</th></tr></thead>
                          <tbody>
                            {loading ? <tr><td colSpan={9} className="text-center py-6"><RefreshCw className="w-4 h-4 animate-spin mx-auto" /></td></tr> :
                              uniqueEmployeesForMonth.map(emp => (
                                <tr key={emp._id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3"><p className="font-medium">{emp.name}</p><p className="text-xs text-gray-400">{emp.email}</p></td>
                                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-1 rounded">{getDepartmentName(emp.department)}</span></td>
                                  <td className="px-4 py-3 text-xs">{emp.position || "--"}</td>
                                  <td className="px-4 py-3 text-center text-green-600 font-semibold">{emp.presentDays}</td>
                                  <td className="px-4 py-3 text-center text-red-600 font-semibold">{emp.absentDays}</td>
                                  <td className="px-4 py-3 text-center text-yellow-600 font-semibold">{emp.lateDays}</td>
                                  <td className="px-4 py-3 text-center">{emp.totalHours.toFixed(1)}h</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`font-semibold ${emp.attendancePercent >= 75 ? "text-green-600" : emp.attendancePercent >= 50 ? "text-yellow-600" : "text-red-600"}`}>{emp.attendancePercent}%</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1 mx-auto"><div className={`h-1.5 rounded-full ${emp.attendancePercent >= 75 ? "bg-green-500" : emp.attendancePercent >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${emp.attendancePercent}%` }} /></div>
                                  </td>
                                  <td className="px-4 py-3 text-center"><button onClick={() => handleViewDetails(emp)} className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50"><Eye className="w-4 h-4" /></button></td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Leave Requests Section */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" /> Leave Requests</h3>
                      <button onClick={fetchLeaveRequests} className="p-1 text-gray-400 hover:text-gray-600"><RefreshCw className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <div className="flex-1 text-center p-1.5 bg-yellow-50 rounded-lg"><p className="text-xs text-yellow-600">Pending</p><p className="text-lg font-bold text-yellow-700">{pendingCount}</p></div>
                      <div className="flex-1 text-center p-1.5 bg-green-50 rounded-lg"><p className="text-xs text-green-600">Approved</p><p className="text-lg font-bold text-green-700">{approvedCount}</p></div>
                      <div className="flex-1 text-center p-1.5 bg-red-50 rounded-lg"><p className="text-xs text-red-600">Rejected</p><p className="text-lg font-bold text-red-700">{rejectedCount}</p></div>
                    </div>
                  </div>
                  <div className="p-3 border-b">
                    <div className="flex gap-1">
                      {["all", "pending", "approved", "rejected"].map(f => (
                        <button key={f} onClick={() => setLeaveFilter(f)} className={`flex-1 px-2 py-1 text-xs font-medium rounded-md capitalize ${leaveFilter === f ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{f}</button>
                      ))}
                    </div>
                  </div>
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {leaveLoading ? <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div> :
                      filteredLeaves.length === 0 ? <div className="p-8 text-center text-gray-400">No leave requests</div> :
                      filteredLeaves.map(leave => (
                        <div key={leave._id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div><p className="font-medium">{leave.employeeId?.name || "Unknown"}</p><p className="text-xs text-gray-500">{leave.employeeId?.department || "-"}</p></div>
                            {getLeaveStatusBadge(leave.status)}
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>📅 {format(parseISO(leave.startDate), "dd MMM")} - {format(parseISO(leave.endDate), "dd MMM yyyy")}</p>
                            <p>📝 {leave.reason || "No reason"}</p>
                            <p>⏱️ {leave.days || 1} day(s)</p>
                          </div>
                          {leave.status === "pending" && (
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => approveLeave(leave._id)} className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Approve</button>
                              <button onClick={() => rejectLeave(leave._id)} className="flex-1 px-2 py-1 bg-red-500 text-white rounded text-xs flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> Reject</button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ==================== HOLIDAY CALENDAR TAB CONTENT (DATABASE STORED) ==================== */}
          {activeTab === "holidays" && (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              {/* Calendar Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <button onClick={goToPreviousHolidayMonth} className="p-2 hover:bg-gray-200 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
                    <h2 className="text-xl font-semibold text-gray-800">{format(holidayMonth, "MMMM yyyy")}</h2>
                    <button onClick={goToNextHolidayMonth} className="p-2 hover:bg-gray-200 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                  <button onClick={goToTodayHoliday} className="px-3 py-1 text-sm bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200">Today</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">✅ Holidays are stored in database and visible to all employees</p>
              </div>

              {/* Calendar Body */}
              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day, idx) => (
                    <div key={idx} className={`text-center text-sm font-semibold py-2 ${idx === 0 || idx === 6 ? "text-red-500" : "text-gray-600"}`}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: holidayLeadingBlanks }).map((_, i) => <div key={`blank-${i}`} className="min-h-[100px] bg-gray-50 rounded-lg" />)}
                  {holidayDays.map((day, idx) => {
                    const holiday = getHolidayForDate(day);
                    const isWeekendDay = isWeekend(day);
                    const isCurrentDay = isToday(day);
                    const holidayType = holiday ? holidayTypes[holiday.type] : null;
                    return (
                      <div key={idx} className={`min-h-[100px] p-2 rounded-lg border transition-all cursor-pointer ${isCurrentDay ? "ring-2 ring-indigo-500" : ""} ${holiday ? holidayType.bg : isWeekendDay ? "bg-purple-50" : "bg-white"} ${holiday ? `border-l-4 ${holidayType.border}` : "border border-gray-100"} hover:shadow-md`} onClick={() => { if (holiday) { setSelectedHoliday(holiday); setShowEditHolidayModal(true); } }}>
                        <div className="flex justify-between items-start">
                          <span className={`text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full ${isCurrentDay ? "bg-indigo-600 text-white" : "text-gray-700"} ${isWeekendDay && !holiday ? "text-purple-600" : ""}`}>{format(day, "d")}</span>
                          {holiday && <div className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Holiday</div>}
                          {!holiday && isWeekendDay && <div className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">Weekend</div>}
                        </div>
                        {holiday && (<div className="mt-1"><p className="text-xs font-semibold text-gray-800">{holiday.name}</p><p className="text-xs text-gray-500 truncate">{holiday.description}</p><div className="mt-1"><span className={`text-xs px-1.5 py-0.5 rounded-full ${holidayType?.color}`}>{holidayType?.name}</span></div></div>)}
                        {!holiday && isWeekendDay && (<div className="mt-1"><p className="text-xs text-purple-600 font-medium">Weekend</p><p className="text-xs text-gray-400">No work</p></div>)}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs font-medium text-gray-700 mb-2">Legend (Database Stored):</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div><span className="text-xs text-gray-600">Weekend</span></div>
                    {Object.entries(holidayTypes).map(([key, value]) => (<div key={key} className="flex items-center gap-1.5"><div className={`w-3 h-3 ${value.bg} border ${value.border} rounded`}></div><span className="text-xs text-gray-600">{value.name}</span></div>))}
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-indigo-500 rounded-full"></div><span className="text-xs text-gray-600">Today</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div><span className="text-xs text-gray-600">Click to Edit</span></div>
                  </div>
                </div>
              </div>

              {/* Holiday List Table */}
              <div className="border-t">
                <div className="p-4 bg-gray-50"><h3 className="font-semibold text-gray-800">All Holidays from Database ({holidays.length})</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Holiday Name</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Day</th><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">Description</th><th className="px-4 py-3 text-center">Actions</th></tr></thead>
                    <tbody className="divide-y">
                      {holidayLoading ? <tr><td colSpan={6} className="text-center py-6"><RefreshCw className="w-5 h-5 animate-spin mx-auto" /> Loading from database...</td></tr> :
                        holidays.length === 0 ? <tr><td colSpan={6} className="text-center py-6 text-gray-400">No holidays in database. Click "Add Holiday" to create.</td></tr> :
                        [...holidays].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(holiday => {
                          const HolidayIcon = holidayTypes[holiday.type]?.icon || Calendar;
                          return (<tr key={holiday._id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{holiday.name}</td><td className="px-4 py-3">{format(parseISO(holiday.date), "dd MMM yyyy")}</td><td className="px-4 py-3">{format(parseISO(holiday.date), "EEEE")}</td><td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${holidayTypes[holiday.type]?.color || "bg-gray-100"}`}><HolidayIcon className="w-3 h-3 inline mr-1" />{holidayTypes[holiday.type]?.name || holiday.type}</span></td><td className="px-4 py-3 text-gray-500 text-xs">{holiday.description || "-"}</td><td className="px-4 py-3 text-center"><div className="flex gap-1 justify-center"><button onClick={() => { setSelectedHoliday(holiday); setShowEditHolidayModal(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button><button onClick={() => { setSelectedHoliday(holiday); setShowDeleteHolidayModal(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td></tr>);
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-400 text-center mt-6">
            📊 Last sync: {new Date().toLocaleTimeString()} | {activeTab === "attendance" ? (dateFilter === "today" ? "Today's attendance" : `Month: ${format(selectedMonth, "MMMM yyyy")}`) : "Holiday Calendar (Data stored in Database)"}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedEmployeeDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center sticky top-0">
              <div><h3 className="text-white font-semibold text-lg">Attendance Details</h3><p className="text-indigo-200 text-sm">{selectedEmployeeDetails.name} - {dateFilter === "month" ? format(selectedMonth, "MMMM yyyy") : format(new Date(), "dd MMM yyyy")}</p></div>
              <button onClick={() => setShowDetailModal(null)} className="text-white hover:text-indigo-200"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-3 text-center"><p className="text-xs text-green-600">Present</p><p className="text-2xl font-bold text-green-700">{selectedEmployeeDetails.records?.filter(r => r.status === "Present").length || (selectedEmployeeDetails.status === "Present" ? 1 : 0)}</p></div>
                <div className="bg-red-50 rounded-lg p-3 text-center"><p className="text-xs text-red-600">Absent</p><p className="text-2xl font-bold text-red-700">{selectedEmployeeDetails.records?.filter(r => r.status === "Absent").length || (selectedEmployeeDetails.status === "Absent" ? 1 : 0)}</p></div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center"><p className="text-xs text-yellow-600">Late</p><p className="text-2xl font-bold text-yellow-700">{selectedEmployeeDetails.records?.filter(r => r.status === "Late").length || (selectedEmployeeDetails.status === "Late" ? 1 : 0)}</p></div>
                <div className="bg-purple-50 rounded-lg p-3 text-center"><p className="text-xs text-purple-600">Total Hours</p><p className="text-2xl font-bold text-purple-700">{(selectedEmployeeDetails.records?.reduce((sum, r) => sum + (r.hoursWorked || 0), 0) || selectedEmployeeDetails.hoursWorked || 0).toFixed(1)}h</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Date</th><th className="px-4 py-2 text-left">Day</th><th className="px-4 py-2 text-left">Clock In</th><th className="px-4 py-2 text-left">Clock Out</th><th className="px-4 py-2 text-left">Hours</th><th className="px-4 py-2 text-left">Status</th></tr></thead>
                <tbody className="divide-y">{selectedEmployeeDetails.records ? selectedEmployeeDetails.records.sort((a,b)=>new Date(a.date)-new Date(b.date)).map((record, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-4 py-2">{format(parseISO(record.date), "dd MMM yyyy")}</td><td className="px-4 py-2">{format(parseISO(record.date), "EEEE")}</td><td className="px-4 py-2 font-mono">{formatTime(record.clockIn)}</td><td className="px-4 py-2 font-mono">{formatTime(record.clockOut)}</td><td className="px-4 py-2">{record.hoursWorked ? `${record.hoursWorked.toFixed(1)} hrs` : "--"}</td><td className="px-4 py-2">{getStatusBadge(record.status)}</td></tr>)) : <tr><td colSpan={6} className="text-center py-2">{format(new Date(), "dd MMM yyyy")}</td><td>{format(new Date(), "EEEE")}</td><td>{formatTime(selectedEmployeeDetails.clockIn)}</td><td>{formatTime(selectedEmployeeDetails.clockOut)}</td><td>{selectedEmployeeDetails.hoursWorked ? `${selectedEmployeeDetails.hoursWorked.toFixed(1)} hrs` : "--"}</td><td>{getStatusBadge(selectedEmployeeDetails.status)}</td></tr>}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {showAddHolidayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-white font-semibold text-lg">Add New Holiday (Save to DB)</h3>
              <button onClick={() => setShowAddHolidayModal(false)} className="text-white hover:text-indigo-200"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name *</label><input type="text" value={newHoliday.name} onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Diwali" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date *</label><input type="date" value={newHoliday.date} onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Holiday Type</label><select value={newHoliday.type} onChange={(e) => setNewHoliday({...newHoliday, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="public">Public Holiday</option><option value="religious">Religious</option><option value="festival">Festival</option><option value="company">Company Event</option><option value="optional">Optional Holiday</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={newHoliday.description} onChange={(e) => setNewHoliday({...newHoliday, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="2" placeholder="Additional details" /></div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowAddHolidayModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={addHoliday} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save to Database</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Holiday Modal */}
      {showEditHolidayModal && selectedHoliday && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-white font-semibold text-lg">Edit Holiday</h3>
              <button onClick={() => { setShowEditHolidayModal(false); setSelectedHoliday(null); }} className="text-white hover:text-blue-200"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name</label><input type="text" value={selectedHoliday.name} onChange={(e) => setSelectedHoliday({...selectedHoliday, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" value={selectedHoliday.date} onChange={(e) => setSelectedHoliday({...selectedHoliday, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={selectedHoliday.type} onChange={(e) => setSelectedHoliday({...selectedHoliday, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="public">Public Holiday</option><option value="religious">Religious</option><option value="festival">Festival</option><option value="company">Company Event</option><option value="optional">Optional Holiday</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={selectedHoliday.description} onChange={(e) => setSelectedHoliday({...selectedHoliday, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="2" /></div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => { setShowEditHolidayModal(false); setSelectedHoliday(null); }} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={updateHoliday} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Update in Database</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Holiday Modal */}
      {showDeleteHolidayModal && selectedHoliday && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-red-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-white font-semibold text-lg">Delete Holiday from Database</h3>
              <button onClick={() => { setShowDeleteHolidayModal(false); setSelectedHoliday(null); }} className="text-white hover:text-red-200"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-2">Are you sure you want to delete this holiday from database?</p>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="font-medium">{selectedHoliday.name}</p><p className="text-sm text-gray-500">{format(parseISO(selectedHoliday.date), "dd MMM yyyy")}</p></div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => { setShowDeleteHolidayModal(false); setSelectedHoliday(null); }} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={deleteHoliday} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete from Database</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorMap = { blue: "bg-blue-100 text-blue-600", orange: "bg-orange-100 text-orange-600", green: "bg-green-100 text-green-600", red: "bg-red-100 text-red-600", purple: "bg-purple-100 text-purple-600" };
  return (<div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border border-gray-100"><div><p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p><p className="text-2xl font-bold text-gray-800 mt-1">{value}</p></div><div className={`p-2 rounded-full ${colorMap[color]}`}><Icon className="w-5 h-5" /></div></div>);
};

export default AdminAttendanceMonitor;