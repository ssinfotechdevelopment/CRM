// server/models/documentationModel.js
import mongoose from "mongoose";

/* ─────────────────────────────────────────────
   Sub-schema: contributor entry
───────────────────────────────────────────── */
const contributorSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    name: { type: String },           // denormalised for display speed
    contributionNote: { type: String, default: "" }, // what the employee contributed
    contributionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: false }
);

/* ─────────────────────────────────────────────
   Sub-schema: admin review note
───────────────────────────────────────────── */
const reviewNoteSchema = new mongoose.Schema(
  {
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    adminName: { type: String },
    note: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/* ─────────────────────────────────────────────
   Main Documentation Schema
───────────────────────────────────────────── */
const documentationSchema = new mongoose.Schema(
  {
    // ── Basic info ──────────────────────────
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["Research", "Technical", "Policy", "Training", "Report", "Other"],
      default: "Research",
    },
    tags: [{ type: String, trim: true }],

    // ── File attachment (Cloudinary) ─────────
    fileUrl: { type: String, default: null },    // Cloudinary secure_url
    fileName: { type: String, default: null },   // original name
    fileType: { type: String, default: null },   // mime type

    // ── Uploader (primary author) ────────────
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    uploaderName: { type: String },

    // ── Research contributors ────────────────
    contributors: [contributorSchema],

    // ── Status / workflow ───────────────────
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // ── Admin review ─────────────────────────
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },  // set when Rejected
    reviewNotes: [reviewNoteSchema],                   // improvement suggestions
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ─────────────────────────────────────────────
   Indexes
───────────────────────────────────────────── */
documentationSchema.index({ status: 1 });
documentationSchema.index({ uploadedBy: 1 });
documentationSchema.index({ category: 1 });

export default mongoose.models.Documentation ||
  mongoose.model("Documentation", documentationSchema);