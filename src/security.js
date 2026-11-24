export const SECURITY_PATTERN =
  /\b(vulnerabil\w*|brecha|breach|filtraci[oó]n|exfiltraci[oó]n|exfiltration|data leak|ransomware|malware|phishing|exploit|inyecci[oó]n|injection|acceso no autorizado|unauthorized access|credenciales expuestas|exposed credentials|token robado|stolen token|cuenta comprometida|compromised account|security incident|security issue|hackea\w*|hacke(?:ado|ada|ados|adas|aron)|sin (?:mi |su )?(?:autorizaci[oó]n|permiso))\b/i;

export const SECRET_REQUEST_PATTERN =
  /(?<!no )(?<!nunca )\b(proporcion\w*|env[ií]\w*|compart\w*|ind[ií]qu\w*|escrib\w*|d[ií]game|dime|introdu\w*|ingres\w*|facilit\w*)\b[^.!?\n]{0,150}\b(contrase[nñ]a\w*|claves?|tokens?|c[oó]digos? de verificaci[oó]n|credenciales)\b/i;
