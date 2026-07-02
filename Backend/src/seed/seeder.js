
// Run with: npm run seed
// To wipe and re-seed: npm run seed:fresh

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { configDotenv } from "dotenv";

configDotenv();

// ── Inline schemas (avoids circular import issues when running standalone) ──

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    profilePhoto: { type: String, default: "" },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    experience: { type: Number, required: true },
    topicToFocus: { type: String, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  },
  { timestamps: true }
);
const Session = mongoose.model("Session", sessionSchema);

const questionSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    note: { type: String, default: "" },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const Question = mongoose.model("Question", questionSchema);

// ── Seed Data ──────────────────────────────────────────────────────────────

const SEED_USERS = [
  { fullName: "Arjun Mehta", email: "arjun@example.com", password: "Test@1234" },
  { fullName: "Priya Sharma", email: "priya@example.com", password: "Test@1234" },
];

const SEED_SESSIONS = [
  { role: "Frontend Developer", experience: 2, topicToFocus: "React, JavaScript, CSS" },
  { role: "Backend Developer", experience: 3, topicToFocus: "Node.js, MongoDB, REST APIs" },
  { role: "Full Stack Developer", experience: 1, topicToFocus: "React, Node.js, System Design" },
];

const SEED_QUESTIONS = [
  // Session 0 — Frontend
  {
    question: "What is the difference between useEffect and useLayoutEffect in React?",
    answer: "useEffect runs asynchronously after the DOM is painted, making it suitable for data fetching and subscriptions. useLayoutEffect runs synchronously after DOM mutations but before the browser paints, so it is used when you need to read layout or make DOM measurements to avoid visual flicker.",
    note: "Know the paint timing difference.",
    isPinned: true,
  },
  {
    question: "Explain the JavaScript event loop.",
    answer: "JavaScript is single-threaded. The event loop continuously checks the call stack. When the stack is empty it picks tasks from the macrotask queue (setTimeout, setInterval) or microtask queue (Promises, queueMicrotask). Microtasks always drain completely before the next macrotask runs.",
    note: "",
    isPinned: false,
  },
  {
    question: "What is CSS specificity and how is it calculated?",
    answer: "Specificity determines which CSS rule wins when multiple rules target the same element. It is calculated as a 3-part score: (ID selectors, class/attribute/pseudo-class selectors, element/pseudo-element selectors). Inline styles beat all, and !important overrides everything.",
    note: "Often asked alongside cascade and inheritance.",
    isPinned: false,
  },
  // Session 1 — Backend
  {
    question: "What is the difference between authentication and authorization?",
    answer: "Authentication verifies who you are (login with email + password). Authorization determines what you are allowed to do (can this user delete this resource). You authenticate first, then authorize. A logged-in user can be authenticated but still unauthorized for a specific action.",
    note: "Relate this to your own project — JWT for auth, ownership checks for authorization.",
    isPinned: true,
  },
  {
    question: "When would you use indexing in MongoDB and what are its trade-offs?",
    answer: "Indexes speed up read queries by creating a separate data structure that MongoDB can scan instead of doing a full collection scan. Trade-offs: indexes consume additional disk space and slow down write operations because each write must also update the index. Index fields that are frequently queried or sorted on.",
    note: "",
    isPinned: false,
  },
  {
    question: "What is middleware in Express and how does the middleware chain work?",
    answer: "Middleware is a function with access to req, res, and next. Express processes middleware in the order they are registered. Each middleware either ends the request-response cycle or calls next() to pass control forward. If next(err) is called, Express skips to the error-handling middleware.",
    note: "Draw the chain: request → middleware 1 → middleware 2 → controller → response.",
    isPinned: false,
  },
  // Session 2 — Full Stack
  {
    question: "What is the difference between SQL and NoSQL databases?",
    answer: "SQL databases use structured tables with a fixed schema, support ACID transactions, and are best for relational data. NoSQL databases use flexible schemas and scale horizontally, making them good for unstructured or rapidly changing data. Choose SQL when data integrity and relationships matter most; NoSQL for high write throughput or schema flexibility.",
    note: "",
    isPinned: true,
  },
  {
    question: "Explain the concept of CORS and why it exists.",
    answer: "CORS is a browser security mechanism that blocks web pages from making requests to a different domain. The browser sends a preflight OPTIONS request to ask the server if cross-origin requests are allowed. The server responds with Access-Control headers. Without them, the browser rejects the response even if the server processed the request. Server-to-server calls are not affected.",
    note: "CORS is enforced by the browser, not the server.",
    isPinned: false,
  },
  {
    question: "Why should secrets never be committed to Git?",
    answer: "Environment variables store API keys and secrets outside source code. Secrets committed to Git are permanently in version history — even if deleted later they can be recovered from old commits. Use .env files locally and never commit them. Use your hosting platform's secret manager in production.",
    note: "Add .env to .gitignore immediately when starting a project.",
    isPinned: false,
  },
];

// ── Seeder Logic ───────────────────────────────────────────────────────────

const isFresh = process.argv.includes("--fresh");
const QUESTIONS_PER_SESSION = 3;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    if (isFresh) {
      await User.deleteMany({});
      await Session.deleteMany({});
      await Question.deleteMany({});
      console.log("Wiped existing data (--fresh flag used)");
    }

    // Hash passwords and create users
    const hashedUsers = await Promise.all(
      SEED_USERS.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 10),
      }))
    );
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`Created ${createdUsers.length} users`);

    // Assign sessions round-robin across users
    const sessionsWithUser = SEED_SESSIONS.map((s, i) => ({
      ...s,
      user: createdUsers[i % createdUsers.length]._id,
    }));
    const createdSessions = await Session.insertMany(sessionsWithUser);
    console.log(`Created ${createdSessions.length} sessions`);

    // Insert questions and link them back to their session
    let totalQuestions = 0;
    for (let i = 0; i < createdSessions.length; i++) {
      const sessionId = createdSessions[i]._id;
      const slice = SEED_QUESTIONS.slice(
        i * QUESTIONS_PER_SESSION,
        i * QUESTIONS_PER_SESSION + QUESTIONS_PER_SESSION
      );

      const created = await Question.insertMany(
        slice.map((q) => ({ ...q, session: sessionId }))
      );
      totalQuestions += created.length;

      createdSessions[i].questions = created.map((q) => q._id);
      await createdSessions[i].save();
    }
    console.log(`Created ${totalQuestions} questions`);

    console.log("\n── Seed complete ──────────────────────────");
    createdUsers.forEach((u) => {
      console.log(`  Email: ${u.email}   Password: Test@1234`);
    });
    console.log("────────────────────────────────────────────\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeder failed:", err.message);
    process.exit(1);
  }
}

seed();