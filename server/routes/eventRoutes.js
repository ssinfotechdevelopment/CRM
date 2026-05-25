import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();
import {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventStats,
} from "../controllers/eventsController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Cloudinary storage — crm-events folder
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const eventStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "crm-events",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        public_id: (req, file) =>
            `event-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    },
});

// Accept 5–10 photos per request (hard max = 10)
const uploadEventPhotos = multer({
    storage: eventStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB per file
        files: 10,                 // never more than 10
    },
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Only JPG, PNG, or WEBP images are allowed"));
    },
});

// All event routes require authentication
router.use(authenticate);

// Stats — must be before /:id
router.get("/stats/dashboard", getEventStats);

// CRUD — use .array("photos", 10) instead of .single()
router.route("/")
    .get(getEvents)
    .post(uploadEventPhotos.array("photos", 10), createEvent);

router.route("/:id")
    .get(getEventById)
    .put(uploadEventPhotos.array("photos", 10), updateEvent)
    .delete(deleteEvent);

export default router;