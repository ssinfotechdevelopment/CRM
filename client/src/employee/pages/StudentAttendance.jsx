import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";

const StudentAttendance = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ---- Google Sheet Config ----
  const SHEET_ID = "1W9Vs0fNDTvi9g3U8JOI2RVP_qor6YHTsmmxhjrDMPKY";
  const SHEET_NAME = "Attendance";
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

  // ---- CSV Parser ----
  const parseCSV = (text) => {
    const lines = text.split(/\r\n|\n|\r/);
    const result = [];

    if (lines.length <= 1) return result;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cleanLine = line.replace(/"/g, '');
      const columns = cleanLine.split(',').map(col => col.trim());

      while (columns.length < 4) {
        columns.push('');
      }

      const [name, course, dateField, timestamp] = columns;

      let finalDate = dateField;

      if (!finalDate && timestamp) {
        const dateMatch = timestamp.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (dateMatch) {
          let [, first, second, year] = dateMatch;
          let month, day;

          if (parseInt(first) > 12) {
            day = first.padStart(2, '0');
            month = second.padStart(2, '0');
          } else {
            month = first.padStart(2, '0');
            day = second.padStart(2, '0');
          }

          finalDate = `${day}-${month}-${year}`;
        }
      }

      if (!finalDate && i >= 343 && i <= 369) {
        if (i <= 354) {
          finalDate = "13-01-2026";
        } else {
          finalDate = "19-01-2026";
        }
      }

      if (name && finalDate) {
        result.push({
          name,
          course,
          date: finalDate,
          timestamp
        });
      }
    }

    return result;
  };

  // ---- Fetch Data ----
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await fetch(CSV_URL + "&t=" + Date.now());
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const text = await response.text();

        if (!text || text.trim() === "") {
          setRawData([]);
          setError("No data found in the Google Sheet");
          return;
        }

        const data = parseCSV(text);

        if (data.length === 0) {
          setError("No valid attendance records found");
        } else {
          setRawData(data);
          setError("");
        }
      } catch (err) {
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  // ---- Helper Functions ----
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;

    if (dateStr.includes('-')) {
      const [day, month, year] = dateStr.split('-').map(Number);
      if (day && month && year) {
        return new Date(year, month - 1, day);
      }
    }

    return null;
  };

  const formatDisplayDate = (dateStr) => {
    const dateObj = parseDateString(dateStr);
    if (!dateObj) return dateStr || "Unknown Date";

    return dateObj.toLocaleDateString("en-IN", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestampStr) => {
    if (!timestampStr) return "-";

    const timeMatch = timestampStr.match(/(\d{1,2}):(\d{2}):?(\d{2})?/);
    if (!timeMatch) return "-";

    let hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2].padStart(2, '0');

    const lowerStr = timestampStr.toLowerCase();
    let isPM = lowerStr.includes('pm');

    if (!lowerStr.includes('am') && !lowerStr.includes('pm')) {
      isPM = hour >= 12;
    }

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${isPM ? 'PM' : 'AM'}`;
  };

  // ---- Excel Download Functions ----
  const downloadExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(record => ({
      "Student Name": record.name,
      "Course": record.course,
      "Date": record.date,
      "Check-in Time": formatTime(record.timestamp),
      "Full Timestamp": record.timestamp
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const downloadAllExcel = () => {
    downloadExcel(rawData, `Attendance_All_Records_${new Date().toISOString().split('T')[0]}`);
  };

  const downloadDateExcel = (date) => {
    const dateData = rawData.filter(r => r.date === date);
    if (dateData.length === 0) return;

    const displayDate = formatDisplayDate(date).replace(/[^a-zA-Z0-9]/g, '_');
    downloadExcel(dateData, `Attendance_${displayDate}`);
  };

  const downloadFilteredExcel = () => {
    const filtered = getFilteredData();
    if (filtered.length === 0) return;

    let filename = "Attendance_Filtered";
    if (selectedDate) {
      filename += `_${selectedDate}`;
    }
    if (selectedCourse) {
      filename += `_${selectedCourse.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    if (searchQuery) {
      filename += `_Search_${searchQuery}`;
    }

    downloadExcel(filtered, filename);
  };

  // ---- Data Processing ----
  const getFilteredData = () => {
    let filtered = [...rawData];

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCourse) {
      filtered = filtered.filter(r =>
        r.course && r.course.toLowerCase() === selectedCourse.toLowerCase()
      );
    }

    if (selectedDate) {
      filtered = filtered.filter(r => r.date === selectedDate);
    }

    return filtered;
  };

  const groupedData = useMemo(() => {
    const filtered = getFilteredData();

    const groups = {};
    filtered.forEach(row => {
      const dateKey = row.date || "Unknown Date";
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(row);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const dateA = parseDateString(a);
      const dateB = parseDateString(b);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });

    return sortedKeys.map(date => ({
      date,
      rows: groups[date],
    }));
  }, [rawData, selectedDate, selectedCourse, searchQuery]);

  const uniqueCourses = useMemo(() => {
    const courses = rawData
      .map(r => r.course)
      .filter(Boolean)
      .map(c => c.trim())
      .filter(c => c.length > 0);

    return [...new Set(courses)].sort();
  }, [rawData]);

  const allDates = useMemo(() => {
    const dates = [...new Set(rawData.map(r => r.date).filter(Boolean))];
    return dates.sort((a, b) => {
      const dateA = parseDateString(a);
      const dateB = parseDateString(b);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });
  }, [rawData]);

  const stats = useMemo(() => {
    const totalRecords = rawData.length;
    const uniqueStudents = new Set(rawData.map(r => r.name?.toLowerCase().trim())).size;

    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

    const todayRecords = rawData.filter(r => r.date === todayStr).length;

    return { totalRecords, uniqueStudents, todayRecords };
  }, [rawData]);

  // ---- UI Handlers ----
  const handleDateChange = (e) => {
    const value = e.target.value;
    if (!value) {
      setSelectedDate("");
      return;
    }

    const [year, month, day] = value.split('-');
    setSelectedDate(`${day}-${month}-${year}`);
  };

  const getInputDateValue = () => {
    if (!selectedDate) return "";
    const [day, month, year] = selectedDate.split('-');
    return `${year}-${month}-${day}`;
  };

  const clearFilters = () => {
    setSelectedDate("");
    setSelectedCourse("");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ==== HEADER ==== */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Student Attendance</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track and manage student attendance records in real-time
          </p>

          {rawData.length > 0 && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {rawData.length} records loaded from Google Sheets
              </div>
            </div>
          )}
        </div>

        {/* ==== STATISTICS CARDS ==== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.uniqueStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Records</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayRecords}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ==== FILTER BAR ==== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Students
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Enter student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Date
                </label>
                <input
                  type="date"
                  value={getInputDateValue()}
                  onChange={handleDateChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                >
                  <option value="">All Courses</option>
                  {uniqueCourses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={downloadAllExcel}
              disabled={rawData.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download All Records
            </button>

            <button
              onClick={downloadFilteredExcel}
              disabled={getFilteredData().length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Download Filtered
            </button>

            {(selectedDate || selectedCourse || searchQuery) && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* ==== LOADING STATE ==== */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Attendance Records</h3>
            <p className="text-gray-600">Fetching data from Google Sheets...</p>
          </div>
        )}

        {/* ==== ERROR STATE ==== */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-1">Data Loading Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* ==== NO DATA STATE ==== */}
        {!loading && !error && rawData.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Attendance Records</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              No attendance data has been recorded yet. Records will appear here once students start checking in.
            </p>
          </div>
        )}

        {/* ==== ATTENDANCE TABLE ==== */}
        {!loading && !error && groupedData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {groupedData.map((group) => (
              <div key={group.date} className="border-b border-gray-200 last:border-b-0">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
                      {formatDisplayDate(group.date)}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {group.rows.length} student{group.rows.length > 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => downloadDateExcel(group.date)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Excel
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Check-in Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {group.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                                {row.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?'}
                              </div>
                              <span className="font-medium text-gray-900">{row.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {row.course || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                            {formatTime(row.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==== FOOTER ==== */}
        <div className="mt-12 text-center">
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600">
              System updated: {new Date().toLocaleString("en-IN", {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;