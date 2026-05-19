import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWeekend,
  addMonths,
  subMonths,
  isAfter,
  startOfToday,
  getDay,
  eachDayOfInterval as eachDayOfIntervalFull,
} from "date-fns";
import {
  Clock,
  Calendar,
  LogOut,
  RefreshCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";

const EmployeeAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const navigate = useNavigate();
  const token = localStorage.getItem("employeeToken");
  const employee = JSON.parse(localStorage.getItem("employeeData") || "{}");

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) {
      toast.error("Please login first");
      navigate("/employee/login", { replace: true });
    }
  }, [token, navigate]);

  const fetchAttendance = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        "https://crm-backend-v2.onrender.com/api/attendance/history",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to load");

      const records = Array.isArray(result.data) ? result.data : [];
      setAttendance(records);

      // Generate all dates from Jan 1, 2024 to current date
      const startDate = new Date(2024, 0, 1);
      const endDate = new Date();
      const allDates = eachDayOfIntervalFull({ start: startDate, end: endDate });
      
      const combinedRecords = allDates.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const existingRecord = records.find(
          (r) => format(new Date(r.date), "yyyy-MM-dd") === dateStr
        );
        
        if (existingRecord) {
          return existingRecord;
        } else {
          return {
            date: dateStr,
            clockIn: null,
            clockOut: null,
            status: isWeekend(date) ? "weekend-holiday" : "absent",
            hoursWorked: 0
          };
        }
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setAllAttendanceRecords(combinedRecords);

      const today = new Date().toLocaleDateString("en-CA");
      const todayRec = records.find(
        (r) => new Date(r.date).toLocaleDateString("en-CA") === today
      );
      setTodayRecord(todayRec || null);
    } catch (err) {
      toast.error(err.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchAttendance();
  }, [fetchAttendance]);

  const handleClockIn = async () => {
    setClocking("in");
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      const res = await fetch(
        "https://crm-backend-v2.onrender.com/api/attendance/clock-in",
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
      fetchAttendance();
    } catch (err) {
      toast.error(err.message || "GPS access denied");
    } finally {
      setClocking("");
    }
  };

  const handleClockOut = async () => {
    setClocking("out");
    try {
      const res = await fetch(
        "https://crm-backend-v2.onrender.com/api/attendance/clock-out",
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
      fetchAttendance();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClocking("");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out");
    navigate("/employee/login");
  };

  // Export to Excel function
  const exportToExcel = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    const monthRecords = allAttendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= monthStart && recordDate <= monthEnd;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (monthRecords.length === 0) {
      toast.error("No attendance records found for selected month");
      return;
    }

    const excelData = monthRecords.map(record => {
      const recordDate = new Date(record.date);
      const isWeekendDate = isWeekend(recordDate);
      const isFutureDate = isAfter(recordDate, startOfToday());
      
      let status;
      if (isFutureDate) {
        status = "Upcoming";
      } else if (isWeekendDate) {
        status = "Weekend Holiday";
      } else if (record.clockIn && record.clockOut) {
        status = "Present";
      } else if (record.clockIn && !record.clockOut) {
        status = "Partial";
      } else {
        status = "Absent";
      }

      return {
        "Date": format(recordDate, "dd-MM-yyyy"),
        "Day": format(recordDate, "EEEE"),
        "Clock In": record.clockIn ? format(new Date(record.clockIn), "hh:mm:ss a") : "--",
        "Clock Out": record.clockOut ? format(new Date(record.clockOut), "hh:mm:ss a") : "--",
        "Duration": record.clockIn && record.clockOut ? formatWorkedTime(record.clockIn, record.clockOut) : "--",
        "Hours Worked": record.hoursWorked > 0 ? record.hoursWorked.toFixed(2) : "0",
        "Status": status
      };
    });

    const presentDays = excelData.filter(row => row.Status === "Present").length;
    const absentDays = excelData.filter(row => row.Status === "Absent").length;
    const partialDays = excelData.filter(row => row.Status === "Partial").length;
    const holidayDays = excelData.filter(row => row.Status === "Weekend Holiday").length;
    const totalHours = excelData.reduce((sum, row) => sum + (parseFloat(row["Hours Worked"]) || 0), 0);

    excelData.push({});
    excelData.push({ "Date": "SUMMARY", "Day": "", "Clock In": "", "Clock Out": "", "Duration": "", "Hours Worked": "", "Status": "" });
    excelData.push({ "Date": "Total Present Days", "Day": "", "Clock In": "", "Clock Out": "", "Duration": "", "Hours Worked": presentDays.toString(), "Status": "" });
    excelData.push({ "Date": "Total Absent Days", "Day": "", "Clock In": "", "Clock Out": "", "Duration": "", "Hours Worked": absentDays.toString(), "Status": "" });
    excelData.push({ "Date": "Total Partial Days", "Day": "", "Clock In": "", "Clock Out": "", "Duration": "", "Hours Worked": partialDays.toString(), "Status": "" });
    excelData.push({ "Date": "Total Holiday Days", "Day": "", "Clock In": "", "Clock Out": "", "Duration": "", "Hours Worked": holidayDays.toString(), "Status": "" });
    excelData.push({ "Date": "Total Hours Worked", "Day": "", "Clock In": "", "Clock Out": "", "Duration": "", "Hours Worked": totalHours.toFixed(2), "Status": "" });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    
    ws['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, `Attendance_${format(selectedMonth, "MMM_yyyy")}`);
    XLSX.writeFile(wb, `Attendance_${format(selectedMonth, "MMMM_yyyy")}.xlsx`);
    toast.success(`Attendance for ${format(selectedMonth, "MMMM yyyy")} exported successfully!`);
  };

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
    return `${hours} hours ${minutes} minutes`;
  };

  // Calendar Helpers
  const getAttendanceForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return attendance.find(
      (r) => format(new Date(r.date), "yyyy-MM-dd") === dateStr
    );
  };

  const getDateStatus = (date) => {
    const todayStart = startOfToday();

    if (isAfter(date, todayStart)) return "future";
    if (isWeekend(date)) return "holiday";

    const record = getAttendanceForDate(date);
    if (!record) return "absent";
    if (record.clockIn && record.clockOut) return "present";
    if (record.clockIn && !record.clockOut) return "partial";
    return "absent";
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const leadingBlanks = getDay(start);
    return { days, leadingBlanks };
  };

  const { days, leadingBlanks } = getDaysInMonth();
  const weekDays = ["Sun", "Mon", "Tues", "Wed", "Thu", "Fri", "Sat"];

  const today = new Date();
  const isTodayHoliday = isWeekend(today);
  const canClockIn = !todayRecord?.clockIn;
  const canClockOut = todayRecord?.clockIn && !todayRecord?.clockOut;
  const isCompleted = todayRecord?.clockIn && todayRecord?.clockOut;

  if (!token) return null;

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Current Time */}
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
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Today's Attendance */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6">
                Today's Attendance
              </h2>

              {isTodayHoliday ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">
                    Weekend Holiday
                  </h3>
                  <p className="text-purple-600">
                    Today is {format(today, "EEEE")}. No attendance required.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Clock In</p>
                      <p className="text-2xl font-medium">
                        {formatTime(todayRecord?.clockIn)}
                      </p>
                      {todayRecord?.clockIn && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeWithSeconds(todayRecord?.clockIn)}
                        </p>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Clock Out</p>
                      <p className="text-2xl font-medium">
                        {formatTime(todayRecord?.clockOut)}
                      </p>
                      {todayRecord?.clockOut && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeWithSeconds(todayRecord?.clockOut)}
                        </p>
                      )}
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Hours Worked</p>
                      <p className="text-2xl font-medium text-indigo-600">
                        {todayRecord?.clockIn && todayRecord?.clockOut
                          ? formatWorkedTime(todayRecord.clockIn, todayRecord.clockOut)
                          : "--"}
                      </p>
                      {todayRecord?.hoursWorked > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          ({todayRecord.hoursWorked.toFixed(2)} hours)
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
                        {clocking === "in" ? "Clocking In..." : "Clock In"}
                      </button>
                    )}

                    {canClockOut && (
                      <button
                        onClick={handleClockOut}
                        disabled={clocking === "out"}
                        className="px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        {clocking === "out" ? "Clocking Out..." : "Clock Out"}
                      </button>
                    )}

                    {isCompleted && (
                      <div className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Attendance Completed
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      {canClockIn && "You can clock in for today's attendance."}
                      {canClockOut &&
                        "You have clocked in. You can clock out when your work is done."}
                      {isCompleted && "Your attendance for today is completed."}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Calendar - With Full Words */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-3 sm:px-4 py-3 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Monthly Calendar
                  </h2>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-2 py-1 text-xs bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition"
                  >
                    Today
                  </button>
                </div>
              </div>

              <div className="p-2 sm:p-3">
                <div className="flex justify-between items-center mb-3">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1 hover:bg-gray-100 rounded transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800">
                    {format(currentMonth, "MMMM yyyy")}
                  </h3>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1 hover:bg-gray-100 rounded transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Week Headers - Full Words */}
                <div className="grid grid-cols-7 gap-0.5 mb-2">
                  {weekDays.map((day, idx) => (
                    <div
                      key={idx}
                      className={`text-center text-[10px] sm:text-xs font-semibold py-1 ${
                        idx === 0 || idx === 6 ? "text-purple-600" : "text-gray-600"
                      }`}
                    >
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.substring(0, 3)}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: leadingBlanks }).map((_, i) => (
                    <div key={`blank-${i}`} className="min-h-[70px] sm:min-h-[85px]" />
                  ))}

                  {days.map((day, idx) => {
                    const status = getDateStatus(day);
                    const isTodayDate = isSameDay(day, new Date());
                    const record = getAttendanceForDate(day);

                    let statusText = "";
                    let statusColor = "";
                    let statusBg = "";

                    if (status === "future") {
                      statusText = "";
                      statusColor = "";
                    } else if (status === "holiday") {
                      statusText = "Holiday";
                      statusColor = "text-purple-600";
                      statusBg = "bg-purple-50";
                    } else if (status === "present") {
                      statusText = record?.hoursWorked ? `${record.hoursWorked.toFixed(1)} hrs` : "Present";
                      statusColor = "text-green-600";
                      statusBg = "bg-green-50";
                    } else if (status === "partial") {
                      statusText = "Partial";
                      statusColor = "text-yellow-600";
                      statusBg = "bg-yellow-50";
                    } else if (status === "absent") {
                      statusText = "Absent";
                      statusColor = "text-red-600";
                      statusBg = "bg-red-50";
                    }

                    return (
                      <div
                        key={idx}
                        className={`
                          text-center p-1 rounded min-h-[70px] sm:min-h-[85px] flex flex-col items-center justify-start
                          ${statusBg}
                          ${isTodayDate ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50" : ""}
                          transition-all
                        `}
                      >
                        <span
                          className={`
                            text-xs sm:text-sm font-semibold inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full
                            ${isTodayDate ? "bg-indigo-600 text-white" : "text-gray-700"}
                            ${status === "holiday" ? "text-purple-600" : ""}
                          `}
                        >
                          {format(day, "d")}
                        </span>
                        
                        {statusText && (
                          <span className={`text-[9px] sm:text-[10px] font-medium mt-1 text-center leading-tight ${statusColor}`}>
                            {statusText}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-3 pt-2 border-t grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-[9px] sm:text-xs text-gray-600">Present</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-[9px] sm:text-xs text-gray-600">Holiday (Sat/Sun)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-[9px] sm:text-xs text-gray-600">Partial</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-[9px] sm:text-xs text-gray-600">Absent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Export Attendance</h3>
                <select
                  value={format(selectedMonth, "yyyy-MM")}
                  onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  {Array.from({ length: 12 }).map((_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    return (
                      <option key={i} value={format(date, "yyyy-MM")}>
                        {format(date, "MMMM yyyy")}
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

          {/* Attendance History Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b bg-gray-50 flex justify-between items-center flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Attendance History</h2>
              <button
                onClick={fetchAttendance}
                className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded transition text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                <p className="mt-3 text-sm">Loading records...</p>
              </div>
            ) : allAttendanceRecords.length === 0 ? (
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
                        <th key={h} className="text-left px-3 sm:px-6 py-3 font-medium text-gray-700 border-b">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allAttendanceRecords.map((record, i) => {
                      const recordDate = new Date(record.date);
                      const isWeekendDate = isWeekend(recordDate);
                      const isFutureDate = isAfter(recordDate, startOfToday());

                      let status;
                      let statusClass;

                      if (isFutureDate) {
                        status = "Upcoming";
                        statusClass = "bg-gray-100 text-gray-600";
                      } else if (isWeekendDate) {
                        status = "Weekend Holiday";
                        statusClass = "bg-purple-100 text-purple-800";
                      } else if (record.clockIn && record.clockOut) {
                        status = "Present";
                        statusClass = "bg-green-100 text-green-800";
                      } else if (record.clockIn && !record.clockOut) {
                        status = "Partial";
                        statusClass = "bg-yellow-100 text-yellow-800";
                      } else {
                        status = "Absent";
                        statusClass = "bg-red-100 text-red-800";
                      }

                      return (
                        <tr key={i} className="hover:bg-gray-50 transition">
                          <td className="px-3 sm:px-6 py-3 font-medium whitespace-nowrap">{formatDate(record.date)}</td>
                          <td className="px-3 sm:px-6 py-3 text-gray-600 whitespace-nowrap">{format(recordDate, "EEEE")}</td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                            {record.clockIn ? formatTime(record.clockIn) : "--"}
                            {record.clockIn && (
                              <div className="text-xs text-gray-400">{formatTimeWithSeconds(record.clockIn)}</div>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                            {record.clockOut ? formatTime(record.clockOut) : "--"}
                            {record.clockOut && (
                              <div className="text-xs text-gray-400">{formatTimeWithSeconds(record.clockOut)}</div>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                            {record.clockIn && record.clockOut && (
                              <div className="font-medium text-indigo-600">
                                {formatWorkedTime(record.clockIn, record.clockOut)}
                              </div>
                            )}
                            {record.hoursWorked > 0 && (
                              <div className="text-xs text-gray-500">({record.hoursWorked.toFixed(2)} hours)</div>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusClass}`}>
                              {status}
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