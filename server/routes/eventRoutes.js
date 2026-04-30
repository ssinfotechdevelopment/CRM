const express = require("express");
const router = express.Router();
const {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventStats,
} = require("../controllers/eventController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Stats route
router.get("/stats/dashboard", getEventStats);

// Main CRUD routes
router.route("/")
    .get(getEvents)
    .post(upload.single("photo"), createEvent);

router.route("/:id")
    .get(getEventById)
    .put(upload.single("photo"), updateEvent)
    .delete(deleteEvent);

module.exports = router;