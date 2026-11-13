# Evidencia de ejecución de la API

Servidor local iniciado con `npm start`, Ollama y el modelo `qwen2.5:3b`. Se enviaron solicitudes HTTP reales a `POST /api/analyze`.

## Modo tradicional

Petición:

```json
{
  "message": "No puedo iniciar sesión",
  "mode": "traditional"
}
```

Respuesta HTTP 200:

```json
{
  "category": "ACCESS",
  "priority": "MEDIUM",
  "response": "Lamentamos el inconveniente. Verifique sus credenciales y utilice la recuperación de contraseña si es necesario.",
  "requiresHumanReview": false,
  "mode": "traditional"
}
```

## Modo generativo

Petición:

```json
{
  "message": "No puedo iniciar sesión",
  "mode": "generative"
}
```

Respuesta HTTP 200 del modelo:

```json
{
  "category": "ACCESS",
  "priority": "HIGH",
  "response": "Estamos investigando el problema de inicio de sesión. Por favor, aguarde mientras revisamos la situación.",
  "requiresHumanReview": false,
  "mode": "generative"
}
```
