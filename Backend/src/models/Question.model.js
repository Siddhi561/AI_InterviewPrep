import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
         required: true,
         index: true 
    },
    question: {
        type: String,
         required: true,
    },
    answer: {
        type: String,
         required: true,
    },
    note: {
        type: String,
        default:""
    },
    isPinned: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });
questionSchema.index({ session: 1, isPinned: -1 });

export const Question = mongoose.model("Question", questionSchema);