import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo
} from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const API_URL      = "https://crm-p35o.onrender.com/api";
const STATUS_BATCH = 5;

const DEPARTMENTS = [
  { id:1, name:"Sales" }, { id:2, name:"Marketing" }, { id:3, name:"Development" },
  { id:4, name:"HR" },    { id:5, name:"Finance" },   { id:6, name:"Operations" },
];

const EMPTY_EMP = {
  name:"", email:"", phone:"", department:"", position:"",
  salary:"", joiningDate:"", status:"Active", employeeType:"Employee",
  loginId:"", password:""
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
function useDebounce(val, ms=260) {
  const [dv, setDv] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setDv(val), ms);
    return () => clearTimeout(t);
  }, [val, ms]);
  return dv;
}

const getDeptName = (id) => DEPARTMENTS.find(d => d.id === +id)?.name || "—";
const initials    = (name="") => name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

// ─── LIVE STATUS API ──────────────────────────────────────────────────────────
async function checkLiveStatus(empId, token) {
  for (const url of [
    `${API_URL}/status/${empId}/today`,
    `${API_URL}/attendance/${empId}/today`,
  ]) {
    try {
      const res = await fetch(url, { headers: { Authorization:`Bearer ${token}` } });
      if (!res.ok) continue;
      const d = await res.json();
      if (d.isActive||d.isClockedIn) return true;
      if (d.attendanceRecord?.clockIn && !d.attendanceRecord?.clockOut) return true;
      return false;
    } catch { /* try next */ }
  }
  return false;
}

// ─── SKELETONS ────────────────────────────────────────────────────────────────
const Pulse = ({ className="" }) => (
  <div className={`rounded animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 ${className}`} />
);

const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
    <Pulse className="h-3 w-20" />
    <Pulse className="h-8 w-12" />
  </div>
);

const TableRowSkeleton = () => (
  <tr className="border-b border-slate-50">
    <td className="px-5 py-3.5"><div className="flex items-center gap-2"><Pulse className="w-2.5 h-2.5 rounded-full" /><Pulse className="h-3 w-12" /></div></td>
    <td className="px-5 py-3.5"><div className="flex items-center gap-3"><Pulse className="w-8 h-8 rounded-xl" /><div className="space-y-1.5"><Pulse className="h-3 w-28" /><Pulse className="h-2.5 w-36" /></div></div></td>
    <td className="px-5 py-3.5"><Pulse className="h-3 w-20 mb-1.5" /><Pulse className="h-2.5 w-24" /></td>
    <td className="px-5 py-3.5"><Pulse className="h-3 w-16" /></td>
    <td className="px-5 py-3.5"><div className="flex justify-center gap-1.5">{[...Array(4)].map((_,i)=><Pulse key={i} className="w-7 h-7 rounded-lg" />)}</div></td>
  </tr>
);

// ─── STATUS DOT ───────────────────────────────────────────────────────────────
// state: "loading" | true | false
const StatusDot = memo(({ state }) => {
  if (state === "loading") return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 animate-pulse" />
      <span className="text-xs text-slate-400">—</span>
    </div>
  );
  const on = state === true;
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-2.5 h-2.5">
        {on && <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />}
        <div className={`relative w-full h-full rounded-full ${on?"bg-emerald-500":"bg-rose-400"}`} />
      </div>
      <span className={`text-xs font-medium ${on?"text-emerald-600":"text-rose-500"}`}>
        {on?"Online":"Offline"}
      </span>
    </div>
  );
});

// ─── ACTION BUTTON ────────────────────────────────────────────────────────────
const ActionBtn = memo(({ onClick, title, color, children }) => (
  <button onClick={onClick} title={title}
    className={`p-1.5 rounded-lg transition-colors ${color}`}>
    {children}
  </button>
));

// ─── MODAL SHELL ──────────────────────────────────────────────────────────────
const Modal = memo(({ title, onClose, children, wide=false }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto ${wide?"max-w-2xl":"max-w-md"}`}>
      <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center rounded-t-2xl z-10">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
));

const ModalFooter = ({ onCancel, submitLabel, submitCls="bg-blue-600 hover:bg-blue-700", disabled=false }) => (
  <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
    <button type="button" onClick={onCancel}
      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
      Cancel
    </button>
    <button type="submit" disabled={disabled}
      className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${submitCls}`}>
      {submitLabel}
    </button>
  </div>
);

