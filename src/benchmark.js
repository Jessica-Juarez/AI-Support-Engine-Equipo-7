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
        category: "INVALID",
        priority: "INVALID",
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
  const validGenerative = generative.filter((result) => result.formatValid).length;
  const generativeScore = percentage(generative);
  const generativeCategoryMatches = generative.filter(
    (result, index) =>
      result.formatValid && result.category === cases[index].category,
  ).length;
  const generativePriorityOnlyErrors = generative.filter(
    (result, index) =>
      result.formatValid &&
      result.category === cases[index].category &&
      result.priority !== cases[index].priority,
  ).length;
  let conclusion;
  if (validGenerative === 0) {
    conclusion = `No se obtuvo ninguna respuesta generativa válida (${generative.length} casos intentados). No es posible evaluar el motor generativo; verifica el proveedor y vuelve a ejecutar el benchmark.`;
  } else if (traditionalScore === generativeScore) {
    conclusion = `Ambos motores obtuvieron ${traditionalScore}% de clasificaciones exactas en estos casos. El generativo acertó ${generativeCategoryMatches}/${cases.length} categorías y tuvo ${generativePriorityOnlyErrors} errores de prioridad. ${cases.length - validGenerative} respuestas tuvieron formato inválido. La muestra no permite generalizar el desempeño.`;
  } else {
    const winner = traditionalScore > generativeScore ? "tradicional" : "generativo";
    conclusion = `El motor ${winner} obtuvo mayor exactitud (${Math.max(traditionalScore, generativeScore)}% frente a ${Math.min(traditionalScore, generativeScore)}%). El generativo acertó ${generativeCategoryMatches}/${cases.length} categorías, pero tuvo ${generativePriorityOnlyErrors} errores de prioridad; ${cases.length - validGenerative} respuestas tuvieron formato inválido. Las reglas coincidieron mejor con esta referencia. La muestra es pequeña y no permite generalizar.`;
  }

  return [
    "# Evidencia comparativa",
    "",
    `Casos evaluados: ${cases.length}. Se considera correcto cuando categoría y prioridad coinciden con la referencia y el contrato es válido.`,
    "",
    ...table,
    "",
    `- Exactitud tradicional: ${traditionalScore}%`,
    `- Exactitud generativa: ${generativeScore}% (${validGenerative}/${cases.length} respuestas con formato válido)`,
    "",
    `Conclusión: ${conclusion}`,
    "",
  ].join("\n");
}

const traditionalResults = await evaluate("traditional", classifyTraditional);
const generativeResults = await evaluate("generative", classifyGenerative);
const report = renderReport(traditionalResults, generativeResults);
await mkdir(new URL("../evidence/", import.meta.url), { recursive: true });
await writeFile(new URL("../evidence/benchmark-results.md", import.meta.url), report, "utf8");
console.log(report);
if (generativeResults.every((result) => result.error)) {
  console.error("Ninguna llamada generativa fue procesada correctamente; revisa la configuración y disponibilidad del proveedor.");
  process.exitCode = 1;
}
