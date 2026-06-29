import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, TrendingUp, TrendingDown, Users, Clock3, Award,
  Eye, CreditCard, RefreshCw, Download, X, BarChart3,
  AlertCircle, Calendar, UserCheck, FileText, Printer
} from "lucide-react";
import { format, parseISO, isSameMonth } from "date-fns";
import * as XLSX from "xlsx";
import { toast, Toaster } from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const API = "https://crm-backned-v1.onrender.com/api";
const WORKING_DAYS_PER_MONTH = 22;
const PAID_LEAVES_ALLOWED = 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount) => `₹${amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const DEPT_MAP = { 1:"Sales", 2:"Marketing", 3:"Development", 4:"HR", 5:"Finance", 6:"Operations" };
const getDeptName = (id) => DEPT_MAP[id] || id || "--";

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    present:  "bg-green-100 text-green-700",
    absent:   "bg-red-100 text-red-700",
    late:     "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    pending:  "bg-yellow-100 text-yellow-700",
    Paid:     "bg-green-100 text-green-700",
    Processed:"bg-blue-100 text-blue-700",
    "Not Processed": "bg-gray-100 text-gray-600",
  };
  const cls = map[status?.toLowerCase()] || map[status] || "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {status || "Not Processed"}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, prefix = "", suffix = "" }) => {
  const cls = {
    blue:   "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
    green:  "bg-green-100 text-green-600",
    red:    "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    indigo: "bg-indigo-100 text-indigo-600",
    yellow: "bg-yellow-100 text-yellow-600",
  }[color];
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border border-gray-100">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{prefix}{value}{suffix}</p>
      </div>
      <div className={`p-2 rounded-full ${cls}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

// ─── Skeleton Table ───────────────────────────────────────────────────────────
const SkeletonSalaryTable = () => (
  <div className="bg-white rounded-xl shadow-md border overflow-hidden">
    <div className="p-4 border-b bg-gray-50">
      <div className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded h-5 w-48" />
    </div>
    <div className="p-4 space-y-2">
      <div className="grid grid-cols-9 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded h-5" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-9 gap-3">
          {Array.from({ length: 9 }).map((__, j) => (
            <div key={j} className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded h-10" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ─── Main Salary Management Component ─────────────────────────────────────────
const SalaryManagement = () => {
  const navigate = useNavigate();
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [allEmployeesSalaries, setAllEmployeesSalaries] = useState([]);
  const [salarySummary, setSalarySummary] = useState(null);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
  const [showSalaryBreakdown, setShowSalaryBreakdown] = useState(false);
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  const token = localStorage.getItem("adminToken");

  // Helper to calculate leave days from leave requests
  const calculateLeaveDaysInMonth = (leave, monthStart, monthEnd) => {
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    const effectiveStart = leaveStart < monthStart ? monthStart : leaveStart;
    const effectiveEnd = leaveEnd > monthEnd ? monthEnd : leaveEnd;
    
    if (effectiveStart <= effectiveEnd) {
      const days = Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;
      return days;
    }
    return 0;
  };

  // Calculate salary for an employee
  const calculateEmployeeSalary = useCallback((employee, month, year, attendance, leaves) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Get employee's attendance for the month
    const empAttendance = attendance.filter(att => 
      att.employeeId === employee._id && 
      isSameMonth(new Date(att.date), startDate)
    );
    
    // Get employee's approved leaves
    const empLeaves = leaves.filter(leave => {
      const leaveEmpId = leave.employee?._id || leave.employee || leave.employeeId?._id || leave.employeeId;
      return leaveEmpId === employee._id && 
             leave.status === "approved" &&
             new Date(leave.startDate) <= endDate &&
             new Date(leave.endDate) >= startDate;
    });
    
    // Calculate total leave days
    let totalLeaveDays = 0;
    empLeaves.forEach(leave => {
      const days = calculateLeaveDaysInMonth(leave, startDate, endDate);
      totalLeaveDays += days;
    });
    
    // Calculate paid vs unpaid leaves
    const paidLeaves = Math.min(totalLeaveDays, PAID_LEAVES_ALLOWED);
    const unpaidLeaves = Math.max(0, totalLeaveDays - PAID_LEAVES_ALLOWED);
    
    // Calculate overtime hours
    let totalOvertimeHours = 0;
    empAttendance.forEach(record => {
      const hoursWorked = record.hoursWorked || 
        (record.clockIn && record.clockOut ? 
          (new Date(record.clockOut) - new Date(record.clockIn)) / (1000 * 60 * 60) : 0);
      if (hoursWorked > 9) {
        totalOvertimeHours += (hoursWorked - 9);
      }
    });
    
    // Calculate rates
    const baseSalary = employee.salary || 0;
    const dailyRate = baseSalary / WORKING_DAYS_PER_MONTH;
    const hourlyRate = dailyRate / 9;
    const leaveDeduction = unpaidLeaves * dailyRate;
    const overtimePay = totalOvertimeHours * hourlyRate * 1.5;
    const finalSalary = baseSalary - leaveDeduction + overtimePay;
    
    return {
      employeeId: employee,
      employeeName: employee.name,
      baseSalary: baseSalary,
      totalLeaves: totalLeaveDays,
      paidLeaves: paidLeaves,
      unpaidLeaves: unpaidLeaves,
      leaveDeduction: leaveDeduction,
      totalOvertimeHours: totalOvertimeHours,
      overtimePay: overtimePay,
      finalSalary: finalSalary,
      amount: finalSalary,
      status: "Not Processed",
      month: month,
      year: year
    };
  }, []);

  // Fetch employees
  const fetchEmployees = async () => {
    if (!token) return [];
    try {
      const empRes = await fetch(`${API}/employee/get/employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!empRes.ok) throw new Error("Failed to load employees");
      const empJson = await empRes.json();
      const employeesList = Array.isArray(empJson) ? empJson : empJson.employees || empJson.data || [];
      setEmployees(employeesList);
      return employeesList;
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Failed to load employees");
      return [];
    }
  };

  // Fetch attendance data
  const fetchAttendanceData = async (empList) => {
    if (!token || !empList?.length) return [];
    
    try {
      const results = await Promise.all(
        empList.map((emp) =>
          fetch(`${API}/attendance/admin/employee/${emp._id}/attendance`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
              const records = Array.isArray(data) ? data : data.attendance || data.data || [];
              return records.map((rec) => ({
                ...rec,
                employeeId: emp._id,
                employeeName: emp.name
              }));
            })
            .catch(() => [])
        )
      );
      
      const all = results.flat();
      setAttendanceData(all);
      return all;
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
      return [];
    }
  };

  // Fetch leave requests
  const fetchLeaveRequests = async () => {
    if (!token) return [];
    try {
      const res = await fetch(`${API}/leaves/all`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data.data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data.leaves && Array.isArray(data.leaves)) {
        list = data.leaves;
      }
      
      setLeaveRequests(list);
      return list;
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
      return [];
    }
  };

  // Fetch salary records
  const fetchSalaryRecords = async () => {
    if (!token) return;
    setLoadingSalary(true);
    try {
      const res = await fetch(`${API}/salaries/records?month=${salaryMonth}&year=${salaryYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let existingRecords = [];
      let summary = null;
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          existingRecords = data.salaryRecords || [];
          summary = data.summary;
          setSalarySummary(summary);
        }
      }
      
      const empList = await fetchEmployees();
      const attendance = await fetchAttendanceData(empList);
      const leaves = await fetchLeaveRequests();
      
      const existingMap = new Map();
      existingRecords.forEach(record => {
        const empId = record.employeeId?._id || record.employeeId;
        existingMap.set(empId?.toString(), record);
      });
      
      const completeList = empList.map(employee => {
        const existing = existingMap.get(employee._id);
        
        if (existing) {
          const calculated = calculateEmployeeSalary(employee, salaryMonth, salaryYear, attendance, leaves);
          return {
            ...existing,
            employeeId: employee,
            employeeName: employee.name,
            totalLeaves: calculated.totalLeaves,
            paidLeaves: calculated.paidLeaves,
            unpaidLeaves: calculated.unpaidLeaves,
            leaveDeduction: calculated.leaveDeduction,
            totalOvertimeHours: calculated.totalOvertimeHours,
            overtimePay: calculated.overtimePay,
            finalSalary: calculated.finalSalary,
          };
        } else {
          return calculateEmployeeSalary(employee, salaryMonth, salaryYear, attendance, leaves);
        }
      });
      
      completeList.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
      setAllEmployeesSalaries(completeList);
      
      const totalProcessed = completeList.filter(s => s.status === "Paid" || s.status === "Processed").length;
      const totalPending = completeList.filter(s => s.status === "Not Processed" || s.status === "Pending").length;
      
      setSalarySummary({
        totalSalaryPaid: completeList.reduce((sum, s) => sum + ((s.status === "Paid" || s.status === "Processed") ? (s.finalSalary || s.amount || 0) : 0), 0),
        totalOvertimePaid: completeList.reduce((sum, s) => sum + (s.overtimePay || 0), 0),
        totalLeaveDeductions: completeList.reduce((sum, s) => sum + (s.leaveDeduction || 0), 0),
        totalEmployees: completeList.length,
        totalOvertimeHours: completeList.reduce((sum, s) => sum + (s.totalOvertimeHours || 0), 0),
        totalProcessed: totalProcessed,
        totalPending: totalPending
      });
      
    } catch (error) {
      console.error("Failed to fetch salary records:", error);
      toast.error("Network error");
    } finally {
      setLoadingSalary(false);
    }
  };

  // Process single employee salary
  const processEmployeeSalary = async (employeeId, month, year) => {
    try {
      const res = await fetch(`${API}/salaries/pay/${employeeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ month, year, paymentMethod: "Bank Transfer" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Salary paid to ${data.data.employee.name}`);
        await fetchSalaryRecords();
        return true;
      } else {
        toast.error(data.message || "Failed to process salary");
        return false;
      }
    } catch (error) {
      toast.error("Network error");
      return false;
    }
  };

  // Process bulk payroll
  const processBulkPayroll = async () => {
    if (!window.confirm(`Process payroll for ${salaryMonth}/${salaryYear} for all employees?`)) return;
    
    setLoadingSalary(true);
    try {
      const res = await fetch(`${API}/salaries/process-bulk-payroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ month: salaryMonth, year: salaryYear, paymentMethod: "Bank Transfer" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        await fetchSalaryRecords();
      } else {
        toast.error(data.message || "Failed to process payroll");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoadingSalary(false);
    }
  };

  // Export salary report
  const exportSalaryReport = () => {
    const displayData = allEmployeesSalaries.length > 0 ? allEmployeesSalaries : salaryRecords;
    
    if (!displayData.length) {
      toast.error("No salary records to export");
      return;
    }
    
    const data = displayData.map((r) => ({
      "Employee Name": r.employeeName || r.employeeId?.name,
      "Email": r.employeeId?.email,
      "Department": getDeptName(r.employeeId?.department),
      "Position": r.employeeId?.position,
      "Base Salary": r.baseSalary,
      "Total Leaves": r.totalLeaves || 0,
      "Paid Leaves": r.paidLeaves || 0,
      "Unpaid Leaves": r.unpaidLeaves || 0,
      "Leave Deduction": r.leaveDeduction || 0,
      "Overtime Hours": r.totalOvertimeHours || 0,
      "Overtime Pay": r.overtimePay || 0,
      "Final Salary": r.finalSalary || r.amount || 0,
      "Status": r.status,
      "Payment Method": r.paymentMethod || "-",
      "Paid Date": r.paidAt ? format(parseISO(r.paidAt), "dd MMM yyyy") : "-"
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Salary_${salaryMonth}_${salaryYear}`);
    XLSX.writeFile(wb, `salary_report_${salaryMonth}_${salaryYear}.xlsx`);
    toast.success("Salary report exported");
  };

  // Handle view employee details
  const handleViewEmployeeDetails = (employee) => {
    navigate(`/admin/salary-details/${employee._id}`);
  };

  // Initial load
  useEffect(() => {
    fetchEmployees();
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchSalaryRecords();
    }
  }, [salaryMonth, salaryYear, employees.length]);

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchEmployees(), fetchLeaveRequests(), fetchSalaryRecords()]);
    setRefreshing(false);
  };

  const displayRecords = allEmployeesSalaries.length > 0 ? allEmployeesSalaries : salaryRecords;

  // Salary Breakdown Modal Component (inline for simplicity)
  const SalaryBreakdownModal = ({ employee, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [breakdown, setBreakdown] = useState(null);
    const [modalMonth, setModalMonth] = useState(salaryMonth);
    const [modalYear, setModalYear] = useState(salaryYear);

    const fetchBreakdown = async () => {
      if (!employee) return;
      setLoading(true);
      try {
        const res = await fetch(`${API}/salaries/calculate/${employee._id}?month=${modalMonth}&year=${modalYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setBreakdown(data.data);
        } else {
          toast.error(data.message || "Failed to fetch breakdown");
        }
      } catch (error) {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (employee) fetchBreakdown();
    }, [modalMonth, modalYear, employee]);

    if (!employee) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="text-white font-semibold text-lg">Salary Breakdown</h3>
              <p className="text-indigo-200 text-sm">{employee.name} • {employee.position}</p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="flex gap-4 mb-6">
              <select
                value={modalMonth}
                onChange={(e) => setModalMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={modalYear}
                onChange={(e) => setModalYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
              <button onClick={fetchBreakdown} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Calculate</button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : breakdown ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-green-600">Base Salary</p>
                    <p className="text-xl font-bold">{formatCurrency(breakdown.baseSalary)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-red-600">Leave Deduction</p>
                    <p className="text-xl font-bold text-red-600">-{formatCurrency(breakdown.leaves?.deduction || 0)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-blue-600">Overtime Pay</p>
                    <p className="text-xl font-bold text-blue-600">+{formatCurrency(breakdown.overtime?.pay || 0)}</p>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between py-2">
                    <span>Final Salary</span>
                    <span className="font-bold text-indigo-600">{formatCurrency(breakdown.finalSalary)}</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await processEmployeeSalary(employee._id, modalMonth, modalYear);
                    onClose();
                  }}
                  className="w-full bg-green-600 text-white py-2 rounded-lg"
                >
                  Process Payment
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">Select month and click Calculate</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-7 h-7 text-green-600" />
                Salary Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">Process payroll, track salary records, and manage payments</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={refreshAll}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition text-gray-700 text-sm disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={exportSalaryReport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition text-sm"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <button
                onClick={processBulkPayroll}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Process Payroll
              </button>
            </div>
          </div>

          {/* Salary Stats Cards */}
          {salarySummary && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <StatCard icon={DollarSign} label="Total Salary" value={formatCurrency(salarySummary.totalSalaryPaid)} color="green" />
              <StatCard icon={Award} label="Total Overtime" value={formatCurrency(salarySummary.totalOvertimePaid)} color="blue" />
              <StatCard icon={TrendingDown} label="Total Deductions" value={formatCurrency(salarySummary.totalLeaveDeductions)} color="red" />
              <StatCard icon={Users} label="Total Employees" value={salarySummary.totalEmployees} color="purple" />
              <StatCard icon={Clock3} label="Total OT Hours" value={salarySummary.totalOvertimeHours?.toFixed(1)} suffix=" hrs" color="orange" />
              <StatCard icon={CreditCard} label="Pending" value={salarySummary.totalPending || 0} color="yellow" />
            </div>
          )}

          {/* Month/Year Selector */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">Salary Period:</label>
                <select
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  value={salaryYear}
                  onChange={(e) => setSalaryYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
                <button
                  onClick={fetchSalaryRecords}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                >
                  Load
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedEmployeeForSalary(employees[0]);
                    setShowSalaryBreakdown(true);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Preview Calculation
                </button>
              </div>
            </div>
          </div>

          {/* Status Summary Bar */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Processed/Paid</span>
                  <span className="text-sm font-bold text-green-600">
                    {displayRecords.filter(s => s.status === "Paid" || s.status === "Processed").length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm font-bold text-yellow-600">
                    {displayRecords.filter(s => s.status === "Pending").length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Not Processed</span>
                  <span className="text-sm font-bold text-gray-600">
                    {displayRecords.filter(s => s.status === "Not Processed").length}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Showing {displayRecords.length} employees for {new Date(salaryYear, salaryMonth - 1).toLocaleString('default', { month: 'long' })} {salaryYear}
              </div>
            </div>
          </div>

          {/* Salary Records Table */}
          {loadingSalary ? (
            <SkeletonSalaryTable />
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Employee</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Base Salary</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Leaves (Paid/Unpaid)</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Leave Deduction</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">OT Hours</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">OT Pay</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Final Salary</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayRecords.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-12 text-center text-gray-400">
                          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          No employees found for this period.
                        </td>
                      </tr>
                    ) : (
                      displayRecords.map((record, idx) => (
                        <tr key={record._id || idx} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{record.employeeName || record.employeeId?.name}</p>
                            <p className="text-xs text-gray-500">{record.employeeId?.email}</p>
                            <p className="text-xs text-gray-400">{record.employeeId?.position}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(record.baseSalary)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <div>
                                <span className="text-green-600 font-medium">{record.paidLeaves || 0}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-red-600 font-medium">{record.unpaidLeaves || 0}</span>
                              </div>
                              <span className="text-xs text-gray-400">Total: {record.totalLeaves || 0}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {record.leaveDeduction > 0 ? (
                              <span className="text-red-600 font-medium">-{formatCurrency(record.leaveDeduction)}</span>
                            ) : (
                              <span className="text-gray-400">{formatCurrency(0)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(record.totalOvertimeHours || 0).toFixed(1)} hrs
                          </td>
                          <td className="px-4 py-3 text-right">
                            {record.overtimePay > 0 ? (
                              <span className="text-green-600">+{formatCurrency(record.overtimePay)}</span>
                            ) : (
                              <span className="text-gray-400">{formatCurrency(0)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-600">
                            {formatCurrency(record.finalSalary || record.amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={record.status} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => {
                                  const emp = employees.find(e => e._id === (record.employeeId?._id || record.employeeId));
                                  if (emp) {
                                    handleViewEmployeeDetails(emp);
                                  }
                                }}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                title="View Full Details & History"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {(record.status === "Pending" || record.status === "Not Processed") && (
                                <button
                                  onClick={() => {
                                    const empId = record.employeeId?._id || record.employeeId;
                                    if (empId) {
                                      processEmployeeSalary(empId, salaryMonth, salaryYear);
                                    }
                                  }}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                                  title="Process Salary"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Salary Calculation Info */}
          <div className="bg-blue-50 rounded-lg p-4 mt-6 text-sm">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Salary Calculation Rules:
            </h4>
            <div className="grid md:grid-cols-2 gap-3 text-blue-700">
              <ul className="space-y-1">
                <li>• Daily Rate = Base Salary / {WORKING_DAYS_PER_MONTH} working days</li>
                <li>• Hourly Rate = Daily Rate / 9 hours</li>
                <li>• {PAID_LEAVES_ALLOWED} paid leaves allowed per month</li>
                <li>• Unpaid leaves deduction = Unpaid days × Daily Rate</li>
              </ul>
              <ul className="space-y-1">
                <li>• Overtime pay (1.5x) for hours &gt; 9 hours/day</li>
                <li>• Final Salary = Base - Deduction + Overtime</li>
                <li>• Overtime Rate = Hourly Rate × 1.5</li>
                <li>• Monthly working days: {WORKING_DAYS_PER_MONTH} days</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-400 text-center mt-6">
            Last sync: {new Date().toLocaleTimeString()} · Salary Management (Based on {WORKING_DAYS_PER_MONTH} working days/month)
          </p>
        </div>
      </div>

      {/* Salary Breakdown Modal */}
      {showSalaryBreakdown && (
        <SalaryBreakdownModal
          employee={selectedEmployeeForSalary}
          onClose={() => {
            setShowSalaryBreakdown(false);
            setSelectedEmployeeForSalary(null);
          }}
        />
      )}
    </>
  );
};

export default SalaryManagement;