import pandas as pd
import os
import sys
from src.utils.logger import logger
from src.utils.exception import CustomException
from src.config import DataConfig


class DataIngestion:
    def __init__(self):
        self.config = DataConfig()
        self.udemy_path = os.path.join(self.config.raw_data_dir, "udemy.csv")
        self.coursera_path = os.path.join(self.config.raw_data_dir, "coursera.csv")

    def load_data(self):
        try:
            logger.info("Starting data loading process")

            df_udemy = pd.read_csv(self.udemy_path)
            df_coursera = pd.read_csv(self.coursera_path)

            logger.info("Datasets loaded successfully")

            return df_udemy, df_coursera

        except Exception as e:
            raise CustomException(e, sys)

    def initiate_data_ingestion(self):
        try:
            df_udemy, df_coursera = self.load_data()
            logger.info("Data ingestion completed successfully")
            return df_udemy, df_coursera

        except Exception as e:
            raise CustomException(e, sys)