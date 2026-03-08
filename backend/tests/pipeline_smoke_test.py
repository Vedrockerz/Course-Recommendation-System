from src.pipelines.training_pipeline import TrainingPipeline
from src.pipelines.prediction_pipeline import PredictionPipeline


def test_full_pipeline_smoke():
    print("1) Running training pipeline...")
    TrainingPipeline().run_pipeline()
    print("Training completed.\n")

    predictor = PredictionPipeline()

    test_cases = [
        {"query": "Data Science", "level": None, "duration_category": None, "top_k": 5},
        {"query": "Python for beginners", "level": "Beginner", "duration_category": "Short", "top_k": 5},
        {"query": "Machine Learning", "level": "Intermediate", "duration_category": "Medium", "top_k": 5},
        {"query": "Deep Learning", "level": None, "duration_category": "Long", "top_k": 5},
    ]

    for idx, case in enumerate(test_cases, start=1):
        print(f"2.{idx}) Testing: {case}")

        results = predictor.predict(
            query=case["query"],
            level=case["level"],
            duration_category=case["duration_category"],
            top_k=case["top_k"],
        )

        print(f"Returned rows: {len(results)}")

        if not results.empty:
            print(results.head(3).to_string(index=False))
        else:
            print("No recommendations returned for this filter.")

        print("-" * 80)


if __name__ == "__main__":
    test_full_pipeline_smoke()
