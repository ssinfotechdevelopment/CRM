import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  isAfter,
  startOfToday,
} from "date-fns";
import {
  Clock,
  Calendar,
  RefreshCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Bell,
  X,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";

// ─── Skeleton Primitives ───────────────────────────────────────────────────────
const Shimmer = ({ className = "" }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded ${className}`} />
);

const SkeletonTimeCard = () => (
  <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-3 flex-1">
        <Shimmer className="h-5 w-32" />
        <Shimmer className="h-10 w-48" />
        <Shimmer className="h-4 w-56" />
      </div>
      <Shimmer className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex-shrink-0" />
    </div>
  </div>
);

const SkeletonAttendanceCard = () => (
  <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
    <Shimmer className="h-6 w-48 mb-6" />
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-gray-50 p-4 rounded-lg space-y-2">
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-8 w-28" />
          <Shimmer className="h-3 w-24" />
        </div>
      ))}
    </div>
    <div className="flex gap-4 mb-6">
      <Shimmer className="h-10 w-32 rounded-lg" />
    </div>
    <Shimmer className="h-12 w-full rounded-lg" />
  </div>
);

const SkeletonCalendar = () => (
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <div className="px-3 sm:px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
      <Shimmer className="h-5 w-36" />
      <Shimmer className="h-6 w-12 rounded" />
    </div>
    <div className="p-2 sm:p-3">
      <div className="flex justify-between items-center mb-3">
        <Shimmer className="h-8 w-8 rounded" />
        <Shimmer className="h-5 w-32" />
        <Shimmer className="h-8 w-8 rounded" />
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Shimmer key={i} className="h-6" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: 35 }).map((_, i) => (
          <Shimmer key={i} className="h-[70px] sm:h-[85px]" />
        ))}
      </div>
    </div>
  </div>
);

const SkeletonNotification = () => (
  <div className="bg-orange-50 border-l-4 border-orange-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <Shimmer className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-4 w-36" />
        <Shimmer className="h-3 w-64" />
        <Shimmer className="h-3 w-52" />
      </div>
    </div>
  </div>
);

const SkeletonExport = () => (
  <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex gap-4 items-center">
        <Shimmer className="h-6 w-40" />
        <Shimmer className="h-10 w-40 rounded-lg" />
      </div>
      <Shimmer className="h-10 w-56 rounded-lg" />
    </div>
  </div>
);

const SkeletonTable = () => (
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <div className="px-4 sm:px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
      <Shimmer className="h-6 w-44" />
      <Shimmer className="h-8 w-24 rounded" />
    </div>
    <div className="p-4 space-y-2">
      {/* Header row */}
      <div className="grid grid-cols-6 gap-3 pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Shimmer key={i} className="h-5" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-3 py-1">
          {Array.from({ length: 6 }).map((__, j) => (
            <Shimmer key={j} className="h-9 rounded" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ─── Full Skeleton Layout ──────────────────────────────────────────────────────
const FullPageSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      <SkeletonNotification />
      <SkeletonTimeCard />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <SkeletonAttendanceCard />
        </div>
        <SkeletonCalendar />
      </div>
      <SkeletonExport />
      <SkeletonTable />
    </div>
  </div>
);

// ─── Helpers (defined once, outside component) ────────────────────────────────
const formatTime = (date) => {
  if (!date) return "--";
  return format(new Date(date), "hh:mm a");
};

const formatTimeWithSeconds = (date) => {
  if (!date) return "--";
  return format(new Date(date), "hh:mm:ss a");
};

const formatDate = (date) => format(new Date(date), "dd MMM yyyy");

const formatWorkedTime = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return "--";
  const diffMs = new Date(clockOut) - new Date(clockIn);
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} hours`;
  return `${hours}h ${minutes}m`;
};

const isWeekendDay = (date) => {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;
  const day = d.getDay();
  return day === 0 || day === 6;
};

// Build combined records from API data + generated absent/weekend rows
const buildCombinedRecords = (records) => {
  const startDate = new Date(2024, 0, 1);
  const endDate = new Date();
  const allDates = eachDayOfInterval({ start: startDate, end: endDate });

  // Build lookup map for O(1) access
  const recordMap = new Map();
  records.forEach((r) => {
    const key = format(new Date(r.date), "yyyy-MM-dd");
    recordMap.set(key, r);
  });

  return allDates
    .map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const existing = recordMap.get(dateStr);
      if (existing) return existing;
      return {
        date: dateStr,
        clockIn: null,
        clockOut: null,
        status: isWeekendDay(date) ? "weekend" : "absent",
        hoursWorked: 0,
      };
    })
    .reverse(); // newest first
};

