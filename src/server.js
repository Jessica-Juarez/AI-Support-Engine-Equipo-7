import "dotenv/config";
import express from "express";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyGenerative } from "./generative.js";
import { classifyTraditional } from "./traditional.js";

export function createApp({ generativeAnalyzer = classifyGenerative } = {}) {
  const app = express();
  app.use(express.json({ limit: "35kb" }));

  app.post("/api/analyze", async (req, res, next) => {
    const { message, mode } = req.body ?? {};
    if (
      typeof message !== "string" ||
      message.trim().length === 0 ||
      message.length > 5000
    ) {
      return res.status(400).json({
        error: "message debe ser un texto no vacío de máximo 5000 caracteres.",
      });
    }
    if (mode !== "traditional" && mode !== "generative") {
      return res.status(400).json({
        error: 'mode debe ser "traditional" o "generative".',
      });
    }

    try {
      const result =
        mode === "traditional"
          ? classifyTraditional(message.trim())
          : await generativeAnalyzer(message.trim());
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof SyntaxError && "body" in error) {
      return res.status(400).json({ error: "El cuerpo de la solicitud no es JSON válido." });
    }
    if (error.type === "entity.too.large") {
      return res.status(413).json({ error: "El cuerpo de la solicitud excede el límite permitido." });
    }
    const statusCode = error.statusCode || 500;
    const message =
      statusCode === 504
        ? "El proveedor de IA excedió el tiempo límite."
        : statusCode === 502
          ? "El proveedor de IA devolvió una respuesta inválida o no pudo procesar la solicitud."
          : "Error interno del servidor.";
    return res.status(statusCode).json({ error: message });
  });

  return app;
}

const isDirectExecution =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, () => {
    console.log(`AI Support Engine escuchando en http://localhost:${port}`);
  });
}
