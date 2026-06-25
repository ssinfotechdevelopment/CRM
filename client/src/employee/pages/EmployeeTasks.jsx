// src/pages/employee/EmployeeTasks.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from "date-fns";
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  Calendar,
  RefreshCw,
  X,
  Loader2,
  Search,
  Download,
  Filter,
  ChevronDown,
  CheckCircle,
  Clock as ClockIcon,
  AlertTriangle,
  Circle,
  Flag,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";

const API_BASE = "http://sscrmbackend.ssinfotech.co.in/api/employee";

const EmployeeTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, week, month, year, custom
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // New filter states for status and priority
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Daily",
    priority: "medium",
    dueDate: "",
    progress: 0,
    status: "Pending",
    notes: "",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("employeeToken");

  useEffect(() => {
    if (!token) {
      toast.error("Please login first");
      navigate("/employee/login", { replace: true });
    }
  }, [token, navigate]);

  const fetchTasks = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/my/tasks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load your tasks");
      }

      const taskList = Array.isArray(data)
        ? data
        : data.data || data.tasks || [];

      setTasks(taskList);
    } catch (err) {
      console.error("Fetch tasks error:", err);
      toast.error(err.message || "Could not load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchTasks();
  }, [token, fetchTasks]);

  // Apply filters
  useEffect(() => {
    let filtered = [...tasks];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(task => 
        task.status?.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Apply priority filter
    if (selectedPriority !== "all") {
      filtered = filtered.filter(task => 
        task.priority?.toLowerCase() === selectedPriority.toLowerCase()
      );
    }

    // Apply date filter
    if (filterType !== "all" && filterType !== "custom") {
      let startDate, endDate;
      
      switch (filterType) {
        case "week":
          startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
          endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
          break;
        case "month":
          startDate = startOfMonth(selectedDate);
          endDate = endOfMonth(selectedDate);
          break;
        case "year":
          startDate = startOfYear(selectedDate);
          endDate = endOfYear(selectedDate);
          break;
        default:
          startDate = null;
          endDate = null;
      }

      if (startDate && endDate) {
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = parseISO(task.dueDate);
          return isWithinInterval(taskDate, { start: startDate, end: endDate });
        });
      }
    } else if (filterType === "custom" && customStartDate && customEndDate) {
      const start = parseISO(customStartDate);
      const end = parseISO(customEndDate);
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = parseISO(task.dueDate);
        return isWithinInterval(taskDate, { start: start, end: end });
      });
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, filterType, selectedDate, customStartDate, customEndDate, selectedStatus, selectedPriority]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      type: "Daily",
      priority: "medium",
      dueDate: "",
      progress: 0,
      status: "Pending",
      notes: "",
    });
    setIsEditing(false);
    setCurrentTask(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setIsEditing(true);
    setCurrentTask(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      type: task.type || "Daily",
      priority: task.priority || "medium",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      progress: Number(task.progress) || 0,
      status: task.status || "Pending",
      notes: task.notes || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      const url = isEditing
        ? `${API_BASE}/task/${currentTask._id}`
        : `${API_BASE}/task`;

      const method = isEditing ? "PATCH" : "POST";

      const body = { ...form };
      if (form.dueDate) {
        body.dueDate = new Date(form.dueDate).toISOString();
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${isEditing ? "update" : "create"} task`);
      }

      toast.success(isEditing ? "Task updated successfully" : "Task created successfully");
      setModalOpen(false);
      resetForm();
      fetchTasks();
    } catch (err) {
      toast.error(err.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`${API_BASE}/task/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete task");

      toast.success("Task deleted successfully");
      fetchTasks();
    } catch (err) {
      toast.error(err.message || "Could not delete task");
    }
  };

  const downloadExcel = () => {
    if (filteredTasks.length === 0) {
      toast.error("No tasks to export");
      return;
    }

    const exportData = filteredTasks.map(task => ({
      "Title": task.title || "",
      "Description": task.description || "",
      "Type": task.type || "",
      "Priority": task.priority || "",
      "Status": task.status || "",
      "Progress (%)": task.progress || 0,
      "Due Date": task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy") : "—",
      "Notes": task.notes || "",
      "Created At": task.createdAt ? format(new Date(task.createdAt), "dd MMM yyyy HH:mm") : "—",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "My Tasks");
    
    // Auto-size columns
    const colWidths = [];
    for (let i = 0; i < Object.keys(exportData[0]).length; i++) {
      colWidths.push({ wch: 20 });
    }
    ws['!cols'] = colWidths;

    const fileName = `tasks_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Tasks exported successfully!");
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setSelectedStatus("all");
    setSelectedPriority("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedDate(new Date());
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-100 text-green-800 border-green-300",
      medium: "bg-blue-100 text-blue-800 border-blue-300",
      high: "bg-orange-100 text-orange-800 border-orange-300",
      urgent: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[(priority || "medium").toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      "in progress": "bg-blue-100 text-blue-800 border-blue-300",
      completed: "bg-green-100 text-green-800 border-green-300",
      "on hold": "bg-purple-100 text-purple-800 border-purple-300",
    };
    return colors[(status || "pending").toLowerCase()] || "bg-gray-100 text-gray-700";
  };

  const formatDueDate = (date) => {
    if (!date) return "—";
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case "week":
        return `Week of ${format(selectedDate, "dd MMM yyyy")}`;
      case "month":
        return format(selectedDate, "MMMM yyyy");
      case "year":
        return format(selectedDate, "yyyy");
      case "custom":
        return "Custom Range";
      default:
        return "All Tasks";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in progress":
        return <ClockIcon className="w-4 h-4" />;
      case "pending":
        return <AlertTriangle className="w-4 h-4" />;
      case "on hold":
        return <Circle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return <Flag className="w-4 h-4" />;
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <ClockIcon className="w-4 h-4" />;
      case "low":
        return <Circle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!token) return null;

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-gray-50 pb-12">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New Task
            </button>
          </div>

          {/* Search and Filters Section */}
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks by title, description, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Date Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition bg-white"
                >
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">{getFilterLabel()}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showFilterDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg z-20 min-w-[200px]">
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setFilterType("all");
                          setShowFilterDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition"
                      >
                        All Tasks
                      </button>
                      <button
                        onClick={() => {
                          setFilterType("week");
                          setShowFilterDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition"
                      >
                        This Week
                      </button>
                      <button
                        onClick={() => {
                          setFilterType("month");
                          setShowFilterDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition"
                      >
                        This Month
                      </button>
                      <button
                        onClick={() => {
                          setFilterType("year");
                          setShowFilterDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition"
                      >
                        This Year
                      </button>
                      <button
                        onClick={() => {
                          setFilterType("custom");
                          setShowFilterDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition"
                      >
                        Custom Range
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition bg-white"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">
                    {selectedStatus === "all" ? "All Status" : selectedStatus}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg z-20 min-w-[180px]">
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setSelectedStatus("all");
                          setShowStatusDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition flex items-center gap-2"
                      >
                        <Circle className="w-4 h-4" />
                        All Status
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStatus("Pending");
                          setShowStatusDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition flex items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        Pending
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStatus("In Progress");
                          setShowStatusDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition flex items-center gap-2"
                      >
                        <ClockIcon className="w-4 h-4 text-blue-600" />
                        In Progress
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStatus("Completed");
                          setShowStatusDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Completed
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStatus("On Hold");
                          setShowStatusDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition flex items-center gap-2"
                      >
                        <Circle className="w-4 h-4 text-purple-600" />
                        On Hold
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Priority Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition bg-white"
                >
                  <Flag className="w-4 h-4" />
                  <span className="font-medium">
                    {selectedPriority === "all" ? "All Priority" : selectedPriority}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showPriorityDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg z-20 min-w-[180px]">
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setSelectedPriority("all");
                          setShowPriorityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition flex items-center gap-2"
                      >
                        <Circle className="w-4 h-4" />
                        All Priority
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPriority("urgent");
                          setShowPriorityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition flex items-center gap-2"
                      >
                        <Flag className="w-4 h-4 text-red-600" />
                        Urgent
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPriority("high");
                          setShowPriorityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition flex items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        High
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPriority("medium");
                          setShowPriorityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition flex items-center gap-2"
                      >
                        <ClockIcon className="w-4 h-4 text-blue-600" />
                        Medium
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPriority("low");
                          setShowPriorityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition flex items-center gap-2"
                      >
                        <Circle className="w-4 h-4 text-green-600" />
                        Low
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Date Pickers for specific filters */}
              {(filterType === "week" || filterType === "month" || filterType === "year") && (
                <input
                  type={filterType === "year" ? "number" : "date"}
                  value={
                    filterType === "year"
                      ? format(selectedDate, "yyyy")
                      : format(selectedDate, "yyyy-MM-dd")
                  }
                  onChange={(e) => {
                    if (filterType === "year") {
                      const year = parseInt(e.target.value);
                      if (!isNaN(year)) {
                        setSelectedDate(new Date(year, 0, 1));
                      }
                    } else {
                      setSelectedDate(new Date(e.target.value));
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              )}

              {filterType === "custom" && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Start Date"
                  />
                  <span className="self-center">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="End Date"
                  />
                </div>
              )}

              {/* Clear Filters Button */}
              {(searchTerm || filterType !== "all" || selectedStatus !== "all" || selectedPriority !== "all") && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                >
                  Clear All Filters
                </button>
              )}

              {/* Export Button */}
              <button
                onClick={downloadExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm ml-auto"
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </button>
            </div>

            {/* Active Filters Display */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm("")} className="hover:text-indigo-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterType !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                  {getFilterLabel()}
                  <button onClick={() => setFilterType("all")} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedStatus !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-sm">
                  Status: {selectedStatus}
                  <button onClick={() => setSelectedStatus("all")} className="hover:text-yellow-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedPriority !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-sm">
                  Priority: {selectedPriority}
                  <button onClick={() => setSelectedPriority("all")} className="hover:text-orange-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            {/* Filter Stats */}
            <div className="text-sm text-gray-600">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>

          {/* Tasks List */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-5 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Your Tasks</h2>
              <button
                onClick={fetchTasks}
                disabled={loading}
                className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-16 text-center text-gray-500">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600" />
                <p className="mt-4">Loading your tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-16 text-center text-gray-500">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <p className="text-lg">No tasks found</p>
                {(searchTerm || filterType !== "all" || selectedStatus !== "all" || selectedPriority !== "all") ? (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 text-indigo-600 hover:underline font-medium"
                  >
                    Clear all filters →
                  </button>
                ) : (
                  <button
                    onClick={openCreateModal}
                    className="mt-4 text-indigo-600 hover:underline font-medium"
                  >
                    Create your first task →
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    className="p-6 hover:bg-gray-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-gray-900 text-lg">{task.title}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(task)}
                            className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 transition"
                            title="Edit task"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(task._id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition"
                            title="Delete task"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          {task.type || "—"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {getPriorityIcon(task.priority)}
                          {task.priority || "medium"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {getStatusIcon(task.status)}
                          {task.status || "Pending"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDueDate(task.dueDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${Number(task.progress) || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 min-w-[3.5rem] text-right">
                          {Number(task.progress) || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-800">
                  {isEditing ? "Edit Task" : "Create New Task"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-500 hover:text-gray-800 rounded-full p-1 hover:bg-gray-100 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    required
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="Describe the task..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Project">Project</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                    <input
                      type="number"
                      name="progress"
                      min="0"
                      max="100"
                      value={form.progress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      placeholder="0-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={form.dueDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium shadow-sm"
                  >
                    {isEditing ? "Update Task" : "Create Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EmployeeTasks;