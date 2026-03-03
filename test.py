from src.pipelines.data_pipeline import DataPipeline

if __name__ == "__main__":
    pipeline = DataPipeline()
    pipeline.run_pipeline()
    print("Data pipeline executed successfully.")