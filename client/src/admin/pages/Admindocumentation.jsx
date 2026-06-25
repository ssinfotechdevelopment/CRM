// client/src/admin/pages/AdminDocumentation.jsx
import React, { useState } from "react";
import {
  FileText, CheckCircle, XCircle, Clock, Eye, MessageSquarePlus,
  Search, RefreshCw, Download, Users, X, AlertCircle,
  BookOpen, User, Send,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = "http://sscrmbackend.ssinfotech.co.in/api";

const STATUS_BADGE = {
  Pending:  { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", icon: Clock },
  Approved: { bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200",  icon: CheckCircle },
  Rejected: { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200",    icon: XCircle },
};

const CATEGORIES = ["all", "Research", "Technical", "Policy", "Training", "Report", "Other"];
const STATUSES = ["all", "Pending", "Approved", "Rejected"];

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
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

const contributorName = (c) => {
  if (!c) return "Unknown";
  if (typeof c === "object") return c.name || c.email || c.fullName || "Unknown";
  return String(c);
};

/* Query Keys */
const DOCUMENT_KEYS = {
  all: ["documents"],
  list: (filters) => ["documents", "list", filters],
  stats: ["documents", "stats"],
  detail: (id) => ["documents", "detail", id],
};

/* Fetch Functions */
const fetchDocuments = async (filters) => {
  const params = new URLSearchParams();
  if (filters.statusFilter !== "all") params.set("status", filters.statusFilter);
  if (filters.categoryFilter !== "all") params.set("category", filters.categoryFilter);
  if (filters.search?.trim()) params.set("search", filters.search.trim());

  const res = await fetch(`${BASE}/documentation/admin/all?${params}`, {
    headers: authHeader(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to fetch documents");
  return (data.data || []).filter(doc => doc && doc._id);
};

const fetchStats = async () => {
  const res = await fetch(`${BASE}/documentation/admin/stats`, { headers: authHeader() });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to fetch stats");
  return data.data;
};

/* ======================== MAIN COMPONENT ======================== */
export default function AdminDocumentation() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals
  const [detailDoc, setDetailDoc] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [noteModal, setNoteModal] = useState(null);

  const filters = { search, statusFilter, categoryFilter };

  /* Queries */
  const { data: docs = [], isLoading: loading } = useQuery({
    queryKey: DOCUMENT_KEYS.list(filters),
    queryFn: () => fetchDocuments(filters),
    keepPreviousData: true,
  });

  const { data: stats = { total: 0, pending: 0, approved: 0, rejected: 0 } } = useQuery({
    queryKey: DOCUMENT_KEYS.stats,
    queryFn: fetchStats,
  });

  /* Mutations */
  const approveMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${BASE}/documentation/admin/${id}/approve`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to approve");
      return id;
    },
    onSuccess: () => {
      toast.success("Document approved successfully ✓");
      queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.all });
    },
    onError: (err) => toast.error(err.message || "Failed to approve document"),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const res = await fetch(`${BASE}/documentation/admin/${id}/reject`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to reject");
      return { id, reason };
    },
    onSuccess: ({ id, reason }) => {
      toast.success("Document rejected");
      queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.all });

      if (detailDoc?._id === id) {
        setDetailDoc(prev => ({ ...prev, status: "Rejected", rejectionReason: reason }));
      }
      setRejectModal(null);
    },
    onError: (err) => toast.error(err.message || "Failed to reject document"),
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ id, note }) => {
      const res = await fetch(`${BASE}/documentation/admin/${id}/note`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to add note");
      return id;
    },
    onSuccess: () => {
      toast.success("Improvement note added");
      queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.all });
      setNoteModal(null);
    },
    onError: (err) => toast.error(err.message || "Failed to add note"),
  });

  /* Handlers */
  const handleApprove = (id) => approveMutation.mutate(id);

  const openRejectModal = (doc) => setRejectModal({ doc, reason: "" });

  const handleReject = () => {
    if (!rejectModal?.doc?._id || !rejectModal.reason?.trim()) {
      return toast.error("Please provide a rejection reason");
    }
    rejectMutation.mutate({
      id: rejectModal.doc._id,
      reason: rejectModal.reason.trim(),
    });
  };

  const openNoteModal = (doc) => setNoteModal({ doc, note: "" });

  const handleAddNote = () => {
    if (!noteModal?.doc?._id || !noteModal.note?.trim()) {
      return toast.error("Note cannot be empty");
    }
    addNoteMutation.mutate({
      id: noteModal.doc._id,
      note: noteModal.note.trim(),
    });
  };

  const openDetail = async (doc) => {
    if (!doc?._id) return;
    try {
      const res = await fetch(`${BASE}/documentation/admin/${doc._id}`, { headers: authHeader() });
      const data = await res.json();
      setDetailDoc(data.success ? data.data : doc);
    } catch {
      setDetailDoc(doc);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-teal-600" /> Documentation Review
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Review, approve or reject employee-submitted documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-gray-700", bg: "bg-white", icon: FileText },
          { label: "Pending", value: stats.pending, color: "text-yellow-600", bg: "bg-yellow-50", icon: Clock },
          { label: "Approved", value: stats.approved, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
          { label: "Rejected", value: stats.rejected, color: "text-red-500", bg: "bg-red-50", icon: XCircle },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-200 flex items-center gap-3`}>
            <s.icon className={`w-8 h-8 ${s.color} opacity-70`} />
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search title, uploader…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
          ))}
        </select>

        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.all })}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No documents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Document", "Uploaded By", "Category", "Contributors", "Status", "Submitted", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docs.map((doc) => {
                  const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.Pending;
                  const BadgeIcon = badge.icon;

                  return (
                    <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2 max-w-xs">
                          <span className="text-xl">{fileIcon(doc.fileType)}</span>
                          <div>
                            <p className="font-medium text-gray-800 line-clamp-1">{doc.title}</p>
                            {doc.tags?.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {doc.tags.slice(0, 2).map((t, i) => (
                                  <span key={i} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-600">{doc.uploaderName || "—"}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {doc.category}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {doc.contributors?.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-medium">{doc.contributors.length}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {doc.contributors.slice(0, 2).map((c, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full border border-teal-100 max-w-[120px] truncate"
                                  title={contributorName(c)}
                                >
                                  {contributorName(c)}
                                </span>
                              ))}
                              {doc.contributors.length > 2 && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                  +{doc.contributors.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <BadgeIcon className="w-3 h-3" /> {doc.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(doc.createdAt).toLocaleDateString("en-IN")}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDetail(doc)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="View">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>

                          {doc.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(doc._id)}
                                className="p-1.5 hover:bg-green-50 rounded-lg"
                                title="Approve"
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </button>
                              <button onClick={() => openRejectModal(doc)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Reject">
                                <XCircle className="w-4 h-4 text-red-400" />
                              </button>
                            </>
                          )}

                          <button onClick={() => openNoteModal(doc)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Add Note">
                            <MessageSquarePlus className="w-4 h-4 text-blue-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {detailDoc && (
        <DetailModal
          doc={detailDoc}
          onClose={() => setDetailDoc(null)}
          onApprove={handleApprove}
          onReject={openRejectModal}
          onAddNote={openNoteModal}
        />
      )}

      {rejectModal && (
        <RejectModal
          rejectModal={rejectModal}
          setRejectModal={setRejectModal}
          handleReject={handleReject}
        />
      )}

      {noteModal && (
        <NoteModal
          noteModal={noteModal}
          setNoteModal={setNoteModal}
          handleAddNote={handleAddNote}
        />
      )}
    </div>
  );
}

/* ======================== DETAIL MODAL ======================== */
function DetailModal({ doc, onClose, onApprove, onReject, onAddNote }) {
  const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.Pending;
  const BadgeIcon = badge.icon;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-base">
            <span>{fileIcon(doc.fileType)}</span>
            <span className="line-clamp-1">{doc.title}</span>
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
              <BadgeIcon className="w-4 h-4" /> {doc.status}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{doc.category}</span>
            <span className="text-xs text-gray-400 ml-auto">
              {new Date(doc.createdAt).toLocaleDateString("en-IN")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Uploaded by</p>
              <p className="text-sm font-medium text-gray-700">
                {doc.uploaderName || doc.uploadedBy?.name || "Unknown"}
              </p>
            </div>
          </div>

          {doc.contributors?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Contributors ({doc.contributors.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {doc.contributors.map((c, i) => {
                  const name = contributorName(c);
                  const email = typeof c === "object" ? c.email : null;
                  const role = typeof c === "object" ? c.role : null;

                  return (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-xs font-semibold text-teal-700 shrink-0">
                        {name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{name}</p>
                        {email && <p className="text-xs text-gray-400 truncate">{email}</p>}
                        {role && <p className="text-xs text-teal-500 truncate">{role}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {doc.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{doc.description}</p>
            </div>
          )}

          {doc.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {doc.tags.map((t, i) => (
                <span key={i} className="bg-teal-50 text-teal-600 text-xs px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}

          {doc.fileUrl && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span>{fileIcon(doc.fileType)}</span>
                <span className="text-sm text-gray-700 truncate max-w-xs">{doc.fileName || "Attached file"}</span>
              </div>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium">
                <Download className="w-3.5 h-3.5" /> Open
              </a>
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
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Admin Notes
              </p>
              {doc.reviewNotes.map((n, i) => (
                <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-blue-700">{n.adminName || "Admin"}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{n.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 flex flex-wrap gap-2 justify-end">
          <button onClick={onAddNote} className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-sm font-medium">
            <MessageSquarePlus className="w-4 h-4" /> Add Note
          </button>

          {doc.status === "Pending" && (
            <>
              <button onClick={onReject} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium">
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button onClick={() => onApprove(doc._id)} className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======================== REJECT MODAL ======================== */
function RejectModal({ rejectModal, setRejectModal, handleReject }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-gray-800">Reject Document</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">"{rejectModal.doc.title}"</p>
        <textarea
          rows={4}
          placeholder="Reason for rejection..."
          value={rejectModal.reason}
          onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
        />
        <div className="flex justify-end gap-3">
          <button onClick={() => setRejectModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleReject} className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================== NOTE MODAL ======================== */
function NoteModal({ noteModal, setNoteModal, handleAddNote }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquarePlus className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-800">Add Improvement Note</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">"{noteModal.doc.title}"</p>
        <textarea
          rows={4}
          placeholder="Write your suggestion..."
          value={noteModal.note}
          onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
        />
        <div className="flex justify-end gap-3">
          <button onClick={() => setNoteModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleAddNote} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <Send className="w-4 h-4" /> Add Note
          </button>
        </div>
      </div>
    </div>
  );
}