// ─── EMPLOYEE FORM FIELDS ─────────────────────────────────────────────────────
const EmpFormFields = memo(({ emp, setEmp, showCredentials=false }) => {
  const cls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50";
  const lbl = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";
  const f   = (key) => ({ value:emp[key]??"", onChange:e=>setEmp(p=>({...p,[key]:e.target.value})), className:cls });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div><label className={lbl}>Full Name *</label><input type="text" required placeholder="John Doe" {...f("name")} /></div>
      <div><label className={lbl}>Email *</label><input type="email" required placeholder="john@company.com" {...f("email")} /></div>
      <div><label className={lbl}>Phone</label><input type="tel" placeholder="+91 9876543210" {...f("phone")} /></div>
      <div>
        <label className={lbl}>Department *</label>
        <select required {...f("department")}>
          <option value="">Select department</option>
          {DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div><label className={lbl}>Position *</label><input type="text" required placeholder="Sales Executive" {...f("position")} /></div>
      <div><label className={lbl}>Salary (₹) *</label><input type="number" required min="0" placeholder="50000" {...f("salary")} /></div>
      <div><label className={lbl}>Joining Date *</label><input type="date" required {...f("joiningDate")} /></div>
      <div>
        <label className={lbl}>Employee Type</label>
        <select {...f("employeeType")}><option value="Employee">Employee</option><option value="Intern">Intern</option></select>
      </div>
      <div>
        <label className={lbl}>Status</label>
        <select {...f("status")}><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
      </div>
      {showCredentials && <>
        <div><label className={lbl}>Login ID *</label><input type="text" required placeholder="EMP001" {...f("loginId")} /></div>
        <div className="md:col-span-2">
          <label className={lbl}>Password * (min 6)</label>
          <input type="text" required minLength={6} placeholder="Enter password" {...f("password")} />
        </div>
      </>}
    </div>
  );
});

// ─── EMPLOYEE TABLE ROW (memoized) ────────────────────────────────────────────
const EmpRow = memo(({ emp, onView, onEdit, onReset, onPaySal, onDelete }) => {
  const hasPend = (emp.pendingSalary||0) > 0;
  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      <td className="px-5 py-3.5"><StatusDot state={emp._status} /></td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {initials(emp.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{emp.name}</p>
            <p className="text-xs text-slate-400 truncate">{emp.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-xs">
        <p className="font-medium text-slate-700">{getDeptName(emp.department)}</p>
        <p className="text-slate-400">{emp.position}</p>
      </td>
      <td className="px-5 py-3.5 text-sm">
        <p className="font-medium text-slate-700">₹{emp.salary?.toLocaleString()}</p>
        {hasPend && <p className="text-xs text-amber-600">₹{emp.pendingSalary?.toLocaleString()} due</p>}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-center gap-1">
          <ActionBtn onClick={()=>onView(emp)} title="View" color="text-blue-600 hover:bg-blue-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </ActionBtn>
          <ActionBtn onClick={()=>onEdit(emp)} title="Edit" color="text-amber-600 hover:bg-amber-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </ActionBtn>
          <ActionBtn onClick={()=>onReset(emp)} title="Reset Password" color="text-emerald-600 hover:bg-emerald-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </ActionBtn>
          {hasPend && (
            <ActionBtn onClick={()=>onPaySal(emp)} title="Pay Salary" color="text-teal-600 hover:bg-teal-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </ActionBtn>
          )}
          <ActionBtn onClick={()=>onDelete(emp._id)} title="Delete" color="text-rose-500 hover:bg-rose-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </ActionBtn>
        </div>
      </td>
    </tr>
  );
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const EmployeeManagement = () => {
  const token = localStorage.getItem("adminToken");

  const [employees,   setEmployees]   = useState([]);
  const [statusMap,   setStatusMap]   = useState({});   // { [id]: true|false|"loading" }
  const [loading,     setLoading]     = useState(true);
  const [success,     setSuccess]     = useState("");
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [deptFilter,  setDeptFilter]  = useState("all");
  const [modal,       setModal]       = useState(null); // "add"|"edit"|"view"|"resetPw"|"paySalary"|"credentials"
  const [selEmp,      setSelEmp]      = useState(null);
  const [newEmp,      setNewEmp]      = useState(EMPTY_EMP);
  const [credentials, setCredentials] = useState(null);
  const [resetPwData, setResetPwData] = useState({ employeeId:"", employeeName:"", newPassword:"", confirmPassword:"" });
  const [paySalData,  setPaySalData]  = useState({ employeeId:"", employeeName:"", amount:"", month:new Date().getMonth()+1, year:new Date().getFullYear(), notes:"" });

  const abortRef        = useRef(null);
  const debouncedSearch = useDebounce(search);

  // Auth guard
  useEffect(() => { if (!token) { alert("Not logged in"); window.location.href="/admin/login"; } }, [token]);

  // Auto-clear messages
  useEffect(() => { if (success) { const t=setTimeout(()=>setSuccess(""),4000); return ()=>clearTimeout(t); } }, [success]);
  useEffect(() => { if (error)   { const t=setTimeout(()=>setError(""),  5000); return ()=>clearTimeout(t); } }, [error]);

  // ── STEP 1: Fetch employees (fast single request) ──────────────────────────
  const fetchEmployees = useCallback(async () => {
    if (!token) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setLoading(true);
    setStatusMap({});

    try {
      const res  = await fetch(`${API_URL}/employee/get/employee`, { headers:{ Authorization:`Bearer ${token}` }, signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.employees||data.data||[];
      setEmployees(list);

      // Mark all as "loading" → cells show spinner immediately
      const init = Object.fromEntries(list.map(e=>[e._id,"loading"]));
      setStatusMap(init);

      // STEP 2: Batch load live status in background
      batchLoadStatus(list, signal);
    } catch (err) {
      if (!signal.aborted) setError("Failed to load employees. Check network or token.");
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line

  // ── STEP 2: Live-status batch loader ──────────────────────────────────────
  const batchLoadStatus = useCallback(async (list, signal) => {
    for (let i=0; i<list.length; i+=STATUS_BATCH) {
      if (signal?.aborted) break;
      await Promise.allSettled(
        list.slice(i, i+STATUS_BATCH).map(async emp => {
          const isOnline = await checkLiveStatus(emp._id, token);
          if (!signal?.aborted)
            setStatusMap(prev => ({ ...prev, [emp._id]: isOnline }));
        })
      );
      if (i+STATUS_BATCH < list.length) await new Promise(r=>setTimeout(r,120));
    }
  }, [token]);

  useEffect(() => { if(token) fetchEmployees(); return ()=>abortRef.current?.abort(); }, [token]); // eslint-disable-line

  // ── Merged employees + statusMap ───────────────────────────────────────────
  const mergedEmployees = useMemo(() =>
    employees.map(emp => ({ ...emp, _status: statusMap[emp._id]??"loading" })),
  [employees, statusMap]);

  // ── Filtered + searched ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = debouncedSearch.toLowerCase();
    return mergedEmployees.filter(emp =>
      (!s || emp.name?.toLowerCase().includes(s) || emp.email?.toLowerCase().includes(s) || emp.position?.toLowerCase().includes(s)) &&
      (deptFilter==="all" || emp.department===+deptFilter)
    );
  }, [mergedEmployees, debouncedSearch, deptFilter]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:   employees.length,
    online:  Object.values(statusMap).filter(v=>v===true).length,
    offline: Object.values(statusMap).filter(v=>v===false).length,
    pending: employees.filter(e=>(e.pendingSalary||0)>0).length,
  }), [employees, statusMap]);

  // ── API handlers ───────────────────────────────────────────────────────────
  const handleAdd = useCallback(async (e) => {
    e.preventDefault();
    if (["name","email","department","position","salary","joiningDate","loginId","password"].some(f=>!newEmp[f])) return alert("Fill all required fields");
    if (newEmp.password.length<6) return alert("Password ≥ 6 characters");
    try {
      const res = await fetch(`${API_URL}/employee/create/employee`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({...newEmp,salary:+newEmp.salary,department:+newEmp.department})});
      if (!res.ok) throw new Error();
      setCredentials({name:newEmp.name,email:newEmp.email,loginId:newEmp.loginId,password:newEmp.password});
      setModal("credentials"); setNewEmp(EMPTY_EMP); fetchEmployees(); setSuccess("Employee created!");
    } catch { alert("Failed to create employee"); }
  }, [newEmp, token, fetchEmployees]);

  const handleEdit = useCallback(async (e) => {
    e.preventDefault();
    if (!selEmp) return;
    try {
      const res = await fetch(`${API_URL}/employee/update/${selEmp._id}`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({...selEmp,salary:+selEmp.salary,department:+selEmp.department})});
      if (!res.ok) throw new Error();
      fetchEmployees(); setModal(null); setSuccess("Employee updated!");
    } catch { alert("Update failed"); }
  }, [selEmp, token, fetchEmployees]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm("Delete this employee?")) return;
    try {
      const res = await fetch(`${API_URL}/employee/delete/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
      if (!res.ok) throw new Error();
      fetchEmployees(); setSuccess("Employee deleted!");
    } catch { alert("Delete failed"); }
  }, [token, fetchEmployees]);

  const handleResetPw = useCallback(async (e) => {
    e.preventDefault();
    if (resetPwData.newPassword!==resetPwData.confirmPassword) return alert("Passwords don't match");
    if (resetPwData.newPassword.length<6) return alert("Password ≥ 6 characters");
    try {
      const res = await fetch(`${API_URL}/employee/${resetPwData.employeeId}/reset-password`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({newPassword:resetPwData.newPassword})});
      if (!res.ok) throw new Error();
      const emp = employees.find(e=>e._id===resetPwData.employeeId);
      setCredentials({name:resetPwData.employeeName,loginId:emp?.loginId,password:resetPwData.newPassword});
      setModal("credentials"); setSuccess("Password reset!");
    } catch { alert("Reset failed"); }
  }, [resetPwData, token, employees]);

  const handlePaySalary = useCallback(async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/salary/pay/${paySalData.employeeId}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({amount:+paySalData.amount,month:paySalData.month,year:paySalData.year,notes:paySalData.notes})});
      if (!res.ok) throw new Error();
      fetchEmployees(); setModal(null); setSuccess("Salary paid!");
    } catch { alert("Payment failed"); }
  }, [paySalData, token, fetchEmployees]);

  const copyCredentials = useCallback(() => {
    if (!credentials) return;
    navigator.clipboard.writeText(`Name: ${credentials.name}\nEmail: ${credentials.email||""}\nLogin ID: ${credentials.loginId}\nPassword: ${credentials.password}`).then(()=>alert("Copied!"));
  }, [credentials]);

  const openView   = useCallback((emp)=>{ setSelEmp(emp); setModal("view"); },[]);
  const openEdit   = useCallback((emp)=>{ setSelEmp(emp); setModal("edit"); },[]);
  const openReset  = useCallback((emp)=>{ setResetPwData({employeeId:emp._id,employeeName:emp.name,newPassword:"",confirmPassword:""}); setModal("resetPw"); },[]);
  const openPaySal = useCallback((emp)=>{ setPaySalData({employeeId:emp._id,employeeName:emp.name,amount:emp.pendingSalary||emp.salary||0,month:new Date().getMonth()+1,year:new Date().getFullYear(),notes:""}); setModal("paySalary"); },[]);

  if (!token) return <div className="min-h-screen flex items-center justify-center">Redirecting…</div>;

  const iCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50";
  const lbl  = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";

  // Progress bar: how many statuses have resolved
  const statusDone  = Object.values(statusMap).filter(v=>v!=="loading").length;
  const statusTotal = employees.length;
  const statusPct   = statusTotal > 0 ? Math.round((statusDone/statusTotal)*100) : 100;

  return (
    <>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .fade-up{animation:fadeUp .2s ease both}
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-5 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">Employee Management</h1>
            <p className="text-slate-500 text-sm mt-1">
              {!loading && statusPct < 100
                ? `Employees loaded · Fetching live status ${statusDone}/${statusTotal}…`
                : "Live status · Lazy-loaded after employee list appears"}
            </p>
          </div>

          {/* Alerts */}
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm text-center fade-up">{success}</div>}
          {error   && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
              <span>{error}</span>
              <button onClick={()=>setError("")} className="font-bold text-lg leading-none">×</button>
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? [...Array(4)].map((_,i)=><StatCardSkeleton key={i}/>) : (
              [
                { label:"Total Employees", val:stats.total,   cls:"text-slate-800",   border:"border-slate-200" },
                { label:"Online Now",      val:stats.online,  cls:"text-emerald-600", border:"border-emerald-200" },
                { label:"Offline",         val:stats.offline, cls:"text-rose-500",    border:"border-rose-200" },
                { label:"Pending Pay",     val:stats.pending, cls:"text-amber-600",   border:"border-amber-200" },
              ].map(s=>(
                <div key={s.label} className={`bg-white rounded-2xl p-5 shadow-sm border ${s.border} fade-up`}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
                  <p className={`text-3xl font-extrabold mt-1 ${s.cls}`}>{s.val}</p>
                </div>
              ))
            )}
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

            {/* Toolbar */}
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60">
              <h2 className="font-bold text-slate-800 text-lg">
                All Employees
                {!loading && <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length} of {employees.length})</span>}
              </h2>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input type="text" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}
                    className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl w-40 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
                </div>
                <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="all">All Depts</option>
                  {DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <button onClick={()=>{setNewEmp(EMPTY_EMP);setModal("add");}}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl font-medium transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                  Add Employee
                </button>
                <button onClick={fetchEmployees} disabled={loading}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl border border-slate-200 disabled:opacity-60 transition-colors">
                  <svg className={`w-3.5 h-3.5 ${loading?"animate-spin":""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Live-status progress bar */}
            {!loading && statusPct < 100 && (
              <div className="px-5 py-2 border-b border-slate-100 bg-blue-50/40 flex items-center gap-3 text-xs text-slate-500">
                <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{width:`${statusPct}%`}}/>
                </div>
                <span className="shrink-0">Live status {statusDone}/{statusTotal}</span>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-left">Dept / Role</th>
                    <th className="px-5 py-3 text-left">Salary</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading
                    ? [...Array(6)].map((_,i)=><TableRowSkeleton key={i}/>)
                    : filtered.length === 0
                    ? (
                      <tr><td colSpan={5} className="py-14 text-center text-slate-400">
                        <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <p className="font-medium text-sm">{employees.length===0?"No employees found":"No employees match your search"}</p>
                      </td></tr>
                    )
                    : filtered.map(emp=>(
                      <EmpRow key={emp._id} emp={emp}
                        onView={openView} onEdit={openEdit} onReset={openReset}
                        onPaySal={openPaySal} onDelete={handleDelete}/>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ──────────────────────────────────────────────────────────── */}

      {modal==="add" && (
        <Modal title="Add New Employee" onClose={()=>setModal(null)} wide>
          <form onSubmit={handleAdd} className="space-y-4">
            <EmpFormFields emp={newEmp} setEmp={setNewEmp} showCredentials/>
            <ModalFooter onCancel={()=>setModal(null)} submitLabel="Create Employee"/>
          </form>
        </Modal>
      )}

      {modal==="edit" && selEmp && (
        <Modal title="Edit Employee" onClose={()=>setModal(null)} wide>
          <form onSubmit={handleEdit} className="space-y-4">
            <EmpFormFields emp={selEmp} setEmp={setSelEmp}/>
            <ModalFooter onCancel={()=>setModal(null)} submitLabel="Update Employee"/>
          </form>
        </Modal>
      )}

      {modal==="view" && selEmp && (
        <Modal title="Employee Details" onClose={()=>setModal(null)}>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                {initials(selEmp.name)}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg">{selEmp.name}</p>
                <p className="text-slate-500 text-sm">{selEmp.email}</p>
                <div className="mt-1"><StatusDot state={selEmp._status}/></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Department",getDeptName(selEmp.department)],["Position",selEmp.position],["Salary",`₹${selEmp.salary?.toLocaleString()}`],["Phone",selEmp.phone||"—"],["Type",selEmp.employeeType],["Login ID",selEmp.loginId],["Joining",selEmp.joiningDate?new Date(selEmp.joiningDate).toLocaleDateString():"—"],["Pending",selEmp.pendingSalary?`₹${selEmp.pendingSalary.toLocaleString()}`:"None"]].map(([l,v])=>(
                <div key={l} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium">{l}</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button onClick={()=>setModal(null)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">Close</button>
            </div>
          </div>
        </Modal>
      )}

      {modal==="resetPw" && (
        <Modal title="Reset Password" onClose={()=>setModal(null)}>
          <form onSubmit={handleResetPw} className="space-y-4">
            <div className="bg-blue-50 text-blue-700 text-sm px-4 py-3 rounded-xl border border-blue-200">
              Resetting password for <strong>{resetPwData.employeeName}</strong>
            </div>
            {[{label:"New Password",key:"newPassword",min:6},{label:"Confirm Password",key:"confirmPassword",min:undefined}].map(({label,key,min})=>(
              <div key={key}>
                <label className={lbl}>{label} *</label>
                <input type="password" required minLength={min} placeholder={key==="newPassword"?"Min 6 characters":"Re-enter password"}
                  value={resetPwData[key]}
                  onChange={e=>setResetPwData(p=>({...p,[key]:e.target.value}))}
                  className={iCls}/>
              </div>
            ))}
            {resetPwData.newPassword && resetPwData.confirmPassword && resetPwData.newPassword!==resetPwData.confirmPassword && (
              <p className="text-rose-500 text-xs">Passwords do not match</p>
            )}
            <ModalFooter onCancel={()=>setModal(null)} submitLabel="Reset Password"
              disabled={!resetPwData.newPassword||!resetPwData.confirmPassword||resetPwData.newPassword!==resetPwData.confirmPassword||resetPwData.newPassword.length<6}/>
          </form>
        </Modal>
      )}

      {modal==="paySalary" && (
        <Modal title="Pay Salary" onClose={()=>setModal(null)}>
          <form onSubmit={handlePaySalary} className="space-y-4">
            <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl border border-emerald-200">
              Paying salary for <strong>{paySalData.employeeName}</strong>
            </div>
            <div><label className={lbl}>Amount (₹) *</label><input type="number" required min="0" className={iCls} value={paySalData.amount} onChange={e=>setPaySalData(p=>({...p,amount:e.target.value}))}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Month</label>
                <select className={iCls} value={paySalData.month} onChange={e=>setPaySalData(p=>({...p,month:+e.target.value}))}>
                  {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{new Date(2000,i).toLocaleString("default",{month:"long"})}</option>)}
                </select>
              </div>
              <div><label className={lbl}>Year</label><input type="number" className={iCls} value={paySalData.year} onChange={e=>setPaySalData(p=>({...p,year:+e.target.value}))}/></div>
            </div>
            <div><label className={lbl}>Notes</label><textarea rows={3} className={`${iCls} resize-none`} placeholder="Optional" value={paySalData.notes} onChange={e=>setPaySalData(p=>({...p,notes:e.target.value}))}/></div>
            <ModalFooter onCancel={()=>setModal(null)} submitLabel="Pay Salary" submitCls="bg-emerald-600 hover:bg-emerald-700" disabled={!paySalData.amount||+paySalData.amount<=0}/>
          </form>
        </Modal>
      )}

      {modal==="credentials" && credentials && (
        <Modal title="Credentials Generated" onClose={()=>{setModal(null);setCredentials(null);}}>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-xl">
              <strong>Save these credentials.</strong> They will not be shown again.
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
              {[["Name",credentials.name],["Email",credentials.email],["Login ID",credentials.loginId],["Password",credentials.password]].filter(([,v])=>v).map(([l,v])=>(
                <div key={l} className="flex justify-between items-center gap-4 text-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{l}</span>
                  <span className={`font-mono text-xs ${l==="Password"?"text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200":""}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button onClick={copyCredentials} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium border border-slate-200">Copy</button>
              <button onClick={()=>{setModal(null);setCredentials(null);}} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">Done</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default EmployeeManagement;