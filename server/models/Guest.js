const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Guest name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
        },
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: [true, "Event ID is required"],
        },
        status: {
            type: String,
            enum: ["Confirmed", "Pending", "Cancelled"],
            default: "Pending",
        },
        numberOfCompanions: {
            type: Number,
            default: 0,
            min: [0, "Companions cannot be negative"],
        },
        dietaryRestrictions: {
            type: String,
            trim: true,
            default: "",
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        checkInTime: {
            type: Date,
            default: null,
        },
        invitationSent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for unique guest per event (optional)
guestSchema.index({ email: 1, eventId: 1 }, { unique: false });

// Virtual for total count including companions
guestSchema.virtual("totalCount").get(function () {
    return 1 + (this.numberOfCompanions || 0);
});

module.exports = mongoose.model("Guest", guestSchema);