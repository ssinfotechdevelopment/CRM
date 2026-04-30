import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo
} from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

// ─── AXIOS INSTANCE ───────────────────────────────────────────────────────────
const api = axios.create({ baseURL: "https://crm-backned.onrender.com/api" });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("adminToken");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("adminToken");
      toast.error("Session expired");
      setTimeout(() => (window.location.href = "/admin"), 1400);
    }
    return Promise.reject(err);
  }
);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STATUSES   = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const STATUS_META = {
  Planning:    { cls: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
  "In Progress":{ cls: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-500"  },
  "On Hold":   { cls: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  Completed:   { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Cancelled:   { cls: "bg-red-50 text-red-600 border-red-200",          dot: "bg-red-400"   },
};

const PRIORITY_META = {
  Low:    { cls: "bg-slate-100 text-slate-600 border-slate-200",    bar: "bg-slate-400" },
  Medium: { cls: "bg-sky-50 text-sky-700 border-sky-200",           bar: "bg-sky-500"   },
  High:   { cls: "bg-orange-50 text-orange-700 border-orange-200",  bar: "bg-orange-500" },
  Urgent: { cls: "bg-red-50 text-red-700 border-red-200",           bar: "bg-red-500"   },
};

const EMPTY_FORM = {
  name:"", description:"", client:"", startDate:"", endDate:"",
  budget:"", status:"Planning", priority:"Medium", teamMembers:[], progress:0,
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt    = (d) => { try { return new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); } catch { return "—"; } };
const money  = (n) => `₹${Number(n||0).toLocaleString("en-IN")}`;
const initials = (name="") => name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
const daysLeft = (end) => {
  if (!end) return null;
  const diff = Math.ceil((new Date(end) - new Date()) / 86400000);
  return diff;
};

function useDebounce(v, ms=280) {
  const [dv, setDv] = useState(v);
  useEffect(() => { const t = setTimeout(()=>setDv(v), ms); return ()=>clearTimeout(t); }, [v, ms]);
  return dv;
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
const Pulse = ({ className="" }) => (
  <div className={`animate-pulse rounded bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 ${className}`} />
);

const StatSkeleton = () => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
    <Pulse className="h-3 w-24" /><Pulse className="h-8 w-14" /><Pulse className="h-2 w-32" />
  </div>
);

const CardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
    <div className="flex justify-between">
      <Pulse className="h-4 w-40" /><Pulse className="h-5 w-16 rounded-full" />
    </div>
    <Pulse className="h-3 w-full" /><Pulse className="h-3 w-3/4" />
    <div className="flex gap-2"><Pulse className="h-5 w-20 rounded-full" /><Pulse className="h-5 w-16 rounded-full" /></div>
    <Pulse className="h-2 w-full rounded-full" />
    <div className="flex justify-between">
      <div className="flex -space-x-2">{[...Array(3)].map((_,i)=><Pulse key={i} className="w-7 h-7 rounded-full border-2 border-white" />)}</div>
      <Pulse className="h-7 w-14 rounded-lg" />
    </div>
  </div>
);

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const Badge = memo(({ cls, dot, children }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
    {children}
  </span>
));

const Modal = memo(({ title, onClose, children, wide=false, extraWide=false }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[92vh] overflow-y-auto ${extraWide?"max-w-5xl":wide?"max-w-3xl":"max-w-lg"}`}>
      <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
));

// ─── PROJECT CARD ─────────────────────────────────────────────────────────────
const ProjectCard = memo(({ project, onEdit, onDelete, onView }) => {
  const sm  = STATUS_META[project.status]   || STATUS_META.Planning;
  const pm  = PRIORITY_META[project.priority] || PRIORITY_META.Medium;
  const dl  = daysLeft(project.endDate);
  const pct = Math.min(100, Math.max(0, project.progress || 0));
  const overdue = dl !== null && dl < 0 && project.status !== "Completed";
  const urgent  = dl !== null && dl <= 7 && dl >= 0 && project.status !== "Completed";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200 flex flex-col group">
      {/* Top accent bar */}
      <div className={`h-1 rounded-t-2xl ${pm.bar}`} />

      <div className="p-5 flex flex-col flex-1 gap-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-base leading-snug truncate group-hover:text-indigo-700 transition-colors cursor-pointer"
              onClick={() => onView(project)}>
              {project.name}
            </h3>
            {project.client?.name && (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg>
                {project.client.name} {project.client.company && `· ${project.client.company}`}
              </p>
            )}
          </div>
          <Badge cls={sm.cls} dot={sm.dot}>{project.status}</Badge>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{project.description}</p>
        )}

        {/* Priority + dates */}
        <div className="flex flex-wrap gap-1.5">
          <Badge cls={pm.cls}>{project.priority}</Badge>
          {overdue && <Badge cls="bg-red-50 text-red-600 border-red-200">⚠ Overdue</Badge>}
          {urgent  && <Badge cls="bg-orange-50 text-orange-600 border-orange-200">🔥 {dl}d left</Badge>}
          {dl !== null && !overdue && !urgent && project.status !== "Completed" && (
            <Badge cls="bg-slate-50 text-slate-500 border-slate-200">{dl}d left</Badge>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Progress</span>
            <span className="font-semibold text-slate-700">{pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${pct===100?"bg-emerald-500":pct>=60?"bg-blue-500":pct>=30?"bg-amber-400":"bg-rose-400"}`}
              style={{width:`${pct}%`}} />
          </div>
          {project.totalTasks > 0 && (
            <p className="text-xs text-slate-400 mt-1">{project.tasksCompleted||0}/{project.totalTasks} tasks done</p>
          )}
        </div>

        {/* Budget + dates */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 rounded-xl p-2.5">
            <p className="text-slate-400">Budget</p>
            <p className="font-bold text-emerald-600 mt-0.5">{money(project.budget)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5">
            <p className="text-slate-400">Timeline</p>
            <p className="font-medium text-slate-700 mt-0.5 text-[11px]">
              {fmt(project.startDate)} → {fmt(project.endDate)}
            </p>
          </div>
        </div>

        {/* Team + actions */}
        <div className="flex items-center justify-between pt-1 mt-auto">
          <div className="flex -space-x-2">
            {project.teamMembers?.slice(0,5).map((m,i) => (
              <div key={i} title={m.name}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                {initials(m.name)}
              </div>
            ))}
            {project.teamMembers?.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 text-[10px] font-bold">
                +{project.teamMembers.length - 5}
              </div>
            )}
            {(!project.teamMembers?.length) && <span className="text-xs text-slate-400">No team</span>}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={()=>onView(project)} title="Details"
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
            <button onClick={()=>onEdit(project)} title="Edit"
              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onClick={()=>onDelete(project._id)} title="Delete"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── PROJECT FORM ─────────────────────────────────────────────────────────────
const ProjectForm = memo(({ form, setForm, clients, employees, onSubmit, onCancel, isEdit }) => {
  const iCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors";
  const lbl  = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";
  const f    = (k) => ({ value:form[k]??"", onChange:e=>setForm(p=>({...p,[k]:e.target.value})), className:iCls });

  const toggleMember = useCallback((id) => {
    setForm(p=>({ ...p, teamMembers: p.teamMembers.includes(id)
      ? p.teamMembers.filter(x=>x!==id) : [...p.teamMembers, id] }));
  }, [setForm]);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={lbl}>Project Name *</label>
          <input type="text" required placeholder="e.g. CRM Redesign 2025" {...f("name")} />
        </div>
        <div>
          <label className={lbl}>Client *</label>
          <select required {...f("client")}>
            <option value="">Select client</option>
            {clients.map(c=><option key={c._id} value={c._id}>{c.name}{c.company?` · ${c.company}`:""}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Budget (₹) *</label>
          <input type="number" required min="0" placeholder="500000" {...f("budget")} />
        </div>
        <div>
          <label className={lbl}>Start Date *</label>
          <input type="date" required {...f("startDate")} />
        </div>
        <div>
          <label className={lbl}>End Date *</label>
          <input type="date" required min={form.startDate||undefined} {...f("endDate")} />
        </div>
        <div>
          <label className={lbl}>Status</label>
          <select {...f("status")}>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Priority</label>
          <select {...f("priority")}>
            {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={lbl}>Progress: {form.progress}%</label>
          <input type="range" min="0" max="100" value={form.progress}
            onChange={e=>setForm(p=>({...p,progress:+e.target.value}))}
            className="w-full accent-indigo-600" />
          <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
        </div>
        <div className="md:col-span-2">
          <label className={lbl}>Description</label>
          <textarea rows={3} placeholder="Project objectives and scope…" {...f("description")} className={`${iCls} resize-none`} />
        </div>
      </div>

      {/* Team Members */}
      <div>
        <label className={`${lbl} mb-2 flex items-center gap-1.5`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/></svg>
          Team Members
          {form.teamMembers.length > 0 && <span className="bg-indigo-600 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">{form.teamMembers.length}</span>}
        </label>
        <div className="border border-slate-200 rounded-2xl bg-slate-50/60 p-4 max-h-52 overflow-y-auto">
          {employees.length === 0
            ? <p className="text-center text-slate-400 text-sm py-4">No employees available</p>
            : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {employees.map(emp => {
                const checked = form.teamMembers.includes(emp._id);
                return (
                  <label key={emp._id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${checked?"border-indigo-400 bg-indigo-50":"border-slate-200 bg-white hover:border-indigo-300"}`}>
                    <input type="checkbox" checked={checked} onChange={()=>toggleMember(emp._id)}
                      className="w-4 h-4 accent-indigo-600 rounded shrink-0"/>
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold ${checked?"bg-gradient-to-br from-indigo-500 to-purple-600":"bg-slate-300"}`}>
                      {initials(emp.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{emp.name}</p>
                      <p className="text-xs text-slate-400 truncate">{emp.position||"Employee"}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          }
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
          Cancel
        </button>
        <button type="submit"
          className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          {isEdit ? "Update Project" : "Create Project"}
        </button>
      </div>
    </form>
  );
});

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
const ProjectDetailModal = memo(({ project, onClose, onEdit }) => {
  if (!project) return null;
  const sm  = STATUS_META[project.status]    || STATUS_META.Planning;
  const pm  = PRIORITY_META[project.priority] || PRIORITY_META.Medium;
  const pct = Math.min(100, Math.max(0, project.progress || 0));
  const dl  = daysLeft(project.endDate);

  return (
    <Modal title="Project Details" onClose={onClose} wide>
      <div className="space-y-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
            {project.client && (
              <p className="text-sm text-slate-500 mt-0.5">
                {project.client.name}{project.client.company ? ` · ${project.client.company}` : ""}
                {project.client.email ? ` · ${project.client.email}` : ""}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Badge cls={sm.cls} dot={sm.dot}>{project.status}</Badge>
            <Badge cls={pm.cls}>{project.priority}</Badge>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed border border-slate-100">
            {project.description}
          </div>
        )}

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Budget",     val: money(project.budget),            icon:"💰", cls:"text-emerald-600" },
            { label:"Start Date", val: fmt(project.startDate),           icon:"📅", cls:"text-blue-600" },
            { label:"End Date",   val: fmt(project.endDate),             icon:"🏁", cls:"text-orange-600" },
            { label:"Days Left",  val: dl===null?"N/A": dl<0? `${Math.abs(dl)}d overdue` : `${dl}d`,
              icon:dl<0?"⚠️":"⏱", cls: dl<0?"text-red-600":"text-slate-700" },
          ].map(({ label, val, icon, cls }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-center">
              <p className="text-lg mb-1">{icon}</p>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              <p className={`font-bold text-sm mt-0.5 ${cls}`}>{val}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
            <span>Overall Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct===100?"bg-emerald-500":pct>=60?"bg-blue-500":pct>=30?"bg-amber-400":"bg-rose-400"}`}
              style={{width:`${pct}%`}} />
          </div>
          {project.totalTasks > 0 && (
            <p className="text-xs text-slate-400 mt-2">{project.tasksCompleted||0} of {project.totalTasks} tasks completed</p>
          )}
        </div>

        {/* Team members */}
        {project.teamMembers?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Team ({project.teamMembers.length})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {project.teamMembers.map((m,i) => (
                <div key={i} className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {initials(m.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{m.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{m.position||"Team Member"}</p>
                    {m.email && <p className="text-[10px] text-slate-400 truncate">{m.email}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors">Close</button>
          <button onClick={()=>{ onClose(); onEdit(project); }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
            Edit Project
          </button>
        </div>
      </div>
    </Modal>
  );
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const ProjectManagement = () => {
  const [projects,  setProjects]  = useState([]);
  const [clients,   setClients]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null); // null|"add"|"edit"|"detail"
  const [selProject,setSelProject]= useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);

  // Filters
  const [search,     setSearch]     = useState("");
  const [statusF,    setStatusF]    = useState("all");
  const [priorityF,  setPriorityF]  = useState("all");
  const [sortBy,     setSortBy]     = useState("newest");
  const [viewMode,   setViewMode]   = useState("grid"); // grid|list

  const debouncedSearch = useDebounce(search);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem("adminToken")) window.location.href = "/admin";
  }, []);

  // ── Load all data in parallel ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, eRes] = await Promise.allSettled([
        api.get("/projects"),
        api.get("/clients"),
        api.get("/employee/get/employee"),
      ]);

      if (pRes.status === "fulfilled") {
        const d = pRes.value.data;
        setProjects(Array.isArray(d) ? d : Array.isArray(d?.projects) ? d.projects : Array.isArray(d?.data) ? d.data : []);
      } else {
        console.error("Projects failed:", pRes.reason?.response?.data || pRes.reason?.message);
        toast.error("Could not load projects");
      }

      if (cRes.status === "fulfilled") {
        const d = cRes.value.data;
        setClients(Array.isArray(d) ? d : Array.isArray(d?.clients) ? d.clients : Array.isArray(d?.data) ? d.data : []);
      } else {
        console.warn("Clients failed (non-fatal):", cRes.reason?.message);
        setClients([]);
      }

      if (eRes.status === "fulfilled") {
        const d = eRes.value.data;
        setEmployees(Array.isArray(d) ? d : Array.isArray(d?.employees) ? d.employees : Array.isArray(d?.data) ? d.data : []);
      } else {
        console.warn("Employees failed (non-fatal):", eRes.reason?.message);
        setEmployees([]);
      }
    } catch (err) {
      console.error("Unexpected loadData error:", err);
      toast.error("Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => projects.reduce((acc, p) => {
    acc.total++;
    if (p.status === "In Progress") acc.inProgress++;
    if (p.status === "Completed")   acc.completed++;
    if (p.status === "On Hold")     acc.onHold++;
    if (p.status === "Planning")    acc.planning++;
    acc.totalBudget += Number(p.budget||0);
    acc.avgProgress = acc.total > 0
      ? Math.round(projects.reduce((s,x)=>s+(x.progress||0),0)/projects.length) : 0;
    return acc;
  }, { total:0, inProgress:0, completed:0, onHold:0, planning:0, totalBudget:0, avgProgress:0 }), [projects]);

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = debouncedSearch.toLowerCase();
    return projects
      .filter(p =>
        (!s || p.name?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s) || p.client?.name?.toLowerCase().includes(s)) &&
        (statusF   === "all" || p.status   === statusF) &&
        (priorityF === "all" || p.priority === priorityF)
      )
      .sort((a, b) => {
        if (sortBy === "newest")   return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === "oldest")   return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === "name")     return a.name.localeCompare(b.name);
        if (sortBy === "budget")   return b.budget - a.budget;
        if (sortBy === "progress") return b.progress - a.progress;
        if (sortBy === "endDate")  return new Date(a.endDate) - new Date(b.endDate);
        if (sortBy === "priority") {
          const o = {Urgent:4,High:3,Medium:2,Low:1};
          return (o[b.priority]||0) - (o[a.priority]||0);
        }
        return 0;
      });
  }, [projects, debouncedSearch, statusF, priorityF, sortBy]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, budget: Number(form.budget), progress: Number(form.progress) };
      if (modal === "edit" && selProject) {
        const res = await api.put(`/projects/${selProject._id}`, payload);
        setProjects(prev => prev.map(p => p._id === res.data.project._id ? res.data.project : p));
        toast.success("Project updated!");
      } else {
        const res = await api.post("/projects", payload);
        setProjects(prev => [res.data.project, ...prev]);
        toast.success("Project created!");
      }
      setModal(null); setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  }, [form, modal, selProject]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
      toast.success("Project deleted");
    } catch { toast.error("Delete failed"); }
  }, []);

  const openEdit = useCallback((project) => {
    setSelProject(project);
    setForm({
      name:        project.name,
      description: project.description || "",
      client:      project.client?._id || "",
      startDate:   project.startDate?.slice(0,10) || "",
      endDate:     project.endDate?.slice(0,10) || "",
      budget:      project.budget,
      status:      project.status,
      priority:    project.priority || "Medium",
      teamMembers: project.teamMembers?.map(m=>m._id||m) || [],
      progress:    project.progress || 0,
    });
    setModal("edit");
  }, []);

  const openDetail = useCallback((project) => { setSelProject(project); setModal("detail"); }, []);

  const clearFilters = useCallback(() => {
    setSearch(""); setStatusF("all"); setPriorityF("all"); setSortBy("newest");
  }, []);

  const hasFilters = search || statusF !== "all" || priorityF !== "all" || sortBy !== "newest";

  const iCls = "px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.fade-up{animation:fadeUp .22s ease both}`}</style>
      <Toaster position="top-right" toastOptions={{style:{fontSize:"13px"}}}/>

      {/* Modals */}
      {(modal==="add"||modal==="edit") && (
        <Modal title={modal==="edit"?"Edit Project":"New Project"} onClose={()=>{setModal(null);setForm(EMPTY_FORM);}} extraWide>
          <ProjectForm form={form} setForm={setForm} clients={clients} employees={employees}
            onSubmit={handleSubmit} onCancel={()=>{setModal(null);setForm(EMPTY_FORM);}} isEdit={modal==="edit"}/>
        </Modal>
      )}
      {modal==="detail" && selProject && (
        <ProjectDetailModal project={selProject} onClose={()=>setModal(null)} onEdit={openEdit}/>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 p-5 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Projects</h1>
              <p className="text-sm text-slate-500 mt-0.5">{projects.length} projects · Avg progress {stats.avgProgress}%</p>
            </div>
            <div className="flex gap-2">
              <button onClick={loadData} disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60">
                <svg className={`w-4 h-4 ${loading?"animate-spin":""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Refresh
              </button>
              <button onClick={()=>{setForm(EMPTY_FORM);setModal("add");}}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                New Project
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {loading ? [...Array(6)].map((_,i)=><StatSkeleton key={i}/>) : (
              [
                { label:"Total",       val:stats.total,                 cls:"text-slate-800",   border:"border-slate-200",   icon:"📁" },
                { label:"In Progress", val:stats.inProgress,            cls:"text-blue-700",    border:"border-blue-200",    icon:"▶️" },
                { label:"Completed",   val:stats.completed,             cls:"text-emerald-700", border:"border-emerald-200", icon:"✅" },
                { label:"Planning",    val:stats.planning,              cls:"text-amber-700",   border:"border-amber-200",   icon:"📋" },
                { label:"On Hold",     val:stats.onHold,                cls:"text-purple-700",  border:"border-purple-200",  icon:"⏸️" },
                { label:"Total Budget",val:money(stats.totalBudget),    cls:"text-indigo-700",  border:"border-indigo-200",  icon:"💰" },
              ].map(s=>(
                <div key={s.label} className={`bg-white rounded-2xl p-4 shadow-sm border ${s.border} fade-up`}>
                  <div className="text-lg mb-1">{s.icon}</div>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                  <p className={`text-xl font-extrabold mt-0.5 ${s.cls}`}>{s.val}</p>
                </div>
              ))
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" placeholder="Search projects…" value={search} onChange={e=>setSearch(e.target.value)}
                  className={`${iCls} pl-8 w-full`} />
              </div>
              <select value={statusF} onChange={e=>setStatusF(e.target.value)} className={iCls}>
                <option value="all">All Status</option>
                {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select value={priorityF} onChange={e=>setPriorityF(e.target.value)} className={iCls}>
                <option value="all">All Priority</option>
                {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className={iCls}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A–Z</option>
                <option value="priority">Priority</option>
                <option value="progress">Progress</option>
                <option value="budget">Budget</option>
                <option value="endDate">End date</option>
              </select>
              {hasFilters && <button onClick={clearFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2">Clear</button>}
              {/* View toggle */}
              <div className="flex gap-1 border border-slate-200 rounded-xl p-0.5 ml-auto">
                {[{v:"grid",icon:"⊞"},{v:"list",icon:"≡"}].map(({v,icon})=>(
                  <button key={v} onClick={()=>setViewMode(v)}
                    className={`px-2.5 py-1.5 rounded-lg text-sm transition-colors ${viewMode===v?"bg-indigo-600 text-white":"text-slate-500 hover:text-slate-700"}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            {(statusF!=="all"||priorityF!=="all"||search) && (
              <p className="text-xs text-slate-400 mt-2">{filtered.length} of {projects.length} projects shown</p>
            )}
          </div>

          {/* Projects Grid / List */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_,i)=><CardSkeleton key={i}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>
              <p className="font-semibold text-slate-600">{projects.length===0?"No projects yet":"No projects match your filters"}</p>
              <p className="text-sm text-slate-400 mt-1">{projects.length===0?"Create your first project to get started":"Try adjusting filters or search"}</p>
              {projects.length===0&&<button onClick={()=>{setForm(EMPTY_FORM);setModal("add");}} className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium">Create First Project</button>}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(p => (
                <ProjectCard key={p._id} project={p} onEdit={openEdit} onDelete={handleDelete} onView={openDetail}/>
              ))}
            </div>
          ) : (
            /* List view */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-5 py-3 text-left">Project</th>
                    <th className="px-5 py-3 text-left">Client</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Priority</th>
                    <th className="px-5 py-3 text-left">Progress</th>
                    <th className="px-5 py-3 text-left">Budget</th>
                    <th className="px-5 py-3 text-left">End Date</th>
                    <th className="px-5 py-3 text-center">Team</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(p => {
                    const sm = STATUS_META[p.status]    || STATUS_META.Planning;
                    const pm = PRIORITY_META[p.priority] || PRIORITY_META.Medium;
                    const dl = daysLeft(p.endDate);
                    return (
                      <tr key={p._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-800 text-sm cursor-pointer hover:text-indigo-600" onClick={()=>openDetail(p)}>{p.name}</p>
                          {p.description && <p className="text-xs text-slate-400 truncate max-w-[200px]">{p.description}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{p.client?.name||"—"}</td>
                        <td className="px-5 py-3.5"><Badge cls={sm.cls} dot={sm.dot}>{p.status}</Badge></td>
                        <td className="px-5 py-3.5"><Badge cls={pm.cls}>{p.priority}</Badge></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-20">
                              <div className="bg-indigo-500 h-1.5 rounded-full" style={{width:`${p.progress||0}%`}} />
                            </div>
                            <span className="text-xs text-slate-600 font-medium w-8">{p.progress||0}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-medium text-emerald-600">{money(p.budget)}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {fmt(p.endDate)}
                          {dl!==null && dl<0 && <span className="block text-red-500 font-medium">Overdue {Math.abs(dl)}d</span>}
                          {dl!==null && dl>=0 && dl<=7 && <span className="block text-orange-500 font-medium">{dl}d left</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-center -space-x-1.5">
                            {p.teamMembers?.slice(0,3).map((m,i)=>(
                              <div key={i} title={m.name} className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white flex items-center justify-center text-white text-[9px] font-bold">
                                {initials(m.name)}
                              </div>
                            ))}
                            {p.teamMembers?.length>3 && <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] font-bold text-slate-600">+{p.teamMembers.length-3}</div>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={()=>openDetail(p)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>
                            <button onClick={()=>openEdit(p)} className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                            <button onClick={()=>handleDelete(p._id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="border-t border-slate-100 px-5 py-2.5 bg-slate-50 text-xs text-slate-400">
                {filtered.length} project{filtered.length!==1?"s":""}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default ProjectManagement;