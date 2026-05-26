import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = ({ d, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);
const CalendarIcon  = ({ c }) => <Icon className={c||"w-5 h-5"} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />;
const GuestIcon     = ({ c }) => <Icon className={c||"w-5 h-5"} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />;
const EmailIcon     = ({ c }) => <Icon className={c||"w-4 h-4"} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
const PhoneIcon     = ({ c }) => <Icon className={c||"w-4 h-4"} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />;
const CloseIcon     = ({ c }) => <Icon className={c||"w-6 h-6"} d="M6 18L18 6M6 6l12 12" />;
const PlusIcon      = ({ c }) => <Icon className={c||"w-5 h-5"} d="M12 4v16m8-8H4" />;
const TrashIcon     = ({ c }) => <Icon className={c||"w-5 h-5"} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
const EditIcon      = ({ c }) => <Icon className={c||"w-5 h-5"} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />;
const EyeIcon       = ({ c }) => <Icon className={c||"w-5 h-5"} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />;
const UserAddIcon   = ({ c }) => <Icon className={c||"w-5 h-5"} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />;
const ImageIcon     = ({ c }) => <Icon className={c||"w-5 h-5"} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />;
const ChevronLeft   = ({ c }) => <Icon className={c||"w-6 h-6"} d="M15 19l-7-7 7-7" />;
const ChevronRight  = ({ c }) => <Icon className={c||"w-6 h-6"} d="M9 5l7 7-7 7" />;
const UploadIcon    = ({ c }) => <Icon className={c||"w-8 h-8"} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />;

// ─── Multi-Image Picker ───────────────────────────────────────────────────────
// Accepts files, shows grid preview, allows individual removal, enforces 5–10 limit
const MultiImagePicker = ({ value, onChange, existingUrls = [], label = "Event Photos (5–10 images)" }) => {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const MAX = 10;
    const MIN = 5;

    const addFiles = useCallback((incoming) => {
        const valid = Array.from(incoming).filter(f => f.type.startsWith("image/"));
        const merged = [...value, ...valid];
        if (merged.length > MAX) {
            alert(`You can select a maximum of ${MAX} photos. Only the first ${MAX} were kept.`);
            onChange(merged.slice(0, MAX));
        } else {
            onChange(merged);
        }
    }, [value, onChange]);

    const remove = (idx) => onChange(value.filter((_, i) => i !== idx));

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(e.dataTransfer.files);
    };

    const totalCount = existingUrls.length + value.length;
    const remaining = MAX - totalCount;
    const meetsMin = totalCount >= MIN;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">{label}</label>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    meetsMin ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                }`}>
                    {totalCount}/{MAX} selected {!meetsMin && `(need ${MIN - totalCount} more)`}
                </span>
            </div>

            {/* Drop zone */}
            {remaining > 0 && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-all
                        ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}`}
                >
                    <UploadIcon c="w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-500 font-medium">
                        Drop images here or <span className="text-blue-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG, WEBP · Max 5 MB each · {remaining} slot{remaining !== 1 ? "s" : ""} left</p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => addFiles(e.target.files)}
                    />
                </div>
            )}

            {/* New files grid */}
            {value.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {value.map((file, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                            <img
                                src={URL.createObjectURL(file)}
                                alt={`preview-${idx}`}
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay badge: index */}
                            <div className="absolute top-1 left-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {existingUrls.length + idx + 1}
                            </div>
                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); remove(idx); }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            >
                                <CloseIcon c="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                {file.name}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalCount === 0 && (
                <p className="text-xs text-gray-400 italic">No images selected yet.</p>
            )}
        </div>
    );
};

// ─── Image Gallery (for edit modal — shows existing Cloudinary URLs) ──────────
const ExistingPhotosGallery = ({ photos, onRemove }) => {
    if (!photos || photos.length === 0) return null;
    return (
        <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Existing Photos ({photos.length})</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {photos.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <img src={url} alt={`existing-${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {idx + 1}
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                            <CloseIcon c="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Event Card Photo Gallery (mini horizontal scroller + lightbox) ───────────
const EventCardGallery = ({ photos = [] }) => {
    const [lightbox, setLightbox] = useState(null); // index or null

    if (!photos || photos.length === 0) {
        return (
            <div className="w-full h-44 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center gap-2">
                <ImageIcon c="w-10 h-10 text-indigo-300" />
                <span className="text-xs text-indigo-400 font-medium">No photos</span>
            </div>
        );
    }

    const prev = () => setLightbox((l) => (l - 1 + photos.length) % photos.length);
    const next = () => setLightbox((l) => (l + 1) % photos.length);

    return (
        <>
            {/* Card thumbnail: first image large + count badge */}
            <div className="relative w-full h-44 cursor-pointer" onClick={() => setLightbox(0)}>
                <img src={photos[0]} alt="event" className="w-full h-full object-cover" />
                {photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <ImageIcon c="w-3 h-3" />
                        +{photos.length - 1} more
                    </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all flex items-center justify-center">
                    <EyeIcon c="w-8 h-8 text-white opacity-0 group-hover:opacity-100" />
                </div>
            </div>

            {/* Strip of thumbnails (2–5 visible) */}
            {photos.length > 1 && (
                <div className="flex gap-1 px-2 py-1 bg-gray-50 border-b overflow-x-auto scrollbar-hide">
                    {photos.map((url, i) => (
                        <img
                            key={i}
                            src={url}
                            alt={`thumb-${i}`}
                            onClick={() => setLightbox(i)}
                            className={`w-10 h-10 object-cover rounded cursor-pointer flex-shrink-0 border-2 transition-all ${
                                i === 0 ? "border-blue-500" : "border-transparent hover:border-blue-300"
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightbox !== null && (
                <div
                    className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); prev(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition"
                    >
                        <ChevronLeft c="w-7 h-7" />
                    </button>

                    <div onClick={(e) => e.stopPropagation()} className="relative max-w-3xl w-full">
                        <img
                            src={photos[lightbox]}
                            alt={`lightbox-${lightbox}`}
                            className="w-full max-h-[80vh] object-contain rounded-lg"
                        />
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                            {lightbox + 1} / {photos.length}
                        </div>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); next(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition"
                    >
                        <ChevronRight c="w-7 h-7" />
                    </button>

                    <button
                        onClick={() => setLightbox(null)}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2"
                    >
                        <CloseIcon c="w-5 h-5" />
                    </button>

                    {/* Thumbnail strip in lightbox */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-sm overflow-x-auto px-2">
                        {photos.map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt={`lb-thumb-${i}`}
                                onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
                                className={`w-12 h-12 object-cover rounded cursor-pointer border-2 transition-all flex-shrink-0 ${
                                    i === lightbox ? "border-blue-400 scale-110" : "border-white/40 hover:border-white"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const AdminEventGuestManager = () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-xl text-gray-600">Admin login required</p>
                </div>
            </div>
        );
    }

    const API_BASE_EVENTS = "https://crm-backend-v2.onrender.com/events";
    const API_BASE_GUESTS = "https://crm-backend-v2.onrender.com/api/guests"; 

    // ── State ──────────────────────────────────────────────────────────────────
    const [events, setEvents]                               = useState([]);
    const [guests, setGuests]                               = useState([]);
    const [eventLoading, setEventLoading]                   = useState(false);
    const [guestLoading, setGuestLoading]                   = useState(false);
    const [error, setError]                                 = useState("");
    const [success, setSuccess]                             = useState("");

    // Modals
    const [isAddEventModalOpen, setIsAddEventModalOpen]                 = useState(false);
    const [isEditEventModalOpen, setIsEditEventModalOpen]               = useState(false);
    const [isViewEventGuestsModalOpen, setIsViewEventGuestsModalOpen]   = useState(false);
    const [selectedEvent, setSelectedEvent]                             = useState(null);
    const [selectedEventForGuests, setSelectedEventForGuests]           = useState(null);

    // New event form
    const blankEvent = { title: "", description: "", date: "", location: "", status: "Upcoming", maxGuests: "" };
    const [newEvent, setNewEvent]       = useState(blankEvent);
    const [newEventPhotos, setNewEventPhotos]   = useState([]); // File[]

    // Edit event photos
    const [editExistingPhotos, setEditExistingPhotos]   = useState([]); // kept Cloudinary URLs
    const [editNewPhotos, setEditNewPhotos]             = useState([]); // new File[]

    // Guest form
    const blankGuest = { name: "", email: "", phone: "", status: "Pending", numberOfCompanions: 0, dietaryRestrictions: "", notes: "" };
    const [tempGuest, setTempGuest]     = useState(blankGuest);
    const [newEventGuests, setNewEventGuests] = useState([]);

    const [submitting, setSubmitting]   = useState(false);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const guestStatuses = ["Confirmed", "Pending", "Cancelled"];

    const flash = (type, msg) => {
        if (type === "success") { setSuccess(msg); setError(""); }
        else { setError(msg); setSuccess(""); }
        setTimeout(() => { setSuccess(""); setError(""); }, 4000);
    };

    const getStatusColor = (status) => ({
        Confirmed: "text-green-700 bg-green-50 border-green-200",
        Pending:   "text-yellow-700 bg-yellow-50 border-yellow-200",
        Cancelled: "text-red-700 bg-red-50 border-red-200",
    }[status] || "text-gray-700 bg-gray-50 border-gray-200");

    const getEventStatusBadge = (status) => ({
        Upcoming:  "bg-blue-100 text-blue-700",
        Ongoing:   "bg-green-100 text-green-700",
        Completed: "bg-gray-100 text-gray-700",
        Cancelled: "bg-red-100 text-red-700",
    }[status] || "bg-gray-100 text-gray-700");

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

    const getEventGuests = (eventId) =>
        guests.filter((g) => {
            const id = g.eventId?._id || g.eventId;
            return id === eventId || id?.toString() === eventId?.toString();
        });

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchEvents = async () => {
        setEventLoading(true);
        try {
            const res  = await fetch(API_BASE_EVENTS, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setEvents(data.events || []);
        } catch { flash("error", "Failed to fetch events"); }
        finally { setEventLoading(false); }
    };

    const fetchGuests = async () => {
        setGuestLoading(true);
        try {
            const res  = await fetch(API_BASE_GUESTS, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setGuests(data.guests || []);
        } catch { flash("error", "Failed to fetch guests"); }
        finally { setGuestLoading(false); }
    };

    useEffect(() => { fetchEvents(); fetchGuests(); }, []);

    // ── Create Event ───────────────────────────────────────────────────────────
    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (newEventPhotos.length < 5) {
            flash("error", `Please select at least 5 photos (you have ${newEventPhotos.length}).`);
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append("title",       newEvent.title);
        formData.append("description", newEvent.description);
        formData.append("date",        newEvent.date);
        formData.append("location",    newEvent.location);
        formData.append("status",      newEvent.status);
        if (newEvent.maxGuests) formData.append("maxGuests", newEvent.maxGuests);
        newEventPhotos.forEach((f) => formData.append("photos", f));  // key must match multer field name

        try {
            const res  = await fetch(API_BASE_EVENTS, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();

            if (data.success) {
                // Add guests one by one
                for (const g of newEventGuests) {
                    await fetch(API_BASE_GUESTS, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ ...g, eventId: data.event._id }),
                    });
                }
                flash("success", "Event created successfully!");
                setIsAddEventModalOpen(false);
                setNewEvent(blankEvent);
                setNewEventPhotos([]);
                setNewEventGuests([]);
                setTempGuest(blankGuest);
                fetchEvents(); fetchGuests();
            } else {
                flash("error", data.message || "Failed to create event");
            }
        } catch { flash("error", "Error creating event"); }
        finally { setSubmitting(false); }
    };

    // ── Update Event ───────────────────────────────────────────────────────────
    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        const totalPhotos = editExistingPhotos.length + editNewPhotos.length;
        if (totalPhotos < 5) {
            flash("error", `Please ensure at least 5 photos total (you have ${totalPhotos}).`);
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append("title",       selectedEvent.title);
        formData.append("description", selectedEvent.description);
        formData.append("date",        selectedEvent.date?.split("T")[0] || selectedEvent.date);
        formData.append("location",    selectedEvent.location);
        formData.append("status",      selectedEvent.status);
        formData.append("maxGuests",   selectedEvent.maxGuests || 0);

        // Tell backend which existing photos to keep
        editExistingPhotos.forEach((url) => formData.append("existingPhotos", url));
        editNewPhotos.forEach((f) => formData.append("photos", f));

        try {
            const res  = await fetch(`${API_BASE_EVENTS}/${selectedEvent._id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();

            if (data.success) {
                flash("success", "Event updated!");
                setIsEditEventModalOpen(false);
                setSelectedEvent(null);
                setEditExistingPhotos([]);
                setEditNewPhotos([]);
                fetchEvents();
            } else {
                flash("error", data.message || "Failed to update event");
            }
        } catch { flash("error", "Error updating event"); }
        finally { setSubmitting(false); }
    };

    // ── Delete Event ───────────────────────────────────────────────────────────
    const handleDeleteEvent = async (id) => {
        if (!window.confirm("Delete this event and all its guests? This cannot be undone.")) return;
        try {
            const res = await fetch(`${API_BASE_EVENTS}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { flash("success", "Event deleted."); fetchEvents(); fetchGuests(); }
            else        { flash("error", "Failed to delete event"); }
        } catch { flash("error", "Error deleting event"); }
    };

    // ── Guest helpers ──────────────────────────────────────────────────────────
    const addTempGuest = () => {
        if (!tempGuest.name || !tempGuest.email || !tempGuest.phone) {
            flash("error", "Please fill guest name, email and phone");
            return;
        }
        setNewEventGuests((prev) => [...prev, { ...tempGuest }]);
        setTempGuest(blankGuest);
    };

    const handleUpdateGuestStatus = async (id, newStatus) => {
        try {
            const res  = await fetch(`${API_BASE_GUESTS}/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setGuests((prev) => prev.map((g) => g._id === id ? { ...g, status: newStatus } : g));
                flash("success", `Status updated to ${newStatus}`);
            }
        } catch { flash("error", "Error updating status"); }
    };

    // ── Open Edit Modal ────────────────────────────────────────────────────────
    const openEditModal = (event) => {
        setSelectedEvent(event);
        setEditExistingPhotos(event.photos || []);
        setEditNewPhotos([]);
        setIsEditEventModalOpen(true);
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Event Management</h1>
                    <p className="text-gray-500 mt-1">Create events with photo galleries and manage guest lists</p>
                </div>

                {/* Toasts */}
                {success && (
                    <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-xl mb-5 flex items-center gap-2 shadow-sm">
                        <span className="text-green-500 font-bold text-lg">✓</span> {success}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl mb-5 flex items-center gap-2 shadow-sm">
                        <span className="text-red-500 font-bold text-lg">✕</span> {error}
                    </div>
                )}

                {/* Create button */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => setIsAddEventModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg font-semibold"
                    >
                        <PlusIcon /> Create New Event
                    </button>
                </div>

                {/* ── Events Grid ────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventLoading ? (
                        <div className="col-span-full text-center py-16 text-gray-400 text-lg">Loading events…</div>
                    ) : events.length === 0 ? (
                        <div className="col-span-full text-center py-16 text-gray-400">
                            <ImageIcon c="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No events yet</p>
                            <p className="text-sm">Click "Create New Event" to get started</p>
                        </div>
                    ) : (
                        events.map((event) => {
                            const eventGuests = getEventGuests(event._id);
                            return (
                                <div key={event._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
                                    {/* Gallery */}
                                    <EventCardGallery photos={event.photos || []} />

                                    <div className="p-4">
                                        {/* Status badge + title */}
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-gray-800 leading-tight">{event.title}</h3>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getEventStatusBadge(event.status)}`}>
                                                {event.status}
                                            </span>
                                        </div>

                                        <p className="text-gray-500 text-sm line-clamp-2 mb-3">{event.description}</p>

                                        <div className="flex flex-wrap gap-1.5 text-xs mb-4">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">📅 {formatDate(event.date)}</span>
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">📍 {event.location}</span>
                                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full">👥 {event.guestCount || eventGuests.length} guests</span>
                                            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">🖼️ {(event.photos || []).length} photos</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => { setSelectedEventForGuests(event); setIsViewEventGuestsModalOpen(true); }}
                                                className="text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1 font-medium"
                                            >
                                                <GuestIcon c="w-4 h-4" /> Guests ({event.guestCount || eventGuests.length})
                                            </button>
                                            <div className="flex gap-1">
                                                <button onClick={() => openEditModal(event)} className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition" title="Edit">
                                                    <EditIcon c="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteEvent(event._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition" title="Delete">
                                                    <TrashIcon c="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ══════════════════ ADD EVENT MODAL ══════════════════ */}
            {isAddEventModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CalendarIcon c="w-5 h-5 text-blue-600" /> Create New Event
                            </h2>
                            <button onClick={() => setIsAddEventModalOpen(false)} className="text-gray-400 hover:text-gray-700"><CloseIcon /></button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                            <form onSubmit={handleAddEvent} className="space-y-6">

                                {/* Event Details */}
                                <div className="bg-blue-50 p-4 rounded-xl space-y-4">
                                    <h3 className="font-semibold text-blue-800 flex items-center gap-2"><CalendarIcon c="w-4 h-4" /> Event Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input required type="text" placeholder="Event Title *" value={newEvent.title}
                                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                            className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white w-full" />
                                        <input required type="date" value={newEvent.date}
                                            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                            className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white w-full" />
                                    </div>
                                    <textarea required rows={3} placeholder="Event Description *" value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                        className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input required type="text" placeholder="Venue / Location *" value={newEvent.location}
                                            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                            className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white w-full" />
                                        <select value={newEvent.status}
                                            onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
                                            className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white w-full">
                                            {["Upcoming","Ongoing","Completed","Cancelled"].map((s) => (
                                                <option key={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <input type="number" min="0" placeholder="Max Guests (0 = unlimited)"
                                        value={newEvent.maxGuests}
                                        onChange={(e) => setNewEvent({ ...newEvent, maxGuests: e.target.value })}
                                        className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white" />
                                </div>

                                {/* ── Multi-image picker ── */}
                                <div className="bg-indigo-50 p-4 rounded-xl space-y-3">
                                    <h3 className="font-semibold text-indigo-800 flex items-center gap-2"><ImageIcon c="w-4 h-4" /> Event Photos</h3>
                                    <MultiImagePicker value={newEventPhotos} onChange={setNewEventPhotos} label="Select 5–10 event photos *" />
                                    {newEventPhotos.length > 0 && newEventPhotos.length < 5 && (
                                        <p className="text-xs text-orange-600 font-medium">⚠ Add {5 - newEventPhotos.length} more photo(s) to meet the minimum requirement.</p>
                                    )}
                                    {newEventPhotos.length >= 5 && (
                                        <p className="text-xs text-green-600 font-medium">✓ Photo count is valid ({newEventPhotos.length} selected)</p>
                                    )}
                                </div>

                                {/* ── Guest Section ── */}
                                <div className="bg-purple-50 p-4 rounded-xl space-y-4">
                                    <h3 className="font-semibold text-purple-800 flex items-center gap-2"><UserAddIcon c="w-4 h-4" /> Add Guests (Optional)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input type="text" placeholder="Guest Name" value={tempGuest.name}
                                            onChange={(e) => setTempGuest({ ...tempGuest, name: e.target.value })}
                                            className="px-3 py-2 border rounded-lg text-sm" />
                                        <input type="email" placeholder="Email" value={tempGuest.email}
                                            onChange={(e) => setTempGuest({ ...tempGuest, email: e.target.value })}
                                            className="px-3 py-2 border rounded-lg text-sm" />
                                        <input type="tel" placeholder="Phone" value={tempGuest.phone}
                                            onChange={(e) => setTempGuest({ ...tempGuest, phone: e.target.value })}
                                            className="px-3 py-2 border rounded-lg text-sm" />
                                        <select value={tempGuest.status}
                                            onChange={(e) => setTempGuest({ ...tempGuest, status: e.target.value })}
                                            className="px-3 py-2 border rounded-lg text-sm">
                                            {guestStatuses.map((s) => <option key={s}>{s}</option>)}
                                        </select>
                                        <input type="number" min="0" placeholder="Companions" value={tempGuest.numberOfCompanions}
                                            onChange={(e) => setTempGuest({ ...tempGuest, numberOfCompanions: e.target.value })}
                                            className="px-3 py-2 border rounded-lg text-sm" />
                                        <input type="text" placeholder="Dietary Restrictions" value={tempGuest.dietaryRestrictions}
                                            onChange={(e) => setTempGuest({ ...tempGuest, dietaryRestrictions: e.target.value })}
                                            className="px-3 py-2 border rounded-lg text-sm" />
                                        <textarea rows={2} placeholder="Notes" value={tempGuest.notes}
                                            onChange={(e) => setTempGuest({ ...tempGuest, notes: e.target.value })}
                                            className="px-3 py-2 border rounded-lg text-sm md:col-span-2" />
                                    </div>
                                    <button type="button" onClick={addTempGuest}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center gap-1">
                                        <PlusIcon c="w-4 h-4" /> Add to Guest List
                                    </button>

                                    {newEventGuests.length > 0 && (
                                        <div className="border rounded-xl overflow-hidden bg-white">
                                            <div className="bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800">
                                                {newEventGuests.length} Guest{newEventGuests.length > 1 ? "s" : ""} queued
                                            </div>
                                            <div className="divide-y max-h-48 overflow-y-auto">
                                                {newEventGuests.map((g, i) => (
                                                    <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                                                        <div>
                                                            <p className="font-medium">{g.name}</p>
                                                            <p className="text-gray-400 text-xs">{g.email} · {g.phone}</p>
                                                        </div>
                                                        <button type="button" onClick={() => setNewEventGuests((prev) => prev.filter((_, j) => j !== i))}
                                                            className="text-red-400 hover:text-red-600"><TrashIcon c="w-4 h-4" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 sticky bottom-0 bg-white pt-4 pb-1 border-t">
                                    <button type="button" onClick={() => setIsAddEventModalOpen(false)}
                                        className="px-5 py-2 border rounded-xl hover:bg-gray-50 text-gray-600">Cancel</button>
                                    <button type="submit" disabled={submitting}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold disabled:opacity-60">
                                        {submitting ? "Creating…" : `Create Event${newEventGuests.length > 0 ? ` & ${newEventGuests.length} Guest${newEventGuests.length > 1 ? "s" : ""}` : ""}`}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════ EDIT EVENT MODAL ══════════════════ */}
            {isEditEventModalOpen && selectedEvent && (
                <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <EditIcon c="w-5 h-5 text-amber-500" /> Edit Event
                            </h2>
                            <button onClick={() => { setIsEditEventModalOpen(false); setSelectedEvent(null); }}
                                className="text-gray-400 hover:text-gray-700"><CloseIcon /></button>
                        </div>

                        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                            <form onSubmit={handleUpdateEvent} className="space-y-5">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input required type="text" placeholder="Event Title" value={selectedEvent.title}
                                        onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                                        className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-400 w-full" />
                                    <input required type="date" value={selectedEvent.date?.split("T")[0] || ""}
                                        onChange={(e) => setSelectedEvent({ ...selectedEvent, date: e.target.value })}
                                        className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-400 w-full" />
                                </div>
                                <textarea rows={3} value={selectedEvent.description}
                                    onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-400" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder="Location" value={selectedEvent.location}
                                        onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })}
                                        className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-400 w-full" />
                                    <select value={selectedEvent.status}
                                        onChange={(e) => setSelectedEvent({ ...selectedEvent, status: e.target.value })}
                                        className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-400 w-full">
                                        {["Upcoming","Ongoing","Completed","Cancelled"].map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>

                                {/* Photo management */}
                                <div className="bg-amber-50 p-4 rounded-xl space-y-4">
                                    <h3 className="font-semibold text-amber-800 flex items-center gap-2"><ImageIcon c="w-4 h-4" /> Manage Photos</h3>
                                    <p className="text-xs text-gray-500">Remove existing photos or add new ones. Total must be 5–10.</p>

                                    <ExistingPhotosGallery
                                        photos={editExistingPhotos}
                                        onRemove={(idx) => setEditExistingPhotos((prev) => prev.filter((_, i) => i !== idx))}
                                    />

                                    <MultiImagePicker
                                        value={editNewPhotos}
                                        onChange={setEditNewPhotos}
                                        existingUrls={editExistingPhotos}
                                        label={`Add More Photos (${editExistingPhotos.length + editNewPhotos.length}/10 total)`}
                                    />

                                    {editExistingPhotos.length + editNewPhotos.length < 5 && (
                                        <p className="text-xs text-orange-600">⚠ Need at least 5 photos total.</p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t">
                                    <button type="button"
                                        onClick={() => { setIsEditEventModalOpen(false); setSelectedEvent(null); }}
                                        className="px-5 py-2 border rounded-xl hover:bg-gray-50 text-gray-600">Cancel</button>
                                    <button type="submit" disabled={submitting}
                                        className="px-6 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold disabled:opacity-60">
                                        {submitting ? "Saving…" : "Update Event"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════ VIEW GUESTS MODAL ══════════════════ */}
            {isViewEventGuestsModalOpen && selectedEventForGuests && (
                <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{selectedEventForGuests.title}</h2>
                                <p className="text-sm text-gray-500">Guest List</p>
                            </div>
                            <button onClick={() => setIsViewEventGuestsModalOpen(false)} className="text-gray-400 hover:text-gray-700"><CloseIcon /></button>
                        </div>

                        <div className="p-6">
                            {getEventGuests(selectedEventForGuests._id).length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <GuestIcon c="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No guests yet for this event.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {getEventGuests(selectedEventForGuests._id).map((guest) => (
                                        <div key={guest._id} className="bg-gray-50 border rounded-xl p-4 flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                    {guest.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{guest.name}</p>
                                                    <div className="text-sm text-gray-500 flex flex-wrap gap-3 mt-0.5">
                                                        <span className="flex items-center gap-1"><EmailIcon /> {guest.email}</span>
                                                        <span className="flex items-center gap-1"><PhoneIcon /> {guest.phone}</span>
                                                    </div>
                                                    {guest.dietaryRestrictions && (
                                                        <p className="text-xs text-gray-400 mt-1">🍽️ {guest.dietaryRestrictions}</p>
                                                    )}
                                                    {guest.notes && (
                                                        <p className="text-xs text-gray-400 mt-0.5">📝 {guest.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 space-y-1">
                                                <select
                                                    value={guest.status}
                                                    onChange={(e) => handleUpdateGuestStatus(guest._id, e.target.value)}
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none ${getStatusColor(guest.status)}`}
                                                >
                                                    {guestStatuses.map((s) => <option key={s}>{s}</option>)}
                                                </select>
                                                <p className="text-xs text-gray-400">+{guest.numberOfCompanions} companion{guest.numberOfCompanions !== 1 ? "s" : ""}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEventGuestManager;