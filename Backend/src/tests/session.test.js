// src/tests/session.test.js
import { vi, describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Session } from '../models/Session.model.js';
import { Question } from '../models/Question.model.js';
import {
  createSession,
  getSession,
  getSessionById,
  deleteSession,
} from '../controllers/session.controller.js';
import { errorHandler } from '../middlewares/Errorhandler.js';

process.env.SECRET_KEY = 'test-secret-key';

function makeToken(userId) {
  return jwt.sign({ userId: userId.toString() }, process.env.SECRET_KEY);
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use((req, res, next) => {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.id = decoded.userId;
    }
    next();
  });

  app.post('/api/v1/session/create', createSession);
  app.get('/api/v1/session/my-session', getSession);
  app.get('/api/v1/session/:id', getSessionById);
  app.delete('/api/v1/session/:id', deleteSession);
  app.use(errorHandler);
  return app;
}

const SESSION_PAYLOAD = {
  role: 'Frontend Developer',
  experience: 2,
  topicToFocus: 'React, JavaScript',
};

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/session/create', () => {
  let app;
  let userId;

  beforeEach(() => {
    app = buildApp();
    userId = new mongoose.Types.ObjectId();
  });

  it('creates a session and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/session/create')
      .set('Cookie', `token=${makeToken(userId)}`)
      .send(SESSION_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.data.session.role).toBe('Frontend Developer');
    expect(res.body.data.session.user).toBe(userId.toString());
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/session/create')
      .set('Cookie', `token=${makeToken(userId)}`)
      .send({ role: 'Frontend Developer' }); // missing experience and topicToFocus

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/session/my-session', () => {
  let app;
  let userAId;
  let userBId;

  beforeEach(async () => {
    app = buildApp();
    userAId = new mongoose.Types.ObjectId();
    userBId = new mongoose.Types.ObjectId();

    // User A has 2 sessions, User B has 1
    await Session.create([
      { user: userAId, ...SESSION_PAYLOAD },
      { user: userAId, role: 'Backend Developer', experience: 3, topicToFocus: 'Node.js' },
      { user: userBId, role: 'DevOps Engineer', experience: 4, topicToFocus: 'Docker, K8s' },
    ]);
  });

  it('returns only sessions belonging to the requesting user', async () => {
    const res = await request(app)
      .get('/api/v1/session/my-session')
      .set('Cookie', `token=${makeToken(userAId)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(2);
    // Every returned session must belong to User A
    res.body.data.session.forEach((s) => {
      expect(s.user).toBe(userAId.toString());
    });
  });

  it('User B only sees their own session, not User A sessions', async () => {
    const res = await request(app)
      .get('/api/v1/session/my-session')
      .set('Cookie', `token=${makeToken(userBId)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.session[0].role).toBe('DevOps Engineer');
  });

  it('returns empty array for a user with no sessions', async () => {
    const newUser = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get('/api/v1/session/my-session')
      .set('Cookie', `token=${makeToken(newUser)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/session/:id', () => {
  let app;
  let userAId;
  let userBId;
  let userASession;

  beforeEach(async () => {
    app = buildApp();
    userAId = new mongoose.Types.ObjectId();
    userBId = new mongoose.Types.ObjectId();
    userASession = await Session.create({ user: userAId, ...SESSION_PAYLOAD });
  });

  it('returns the session when the owner requests it', async () => {
    const res = await request(app)
      .get(`/api/v1/session/${userASession._id}`)
      .set('Cookie', `token=${makeToken(userAId)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.session._id).toBe(userASession._id.toString());
  });

  it('returns 403 when User B tries to view User A session', async () => {
    const res = await request(app)
      .get(`/api/v1/session/${userASession._id}`)
      .set('Cookie', `token=${makeToken(userBId)}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent session id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/v1/session/${fakeId}`)
      .set('Cookie', `token=${makeToken(userAId)}`);

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/v1/session/:id', () => {
  let app;
  let userAId;
  let userBId;
  let userASession;

  beforeEach(async () => {
    app = buildApp();
    userAId = new mongoose.Types.ObjectId();
    userBId = new mongoose.Types.ObjectId();
    userASession = await Session.create({ user: userAId, ...SESSION_PAYLOAD });

    // Attach some questions to the session
    await Question.insertMany([
      { session: userASession._id, question: 'Q1?', answer: 'A1.' },
      { session: userASession._id, question: 'Q2?', answer: 'A2.' },
    ]);
  });

  it('deletes the session and all its questions', async () => {
    const res = await request(app)
      .delete(`/api/v1/session/${userASession._id}`)
      .set('Cookie', `token=${makeToken(userAId)}`);

    expect(res.status).toBe(200);

    const session = await Session.findById(userASession._id);
    expect(session).toBeNull();

    const questions = await Question.find({ session: userASession._id });
    expect(questions).toHaveLength(0);
  });

  it('returns 403 when User B tries to delete User A session', async () => {
    const res = await request(app)
      .delete(`/api/v1/session/${userASession._id}`)
      .set('Cookie', `token=${makeToken(userBId)}`);

    expect(res.status).toBe(403);

    // Session must still exist
    const session = await Session.findById(userASession._id);
    expect(session).not.toBeNull();
  });

  it('returns 404 when deleting a non-existent session', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/session/${fakeId}`)
      .set('Cookie', `token=${makeToken(userAId)}`);

    expect(res.status).toBe(404);
  });
});
