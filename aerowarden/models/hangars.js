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
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Hangar ||
    mongoose.model("Hangar", HangarSchema);