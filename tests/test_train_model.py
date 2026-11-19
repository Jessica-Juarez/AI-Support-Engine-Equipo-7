import csv
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "src" / "train_model.py"


class TrainModelTest(unittest.TestCase):
    def test_trains_and_reports_from_csv(self):
        with tempfile.TemporaryDirectory() as directory:
            csv_path = Path(directory) / "tickets.csv"
            with csv_path.open("w", encoding="utf-8", newline="") as file:
                writer = csv.writer(file)
                writer.writerow(["message", "category"])
                for index in range(10):
                    writer.writerow([f"login contraseña acceso {index}", "ACCESS"])
                    writer.writerow([f"brecha seguridad cuenta {index}", "SECURITY"])

            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(csv_path)],
                capture_output=True,
                text=True,
                encoding="utf-8",
                check=True,
            )

        self.assertIn("accuracy", result.stdout)
        self.assertIn("ACCESS", result.stdout)
        self.assertIn("SECURITY", result.stdout)
        self.assertRegex(result.stdout.splitlines()[-1], r"^\['(ACCESS|SECURITY)'\]$")

    def test_missing_csv_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(Path(directory) / "missing.csv")],
                capture_output=True,
                text=True,
            )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("FileNotFoundError", result.stderr)


if __name__ == "__main__":
    unittest.main()
