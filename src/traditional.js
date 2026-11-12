const CATEGORY_RESPONSES = {
  ACCESS:
    "Lamentamos el inconveniente. Verifique sus credenciales y utilice la recuperación de contraseña si es necesario.",
  BUG:
    "Gracias por reportar el problema. Comparta los pasos para reproducirlo y cualquier mensaje de error para que podamos investigarlo.",
  FEATURE:
    "Gracias por la sugerencia. La registraremos para evaluar su viabilidad y prioridad en el producto.",
  SECURITY:
    "Gracias por alertarnos. El equipo de seguridad revisará el incidente; no comparta credenciales ni detalles sensibles por este canal.",
};

const SECURITY_PATTERN =
  /\b(vulnerabil\w*|brecha|breach|filtraci[oó]n|exfiltraci[oó]n|exfiltration|data leak|ransomware|malware|phishing|exploit|inyecci[oó]n|injection|acceso no autorizado|unauthorized access|credenciales expuestas|exposed credentials|token robado|stolen token|cuenta comprometida|compromised account|security incident|security issue)\b/i;
const CRITICAL_PATTERN =
  /\b(cr[ií]tic\w*|brecha|breach|filtraci[oó]n|exfiltraci[oó]n|exfiltration|ransomware|acceso no autorizado|unauthorized access|token robado|stolen token|cuenta comprometida|compromised account|ca[ií]do para todos|ca[ií]da total|outage|all users|todos los usuarios|p[eé]rdida de datos|data loss)\b/i;
const ACCESS_PATTERN =
  /\b(iniciar sesi[oó]n|login|acceder|acceso|entrar|ingresar|contrase[nñ]a|password|autenticaci[oó]n|autenticar|cuenta|2fa|mfa|c[oó]digo de verificaci[oó]n)\b/i;
const BUG_PATTERN =
  /\b(error|bug|falla|fallo|crash|se cierra|no funciona|no carga|ca[ií]do|ca[ií]da|bloquea|bloqueado|incorrectamente|lento|problema t[eé]cnico)\b/i;
const FEATURE_PATTERN =
  /\b(funcionalidad|funci[oó]n|feature|agregar|a[nñ]adir|implementar|incorporar|soporte para|permitir|opci[oó]n|modo oscuro|exportar|integraci[oó]n)\b/i;

function choosePriority(message, category) {
  if (CRITICAL_PATTERN.test(message)) return "CRITICAL";
  if (category === "SECURITY") return "HIGH";
  if (
    /\b(urgente|producci[oó]n|no puedo trabajar|bloquea el trabajo|no puedo entrar|todos los usuarios|every user)\b/i.test(
      message,
    )
  ) {
    return "HIGH";
  }
  if (category === "FEATURE") {
    return /\b(pronto|urgente|cierre mensual|prioridad alta)\b/i.test(message)
      ? "MEDIUM"
      : "LOW";
  }
  return "MEDIUM";
}

export function classifyTraditional(message) {
  let category;
  let requiresHumanReview = false;

  if (SECURITY_PATTERN.test(message)) {
    category = "SECURITY";
    requiresHumanReview = true;
  } else if (ACCESS_PATTERN.test(message)) {
    category = "ACCESS";
  } else if (FEATURE_PATTERN.test(message)) {
    category = "FEATURE";
  } else if (BUG_PATTERN.test(message)) {
    category = "BUG";
  } else {
    category = "BUG";
    requiresHumanReview = true;
  }

  return {
    category,
    priority: choosePriority(message, category),
    response: CATEGORY_RESPONSES[category],
    requiresHumanReview,
    mode: "traditional",
  };
}
