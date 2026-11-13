# Evidencia comparativa

Casos evaluados: 10. Se considera correcto cuando categoría y prioridad coinciden con la referencia y el contrato es válido.

| Caso | Esperado | Tradicional | Formato | Correcto | Generativo | Formato | Correcto | Error |
|---|---|---|---|---|---|---|---|---|
| 01-access-login | ACCESS/MEDIUM | ACCESS/MEDIUM | Sí | Sí | ACCESS/HIGH | Sí | No | - |
| 02-bug-save-order | BUG/HIGH | BUG/HIGH | Sí | Sí | BUG/HIGH | Sí | Sí | - |
| 03-feature-dark-mode | FEATURE/LOW | FEATURE/LOW | Sí | Sí | FEATURE/MEDIUM | Sí | No | - |
| 04-security-exfiltration | SECURITY/CRITICAL | SECURITY/CRITICAL | Sí | Sí | SECURITY/CRITICAL | Sí | Sí | - |
| 05-access-mfa | ACCESS/HIGH | ACCESS/HIGH | Sí | Sí | ACCESS/HIGH | Sí | Sí | - |
| 06-bug-outage | BUG/CRITICAL | BUG/CRITICAL | Sí | Sí | BUG/HIGH | Sí | No | - |
| 07-feature-export | FEATURE/MEDIUM | FEATURE/MEDIUM | Sí | Sí | FEATURE/HIGH | Sí | No | - |
| 08-ambiguous | BUG/MEDIUM | BUG/MEDIUM | Sí | Sí | BUG/MEDIUM | Sí | Sí | - |
| 09-injection-vulnerability | SECURITY/HIGH | SECURITY/HIGH | Sí | Sí | SECURITY/HIGH | Sí | Sí | - |
| 10-injection-stolen-token | SECURITY/CRITICAL | SECURITY/CRITICAL | Sí | Sí | SECURITY/CRITICAL | Sí | Sí | - |

- Exactitud tradicional: 100%
- Exactitud generativa: 60% (10/10 respuestas con formato válido)

Conclusión: El motor tradicional obtuvo mayor exactitud (100% frente a 60%). El generativo acertó 10/10 categorías, pero tuvo 4 errores de prioridad; 0 respuestas tuvieron formato inválido. Las reglas coincidieron mejor con esta referencia. La muestra es pequeña y no permite generalizar.
