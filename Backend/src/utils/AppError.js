export class AppError extends Error{
    constructor(message, statusCode){
        super(message);
        this.statusCode= statusCode;
        this.isOperational = true; // this distinguish our error form unexpected ones
        Error.captureStackTrace(this, this.constructor)
    }
}