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

## Entrenamiento de machine learning

El script independiente necesita Python, pandas y scikit-learn. Instala las dependencias y ejecuta:

```powershell
python -m pip install -r requirements.txt
python src/train_model.py ruta\a\tickets.csv
```

Si omites la ruta, busca `tickets.csv` en el directorio actual. El archivo debe tener las columnas `message` y `category`, con mensajes de soporte y sus categorías correctas, por ejemplo:

```csv
message,category
No puedo iniciar sesión,ACCESS
La aplicación muestra un error,BUG
```

Estos ejemplos solo muestran el formato: no bastan para entrenar. Usa datos etiquetados representativos de cada categoría, con al menos dos tickets por categoría y suficientes ejemplos para que las particiones de entrenamiento y prueba incluyan todas las categorías. El script divide los datos de forma estratificada, guarda el modelo en `models/ticket_classifier.joblib`, imprime un informe de clasificación y predice la categoría de un mensaje de ejemplo. No modifica los motores tradicional ni generativo.

Para ejecutar las pruebas del script:

```powershell
python -m unittest discover -s tests -p "test_train_model.py"
```

## Configuración del motor generativo

Por defecto se conecta a Ollama en `http://localhost:11434/v1` y usa el modelo `llama3.1`. Descarga/inicia Ollama y configura un modelo disponible, o crea `.env` con los datos del proveedor:

```text
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=tu_clave_local
AI_MODEL=gpt-4o-mini
```

No agregues `.env` al repositorio. La clave solo se envía en el encabezado de autorización al proveedor; no se registra ni se devuelve al cliente. El proveedor debe admitir `chat/completions` y `response_format: {"type":"json_object"}`.

Para usar un modelo local ya descargado, consulta `ollama list` y selecciona su nombre antes de iniciar el servidor o ejecutar el benchmark. Por ejemplo, en PowerShell:

```powershell
$env:AI_MODEL = "qwen2.5:3b"
```

## Contrato de la API

`POST /api/analyze`, con `Content-Type: application/json`:

```json
{
  "message": "No puedo iniciar sesión",
  "mode": "generative"
}
```

`mode` debe ser `traditional` o `generative`. Ambos responden con `category` (`ACCESS`, `BUG`, `FEATURE`, `SECURITY`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `response`, `requiresHumanReview` y `mode`. El texto debe tener entre 1 y 5000 caracteres. Solicitudes inválidas reciben HTTP 400; errores o respuestas inválidas del proveedor reciben errores HTTP 502/504 sin exponer información interna del proveedor.

También existe un modo opcional `python` para el clasificador de ML descrito abajo. Este devuelve solo `category` y `mode`; no sustituye los dos motores requeridos para la comparación.

El clasificador generativo trata el mensaje como entrada no confiable. Además, las señales de seguridad reconocidas por las reglas fuerzan categoría `SECURITY`, prioridad al menos `HIGH` y revisión humana, independientemente de las instrucciones incluidas en el mensaje. Las reglas no reconocen todas las maneras posibles de describir un incidente, por lo que requieren supervisión humana.

El motor también rechaza respuestas generativas que coincidan con patrones conocidos de solicitud de contraseñas, tokens u otros datos sensibles, o de afirmaciones de acciones no realizadas. Rechaza direcciones de correo y enlaces en las respuestas generadas para evitar datos de contacto inventados. Estos filtros no garantizan detectar todas las formulaciones posibles.

Si el contenido generado no cumple el formato o activa esos filtros, el motor solicita una nueva respuesta al proveedor una sola vez. Si el segundo intento también falla, devuelve un error; no sustituye la respuesta por texto escrito manualmente. Esto puede aumentar el tiempo de respuesta.

## Pruebas y evidencia comparativa

```powershell
npm test
npm run benchmark
```

El benchmark compara ambos motores con los mismos 10 casos de referencia (incluye ambigüedad e intentos de inyección de instrucciones), verifica el contrato y considera correcta una clasificación solo si coinciden categoría y prioridad. Las respuestas fallidas o rechazadas cuentan como incorrectas en el porcentaje sobre los 10 casos. Muestra los resultados y genera `evidence/benchmark-results.md` con la tabla, porcentajes y una conclusión breve. El benchmark llama al proveedor configurado de verdad y termina con error si alguna respuesta falla o es rechazada; no sustituye sus respuestas por resultados escritos manualmente. Define primero la referencia en [tests/cases.js](./tests/cases.js) si cambias la muestra.



## Clasificador de Machine Learning con Python

El proyecto incluye un clasificador tradicional basado en Machine Learning, desarrollado con Python y scikit-learn.

Este modelo utiliza TF-IDF y Regresión Logística para clasificar solicitudes de soporte en cuatro categorías:

- ACCESS: problemas de acceso a cuentas.
- BUG: errores o fallas del sistema.
- FEATURE: solicitudes de nuevas funcionalidades.
- SECURITY: incidentes relacionados con seguridad.

### Instalación de dependencias

Instalar las dependencias de Node.js:

```bash
npm install
```

Instalar las dependencias de Python:

```bash
python -m pip install -r requirements.txt
```

### Entrenamiento del modelo

Desde la raíz del proyecto, ejecutar:

```bash
python src/train_model.py
```

El modelo entrenado se guarda automáticamente en:

```text
models/ticket_classifier.joblib
```

Si se modifica el archivo tickets.csv, se debe volver a ejecutar el entrenamiento.

### Iniciar el servicio Python

En una terminal:

```bash
python src/model_service.py
```

El servicio estará disponible en:

```text
http://127.0.0.1:8000
```

Endpoint de clasificación:

```text
POST /predict
```

Ejemplo de solicitud:

```json
{
  "message": "No puedo iniciar sesión en mi cuenta"
}
```

### Iniciar el servidor Node.js

En otra terminal:

```bash
npm start
```

La API estará disponible en:

```text
http://localhost:3000
```

### Utilizar el clasificador Python desde Node.js

Endpoint:

```text
POST /api/analyze
```

Ejemplo de solicitud:

```json
{
  "message": "No puedo iniciar sesión en mi cuenta",
  "mode": "python"
}
```

Respuesta esperada:

```json
{
  "category": "ACCESS",
  "mode": "python"
}
```

Para utilizar el clasificador Python, ambos servicios deben estar ejecutándose al mismo tiempo.

### Ejecutar las pruebas

Pruebas de Node.js:

```bash
npm test
```

Pruebas de Python:

```bash
python -m unittest discover -s tests -p "test_*.py"
```
