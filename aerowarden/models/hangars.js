import mongoose from "mongoose";

const HangarSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        location: {
            type: String,
            default: "",
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        inviteCode: {
            type: String,
            unique: true,
            required: true,
        },

        members: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },

                role: {
                    type: String,
                    enum: [
                        "admin",
                        "engineer",
                        "technician",
                    ],
                    default: "technician",
                },

                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Hangar ||
    mongoose.model(
        "Hangar",
        HangarSchema
    );