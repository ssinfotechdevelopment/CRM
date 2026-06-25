import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const DepartmentIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const SalaryIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);
const PerformanceIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const EyeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EditIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const DeleteIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const CloseIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const CheckCircleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const RefreshIcon = ({ className = "w-4 h-4", spinning = false }) => (
  <svg className={`${className} ${spinning ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ─── SKELETON ─────────────────────────────────────────────────────────────────
const Shimmer = ({ className = "" }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded ${className}`} />
);
const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow p-4 border-l-4 border-gray-200">
    <div className="flex items-center justify-between">
      <div className="space-y-2"><Shimmer className="h-3 w-16" /><Shimmer className="h-7 w-10" /></div>
      <Shimmer className="h-10 w-10 rounded-full" />
    </div>
  </div>
);
const TableRowSkeleton = () => (
  <tr className="border-b">
    <td className="px-4 py-3"><div className="flex items-center gap-2"><Shimmer className="w-8 h-8 rounded-full" /><div className="space-y-1.5"><Shimmer className="h-3.5 w-28" /><Shimmer className="h-2.5 w-36" /></div></div></td>
    <td className="px-3 py-3"><Shimmer className="h-3 w-20" /></td>
    <td className="px-3 py-3"><div className="space-y-1.5"><Shimmer className="h-3 w-20" /><Shimmer className="h-2.5 w-24" /></div></td>
    <td className="px-3 py-3"><Shimmer className="h-3 w-16" /></td>
    <td className="px-3 py-3 text-center"><Shimmer className="h-5 w-12 rounded-full mx-auto" /></td>
    <td className="px-3 py-3 text-center"><Shimmer className="h-5 w-12 rounded-full mx-auto" /></td>
    <td className="px-3 py-3 text-center"><Shimmer className="h-3 w-8 mx-auto mb-1" /><Shimmer className="h-1.5 w-full rounded-full" /></td>
    <td className="px-3 py-3"><div className="flex justify-center gap-1">{[...Array(4)].map((_, i) => <Shimmer key={i} className="w-7 h-7 rounded" />)}</div></td>
  </tr>
);
const CellSpinner = () => (
  <svg className="animate-spin w-3.5 h-3.5 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { id: 1, name: "Sales" },
  { id: 2, name: "Marketing" },
  { id: 3, name: "Development" },
  { id: 4, name: "HR" },
  { id: 5, name: "Finance" },
  { id: 6, name: "Operations" },
];

const API_URL = "https://sscrmbackend.ssinfotech.co.in/api";
const BATCH_SIZE = 4;

const EMPTY_NEW_EMP = {
  name: "", email: "", phone: "", department: "", position: "", salary: "",
  joiningDate: "", status: "Active", employeeType: "Employee", loginId: "", password: "",
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const getPerformanceColor = (p) =>
  p >= 90 ? "text-green-600 bg-green-50 border-green-200" :
  p >= 80 ? "text-blue-600 bg-blue-50 border-blue-200" :
  p >= 70 ? "text-yellow-600 bg-yellow-50 border-yellow-200" :
            "text-red-600 bg-red-50 border-red-200";

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── API HELPERS ──────────────────────────────────────────────────────────────
async function apiFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  return res.json();
}

async function fetchTasksForEmployee(employeeId, token) {
  const urls = [
    `${API_URL}/admin/tasks/${employeeId}`,
    `${API_URL}/employee/${employeeId}/tasks`,
  ];
  for (const url of urls) {
    try {
      const data = await apiFetch(url, token);
      const tasks = Array.isArray(data) ? data : data.tasks || [];
      const completedTasks = tasks.filter(t => t.status?.toLowerCase() === "completed").length;
      return { tasks, completedTasks, totalTasks: tasks.length };
    } catch { /* try next */ }
  }
  return { tasks: [], completedTasks: 0, totalTasks: 0 };
}

async function fetchAttendanceForEmployee(employeeId, token) {
  const urls = [
    `${API_URL}/attendance/${employeeId}/attendance`,
    `${API_URL}/attendance/admin/employee/${employeeId}/attendance`,
  ];
  for (const url of urls) {
    try {
      const data = await apiFetch(url, token);
      const records = Array.isArray(data) ? data : data.attendance || [];
      const presentDays = records.filter(r => r.status?.toLowerCase() === "present").length;
      const totalDays = records.length;
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
      return { attendance: records, attendanceRate, presentDays, totalDays };
    } catch { /* try next */ }
  }
  return { attendance: [], attendanceRate: 0, presentDays: 0, totalDays: 0 };
}

