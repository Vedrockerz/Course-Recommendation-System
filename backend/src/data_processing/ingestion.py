import pandas as pd
import sys
from src.utils.logger import logging
from src.utils.exception import CustomException
from src.config import DataConfig


class DataIngestion:
    def __init__(self):
        self.config = DataConfig()
        self.udemy_path = self.config.udemy_path
        self.coursera_path = self.config.coursera_path

    def load_data(self):
        try:
            logging.info("Starting data loading process")

            df_udemy = pd.read_csv(self.udemy_path)
            df_coursera = pd.read_csv(self.coursera_path)

            logging.info("Datasets loaded successfully")

            return df_udemy, df_coursera

        except Exception as e:
            raise CustomException(e, sys)

    def initiate_data_ingestion(self):
        try:
            df_udemy, df_coursera = self.load_data()
            logging.info("Data ingestion completed successfully")
            return df_udemy, df_coursera

        except Exception as e:
            raise CustomException(e, sys)