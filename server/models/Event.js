import mongoose from "mongoose";

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
        // Multiple images — 5 to 10 per event
        photos: {
            type: [String],
            default: [],
            validate: {
                validator: function (arr) {
                    return arr.length <= 10;
                },
                message: "An event can have a maximum of 10 photos",
            },
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

eventSchema.index({ title: "text", description: "text" });

export default mongoose.model("Event", eventSchema);