async function fetchMetricsForEmployee(employeeId, token) {
  const [tasksData, attendanceData] = await Promise.all([
    fetchTasksForEmployee(employeeId, token),
    fetchAttendanceForEmployee(employeeId, token),
  ]);
  const taskCompletion = tasksData.totalTasks > 0
    ? (tasksData.completedTasks / tasksData.totalTasks) * 100 : 0;
  const performance = Math.round(taskCompletion * 0.6 + attendanceData.attendanceRate * 0.4);
  return {
    tasks: tasksData.tasks,
    completedTasks: tasksData.completedTasks,
    totalTasks: tasksData.totalTasks,
    attendance: attendanceData.attendanceRate,
    presentDays: attendanceData.presentDays,
    totalDays: attendanceData.totalDays,
    performance,
  };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const EmployeeManagement = () => {
  const token = localStorage.getItem("adminToken");
  const queryClient = useQueryClient();

  // ── UI STATE ───────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]               = useState("");
  const [sortBy, setSortBy]                       = useState("performance");
  const [departmentFilter, setDepartmentFilter]   = useState("all");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState("all");
  const [metricsMap, setMetricsMap]               = useState({});
  const [success, setSuccess]                     = useState("");

  // Modal state
  const [selectedEmployee, setSelectedEmployee]       = useState(null);
  const [employeeTasks, setEmployeeTasks]             = useState([]);
  const [employeeAttendance, setEmployeeAttendance]   = useState([]);
  const [modals, setModals] = useState({
    add: false, edit: false, credentials: false,
    resetPassword: false, paySalary: false, tasks: false, attendance: false,
  });
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState(null);

  // Form state
  const [newEmployee, setNewEmployee]         = useState(EMPTY_NEW_EMP);
  const [resetPasswordData, setResetPasswordData] = useState({ employeeId: "", employeeName: "", newPassword: "", confirmPassword: "" });
  const [paySalaryData, setPaySalaryData]     = useState({
    employeeId: "", employeeName: "", amount: "",
    month: new Date().getMonth() + 1, year: new Date().getFullYear(), notes: "",
  });

  const abortRef = useRef(null);
  const debouncedSearch = useDebounce(searchTerm, 250);

  // ── REACT QUERY: FETCH ALL EMPLOYEES ──────────────────────────────────────
  const {
    data: employees = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const data = await apiFetch(`${API_URL}/employee/get/employee`, token);
      const list = Array.isArray(data) ? data : data.employees || data.data || [];

      // Cancel previous metric fetches
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      // Mark all as loading
      const initial = {};
      list.forEach(e => { initial[e._id] = "loading"; });
      setMetricsMap(initial);

      // Load metrics in background batches
      loadMetricsInBatches(list, abortRef.current.signal);
      return list;
    },
    staleTime: 1000 * 60 * 2, // 2 min cache — no re-fetch unless invalidated
    onError: (err) => {
      if (err.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.href = "/admin/login";
      }
    },
  });

  // ── BATCH METRICS LOADER ───────────────────────────────────────────────────
  const loadMetricsInBatches = useCallback(async (list, signal) => {
    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      if (signal?.aborted) break;
      const batch = list.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async (emp) => {
          try {
            const metrics = await fetchMetricsForEmployee(emp._id, token);
            if (signal?.aborted) return;
            setMetricsMap(prev => ({ ...prev, [emp._id]: metrics }));
          } catch {
            if (!signal?.aborted)
              setMetricsMap(prev => ({ ...prev, [emp._id]: "error" }));
          }
        })
      );
      if (i + BATCH_SIZE < list.length) await new Promise(r => setTimeout(r, 150));
    }
  }, [token]);

  // ── AUTO CLEAR SUCCESS ─────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 5000);
    return () => clearTimeout(t);
  }, [success]);

  // ── MODALS ─────────────────────────────────────────────────────────────────
  const openModal  = useCallback((key) => setModals(m => ({ ...m, [key]: true })),  []);
  const closeModal = useCallback((key) => setModals(m => ({ ...m, [key]: false })), []);

  // ── ADD EMPLOYEE MUTATION ──────────────────────────────────────────────────
  // ✅ Only adds new employee to cache — does NOT reload the whole list
  const addMutation = useMutation({
    mutationFn: async (empData) => {
      const res = await fetch(`${API_URL}/employee/create/employee`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...empData, salary: +empData.salary, department: +empData.department }),
      });
      if (!res.ok) throw new Error("Failed to create employee");
      return res.json();
    },
    onSuccess: (data) => {
      // ✅ OPTIMISTIC: inject new employee directly into cache
      const newEmp = data.employee || data;
      queryClient.setQueryData(["employees"], (old = []) => [...old, newEmp]);

      // ✅ Mark new employee metrics as loading and fetch
      setMetricsMap(prev => ({ ...prev, [newEmp._id]: "loading" }));
      fetchMetricsForEmployee(newEmp._id, token).then(metrics => {
        setMetricsMap(prev => ({ ...prev, [newEmp._id]: metrics }));
      });

      setNewEmployeeCredentials({
        name: newEmployee.name, email: newEmployee.email,
        loginId: newEmployee.loginId, password: newEmployee.password,
      });
      openModal("credentials");
      closeModal("add");
      setSuccess("Employee created!");
      setNewEmployee(EMPTY_NEW_EMP);
    },
    onError: () => alert("Failed to create employee"),
  });

  // ── UPDATE EMPLOYEE MUTATION ───────────────────────────────────────────────
  // ✅ Only updates that ONE employee in cache — no full reload
  const updateMutation = useMutation({
    mutationFn: async (empData) => {
      const payload = { ...empData, salary: +empData.salary, department: +empData.department };
      delete payload.tasks; delete payload.attendance; delete payload.performance;
      delete payload._metricsState; delete payload.completedTasks; delete payload.totalTasks;
      const res = await fetch(`${API_URL}/employee/update/${empData._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onMutate: async (updatedEmp) => {
      // ✅ OPTIMISTIC UPDATE: update cache immediately before API responds
      await queryClient.cancelQueries({ queryKey: ["employees"] });
      const previous = queryClient.getQueryData(["employees"]);
      queryClient.setQueryData(["employees"], (old = []) =>
        old.map(emp => emp._id === updatedEmp._id ? { ...emp, ...updatedEmp } : emp)
      );
      return { previous }; // rollback data
    },
    onError: (err, _, context) => {
      // ✅ ROLLBACK if API call fails
      queryClient.setQueryData(["employees"], context.previous);
      alert("Update failed");
    },
    onSuccess: (data) => {
      // ✅ Replace with server response for accuracy
      const updated = data.employee || data;
      queryClient.setQueryData(["employees"], (old = []) =>
        old.map(emp => emp._id === updated._id ? { ...emp, ...updated } : emp)
      );
      closeModal("edit");
      setSelectedEmployee(null);
      setSuccess("Employee updated!");
    },
  });

  // ── DELETE EMPLOYEE MUTATION ───────────────────────────────────────────────
  // ✅ Only removes that employee from cache
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API_URL}/employee/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      return id;
    },
    onMutate: async (id) => {
      // ✅ OPTIMISTIC: remove from list immediately
      await queryClient.cancelQueries({ queryKey: ["employees"] });
      const previous = queryClient.getQueryData(["employees"]);
      queryClient.setQueryData(["employees"], (old = []) =>
        old.filter(emp => emp._id !== id)
      );
      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(["employees"], context.previous);
      alert("Delete failed");
    },
    onSuccess: (id) => {
      setMetricsMap(prev => { const n = { ...prev }; delete n[id]; return n; });
      setSuccess("Employee deleted!");
    },
  });

  // ── RESET PASSWORD MUTATION ────────────────────────────────────────────────
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ employeeId, newPassword }) => {
      const res = await fetch(`${API_URL}/employee/${employeeId}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error("Reset failed");
      return res.json();
    },
    onSuccess: (_, { employeeId, newPassword }) => {
      const emp = employees.find(e => e._id === employeeId);
      setNewEmployeeCredentials({ name: emp.name, email: emp.email, loginId: emp.loginId, password: newPassword });
      closeModal("resetPassword");
      openModal("credentials");
      setSuccess("Password reset successfully!");
    },
    onError: () => alert("Password reset failed"),
  });

  // ── PAY SALARY MUTATION ────────────────────────────────────────────────────
  const paySalaryMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch(`${API_URL}/salary/pay/${data.employeeId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(data.amount), month: data.month, year: data.year, notes: data.notes }),
      });
      if (!res.ok) throw new Error("Payment failed");
      return { ...data };
    },
    onSuccess: ({ employeeId, amount }) => {
      // ✅ Only update salary fields for that employee in cache
      queryClient.setQueryData(["employees"], (old = []) =>
        old.map(emp => emp._id === employeeId
          ? { ...emp, pendingSalary: Math.max(0, (emp.pendingSalary || 0) - amount), paidSalary: (emp.paidSalary || 0) + amount }
          : emp
        )
      );
      closeModal("paySalary");
      setSuccess("Salary paid successfully!");
    },
    onError: () => alert("Salary payment failed"),
  });

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  const handleAdd = useCallback((e) => {
    e.preventDefault();
    const required = ["name","email","department","position","salary","joiningDate","loginId","password"];
    if (required.some(f => !newEmployee[f])) { alert("Please fill all required fields"); return; }
    if (newEmployee.password.length < 6) { alert("Password must be ≥ 6 characters"); return; }
    addMutation.mutate(newEmployee);
  }, [newEmployee, addMutation]);

  const handleEdit = useCallback((e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    updateMutation.mutate(selectedEmployee);
  }, [selectedEmployee, updateMutation]);

  const handleDelete = useCallback((id) => {
    if (!confirm("Delete this employee?")) return;
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleResetPassword = useCallback((e) => {
    e.preventDefault();
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) { alert("Passwords don't match"); return; }
    if (resetPasswordData.newPassword.length < 6) { alert("Min 6 characters"); return; }
    resetPasswordMutation.mutate({ employeeId: resetPasswordData.employeeId, newPassword: resetPasswordData.newPassword });
  }, [resetPasswordData, resetPasswordMutation]);

  const handlePaySalary = useCallback((e) => {
    e.preventDefault();
    if (!paySalaryData.amount || paySalaryData.amount <= 0) { alert("Enter a valid amount"); return; }
    paySalaryMutation.mutate(paySalaryData);
  }, [paySalaryData, paySalaryMutation]);

  const openResetPasswordModal = useCallback((emp) => {
    setResetPasswordData({ employeeId: emp._id, employeeName: emp.name, newPassword: "", confirmPassword: "" });
    openModal("resetPassword");
  }, [openModal]);

  const openPaySalaryModal = useCallback((emp) => {
    setPaySalaryData({
      employeeId: emp._id, employeeName: emp.name,
      amount: emp.pendingSalary || emp.salary || 0,
      month: new Date().getMonth() + 1, year: new Date().getFullYear(), notes: "",
    });
    openModal("paySalary");
  }, [openModal]);

  const fetchAndShowTasks = useCallback(async (emp) => {
    setSelectedEmployee(emp);
    setEmployeeTasks([]);
    openModal("tasks");
    const data = await fetchTasksForEmployee(emp._id, token);
    setEmployeeTasks(data.tasks);
  }, [token, openModal]);

  const fetchAndShowAttendance = useCallback(async (emp) => {
    setSelectedEmployee(emp);
    setEmployeeAttendance([]);
    openModal("attendance");
    const data = await fetchAttendanceForEmployee(emp._id, token);
    setEmployeeAttendance(data.attendance);
  }, [token, openModal]);

  const copyCredentials = useCallback(() => {
    if (!newEmployeeCredentials) return;
    navigator.clipboard.writeText(
      `Name: ${newEmployeeCredentials.name}\nEmail: ${newEmployeeCredentials.email}\nLogin ID: ${newEmployeeCredentials.loginId}\nPassword: ${newEmployeeCredentials.password}`
    ).then(() => alert("Copied!"));
  }, [newEmployeeCredentials]);

  // ── MERGED EMPLOYEES (employees + metricsMap) ──────────────────────────────
  const mergedEmployees = useMemo(() => employees.map(emp => {
    const m = metricsMap[emp._id];
    if (!m || m === "loading" || m === "error") {
      return { ...emp, _metricsState: m || "loading", tasks: [], completedTasks: 0, totalTasks: 0, attendance: 0, performance: 0 };
    }
    return { ...emp, _metricsState: "ready", ...m };
  }), [employees, metricsMap]);

  // ── FILTERED + SORTED ──────────────────────────────────────────────────────
  const filteredAndSorted = useMemo(() => {
    const search = debouncedSearch.toLowerCase();
    return mergedEmployees
      .filter(emp => (
        (!search || emp.name?.toLowerCase().includes(search) || emp.email?.toLowerCase().includes(search) ||
          emp.position?.toLowerCase().includes(search) || emp.loginId?.toLowerCase().includes(search)) &&
        (departmentFilter === "all" || emp.department === +departmentFilter) &&
        (employeeTypeFilter === "all" || emp.employeeType === employeeTypeFilter)
      ))
      .sort((a, b) => {
        if (sortBy === "performance") return (b.performance || 0) - (a.performance || 0);
        if (sortBy === "salary")      return (b.salary || 0) - (a.salary || 0);
        if (sortBy === "name")        return (a.name || "").localeCompare(b.name || "");
        return 0;
      });
  }, [mergedEmployees, debouncedSearch, departmentFilter, employeeTypeFilter, sortBy]);

  // ── STATS ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total   = employees.length;
    const active  = employees.filter(e => e.status === "Active").length;
    const interns = employees.filter(e => e.employeeType === "Intern").length;
    const pending = employees.filter(e => (e.pendingSalary || 0) > 0).length;
    const readyList = mergedEmployees.filter(e => e._metricsState === "ready");
    const avgPerf = readyList.length > 0
      ? Math.round(readyList.reduce((s, e) => s + (e.performance || 0), 0) / readyList.length) : 0;
    return { total, active, interns, pending, avgPerf };
  }, [employees, mergedEmployees]);

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  if (!token) return <div className="min-h-screen flex items-center justify-center">Redirecting…</div>;

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Employee Management</h1>
            <p className="text-gray-500 mt-1 text-sm">Optimistic updates · No full-page reloads</p>
          </div>

          {/* ALERTS */}
          {isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
              <span>Failed to load employees. Server may be down.</span>
              <button onClick={() => refetch()} className="underline text-sm">Retry</button>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4" />
              {success}
            </div>
          )}

          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
            {isLoading ? [...Array(5)].map((_, i) => <StatCardSkeleton key={i} />) : (
              [
                { label: "Total",       value: stats.total,          color: "#3B82F6", bg: "bg-blue-100",   icon: UserIcon,        ic: "text-blue-600" },
                { label: "Active",      value: stats.active,         color: "#10B981", bg: "bg-green-100",  icon: CheckCircleIcon, ic: "text-green-600" },
                { label: "Interns",     value: stats.interns,        color: "#8B5CF6", bg: "bg-purple-100", icon: DepartmentIcon,  ic: "text-purple-600" },
                { label: "Pending Pay", value: stats.pending,        color: "#EF4444", bg: "bg-red-100",    icon: SalaryIcon,      ic: "text-red-600" },
                { label: "Avg Perf",    value: `${stats.avgPerf}%`,  color: "#F97316", bg: "bg-orange-100", icon: PerformanceIcon, ic: "text-orange-600" },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl shadow p-4 border-l-4" style={{ borderLeftColor: s.color }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-800">{s.value}</p>
                    </div>
                    <div className={`p-2 rounded-full ${s.bg}`}>
                      <s.icon className={`w-5 h-5 ${s.ic}`} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* TABLE CARD */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 md:p-5 border-b bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-lg font-bold text-gray-800">
                  Employee Directory
                  {employees.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({filteredAndSorted.length} of {employees.length})
                    </span>
                  )}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-2.5 py-1.5 text-xs border rounded-md bg-white">
                    <option value="performance">Sort: Performance</option>
                    <option value="salary">Sort: Salary</option>
                    <option value="name">Sort: Name</option>
                  </select>
                  <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="px-2.5 py-1.5 text-xs border rounded-md bg-white">
                    <option value="all">All Depts</option>
                    {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <select value={employeeTypeFilter} onChange={e => setEmployeeTypeFilter(e.target.value)} className="px-2.5 py-1.5 text-xs border rounded-md bg-white">
                    <option value="all">All Types</option>
                    <option value="Employee">Employee</option>
                    <option value="Intern">Intern</option>
                  </select>
                  <div className="relative">
                    <input
                      type="text" placeholder="Search…" value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-7 pr-3 py-1.5 text-xs border rounded-md w-40"
                    />
                    <SearchIcon className="w-3.5 h-3.5 absolute left-2 top-2.5 text-gray-400" />
                  </div>
                  <button onClick={() => { setNewEmployee(EMPTY_NEW_EMP); openModal("add"); }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5" /> Add Employee
                  </button>
                  <button onClick={() => refetch()}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs flex items-center gap-1 border">
                    <RefreshIcon className="w-3.5 h-3.5" spinning={isLoading} /> Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Employee</th>
                    <th className="px-3 py-3 text-left">Login ID</th>
                    <th className="px-3 py-3 text-left">Dept / Role</th>
                    <th className="px-3 py-3 text-left">Salary</th>
                    <th className="px-3 py-3 text-center">Perf</th>
                    <th className="px-3 py-3 text-center">Attn</th>
                    <th className="px-3 py-3 text-center">Tasks</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => <TableRowSkeleton key={i} />)
                  ) : filteredAndSorted.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center text-gray-400">
                        {employees.length === 0 ? "No employees found" : "No employees match your filters"}
                      </td>
                    </tr>
                  ) : filteredAndSorted.map(emp => {
                    const dept    = DEPARTMENTS.find(d => d.id === emp.department);
                    const loading = emp._metricsState === "loading";
                    const hasPend = (emp.pendingSalary || 0) > 0;
                    const taskPct = emp.totalTasks > 0 ? Math.round((emp.completedTasks / emp.totalTasks) * 100) : 0;
                    const isDeleting = deleteMutation.isLoading && deleteMutation.variables === emp._id;
                    const isUpdating = updateMutation.isLoading && updateMutation.variables?._id === emp._id;

                    return (
                      <tr key={emp._id} className={`hover:bg-gray-50 transition-colors ${isDeleting || isUpdating ? "opacity-50" : ""}`}>
                        {/* Employee */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {emp.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{emp.name}</div>
                              <div className="text-xs text-gray-400 truncate">{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-gray-600">{emp.loginId}</td>
                        <td className="px-3 py-3 text-xs">
                          <div className="font-medium text-gray-700">{dept?.name || "—"}</div>
                          <div className="text-gray-400">{emp.position}</div>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <div>₹{emp.salary?.toLocaleString() || "0"}</div>
                          {hasPend && <div className="text-red-500">₹{emp.pendingSalary?.toLocaleString()} due</div>}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {loading ? <CellSpinner /> : (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getPerformanceColor(emp.performance)}`}>
                              {emp.performance}%
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {loading ? <CellSpinner /> : (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getPerformanceColor(emp.attendance)}`}>
                              {emp.attendance}%
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-xs">
                          {loading ? <CellSpinner /> : (
                            <>
                              <span className="text-gray-600">{emp.completedTasks}/{emp.totalTasks}</span>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${taskPct}%` }} />
                              </div>
                            </>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => setSelectedEmployee(emp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedEmployee(emp); openModal("edit"); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Edit">
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => openResetPasswordModal(emp)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Reset Password">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </button>
                            {hasPend && (
                              <button onClick={() => openPaySalaryModal(emp)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded" title="Pay Salary">
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleDelete(emp._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete"
                              disabled={isDeleting}>
                              <DeleteIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Metrics progress bar */}
            {!isLoading && employees.length > 0 && (() => {
              const ready = Object.values(metricsMap).filter(v => v !== "loading").length;
              const total = employees.length;
              const pct   = Math.round((ready / total) * 100);
              if (pct >= 100) return null;
              return (
                <div className="px-4 py-2 border-t bg-gray-50 flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                  <span>Loading metrics… {ready}/{total}</span>
                </div>
              );
            })()}
          </div>

          {/* ── MODALS ──────────────────────────────────────────────────────── */}

          {/* CREDENTIALS */}
          {modals.credentials && newEmployeeCredentials && (
            <Modal onClose={() => { closeModal("credentials"); setNewEmployeeCredentials(null); }}>
              <h3 className="text-lg font-bold text-green-600 mb-1">Credentials Generated!</h3>
              <p className="text-sm text-gray-500 mb-4">Save these securely before closing.</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm mb-4">
                {["name","email","loginId","password"].map(k => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="font-medium capitalize">{k === "loginId" ? "Login ID" : k}:</span>
                    <span className={k === "password" ? "font-mono text-red-600" : k === "loginId" ? "font-mono" : ""}>{newEmployeeCredentials[k]}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={copyCredentials} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm">Copy</button>
                <button onClick={() => { closeModal("credentials"); setNewEmployeeCredentials(null); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm">Done</button>
              </div>
            </Modal>
          )}

          {/* RESET PASSWORD */}
          {modals.resetPassword && (
            <Modal onClose={() => closeModal("resetPassword")} title="Reset Password">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                Resetting password for: <strong>{resetPasswordData.employeeName}</strong>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className={labelCls}>New Password *</label>
                  <input type="password" required minLength={6} className={inputCls} placeholder="Min 6 characters"
                    value={resetPasswordData.newPassword}
                    onChange={e => setResetPasswordData(p => ({ ...p, newPassword: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Confirm Password *</label>
                  <input type="password" required minLength={6} className={inputCls} placeholder="Re-enter password"
                    value={resetPasswordData.confirmPassword}
                    onChange={e => setResetPasswordData(p => ({ ...p, confirmPassword: e.target.value }))} />
                </div>
                {resetPasswordData.newPassword && resetPasswordData.confirmPassword &&
                  resetPasswordData.newPassword !== resetPasswordData.confirmPassword && (
                  <p className="text-red-500 text-xs">Passwords do not match</p>
                )}
                <ModalFooter onCancel={() => closeModal("resetPassword")} submitLabel="Reset Password"
                  disabled={resetPasswordMutation.isLoading || !resetPasswordData.newPassword || !resetPasswordData.confirmPassword ||
                    resetPasswordData.newPassword !== resetPasswordData.confirmPassword || resetPasswordData.newPassword.length < 6} />
              </form>
            </Modal>
          )}

          {/* PAY SALARY */}
          {modals.paySalary && (
            <Modal onClose={() => closeModal("paySalary")} title="Pay Salary">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                Paying salary for: <strong>{paySalaryData.employeeName}</strong>
              </div>
              <form onSubmit={handlePaySalary} className="space-y-4">
                <div>
                  <label className={labelCls}>Amount (₹) *</label>
                  <input type="number" required min="0" step="0.01" className={inputCls}
                    value={paySalaryData.amount} onChange={e => setPaySalaryData(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Month</label>
                    <select className={inputCls} value={paySalaryData.month} onChange={e => setPaySalaryData(p => ({ ...p, month: +e.target.value }))}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i+1} value={i+1}>{new Date(2024,i).toLocaleString("default",{month:"long"})}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Year</label>
                    <input type="number" className={inputCls} value={paySalaryData.year}
                      onChange={e => setPaySalaryData(p => ({ ...p, year: +e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea rows={3} className={inputCls} placeholder="Optional notes"
                    value={paySalaryData.notes} onChange={e => setPaySalaryData(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <ModalFooter onCancel={() => closeModal("paySalary")} submitLabel="Pay Salary"
                  submitClass="bg-green-500 hover:bg-green-600"
                  disabled={paySalaryMutation.isLoading || !paySalaryData.amount || paySalaryData.amount <= 0} />
              </form>
            </Modal>
          )}

          {/* ADD EMPLOYEE */}
          {modals.add && (
            <Modal onClose={() => { closeModal("add"); setNewEmployee(EMPTY_NEW_EMP); }} title="Add New Employee" wide>
              <form onSubmit={handleAdd} className="space-y-4">
                <EmpFormFields emp={newEmployee} setEmp={setNewEmployee} showCredentials inputCls={inputCls} labelCls={labelCls} />
                <ModalFooter onCancel={() => { closeModal("add"); setNewEmployee(EMPTY_NEW_EMP); }}
                  submitLabel={addMutation.isLoading ? "Creating…" : "Create Employee"}
                  disabled={addMutation.isLoading} />
              </form>
            </Modal>
          )}

          {/* EDIT EMPLOYEE */}
          {modals.edit && selectedEmployee && (
            <Modal onClose={() => { closeModal("edit"); setSelectedEmployee(null); }} title="Edit Employee" wide>
              <form onSubmit={handleEdit} className="space-y-4">
                <EmpFormFields emp={selectedEmployee} setEmp={setSelectedEmployee} inputCls={inputCls} labelCls={labelCls} />
                <ModalFooter onCancel={() => { closeModal("edit"); setSelectedEmployee(null); }}
                  submitLabel={updateMutation.isLoading ? "Updating…" : "Update Employee"}
                  disabled={updateMutation.isLoading} />
              </form>
            </Modal>
          )}

          {/* TASKS MODAL */}
          {modals.tasks && selectedEmployee && (
            <Modal onClose={() => closeModal("tasks")} title={`Tasks — ${selectedEmployee.name}`} wide>
              <div className="mb-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                Total: {employeeTasks.length} · Completed: {employeeTasks.filter(t => t.status?.toLowerCase() === "completed").length}
              </div>
              {employeeTasks.length === 0 ? (
                <div className="py-8 text-center text-gray-400">No tasks found</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {employeeTasks.map((task, i) => (
                    <div key={task._id || i} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                        <div className="flex gap-3 mt-1 text-xs text-gray-400">
                          {task.priority && <span>Priority: {task.priority}</span>}
                          {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                        task.status?.toLowerCase() === "completed" ? "bg-green-100 text-green-700" :
                        task.status === "In Progress" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Modal>
          )}

          {/* ATTENDANCE MODAL */}
          {modals.attendance && selectedEmployee && (
            <Modal onClose={() => closeModal("attendance")} title={`Attendance — ${selectedEmployee.name}`} wide>
              <div className="mb-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                Total: {employeeAttendance.length} · Present: {employeeAttendance.filter(a => a.status?.toLowerCase() === "present").length}
              </div>
              {employeeAttendance.length === 0 ? (
                <div className="py-8 text-center text-gray-400">No attendance records</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {employeeAttendance.map((rec, i) => (
                    <div key={rec._id || i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-sm">{new Date(rec.date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          In: {rec.clockIn ? new Date(rec.clockIn).toLocaleTimeString() : "N/A"} ·
                          Out: {rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString() : "N/A"}
                          {rec.hoursWorked ? ` · ${rec.hoursWorked}h` : ""}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        rec.status?.toLowerCase() === "present" ? "bg-green-100 text-green-700" :
                        rec.status === "Absent" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {rec.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Modal>
          )}

          {/* VIEW EMPLOYEE DETAIL */}
          {selectedEmployee && !modals.edit && !modals.add && !modals.credentials && !modals.tasks && !modals.attendance && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {selectedEmployee.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedEmployee.name}</h2>
                      <p className="text-blue-200 text-sm">{selectedEmployee.position}</p>
                      <p className="text-blue-300 text-xs font-mono">ID: {selectedEmployee.loginId}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEmployee(null)} className="text-white hover:text-blue-200">
                    <CloseIcon />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {[
                      ["Email",        selectedEmployee.email],
                      ["Phone",        selectedEmployee.phone || "—"],
                      ["Department",   DEPARTMENTS.find(d => d.id === selectedEmployee.department)?.name || "—"],
                      ["Position",     selectedEmployee.position],
                      ["Salary",       `₹${selectedEmployee.salary?.toLocaleString() || 0}`],
                      ["Pending",      `₹${selectedEmployee.pendingSalary?.toLocaleString() || 0}`],
                      ["Paid",         `₹${selectedEmployee.paidSalary?.toLocaleString() || 0}`],
                      ["Joining Date", selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : "—"],
                      ["Type",         selectedEmployee.employeeType],
                      ["Status",       selectedEmployee.status],
                      ["Performance",  `${selectedEmployee.performance || 0}%`],
                      ["Attendance",   `${selectedEmployee.attendance || 0}%`],
                      ["Tasks",        `${selectedEmployee.completedTasks || 0}/${selectedEmployee.totalTasks || 0}`],
                    ].map(([label, val]) => (
                      <div key={label} className="border-b pb-2">
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="font-medium">{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => fetchAndShowTasks(selectedEmployee)}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm border border-blue-200">
                      View Tasks
                    </button>
                    <button onClick={() => fetchAndShowAttendance(selectedEmployee)}
                      className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-md text-sm border border-green-200">
                      View Attendance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

// ─── SHARED MODAL WRAPPER ─────────────────────────────────────────────────────
const Modal = ({ children, onClose, title, wide = false }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className={`bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto p-6 ${wide ? "max-w-2xl" : "max-w-md"}`}>
      {title && (
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
        </div>
      )}
      {children}
    </div>
  </div>
);

// ─── SHARED MODAL FOOTER ──────────────────────────────────────────────────────
const ModalFooter = ({ onCancel, submitLabel, disabled = false, submitClass = "bg-blue-500 hover:bg-blue-600" }) => (
  <div className="flex justify-end gap-3 pt-2">
    <button type="button" onClick={onCancel} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm border">Cancel</button>
    <button type="submit" disabled={disabled} className={`px-5 py-2 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed ${submitClass}`}>
      {submitLabel}
    </button>
  </div>
);

// ─── EMPLOYEE FORM FIELDS ─────────────────────────────────────────────────────
const EmpFormFields = ({ emp, setEmp, showCredentials = false, inputCls, labelCls }) => {
  const f = (key) => ({ value: emp[key] || "", onChange: e => setEmp(p => ({ ...p, [key]: e.target.value })), className: inputCls });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div><label className={labelCls}>Full Name *</label><input type="text" required {...f("name")} placeholder="Full name" /></div>
      <div><label className={labelCls}>Email *</label><input type="email" required {...f("email")} placeholder="Email" /></div>
      <div><label className={labelCls}>Phone</label><input type="tel" {...f("phone")} placeholder="Phone" /></div>
      <div>
        <label className={labelCls}>Department *</label>
        <select required {...f("department")}>
          <option value="">Select Department</option>
          {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div><label className={labelCls}>Position *</label><input type="text" required {...f("position")} placeholder="Position" /></div>
      <div><label className={labelCls}>Salary (₹) *</label><input type="number" required min="0" {...f("salary")} placeholder="Salary" /></div>
      <div><label className={labelCls}>Joining Date *</label><input type="date" required {...f("joiningDate")} /></div>
      <div>
        <label className={labelCls}>Employee Type</label>
        <select {...f("employeeType")}><option value="Employee">Employee</option><option value="Intern">Intern</option></select>
      </div>
      <div>
        <label className={labelCls}>Status</label>
        <select {...f("status")}><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
      </div>
      {showCredentials && <>
        <div><label className={labelCls}>Login ID *</label><input type="text" required {...f("loginId")} placeholder="Login ID" /></div>
        <div><label className={labelCls}>Password *</label><input type="text" required minLength={6} {...f("password")} placeholder="Min 6 characters" /></div>
      </>}
    </div>
  );
};

export default EmployeeManagement;