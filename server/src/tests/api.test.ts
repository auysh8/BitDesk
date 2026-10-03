import test, { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../app.js";
import { connectDB, disconnectDB } from "../database/db.js";

describe("BitDesk API Suite", () => {
  let server: any;
  let baseUrl: string;

  before(async () => {
    await connectDB();
    server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 5000;
    baseUrl = `http://localhost:${port}`;
  });

  after(async () => {
    if (server) server.close();
    await disconnectDB();
  });

  it("GET /api/health should return status 200 with healthy payload", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.status, "healthy");
  });

  it("POST /api/auth/login-password with invalid credentials should return 401", async () => {
    const response = await fetch(`${baseUrl}/api/auth/login-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@bitdesk.dev", password: "WrongPassword!" }),
    });
    const data = await response.json();

    assert.equal(response.status, 401);
    assert.equal(data.success, false);
  });

  it("GET /api-docs should serve OpenAPI Swagger documentation HTML", async () => {
    const response = await fetch(`${baseUrl}/api-docs/`);
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.ok(text.includes("Swagger UI") || text.includes("swagger"));
  });

  it("GET /api/categories without token should enforce RBAC and return 401", async () => {
    const response = await fetch(`${baseUrl}/api/categories`);
    const data = await response.json();

    assert.equal(response.status, 401);
    assert.equal(data.success, false);
  });
});
