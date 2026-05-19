import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo
} from "react";
import ReactDOM from "react-dom";
import {
  FileText, Search, Filter, Download, Eye, Trash2,
  Calendar, Flag, RefreshCw, Plus, Clock, MessageSquare,
  AlertCircle, CheckCircle, PlayCircle, PauseCircle, MoreVertical, X
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const API_URL  = "https://crm-backend-v2.onrender.com/api";
const BATCH_SZ = 4;

const PRIORITY_META = {
  low:    { cls: "bg-blue-50 text-blue-700 border-blue-200",      icon: <Flag className="w-3 h-3" /> },
  medium: { cls: "bg-amber-50 text-amber-700 border-amber-200",   icon: <Flag className="w-3 h-3" /> },
  high:   { cls: "bg-orange-50 text-orange-700 border-orange-200",icon: <Flag className="w-3 h-3" /> },
  urgent: { cls: "bg-red-50 text-red-700 border-red-200",          icon: <AlertCircle className="w-3 h-3" /> },
};
const STATUS_META = {
  pending:       { cls: "bg-gray-100 text-gray-700 border-gray-200",        icon: <Clock className="w-3 h-3" /> },
  "in progress": { cls: "bg-blue-50 text-blue-700 border-blue-200",         icon: <PlayCircle className="w-3 h-3" /> },
  completed:     { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle className="w-3 h-3" /> },
  "on hold":     { cls: "bg-purple-50 text-purple-700 border-purple-200",    icon: <PauseCircle className="w-3 h-3" /> },
};
const TYPE_META = {
  Daily:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  Weekly:  "bg-pink-50 text-pink-700 border-pink-200",
  Monthly: "bg-teal-50 text-teal-700 border-teal-200",
  Project: "bg-amber-50 text-amber-700 border-amber-200",
};
const EMPTY_TASK = {
  title:"", description:"", type:"Daily", priority:"medium",
  progress:0, employeeId:"", dueDate:"", notes:"",
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "N/A";
  try { const dt=new Date(d); return isNaN(dt)?"N/A":dt.toLocaleDateString("en-IN",{year:"numeric",month:"short",day:"numeric"}); }
  catch { return "N/A"; }
};
const fmtDateTime = (d) => {
  if (!d) return "N/A";
  try { const dt=new Date(d); return isNaN(dt)?"N/A":dt.toLocaleString("en-IN",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }
  catch { return "N/A"; }
};
const toDateStr = (d) => {
  if (!d) return "";
  try { const dt=new Date(d); return isNaN(dt)?"":dt.toISOString().slice(0,10); }
  catch { return ""; }
};

function useDebounce(val, ms=280) {
  const [dv,setDv]=useState(val);
  useEffect(()=>{ const t=setTimeout(()=>setDv(val),ms); return ()=>clearTimeout(t); },[val,ms]);
  return dv;
}

const enrichTask=(task,emp)=>({
  ...task,
  employeeId:{_id:emp._id,name:emp.name,email:emp.email,position:emp.position,department:emp.department},
  lastUpdated:task.lastUpdated||task.updatedAt,
  dueDate:    task.dueDate    ||task.due,
  completedAt:task.completedAt||task.completedDate,
  createdAt:  task.createdAt  ||task.createdDate,
});

// ─── API ──────────────────────────────────────────────────────────────────────
async function getEmployees() {
  const res=await fetch(`${API_URL}/employee/get/employee`);
  if(!res.ok) throw new Error(`Employees ${res.status}`);
  const d=await res.json();
  return Array.isArray(d)?d:d.employees||d.data||[];
}
async function getTasksForEmployee(empId) {
  try {
    const res=await fetch(`${API_URL}/employee/${empId}/tasks`);
    if(!res.ok) return [];
    const d=await res.json();
    if(d.success&&d.employee?.tasks) return d.employee.tasks;
    return Array.isArray(d)?d:d.tasks||[];
  } catch { return []; }
}

// ─── SKELETONS ────────────────────────────────────────────────────────────────
const Pulse=({className=""})=><div className={`rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse ${className}`}/>;
const StatSkeleton=()=>(
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-2">
    <Pulse className="h-7 w-10"/><Pulse className="h-3 w-20"/>
  </div>
);
const RowSkeleton=()=>(
  <tr className="border-b border-gray-50">
    <td className="px-5 py-4"><Pulse className="h-3.5 w-48 mb-2"/><Pulse className="h-2.5 w-64 mb-2"/><Pulse className="h-5 w-16 rounded-full"/></td>
    <td className="px-5 py-4"><div className="flex items-center gap-3"><Pulse className="w-8 h-8 rounded-full"/><div className="space-y-1.5"><Pulse className="h-3 w-28"/><Pulse className="h-2.5 w-36"/></div></div></td>
    <td className="px-5 py-4"><Pulse className="h-5 w-20 rounded-full mb-2"/><Pulse className="h-5 w-16 rounded-full"/></td>
    <td className="px-5 py-4"><Pulse className="h-2.5 w-24 rounded-full"/></td>
    <td className="px-5 py-4"><Pulse className="h-3 w-20 mb-1.5"/><Pulse className="h-3 w-24"/></td>
    <td className="px-5 py-4"><Pulse className="h-7 w-7 rounded mx-auto"/></td>
  </tr>
);

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const Badge=memo(({cls="",children})=>(
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{children}</span>
));

const Modal=memo(({children,onClose,title,wide=false})=>(
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto ${wide?"max-w-2xl":"max-w-md"}`}>
      <div className="sticky top-0 bg-white px-6 pt-5 pb-3 border-b border-gray-100 flex justify-between items-center rounded-t-2xl z-10">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4"/></button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
));

// ─── PORTAL DROPDOWN ─────────────────────────────────────────────────────────
// Renders into document.body → never clipped by table's overflow:hidden
const DropdownPortal=({anchorRef,isOpen,onClose,children})=>{
  const [pos,setPos]=useState({top:0,left:0});

  useEffect(()=>{
    if(!isOpen||!anchorRef.current) return;
    const r=anchorRef.current.getBoundingClientRect();
    setPos({ top:r.bottom+window.scrollY+4, left:Math.max(8,r.right+window.scrollX-176) });
  },[isOpen,anchorRef]);

  useEffect(()=>{
    if(!isOpen) return;
    const h=(e)=>{ if(anchorRef.current&&!anchorRef.current.contains(e.target)) onClose(); };
    const id=setTimeout(()=>document.addEventListener("mousedown",h),0);
    return ()=>{ clearTimeout(id); document.removeEventListener("mousedown",h); };
  },[isOpen,onClose,anchorRef]);

  if(!isOpen) return null;
  return ReactDOM.createPortal(
    <div style={{position:"absolute",top:pos.top,left:pos.left,zIndex:9999}}
      className="w-44 bg-white border border-gray-100 rounded-xl shadow-2xl py-1 text-sm"
      onMouseDown={e=>e.stopPropagation()}>
      {children}
    </div>,
    document.body
  );
};

// ─── TASK ROW ─────────────────────────────────────────────────────────────────
const TaskRow=memo(({task,activeDropdown,setActiveDropdown,onView,onComplete,onDelete})=>{
  const emp    =typeof task.employeeId==="object"?task.employeeId:null;
  const stMeta =STATUS_META[task.status?.toLowerCase()]||STATUS_META.pending;
  const prMeta =PRIORITY_META[task.priority]||PRIORITY_META.medium;
  const pct    =task.progress||0;
  const btnRef =useRef(null);
  const isOpen =activeDropdown===task._id;

  const toggle=useCallback((e)=>{ e.stopPropagation(); setActiveDropdown(id=>id===task._id?null:task._id); },[task._id,setActiveDropdown]);
  const close =useCallback(()=>setActiveDropdown(null),[setActiveDropdown]);

  return (
    <tr className="hover:bg-gray-50 transition-colors row-enter">
      {/* Task */}
      <td className="px-5 py-3.5 max-w-xs">
        <p className="font-medium text-sm text-gray-900 truncate">{task.title}</p>
        {task.description&&<p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>}
        <div className="flex items-center gap-1.5 mt-1.5">
          <Badge cls={TYPE_META[task.type]||"bg-gray-100 text-gray-600 border-gray-200"}>{task.type}</Badge>
          {task.notes&&<MessageSquare className="w-3 h-3 text-gray-300" title="Has notes"/>}
        </div>
      </td>
      {/* Employee */}
      <td className="px-5 py-3.5">
        {emp?(
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {emp.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
              <p className="text-xs text-gray-400 truncate">{emp.department} · {emp.position}</p>
            </div>
          </div>
        ):<span className="text-xs text-gray-400 italic">Unassigned</span>}
      </td>
      {/* Status / Priority */}
      <td className="px-5 py-3.5">
        <div className="space-y-1.5">
          <div><Badge cls={stMeta.cls}>{stMeta.icon}{task.status||"Pending"}</Badge></div>
          <div><Badge cls={prMeta.cls}>{prMeta.icon}{task.priority?task.priority[0].toUpperCase()+task.priority.slice(1):"Medium"}</Badge></div>
        </div>
      </td>
      {/* Progress */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{width:`${pct}%`}}/>
          </div>
          <span className="text-xs font-medium text-gray-600 w-8 text-right">{pct}%</span>
        </div>
        {task.completedAt&&<p className="text-xs text-gray-400 mt-1">Done {fmtDate(task.completedAt)}</p>}
      </td>
      {/* Dates */}
      <td className="px-5 py-3.5 text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-1"><Calendar className="w-3 h-3 shrink-0"/>Due: {fmtDate(task.dueDate)}</div>
        <div>Created: {fmtDate(task.createdAt)}</div>
      </td>
      {/* Actions */}
      <td className="px-5 py-3.5 text-center">
        <button ref={btnRef} onClick={toggle}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4"/>
        </button>
        <DropdownPortal anchorRef={btnRef} isOpen={isOpen} onClose={close}>
          <button onClick={()=>{onView();close();}} className="flex items-center gap-2 px-3 py-2 w-full text-left text-gray-700 hover:bg-gray-50">
            <Eye className="w-3.5 h-3.5"/> View Details
          </button>
          <button onClick={()=>{onComplete();close();}} className="flex items-center gap-2 px-3 py-2 w-full text-left text-emerald-600 hover:bg-emerald-50">
            <CheckCircle className="w-3.5 h-3.5"/> Mark Complete
          </button>
          <div className="h-px bg-gray-100 my-1 mx-2"/>
          <button onClick={()=>{onDelete();close();}} className="flex items-center gap-2 px-3 py-2 w-full text-left text-red-500 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5"/> Delete
          </button>
        </DropdownPortal>
      </td>
    </tr>
  );
});

// ─── TASK DETAIL CONTENT ──────────────────────────────────────────────────────
const TaskDetailContent=memo(({task})=>{
  const emp    =typeof task.employeeId==="object"?task.employeeId:null;
  const stMeta =STATUS_META[task.status?.toLowerCase()]||STATUS_META.pending;
  const prMeta =PRIORITY_META[task.priority]||PRIORITY_META.medium;
  const pct    =task.progress||0;
  return (
    <div className="space-y-5 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-xs text-gray-400 mb-1">Title</p><p className="font-medium text-gray-800">{task.title}</p></div>
        <div><p className="text-xs text-gray-400 mb-1">Status</p><Badge cls={stMeta.cls}>{stMeta.icon}{task.status||"Pending"}</Badge></div>
      </div>
      {task.description&&<div><p className="text-xs text-gray-400 mb-1">Description</p><p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-xs leading-relaxed">{task.description}</p></div>}
      {emp&&(
        <div><p className="text-xs text-gray-400 mb-2">Assigned To</p>
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
              {emp.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-800">{emp.name}</p>
              <p className="text-xs text-gray-500">{emp.email}</p>
              <p className="text-xs text-gray-400">{emp.position} · {emp.department}</p>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-xs text-gray-400 mb-1">Type</p><Badge cls={TYPE_META[task.type]||"bg-gray-100 text-gray-600 border-gray-200"}>{task.type}</Badge></div>
        <div><p className="text-xs text-gray-400 mb-1">Priority</p><Badge cls={prMeta.cls}>{prMeta.icon}{task.priority?task.priority[0].toUpperCase()+task.priority.slice(1):"Medium"}</Badge></div>
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-1">Progress — {pct}%</p>
        <div className="bg-gray-100 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{width:`${pct}%`}}/></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[["Due Date",fmtDate(task.dueDate)],["Created",fmtDateTime(task.createdAt)],["Last Updated",fmtDateTime(task.lastUpdated)],["Completed",fmtDateTime(task.completedAt)]].map(([l,v])=>(
          <div key={l}><p className="text-xs text-gray-400 mb-1">{l}</p><p className="text-gray-700">{v}</p></div>
        ))}
      </div>
      {task.notes&&<div><p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/>Notes</p><p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap">{task.notes}</p></div>}
      <div><p className="text-xs text-gray-400 mb-1">Task ID</p><p className="font-mono text-xs text-gray-500">{task._id}</p></div>
    </div>
  );
});

// ─── ADD TASK FORM ────────────────────────────────────────────────────────────
const AddTaskForm=memo(({task,setTask,employees,onSubmit,onCancel,iCls})=>{
  const f=(key)=>({value:task[key]??"",onChange:e=>setTask(p=>({...p,[key]:e.target.value})),className:iCls});
  return (
    <div className="space-y-3">
      <input type="text" placeholder="Task Title *" {...f("title")}/>
      <textarea placeholder="Description" rows={3} {...f("description")} className={`${iCls} resize-none`}/>
      <select {...f("employeeId")}>
        <option value="">Select Employee *</option>
        {employees.map(e=><option key={e._id} value={e._id}>{e.name} · {e.department}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <select {...f("type")}>{["Daily","Weekly","Monthly","Project"].map(t=><option key={t} value={t}>{t}</option>)}</select>
        <select {...f("priority")}>{["low","medium","high","urgent"].map(p=><option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)}</option>)}</select>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
        <input type="date" {...f("dueDate")}/>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Progress: {task.progress}%</label>
        <input type="range" min="0" max="100" value={task.progress} onChange={e=>setTask(p=>({...p,progress:+e.target.value}))} className="w-full accent-violet-500"/>
      </div>
      <textarea placeholder="Notes (optional)" rows={2} {...f("notes")} className={`${iCls} resize-none`}/>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="button" onClick={onSubmit} className="px-5 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg">Add Task</button>
      </div>
    </div>
  );
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const TaskAdmin=()=>{
  const [employees,      setEmployees]     =useState([]);
  const [tasks,          setTasks]         =useState([]);
  const [loadingPhase,   setLoadingPhase]  =useState("idle");
  const [batchProgress,  setBatchProgress] =useState({done:0,total:0});
  const [error,          setError]         =useState(null);
  const [selectedTask,   setSelectedTask]  =useState(null);
  const [showAddTask,    setShowAddTask]   =useState(false);
  const [activeDropdown, setActiveDropdown]=useState(null);
  const [newTask,        setNewTask]       =useState(EMPTY_TASK);
  const [filters,setFilters]=useState({
    search:"", employee:"", status:"", priority:"", type:"",
    dueDateFrom:"", dueDateTo:"",
  });

  const abortRef        =useRef(null);
  const debouncedSearch =useDebounce(filters.search);

  // Fetch all
  const fetchAll=useCallback(async()=>{
    if(abortRef.current) abortRef.current.abort();
    abortRef.current=new AbortController();
    const signal=abortRef.current.signal;
    setError(null); setTasks([]); setLoadingPhase("employees"); setBatchProgress({done:0,total:0});

    let emps=[];
    try { emps=await getEmployees(); if(signal.aborted)return; setEmployees(emps); }
    catch(err){ if(!signal.aborted){setError(err.message);setLoadingPhase("idle");} return; }
    if(!emps.length){setLoadingPhase("done");return;}

    setLoadingPhase("tasks"); setBatchProgress({done:0,total:emps.length});
    for(let i=0;i<emps.length;i+=BATCH_SZ){
      if(signal.aborted)break;
      await Promise.allSettled(emps.slice(i,i+BATCH_SZ).map(async emp=>{
        const raw=await getTasksForEmployee(emp._id);
        if(signal.aborted)return;
        setTasks(prev=>[...prev,...raw.map(t=>enrichTask(t,emp))]);
        setBatchProgress(p=>({...p,done:p.done+1}));
      }));
      if(i+BATCH_SZ<emps.length) await new Promise(r=>setTimeout(r,100));
    }
    if(!signal.aborted)setLoadingPhase("done");
  },[]);

  useEffect(()=>{fetchAll();return()=>abortRef.current?.abort();},[fetchAll]);

  // Filtered tasks
  const filteredTasks=useMemo(()=>{
    const s=debouncedSearch.toLowerCase();
    return tasks.filter(t=>{
      const emp=typeof t.employeeId==="object"?t.employeeId:null;
      const td=toDateStr(t.dueDate);
      if(filters.dueDateFrom&&(!td||td<filters.dueDateFrom)) return false;
      if(filters.dueDateTo  &&(!td||td>filters.dueDateTo))   return false;
      return (
        (!s||t.title?.toLowerCase().includes(s)||t.description?.toLowerCase().includes(s)||emp?.name?.toLowerCase().includes(s))&&
        (!filters.employee||emp?._id===filters.employee)&&
        (!filters.status  ||t.status?.toLowerCase()===filters.status)&&
        (!filters.priority||t.priority===filters.priority)&&
        (!filters.type    ||t.type===filters.type)
      );
    });
  },[tasks,debouncedSearch,filters]);

  // Stats
  const stats=useMemo(()=>({
    total:tasks.length,
    completed:tasks.filter(t=>t.status?.toLowerCase()==="completed").length,
    inProgress:tasks.filter(t=>t.status?.toLowerCase()==="in progress").length,
    pending:tasks.filter(t=>t.status?.toLowerCase()==="pending").length,
    onHold:tasks.filter(t=>t.status?.toLowerCase()==="on hold").length,
    urgent:tasks.filter(t=>t.priority==="urgent").length,
    high:tasks.filter(t=>t.priority==="high").length,
  }),[tasks]);

  const handleAddTask=useCallback(async()=>{
    if(!newTask.title.trim()) return toast.error("Title is required");
    if(!newTask.employeeId)   return toast.error("Select an employee");
    try {
      const res=await fetch(`${API_URL}/employee/task`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(newTask)});
      const data=await res.json();
      if(!res.ok) throw new Error(data.message||"Failed to add task");
      const emp=employees.find(e=>e._id===newTask.employeeId);
      setTasks(prev=>[enrichTask({...data.task,createdAt:new Date().toISOString()},emp||{_id:newTask.employeeId,name:"Unknown"}),...prev]);
      setNewTask(EMPTY_TASK); setShowAddTask(false); toast.success("Task added!");
    } catch(err){toast.error(err.message);}
  },[newTask,employees]);

  const handleUpdateTask=useCallback(async(taskId,updates)=>{
    try {
      const res=await fetch(`${API_URL}/employee/task/${taskId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(updates)});
      if(!res.ok) throw new Error("Update failed");
      setTasks(prev=>prev.map(t=>t._id===taskId?{...t,...updates,lastUpdated:new Date().toISOString()}:t));
      toast.success("Task updated!");
    } catch(err){toast.error(err.message);}
  },[]);

  const handleDeleteTask=useCallback(async(taskId)=>{
    if(!window.confirm("Delete this task?")) return;
    try {
      const res=await fetch(`${API_URL}/employee/task/${taskId}`,{method:"DELETE"});
      if(!res.ok) throw new Error("Delete failed");
      setTasks(prev=>prev.filter(t=>t._id!==taskId)); toast.success("Task deleted!");
    } catch(err){toast.error(err.message);}
  },[]);

  const exportCSV=useCallback(()=>{
    if(!filteredTasks.length) return toast.error("No tasks to export");
    const rows=filteredTasks.map(t=>{
      const e=typeof t.employeeId==="object"?t.employeeId:{};
      return [t._id,t.title,t.description,e.name,e.email,e.department,e.position,t.status,t.priority,t.type,`${t.progress||0}%`,fmtDate(t.dueDate),fmtDate(t.createdAt),fmtDate(t.lastUpdated),t.notes]
        .map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",");
    });
    const csv=["ID,Title,Description,Employee,Email,Dept,Position,Status,Priority,Type,Progress,Due,Created,Updated,Notes",...rows].join("\n");
    const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),download:`tasks-${new Date().toISOString().slice(0,10)}.csv`});
    a.click(); URL.revokeObjectURL(a.href); toast.success("Exported!");
  },[filteredTasks]);

  const clearFilters=useCallback(()=>setFilters({search:"",employee:"",status:"",priority:"",type:"",dueDateFrom:"",dueDateTo:""}),[]);

  const hasFilters=Object.values(filters).some(Boolean);
  const isLoading =loadingPhase==="employees"||loadingPhase==="tasks";
  const iCls      ="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 placeholder-gray-400";

  return (
    <>
      <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.row-enter{animation:fadeSlideIn .2s ease both}`}</style>
      <Toaster position="top-right" toastOptions={{style:{fontSize:"13px"}}}/>

      {selectedTask&&<Modal title="Task Details" onClose={()=>setSelectedTask(null)} wide><TaskDetailContent task={selectedTask}/></Modal>}
      {showAddTask  &&<Modal title="Add New Task" onClose={()=>setShowAddTask(false)}><AddTaskForm task={newTask} setTask={setNewTask} employees={employees} onSubmit={handleAddTask} onCancel={()=>setShowAddTask(false)} iCls={iCls}/></Modal>}

      <div className="min-h-screen bg-slate-50 p-5 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileText className="w-6 h-6 text-violet-600"/>Task Administration</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {loadingPhase==="employees"&&"Fetching employees…"}
                {loadingPhase==="tasks"&&`Loading tasks — ${batchProgress.done}/${batchProgress.total} employees`}
                {loadingPhase==="done"&&`${tasks.length} tasks · ${employees.length} employees`}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={()=>setShowAddTask(true)} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg"><Plus className="w-4 h-4"/>Add Task</button>
              <button onClick={fetchAll} disabled={isLoading} className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm px-4 py-2 rounded-lg disabled:opacity-60"><RefreshCw className={`w-4 h-4 ${isLoading?"animate-spin":""}`}/>Refresh</button>
              <button onClick={exportCSV} disabled={!filteredTasks.length} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"><Download className="w-4 h-4"/>Export</button>
            </div>
          </div>

          {/* Batch progress */}
          {loadingPhase==="tasks"&&batchProgress.total>0&&(
            <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex items-center gap-4">
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-violet-500 h-2 rounded-full transition-all duration-300" style={{width:`${Math.round((batchProgress.done/batchProgress.total)*100)}%`}}/>
              </div>
              <span className="text-xs text-gray-500 shrink-0">{batchProgress.done}/{batchProgress.total}</span>
            </div>
          )}

          {/* Error */}
          {error&&(
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-start">
              <div><p className="text-red-800 font-medium text-sm">Failed to load</p><p className="text-red-600 text-xs mt-0.5">{error}</p></div>
              <button onClick={()=>setError(null)}><X className="w-4 h-4 text-red-400"/></button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {isLoading&&tasks.length===0?[...Array(7)].map((_,i)=><StatSkeleton key={i}/>):(
              [{label:"Total",val:stats.total,color:"text-violet-600"},{label:"Completed",val:stats.completed,color:"text-emerald-600"},
               {label:"In Progress",val:stats.inProgress,color:"text-blue-600"},{label:"Pending",val:stats.pending,color:"text-amber-600"},
               {label:"On Hold",val:stats.onHold,color:"text-purple-600"},{label:"Urgent",val:stats.urgent,color:"text-red-600"},
               {label:"High",val:stats.high,color:"text-orange-600"}]
              .map(s=>(
                <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))
            )}
          </div>

          {/* ── FILTERS ────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Filter className="w-4 h-4 text-gray-400"/>Filters</span>
              {hasFilters&&<button onClick={clearFilters} className="text-xs text-violet-600 hover:text-violet-800 font-medium">Clear all</button>}
            </div>

            {/* Row 1: keyword + dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400"/>
                <input type="text" placeholder="Search…" value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} className={`${iCls} pl-8`}/>
              </div>
              <select value={filters.employee} onChange={e=>setFilters(f=>({...f,employee:e.target.value}))} className={iCls}>
                <option value="">All Employees</option>
                {employees.map(e=><option key={e._id} value={e._id}>{e.name} · {e.department}</option>)}
              </select>
              <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))} className={iCls}>
                <option value="">All Status</option>
                {["pending","in progress","completed","on hold"].map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}
              </select>
              <select value={filters.priority} onChange={e=>setFilters(f=>({...f,priority:e.target.value}))} className={iCls}>
                <option value="">All Priority</option>
                {["low","medium","high","urgent"].map(p=><option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)}</option>)}
              </select>
              <select value={filters.type} onChange={e=>setFilters(f=>({...f,type:e.target.value}))} className={iCls}>
                <option value="">All Types</option>
                {["Daily","Weekly","Monthly","Project"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Row 2: Due Date range */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-50">
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400"/>Due Date Range
              </span>
              <div className="flex items-center gap-2">
                {/* From */}
                <div className="relative">
                  <input type="date" value={filters.dueDateFrom}
                    onChange={e=>setFilters(f=>({...f,dueDateFrom:e.target.value}))}
                    className="px-3 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-700"/>
                  {filters.dueDateFrom&&(
                    <button onClick={()=>setFilters(f=>({...f,dueDateFrom:""}))} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-3 h-3"/>
                    </button>
                  )}
                </div>
                <span className="text-xs text-gray-400 font-medium">—</span>
                {/* To */}
                <div className="relative">
                  <input type="date" value={filters.dueDateTo} min={filters.dueDateFrom||undefined}
                    onChange={e=>setFilters(f=>({...f,dueDateTo:e.target.value}))}
                    className="px-3 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-700"/>
                  {filters.dueDateTo&&(
                    <button onClick={()=>setFilters(f=>({...f,dueDateTo:""}))} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-3 h-3"/>
                    </button>
                  )}
                </div>
              </div>
              {(filters.dueDateFrom||filters.dueDateTo)&&(
                <span className="text-xs bg-violet-50 text-violet-600 border border-violet-200 px-2 py-0.5 rounded-full font-medium">
                  {filteredTasks.length} task{filteredTasks.length!==1?"s":""} in range
                </span>
              )}
            </div>
          </div>

          {/* ── TABLE ──────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">Task</th>
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-left">Status / Priority</th>
                    <th className="px-5 py-3 text-left">Progress</th>
                    <th className="px-5 py-3 text-left">Dates</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingPhase==="employees"||(loadingPhase==="tasks"&&tasks.length===0)
                    ?[...Array(6)].map((_,i)=><RowSkeleton key={i}/>)
                    :filteredTasks.length===0
                    ?(
                      <tr><td colSpan={6} className="py-16 text-center text-gray-400">
                        <FileText className="w-10 h-10 mx-auto mb-3 opacity-30"/>
                        <p className="font-medium text-sm">No tasks found</p>
                        <p className="text-xs mt-1">{hasFilters?"Try adjusting your filters":loadingPhase==="tasks"?"Still loading…":"Create your first task"}</p>
                      </td></tr>
                    )
                    :filteredTasks.map(task=>(
                      <TaskRow key={task._id} task={task}
                        activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown}
                        onView={()=>setSelectedTask(task)}
                        onComplete={()=>handleUpdateTask(task._id,{status:"completed",progress:100})}
                        onDelete={()=>handleDeleteTask(task._id)}
                      />
                    ))
                  }
                </tbody>
              </table>
            </div>

            {loadingPhase==="tasks"&&tasks.length>0&&(
              <div className="border-t border-gray-100 px-5 py-2.5 bg-gray-50 flex items-center gap-3 text-xs text-gray-500">
                <RefreshCw className="w-3 h-3 animate-spin text-violet-500 shrink-0"/>
                Loading more… {batchProgress.done}/{batchProgress.total} employees · {tasks.length} tasks so far
              </div>
            )}
            {loadingPhase==="done"&&filteredTasks.length>0&&(
              <div className="border-t border-gray-100 px-5 py-2.5 bg-gray-50 text-xs text-gray-500">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskAdmin;