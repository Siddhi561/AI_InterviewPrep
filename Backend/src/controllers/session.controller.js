import { Question } from '../models/Question.model.js';
import { Session } from '../models/Session.model.js';
import { asyncHandler } from '../utils/Asynchandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';


//CREATE SESSION
export const createSession = asyncHandler(async (req, res) => {

    const { role, experience, topicToFocus } = req.body;
    const userId = req.id;
    if (!role || !experience || !topicToFocus) {
        throw new AppError("Please provide all the details")
    }

    const session = await Session.create({
        user: userId,
        role,
        experience,
        topicToFocus
    })

    await session.save();

     return sendSuccess(res, 201, "Session created successfully", { session });

});

//GET ALL THE SESSION FOR THE USER
export const getSession = asyncHandler(async (req, res) => {

    const userId = req.id;
   
    const session = await Session.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate("questions");
    

     return sendSuccess(res, 200, "Sessions fetched successfully", {
        count: session.length,
        session
    });


});



//GET SESSION BY ID
export const getSessionById = asyncHandler(async (req, res) => {

    const sessionId = req.params.id;
    const session = await Session.findById(sessionId)
        .populate({
            path: "questions",
            options: { sort: { isPinned: -1 }, createdAt: -1 }
        })

    if (!session) {
        throw new AppError("Session not found", 404);
    }

    //authorization that only owner can view
    if (session.user.toString() !== req.id) {
        throw new AppError("Not authorizedd", 403);
    }

     return sendSuccess(res, 200, "Session fetched successfully", { session });


}
)

//DELETE SESSION
export const deleteSession = asyncHandler(async (req, res) => {

    const sessionId = req.params.id;
    const session = await Session.findById(sessionId);

    if (!session) {
        throw new AppError("Session not found", 404);
    }

    //authorization that only owner can delete
    if (session.user.toString() !== req.id) {
        throw new AppError("Not authorized", 403);
    }

    await Question.deleteMany({ session: sessionId });
    await session.deleteOne();
   return sendSuccess(res, 200, "Session deleted successfully");

})