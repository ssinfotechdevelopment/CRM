import { Router } from "express";
import Holiday from "../models/Holiday.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Get all holidays (Admin & Employee both can view)
router.get("/all", async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ success: true, data: holidays });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Add holiday
router.post("/add", protect, async (req, res) => {
  try {
    const { name, date, type, description } = req.body;
    const existingHoliday = await Holiday.findOne({ date });
    if (existingHoliday) {
      return res.status(400).json({ success: false, error: "Holiday already exists on this date" });
    }
    const holiday = await Holiday.create({ name, date, type, description, createdBy: req.user._id });
    res.json({ success: true, data: holiday });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Delete holiday
router.delete("/delete/:id", protect, async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Holiday deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Update holiday
router.put("/update/:id", protect, async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, data: holiday });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;