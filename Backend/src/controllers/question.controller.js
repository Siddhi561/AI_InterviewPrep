import { GoogleGenerativeAI } from "@google/generative-ai";
import { Session } from '../models/Session.model.js';
import { Question } from '../models/Question.model.js';
import { asyncHandler } from '../utils/Asynchandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

const ai = new GoogleGenerativeAI(process.env.GEN_AI);

// GENERATE INTERVIEW QUESTIONS
export const generateInterviewQuestion = asyncHandler(async (req, res) => {


    const { role, experience, topicToFocus, sessionId } = req.body;

    if (!role || !experience || !topicToFocus || !sessionId) {
        throw new AppError("All fields are required", 400);
    }

    const session = await Session.findById(sessionId);
    if (!session) {
        throw new AppError("Session not found", 404);
    }

    //Authorization
    if (session.user.toString() !== req.id) {
        throw new AppError("Not authorized", 403);
    }

    const prompt = `You are an interview question generator.
Return ONLY a valid JSON array with no extra text, no markdown, no code blocks.
The response must start with [ and end with ].

Generate exactly 5 interview questions for a ${role} role with ${experience} years of experience.
Focus on these topics: ${topicToFocus}.

Required format:
[
  {"question": "Your question here?", "answer": "Your answer here."},
  {"question": "Your question here?", "answer": "Your answer here."},
  {"question": "Your question here?", "answer": "Your answer here."},
  {"question": "Your question here?", "answer": "Your answer here."},
  {"question": "Your question here?", "answer": "Your answer here."}
]

IMPORTANT: Return ONLY the JSON array. No other text before or after.`;

    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

    let rawText = result.response.text();

    // Remove any markdown or code blocks
    rawText = rawText
        .replace(/```json/gi, '')
        .replace(/```/gi, '')
        .replace(/`/gi, '')
        .trim();

    // Extract JSON array
    const match = rawText.match(/\[[\s\S]*\]/);
    if (!match) {
        throw new AppError("AI model returned invalid format", 502);
    }
    rawText = match[0];

    let data;
    try {
        data = JSON.parse(rawText);
    } catch (error) {
        throw new AppError("Failed to parse response from AI model", 502);
    }

    //validate the AI response shape before touching the DB
    if (!Array.isArray(data) || data.length === 0) {
        throw new AppError("No questions returned from AI model", 502)
    }

    const validQuestions = data.filter(q => q?.question && q?.answer);
    if (validQuestions.length === 0) {
        throw new AppError("AI model returned invalid quesion fromat", 502);
    }


    const createdQuestion = await Question.insertMany(
        validQuestions.map((q) => ({
            session: sessionId,
            question: q.question,
            answer: q.answer
        }))
    );

    // IF INSIDE SESSION WE WANT QUESTION REFERENCE
    if (session.questions) {
        session.questions.push(...createdQuestion.map(q => q._id));
        await session.save();
    }
    return sendSuccess(res, 201, "Questions created successfully", {
        count: createdQuestion.length,
        questions: createdQuestion
    });


}
)



//TOGGLE PIN QUESTIONS
export const togglePinQuestion = asyncHandler(async (req, res) => {

    const questionId = req.params.id;
    const question = await Question.findById(questionId);

    if (!question) {
        throw new AppError("Question not found", 404);
    }

    //authorization that only session owner can pin questions
    const session = await Session.findById(question.session)
    if (!session) {
        throw new AppError("Associated session not found", 404);
    }
    if (session.user.toString() !== req.id) {
        throw new AppError("Not authorized", 403);
    }

    question.isPinned = !question.isPinned;

    await question.save({ validateBeforeSave: false });

    return sendSuccess(res, 200, `Question ${question.isPinned ? "pinned" : "unpinned"} successfully`, {
        isPinned: question.isPinned
    });

}
)
