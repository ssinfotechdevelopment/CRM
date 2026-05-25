import mongoose from "mongoose";
const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  type: { 
    type: String, 
    enum: ["public", "religious", "festival", "company", "optional"],
    default: "public"
  },
  description: { type: String, default: "" },
  isWeekend: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Holiday || mongoose.model("Holiday", holidaySchema);