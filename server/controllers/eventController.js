const Event = require("../models/Event");
const Guest = require("../models/Guest");
const fs = require("fs");

// @desc    Get all events
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        // Filter by status
        if (status && status !== "all") {
            query.status = status;
        }

        // Search functionality
        if (search) {
            query.$text = { $search: search };
        }

        const events = await Event.find(query).sort({ date: -1 });

        // Get guest count for each event
        const eventsWithCount = await Promise.all(
            events.map(async (event) => {
                const guestCount = await Guest.countDocuments({ eventId: event._id });
                const confirmedCount = await Guest.countDocuments({
                    eventId: event._id,
                    status: "Confirmed"
                });
                return {
                    ...event.toObject(),
                    guestCount,
                    confirmedCount,
                };
            })
        );

        res.status(200).json({
            success: true,
            count: events.length,
            events: eventsWithCount,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        // Get guests for this event
        const guests = await Guest.find({ eventId: event._id });
        const guestCount = guests.length;
        const confirmedCount = guests.filter(g => g.status === "Confirmed").length;

        res.status(200).json({
            success: true,
            event: {
                ...event.toObject(),
                guestCount,
                confirmedCount,
                guests,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
    try {
        const { title, description, date, location, status, maxGuests } = req.body;

        // Handle photo upload
        let photoUrl = null;
        if (req.file) {
            photoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        const event = await Event.create({
            title,
            description,
            date,
            location,
            photoUrl,
            status: status || "Upcoming",
            maxGuests: maxGuests || 0,
            createdBy: req.adminId,
        });

        res.status(201).json({
            success: true,
            event,
        });
    } catch (error) {
        // Delete uploaded file if event creation fails
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        const { title, description, date, location, status, maxGuests } = req.body;

        // Handle photo update
        let photoUrl = event.photoUrl;
        if (req.file) {
            // Delete old photo if exists
            if (event.photoUrl) {
                const oldPhotoPath = `uploads/${event.photoUrl.split("/").pop()}`;
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }
            photoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                date,
                location,
                photoUrl,
                status,
                maxGuests,
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            event: updatedEvent,
        });
    } catch (error) {
        // Delete newly uploaded file if update fails
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        // Delete all guests associated with this event
        await Guest.deleteMany({ eventId: event._id });

        // Delete event photo if exists
        if (event.photoUrl) {
            const photoPath = `uploads/${event.photoUrl.split("/").pop()}`;
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        await event.deleteOne();

        res.status(200).json({
            success: true,
            message: "Event and all associated guests deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get event statistics
// @route   GET /api/events/stats/dashboard
// @access  Private
const getEventStats = async (req, res) => {
    try {
        const totalEvents = await Event.countDocuments();
        const upcomingEvents = await Event.countDocuments({ status: "Upcoming" });
        const completedEvents = await Event.countDocuments({ status: "Completed" });

        const totalGuests = await Guest.countDocuments();
        const confirmedGuests = await Guest.countDocuments({ status: "Confirmed" });
        const pendingGuests = await Guest.countDocuments({ status: "Pending" });
        const cancelledGuests = await Guest.countDocuments({ status: "Cancelled" });

        // Get events with most guests
        const topEvents = await Event.aggregate([
            {
                $lookup: {
                    from: "guests",
                    localField: "_id",
                    foreignField: "eventId",
                    as: "guests",
                },
            },
            {
                $project: {
                    title: 1,
                    date: 1,
                    guestCount: { $size: "$guests" },
                },
            },
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
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventStats,
};