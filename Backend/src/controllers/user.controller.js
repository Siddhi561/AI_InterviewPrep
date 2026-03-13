import { User } from '../models/User.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import imagekit from '../config/imagekit.js';
import multer from 'multer';
import { asyncHandler } from '../utils/Asynchandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const upload = multer();

// REGISTER
export const register = asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError("User already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ fullName, email, password: hashedPassword });

    return sendSuccess(res, 201, "User registered successfully");
});

// LOGIN
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError("Invalid credentials", 401);
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new AppError("Invalid credentials", 401);
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
        expiresIn: "7d"
    });

    const { password: _, ...safeUser } = user.toObject();

   return res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
    maxAge: 7 * 24 * 60 * 60 * 1000
    }).json({
        success: true,
        message: `${user.fullName} logged in successfully`,
        data: { user: safeUser }
    });
});

// LOGOUT
export const logout = asyncHandler(async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        ameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    return sendSuccess(res, 200, "User logged out successfully");
});

// GET USER
export const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.id).select('-password');

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return sendSuccess(res, 200, "User fetched successfully", { user });
});

// UPDATE PROFILE
export const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.id;
    const { fullName } = req.body || {};
    const profilePicture = req.file;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;

    if (profilePicture) {
        const result = await imagekit.upload({
            file: profilePicture.buffer,
            fileName: profilePicture.originalname
        });
        updateData.profilePhoto = result.url;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true
    }).select('-password');

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return sendSuccess(res, 200, "Profile updated successfully", { user });
});
