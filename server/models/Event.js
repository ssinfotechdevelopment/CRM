const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Event title is required"],
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        description: {
            type: String,
            required: [true, "Event description is required"],
            trim: true,
        },
        date: {
            type: Date,
            required: [true, "Event date is required"],
        },
        location: {
            type: String,
            required: [true, "Event location is required"],
            trim: true,
        },
        photoUrl: {
            type: String,
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },
        status: {
            type: String,
            enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
            default: "Upcoming",
        },
        maxGuests: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for better search performance
eventSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Event", eventSchema);