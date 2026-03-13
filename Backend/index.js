import { configDotenv } from "dotenv";
import express from 'express';
import {connectDB} from './src/config/Db.js';
import cookieParser from "cookie-parser";
import cors from 'cors';
import userRouter from './src/routes/user.route.js'
import questionRouter from './src/routes/question.route.js';
import sessionRouter from './src/routes/session.route.js'
import { errorHandler } from "./src/middlewares/Errorhandler.js";
import helmet from 'helmet';
import { applyRateLimit } from "./src/middlewares/rateLimiter.middleware.js";
import { generalLimiter } from './src/config/rateLimiter.js'; 

configDotenv();
const app = express();

app.use(helmet());
app.use(cors({
     origin: process.env.CLIENT_URL, 
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(applyRateLimit(generalLimiter));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/session", sessionRouter);
app.use("/api/v1/question", questionRouter);

//must be used after all the routes

app.use(errorHandler)

const port = process.env.PORT || 5000;
app.listen(port, () => {
  connectDB();
  console.log(`server started on port->${port}`);
});
