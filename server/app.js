import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { createDb } from "./lib/db.js";
import { verifyPassword } from "./lib/passwords.js";

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;

export async function createApp(options = {}) {
  const db = options.db ?? (await createDb());
  const sessions = new Map();
  const failedLogins = new Map();
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "civic-voice-api" });
  });

  app.post("/api/login", (req, res) => {
    const { nric, password, role } = req.body ?? {};
    const user = db.data.users.find(
      (candidate) => candidate.nric === nric && verifyPassword(password, candidate.passwordHash) && candidate.role === role,
    );
    if (!user) {
      const now = Date.now();
      const record = failedLogins.get(nric);
      const attempts = !record || record.resetAt <= now ? 1 : record.attempts + 1;
      failedLogins.set(nric, { attempts, resetAt: now + LOGIN_WINDOW_MS });
      if (attempts > MAX_FAILED_LOGINS) return sendError(res, 429, "RATE_LIMITED", "Too many failed sign-in attempts. Try again later.");
      return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid NRIC, password, or sign-in mode.");
    }

    failedLogins.delete(nric);

    const token = crypto.randomBytes(32).toString("base64url");
    sessions.set(token, { nric: user.nric, name: user.name, role: user.role });
    return res.json({ token, user: { nric: user.nric, name: user.name, role: user.role } });
  });

  function requireAdmin(req, res, next) {
    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    const session = token && sessions.get(token);
    if (session?.role !== "admin") {
      return sendError(res, 403, "FORBIDDEN", "Admin access required.");
    }
    req.session = session;
    next();
  }

  app.get("/api/feedback", requireAdmin, (_req, res) => {
    return res.json({ feedback: db.data.feedback });
  });

  app.post("/api/feedback", async (req, res) => {
    const { nric, name, message } = req.body ?? {};
    if (!message) return sendError(res, 400, "VALIDATION_ERROR", "Please enter feedback.");
    const feedback = {
      id: crypto.randomUUID(), nric, name, message, category: "General", status: "New",
      createdAt: new Date().toISOString(),
    };
    db.data.feedback.unshift(feedback);
    await db.write();
    return res.status(201).json({ feedback });
  });

  app.use("/api", (_req, res) => sendError(res, 404, "NOT_FOUND", "API route not found."));

  return app;
}
