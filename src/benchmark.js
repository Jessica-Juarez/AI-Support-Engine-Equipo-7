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
  const generativeScore =
    completedGenerative.length > 0 ? percentage(completedGenerative) : null;
  let conclusion;
  if (completedGenerative.length !== cases.length) {
    conclusion = `La comparación generativa está incompleta (${completedGenerative.length}/${cases.length} casos procesados); no se declara un ganador. Configura o repara el proveedor y vuelve a ejecutar el benchmark.`;
  } else if (traditionalScore === generativeScore) {
    conclusion = `Ambos motores obtuvieron ${traditionalScore}% de clasificaciones exactas en estos casos. La muestra es pequeña y contiene casos ambiguos y de inyección; no permite generalizar el desempeño.`;
  } else {
    const winner = traditionalScore > generativeScore ? "tradicional" : "generativo";
    conclusion = `El motor ${winner} obtuvo mayor exactitud (${Math.max(traditionalScore, generativeScore)}% frente a ${Math.min(traditionalScore, generativeScore)}%) en esta muestra. El resultado depende de los casos de referencia y, para el generativo, del modelo configurado.`;
  }

  return [
    "# Evidencia comparativa",
    "",
    `Casos evaluados: ${cases.length}. Se considera correcto cuando categoría y prioridad coinciden con la referencia y el contrato es válido.`,
    "",
    ...table,
    "",
    `- Exactitud tradicional: ${traditionalScore}%`,
    `- Exactitud generativa: ${generativeScore === null ? `No disponible (${completedGenerative.length}/${cases.length} casos procesados)` : `${generativeScore}% (${completedGenerative.length}/${cases.length} casos procesados)`}`,
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
if (generativeResults.some((result) => result.error)) {
  console.error("La comparación quedó incompleta: revisa la configuración y disponibilidad del proveedor generativo.");
  process.exitCode = 1;
}
