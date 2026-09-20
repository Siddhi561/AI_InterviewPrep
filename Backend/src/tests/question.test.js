// src/tests/question.test.js
import { vi, describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Session } from '../models/Session.model.js';
import { Question } from '../models/Question.model.js';

// ── Mock the Gemini service — one line, never hits the real API ───────────
vi.mock('../services/gemini.service.js');
import { generateQuestionsFromGemini } from '../services/gemini.service.js';

// ── Minimal Express app for testing (no Redis, no real DB) ────────────────
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { generateInterviewQuestion, togglePinQuestion } from '../controllers/question.controller.js';
import { errorHandler } from '../middlewares/Errorhandler.js';

// Fake SECRET_KEY for test JWTs
process.env.SECRET_KEY = 'test-secret-key';

// Helper: sign a real JWT for a given userId
function makeToken(userId) {
  return jwt.sign({ userId: userId.toString() }, process.env.SECRET_KEY);
}

// Helper: build a minimal Express app that injects req.id from cookie token
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Lightweight auth middleware — same logic as your real AuthMiddleware
  app.use((req, res, next) => {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.id = decoded.userId;
    }
    next();
  });

  app.post('/api/v1/question/generate', generateInterviewQuestion);
  app.patch('/api/v1/question/:id/pin', togglePinQuestion);
  app.use(errorHandler);
  return app;
}

// ── Test data helpers ─────────────────────────────────────────────────────
async function createUser() {
  // We don't need a real User doc for question tests — just a fake ObjectId
  return new mongoose.Types.ObjectId();
}

async function createSession(userId) {
  return Session.create({
    user: userId,
    role: 'Backend Developer',
    experience: 2,
    topicToFocus: 'Node.js, MongoDB',
  });
}

