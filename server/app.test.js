import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createDb } from "./lib/db.js";

async function testApp() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "civic-voice-"));
  const db = await createDb(path.join(directory, "db.json"));
  return createApp({ db });
}

describe("CivicVoice baseline API", () => {
  it("creates a missing datastore directory on first use", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "civic-voice-"));
    const db = await createDb(path.join(directory, "missing", "data", "db.json"));
    expect(db.data.users).toHaveLength(2);
  });

  it("logs in the seeded citizen", async () => {
    const app = await testApp();
    const response = await request(app).post("/api/login").send({
      nric: "S0000001A", password: "citizen123", role: "citizen",
    });
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("citizen");
  });

  it("rate-limits repeated failed sign-ins without blocking valid credentials", async () => {
    const app = await testApp();
    const invalidCredentials = { nric: "S0000001A", password: "wrong", role: "citizen" };
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await request(app).post("/api/login").send(invalidCredentials)).status).toBe(401);
    }
    const limited = await request(app).post("/api/login").send(invalidCredentials);
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe("RATE_LIMITED");
    const valid = await request(app).post("/api/login").send({ ...invalidCredentials, password: "citizen123" });
    expect(valid.status).toBe(200);
  });

  it("stores only password hashes for seeded users", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "civic-voice-"));
    const db = await createDb(path.join(directory, "db.json"));
    expect(db.data.users.every((user) => !user.password && user.passwordHash)).toBe(true);
  });

  it("accepts feedback", async () => {
    const app = await testApp();
    const response = await request(app).post("/api/feedback").send({
      nric: "S0000001A", name: "Aisha Rahman", message: "Please add more benches.",
    });
    expect(response.status).toBe(201);
    expect(response.body.feedback.message).toBe("Please add more benches.");
  });

  it("blocks the feedback list when a citizen forges the old role header", async () => {
    const app = await testApp();
    const response = await request(app).get("/api/feedback").set("x-user-role", "admin");
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("uses the structured error contract for validation and unknown API routes", async () => {
    const app = await testApp();
    const validation = await request(app).post("/api/feedback").send({});
    const missing = await request(app).get("/api/missing");
    expect(validation.body.error).toEqual({ code: "VALIDATION_ERROR", message: "Please enter feedback." });
    expect(missing.body.error.code).toBe("NOT_FOUND");
  });

  it("allows an authenticated admin to read the feedback list", async () => {
    const app = await testApp();
    const login = await request(app).post("/api/login").send({
      nric: "S0000002B", password: "admin123", role: "admin",
    });
    const response = await request(app).get("/api/feedback").set("authorization", `Bearer ${login.body.token}`);
    expect(response.status).toBe(200);
  });
});
