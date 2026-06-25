import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = ({ d, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);
const CalendarIcon = ({ c }) => <Icon className={c || "w-5 h-5"} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />;
const GuestIcon    = ({ c }) => <Icon className={c || "w-5 h-5"} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />;
const EmailIcon    = ({ c }) => <Icon className={c || "w-4 h-4"} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
const PhoneIcon    = ({ c }) => <Icon className={c || "w-4 h-4"} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />;
const CloseIcon    = ({ c }) => <Icon className={c || "w-6 h-6"} d="M6 18L18 6M6 6l12 12" />;
const PlusIcon     = ({ c }) => <Icon className={c || "w-5 h-5"} d="M12 4v16m8-8H4" />;
const TrashIcon    = ({ c }) => <Icon className={c || "w-5 h-5"} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
const EditIcon     = ({ c }) => <Icon className={c || "w-5 h-5"} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />;
const EyeIcon      = ({ c }) => <Icon className={c || "w-5 h-5"} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />;
const UserAddIcon  = ({ c }) => <Icon className={c || "w-5 h-5"} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />;
const ImageIcon    = ({ c }) => <Icon className={c || "w-5 h-5"} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />;
const ChevronLeft  = ({ c }) => <Icon className={c || "w-6 h-6"} d="M15 19l-7-7 7-7" />;
const ChevronRight = ({ c }) => <Icon className={c || "w-6 h-6"} d="M9 5l7 7-7 7" />;
const UploadIcon   = ({ c }) => <Icon className={c || "w-8 h-8"} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />;
const LocationIcon = ({ c }) => <Icon className={c || "w-4 h-4"} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />;
const CheckIcon    = ({ c }) => <Icon className={c || "w-4 h-4"} d="M5 13l4 4L19 7" />;
const ClockIcon    = ({ c }) => <Icon className={c || "w-4 h-4"} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
const BanIcon      = ({ c }) => <Icon className={c || "w-4 h-4"} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />;
const UsersIcon    = ({ c }) => <Icon className={c || "w-5 h-5"} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />;

// ─── API BASE — relative so Vite proxy works locally, deployed URL works in prod ─
// Vite proxy in vite.config.js forwards /api → https://crm-server-jl9z.onrender.com
const API_EVENTS = "https://sscrmbackend.ssinfotech.co.in/api/events";
const API_GUESTS = "https://sscrmbackend.ssinfotech.co.in/api/guests";

// ─── Auth header helper ───────────────────────────────────────────────────────
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// ─── Multi-Image Picker ───────────────────────────────────────────────────────
const MultiImagePicker = ({ value, onChange, existingUrls = [], label = "Event Photos (5–10 images)" }) => {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const MAX = 10; const MIN = 5;

    const addFiles = useCallback((incoming) => {
        const valid = Array.from(incoming).filter(f => f.type.startsWith("image/"));
        const merged = [...value, ...valid];
        if (merged.length > MAX) { alert(`Max ${MAX} photos — only first ${MAX} kept.`); onChange(merged.slice(0, MAX)); }
        else onChange(merged);
    }, [value, onChange]);

    const remove = (idx) => onChange(value.filter((_, i) => i !== idx));
    const onDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };
    const total = existingUrls.length + value.length;
    const remaining = MAX - total;
    const ok = total >= MIN;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">{label}</label>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${ok ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {total}/{MAX} {!ok && `(need ${MIN - total} more)`}
                </span>
            </div>
            {remaining > 0 && (
                <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-all
                        ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}`}>
                    <UploadIcon c="w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-500 font-medium">Drop images here or <span className="text-blue-600 underline">browse</span></p>
                    <p className="text-xs text-gray-400">JPG, PNG, WEBP · Max 5 MB · {remaining} slot{remaining !== 1 ? "s" : ""} left</p>
                    <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                </div>
            )}
            {value.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {value.map((file, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                            <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                            <div className="absolute top-1 left-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{existingUrls.length + idx + 1}</div>
                            <button type="button" onClick={(e) => { e.stopPropagation(); remove(idx); }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                                <CloseIcon c="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">{file.name}</div>
                        </div>
                    ))}
                </div>
            )}
            {total === 0 && <p className="text-xs text-gray-400 italic">No images selected yet.</p>}
        </div>
    );
};

// ─── Existing Photos Grid (Edit modal) ───────────────────────────────────────
const ExistingPhotosGallery = ({ photos, onRemove }) => {
    if (!photos?.length) return null;
    return (
        <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Existing Photos ({photos.length})</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {photos.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{idx + 1}</div>
                        <button type="button" onClick={() => onRemove(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                            <CloseIcon c="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Card Gallery (hero + thumbnail strip + inline lightbox) ─────────────────
const EventCardGallery = ({ photos = [] }) => {
    const [lb, setLb] = useState(null);
    const prev = () => setLb(l => (l - 1 + photos.length) % photos.length);
    const next = () => setLb(l => (l + 1) % photos.length);

    if (!photos.length) return (
        <div className="w-full h-44 bg-gradient-to-br from-slate-100 to-indigo-100 flex flex-col items-center justify-center gap-2">
            <ImageIcon c="w-10 h-10 text-indigo-300" /><span className="text-xs text-indigo-400">No photos</span>
        </div>
    );
    return (
        <>
            <div className="relative w-full h-44 cursor-pointer overflow-hidden group" onClick={() => setLb(0)}>
                <img src={photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                {photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <ImageIcon c="w-3 h-3" /> +{photos.length - 1}
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3"><EyeIcon c="w-6 h-6 text-white" /></div>
                </div>
            </div>
            {photos.length > 1 && (
                <div className="flex gap-1 px-2 py-1.5 bg-gray-50 border-b overflow-x-auto">
                    {photos.map((url, i) => (
                        <img key={i} src={url} alt="" onClick={() => setLb(i)}
                            className={`w-9 h-9 object-cover rounded cursor-pointer flex-shrink-0 border-2 transition-all hover:scale-110
                                ${i === 0 ? "border-blue-500" : "border-transparent hover:border-blue-300"}`} />
                    ))}
                </div>
            )}
            {lb !== null && (
                <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4" onClick={() => setLb(null)}>
                    <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 z-10"><ChevronLeft c="w-7 h-7" /></button>
                    <div onClick={e => e.stopPropagation()} className="max-w-4xl w-full flex flex-col items-center gap-3">
                        <img src={photos[lb]} alt="" className="w-full max-h-[75vh] object-contain rounded-xl" />
                        <span className="bg-black/60 text-white text-sm px-4 py-1 rounded-full">{lb + 1} / {photos.length}</span>
                        <div className="flex gap-2 overflow-x-auto max-w-full px-2">
                            {photos.map((url, i) => (
                                <img key={i} src={url} alt="" onClick={(e) => { e.stopPropagation(); setLb(i); }}
                                    className={`w-12 h-12 object-cover rounded-lg cursor-pointer border-2 flex-shrink-0 transition-all
                                        ${i === lb ? "border-blue-400 scale-110" : "border-white/30 hover:border-white/60"}`} />
                            ))}
                        </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 z-10"><ChevronRight c="w-7 h-7" /></button>
                    <button onClick={() => setLb(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2"><CloseIcon c="w-5 h-5" /></button>
                </div>
            )}
        </>
    );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, size = "sm" }) => {
    const map = {
        Upcoming:  { bg: "bg-blue-100 text-blue-700 border-blue-200",    dot: "bg-blue-500"    },
        Ongoing:   { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
        Completed: { bg: "bg-gray-100 text-gray-600 border-gray-200",    dot: "bg-gray-400"    },
        Cancelled: { bg: "bg-red-100 text-red-700 border-red-200",       dot: "bg-red-500"     },
    };
    const { bg, dot } = map[status] || map.Upcoming;
    return (
        <span className={`inline-flex items-center gap-1.5 border rounded-full font-semibold
            ${size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"} ${bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{status}
        </span>
    );
};

// ─── View Details Modal ───────────────────────────────────────────────────────
const ViewDetailsModal = ({ event, token, onClose, onEdit, onGuestStatusChange }) => {
    const [tab, setTab]         = useState("overview");
    const [guests, setGuests]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [lb, setLb]           = useState(null);

    const photos = event.photos || [];
    const prev = () => setLb(l => (l - 1 + photos.length) % photos.length);
    const next = () => setLb(l => (l + 1) % photos.length);

    // Fetch guests for this event on mount
    useEffect(() => {
        (async () => {
            try {
                const res  = await fetch(`${API_GUESTS}?eventId=${event._id}`, { headers: authHeader(token) });
                const data = await res.json();
                if (data.success) setGuests(data.guests || []);
            } catch {}
            finally { setLoading(false); }
        })();
    }, [event._id]);

    const confirmed = guests.filter(g => g.status === "Confirmed").length;
    const pending   = guests.filter(g => g.status === "Pending").length;
    const cancelled = guests.filter(g => g.status === "Cancelled").length;
    const totalPax  = guests.reduce((s, g) => s + 1 + (g.numberOfCompanions || 0), 0);

    const fmtLong  = d => d ? new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—";
    const fmtShort = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

    const handleStatusChange = async (guestId, newStatus) => {
        try {
            const res  = await fetch(`${API_GUESTS}/${guestId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...authHeader(token) },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setGuests(prev => prev.map(g => g._id === guestId ? { ...g, status: newStatus } : g));
                onGuestStatusChange(guestId, newStatus);
            }
        } catch {}
    };

    const TABS = [
        { id: "overview", label: "Overview",             icon: "📋" },
        { id: "photos",   label: `Photos (${photos.length})`, icon: "🖼️" },
        { id: "guests",   label: `Guests (${guests.length})`, icon: "👥" },
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6 overflow-hidden">

                {/* ── Hero Banner ── */}
                <div className="relative h-52 bg-gradient-to-br from-indigo-700 to-purple-800 overflow-hidden">
                    {photos[0] && <img src={photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <StatusBadge status={event.status} size="lg" />
                            <h2 className="text-2xl md:text-3xl font-bold text-white mt-1.5 leading-tight">{event.title}</h2>
                            <div className="flex flex-wrap gap-4 mt-1.5 text-white/75 text-sm">
                                <span className="flex items-center gap-1.5"><CalendarIcon c="w-4 h-4" />{fmtShort(event.date)}</span>
                                <span className="flex items-center gap-1.5"><LocationIcon c="w-4 h-4" />{event.location}</span>
                                <span className="flex items-center gap-1.5"><GuestIcon c="w-4 h-4" />{guests.length} guests</span>
                                <span className="flex items-center gap-1.5"><ImageIcon c="w-4 h-4" />{photos.length} photos</span>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button onClick={onEdit}
                                className="bg-white/20 hover:bg-white/35 backdrop-blur-sm text-white border border-white/30 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition">
                                <EditIcon c="w-4 h-4" /> Edit
                            </button>
                            <button onClick={onClose}
                                className="bg-white/20 hover:bg-white/35 backdrop-blur-sm text-white border border-white/30 p-2 rounded-xl transition">
                                <CloseIcon c="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="bg-gray-50 border-b px-6 flex gap-1">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap
                                ${tab === t.id ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                            <span>{t.icon}</span> {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab Body ── */}
                <div className="p-6">

                    {/* ── OVERVIEW ── */}
                    {tab === "overview" && (
                        <div className="space-y-5">
                            {/* 4 stat cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: "Total Guests",  val: guests.length, color: "bg-indigo-50 border-indigo-100",  text: "text-indigo-700",  icon: <UsersIcon c="w-5 h-5 text-indigo-400" /> },
                                    { label: "Confirmed",     val: confirmed,      color: "bg-green-50 border-green-100",    text: "text-green-700",   icon: <CheckIcon c="w-5 h-5 text-green-500" /> },
                                    { label: "Pending",       val: pending,        color: "bg-yellow-50 border-yellow-100",  text: "text-yellow-700",  icon: <ClockIcon c="w-5 h-5 text-yellow-500" /> },
                                    { label: "Cancelled",     val: cancelled,      color: "bg-red-50 border-red-100",        text: "text-red-700",     icon: <BanIcon c="w-5 h-5 text-red-400" /> },
                                ].map(s => (
                                    <div key={s.label} className={`${s.color} border rounded-xl p-4 flex items-center gap-3`}>
                                        {s.icon}
                                        <div>
                                            <p className={`text-2xl font-bold ${s.text}`}>{s.val}</p>
                                            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Confirmation progress bar */}
                            {guests.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                                        <span>Confirmation Rate</span>
                                        <span>{Math.round((confirmed / guests.length) * 100)}%</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                                        <div className="bg-green-500 h-full" style={{ width: `${(confirmed / guests.length) * 100}%` }} />
                                        <div className="bg-yellow-400 h-full" style={{ width: `${(pending / guests.length) * 100}%` }} />
                                        <div className="bg-red-400 h-full"   style={{ width: `${(cancelled / guests.length) * 100}%` }} />
                                    </div>
                                    <div className="flex gap-4 text-xs text-gray-400">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Confirmed</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Pending</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Cancelled</span>
                                    </div>
                                </div>
                            )}

                            {/* Info grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left: field list */}
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Event Info</p>
                                    {[
                                        { label: "Full Date",    val: fmtLong(event.date),                                  icon: <CalendarIcon c="w-4 h-4 text-indigo-500" /> },
                                        { label: "Location",     val: event.location,                                       icon: <LocationIcon c="w-4 h-4 text-rose-500" /> },
                                        { label: "Status",       val: <StatusBadge status={event.status} />,                icon: null },
                                        { label: "Max Capacity", val: event.maxGuests > 0 ? `${event.maxGuests} guests` : "Unlimited", icon: <UsersIcon c="w-4 h-4 text-purple-500" /> },
                                        { label: "Total Pax",    val: `${totalPax} people (incl. companions)`,              icon: <GuestIcon c="w-4 h-4 text-blue-500" /> },
                                        { label: "Photos",       val: `${photos.length} uploaded`,                          icon: <ImageIcon c="w-4 h-4 text-teal-500" /> },
                                        { label: "Created",      val: fmtShort(event.createdAt),                            icon: <ClockIcon c="w-4 h-4 text-gray-400" /> },
                                    ].map(row => (
                                        <div key={row.label} className="flex items-start gap-2.5">
                                            <span className="mt-0.5 flex-shrink-0 w-4">{row.icon}</span>
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-400 font-medium">{row.label}</p>
                                                <div className="text-sm text-gray-800 font-medium">{row.val}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Right: description + capacity bar */}
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3 flex flex-col">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</p>
                                    <p className="text-sm text-gray-600 leading-relaxed flex-1">{event.description || "No description provided."}</p>
                                    {event.maxGuests > 0 && (
                                        <div className="pt-3 border-t border-gray-200 space-y-1.5">
                                            <div className="flex justify-between text-xs text-gray-500 font-medium">
                                                <span>Capacity Used</span>
                                                <span>{guests.length} / {event.maxGuests}</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${
                                                    guests.length / event.maxGuests > 0.9 ? "bg-red-500" :
                                                    guests.length / event.maxGuests > 0.7 ? "bg-yellow-500" : "bg-green-500"
                                                }`} style={{ width: `${Math.min((guests.length / event.maxGuests) * 100, 100)}%` }} />
                                            </div>
                                            <p className="text-xs text-gray-400">{Math.max(0, event.maxGuests - guests.length)} spots remaining</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PHOTOS ── */}
                    {tab === "photos" && (
                        <div className="space-y-4">
                            {!photos.length ? (
                                <div className="text-center py-16 text-gray-400">
                                    <ImageIcon c="w-16 h-16 mx-auto mb-3 text-gray-200" />
                                    <p className="font-medium">No photos uploaded</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-400">{photos.length} photo{photos.length > 1 ? "s" : ""} — click any to open fullscreen</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {photos.map((url, i) => (
                                            <div key={i} onClick={() => setLb(i)}
                                                className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                                                <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                    <EyeIcon c="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">{i + 1}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            {lb !== null && (
                                <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-4" onClick={() => setLb(null)}>
                                    <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 z-10"><ChevronLeft c="w-7 h-7" /></button>
                                    <div onClick={e => e.stopPropagation()} className="max-w-4xl w-full flex flex-col items-center gap-3">
                                        <img src={photos[lb]} alt="" className="w-full max-h-[75vh] object-contain rounded-xl" />
                                        <span className="bg-black/60 text-white text-sm px-4 py-1 rounded-full">{lb + 1} / {photos.length}</span>
                                        <div className="flex gap-2 overflow-x-auto max-w-full px-2">
                                            {photos.map((url, i) => (
                                                <img key={i} src={url} alt="" onClick={(e) => { e.stopPropagation(); setLb(i); }}
                                                    className={`w-12 h-12 object-cover rounded-lg cursor-pointer border-2 flex-shrink-0 transition-all
                                                        ${i === lb ? "border-blue-400 scale-110" : "border-white/30 hover:border-white/60"}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 z-10"><ChevronRight c="w-7 h-7" /></button>
                                    <button onClick={() => setLb(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2"><CloseIcon c="w-5 h-5" /></button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── GUESTS ── */}
                    {tab === "guests" && (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-12 text-gray-400">Loading guests…</div>
                            ) : !guests.length ? (
                                <div className="text-center py-16 text-gray-400">
                                    <GuestIcon c="w-14 h-14 mx-auto mb-3 text-gray-200" />
                                    <p className="font-medium">No guests for this event</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mini stat pills */}
                                    <div className="flex flex-wrap gap-2 pb-3 border-b">
                                        {[
                                            { l: "Total",     v: guests.length, c: "bg-indigo-100 text-indigo-700"  },
                                            { l: "Confirmed", v: confirmed,      c: "bg-green-100 text-green-700"    },
                                            { l: "Pending",   v: pending,        c: "bg-yellow-100 text-yellow-700"  },
                                            { l: "Cancelled", v: cancelled,      c: "bg-red-100 text-red-700"        },
                                            { l: "Total Pax", v: totalPax,       c: "bg-purple-100 text-purple-700"  },
                                        ].map(s => (
                                            <span key={s.l} className={`${s.c} text-xs font-semibold px-3 py-1 rounded-full`}>{s.l}: {s.v}</span>
                                        ))}
                                    </div>

                                    {/* Guest rows */}
                                    <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
                                        {guests.map((g, idx) => (
                                            <div key={g._id}
                                                className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {/* Colored avatar */}
                                                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-base shadow-sm"
                                                        style={{ background: `hsl(${(g.name.charCodeAt(0) * 47) % 360},60%,55%)` }}>
                                                        {g.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-semibold text-gray-800 text-sm">{g.name}</p>
                                                            <span className="text-gray-300 text-xs">#{idx + 1}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-0.5">
                                                            <span className="flex items-center gap-1"><EmailIcon />{g.email}</span>
                                                            <span className="flex items-center gap-1"><PhoneIcon />{g.phone}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                            {g.numberOfCompanions > 0 && (
                                                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">+{g.numberOfCompanions} companion{g.numberOfCompanions !== 1 ? "s" : ""}</span>
                                                            )}
                                                            {g.dietaryRestrictions && (
                                                                <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">🍽️ {g.dietaryRestrictions}</span>
                                                            )}
                                                            {g.notes && (
                                                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 max-w-[180px] truncate">📝 {g.notes}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Status dropdown */}
                                                <select value={g.status} onChange={(e) => handleStatusChange(g._id, e.target.value)}
                                                    className={`flex-shrink-0 text-xs font-semibold border rounded-full px-3 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400
                                                        ${g.status === "Confirmed" ? "text-green-700 bg-green-50 border-green-200" :
                                                          g.status === "Cancelled" ? "text-red-700 bg-red-50 border-red-200" :
                                                          "text-yellow-700 bg-yellow-50 border-yellow-200"}`}>
                                                    <option>Confirmed</option>
                                                    <option>Pending</option>
                                                    <option>Cancelled</option>
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════
// ─── Main Component ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const AdminEventGuestManager = () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-red-600 mb-2">Access Denied</h1>
                <p className="text-gray-500">Admin login required</p>
            </div>
        </div>
    );

    // ── State ─────────────────────────────────────────────────────────
    const [events, setEvents]       = useState([]);
    const [guests, setGuests]       = useState([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState("");
    const [success, setSuccess]     = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Modal visibility
    const [showAdd,    setShowAdd]    = useState(false);
    const [showEdit,   setShowEdit]   = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    // Selected event for Edit / View Details
    const [selEvent,   setSelEvent]   = useState(null);

    // ── Forms ─────────────────────────────────────────────────────────
    const blankEv = { title: "", description: "", date: "", location: "", status: "Upcoming", maxGuests: "" };
    const blankGu = { name: "", email: "", phone: "", status: "Pending", numberOfCompanions: 0, dietaryRestrictions: "", notes: "" };

    const [newEv,         setNewEv]         = useState(blankEv);
    const [newEvPhotos,   setNewEvPhotos]   = useState([]);
    const [newEvGuests,   setNewEvGuests]   = useState([]);
    const [tempGuest,     setTempGuest]     = useState(blankGu);

    const [editExPhotos,  setEditExPhotos]  = useState([]);  // existing Cloudinary URLs to keep
    const [editNewPhotos, setEditNewPhotos] = useState([]);  // new File[]

    const guestStatuses = ["Confirmed", "Pending", "Cancelled"];

    // ── Helpers ───────────────────────────────────────────────────────
    const flash = (type, msg) => {
        type === "success" ? (setSuccess(msg), setError("")) : (setError(msg), setSuccess(""));
        setTimeout(() => { setSuccess(""); setError(""); }, 4000);
    };

    const fmt = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

    const statusCardColor = (s) => ({
        Upcoming:  "bg-blue-100 text-blue-700",
        Ongoing:   "bg-emerald-100 text-emerald-700",
        Completed: "bg-gray-100 text-gray-600",
        Cancelled: "bg-red-100 text-red-700",
    }[s] || "bg-gray-100 text-gray-600");

    const guestStatusColor = (s) => ({
        Confirmed: "text-green-700 bg-green-50 border-green-200",
        Pending:   "text-yellow-700 bg-yellow-50 border-yellow-200",
        Cancelled: "text-red-700 bg-red-50 border-red-200",
    }[s] || "text-gray-700 bg-gray-50");

    const eventGuests = (eventId) => guests.filter(g => {
        const id = g.eventId?._id || g.eventId;
        return String(id) === String(eventId);
    });

    // ── Fetch ─────────────────────────────────────────────────────────
    const fetchEvents = async () => {
        setLoading(true);
        try {
            const r = await fetch(API_EVENTS, { headers: authHeader(token) });
            const d = await r.json();
            if (d.success) setEvents(d.events || []);
            else flash("error", d.message || "Failed to load events");
        } catch { flash("error", "Network error — could not load events"); }
        finally { setLoading(false); }
    };

    const fetchGuests = async () => {
        try {
            const r = await fetch(API_GUESTS, { headers: authHeader(token) });
            const d = await r.json();
            if (d.success) setGuests(d.guests || []);
        } catch {}
    };

    useEffect(() => { fetchEvents(); fetchGuests(); }, []);

    // ── Create Event ──────────────────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        if (newEvPhotos.length < 5) { flash("error", `Select at least 5 photos (currently ${newEvPhotos.length})`); return; }
        setSubmitting(true);
        const fd = new FormData();
        fd.append("title",       newEv.title);
        fd.append("description", newEv.description);
        fd.append("date",        newEv.date);
        fd.append("location",    newEv.location);
        fd.append("status",      newEv.status);
        if (newEv.maxGuests) fd.append("maxGuests", newEv.maxGuests);
        newEvPhotos.forEach(f => fd.append("photos", f));
        try {
            const r = await fetch(API_EVENTS, { method: "POST", headers: authHeader(token), body: fd });
            const d = await r.json();
            if (d.success) {
                for (const g of newEvGuests) {
                    await fetch(API_GUESTS, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...authHeader(token) },
                        body: JSON.stringify({ ...g, eventId: d.event._id }),
                    });
                }
                flash("success", "Event created successfully!");
                setShowAdd(false); setNewEv(blankEv); setNewEvPhotos([]); setNewEvGuests([]); setTempGuest(blankGu);
                fetchEvents(); fetchGuests();
            } else flash("error", d.message || "Failed to create event");
        } catch { flash("error", "Network error — could not create event"); }
        finally { setSubmitting(false); }
    };

    // ── Update Event ──────────────────────────────────────────────────
    const handleUpdate = async (e) => {
        e.preventDefault();
        const total = editExPhotos.length + editNewPhotos.length;
        if (total < 5) { flash("error", `Need at least 5 photos (currently ${total})`); return; }
        setSubmitting(true);
        const fd = new FormData();
        fd.append("title",       selEvent.title);
        fd.append("description", selEvent.description);
        fd.append("date",        selEvent.date?.split("T")[0] || selEvent.date);
        fd.append("location",    selEvent.location);
        fd.append("status",      selEvent.status);
        fd.append("maxGuests",   selEvent.maxGuests || 0);
        editExPhotos.forEach(url => fd.append("existingPhotos", url));
        editNewPhotos.forEach(f => fd.append("photos", f));
        try {
            const r = await fetch(`${API_EVENTS}/${selEvent._id}`, { method: "PUT", headers: authHeader(token), body: fd });
            const d = await r.json();
            if (d.success) {
                flash("success", "Event updated!");
                setShowEdit(false); setSelEvent(null); setEditExPhotos([]); setEditNewPhotos([]);
                fetchEvents();
            } else flash("error", d.message || "Failed to update");
        } catch { flash("error", "Network error — could not update event"); }
        finally { setSubmitting(false); }
    };

    // ── Delete Event ──────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this event and all its guests?")) return;
        try {
            const r = await fetch(`${API_EVENTS}/${id}`, { method: "DELETE", headers: authHeader(token) });
            if (r.ok) { flash("success", "Event deleted."); fetchEvents(); fetchGuests(); }
            else flash("error", "Failed to delete event");
        } catch { flash("error", "Network error"); }
    };

    // ── Guest helpers ─────────────────────────────────────────────────
    const addTempGuest = () => {
        if (!tempGuest.name || !tempGuest.email || !tempGuest.phone) { flash("error", "Fill name, email and phone"); return; }
        setNewEvGuests(p => [...p, { ...tempGuest }]); setTempGuest(blankGu);
    };

    const handleGuestStatusChange = (guestId, newStatus) =>
        setGuests(p => p.map(g => g._id === guestId ? { ...g, status: newStatus } : g));

    const openEdit = (ev) => { setSelEvent(ev); setEditExPhotos(ev.photos || []); setEditNewPhotos([]); setShowEdit(true); };
    const openDetail = (ev) => { setSelEvent(ev); setShowDetail(true); };

    // ─── Render ───────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/40 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Event Management</h1>
                    <p className="text-gray-400 mt-1 text-sm">Create events with photo galleries and manage guest lists</p>
                </div>

                {/* Toasts */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-5 flex items-center gap-2 shadow-sm">
                        <CheckIcon c="w-4 h-4 text-green-600" /> {success}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-5 flex items-center gap-2 shadow-sm">
                        <CloseIcon c="w-4 h-4 text-red-500" /> {error}
                    </div>
                )}

                {/* Create button */}
                <div className="flex justify-end mb-6">
                    <button onClick={() => setShowAdd(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg font-semibold transition">
                        <PlusIcon /> Create New Event
                    </button>
                </div>

                {/* ── Event Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full text-center py-20 text-gray-400 text-lg">Loading events…</div>
                    ) : !events.length ? (
                        <div className="col-span-full text-center py-20 text-gray-400">
                            <ImageIcon c="w-16 h-16 mx-auto mb-3 text-gray-200" />
                            <p className="font-medium text-lg">No events yet</p>
                            <p className="text-sm">Click "Create New Event" to get started</p>
                        </div>
                    ) : events.map(ev => {
                        const eg = eventGuests(ev._id);
                        return (
                            <div key={ev._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-200 flex flex-col group">
                                <EventCardGallery photos={ev.photos || []} />
                                <div className="p-4 flex flex-col flex-1">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="text-base font-bold text-gray-800 leading-tight line-clamp-1">{ev.title}</h3>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusCardColor(ev.status)}`}>{ev.status}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm line-clamp-2 mb-3 flex-1">{ev.description}</p>
                                    <div className="flex flex-wrap gap-1.5 text-xs mb-4">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">📅 {fmt(ev.date)}</span>
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">📍 {ev.location}</span>
                                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full">👥 {ev.guestCount ?? eg.length}</span>
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">🖼️ {(ev.photos || []).length}</span>
                                    </div>

                                    {/* ── Action row ── */}
                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                        {/* VIEW DETAILS — primary CTA */}
                                        <button onClick={() => openDetail(ev)}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm">
                                            <EyeIcon c="w-4 h-4" /> View Details
                                        </button>
                                        {/* Edit */}
                                        <button onClick={() => openEdit(ev)}
                                            className="border border-amber-200 text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition" title="Edit Event">
                                            <EditIcon c="w-4 h-4" />
                                        </button>
                                        {/* Delete */}
                                        <button onClick={() => handleDelete(ev._id)}
                                            className="border border-red-100 text-red-500 hover:bg-red-50 p-2 rounded-lg transition" title="Delete Event">
                                            <TrashIcon c="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ══ VIEW DETAILS MODAL ══════════════════════════════════════════ */}
            {showDetail && selEvent && (
                <ViewDetailsModal
                    event={selEvent}
                    token={token}
                    onClose={() => { setShowDetail(false); setSelEvent(null); }}
                    onEdit={() => { setShowDetail(false); openEdit(selEvent); }}
                    onGuestStatusChange={handleGuestStatusChange}
                />
            )}

            {/* ══ ADD EVENT MODAL ═════════════════════════════════════════════ */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2"><CalendarIcon c="w-5 h-5 text-indigo-600" /> Create New Event</h2>
                            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-700"><CloseIcon /></button>
                        </div>
                        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                            <form onSubmit={handleCreate} className="space-y-6">
                                {/* Event Details */}
                                <div className="bg-blue-50 p-4 rounded-xl space-y-4">
                                    <h3 className="font-semibold text-blue-800 flex items-center gap-2"><CalendarIcon c="w-4 h-4" /> Event Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input required type="text" placeholder="Event Title *" value={newEv.title} onChange={e => setNewEv({ ...newEv, title: e.target.value })} className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white w-full" />
                                        <input required type="date" value={newEv.date} onChange={e => setNewEv({ ...newEv, date: e.target.value })} className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white w-full" />
                                    </div>
                                    <textarea required rows={3} placeholder="Event Description *" value={newEv.description} onChange={e => setNewEv({ ...newEv, description: e.target.value })} className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input required type="text" placeholder="Venue / Location *" value={newEv.location} onChange={e => setNewEv({ ...newEv, location: e.target.value })} className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white w-full" />
                                        <select value={newEv.status} onChange={e => setNewEv({ ...newEv, status: e.target.value })} className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white w-full">
                                            {["Upcoming", "Ongoing", "Completed", "Cancelled"].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <input type="number" min="0" placeholder="Max Guests (0 = unlimited)" value={newEv.maxGuests} onChange={e => setNewEv({ ...newEv, maxGuests: e.target.value })} className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white" />
                                </div>
                                {/* Photos */}
                                <div className="bg-indigo-50 p-4 rounded-xl space-y-3">
                                    <h3 className="font-semibold text-indigo-800 flex items-center gap-2"><ImageIcon c="w-4 h-4" /> Event Photos (required)</h3>
                                    <MultiImagePicker value={newEvPhotos} onChange={setNewEvPhotos} label="Select 5–10 photos *" />
                                    {newEvPhotos.length > 0 && newEvPhotos.length < 5 && <p className="text-xs text-orange-600 font-medium">⚠ Add {5 - newEvPhotos.length} more</p>}
                                    {newEvPhotos.length >= 5 && <p className="text-xs text-green-600 font-medium">✓ {newEvPhotos.length} photos ready</p>}
                                </div>
                                {/* Guests */}
                                <div className="bg-purple-50 p-4 rounded-xl space-y-4">
                                    <h3 className="font-semibold text-purple-800 flex items-center gap-2"><UserAddIcon c="w-4 h-4" /> Add Guests (Optional)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input type="text" placeholder="Guest Name" value={tempGuest.name} onChange={e => setTempGuest({ ...tempGuest, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                                        <input type="email" placeholder="Email" value={tempGuest.email} onChange={e => setTempGuest({ ...tempGuest, email: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                                        <input type="tel" placeholder="Phone" value={tempGuest.phone} onChange={e => setTempGuest({ ...tempGuest, phone: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                                        <select value={tempGuest.status} onChange={e => setTempGuest({ ...tempGuest, status: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                                            {guestStatuses.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                        <input type="number" min="0" placeholder="Companions" value={tempGuest.numberOfCompanions} onChange={e => setTempGuest({ ...tempGuest, numberOfCompanions: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                                        <input type="text" placeholder="Dietary Restrictions" value={tempGuest.dietaryRestrictions} onChange={e => setTempGuest({ ...tempGuest, dietaryRestrictions: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                                        <textarea rows={2} placeholder="Notes" value={tempGuest.notes} onChange={e => setTempGuest({ ...tempGuest, notes: e.target.value })} className="px-3 py-2 border rounded-lg text-sm md:col-span-2" />
                                    </div>
                                    <button type="button" onClick={addTempGuest} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center gap-1"><PlusIcon c="w-4 h-4" /> Add to Guest List</button>
                                    {newEvGuests.length > 0 && (
                                        <div className="border rounded-xl overflow-hidden bg-white">
                                            <div className="bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800">{newEvGuests.length} Guest{newEvGuests.length > 1 ? "s" : ""} queued</div>
                                            <div className="divide-y max-h-40 overflow-y-auto">
                                                {newEvGuests.map((g, i) => (
                                                    <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                                                        <div><p className="font-medium">{g.name}</p><p className="text-gray-400 text-xs">{g.email} · {g.phone}</p></div>
                                                        <button type="button" onClick={() => setNewEvGuests(p => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><TrashIcon c="w-4 h-4" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 sticky bottom-0 bg-white pt-4 pb-1 border-t">
                                    <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2 border rounded-xl hover:bg-gray-50 text-gray-600">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold disabled:opacity-60">
                                        {submitting ? "Creating…" : `Create Event${newEvGuests.length > 0 ? ` + ${newEvGuests.length} Guest${newEvGuests.length > 1 ? "s" : ""}` : ""}`}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ EDIT EVENT MODAL ════════════════════════════════════════════ */}
            {showEdit && selEvent && (
                <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2"><EditIcon c="w-5 h-5 text-amber-500" /> Edit Event</h2>
                            <button onClick={() => { setShowEdit(false); setSelEvent(null); }} className="text-gray-400 hover:text-gray-700"><CloseIcon /></button>
                        </div>
                        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                            <form onSubmit={handleUpdate} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input required type="text" placeholder="Event Title" value={selEvent.title} onChange={e => setSelEvent({ ...selEvent, title: e.target.value })} className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-400 w-full" />
                                    <input required type="date" value={selEvent.date?.split("T")[0] || ""} onChange={e => setSelEvent({ ...selEvent, date: e.target.value })} className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-400 w-full" />
                                </div>
                                <textarea rows={3} value={selEvent.description} onChange={e => setSelEvent({ ...selEvent, description: e.target.value })} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-400" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder="Location" value={selEvent.location} onChange={e => setSelEvent({ ...selEvent, location: e.target.value })} className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-400 w-full" />
                                    <select value={selEvent.status} onChange={e => setSelEvent({ ...selEvent, status: e.target.value })} className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-400 w-full">
                                        {["Upcoming", "Ongoing", "Completed", "Cancelled"].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-xl space-y-4">
                                    <h3 className="font-semibold text-amber-800 flex items-center gap-2"><ImageIcon c="w-4 h-4" /> Manage Photos (5–10 total)</h3>
                                    <ExistingPhotosGallery photos={editExPhotos} onRemove={idx => setEditExPhotos(p => p.filter((_, i) => i !== idx))} />
                                    <MultiImagePicker value={editNewPhotos} onChange={setEditNewPhotos} existingUrls={editExPhotos} label={`Add New Photos (${editExPhotos.length + editNewPhotos.length}/10)`} />
                                    {editExPhotos.length + editNewPhotos.length < 5 && <p className="text-xs text-orange-600 font-medium">⚠ Need at least 5 photos total</p>}
                                </div>
                                <div className="flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t">
                                    <button type="button" onClick={() => { setShowEdit(false); setSelEvent(null); }} className="px-5 py-2 border rounded-xl hover:bg-gray-50 text-gray-600">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-6 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold disabled:opacity-60">{submitting ? "Saving…" : "Update Event"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEventGuestManager;