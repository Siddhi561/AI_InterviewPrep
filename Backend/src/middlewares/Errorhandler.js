import {sendError} from '../utils/apiResponse.js'

export const errorHandler = (err, req, res, next) =>{
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";

     // Mongoose bad ObjectId (e.g. invalid session/user id format)
    if(err.name === "CastError"){
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`
    }


    // Mongoose duplicate key (e.g. email already exists)
   if(err.code === 11000){
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message= `${field} already exist`;
   }

    // Mongoose validation error
    if(err.name === "ValidationError"){
        statusCode=400;
        message=Object.values(err.errors)
        .map((e) => e.message)
        .join(",");
    }

    //Jwt error
    if(err.name === "JsonWebTokenError"){
        statusCode = 401;
        message = "Invalid token, please login again";
    }

    if(err.name === "TokenExpiredError"){
        statusCode = 401;
        message = "Token expired, please login again";
    }
 return sendError(res, statusCode, message);
  
}