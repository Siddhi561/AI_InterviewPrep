import { z } from 'zod';

export const registerSchema = z.object({
    fullName: z.string()
        .min(2, "Full name must be at least 2 characters")
        .max(50, "Full name cannot exceed 50 characters")
        .trim(),

    email: z.string()
        .email("Please provide a valid email address")
        .toLowerCase()
        .trim(),

    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(32, "Password cannot exceed 32 characters")
        .refine(val => /[A-Z]/.test(val), "Password must contain at least one uppercase letter")
        .refine(val => /[0-9]/.test(val), "Password must contain at least one number")
        .refine(val => /[^a-zA-Z0-9]/.test(val), "Password must contain at least one special character"),
});

export const loginSchema = z.object({
    email: z.string()
        .email("Please provide a valid email address")
        .toLowerCase()
        .trim(),

    password: z.string()
        .min(1, "Password is required"),
})


export const updateProfileSchema = z.object({
    fullName: z.string()
        .min(2, "Full name must be at least 2 characters")
        .max(50, "Full name cannot exceed 50 characters")
        .trim()
        .optional(),
});