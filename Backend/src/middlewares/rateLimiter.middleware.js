import { AppError } from '../utils/AppError.js';




export const applyRateLimit = (limiter) => async (req, res, next) => {

    try {
        //use IP as identifier, falls back to "annonymous" if IP not found
        const identifier = req.ip || req.headers["x-forwarded-for"] || "anonymous";

        const { success, limit, remaining, reset } = await limiter.limit(identifier);

        //set headers so the client knows their limit status
        res.setHeader("X-RateLimit-Limit", limit);
        res.setHeader("X-RateLimit-Remaining", remaining);
        res.setHeader("X-RateLimit-Reset", new Date(reset).toISOString());

        if (!success) {
              return next(new AppError("Too many requests, please try again later.", 429));

        }
        next();


    } catch (error) {
        console.error("Rate Limiter error: ", error);
        next();
    }
};