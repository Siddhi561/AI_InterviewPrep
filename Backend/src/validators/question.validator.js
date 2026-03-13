import { z } from 'zod';

export const generateQuestionSchema = z.object({
    role: z.string()
        .min(2, "Role must be at least 2 characters")
        .max(100, "Role cannot exceed 100 characters"),

    experience: z.number({
        invalid_type_error: "Experience must be a number"
    })
        .min(0, "Experience cannot be negative")
        .max(50, "Experience cannot exceed 50 years"),

    topicToFocus: z.string()
        .min(2, "Topic must be at least 2 characters")
        .max(200, "Topic cannot exceed 200 characters"),

    sessionId: z.string()
        .regex(/^[a-f\d]{24}$/i, "Invalid session ID format"),
});