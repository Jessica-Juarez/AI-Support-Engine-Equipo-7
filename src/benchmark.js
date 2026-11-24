import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { classifyGenerative } from "./generative.js";
import { classifyTraditional } from "./traditional.js";
import { cases } from "../tests/cases.js";

function isValidResult(result, mode) {
  return (
    ["ACCESS", "BUG", "FEATURE", "SECURITY"].includes(result?.category) &&
    ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(result?.priority) &&
    typeof result?.response === "string" &&
    result.response.trim().length > 0 &&
    typeof result?.requiresHumanReview === "boolean" &&
    result?.mode === mode
  );
}

async function evaluate(mode, analyzer) {
  const results = [];
  for (const testCase of cases) {
    try {
      const result = await analyzer(testCase.message);
      results.push({
        id: testCase.id,
        expectedCategory: testCase.category,
        expectedPriority: testCase.priority,
        category: result.category,
        priority: result.priority,
        response: result.response,
        requiresHumanReview: result.requiresHumanReview,
        mode: result.mode,
        formatValid: isValidResult(result, mode),
        correct:
          isValidResult(result, mode) &&
          result.category === testCase.category &&
          result.priority === testCase.priority,
      });
    } catch (error) {
      results.push({
        id: testCase.id,
        expectedCategory: testCase.category,
        expectedPriority: testCase.priority,
        category: "ERROR",
        priority: "ERROR",
        formatValid: false,
        correct: false,
        error: error.message,
      });
    }
  }
  return results;
}

function percentage(results) {
  return Math.round((results.filter((result) => result.correct).length / results.length) * 100);
}

function renderReport(traditional, generative) {
  const table = ["| Caso | Esperado | Tradicional | Formato | Correcto | Generativo | Formato | Correcto | Error |", "|---|---|---|---|---|---|---|---|---|"];
  for (let index = 0; index < cases.length; index += 1) {
    const expected = `${cases[index].category}/${cases[index].priority}`;
    const rule = traditional[index];
    const model = generative[index];
    const error = model.error ? model.error.replace(/\|/g, "\\|") : "-";
    table.push(
      `| ${cases[index].id} | ${expected} | ${rule.category}/${rule.priority} | ${rule.formatValid ? "Sí" : "No"} | ${rule.correct ? "Sí" : "No"} | ${model.category}/${model.priority} | ${model.formatValid ? "Sí" : "No"} | ${model.correct ? "Sí" : "No"} | ${error} |`,
    );
  }

  const traditionalScore = percentage(traditional);
  const completedGenerative = generative.filter((result) => !result.error);
  const generativeScore = percentage(generative);
  let conclusion;
  if (completedGenerative.length === 0) {
    conclusion = "El motor generativo no produjo ninguna respuesta válida; no se declara un ganador. Revisa el proveedor y vuelve a ejecutar el benchmark.";
  } else if (traditionalScore === generativeScore) {
    conclusion = `Ambos motores obtuvieron ${traditionalScore}% de clasificaciones exactas en estos casos. La muestra es pequeña y contiene casos ambiguos y de inyección; no permite generalizar el desempeño.`;
  } else {
    const winner = traditionalScore > generativeScore ? "tradicional" : "generativo";
    conclusion = `El motor ${winner} obtuvo mayor exactitud (${Math.max(traditionalScore, generativeScore)}% frente a ${Math.min(traditionalScore, generativeScore)}%) porque coincidió con la categoría y prioridad de referencia en más casos. La muestra es pequeña y el resultado generativo depende del modelo configurado.`;
  }
  if (completedGenerative.length < cases.length) {
    conclusion += ` Las respuestas generativas fallidas o rechazadas (${cases.length - completedGenerative.length}) cuentan como incorrectas.`;
  }

  const example = (result) => JSON.stringify({
    category: result.category,
    priority: result.priority,
    response: result.response,
    requiresHumanReview: result.requiresHumanReview,
    mode: result.mode,
  }, null, 2);
  const traditionalExample = traditional.find((result) => result.formatValid);
  const generativeExample = generative.find((result) => result.formatValid);

  return [
    "# Evidencia comparativa",
    "",
    `Casos evaluados: ${cases.length}. Se considera correcto cuando categoría y prioridad coinciden con la referencia y el contrato es válido.`,
    `Modelo generativo configurado: ${process.env.AI_MODEL || "llama3.1"}.`,
    `Mensajes y referencias: [tests/cases.js](../tests/cases.js).`,
    "",
    ...table,
    "",
    `- Exactitud tradicional: ${traditionalScore}%`,
    `- Exactitud generativa: ${generativeScore}% (${completedGenerative.length}/${cases.length} respuestas procesadas; los errores cuentan como incorrectos)`,
    "",
    `Conclusión: ${conclusion}`,
    "",
    "## Ejemplos de respuestas",
    "",
    ...(traditionalExample
      ? [`Tradicional (${traditionalExample.id}):`, "", "```json", example(traditionalExample), "```", ""]
      : []),
    ...(generativeExample
      ? [`Generativo (${generativeExample.id}):`, "", "```json", example(generativeExample), "```", ""]
      : []),
  ].join("\n");
}

const traditionalResults = await evaluate("traditional", classifyTraditional);
const generativeResults = await evaluate("generative", classifyGenerative);
const report = renderReport(traditionalResults, generativeResults);
await mkdir(new URL("../evidence/", import.meta.url), { recursive: true });
await writeFile(new URL("../evidence/benchmark-results.md", import.meta.url), report, "utf8");
console.log(report);
if (generativeResults.some((result) => result.error)) {
  console.error("La comparación quedó incompleta: revisa la configuración y disponibilidad del proveedor generativo.");
  process.exitCode = 1;
}
