
export async function classifyPython(message) {
  const pythonServiceUrl =
    process.env.PYTHON_SERVICE_URL ||
    "http://127.0.0.1:8000/predict";
  let response;

  try {
    response = await fetch(pythonServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
  } catch {
    const error = new Error("No se pudo conectar con Python.");
    error.statusCode = 502;
    error.publicMessage =
      "El servicio de clasificación Python no está disponible.";
    throw error;
  }

  if (!response.ok) {
    const error = new Error("El servicio Python respondió con error.");
    error.statusCode = 502;
    error.publicMessage =
      "El servicio de clasificación Python no pudo procesar la solicitud.";
    throw error;
  }

  let result;

  try {
    result = await response.json();
  } catch {
    const error = new Error("La respuesta de Python no es JSON válido.");
    error.statusCode = 502;
    error.publicMessage =
      "El servicio de clasificación Python devolvió una respuesta inválida.";
    throw error;
  }

  if (
    !result ||
    typeof result.category !== "string" ||
    !["ACCESS", "BUG", "FEATURE", "SECURITY"].includes(result.category)
  ) {
    const error = new Error("Python devolvió una categoría inválida.");
    error.statusCode = 502;
    error.publicMessage =
      "El servicio de clasificación Python devolvió una respuesta inválida.";
    throw error;
  }

  return {
    category: result.category,
    mode: "python",
  };
}
