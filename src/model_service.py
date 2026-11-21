
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import joblib


MODEL_PATH = (
    Path(__file__).resolve().parents[1]
    / "models"
    / "ticket_classifier.joblib"
)


class ModelRequestHandler(BaseHTTPRequestHandler):

    def send_json(self, status, data):
        response = json.dumps(data).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)

    def do_POST(self):
        if self.path != "/predict":
            self.send_json(404, {"error": "Ruta no encontrada."})
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))

            if content_length <= 0 or content_length > 35000:
                self.send_json(400, {"error": "Tamaño de solicitud inválido."})
                return

            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            message = data.get("message")

            if (
                not isinstance(message, str)
                or not message.strip()
                or len(message) > 5000
            ):
                self.send_json(
                    400,
                    {"error": "message debe ser un texto no vacío de máximo 5000 caracteres."},
                )
                return

            prediction = self.server.model.predict([message.strip()])[0]

            self.send_json(
                200,
                {
                    "category": str(prediction),
                    "mode": "python",
                },
            )

        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"error": "El cuerpo debe contener JSON válido."})

        except Exception:
            self.send_json(500, {"error": "No se pudo clasificar el mensaje."})

    def log_message(self, format, *args):
        print(f"[Python Service] {format % args}")


def create_server(model, host="127.0.0.1", port=8000):
    server = ThreadingHTTPServer((host, port), ModelRequestHandler)
    server.model = model
    return server


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"No se encontró el modelo entrenado: {MODEL_PATH}. "
            "Ejecuta primero src/train_model.py."
        )

    model = joblib.load(MODEL_PATH)

    host = os.getenv("PYTHON_HOST", "127.0.0.1")
    port = int(os.getenv("PYTHON_PORT", "8000"))

    server = create_server(model, host, port)

    print(f"Servicio Python escuchando en http://{host}:{port}")
    print("Endpoint disponible: POST /predict")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nCerrando servicio Python...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
