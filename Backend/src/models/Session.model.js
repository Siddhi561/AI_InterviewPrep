import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true 
    },
    role: {
        type: String,
        required: true
    },
    experience: {
        type: Number,
        required: true
    },
    topicToFocus: {
        type: String,
        required: true
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
    }],
}, { timestamps: true });
sessionSchema.index({ user: 1, createdAt: -1 });

export const Session = mongoose.model("Session", sessionSchema);