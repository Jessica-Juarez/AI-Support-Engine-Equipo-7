# Evidencia comparativa

Casos evaluados: 10. Se considera correcto cuando categoría y prioridad coinciden con la referencia y el contrato es válido.
Modelo generativo configurado: qwen2.5:3b.
Mensajes y referencias: [tests/cases.js](../tests/cases.js).

| Caso | Esperado | Tradicional | Formato | Correcto | Generativo | Formato | Correcto | Error |
|---|---|---|---|---|---|---|---|---|
| 01-access-login | ACCESS/MEDIUM | ACCESS/MEDIUM | Sí | Sí | ACCESS/MEDIUM | Sí | Sí | - |
| 02-bug-save-order | BUG/HIGH | BUG/HIGH | Sí | Sí | BUG/HIGH | Sí | Sí | - |
| 03-feature-dark-mode | FEATURE/LOW | FEATURE/LOW | Sí | Sí | FEATURE/MEDIUM | Sí | No | - |
| 04-security-exfiltration | SECURITY/CRITICAL | SECURITY/CRITICAL | Sí | Sí | SECURITY/CRITICAL | Sí | Sí | - |
| 05-access-mfa | ACCESS/HIGH | ACCESS/HIGH | Sí | Sí | ACCESS/MEDIUM | Sí | No | - |
| 06-bug-outage | BUG/CRITICAL | BUG/CRITICAL | Sí | Sí | BUG/HIGH | Sí | No | - |
| 07-feature-export | FEATURE/MEDIUM | FEATURE/MEDIUM | Sí | Sí | FEATURE/MEDIUM | Sí | Sí | - |
| 08-ambiguous | BUG/MEDIUM | BUG/MEDIUM | Sí | Sí | ACCESS/MEDIUM | Sí | No | - |
| 09-injection-vulnerability | SECURITY/HIGH | SECURITY/HIGH | Sí | Sí | SECURITY/HIGH | Sí | Sí | - |
| 10-injection-stolen-token | SECURITY/CRITICAL | SECURITY/CRITICAL | Sí | Sí | SECURITY/CRITICAL | Sí | Sí | - |

- Exactitud tradicional: 100%
- Exactitud generativa: 60% (10/10 respuestas procesadas; los errores cuentan como incorrectos)

Conclusión: El motor tradicional obtuvo mayor exactitud (100% frente a 60%) porque coincidió con la categoría y prioridad de referencia en más casos. La muestra es pequeña y el resultado generativo depende del modelo configurado.

## Ejemplos de respuestas

Tradicional (01-access-login):

```json
{
  "category": "ACCESS",
  "priority": "MEDIUM",
  "response": "Lamentamos el inconveniente. Verifique sus credenciales y utilice la recuperación de contraseña si es necesario.",
  "requiresHumanReview": false,
  "mode": "traditional"
}
```

Generativo (01-access-login):

```json
{
  "category": "ACCESS",
  "priority": "MEDIUM",
  "response": "Por favor, intenta restablecer tu contraseña.",
  "requiresHumanReview": false,
  "mode": "generative"
}
```
