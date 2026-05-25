import Event from "../models/Event.js";
import Guest from "../models/Guest.js";

// Helper: extract Cloudinary URLs from req.files array
const extractPhotoUrls = (files = []) =>
    files.map((f) => f.path); // multer-storage-cloudinary sets f.path = secure_url

// @desc    Get all events
// @route   GET /api/events
export const getEvents = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status && status !== "all") query.status = status;
        if (search) query.$text = { $search: search };

        const events = await Event.find(query).sort({ date: -1 });

        const eventsWithCount = await Promise.all(
            events.map(async (event) => {
                const guestCount = await Guest.countDocuments({ eventId: event._id });
                const confirmedCount = await Guest.countDocuments({ eventId: event._id, status: "Confirmed" });
                return { ...event.toObject(), guestCount, confirmedCount };
            })
        );

        res.status(200).json({ success: true, count: events.length, events: eventsWithCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single event with guests
// @route   GET /api/events/:id
export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });

        const guests = await Guest.find({ eventId: event._id });
        res.status(200).json({
            success: true,
            event: {
                ...event.toObject(),
                guestCount: guests.length,
                confirmedCount: guests.filter((g) => g.status === "Confirmed").length,
                guests,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new event (up to 10 photos)
// @route   POST /api/events
export const createEvent = async (req, res) => {
    try {
        const { title, description, date, location, status, maxGuests } = req.body;

        // req.files is an array when using upload.array()
        const photos = extractPhotoUrls(req.files);

        if (photos.length > 10) {
            return res.status(400).json({ success: false, message: "You can upload a maximum of 10 photos per event" });
        }

        const event = await Event.create({
            title,
            description,
            date,
            location,
            photos,
            status: status || "Upcoming",
            maxGuests: maxGuests || 0,
            createdBy: req.user?._id || null,
        });

        res.status(201).json({ success: true, event });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update event (replaces photos if new ones uploaded, else keeps existing)
// @route   PUT /api/events/:id
export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });

        const { title, description, date, location, status, maxGuests, existingPhotos } = req.body;

        // Frontend sends kept existing photo URLs as existingPhotos (string or array)
        let keptPhotos = [];
        if (existingPhotos) {
            keptPhotos = Array.isArray(existingPhotos) ? existingPhotos : [existingPhotos];
        } else {
            keptPhotos = event.photos; // nothing sent → keep all
        }

        // Merge kept existing + newly uploaded
        const newPhotos = extractPhotoUrls(req.files || []);
        const photos = [...keptPhotos, ...newPhotos].slice(0, 10);

        if (photos.length > 10) {
            return res.status(400).json({ success: false, message: "Maximum 10 photos allowed per event" });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            { title, description, date, location, photos, status, maxGuests },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, event: updatedEvent });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete event (cascades to guests)
// @route   DELETE /api/events/:id
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });

        await Guest.deleteMany({ eventId: event._id });
        await event.deleteOne();

        res.status(200).json({ success: true, message: "Event and all associated guests deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get event stats
// @route   GET /api/events/stats/dashboard
export const getEventStats = async (req, res) => {
    try {
        const totalEvents = await Event.countDocuments();
        const upcomingEvents = await Event.countDocuments({ status: "Upcoming" });
        const completedEvents = await Event.countDocuments({ status: "Completed" });

        const totalGuests = await Guest.countDocuments();
        const confirmedGuests = await Guest.countDocuments({ status: "Confirmed" });
        const pendingGuests = await Guest.countDocuments({ status: "Pending" });
        const cancelledGuests = await Guest.countDocuments({ status: "Cancelled" });

        const topEvents = await Event.aggregate([
            { $lookup: { from: "guests", localField: "_id", foreignField: "eventId", as: "guests" } },
            { $project: { title: 1, date: 1, guestCount: { $size: "$guests" } } },
            { $sort: { guestCount: -1 } },
            { $limit: 5 },
        ]);

        res.status(200).json({
            success: true,
            stats: {
                events: { total: totalEvents, upcoming: upcomingEvents, completed: completedEvents },
                guests: { total: totalGuests, confirmed: confirmedGuests, pending: pendingGuests, cancelled: cancelledGuests },
                topEvents,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};