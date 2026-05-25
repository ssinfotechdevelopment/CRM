import express from "express";
import {
    getGuests,
    getGuestById,
    createGuest,
    updateGuest,
    updateGuestStatus,
    deleteGuest,
    bulkImportGuests,
} from "../controllers/guestController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All guest routes require authentication
router.use(authenticate);

// Bulk import — before /:id
router.post("/bulk", bulkImportGuests);

// CRUD
router.route("/")
    .get(getGuests)
    .post(createGuest);

router.route("/:id")
    .get(getGuestById)
    .put(updateGuest)
    .delete(deleteGuest);

// Status update
router.patch("/:id/status", updateGuestStatus);

export default router;