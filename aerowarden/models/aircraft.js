import mongoose from "mongoose";

const AircraftReportSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },

        notes: {
            type: String,
            default: "",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const AircraftSchema = new mongoose.Schema(
    {
        registration: {
            type: String,
            required: true,
        },

        model: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            default: "Activo",
        },

        hangar: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hangar",
            required: true,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        reports: [AircraftReportSchema],
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Aircraft ||
    mongoose.model("Aircraft", AircraftSchema);