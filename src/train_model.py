
import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


def main():
    parser = argparse.ArgumentParser(
        description="Entrena y guarda un clasificador de tickets."
    )
    parser.add_argument(
        "csv",
        nargs="?",
        default="tickets.csv",
        help="Ruta del CSV con columnas message y category.",
    )
    parser.add_argument(
        "--model-output",
        default="models/ticket_classifier.joblib",
        help="Ruta donde se guardará el modelo entrenado.",
    )
    args = parser.parse_args()

    data = pd.read_csv(args.csv)

    required_columns = {"message", "category"}
    if not required_columns.issubset(data.columns):
        raise ValueError(
            "El CSV debe contener las columnas message y category."
        )

    data = data.dropna(subset=["message", "category"])

    X_train, X_test, y_train, y_test = train_test_split(
        data["message"],
        data["category"],
        test_size=0.2,
        stratify=data["category"],
        random_state=42,
    )

    model = Pipeline(
        [
            ("vectorizer", TfidfVectorizer(ngram_range=(1, 2))),
            ("classifier", LogisticRegression(max_iter=1000)),
        ]
    )

    model.fit(X_train, y_train)

    output_path = Path(args.model_output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output_path)

    print(f"Modelo guardado en: {output_path}")

    predictions = model.predict(X_test)
    print(classification_report(y_test, predictions))
    print(model.predict(["Alguien entró a mi cuenta sin autorización"]))


if __name__ == "__main__":
    main()
