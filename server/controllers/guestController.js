import Guest from "../models/Guest.js";
import Event from "../models/Event.js";

// @desc    Get all guests (optionally filtered by event)
// @route   GET /api/guests
export const getGuests = async (req, res) => {
    try {
        const { search, status, eventId } = req.query;
        let query = {};

        if (status && status !== "all") query.status = status;
        if (eventId) query.eventId = eventId;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ];
        }

        const guests = await Guest.find(query)
            .populate("eventId", "title date location")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: guests.length, guests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single guest
// @route   GET /api/guests/:id
export const getGuestById = async (req, res) => {
    try {
        const guest = await Guest.findById(req.params.id).populate("eventId", "title date location photoUrl");
        if (!guest) return res.status(404).json({ success: false, message: "Guest not found" });
        res.status(200).json({ success: true, guest });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new guest for an event
// @route   POST /api/guests
export const createGuest = async (req, res) => {
    try {
        const { name, email, phone, eventId, status, numberOfCompanions, dietaryRestrictions, notes } = req.body;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });

        const existingGuest = await Guest.findOne({ email, eventId });
        if (existingGuest) return res.status(400).json({ success: false, message: "Guest already registered for this event" });

        if (event.maxGuests > 0) {
            const currentGuests = await Guest.countDocuments({ eventId });
            if (currentGuests >= event.maxGuests) {
                return res.status(400).json({ success: false, message: "Maximum guest limit reached for this event" });
            }
        }

        const guest = await Guest.create({
            name, email, phone, eventId,
            status: status || "Pending",
            numberOfCompanions: numberOfCompanions || 0,
            dietaryRestrictions: dietaryRestrictions || "",
            notes: notes || "",
        });

        const populatedGuest = await Guest.findById(guest._id).populate("eventId", "title date");
        res.status(201).json({ success: true, guest: populatedGuest });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update guest
// @route   PUT /api/guests/:id
export const updateGuest = async (req, res) => {
    try {
        const guest = await Guest.findById(req.params.id);
        if (!guest) return res.status(404).json({ success: false, message: "Guest not found" });

        const { name, email, phone, eventId, status, numberOfCompanions, dietaryRestrictions, notes, checkInTime } = req.body;

        if (eventId && eventId !== guest.eventId.toString()) {
            const event = await Event.findById(eventId);
            if (!event) return res.status(404).json({ success: false, message: "New event not found" });
        }

        const updatedGuest = await Guest.findByIdAndUpdate(
            req.params.id,
            { name, email, phone, eventId: eventId || guest.eventId, status, numberOfCompanions, dietaryRestrictions, notes, checkInTime },
            { new: true, runValidators: true }
        ).populate("eventId", "title date");

        res.status(200).json({ success: true, guest: updatedGuest });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update guest status only
// @route   PATCH /api/guests/:id/status
export const updateGuestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["Confirmed", "Pending", "Cancelled"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const guest = await Guest.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate("eventId", "title");
        if (!guest) return res.status(404).json({ success: false, message: "Guest not found" });

        res.status(200).json({ success: true, guest });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete guest
// @route   DELETE /api/guests/:id
export const deleteGuest = async (req, res) => {
    try {
        const guest = await Guest.findById(req.params.id);
        if (!guest) return res.status(404).json({ success: false, message: "Guest not found" });

        await guest.deleteOne();
        res.status(200).json({ success: true, message: "Guest removed successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Bulk import guests for an event
// @route   POST /api/guests/bulk
export const bulkImportGuests = async (req, res) => {
    try {
        const { guests, eventId } = req.body;

        if (!guests || !Array.isArray(guests) || guests.length === 0) {
            return res.status(400).json({ success: false, message: "Please provide an array of guests" });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });

        const results = { successful: [], failed: [] };

        for (const guestData of guests) {
            try {
                const guest = await Guest.create({ ...guestData, eventId, status: guestData.status || "Pending" });
                results.successful.push(guest);
            } catch (error) {
                results.failed.push({ data: guestData, error: error.message });
            }
        }

        res.status(201).json({
            success: true,
            message: `Successfully added ${results.successful.length} guests, ${results.failed.length} failed`,
            results,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};