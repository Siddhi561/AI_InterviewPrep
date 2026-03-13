import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      
        try {
            const errors = JSON.parse(result.error.message);
            const errorMessages = errors
                .map((e) =>{
                  
                    if (e.code === "invalid_type" && e.message.includes("undefined")) {
                        return `${e.path[0]} is required`;
                    }
                    return e.message;
                })
                .join(', ');
            return next(new AppError(errorMessages, 400));
        } catch {
            return next(new AppError(result.error.message, 400));
        }
    }

    req.body = result.data;
    next();
};