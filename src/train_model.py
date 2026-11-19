import argparse

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


def main():
    parser = argparse.ArgumentParser(
        description="Entrena y evalúa un clasificador de tickets desde un CSV."
    )
    parser.add_argument(
        "csv",
        nargs="?",
        default="tickets.csv",
        help="Ruta del CSV con columnas message y category (por defecto: tickets.csv).",
    )
    args = parser.parse_args()

    data = pd.read_csv(args.csv)
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

    predictions = model.predict(X_test)
    print(classification_report(y_test, predictions))
    print(model.predict(["Alguien entró a mi cuenta sin autorización"]))


if __name__ == "__main__":
    main()
