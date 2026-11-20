
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../src/server.js";

test("POST /api/analyze conecta Node.js con el servicio Python", async (t) => {
  const previousUrl = process.env.PYTHON_SERVICE_URL;

  // Simula el servicio Python para probar la comunicación HTTP.
  const pythonServer = createServer((req, res) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      const request = JSON.parse(body);

      assert.equal(
        request.message,
        "No puedo iniciar sesión en mi cuenta"
      );

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          category: "ACCESS",
          mode: "python",
        })
      );
    });
  });

  await new Promise((resolve) => {
    pythonServer.listen(0, "127.0.0.1", resolve);
  });

  const pythonAddress = pythonServer.address();

  process.env.PYTHON_SERVICE_URL =
    `http://127.0.0.1:${pythonAddress.port}/predict`;

  const appServer = createApp().listen(0, "127.0.0.1");

  await new Promise((resolve) => {
    appServer.once("listening", resolve);
  });

  t.after(async () => {
    await new Promise((resolve) => appServer.close(resolve));
    await new Promise((resolve) => pythonServer.close(resolve));

    if (previousUrl === undefined) {
      delete process.env.PYTHON_SERVICE_URL;
    } else {
      process.env.PYTHON_SERVICE_URL = previousUrl;
    }
  });

  const address = appServer.address();

  const response = await fetch(
    `http://127.0.0.1:${address.port}/api/analyze`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "No puedo iniciar sesión en mi cuenta",
        mode: "python",
      }),
    }
  );

  assert.equal(response.status, 200);

  const result = await response.json();

  assert.deepEqual(result, {
    category: "ACCESS",
    mode: "python",
  });
});
