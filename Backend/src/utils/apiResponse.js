// Standardized success response
export const sendSuccess = (res, statusCode, message, data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

// Standardized error response
export const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({  // ✅ no 'data' here
        success: false,
        message
    });
};