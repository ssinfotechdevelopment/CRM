import React, { useState, useEffect } from "react";

// === SVG Icons ===
const CalendarIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const GuestIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const EmailIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const PhoneIcon = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const CloseIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EditIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const EyeIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const UserAddIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
);

// === Main Admin Component ===
const AdminEventGuestManager = () => {
    // Auth check
    const token = localStorage.getItem("adminToken");
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-xl">Admin login required</p>
                </div>
            </div>
        );
    }

    // API Base URLs
    const API_BASE_EVENTS = "http://localhost:5000/api/events";
    const API_BASE_GUESTS = "http://localhost:5000/api/guests";

    // State for Events
    const [events, setEvents] = useState([]);
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventLoading, setEventLoading] = useState(false);
    const [selectedEventForGuests, setSelectedEventForGuests] = useState(null);
    const [isViewEventGuestsModalOpen, setIsViewEventGuestsModalOpen] = useState(false);

    // State for Guests (only for viewing)
    const [guests, setGuests] = useState([]);
    const [guestLoading, setGuestLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Guest Status Options
    const guestStatuses = ["Confirmed", "Pending", "Cancelled"];

    // New Event Form State
    const [newEvent, setNewEvent] = useState({
        title: "",
        description: "",
        date: "",
        location: "",
        photo: null,
        photoPreview: "",
        guests: [] // Guests to be added with this event
    });

    // Guest form within event modal
    const [tempGuest, setTempGuest] = useState({
        name: "",
        email: "",
        phone: "",
        status: "Pending",
        numberOfCompanions: 0,
        dietaryRestrictions: "",
        notes: "",
    });

    // ==================== EVENT FUNCTIONS ====================
    const fetchEvents = async () => {
        setEventLoading(true);
        try {
            const res = await fetch(API_BASE_EVENTS, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setEvents(data.events || []);
            }
        } catch (err) {
            setError("Failed to fetch events");
        } finally {
            setEventLoading(false);
        }
    };

    const fetchGuests = async () => {
        setGuestLoading(true);
        try {
            const res = await fetch(API_BASE_GUESTS, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setGuests(data.guests || []);
            }
        } catch (err) {
            setError("Failed to fetch guests");
        } finally {
            setGuestLoading(false);
        }
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", newEvent.title);
        formData.append("description", newEvent.description);
        formData.append("date", newEvent.date);
        formData.append("location", newEvent.location);
        if (newEvent.photo) formData.append("photo", newEvent.photo);

        try {
            const res = await fetch(API_BASE_EVENTS, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                const createdEvent = data.event;

                // Add all guests to the new event
                if (newEvent.guests.length > 0) {
                    for (const guest of newEvent.guests) {
                        await fetch(API_BASE_GUESTS, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({
                                ...guest,
                                eventId: createdEvent._id,
                            })
                        });
                    }
                }

                setEvents(prev => [createdEvent, ...prev]);
                setIsAddEventModalOpen(false);
                setNewEvent({
                    title: "", description: "", date: "", location: "",
                    photo: null, photoPreview: "", guests: []
                });
                setTempGuest({ name: "", email: "", phone: "", status: "Pending", numberOfCompanions: 0, dietaryRestrictions: "", notes: "" });
                setSuccess("Event added successfully!");
                setTimeout(() => setSuccess(""), 3000);
                fetchEvents();
                fetchGuests();
            } else {
                setError(data.message || "Failed to add event");
            }
        } catch (err) {
            setError("Error adding event");
        }
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", selectedEvent.title);
        formData.append("description", selectedEvent.description);
        formData.append("date", selectedEvent.date);
        formData.append("location", selectedEvent.location);
        if (selectedEvent.photoFile) formData.append("photo", selectedEvent.photoFile);

        try {
            const res = await fetch(`${API_BASE_EVENTS}/${selectedEvent._id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setEvents(prev => prev.map(ev => ev._id === selectedEvent._id ? data.event : ev));
                setIsEditEventModalOpen(false);
                setSelectedEvent(null);
                setSuccess("Event updated successfully!");
                setTimeout(() => setSuccess(""), 3000);
                fetchEvents();
            } else {
                setError(data.message || "Failed to update event");
            }
        } catch (err) {
            setError("Error updating event");
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm("Delete this event permanently? All guests for this event will also be deleted.")) return;
        try {
            const res = await fetch(`${API_BASE_EVENTS}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setEvents(prev => prev.filter(ev => ev._id !== id));
                setSuccess("Event deleted!");
                setTimeout(() => setSuccess(""), 3000);
                fetchEvents();
                fetchGuests();
            } else {
                setError("Failed to delete event");
            }
        } catch (err) {
            setError("Error deleting event");
        }
    };

    // Add temporary guest to event during creation
    const addTempGuest = () => {
        if (!tempGuest.name || !tempGuest.email || !tempGuest.phone) {
            setError("Please fill guest name, email and phone");
            return;
        }
        setNewEvent(prev => ({
            ...prev,
            guests: [...prev.guests, { ...tempGuest }]
        }));
        setTempGuest({
            name: "",
            email: "",
            phone: "",
            status: "Pending",
            numberOfCompanions: 0,
            dietaryRestrictions: "",
            notes: "",
        });
        setSuccess("Guest added to event!");
        setTimeout(() => setSuccess(""), 2000);
    };

    const removeTempGuest = (index) => {
        setNewEvent(prev => ({
            ...prev,
            guests: prev.guests.filter((_, i) => i !== index)
        }));
    };

    // View guests for a specific event
    const viewEventGuests = (event) => {
        setSelectedEventForGuests(event);
        setIsViewEventGuestsModalOpen(true);
    };

    const getEventGuests = (eventId) => {
        return guests.filter(guest => guest.eventId === eventId);
    };

    const handleUpdateGuestStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`${API_BASE_GUESTS}/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setGuests(prev => prev.map(g => g._id === id ? { ...g, status: newStatus } : g));
                setSuccess(`Guest status updated to ${newStatus}`);
                setTimeout(() => setSuccess(""), 3000);
            }
        } catch (err) {
            setError("Error updating status");
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchGuests();
    }, []);

    // Helper for status color
    const getStatusColor = (status) => {
        const map = {
            Confirmed: "text-green-600 bg-green-50 border-green-200",
            Pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
            Cancelled: "text-red-600 bg-red-50 border-red-200"
        };
        return map[status] || "text-gray-600 bg-gray-50 border-gray-200";
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not set";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Event Management</h1>
                    <p className="text-gray-600 text-lg">Create events and manage guest lists</p>
                </div>

                {/* Success/Error Messages */}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>}
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

                {/* Add Event Button */}
                <div className="mb-6 flex justify-end">
                    <button onClick={() => setIsAddEventModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition shadow-lg">
                        <PlusIcon /> Create New Event
                    </button>
                </div>

                {/* ==================== EVENTS LIST ==================== */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventLoading ? (
                        <div className="col-span-full text-center py-12">Loading events...</div>
                    ) : (
                        events.map(event => {
                            const eventGuests = getEventGuests(event._id);
                            return (
                                <div key={event._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
                                    {event.photoUrl && (
                                        <img src={event.photoUrl} alt={event.title} className="w-full h-48 object-cover" />
                                    )}
                                    <div className="p-5">
                                        <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
                                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{event.description}</p>
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">📅 {formatDate(event.date)}</span>
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">📍 {event.location}</span>
                                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">👥 {eventGuests.length} Guests</span>
                                        </div>
                                        <div className="mt-4 flex justify-between items-center">
                                            <button
                                                onClick={() => viewEventGuests(event)}
                                                className="text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg text-sm transition flex items-center gap-1"
                                            >
                                                <EyeIcon className="w-4 h-4" /> View Guests ({eventGuests.length})
                                            </button>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setSelectedEvent(event); setIsEditEventModalOpen(true); }} className="text-yellow-600 hover:bg-yellow-50 p-2 rounded-lg transition">
                                                    <EditIcon />
                                                </button>
                                                <button onClick={() => handleDeleteEvent(event._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition">
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {events.length === 0 && !eventLoading && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No events yet. Click "Create New Event" to get started.
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== ADD EVENT MODAL WITH GUEST OPTION ==================== */}
            {isAddEventModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <h2 className="text-2xl font-bold flex items-center gap-2"><CalendarIcon className="w-6 h-6" /> Create New Event</h2>
                            <button onClick={() => setIsAddEventModalOpen(false)} className="text-gray-500 hover:text-gray-700"><CloseIcon /></button>
                        </div>

                        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                            <form onSubmit={handleAddEvent} className="space-y-5">
                                {/* Event Details */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                        <CalendarIcon className="w-5 h-5" /> Event Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="text" required placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        <input type="date" required value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <textarea rows="3" placeholder="Event Description" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mt-4" />
                                    <input type="text" placeholder="Venue / Location" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mt-4" />
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Photo / Flyer (Optional)</label>
                                        <input type="file" accept="image/*" onChange={e => setNewEvent({ ...newEvent, photo: e.target.files[0], photoPreview: URL.createObjectURL(e.target.files[0]) })} className="w-full" />
                                        {newEvent.photoPreview && <img src={newEvent.photoPreview} alt="Preview" className="mt-2 h-32 object-cover rounded" />}
                                    </div>
                                </div>

                                {/* Add Guests Section */}
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                        <UserAddIcon /> Add Guests to this Event
                                    </h3>

                                    <p className="text-sm text-gray-600 mb-3">You can add multiple guests. All fields marked with * are required.</p>

                                    {/* Guest Form */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                        <input type="text" placeholder="Guest Name *" value={tempGuest.name} onChange={e => setTempGuest({ ...tempGuest, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                                        <input type="email" placeholder="Email *" value={tempGuest.email} onChange={e => setTempGuest({ ...tempGuest, email: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                                        <input type="tel" placeholder="Phone *" value={tempGuest.phone} onChange={e => setTempGuest({ ...tempGuest, phone: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                                        <select value={tempGuest.status} onChange={e => setTempGuest({ ...tempGuest, status: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                                            {guestStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <input type="number" placeholder="Number of Companions" value={tempGuest.numberOfCompanions} onChange={e => setTempGuest({ ...tempGuest, numberOfCompanions: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                                        <input type="text" placeholder="Dietary Restrictions (Vegetarian, Allergies, etc.)" value={tempGuest.dietaryRestrictions} onChange={e => setTempGuest({ ...tempGuest, dietaryRestrictions: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                                        <textarea placeholder="Additional Notes" value={tempGuest.notes} onChange={e => setTempGuest({ ...tempGuest, notes: e.target.value })} className="px-3 py-2 border rounded-lg text-sm md:col-span-2" rows="2"></textarea>
                                    </div>

                                    <button type="button" onClick={addTempGuest} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition flex items-center gap-2">
                                        <PlusIcon className="w-4 h-4" /> Add Guest to List
                                    </button>

                                    {/* Guest List */}
                                    {newEvent.guests.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="font-medium text-gray-700 mb-2">Guests to be added ({newEvent.guests.length})</h4>
                                            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2 bg-white">
                                                {newEvent.guests.map((guest, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg border-b last:border-0">
                                                        <div>
                                                            <p className="font-medium text-sm">{guest.name}</p>
                                                            <p className="text-xs text-gray-500">{guest.email} | {guest.phone}</p>
                                                            {guest.dietaryRestrictions && <p className="text-xs text-gray-400">🍽️ {guest.dietaryRestrictions}</p>}
                                                        </div>
                                                        <button type="button" onClick={() => removeTempGuest(idx)} className="text-red-500 hover:text-red-700">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white py-4 border-t">
                                    <button type="button" onClick={() => setIsAddEventModalOpen(false)} className="px-5 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                        {newEvent.guests.length > 0 ? `Create Event & Add ${newEvent.guests.length} Guest${newEvent.guests.length > 1 ? 's' : ''}` : "Create Event"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== EDIT EVENT MODAL ==================== */}
            {isEditEventModalOpen && selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-2xl font-bold flex items-center gap-2"><EditIcon /> Edit Event</h2>
                            <button onClick={() => { setIsEditEventModalOpen(false); setSelectedEvent(null); }} className="text-gray-500 hover:text-gray-700"><CloseIcon /></button>
                        </div>
                        <form onSubmit={handleUpdateEvent} className="space-y-4">
                            <input type="text" required value={selectedEvent.title} onChange={e => setSelectedEvent({ ...selectedEvent, title: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500" />
                            <textarea rows="3" value={selectedEvent.description} onChange={e => setSelectedEvent({ ...selectedEvent, description: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500" />
                            <input type="date" required value={selectedEvent.date?.split("T")[0]} onChange={e => setSelectedEvent({ ...selectedEvent, date: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500" />
                            <input type="text" value={selectedEvent.location} onChange={e => setSelectedEvent({ ...selectedEvent, location: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Change Photo (optional)</label>
                                <input type="file" accept="image/*" onChange={e => setSelectedEvent({ ...selectedEvent, photoFile: e.target.files[0] })} className="w-full" />
                                {selectedEvent.photoUrl && <img src={selectedEvent.photoUrl} alt="Current" className="mt-2 h-32 object-cover rounded" />}
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => { setIsEditEventModalOpen(false); setSelectedEvent(null); }} className="px-5 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Update Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== VIEW EVENT GUESTS MODAL ==================== */}
            {isViewEventGuestsModalOpen && selectedEventForGuests && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">
                                Guests for: {selectedEventForGuests.title}
                            </h2>
                            <button onClick={() => setIsViewEventGuestsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-6">
                            {getEventGuests(selectedEventForGuests._id).length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No guests added to this event yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {getEventGuests(selectedEventForGuests._id).map(guest => (
                                        <div key={guest._id} className="bg-gray-50 rounded-lg p-4 border">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                                                        {guest.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{guest.name}</h3>
                                                        <div className="text-sm text-gray-600 flex flex-wrap gap-3 mt-1">
                                                            <span className="flex items-center gap-1"><EmailIcon /> {guest.email}</span>
                                                            <span className="flex items-center gap-1"><PhoneIcon /> {guest.phone}</span>
                                                        </div>
                                                        {guest.dietaryRestrictions && (
                                                            <p className="text-xs text-gray-500 mt-1">🍽️ {guest.dietaryRestrictions}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <select
                                                        value={guest.status}
                                                        onChange={(e) => handleUpdateGuestStatus(guest._id, e.target.value)}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(guest.status)} focus:outline-none cursor-pointer`}
                                                    >
                                                        <option value="Confirmed">Confirmed</option>
                                                        <option value="Pending">Pending</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        👥 +{guest.numberOfCompanions} companions
                                                    </p>
                                                </div>
                                            </div>
                                            {guest.notes && (
                                                <div className="mt-3 text-sm text-gray-600 border-t pt-2">
                                                    📝 {guest.notes}
                                                </div>
                                            )}
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