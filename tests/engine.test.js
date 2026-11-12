import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "node:http";
import { createApp } from "../src/server.js";
import { cases } from "./cases.js";
import { classifyTraditional } from "../src/traditional.js";

let server;
let baseUrl;

before(async () => {
  server = createServer(createApp());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test("traditional engine classifies the ten reference cases with a valid contract", () => {
  for (const testCase of cases) {
    const result = classifyTraditional(testCase.message);
    assert.equal(result.category, testCase.category, testCase.id);
    assert.equal(result.priority, testCase.priority, testCase.id);
    assert.equal(typeof result.response, "string", testCase.id);
    assert.equal(typeof result.requiresHumanReview, "boolean", testCase.id);
    assert.equal(result.mode, "traditional", testCase.id);
  }
});

test("traditional engine escalates security and prompt-injection cases for human review", () => {
  for (const testCase of cases.filter((item) => item.category === "SECURITY")) {
    const result = classifyTraditional(testCase.message);
    assert.equal(result.category, "SECURITY", testCase.id);
    assert.equal(result.requiresHumanReview, true, testCase.id);
  }
});

test("traditional engine recognizes a plain inability to enter as an access issue", () => {
  const result = classifyTraditional("No puedo entrar");
  assert.equal(result.category, "ACCESS");
  assert.equal(result.priority, "HIGH");
});

test("POST /api/analyze returns the traditional response contract", async () => {
  const response = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "No puedo iniciar sesión", mode: "traditional" }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), classifyTraditional("No puedo iniciar sesión"));
});

test("POST /api/analyze validates message and mode", async () => {
  const invalidMessage = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "   ", mode: "traditional" }),
  });
  const invalidMode = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Hola", mode: "manual" }),
  });
  const oversizedMessage = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "x".repeat(5001), mode: "traditional" }),
  });

  assert.equal(invalidMessage.status, 400);
  assert.equal(invalidMode.status, 400);
  assert.equal(oversizedMessage.status, 400);
});

test("generative provider failures are returned as sanitized errors", async () => {
  const app = createApp({
    generativeAnalyzer: async () => {
      throw Object.assign(new Error("private provider details"), { statusCode: 502 });
    },
  });
  const testServer = createServer(app);
  await new Promise((resolve) => testServer.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${testServer.address().port}/api/analyze`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Necesito ayuda", mode: "generative" }),
    });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      error: "El proveedor de IA devolvió una respuesta inválida o no pudo procesar la solicitud.",
    });
  } finally {
    await new Promise((resolve, reject) =>
      testServer.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
