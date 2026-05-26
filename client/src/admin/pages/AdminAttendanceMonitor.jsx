import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Calendar, Clock, Search, Download, RefreshCw, UserCheck, UserX,
  TrendingUp, Clock3, Filter, Eye, ChevronLeft, ChevronRight, X,
  Users, CheckCircle, XCircle, Plus, Trash2, Gift, Heart, Briefcase,
  Sun, Edit, FileText
} from "lucide-react";
import {
  format, parseISO, isSameMonth, isSameDay, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isWeekend, addMonths, subMonths, isToday,
} from "date-fns";
import * as XLSX from "xlsx";
import { toast, Toaster } from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const API = "https://crm-backend-v2.onrender.com/api";
const ITEMS_PER_PAGE = 20;

const HOLIDAY_TYPES = {
  public:   { name: "Public Holiday", icon: Calendar,  color: "bg-red-100 text-red-700",    bg: "bg-red-50",    border: "border-red-200" },
  religious:{ name: "Religious",       icon: Heart,     color: "bg-purple-100 text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  festival: { name: "Festival",        icon: Gift,      color: "bg-pink-100 text-pink-700",  bg: "bg-pink-50",   border: "border-pink-200" },
  company:  { name: "Company Event",   icon: Briefcase, color: "bg-blue-100 text-blue-700",  bg: "bg-blue-50",   border: "border-blue-200" },
  optional: { name: "Optional",        icon: Sun,       color: "bg-yellow-100 text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
};

const DEPT_MAP = { 1:"Sales", 2:"Marketing", 3:"Development", 4:"HR", 5:"Finance", 6:"Operations" };
const WEEK_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDeptName = (id) => DEPT_MAP[id] || id || "--";
const fmtTime = (iso) => iso ? format(parseISO(iso), "hh:mm a") : "--";

// ─── Skeleton Primitives ─────────────────────────────────────────────────────
const Sh = ({ className = "" }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded ${className}`} />
);

const SkeletonStats = () => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border p-4 flex items-center justify-between shadow-sm">
        <div className="space-y-2 flex-1">
          <Sh className="h-3 w-24" />
          <Sh className="h-8 w-16" />
        </div>
        <Sh className="w-10 h-10 rounded-full flex-shrink-0" />
      </div>
    ))}
  </div>
);

const SkeletonTable = ({ cols = 7, rows = 8 }) => (
  <div className="bg-white rounded-xl shadow-md border overflow-hidden">
    <div className="p-4 border-b bg-gray-50">
      <Sh className="h-5 w-48" />
    </div>
    <div className="p-4 space-y-2">
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => <Sh key={i} className="h-5" />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((__, j) => <Sh key={j} className="h-10" />)}
        </div>
      ))}
    </div>
  </div>
);

const SkeletonLeavePanel = () => (
  <div className="bg-white rounded-xl shadow-md border overflow-hidden">
    <div className="p-4 border-b bg-gray-50 space-y-3">
      <Sh className="h-5 w-36" />
      <div className="flex gap-2">
        {[0,1,2].map(i => <Sh key={i} className="h-16 flex-1 rounded-lg" />)}
      </div>
    </div>
    <div className="p-3 border-b flex gap-1">
      {[0,1,2,3].map(i => <Sh key={i} className="h-8 flex-1 rounded-md" />)}
    </div>
    <div className="divide-y">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 space-y-2">
          <div className="flex justify-between">
            <Sh className="h-4 w-32" />
            <Sh className="h-5 w-16 rounded-full" />
          </div>
          <Sh className="h-3 w-48" />
          <Sh className="h-3 w-36" />
        </div>
      ))}
    </div>
  </div>
);

const SkeletonHolidayCalendar = () => (
  <div className="bg-white rounded-xl shadow-md border overflow-hidden">
    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Sh className="w-8 h-8 rounded-lg" />
        <Sh className="h-6 w-36" />
        <Sh className="w-8 h-8 rounded-lg" />
      </div>
      <Sh className="h-7 w-16 rounded-lg" />
    </div>
    <div className="p-4">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEK_DAYS.map((_, i) => <Sh key={i} className="h-8" />)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => <Sh key={i} className="min-h-[100px]" />)}
      </div>
    </div>
    <div className="border-t p-4 space-y-2">
      <Sh className="h-5 w-48" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {[0,1,2,3,4,5].map(j => <Sh key={j} className="h-10 flex-1" />)}
        </div>
      ))}
    </div>
  </div>
);

// ─── Status Badges ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    present:  "bg-green-100 text-green-700",
    absent:   "bg-red-100 text-red-700",
    late:     "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    pending:  "bg-yellow-100 text-yellow-700",
    Paid:     "bg-green-100 text-green-700",
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

// ─── Holiday Modal ────────────────────────────────────────────────────────────
const HolidayModal = ({ title, color, onClose, onConfirm, confirmLabel, children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
      <div className={`${color} px-6 py-4 flex justify-between items-center rounded-t-2xl`}>
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-6 space-y-4">{children}</div>
      <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 rounded-b-2xl">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Cancel</button>
        <button onClick={onConfirm} className={`px-4 py-2 ${color} text-white rounded-lg text-sm`}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300";

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminAttendanceMonitor = () => {
  // ── Attendance state ───────────────────────────────────────────────────────
  const [attendanceData, setAttendanceData]   = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [searchTerm, setSearchTerm]           = useState("");
  const [dateFilter, setDateFilter]           = useState("today");
  const [selectedMonth, setSelectedMonth]     = useState(new Date());
  const [currentPage, setCurrentPage]         = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab]             = useState("attendance");
  const [summaryStats, setSummaryStats]       = useState({ totalEmployees:0, clockedInNow:0, completedToday:0, absentToday:0, avgHoursToday:0 });

  // ── Leave state ────────────────────────────────────────────────────────────
  const [leaveRequests, setLeaveRequests]     = useState([]);
  const [loadingLeaves, setLoadingLeaves]     = useState(true);
  const [leaveFilter, setLeaveFilter]         = useState("all");

  // ── Holiday state ──────────────────────────────────────────────────────────
  const [holidays, setHolidays]               = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [holidayMonth, setHolidayMonth]       = useState(new Date());
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [newHoliday, setNewHoliday]           = useState({ name:"", date:"", type:"public", description:"" });
  const [employees, setEmployees] = useState([]);

  const token = localStorage.getItem("adminToken");
  const hasFetched = useRef(false);

  // ── Parallel initial data load ─────────────────────────────────────────────
  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);

    await Promise.all([
      fetchAttendance(isRefresh),
      fetchLeaves(isRefresh),
      fetchHolidays(isRefresh),
      fetchEmployees(isRefresh),
    ]);

    if (isRefresh) setRefreshing(false);
  }, [token]);

  // ── Fetch employees ────────────────────────────────────────────────────────
  const fetchEmployees = async (isRefresh = false) => {
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
    }
  };

  // ── Fetch attendance ───────────────────────────────────────────────────────
  const fetchAttendance = async (isRefresh = false) => {
    if (!token) return;
    if (!isRefresh) setLoadingAttendance(true);

    try {
      const empRes = await fetch(`${API}/employee/get/employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!empRes.ok) throw new Error("Failed to load employees");
      const empJson = await empRes.json();
      const employeesList = Array.isArray(empJson) ? empJson : empJson.employees || empJson.data || [];

      if (employeesList.length === 0) {
        setAttendanceData([]);
        setFilteredRecords([]);
        setLoadingAttendance(false);
        return;
      }

      const results = await Promise.all(
        employeesList.map((emp) =>
          fetch(`${API}/attendance/admin/employee/${emp._id}/attendance`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
              const records = Array.isArray(data) ? data : data.attendance || data.data || [];
              return records.map((rec) => ({
                _id: rec._id,
                employeeId: {
                  _id: emp._id,
                  name: emp.name,
                  email: emp.email,
                  department: emp.department,
                  position: emp.position,
                  loginId: emp.loginId,
                  salary: emp.salary,
                },
                date: rec.date,
                clockIn: rec.clockIn,
                clockOut: rec.clockOut,
                hoursWorked: rec.hoursWorked || 0,
                status: rec.status || (rec.clockIn && rec.clockOut ? "Present" : rec.clockIn ? "Late" : "Absent"),
                location: rec.location,
              }));
            })
            .catch(() => [])
        )
      );

      const all = results.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
      setAttendanceData(all);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoadingAttendance(false);
    }
  };

  // ── Fetch leaves ───────────────────────────────────────────────────────────
  const fetchLeaves = async (isRefresh = false) => {
    if (!token) return;
    if (!isRefresh) setLoadingLeaves(true);
    try {
      const res = await fetch(`${API}/leaves/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.leaves || data.data || [];
      setLeaveRequests(list);
    } catch {
      setLeaveRequests([]);
    } finally {
      setLoadingLeaves(false);
    }
  };

  // ── Fetch holidays ─────────────────────────────────────────────────────────
  const fetchHolidays = async (isRefresh = false) => {
    if (!token) return;
    if (!isRefresh) setLoadingHolidays(true);
    try {
      const res = await fetch(`${API}/holidays/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.holidays || data.data || [];
      setHolidays(list);
    } catch {
      setHolidays([]);
    } finally {
      setLoadingHolidays(false);
    }
  };

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAllData(false);
    }
  }, [fetchAllData]);

  // ── Filter + stats ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!attendanceData.length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = attendanceData.filter((rec) => {
      if (dateFilter === "today") return isSameDay(parseISO(rec.date), today);
      if (dateFilter === "month") return isSameMonth(parseISO(rec.date), selectedMonth);
      return true;
    });

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(({ employeeId: e }) =>
        e?.name?.toLowerCase().includes(q) ||
        e?.email?.toLowerCase().includes(q) ||
        e?.loginId?.toLowerCase().includes(q) ||
        e?.position?.toLowerCase().includes(q)
      );
    }

    setFilteredRecords(filtered);
    setCurrentPage(1);

    const todayRecs = attendanceData.filter((rec) => isSameDay(parseISO(rec.date), today));
    const presentIDs = new Set(todayRecs.filter((r) => r.clockIn).map((r) => r.employeeId._id));
    const allIDs = new Set(attendanceData.map((r) => r.employeeId._id));
    const completed = todayRecs.filter((r) => r.clockIn && r.clockOut);
    const totalHrs = completed.reduce((s, r) => s + (r.hoursWorked || 0), 0);

    setSummaryStats({
      totalEmployees: allIDs.size,
      clockedInNow: presentIDs.size,
      completedToday: completed.length,
      absentToday: Math.max(0, allIDs.size - presentIDs.size),
      avgHoursToday: completed.length ? parseFloat((totalHrs / completed.length).toFixed(1)) : 0,
    });
  }, [attendanceData, searchTerm, dateFilter, selectedMonth]);

  // ── Month summary ──────────────────────────────────────────────────────────
  const employeeSummaries = useMemo(() => {
    if (dateFilter !== "month") return [];
    const map = new Map();
    filteredRecords.forEach((rec) => {
      const id = rec.employeeId._id;
      if (!map.has(id)) map.set(id, { ...rec.employeeId, records: [] });
      map.get(id).records.push(rec);
    });
    return Array.from(map.values()).map((emp) => {
      const present = emp.records.filter((r) => r.status === "Present").length;
      const absent = emp.records.filter((r) => r.status === "Absent").length;
      const late = emp.records.filter((r) => r.status === "Late").length;
      const totalHrs = emp.records.reduce((s, r) => s + (r.hoursWorked || 0), 0);
      const pct = emp.records.length ? Math.round((present / emp.records.length) * 100) : 0;
      return { ...emp, present, absent, late, totalHrs, pct };
    });
  }, [filteredRecords, dateFilter]);

  // ── Leave helpers ──────────────────────────────────────────────────────────
  const filteredLeaves = useMemo(() =>
    leaveFilter === "all" ? leaveRequests : leaveRequests.filter((l) => l.status === leaveFilter),
    [leaveRequests, leaveFilter]
  );

  const pendingCount = leaveRequests.filter((l) => l.status === "pending").length;
  const approvedCount = leaveRequests.filter((l) => l.status === "approved").length;
  const rejectedCount = leaveRequests.filter((l) => l.status === "rejected").length;

  const updateLeaveStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/leaves/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast.success(`Leave ${status}`); fetchLeaves(true); }
      else toast.error(`Failed to ${status} leave`);
    } catch { toast.error("Network error"); }
  };

  // ── Holiday helpers ────────────────────────────────────────────────────────
  const holidayMap = useMemo(() => {
    const m = new Map();
    holidays.forEach((h) => m.set(h.date, h));
    return m;
  }, [holidays]);

  const getHolidayForDate = (date) => holidayMap.get(format(date, "yyyy-MM-dd")) || null;

  const { days: calDays, leadingBlanks: calBlanks } = useMemo(() => {
    const start = startOfMonth(holidayMonth);
    return {
      days: eachDayOfInterval({ start, end: endOfMonth(holidayMonth) }),
      leadingBlanks: getDay(start),
    };
  }, [holidayMonth]);

  const addHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) { toast.error("Name and date are required"); return; }
    try {
      const res = await fetch(`${API}/holidays/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newHoliday),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Holiday added"); setShowAddModal(false); setNewHoliday({ name:"", date:"", type:"public", description:"" }); fetchHolidays(true); }
      else toast.error(data.error || "Failed to add holiday");
    } catch { toast.error("Network error"); }
  };

  const updateHoliday = async () => {
    if (!selectedHoliday) return;
    try {
      const res = await fetch(`${API}/holidays/update/${selectedHoliday._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(selectedHoliday),
      });
      if (res.ok) { toast.success("Holiday updated"); setShowEditModal(false); setSelectedHoliday(null); fetchHolidays(true); }
      else toast.error("Failed to update holiday");
    } catch { toast.error("Network error"); }
  };

  const deleteHoliday = async () => {
    if (!selectedHoliday) return;
    try {
      const res = await fetch(`${API}/holidays/delete/${selectedHoliday._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Holiday deleted"); setShowDeleteModal(false); setSelectedHoliday(null); fetchHolidays(true); }
      else toast.error("Failed to delete holiday");
    } catch { toast.error("Network error"); }
  };

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ── Export attendance ──────────────────────────────────────────────────────
  const exportToExcel = () => {
    if (!filteredRecords.length) { toast.error("No records to export"); return; }
    const data = filteredRecords.map((r) => ({
      "Employee Name": r.employeeId?.name || "-",
      Email: r.employeeId?.email || "-",
      Department: getDeptName(r.employeeId?.department),
      Position: r.employeeId?.position || "-",
      Date: format(parseISO(r.date), "dd MMM yyyy"),
      "Clock In": r.clockIn ? format(parseISO(r.clockIn), "hh:mm:ss a") : "--",
      "Clock Out": r.clockOut ? format(parseISO(r.clockOut), "hh:mm:ss a") : "--",
      "Hours Worked": r.hoursWorked ? r.hoursWorked.toFixed(2) : "0",
      Status: r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Exported successfully");
  };

  const isInitialLoad = loadingAttendance && loadingLeaves && loadingHolidays;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto">

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-7 h-7 text-indigo-600" />
                Employee Management Dashboard
              </h1>
              <p className="text-gray-500 text-sm mt-1">Attendance · Leave Requests · Holiday Calendar</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchAllData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition text-gray-700 text-sm disabled:opacity-60"
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
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Holiday
                </button>
              )}
            </div>
          </div>

          {/* ── Stats Cards (Attendance) ────────────────────────────────────── */}
          {activeTab === "attendance" && (
            isInitialLoad ? <SkeletonStats /> : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <StatCard icon={UserCheck} label="Total Employees" value={summaryStats.totalEmployees} color="blue" />
                <StatCard icon={Clock3} label="Clocked In Today" value={summaryStats.clockedInNow} color="orange" />
                <StatCard icon={TrendingUp} label="Completed Today" value={summaryStats.completedToday} color="green" />
                <StatCard icon={UserX} label="Absent Today" value={summaryStats.absentToday} color="red" />
                <StatCard icon={Calendar} label="Avg Hours Today" value={`${summaryStats.avgHoursToday}h`} color="purple" />
              </div>
            )
          )}

          {/* ── Tab Switcher ──────────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "attendance", label: "📋 Attendance & Leaves" },
                { id: "holidays", label: "📅 Holiday Calendar" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === id ? "bg-indigo-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ════════════════ ATTENDANCE TAB ════════════════════════════════════ */}
          {activeTab === "attendance" && (
            <>
              {/* Filters bar */}
              <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">View:</span>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {["today","month"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setDateFilter(f)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition capitalize ${
                            dateFilter === f ? "bg-indigo-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {f === "today" ? "Today" : "Month View"}
                        </button>
                      ))}
                    </div>
                    {dateFilter === "month" && (
                      <div className="flex items-center gap-2 ml-2">
                        <button onClick={() => setSelectedMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 rounded">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 min-w-[110px] text-center">
                          {format(selectedMonth, "MMMM yyyy")}
                        </span>
                        <button onClick={() => setSelectedMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 rounded">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, ID…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full md:w-72 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Two-column: table + leaves */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {loadingAttendance ? (
                    <SkeletonTable cols={dateFilter === "today" ? 7 : 9} rows={8} />
                  ) : dateFilter === "today" ? (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              {["Employee","Dept / Role","Clock In","Clock Out","Hours","Status","Actions"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedRecords.length === 0 ? (
                              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No records found</td></tr>
                            ) : paginatedRecords.map((rec, i) => (
                              <tr key={rec._id || i} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3">
                                  <p className="font-medium text-gray-800">{rec.employeeId?.name || "—"}</p>
                                  <p className="text-xs text-gray-400">{rec.employeeId?.email || ""}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{getDeptName(rec.employeeId?.department)}</span>
                                  <p className="text-xs text-gray-500 mt-1">{rec.employeeId?.position || ""}</p>
                                </td>
                                <td className="px-4 py-3 font-mono text-sm">{fmtTime(rec.clockIn)}</td>
                                <td className="px-4 py-3 font-mono text-sm">{fmtTime(rec.clockOut)}</td>
                                <td className="px-4 py-3">{rec.hoursWorked ? `${rec.hoursWorked.toFixed(1)}h` : "--"}</td>
                                <td className="px-4 py-3"><StatusBadge status={rec.status} /></td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => { setSelectedEmployee({ ...rec.employeeId, records: [rec] }); setShowDetailModal(true); }}
                                    className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {totalPages > 1 && (
                        <div className="flex justify-between items-center px-4 py-3 border-t text-sm">
                          <button onClick={() => setCurrentPage((p) => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 rounded disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                          <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
                          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 rounded disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              {["Employee","Dept","Position","Present","Absent","Late","Total Hrs","Attendance %","Actions"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {employeeSummaries.length === 0 ? (
                              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No records for this month</td></tr>
                            ) : employeeSummaries.map((emp) => (
                              <tr key={emp._id} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3">
                                  <p className="font-medium text-gray-800">{emp.name}</p>
                                  <p className="text-xs text-gray-400">{emp.email}</p>
                                </td>
                                <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-1 rounded">{getDeptName(emp.department)}</span></td>
                                <td className="px-4 py-3 text-xs text-gray-600">{emp.position || "--"}</td>
                                <td className="px-4 py-3 text-center font-semibold text-green-600">{emp.present}</td>
                                <td className="px-4 py-3 text-center font-semibold text-red-600">{emp.absent}</td>
                                <td className="px-4 py-3 text-center font-semibold text-yellow-600">{emp.late}</td>
                                <td className="px-4 py-3 text-center">{emp.totalHrs.toFixed(1)}h</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`font-semibold text-sm ${emp.pct >= 75 ? "text-green-600" : emp.pct >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                                    {emp.pct}%
                                  </span>
                                  <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1 mx-auto">
                                    <div className={`h-1.5 rounded-full ${emp.pct >= 75 ? "bg-green-500" : emp.pct >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${emp.pct}%` }} />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => { setSelectedEmployee(emp); setShowDetailModal(true); }}
                                    className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Leave Requests Panel */}
                {loadingLeaves ? <SkeletonLeavePanel /> : (
                  <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <Users className="w-5 h-5 text-indigo-600" /> Leave Requests
                        </h3>
                        <button onClick={() => fetchLeaves(true)} className="p-1 text-gray-400 hover:text-gray-600">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 text-center p-2 bg-yellow-50 rounded-lg">
                          <p className="text-xs text-yellow-600">Pending</p>
                          <p className="text-lg font-bold text-yellow-700">{pendingCount}</p>
                        </div>
                        <div className="flex-1 text-center p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-600">Approved</p>
                          <p className="text-lg font-bold text-green-700">{approvedCount}</p>
                        </div>
                        <div className="flex-1 text-center p-2 bg-red-50 rounded-lg">
                          <p className="text-xs text-red-600">Rejected</p>
                          <p className="text-lg font-bold text-red-700">{rejectedCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 border-b flex gap-1">
                      {["all","pending","approved","rejected"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setLeaveFilter(f)}
                          className={`flex-1 px-2 py-1 text-xs font-medium rounded-md capitalize ${
                            leaveFilter === f ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    <div className="divide-y max-h-[520px] overflow-y-auto">
                      {filteredLeaves.length === 0 ? (
                        <p className="p-8 text-center text-gray-400 text-sm">No leave requests</p>
                      ) : filteredLeaves.map((leave) => (
                        <div key={leave._id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{leave.employeeId?.name || "Unknown"}</p>
                              <p className="text-xs text-gray-400">{leave.employeeId?.department || "-"}</p>
                            </div>
                            <StatusBadge status={leave.status} />
                          </div>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <p>📅 {format(parseISO(leave.startDate), "dd MMM")} – {format(parseISO(leave.endDate), "dd MMM yyyy")}</p>
                            <p>📝 {leave.reason || "No reason provided"}</p>
                            <p>⏱️ {leave.days || 1} day(s)</p>
                          </div>
                          {leave.status === "pending" && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => updateLeaveStatus(leave._id, "approved")}
                                className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => updateLeaveStatus(leave._id, "rejected")}
                                className="flex-1 px-2 py-1 bg-red-500 text-white rounded text-xs flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════════════════ HOLIDAY TAB ═══════════════════════════════════════ */}
          {activeTab === "holidays" && (
            loadingHolidays ? <SkeletonHolidayCalendar /> : (
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setHolidayMonth((m) => subMonths(m, 1))} className="p-2 hover:bg-gray-200 rounded-lg">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-semibold text-gray-800">{format(holidayMonth, "MMMM yyyy")}</h2>
                      <button onClick={() => setHolidayMonth((m) => addMonths(m, 1))} className="p-2 hover:bg-gray-200 rounded-lg">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <button onClick={() => setHolidayMonth(new Date())} className="px-3 py-1 text-sm bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200">
                      Today
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {WEEK_DAYS.map((d, i) => (
                      <div key={i} className={`text-center text-sm font-semibold py-2 ${i === 0 || i === 6 ? "text-red-500" : "text-gray-600"}`}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: calBlanks }).map((_, i) => (
                      <div key={`b-${i}`} className="min-h-[100px] bg-gray-50 rounded-lg" />
                    ))}
                    {calDays.map((day, idx) => {
                      const holiday = getHolidayForDate(day);
                      const weekend = isWeekend(day);
                      const isTodays = isToday(day);
                      const hType = holiday ? HOLIDAY_TYPES[holiday.type] : null;

                      return (
                        <div
                          key={idx}
                          onClick={() => holiday && (setSelectedHoliday(holiday), setShowEditModal(true))}
                          className={`min-h-[100px] p-2 rounded-lg border transition-all ${holiday ? "cursor-pointer" : ""} ${
                            isTodays ? "ring-2 ring-indigo-500" : ""
                          } ${
                            holiday ? `${hType.bg} border-l-4 ${hType.border}` : weekend ? "bg-purple-50 border-gray-100" : "bg-white border-gray-100"
                          } hover:shadow-md`}
                        >
                          <div className="flex justify-between items-start">
                            <span className={`text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full ${
                              isTodays ? "bg-indigo-600 text-white" : weekend && !holiday ? "text-purple-600" : "text-gray-700"
                            }`}>
                              {format(day, "d")}
                            </span>
                            {holiday && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Holiday</span>}
                            {!holiday && weekend && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">Weekend</span>}
                          </div>
                          {holiday && (
                            <div className="mt-1">
                              <p className="text-xs font-semibold text-gray-800 leading-tight">{holiday.name}</p>
                              {holiday.description && <p className="text-[10px] text-gray-500 truncate">{holiday.description}</p>}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${hType?.color}`}>{hType?.name}</span>
                            </div>
                          )}
                          {!holiday && weekend && (
                            <div className="mt-1">
                              <p className="text-xs text-purple-600 font-medium">Weekend</p>
                              <p className="text-[10px] text-gray-400">No work</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded" /><span className="text-xs text-gray-600">Weekend</span></div>
                    {Object.entries(HOLIDAY_TYPES).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-1.5"><div className={`w-3 h-3 ${val.bg} border ${val.border} rounded`} /><span className="text-xs text-gray-600">{val.name}</span></div>
                    ))}
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-indigo-500 rounded-full" /><span className="text-xs text-gray-600">Today</span></div>
                  </div>
                </div>

                <div className="border-t">
                  <div className="p-4 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">All Holidays ({holidays.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {["Holiday Name","Date","Day","Type","Description","Actions"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {holidays.length === 0 ? (
                          <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No holidays. Click "Add Holiday" to create one.</td></tr>
                        ) : [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date)).map((h) => {
                          const HIcon = HOLIDAY_TYPES[h.type]?.icon || Calendar;
                          return (
                            <tr key={h._id} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3 font-medium">{h.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap">{format(parseISO(h.date), "dd MMM yyyy")}</td>
                              <td className="px-4 py-3">{format(parseISO(h.date), "EEEE")}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${HOLIDAY_TYPES[h.type]?.color || "bg-gray-100"}`}>
                                  <HIcon className="w-3 h-3" />
                                  {HOLIDAY_TYPES[h.type]?.name || h.type}
                                </span>
                               </td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{h.description || "-"}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  <button onClick={() => { setSelectedHoliday(h); setShowEditModal(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => { setSelectedHoliday(h); setShowDeleteModal(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                               </td>
                             </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Footer */}
          <p className="text-xs text-gray-400 text-center mt-6">
            Last sync: {new Date().toLocaleTimeString()} ·{" "}
            {activeTab === "attendance"
              ? dateFilter === "today" ? "Today's attendance" : `Month: ${format(selectedMonth, "MMMM yyyy")}`
              : "Holiday Calendar"}
          </p>
        </div>
      </div>

      {/* ════════ Detail Modal ════════════════════════════════════════════════ */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-white font-semibold text-lg">Attendance Details</h3>
                <p className="text-indigo-200 text-sm">
                  {selectedEmployee.name} · {dateFilter === "month" ? format(selectedMonth, "MMMM yyyy") : format(new Date(), "dd MMM yyyy")}
                </p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Present", val: selectedEmployee.records?.filter((r) => r.status === "Present").length ?? 0, bg: "bg-green-50", text: "text-green-700" },
                  { label: "Absent", val: selectedEmployee.records?.filter((r) => r.status === "Absent").length ?? 0, bg: "bg-red-50", text: "text-red-700" },
                  { label: "Late", val: selectedEmployee.records?.filter((r) => r.status === "Late").length ?? 0, bg: "bg-yellow-50", text: "text-yellow-700" },
                  { label: "Total Hrs", val: `${(selectedEmployee.records?.reduce((s, r) => s + (r.hoursWorked || 0), 0) || selectedEmployee.hoursWorked || 0).toFixed(1)}h`, bg: "bg-purple-50", text: "text-purple-700" },
                ].map(({ label, val, bg, text }) => (
                  <div key={label} className={`${bg} rounded-lg p-3 text-center`}>
                    <p className={`text-xs ${text} mb-1`}>{label}</p>
                    <p className={`text-2xl font-bold ${text}`}>{val}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>{["Date","Day","Clock In","Clock Out","Hours","Status"].map((h) => (<th key={h} className="px-4 py-2 text-left font-medium text-gray-600">{h}</th>))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedEmployee.records || [selectedEmployee])
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((rec, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap">{format(parseISO(rec.date), "dd MMM yyyy")}</td>
                          <td className="px-4 py-2">{format(parseISO(rec.date), "EEEE")}</td>
                          <td className="px-4 py-2 font-mono">{fmtTime(rec.clockIn)}</td>
                          <td className="px-4 py-2 font-mono">{fmtTime(rec.clockOut)}</td>
                          <td className="px-4 py-2">{rec.hoursWorked ? `${rec.hoursWorked.toFixed(1)}h` : "--"}</td>
                          <td className="px-4 py-2"><StatusBadge status={rec.status} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ Add Holiday Modal ═══════════════════════════════════════════ */}
      {showAddModal && (
        <HolidayModal title="Add New Holiday" color="bg-indigo-600" onClose={() => setShowAddModal(false)} onConfirm={addHoliday} confirmLabel="Save Holiday">
          <Field label="Holiday Name *">
            <input type="text" value={newHoliday.name} onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })} className={inputCls} placeholder="e.g. Diwali" />
          </Field>
          <Field label="Date *">
            <input type="date" value={newHoliday.date} onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Type">
            <select value={newHoliday.type} onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value })} className={inputCls}>
              {Object.entries(HOLIDAY_TYPES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <textarea value={newHoliday.description} onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })} className={inputCls} rows={2} placeholder="Optional details" />
          </Field>
        </HolidayModal>
      )}

      {/* ════════ Edit Holiday Modal ══════════════════════════════════════════ */}
      {showEditModal && selectedHoliday && (
        <HolidayModal title="Edit Holiday" color="bg-blue-600" onClose={() => { setShowEditModal(false); setSelectedHoliday(null); }} onConfirm={updateHoliday} confirmLabel="Update Holiday">
          <Field label="Holiday Name">
            <input type="text" value={selectedHoliday.name} onChange={(e) => setSelectedHoliday({ ...selectedHoliday, name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Date">
            <input type="date" value={selectedHoliday.date} onChange={(e) => setSelectedHoliday({ ...selectedHoliday, date: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Type">
            <select value={selectedHoliday.type} onChange={(e) => setSelectedHoliday({ ...selectedHoliday, type: e.target.value })} className={inputCls}>
              {Object.entries(HOLIDAY_TYPES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <textarea value={selectedHoliday.description} onChange={(e) => setSelectedHoliday({ ...selectedHoliday, description: e.target.value })} className={inputCls} rows={2} />
          </Field>
        </HolidayModal>
      )}

      {/* ════════ Delete Holiday Modal ════════════════════════════════════════ */}
      {showDeleteModal && selectedHoliday && (
        <HolidayModal title="Delete Holiday" color="bg-red-600" onClose={() => { setShowDeleteModal(false); setSelectedHoliday(null); }} onConfirm={deleteHoliday} confirmLabel="Delete">
          <p className="text-gray-700">Are you sure you want to delete this holiday?</p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium">{selectedHoliday.name}</p>
            <p className="text-sm text-gray-500">{format(parseISO(selectedHoliday.date), "dd MMM yyyy")}</p>
          </div>
        </HolidayModal>
      )}
    </>
  );
};

export default AdminAttendanceMonitor;