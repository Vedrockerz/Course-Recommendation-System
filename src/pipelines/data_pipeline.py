import os
import sys

from src.data_processing.ingestion import DataIngestion
from src.data_processing.transformation import DataTransformation
from src.config import DataConfig
from src.utils.logger import logging
from src.utils.exception import CustomException


class DataPipeline:

    def __init__(self):
        self.ingestion = DataIngestion()
        self.transformation = DataTransformation()
        self.config = DataConfig()

    def run_pipeline(self):
        try:
            logging.info("Starting full data pipeline")

            # 1️⃣ Load raw datasets
            df_udemy, df_coursera = self.ingestion.load_data()

            # 2️⃣ Run all transformations in one step
            df_master = self.transformation.run_full_transformation(
                df_udemy, df_coursera
            )

            # 3️⃣ Save processed dataset
            os.makedirs(self.config.processed_data_dir, exist_ok=True)
            df_master.to_csv(self.config.final_data_path, index=False)

            logging.info("Data pipeline completed successfully")

        except Exception as e:
            logging.error("Error in data pipeline")
            raise CustomException(e, sys)