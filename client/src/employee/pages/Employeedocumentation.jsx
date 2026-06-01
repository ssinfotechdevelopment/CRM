// client/src/employee/pages/EmployeeDocumentation.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload, FileText, Users, Plus, Trash2, Eye, X, CheckCircle,
  Clock, XCircle, Search, RefreshCw, AlertCircle,
  Download, BookOpen, Tag, User, GitBranch, UserCheck, Percent,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const BASE = "https://crm-backend-v2.onrender.com/api";

const STATUS_BADGE = {
  Pending:  { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
  Approved: { bg: "bg-green-100",  text: "text-green-700",  icon: CheckCircle },
  Rejected: { bg: "bg-red-100",    text: "text-red-700",    icon: XCircle },
};

const CATEGORIES = ["Research", "Technical", "Policy", "Training", "Report", "Other"];

const DEPT = { 1: "Sales", 2: "Marketing", 3: "Development" };

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("employeeToken")}`,
});

const fileIcon = (mime) => {
  if (!mime) return "📄";
  if (mime.includes("pdf")) return "📕";
  if (mime.includes("word")) return "📘";
  if (mime.includes("sheet") || mime.includes("excel")) return "📗";
  if (mime.includes("presentation")) return "📙";
  if (mime.includes("image")) return "🖼️";
  return "📄";
};

/* ══════════════════════════════════════════════════════════
   GITHUB-STYLE COLLABORATOR SEARCH PICKER
══════════════════════════════════════════════════════════ */
function CollaboratorPicker({ contributors, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setShowDropdown(false); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${BASE}/documentation/collaborators/search?q=${encodeURIComponent(query)}`,
          { headers: authHeader() }
        );
        const data = await res.json();
        if (data.success) {
          // Filter out already-added contributors
          const addedIds = new Set(contributors.map((c) => c.employee));
          setResults((data.data || []).filter((e) => !addedIds.has(e._id)));
          setShowDropdown(true);
        }
      } catch { /* silent */ }
      finally { setSearching(false); }
    }, 300);
  }, [query, contributors]);

  const addCollaborator = (emp) => {
    onChange([
      ...contributors,
      {
        employee: emp._id,
        name: emp.name,
        email: emp.email,
        position: emp.position,
        department: emp.department,
        contributionNote: "",
        contributionPercentage: 0,
      },
    ]);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  const removeCollaborator = (id) => {
    onChange(contributors.filter((c) => c.employee !== id));
  };

  const updateContributor = (id, field, value) => {
    onChange(contributors.map((c) => c.employee === id ? { ...c, [field]: value } : c));
  };

  const totalPct = contributors.reduce((s, c) => s + Number(c.contributionPercentage || 0), 0);

  return (
    <div className="space-y-3">
      {/* Search box */}
      <div ref={wrapperRef} className="relative">
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-teal-500 bg-white">
          <GitBranch className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search employee by name, email or position…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent"
          />
          {searching && <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
        </div>

        {/* Dropdown results */}
        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {results.map((emp) => (
              <button
                key={emp._id}
                onClick={() => addCollaborator(emp)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50 transition-colors text-left"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-teal-700">
                    {emp.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                  <p className="text-xs text-gray-400 truncate">{emp.email} · {emp.position}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                  {DEPT[emp.department] || "Other"}
                </span>
                <Plus className="w-4 h-4 text-teal-500 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {showDropdown && results.length === 0 && !searching && query.trim() && (
          <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
            No employees found for "{query}"
          </div>
        )}
      </div>

      {/* Added collaborators list */}
      {contributors.length === 0 ? (
        <p className="text-xs text-gray-400 italic">
          No collaborators added — you are the sole author.
        </p>
      ) : (
        <div className="space-y-2">
          {contributors.map((c) => (
            <div key={c.employee} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              {/* Collaborator header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-teal-700">
                      {c.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 leading-none">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.email} · {c.position}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeCollaborator(c.employee)}
                  className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                  title="Remove collaborator"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contribution % + Note */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <div className="sm:col-span-1">
                  <label className="text-xs text-gray-500 mb-0.5 block">Contribution %</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={c.contributionPercentage}
                      onChange={(e) => updateContributor(c.employee, "contributionPercentage", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs outline-none bg-white"
                    />
                    <span className="px-1.5 bg-gray-100 text-gray-500 text-xs border-l border-gray-300">%</span>
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label className="text-xs text-gray-500 mb-0.5 block">Contribution Note</label>
                  <input
                    type="text"
                    placeholder="What did this person contribute?"
                    value={c.contributionNote}
                    onChange={(e) => updateContributor(c.employee, "contributionNote", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Total % bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  totalPct > 100 ? "bg-red-500" : totalPct === 100 ? "bg-green-500" : "bg-teal-500"
                }`}
                style={{ width: `${Math.min(totalPct, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-semibold ${totalPct > 100 ? "text-red-600" : "text-gray-600"}`}>
              {totalPct}%
            </span>
            {totalPct > 100 && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Exceeds 100%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function EmployeeDocumentation() {
  const [tab, setTab] = useState("my");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = tab === "my" ? "/documentation/my" : "/documentation/contributed";
      const res = await fetch(`${BASE}${endpoint}`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setDocs(data.data || []);
      else toast.error("Failed to load documents");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const filteredDocs = docs.filter((d) =>
    d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.uploaderName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    try {
      const res = await fetch(`${BASE}/documentation/${id}`, {
        method: "DELETE", headers: authHeader(),
      });
      const data = await res.json();
      if (data.success) { toast.success("Deleted"); fetchDocs(); }
      else toast.error(data.message);
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600" /> My Documentation
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload research docs & add collaborators — like GitHub
          </p>
        </div>
        <button
          onClick={() => { setEditDoc(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-200 rounded-lg p-1 w-fit mb-5">
        {[{ key: "my", label: "My Uploads" }, { key: "contributed", label: "Contributed To" }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === t.key ? "bg-white text-teal-700 shadow" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search title, category…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button onClick={fetchDocs} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No documents found</p>
          <p className="text-sm mt-1">
            {tab === "my" ? "Upload your first document using the button above." : "You haven't been added as a collaborator yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <DocCard
              key={doc._id}
              doc={doc}
              isOwner={tab === "my"}
              onView={() => setViewDoc(doc)}
              onEdit={() => { setEditDoc(doc); setShowForm(true); }}
              onDelete={() => handleDelete(doc._id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <UploadModal
          editDoc={editDoc}
          onClose={() => { setShowForm(false); setEditDoc(null); }}
          onSuccess={() => { setShowForm(false); setEditDoc(null); fetchDocs(); }}
        />
      )}

      {viewDoc && <DetailModal doc={viewDoc} onClose={() => setViewDoc(null)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DOC CARD
══════════════════════════════════════════════════════════ */
function DocCard({ doc, isOwner, onView, onEdit, onDelete }) {
  const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.Pending;
  const Icon = badge.icon;
  const collabCount = doc.contributors?.length || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2">
          <span className="text-2xl">{fileIcon(doc.fileType)}</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{doc.title}</h3>
            <span className="text-xs text-gray-400">{doc.category}</span>
          </div>
        </div>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text} whitespace-nowrap`}>
          <Icon className="w-3 h-3" /> {doc.status}
        </span>
      </div>

      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{doc.description}</p>

      {/* Collaborators pill — GitHub style */}
      {collabCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex -space-x-2">
            {doc.contributors.slice(0, 3).map((c, i) => (
              <div
                key={i}
                title={c.name}
                className="w-6 h-6 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center"
              >
                <span className="text-[9px] font-bold text-white">
                  {c.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
            {collabCount > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                <span className="text-[9px] text-gray-600 font-bold">+{collabCount - 3}</span>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {collabCount} collaborator{collabCount > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Tags */}
      {doc.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {doc.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="bg-teal-50 text-teal-600 text-xs px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}

      {/* Rejection reason */}
      {doc.status === "Rejected" && doc.rejectionReason && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-2 mb-3">
          <p className="text-xs text-red-600"><strong>Reason:</strong> {doc.rejectionReason}</p>
        </div>
      )}

      {doc.reviewNotes?.length > 0 && (
        <div className="flex items-center gap-1 mb-3 text-xs text-blue-500">
          <AlertCircle className="w-3.5 h-3.5" />
          {doc.reviewNotes.length} admin note{doc.reviewNotes.length > 1 ? "s" : ""}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString("en-IN")}</span>
        <div className="flex items-center gap-1">
          <button onClick={onView} className="p-1.5 hover:bg-gray-100 rounded-lg" title="View details">
            <Eye className="w-4 h-4 text-gray-500" />
          </button>
          {isOwner && doc.status === "Pending" && (
            <>
              <button onClick={onEdit} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Edit">
                <FileText className="w-4 h-4 text-blue-500" />
              </button>
              <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   UPLOAD / EDIT MODAL
══════════════════════════════════════════════════════════ */
function UploadModal({ editDoc, onClose, onSuccess }) {
  const isEdit = !!editDoc;
  const [form, setForm] = useState({
    title: editDoc?.title || "",
    description: editDoc?.description || "",
    category: editDoc?.category || "Research",
    tags: editDoc?.tags?.join(", ") || "",
  });
  const [file, setFile] = useState(null);
  const [contributors, setContributors] = useState(
    editDoc?.contributors?.map((c) => ({
      employee: c.employee?._id || c.employee,
      name: c.name || "",
      email: c.email || "",
      position: c.position || "",
      department: c.department || "",
      contributionNote: c.contributionNote || "",
      contributionPercentage: c.contributionPercentage || 0,
    })) || []
  );
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const totalPct = contributors.reduce((s, c) => s + Number(c.contributionPercentage || 0), 0);

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.description.trim()) return toast.error("Description is required");
    if (totalPct > 100) return toast.error("Total contribution % cannot exceed 100");

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("category", form.category);
    fd.append("tags", JSON.stringify(form.tags.split(",").map((t) => t.trim()).filter(Boolean)));
    fd.append("contributors", JSON.stringify(contributors.map((c) => ({
      employee: c.employee,
      contributionNote: c.contributionNote,
      contributionPercentage: c.contributionPercentage,
    }))));
    if (file) fd.append("file", file);

    setSubmitting(true);
    try {
      const url = isEdit ? `${BASE}/documentation/${editDoc._id}` : `${BASE}/documentation`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${localStorage.getItem("employeeToken")}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? "Document updated!" : "Document submitted for review!");
        onSuccess();
      } else {
        toast.error(data.message || "Submission failed");
      }
    } catch { toast.error("Network error"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" />
            {isEdit ? "Edit Document" : "Upload New Document"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              placeholder="e.g. Q3 Research Report on Customer Retention"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              rows={3}
              placeholder="Brief summary of the document…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Category + Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag className="w-3.5 h-3.5 inline mr-1" />Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. sales, crm, q3"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* File Drop Zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attach File <span className="text-gray-400 font-normal">(PDF, DOCX, XLSX, PPTX, TXT, Image — max 15 MB)</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) setFile(f);
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragOver ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-teal-300"
              }`}
              onClick={() => document.getElementById("doc-file-input").click()}
            >
              <input
                id="doc-file-input"
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files[0])}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-teal-600">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-gray-400">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Drag & drop or <span className="text-teal-600 underline">browse</span></p>
                  {isEdit && editDoc?.fileName && (
                    <p className="text-xs mt-1 text-gray-400">Current: {editDoc.fileName}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* GitHub-style Collaborator Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <GitBranch className="w-4 h-4 text-teal-600" />
              Collaborators
              <span className="text-xs font-normal text-gray-400 ml-1">— search & add like GitHub</span>
            </label>
            <CollaboratorPicker contributors={contributors} onChange={setContributors} />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {submitting ? "Submitting…" : isEdit ? "Update Document" : "Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DETAIL MODAL
══════════════════════════════════════════════════════════ */
function DetailModal({ doc, onClose }) {
  const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.Pending;
  const Icon = badge.icon;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>{fileIcon(doc.fileType)}</span> {doc.title}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
              <Icon className="w-4 h-4" /> {doc.status}
            </span>
            <span className="text-xs text-gray-400">{doc.category}</span>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700">{doc.description}</p>
          </div>

          {doc.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {doc.tags.map((t) => (
                <span key={t} className="bg-teal-50 text-teal-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}

          {doc.fileUrl && (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span>{fileIcon(doc.fileType)}</span>
                <span className="text-sm text-gray-700 truncate max-w-xs">{doc.fileName || "Attached file"}</span>
              </div>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800">
                <Download className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Collaborators section */}
          {doc.contributors?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5" />
                Collaborators ({doc.contributors.length})
              </p>
              <div className="space-y-2">
                {doc.contributors.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-teal-700">{c.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{c.name || "Unknown"}</p>
                        {c.contributionNote && <p className="text-xs text-gray-400">{c.contributionNote}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${c.contributionPercentage}%` }} />
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {c.contributionPercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {doc.status === "Rejected" && doc.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-xs font-medium text-red-600 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700">{doc.rejectionReason}</p>
            </div>
          )}

          {doc.reviewNotes?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Admin Notes</p>
              <div className="space-y-2">
                {doc.reviewNotes.map((n) => (
                  <div key={n._id} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-blue-700">{n.adminName || "Admin"}</span>
                      <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    <p className="text-sm text-gray-700">{n.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}