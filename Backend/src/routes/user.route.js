import express from 'express';
import { upload } from '../controllers/user.controller.js';
import {
    register,
    login,
    logout,
    getUser,
    updateProfile,
} from '../controllers/user.controller.js';
import {AuthMiddleware  } from '../middlewares/Auth.middleware.js';
import { authLimiter } from '../config/rateLimiter.js';
import { applyRateLimit } from '../middlewares/rateLimiter.middleware.js';
import { validate } from '../middlewares/validate.middleware.js'; 
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/user.validator.js'; 

const router = express.Router();

router.post("/register", applyRateLimit(authLimiter),validate(registerSchema), register);
router.post("/login", applyRateLimit(authLimiter),validate(loginSchema), login);

router.post("/logout", AuthMiddleware, logout);
router.get("/me", AuthMiddleware, getUser);
router.put("/update-profile", AuthMiddleware,  upload.single('profilePicture'),validate(updateProfileSchema), updateProfile);

export default router;
