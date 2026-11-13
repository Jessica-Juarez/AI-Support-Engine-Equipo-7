# Integrantes 
Jessica Juárez Rodríguez 3523110159
Angel Gabriel Guzman Miguel 3523110231
Vanessa Hernandez Lopez 3523110495

# AI Support Engine

API de clasificación de solicitudes de soporte con un motor de reglas y un motor generativo compatible con la API de chat de OpenAI. El modo generativo usa un modelo real configurado por el usuario; no tiene respuestas generativas simuladas.

## Requisitos

- Node.js 18.17 o posterior.
- Para `generative`: Ollama con un modelo descargado, o un proveedor compatible con `POST /v1/chat/completions`.

## Instalación y ejecución

```powershell
npm install
npm test
npm start
```

El servidor escucha en `http://localhost:3000` (puede cambiarse con `PORT`). Ejemplo:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/analyze `
  -Method Post -ContentType 'application/json' `
  -Body '{"message":"No puedo iniciar sesión","mode":"traditional"}'
```

## Configuración del motor generativo

Por defecto se conecta a Ollama en `http://localhost:11434/v1` y usa el modelo `llama3.1`. Descarga/inicia Ollama y configura un modelo disponible, o crea `.env` con los datos del proveedor:

```text
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=tu_clave_local
AI_MODEL=gpt-4o-mini
```

No agregues `.env` al repositorio. La clave solo se envía en el encabezado de autorización al proveedor; no se registra ni se devuelve al cliente. El proveedor debe admitir `chat/completions` y `response_format: {"type":"json_object"}`.

## Contrato de la API

`POST /api/analyze`, con `Content-Type: application/json`:

```json
{
  "message": "No puedo iniciar sesión",
  "mode": "generative"
}
```

`mode` debe ser `traditional` o `generative`. Ambos responden con `category` (`ACCESS`, `BUG`, `FEATURE`, `SECURITY`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `response`, `requiresHumanReview` y `mode`. El texto debe tener entre 1 y 5000 caracteres. Solicitudes inválidas reciben HTTP 400; errores o respuestas inválidas del proveedor reciben errores HTTP 502/504 sin exponer información interna del proveedor.

El clasificador generativo trata el mensaje como entrada no confiable. Además, una señal explícita de seguridad en el mensaje fuerza categoría `SECURITY`, prioridad al menos `HIGH` y revisión humana, independientemente de las instrucciones incluidas en el mensaje.

## Pruebas y evidencia comparativa

```powershell
npm test
npm run benchmark
```

El benchmark compara ambos motores con los mismos 10 casos de referencia (incluye ambigüedad e intentos de inyección de instrucciones), verifica el contrato y considera correcta una clasificación solo si coinciden categoría y prioridad. Muestra los resultados y genera `evidence/benchmark-results.md` con la tabla, porcentajes y una conclusión breve. El benchmark llama al proveedor configurado de verdad y falla explícitamente si no está disponible; no sustituye sus respuestas por resultados escritos manualmente. Define primero la referencia en [tests/cases.js](./tests/cases.js) si cambias la muestra.