const VALID_AI_RESPONSE = JSON.stringify([
  { question: 'What is the event loop?', answer: 'It handles async operations.' },
  { question: 'What is a closure?', answer: 'A function with access to its outer scope.' },
  { question: 'What is hoisting?', answer: 'Declarations are moved to the top.' },
  { question: 'What is a promise?', answer: 'An object representing future value.' },
  { question: 'What is async/await?', answer: 'Syntactic sugar over promises.' },
]);

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/question/generate', () => {
  let app;
  let userId;
  let session;

  beforeEach(async () => {
    app = buildApp();
    userId = await createUser();
    session = await createSession(userId);
  });

  // ── Happy path ────────────────────────────────────────────────────────────
  it('returns 201 with questions when Gemini returns valid JSON', async () => {
    generateQuestionsFromGemini.mockResolvedValue(VALID_AI_RESPONSE);

    const res = await request(app)
      .post('/api/v1/question/generate')
      .set('Cookie', `token=${makeToken(userId)}`)
      .send({
        role: 'Backend Developer',
        experience: 2,
        topicToFocus: 'Node.js',
        sessionId: session._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.questions).toHaveLength(5);
    expect(res.body.data.questions[0]).toHaveProperty('question');
    expect(res.body.data.questions[0]).toHaveProperty('answer');
  });

  it('saves questions to DB and pushes refs into session.questions', async () => {
    generateQuestionsFromGemini.mockResolvedValue(VALID_AI_RESPONSE);

    await request(app)
      .post('/api/v1/question/generate')
      .set('Cookie', `token=${makeToken(userId)}`)
      .send({
        role: 'Backend Developer',
        experience: 2,
        topicToFocus: 'Node.js',
        sessionId: session._id.toString(),
      });

    const questions = await Question.find({ session: session._id });
    expect(questions).toHaveLength(5);

    const updatedSession = await Session.findById(session._id);
    expect(updatedSession.questions).toHaveLength(5);
  });

  // ── Garbage / malformed AI output ─────────────────────────────────────────
  it('returns 502 when Gemini returns plain text with no JSON array', async () => {
    generateQuestionsFromGemini.mockResolvedValue(
      'Sorry, I cannot generate questions right now.'
    );

    const res = await request(app)
      .post('/api/v1/question/generate')
      .set('Cookie', `token=${makeToken(userId)}`)
      .send({
        role: 'Backend Developer',
        experience: 2,
        topicToFocus: 'Node.js',
        sessionId: session._id.toString(),
      });

    expect(res.status).toBe(502);
    expect(res.body.message).toMatch(/invalid format/i);
  });

  it('returns 502 when Gemini wraps JSON in markdown code blocks', async () => {
    // The controller strips markdown — but if the resulting text still isn't
    // valid JSON, it should 502 rather than crash
    generateQuestionsFromGemini.mockResolvedValue(
      '```json\nnot valid json at all\n```'
    );

    const res = await request(app)
      .post('/api/v1/question/generate')
      .set('Cookie', `token=${makeToken(userId)}`)
      .send({
        role: 'Backend Developer',
        experience: 2,
        topicToFocus: 'Node.js',
        sessionId: session._id.toString(),
      });

    expect(res.status).toBe(502);
  });

  it('returns 502 when Gemini returns a JSON object instead of an array', async () => {
    generateQuestionsFromGemini.mockResolvedValue(
      JSON.stringify({ question: 'What?', answer: 'This.' })
    );

    const res = await request(app)
      .post('/api/v1/question/generate')
      .set('Cookie', `token=${makeToken(userId)}`)
      .send({
        role: 'Backend Developer',
        experience: 2,
        topicToFocus: 'Node.js',
        sessionId: session._id.toString(),
      });

    expect(res.status).toBe(502);
  });

  it('returns 502 when Gemini returns an array with no valid question/answer fields', async () => {
    generateQuestionsFromGemini.mockResolvedValue(
      JSON.stringify([{ foo: 'bar' }, { baz: 'qux' }])
    );

    const res = await request(app)
      .post('/api/v1/question/generate')
      .set('Cookie', `token=${makeToken(userId)}`)
      .send({
        role: 'Backend Developer',
        experience: 2,
        topicToFocus: 'Node.js',
        sessionId: session._id.toString(),
      });

    expect(res.status).toBe(502);
  });

  // ── Gemini throws / times out ─────────────────────────────────────────────
  it('returns 503 when Gemini throws a network error', async () => {
    generateQuestionsFromGemini.mockRejectedValue(new Error('fetch failed'));

    const res = await request(app)
      .post('/api/v1/question/generate')
      .set('Cookie', `token=${makeToken(userId)}`)
      .send({
        role: 'Backend Developer',
        experience: 2,
        topicToFocus: 'Node.js',
        sessionId: session._id.toString(),
      });

    expect(res.status).toBe(503);
    expect(res.body.message).toMatch(/unavailable/i);
  });

  it('does NOT write anything to DB when Gemini fails', async () => {
    generateQuestionsFromGemini.mockRejectedValue(new Error('timeout'));

    await request(app)
      .post('/api/v1/question/generate')
      .set('Cookie', `token=${makeToken(userId)}`)
      .send({
        role: 'Backend Developer',
        experience: 2,
        topicToFocus: 'Node.js',
        sessionId: session._id.toString(),
      });

    const count = await Question.countDocuments({ session: session._id });
    expect(count).toBe(0);
  });

  // ── Authorization ─────────────────────────────────────────────────────────
  it('returns 403 when a different user tries to generate questions for another users session', async () => {
    generateQuestionsFromGemini.mockResolvedValue(VALID_AI_RESPONSE);

    const otherUserId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post('/api/v1/question/generate')
      .set('Cookie', `token=${makeToken(otherUserId)}`) // different user
      .send({
        role: 'Backend Developer',
        experience: 2,
        topicToFocus: 'Node.js',
        sessionId: session._id.toString(), // belongs to userId, not otherUserId
      });

    expect(res.status).toBe(403);
  });

  // ── Validation ────────────────────────────────────────────────────────────
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/question/generate')
      .set('Cookie', `token=${makeToken(userId)}`)
      .send({ role: 'Backend Developer' }); // missing experience, topicToFocus, sessionId

    expect(res.status).toBe(400);
  });

  it('returns 404 when sessionId does not exist', async () => {
    generateQuestionsFromGemini.mockResolvedValue(VALID_AI_RESPONSE);

    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/v1/question/generate')
      .set('Cookie', `token=${makeToken(userId)}`)
      .send({
        role: 'Backend Developer',
        experience: 2,
        topicToFocus: 'Node.js',
        sessionId: fakeId.toString(),
      });

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/v1/question/:id/pin', () => {
  let app;
  let userId;
  let session;
  let question;

  beforeEach(async () => {
    app = buildApp();
    userId = await createUser();
    session = await createSession(userId);
    question = await Question.create({
      session: session._id,
      question: 'What is Node.js?',
      answer: 'A JS runtime.',
    });
  });

  it('toggles isPinned from false to true', async () => {
    const res = await request(app)
      .patch(`/api/v1/question/${question._id}/pin`)
      .set('Cookie', `token=${makeToken(userId)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isPinned).toBe(true);
  });

  it('toggles isPinned back to false on second call', async () => {
    await request(app)
      .patch(`/api/v1/question/${question._id}/pin`)
      .set('Cookie', `token=${makeToken(userId)}`);

    const res = await request(app)
      .patch(`/api/v1/question/${question._id}/pin`)
      .set('Cookie', `token=${makeToken(userId)}`);

    expect(res.body.data.isPinned).toBe(false);
  });

  it('returns 403 when a different user tries to pin', async () => {
    const otherUserId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/v1/question/${question._id}/pin`)
      .set('Cookie', `token=${makeToken(otherUserId)}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent question id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/v1/question/${fakeId}/pin`)
      .set('Cookie', `token=${makeToken(userId)}`);

    expect(res.status).toBe(404);
  });
});
