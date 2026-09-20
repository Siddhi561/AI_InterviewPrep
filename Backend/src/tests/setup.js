// src/tests/setup.js
// Runs once before all test files.
// 1. Mocks Upstash Redis so rateLimiter.js never hits real Redis.
// 2. Connects to an in-memory MongoDB via mongodb-memory-server.
// 3. Clears all collections between each test.
// 4. Disconnects after all tests are done.

import { vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

// ── Mock Upstash BEFORE any module imports it ─────────────────────────────
// rateLimiter.js runs `await redis.set("foo","bar")` at the top level.
// Without this mock, every test file that imports anything connected to
// index.js or rateLimiter.js will crash trying to reach real Redis.
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue('bar'),
  })),
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    vi.fn().mockImplementation(() => ({
      limit: vi.fn().mockResolvedValue({ success: true, remaining: 99 }),
    })),
    {
      slidingWindow: vi.fn().mockReturnValue({}),
    }
  ),
}));

// ── In-memory MongoDB ─────────────────────────────────────────────────────
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

// Clear every collection between tests so state never bleeds across
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});


