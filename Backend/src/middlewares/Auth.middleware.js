import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/Asynchandler.js';

export const AuthMiddleware = asyncHandler(async (req, res, next) => {


    const token = req.cookies.token;

    if (!token) {
        throw new AppError("You are not logged in", 401);
    }

    // jwt.verify throws automatically if token is invalid or expired
    // errorHandler catches JsonWebTokenError and TokenExpiredError globally

    const decode = jwt.verify(token, process.env.SECRET_KEY);

    req.id = decode.userId;
    next();

})