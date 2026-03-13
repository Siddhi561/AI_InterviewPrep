import express from 'express';
import {
    generateInterviewQuestion,
    togglePinQuestion
} from '../controllers/question.controller.js';
import {AuthMiddleware} from '../middlewares/Auth.middleware.js';
import { aiLimiter } from '../config/rateLimiter.js';
import { applyRateLimit } from '../middlewares/rateLimiter.middleware.js';
import { validate } from '../middlewares/validate.middleware.js'; 
import { generateQuestionSchema } from '../validators/question.validator.js';


const router = express.Router();

router.post("/generate", applyRateLimit(aiLimiter),validate(generateQuestionSchema), AuthMiddleware,generateInterviewQuestion);
router.patch("/:id/pin", AuthMiddleware,togglePinQuestion);

export default router;