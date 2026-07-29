import request from "supertest";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import app from "../app.js";
import User from "../models/User.js";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./setup.js";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

async function registerUser(overrides = {}) {
  const defaults = {
    name: "Test User",
    email: `user${Date.now()}${Math.random()}@test.com`,
    password: "password123",
    phone: "9876543210",
    role: "seeker",
  };
  const res = await request(app).post("/api/auth/register").send({ ...defaults, ...overrides });
  return res.body;
}

test("Bug 7: no password hash leaked", async () => {
  const seeker = await registerUser();
  const res = await request(app)
    .post("/api/auth/complete-profile")
    .set("Authorization", `Bearer ${seeker.token}`)
    .send({ workCategory: "daily_wage", data: {
      trade: "plumber", yearsInTrade: 5, toolsOwned: [], languagesSpoken: ["en"],
      availableDays: ["mon"], availableHours: { start: "09:00", end: "18:00" },
      serviceRadiusKm: 10, pastJobPhotos: [], emergencyContact: { name: "x", phone: "1" },
    }});
  expect(res.body.user?.password).toBeUndefined();
});

test("Bug 8: duplicate email case-insensitive rejected", async () => {
  await registerUser({ email: "dup@test.com" });
  const res = await registerUser({ email: "Dup@Test.com" });
  expect(res.error).toBe("Email already registered");
});

test("Bug 11: login rate limited after 5 attempts", async () => {
  await registerUser({ email: "throttle@test.com" });
  let last;
  for (let i = 0; i < 10; i++) {
    last = await request(app).post("/api/auth/login").send({ email: "throttle@test.com", password: "wrong" });
  }
  expect(last.status).toBe(429);
});

test("Bug 12: CORS does not reflect untrusted origin", async () => {
  const res = await request(app).get("/health").set("Origin", "https://evil.com");
  expect(res.headers["access-control-allow-origin"]).not.toBe("https://evil.com");
});

test("Bug 13: malformed ObjectId returns 400", async () => {
  const seeker = await registerUser();
  const res = await request(app)
    .get("/api/auth/internal/profile-status/not-a-valid-id")
    .set("Authorization", `Bearer ${seeker.token}`);
  expect(res.status).toBe(400);
});

test("Bug 17: health check reflects real DB state", async () => {
  const before = await request(app).get("/health");
  expect(before.body.status).toBe("ok");
  await mongoose.connection.close();
  const after = await request(app).get("/health");
  expect(after.body.status).not.toBe("ok");
  await connectTestDB();
});