// ─── Main Component ────────────────────────────────────────────────────────────
const EmployeeAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);           // initial full-page load
  const [refreshing, setRefreshing] = useState(false);    // refresh spinner only
  const [clocking, setClocking] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showNotification, setShowNotification] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("employeeToken");
  const hasFetched = useRef(false);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      toast.error("Please login first");
      navigate("/employee/login", { replace: true });
    }
  }, [token, navigate]);

  // ── Live clock ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Core data fetch (parallel) ─────────────────────────────────────────────
  const fetchAllData = useCallback(
    async (isRefresh = false) => {
      if (!token) return;
      isRefresh ? setRefreshing(true) : setLoading(true);

      try {
        // Fire both requests simultaneously
        const [attendanceRes, holidaysRes] = await Promise.all([
          fetch("https://sscrmbackend.ssinfotech.co.in/api/attendance/history", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("https://sscrmbackend.ssinfotech.co.in/api/holidays/all"),
        ]);

        // ── Process attendance ────────────────────────────────────────────
        const attendanceResult = await attendanceRes.json();
        if (!attendanceRes.ok)
          throw new Error(attendanceResult.message || "Failed to load attendance");

        const records = Array.isArray(attendanceResult.data) ? attendanceResult.data : [];
        setAttendance(records);

        const combined = buildCombinedRecords(records);
        setAllAttendanceRecords(combined);

        const todayStr = new Date().toLocaleDateString("en-CA");
        setTodayRecord(
          records.find((r) => new Date(r.date).toLocaleDateString("en-CA") === todayStr) || null
        );

        // ── Process holidays ──────────────────────────────────────────────
        if (holidaysRes.ok) {
          const holidayData = await holidaysRes.json();
          let list = [];
          if (Array.isArray(holidayData)) list = holidayData;
          else if (holidayData.holidays) list = holidayData.holidays;
          else if (holidayData.data) list = holidayData.data;
          setHolidays(list);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  // ── Initial load (once) ────────────────────────────────────────────────────
  useEffect(() => {
    if (token && !hasFetched.current) {
      hasFetched.current = true;
      fetchAllData(false);
    }
  }, [fetchAllData, token]);

  // ── Holiday helpers (memoised) ─────────────────────────────────────────────
  const holidayMap = useMemo(() => {
    const map = new Map();
    holidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  const getHolidayForDate = useCallback(
    (date) => {
      const dateStr = format(date instanceof Date ? date : new Date(date), "yyyy-MM-dd");
      return holidayMap.get(dateStr) || null;
    },
    [holidayMap]
  );

  const currentDate = useMemo(() => new Date(), []);
  const isTodayWeekend = isWeekendDay(currentDate);

  const todayHoliday = useMemo(() => {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    return holidayMap.get(dateStr) || null;
  }, [holidayMap, currentDate]);

  const isTodayHoliday = !!todayHoliday;
  const showNoAttendanceMessage = isTodayHoliday || isTodayWeekend;

  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    const limit = new Date();
    limit.setDate(today.getDate() + 30);
    return holidays
      .filter((h) => {
        const d = new Date(h.date);
        return d >= today && d <= limit;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [holidays]);

  // ── Button states ──────────────────────────────────────────────────────────
  const canClockIn = !todayRecord?.clockIn && !showNoAttendanceMessage;
  const canClockOut = todayRecord?.clockIn && !todayRecord?.clockOut && !showNoAttendanceMessage;
  const isCompleted = todayRecord?.clockIn && todayRecord?.clockOut;

  // ── Clock In ───────────────────────────────────────────────────────────────
  const handleClockIn = async () => {
    setClocking("in");
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      );

      const { latitude, longitude } = position.coords;
      const res = await fetch(
        "https://sscrmbackend.ssinfotech.co.in/api/attendance/clock-in",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ latitude, longitude, locationName: "Current Location" }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Clock-in failed");

      toast.success("Clocked in successfully");
      fetchAllData(true);
    } catch (err) {
      toast.error(err.message || "GPS access denied");
    } finally {
      setClocking("");
    }
  };

  // ── Clock Out ──────────────────────────────────────────────────────────────
  const handleClockOut = async () => {
    setClocking("out");
    try {
      const res = await fetch(
        "https://sscrmbackend.ssinfotech.co.in/api/attendance/clock-out",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Clock-out failed");
      toast.success("Clocked out successfully");
      fetchAllData(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClocking("");
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const monthRecords = allAttendanceRecords
      .filter((r) => {
        const d = new Date(r.date);
        return d >= monthStart && d <= monthEnd;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (monthRecords.length === 0) {
      toast.error("No records found for selected month");
      return;
    }

    const excelData = monthRecords.map((record) => {
      const recordDate = new Date(record.date);
      const isWeekendDate = isWeekendDay(recordDate);
      const isFutureDate = isAfter(recordDate, startOfToday());
      const holiday = getHolidayForDate(recordDate);

      let status;
      if (isFutureDate) status = "Upcoming";
      else if (holiday) status = `Holiday: ${holiday.name}`;
      else if (isWeekendDate) status = "Weekend";
      else if (record.clockIn && record.clockOut) status = "Present";
      else if (record.clockIn && !record.clockOut) status = "Partial";
      else status = "Absent";

      return {
        Date: format(recordDate, "dd-MM-yyyy"),
        Day: format(recordDate, "EEEE"),
        "Clock In": record.clockIn ? format(new Date(record.clockIn), "hh:mm:ss a") : "--",
        "Clock Out": record.clockOut ? format(new Date(record.clockOut), "hh:mm:ss a") : "--",
        Duration: record.clockIn && record.clockOut ? formatWorkedTime(record.clockIn, record.clockOut) : "--",
        "Hours Worked": record.hoursWorked > 0 ? record.hoursWorked.toFixed(2) : "0",
        Status: status,
      };
    });

    const presentDays = excelData.filter((r) => r.Status === "Present").length;
    const absentDays = excelData.filter((r) => r.Status === "Absent").length;
    const partialDays = excelData.filter((r) => r.Status === "Partial").length;
    const holidayDays = excelData.filter((r) => r.Status.startsWith("Holiday")).length;
    const weekendDays = excelData.filter((r) => r.Status === "Weekend").length;
    const totalHours = excelData.reduce((s, r) => s + (parseFloat(r["Hours Worked"]) || 0), 0);

    excelData.push(
      {},
      { Date: "SUMMARY" },
      { Date: "Total Present Days", "Hours Worked": presentDays.toString() },
      { Date: "Total Absent Days", "Hours Worked": absentDays.toString() },
      { Date: "Total Partial Days", "Hours Worked": partialDays.toString() },
      { Date: "Total Holiday Days", "Hours Worked": holidayDays.toString() },
      { Date: "Total Weekend Days", "Hours Worked": weekendDays.toString() },
      { Date: "Total Hours Worked", "Hours Worked": totalHours.toFixed(2) }
    );

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws["!cols"] = [
      { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 15 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Attendance_${format(selectedMonth, "MMM_yyyy")}`);
    XLSX.writeFile(wb, `Attendance_${format(selectedMonth, "MMMM_yyyy")}.xlsx`);
    toast.success(`Exported ${format(selectedMonth, "MMMM yyyy")} successfully!`);
  };

  // ── Calendar helpers ───────────────────────────────────────────────────────
  const { days, leadingBlanks } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return { days: eachDayOfInterval({ start, end }), leadingBlanks: getDay(start) };
  }, [currentMonth]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getCalendarStatus = useCallback(
    (date) => {
      const holiday = getHolidayForDate(date);
      if (holiday) return { type: "holiday", name: holiday.name };
      if (isWeekendDay(date)) return { type: "weekend", name: "Weekend" };
      return { type: "normal", name: null };
    },
    [getHolidayForDate]
  );

  // ── Row status helper ──────────────────────────────────────────────────────
  const getRowStatus = useCallback(
    (record) => {
      const recordDate = new Date(record.date);
      const holiday = getHolidayForDate(recordDate);
      const isFuture = isAfter(recordDate, startOfToday());

      if (isFuture) return { label: "Upcoming", cls: "bg-gray-100 text-gray-600" };
      if (holiday) return { label: holiday.name, cls: "bg-red-100 text-red-800" };
      if (isWeekendDay(recordDate)) return { label: "Weekend", cls: "bg-purple-100 text-purple-800" };
      if (record.clockIn && record.clockOut) return { label: "Present", cls: "bg-green-100 text-green-800" };
      if (record.clockIn && !record.clockOut) return { label: "Partial", cls: "bg-yellow-100 text-yellow-800" };
      return { label: "Absent", cls: "bg-red-100 text-red-800" };
    },
    [getHolidayForDate]
  );

  // ── Auth guard render ──────────────────────────────────────────────────────
  if (!token) return null;

  // ── Full-page skeleton (initial load only) ─────────────────────────────────
  if (loading) return <><Toaster position="top-right" /><FullPageSkeleton /></>;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">

          {/* ── Upcoming Holidays Notification ───────────────────────────── */}
          {upcomingHolidays.length > 0 && showNotification && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 rounded-lg shadow-md p-4 relative">
              <button
                onClick={() => setShowNotification(false)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-full flex-shrink-0">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-orange-800">Upcoming Holidays</h3>
                  <div className="mt-1 space-y-1">
                    {upcomingHolidays.slice(0, 3).map((holiday, idx) => (
                      <p key={idx} className="text-xs text-gray-600">
                        📅 {format(new Date(holiday.date), "dd MMM yyyy")} –{" "}
                        <span className="font-medium">{holiday.name}</span>
                        {holiday.description && ` (${holiday.description})`}
                      </p>
                    ))}
                    {upcomingHolidays.length > 3 && (
                      <p className="text-xs text-orange-600">
                        + {upcomingHolidays.length - 3} more in next 30 days
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Current Time ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-700">Current Time</h3>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-2">
                  {format(currentTime, "hh:mm:ss a")}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {format(currentTime, "EEEE, dd MMMM yyyy")}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* ── Two-column layout ─────────────────────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-6">

            {/* Today's Attendance */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6">
                Today's Attendance
              </h2>

              {showNoAttendanceMessage ? (
                <div
                  className={`${
                    isTodayHoliday ? "bg-red-50 border-red-200" : "bg-purple-50 border-purple-200"
                  } border rounded-lg p-6 text-center`}
                >
                  <h3
                    className={`text-lg font-semibold ${
                      isTodayHoliday ? "text-red-800" : "text-purple-800"
                    } mb-2`}
                  >
                    {isTodayHoliday ? todayHoliday.name : "Weekend"}
                  </h3>
                  <p className={isTodayHoliday ? "text-red-600" : "text-purple-600"}>
                    {isTodayHoliday
                      ? todayHoliday.description || "No work today due to holiday"
                      : `Today is ${format(currentDate, "EEEE")}. Weekend – No attendance required.`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Clock In</p>
                      <p className="text-2xl font-medium">{formatTime(todayRecord?.clockIn)}</p>
                      {todayRecord?.clockIn && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeWithSeconds(todayRecord.clockIn)}
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Clock Out</p>
                      <p className="text-2xl font-medium">{formatTime(todayRecord?.clockOut)}</p>
                      {todayRecord?.clockOut && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeWithSeconds(todayRecord.clockOut)}
                        </p>
                      )}
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Hours Worked</p>
                      <p className="text-2xl font-medium text-indigo-600">
                        {todayRecord?.clockIn && todayRecord?.clockOut
                          ? formatWorkedTime(todayRecord.clockIn, todayRecord.clockOut)
                          : todayRecord?.clockIn
                          ? "In Progress..."
                          : "--"}
                      </p>
                      {todayRecord?.hoursWorked > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          ({todayRecord.hoursWorked.toFixed(2)} hrs)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-6">
                    {canClockIn && (
                      <button
                        onClick={handleClockIn}
                        disabled={clocking === "in"}
                        className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        {clocking === "in" ? "Clocking In…" : "Clock In"}
                      </button>
                    )}
                    {canClockOut && (
                      <button
                        onClick={handleClockOut}
                        disabled={clocking === "out"}
                        className="px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        {clocking === "out" ? "Clocking Out…" : "Clock Out"}
                      </button>
                    )}
                    {isCompleted && (
                      <div className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Attendance Completed
                      </div>
                    )}
                  </div>

                  <div
                    className={`p-3 rounded-lg ${
                      canClockIn ? "bg-blue-50" : canClockOut ? "bg-yellow-50" : "bg-green-50"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        canClockIn
                          ? "text-blue-700"
                          : canClockOut
                          ? "text-yellow-700"
                          : "text-green-700"
                      }`}
                    >
                      {canClockIn && "You can clock in for today's attendance."}
                      {canClockOut && "You have clocked in. Clock out when done."}
                      {isCompleted && "Your attendance for today is completed."}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Holiday Calendar */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-3 sm:px-4 py-3 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Holiday Calendar
                  </h2>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-2 py-1 text-xs bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition"
                  >
                    Today
                  </button>
                </div>
                {holidays.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">📅 {holidays.length} holidays</p>
                )}
              </div>

              <div className="p-2 sm:p-3">
                <div className="flex justify-between items-center mb-3">
                  <button
                    onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                    className="p-1 hover:bg-gray-100 rounded transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800">
                    {format(currentMonth, "MMMM yyyy")}
                  </h3>
                  <button
                    onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                    className="p-1 hover:bg-gray-100 rounded transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Week headers */}
                <div className="grid grid-cols-7 gap-0.5 mb-2">
                  {weekDays.map((day, idx) => (
                    <div
                      key={idx}
                      className={`text-center text-[10px] sm:text-xs font-semibold py-1 ${
                        idx === 0 || idx === 6 ? "text-purple-600" : "text-gray-600"
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: leadingBlanks }).map((_, i) => (
                    <div key={`blank-${i}`} className="min-h-[70px] sm:min-h-[85px]" />
                  ))}
                  {days.map((day, idx) => {
                    const { type, name } = getCalendarStatus(day);
                    const isTodayDate = isSameDay(day, currentDate);

                    let bg = "bg-white";
                    let textColor = "";
                    let label = "";

                    if (type === "holiday") {
                      bg = "bg-red-50";
                      textColor = "text-red-600";
                      label = name.length > 12 ? name.substring(0, 10) + "…" : name;
                    } else if (type === "weekend") {
                      bg = "bg-purple-50";
                      textColor = "text-purple-600";
                      label = "Weekend";
                    }

                    return (
                      <div
                        key={idx}
                        className={`text-center p-1 rounded min-h-[70px] sm:min-h-[85px] flex flex-col items-center justify-start ${bg} ${
                          isTodayDate ? "ring-2 ring-indigo-500 ring-inset" : ""
                        } transition-all`}
                      >
                        <span
                          className={`text-xs sm:text-sm font-semibold inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full ${
                            isTodayDate ? "bg-indigo-600 text-white" : "text-gray-700"
                          }`}
                        >
                          {format(day, "d")}
                        </span>
                        {label && (
                          <span
                            className={`text-[9px] sm:text-[10px] font-medium mt-1 text-center leading-tight ${textColor}`}
                          >
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-3 pt-2 border-t flex justify-center gap-4">
                  {[
                    { color: "bg-red-500", label: "Holiday" },
                    { color: "bg-purple-500", label: "Weekend" },
                    { color: "bg-indigo-500", label: "Today" },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className={`w-2 h-2 ${color} rounded-full`} />
                      <span className="text-[9px] sm:text-xs text-gray-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Export Section ────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Export Attendance</h3>
                <select
                  value={format(selectedMonth, "yyyy-MM")}
                  onChange={(e) => setSelectedMonth(new Date(`${e.target.value}-01`))}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  {Array.from({ length: 12 }).map((_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    return (
                      <option key={i} value={format(d, "yyyy-MM")}>
                        {format(d, "MMMM yyyy")}
                      </option>
                    );
                  })}
                </select>
              </div>
              <button
                onClick={exportToExcel}
                className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm sm:text-base"
              >
                <Download className="w-4 h-4" />
                Download Excel ({format(selectedMonth, "MMMM yyyy")})
              </button>
            </div>
          </div>

          {/* ── Attendance History Table ──────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b bg-gray-50 flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                Attendance History
              </h2>
              <button
                onClick={() => fetchAllData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded transition text-sm disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {allAttendanceRecords.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No attendance records yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {["Date", "Day", "Clock In", "Clock Out", "Duration", "Status"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 sm:px-6 py-3 font-medium text-gray-700 border-b"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allAttendanceRecords.map((record, i) => {
                      const { label, cls } = getRowStatus(record);
                      const recordDate = new Date(record.date);
                      return (
                        <tr key={i} className="hover:bg-gray-50 transition">
                          <td className="px-3 sm:px-6 py-3 font-medium whitespace-nowrap">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 text-gray-600 whitespace-nowrap">
                            {format(recordDate, "EEEE")}
                          </td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                            {record.clockIn ? (
                              <>
                                <div>{formatTime(record.clockIn)}</div>
                                <div className="text-xs text-gray-400">
                                  {formatTimeWithSeconds(record.clockIn)}
                                </div>
                              </>
                            ) : (
                              "--"
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                            {record.clockOut ? (
                              <>
                                <div>{formatTime(record.clockOut)}</div>
                                <div className="text-xs text-gray-400">
                                  {formatTimeWithSeconds(record.clockOut)}
                                </div>
                              </>
                            ) : (
                              "--"
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                            {record.clockIn && record.clockOut ? (
                              <>
                                <div className="font-medium text-indigo-600">
                                  {formatWorkedTime(record.clockIn, record.clockOut)}
                                </div>
                                {record.hoursWorked > 0 && (
                                  <div className="text-xs text-gray-500">
                                    ({record.hoursWorked.toFixed(2)} hrs)
                                  </div>
                                )}
                              </>
                            ) : (
                              "--"
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${cls}`}
                            >
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeAttendance;