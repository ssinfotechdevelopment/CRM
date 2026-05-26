import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Users, Clock3, Award,
  Eye, CreditCard, RefreshCw, Download, X, BarChart3,
  AlertCircle, Calendar, UserCheck, FileText, Printer
} from "lucide-react";
import { format, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import { toast, Toaster } from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const API = "https://crm-backend-v2.onrender.com/api";

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
  };
  const cls = map[status?.toLowerCase()] || "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {status || "--"}
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
      <div className="grid grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded h-5" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((__, j) => (
            <div key={j} className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded h-10" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ─── Salary Breakdown Modal ───────────────────────────────────────────────────
const SalaryBreakdownModal = ({ employee, onClose, onProcess, month: propMonth, year: propYear }) => {
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(propMonth || new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(propYear || new Date().getFullYear());

  const fetchBreakdown = async () => {
    if (!employee) {
      toast.error("Please select an employee");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}/salaries/calculate/${employee._id}?month=${selectedMonth}&year=${selectedYear}`, {
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
    if (employee) {
      fetchBreakdown();
    }
  }, [selectedMonth, selectedYear, employee]);

  const handleProcessPayroll = async () => {
    if (onProcess && employee) {
      await onProcess(employee._id, selectedMonth, selectedYear);
      onClose();
    }
  };

  if (!employee) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full p-6 text-center">
          <p className="text-gray-600">Please select an employee to view breakdown</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Close</button>
        </div>
      </div>
    );
  }

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
          {/* Month/Year Selector */}
          <div className="flex gap-4 mb-6">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
            <button
              onClick={fetchBreakdown}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Calculate
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading breakdown...</p>
            </div>
          ) : breakdown ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
                  <p className="text-sm text-green-600 font-medium">Base Salary</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(breakdown.baseSalary)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center border border-red-100">
                  <p className="text-sm text-red-600 font-medium">Leave Deduction</p>
                  <p className="text-2xl font-bold text-red-700">-{formatCurrency(breakdown.leaves?.deduction)}</p>
                  <p className="text-xs text-gray-500 mt-1">{breakdown.leaves?.unpaid} unpaid leaves</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium">Overtime Pay</p>
                  <p className="text-2xl font-bold text-blue-700">+{formatCurrency(breakdown.overtime?.pay)}</p>
                  <p className="text-xs text-gray-500 mt-1">{breakdown.overtime?.totalHours} hours</p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 font-semibold border-b">Calculation Details</div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Daily Rate (Salary / 24 days)</span>
                    <span className="font-mono font-medium">{formatCurrency(breakdown.rates?.dailyRate)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Hourly Rate (Daily / 9 hours)</span>
                    <span className="font-mono font-medium">{formatCurrency(breakdown.rates?.hourlyRate)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Overtime Rate (1.5x hourly)</span>
                    <span className="font-mono font-medium">{formatCurrency(breakdown.rates?.overtimeRate)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Total Leave Days</span>
                    <span>{breakdown.leaves?.total} days ({breakdown.leaves?.paid} paid, {breakdown.leaves?.unpaid} unpaid)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Total Overtime Hours</span>
                    <span className="font-medium">{breakdown.overtime?.totalHours} hours</span>
                  </div>
                  <div className="flex justify-between py-3 bg-indigo-50 rounded-lg px-3 mt-2">
                    <span className="font-bold text-lg text-gray-800">Final Salary</span>
                    <span className="font-bold text-lg text-indigo-700">{formatCurrency(breakdown.finalSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 font-semibold border-b">Attendance Summary</div>
                <div className="p-4 grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Working Days</p>
                    <p className="text-xl font-bold text-gray-800">{breakdown.attendance?.totalDays}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600">Present</p>
                    <p className="text-xl font-bold text-green-600">{breakdown.attendance?.presentDays}</p>
                  </div>
                  <div>
                    <p className="text-xs text-red-600">Absent</p>
                    <p className="text-xl font-bold text-red-600">{breakdown.attendance?.absentDays}</p>
                  </div>
                  <div>
                    <p className="text-xs text-yellow-600">Late</p>
                    <p className="text-xl font-bold text-yellow-600">{breakdown.attendance?.lateDays}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProcessPayroll}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Process Salary Payment
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select month and click Calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Salary Management Component ─────────────────────────────────────────
const SalaryManagement = () => {
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [salarySummary, setSalarySummary] = useState(null);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
  const [showSalaryBreakdown, setShowSalaryBreakdown] = useState(false);
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("adminToken");

  // ── Fetch employees ────────────────────────────────────────────────────────
  const fetchEmployees = async () => {
    if (!token) return;
    try {
      const empRes = await fetch(`${API}/employee/get/employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!empRes.ok) throw new Error("Failed to load employees");
      const empJson = await empRes.json();
      const employeesList = Array.isArray(empJson) ? empJson : empJson.employees || empJson.data || [];
      setEmployees(employeesList);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Failed to load employees");
    }
  };

  // ── Fetch salary records ───────────────────────────────────────────────────
  const fetchSalaryRecords = async () => {
    if (!token) return;
    setLoadingSalary(true);
    try {
      const res = await fetch(`${API}/salaries/records?month=${salaryMonth}&year=${salaryYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSalaryRecords(data.salaryRecords || []);
        setSalarySummary(data.summary);
      } else {
        toast.error(data.message || "Failed to fetch salary records");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoadingSalary(false);
    }
  };

  // ── Process single employee salary ─────────────────────────────────────────
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
        fetchSalaryRecords();
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

  // ── Process bulk payroll ───────────────────────────────────────────────────
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
        fetchSalaryRecords();
      } else {
        toast.error(data.message || "Failed to process payroll");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoadingSalary(false);
    }
  };

  // ── Mark salary as paid ────────────────────────────────────────────────────
  const markSalaryAsPaid = async (recordId) => {
    const method = prompt("Enter payment method (Bank Transfer/Cash/Cheque/Online):", "Bank Transfer");
    if (!method) return;
    
    try {
      const res = await fetch(`${API}/salaries/record/${recordId}/mark-paid`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentMethod: method })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Salary marked as paid");
        fetchSalaryRecords();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // ── Export salary report ───────────────────────────────────────────────────
  const exportSalaryReport = () => {
    if (!salaryRecords.length) {
      toast.error("No salary records to export");
      return;
    }
    
    const data = salaryRecords.map((r) => ({
      "Employee Name": r.employeeName || r.employeeId?.name,
      "Email": r.employeeId?.email,
      "Department": getDeptName(r.employeeId?.department),
      "Position": r.employeeId?.position,
      "Base Salary": r.baseSalary,
      "Total Leaves": r.totalLeaves,
      "Paid Leaves": r.paidLeaves,
      "Unpaid Leaves": r.unpaidLeaves,
      "Leave Deduction": r.leaveDeduction,
      "Overtime Hours": r.totalOvertimeHours,
      "Overtime Pay": r.overtimePay,
      "Final Salary": r.finalSalary || r.amount,
      "Status": r.status,
      "Payment Method": r.paymentMethod,
      "Paid Date": r.paidAt ? format(parseISO(r.paidAt), "dd MMM yyyy") : "-"
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Salary_${salaryMonth}_${salaryYear}`);
    XLSX.writeFile(wb, `salary_report_${salaryMonth}_${salaryYear}.xlsx`);
    toast.success("Salary report exported");
  };

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchSalaryRecords();
  }, [salaryMonth, salaryYear]);

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchEmployees(), fetchSalaryRecords()]);
    setRefreshing(false);
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
            <div className="flex gap-3">
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <StatCard icon={DollarSign} label="Total Salary" value={formatCurrency(salarySummary.totalSalaryPaid)} color="green" />
              <StatCard icon={Award} label="Total Overtime" value={formatCurrency(salarySummary.totalOvertimePaid)} color="blue" />
              <StatCard icon={TrendingDown} label="Total Deductions" value={formatCurrency(salarySummary.totalLeaveDeductions)} color="red" />
              <StatCard icon={Users} label="Employees Processed" value={salarySummary.totalEmployees} color="purple" />
              <StatCard icon={Clock3} label="Total OT Hours" value={salarySummary.totalOvertimeHours?.toFixed(1)} suffix=" hrs" color="orange" />
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
                    setSelectedEmployeeForSalary(null);
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
                    {salaryRecords.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-12 text-center text-gray-400">
                          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          No salary records found for this period. Click "Process Payroll" to calculate.
                        </td>
                      </tr>
                    ) : (
                      salaryRecords.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{record.employeeName || record.employeeId?.name}</p>
                            <p className="text-xs text-gray-500">{record.employeeId?.email}</p>
                            <p className="text-xs text-gray-400">{record.employeeId?.position}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(record.baseSalary)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-green-600 font-medium">{record.paidLeaves || 0}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-red-600 font-medium">{record.unpaidLeaves || 0}</span>
                            <span className="text-xs text-gray-400 block">Total: {record.totalLeaves || 0}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 font-medium">
                            -{formatCurrency(record.leaveDeduction)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(record.totalOvertimeHours || 0).toFixed(1)} hrs
                          </td>
                          <td className="px-4 py-3 text-right text-green-600">
                            +{formatCurrency(record.overtimePay)}
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
                                  const emp = employees.find(e => e._id === record.employeeId?._id);
                                  setSelectedEmployeeForSalary(emp || record.employeeId);
                                  setShowSalaryBreakdown(true);
                                }}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="View Breakdown"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {record.status === "Pending" && (
                                <button
                                  onClick={() => markSalaryAsPaid(record._id)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                                  title="Mark as Paid"
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
                <li>• Daily Rate = Base Salary / 24 working days</li>
                <li>• Hourly Rate = Daily Rate / 9 hours</li>
                <li>• 2 paid leaves allowed per month</li>
                <li>• Unpaid leaves deduction = Unpaid days × Daily Rate</li>
              </ul>
              <ul className="space-y-1">
                <li>• Overtime pay (1.5x) for hours &gt; 9 hours/day</li>
                <li>• Final Salary = Base - Deduction + Overtime</li>
                <li>• Overtime Rate = Hourly Rate × 1.5</li>
                <li>• Monthly working days: 24 days</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-400 text-center mt-6">
            Last sync: {new Date().toLocaleTimeString()} · Salary Management
          </p>
        </div>
      </div>

      {/* Salary Breakdown Modal */}
      {showSalaryBreakdown && (
        <SalaryBreakdownModal
          employee={selectedEmployeeForSalary || (employees.length > 0 ? employees[0] : null)}
          onClose={() => {
            setShowSalaryBreakdown(false);
            setSelectedEmployeeForSalary(null);
          }}
          onProcess={processEmployeeSalary}
          month={salaryMonth}
          year={salaryYear}
        />
      )}
    </>
  );
};

export default SalaryManagement;