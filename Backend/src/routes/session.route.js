import express from 'express';
import{
    createSession,
    getSession,
    getSessionById,
    deleteSession
} from '../controllers/session.controller.js';
import {AuthMiddleware} from '../middlewares/Auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js'; 
import { createSessionSchema } from '../validators/session.validator.js'; 


const router = express.Router();

router.post("/create", AuthMiddleware,validate(createSessionSchema), createSession);
router.get("/my-session", AuthMiddleware, getSession);
router.get("/:id", AuthMiddleware, getSessionById);
router.delete("/:id",AuthMiddleware, deleteSession);

export default router;
