// src/admin/components/AdminAttendanceMonitor.jsx
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
  MapPin,
  X,
} from "lucide-react";
import { format, parseISO, isToday, isSameMonth, startOfMonth, endOfMonth, isSameDay, subDays, startOfWeek, endOfWeek } from "date-fns";
import * as XLSX from "xlsx";
import { toast, Toaster } from "react-hot-toast";

const AdminAttendanceMonitor = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("today"); // today, month, all
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
  const [summaryStats, setSummaryStats] = useState({
    totalEmployees: 0,
    clockedInNow: 0,
    completedToday: 0,
    absentToday: 0,
    avgHoursToday: 0,
  });

  const token = localStorage.getItem("adminToken");

  // Fetch all employees
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

  // Fetch attendance for a specific employee
  const fetchEmployeeAttendance = async (employeeId, token) => {
    try {
      const response = await fetch(
        `https://crm-backend-v2.onrender.com/api/attendance/admin/employee/${employeeId}/attendance`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
      console.error(`Error fetching attendance for employee ${employeeId}:`, error);
    }
    return [];
  };

  // Main function to fetch all attendance data
  const fetchAllAttendance = useCallback(async () => {
    if (!token) {
      toast.error("Admin not logged in");
      return;
    }
    
    setLoading(true);
    toast.loading("Fetching attendance data...", { id: "fetch-attendance" });
    
    try {
      // First get all employees
      const employees = await fetchAllEmployees();
      
      if (employees.length === 0) {
        toast.error("No employees found", { id: "fetch-attendance" });
        setLoading(false);
        return;
      }
      
      // Fetch attendance for each employee
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
      
      // Sort by date (newest first)
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

  // Apply filters to records
  const applyFilters = (data, term, filterType, month) => {
    let filtered = [...data];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Date filtering
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

    // Search filter
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

  // Calculate dashboard statistics
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

  // Get unique employees for month view (each employee appears once)
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
    
    // Calculate stats for each employee
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

  // Handle view details click - show full month's in/out details
  const handleViewDetails = (employee) => {
    setSelectedEmployeeDetails(employee);
    setShowDetailModal(true);
  };

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllAttendance();
  };

  // Change month
  const handlePreviousMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  useEffect(() => {
    fetchAllAttendance();
  }, []);

  useEffect(() => {
    if (attendanceData.length > 0) {
      applyFilters(attendanceData, searchTerm, dateFilter, selectedMonth);
    }
  }, [searchTerm, dateFilter, selectedMonth, attendanceData]);

  // Export to Excel
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

  // Helper functions
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

  // Pagination for today view
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
                Employee In/Out Monitor
              </h1>
              <p className="text-gray-500 text-sm mt-1">Real-time attendance & clock data from database</p>
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
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition text-sm"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard icon={UserCheck} label="Total Employees" value={summaryStats.totalEmployees} color="blue" />
            <StatCard icon={Clock3} label="Clocked In Today" value={summaryStats.clockedInNow} color="orange" />
            <StatCard icon={TrendingUp} label="Completed Today" value={summaryStats.completedToday} color="green" />
            <StatCard icon={UserX} label="Absent Today" value={summaryStats.absentToday} color="red" />
            <StatCard icon={Calendar} label="Avg Hours (Today)" value={`${summaryStats.avgHoursToday}h`} color="purple" />
          </div>

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
                    <button
                      onClick={handlePreviousMonth}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
                      {format(selectedMonth, "MMMM yyyy")}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
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

          {/* Attendance Table - Today View */}
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
                              <RefreshCw className="w-4 h-4 animate-spin" /> Loading records...
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                          No attendance records found for today
                         </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((record, idx) => (
                        <tr key={record._id || idx} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-800">{record.employeeId?.name || "—"}</p>
                              <p className="text-xs text-gray-400">{record.employeeId?.email || ""}</p>
                            </div>
                           </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {getDepartmentName(record.employeeId?.department)}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{record.employeeId?.position || ""}</p>
                           </td>
                          <td className="px-4 py-3 font-mono text-sm">{formatTime(record.clockIn)}</td>
                          <td className="px-4 py-3 font-mono text-sm">{formatTime(record.clockOut)}</td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {record.hoursWorked ? `${record.hoursWorked.toFixed(1)} hrs` : "--"}
                           </td>
                          <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleViewDetails({
                                ...record.employeeId,
                                records: [record]
                              })}
                              className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                           </td>
                         </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination for today view */}
              {!loading && totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t bg-white">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded disabled:opacity-40 text-gray-600 hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded disabled:opacity-40 text-gray-600 hover:bg-gray-100"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Month View - Employee Summary Table (Each employee once) */}
          {dateFilter === "month" && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Employee</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Department</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Position</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Present</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Absent</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Late</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Total Hours</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Attendance %</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      [...Array(6)].map((_, i) => (
                        <tr key={i}>
                          <td colSpan={9} className="px-4 py-6 text-center">
                            <div className="flex justify-center items-center gap-2 text-gray-400">
                              <RefreshCw className="w-4 h-4 animate-spin" /> Loading records...
                            </div>
                           </td>
                         </tr>
                      ))
                    ) : uniqueEmployeesForMonth.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                          No attendance records found for {format(selectedMonth, "MMMM yyyy")}
                         </td>
                       </tr>
                    ) : (
                      uniqueEmployeesForMonth.map((employee) => (
                        <tr key={employee._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-800">{employee.name}</p>
                              <p className="text-xs text-gray-400">{employee.email}</p>
                            </div>
                           </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {getDepartmentName(employee.department)}
                            </span>
                           </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {employee.position || "--"}
                           </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-semibold text-green-600">{employee.presentDays}</span>
                           </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-semibold text-red-600">{employee.absentDays}</span>
                           </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-semibold text-yellow-600">{employee.lateDays}</span>
                           </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium">{employee.totalHours.toFixed(1)} hrs</span>
                           </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-semibold ${employee.attendancePercent >= 75 ? "text-green-600" : employee.attendancePercent >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                                {employee.attendancePercent}%
                              </span>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${employee.attendancePercent >= 75 ? "bg-green-500" : employee.attendancePercent >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                                  style={{ width: `${employee.attendancePercent}%` }}
                                />
                              </div>
                            </div>
                           </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleViewDetails(employee)}
                              className="px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition text-sm flex items-center gap-1 mx-auto"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                           </td>
                         </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-400 text-center mt-6">
            📊 Last sync: {new Date().toLocaleTimeString()} | {dateFilter === "today" ? "Today's attendance" : `Month: ${format(selectedMonth, "MMMM yyyy")}`}
          </div>
        </div>
      </div>

      {/* Monthly Attendance Detail Modal */}
      {showDetailModal && selectedEmployeeDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center sticky top-0">
              <div>
                <h3 className="text-white font-semibold text-lg">Attendance Details</h3>
                <p className="text-indigo-200 text-sm">
                  {selectedEmployeeDetails.name} - {dateFilter === "month" ? format(selectedMonth, "MMMM yyyy") : format(new Date(), "dd MMM yyyy")}
                </p>
              </div>
              <button onClick={() => setShowDetailModal(null)} className="text-white hover:text-indigo-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600">Present</p>
                  <p className="text-2xl font-bold text-green-700">
                    {selectedEmployeeDetails.records?.filter(r => r.status === "Present").length || 
                     (selectedEmployeeDetails.status === "Present" ? 1 : 0)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-600">Absent</p>
                  <p className="text-2xl font-bold text-red-700">
                    {selectedEmployeeDetails.records?.filter(r => r.status === "Absent").length ||
                     (selectedEmployeeDetails.status === "Absent" ? 1 : 0)}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-yellow-600">Late</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {selectedEmployeeDetails.records?.filter(r => r.status === "Late").length ||
                     (selectedEmployeeDetails.status === "Late" ? 1 : 0)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600">Total Hours</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {(selectedEmployeeDetails.records?.reduce((sum, r) => sum + (r.hoursWorked || 0), 0) || 
                      selectedEmployeeDetails.hoursWorked || 0).toFixed(1)}h
                  </p>
                </div>
              </div>

              {/* Daily Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Day</th>
                      <th className="px-4 py-2 text-left">Clock In</th>
                      <th className="px-4 py-2 text-left">Clock Out</th>
                      <th className="px-4 py-2 text-left">Hours</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedEmployeeDetails.records ? (
                      selectedEmployeeDetails.records
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map((record, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2">{format(parseISO(record.date), "dd MMM yyyy")}</td>
                            <td className="px-4 py-2">{format(parseISO(record.date), "EEEE")}</td>
                            <td className="px-4 py-2 font-mono">{formatTime(record.clockIn)}</td>
                            <td className="px-4 py-2 font-mono">{formatTime(record.clockOut)}</td>
                            <td className="px-4 py-2">{record.hoursWorked ? `${record.hoursWorked.toFixed(1)} hrs` : "--"}</td>
                            <td className="px-4 py-2">{getStatusBadge(record.status)}</td>
                            <td className="px-4 py-2 text-xs">{record.location?.name || "—"}</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-2 text-center">
                          {format(new Date(), "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-2">{format(new Date(), "EEEE")}</td>
                        <td className="px-4 py-2 font-mono">{formatTime(selectedEmployeeDetails.clockIn)}</td>
                        <td className="px-4 py-2 font-mono">{formatTime(selectedEmployeeDetails.clockOut)}</td>
                        <td className="px-4 py-2">{selectedEmployeeDetails.hoursWorked ? `${selectedEmployeeDetails.hoursWorked.toFixed(1)} hrs` : "--"}</td>
                        <td className="px-4 py-2">{getStatusBadge(selectedEmployeeDetails.status)}</td>
                        <td className="px-4 py-2 text-xs">—</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border border-gray-100">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`p-2 rounded-full ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

export default AdminAttendanceMonitor;