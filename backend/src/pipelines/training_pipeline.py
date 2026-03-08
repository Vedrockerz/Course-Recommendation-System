import sys

from src.utils.logger import logging
from src.utils.exception import CustomException

from src.data_processing.ingestion import DataIngestion
from src.data_processing.transformation import DataTransformation
from src.features.feature_pipeline import FeaturePipeline


class TrainingPipeline:

    def __init__(self):
        pass

    def run_pipeline(self):

        try:

            logging.info("Starting Training Pipeline")

            # -------------------------
            # Data Ingestion
            # -------------------------

            logging.info("Running Data Ingestion")

            ingestion = DataIngestion()

            df_udemy , df_coursera = ingestion.initiate_data_ingestion()

            # -------------------------
            # Data Transformation
            # -------------------------

            logging.info("Running Data Transformation")

            transformation = DataTransformation()

            transformation.run_full_transformation(df_udemy , df_coursera)

            # -------------------------
            # Feature Pipeline
            # -------------------------

            logging.info("Running Feature Pipeline")

            feature_pipeline = FeaturePipeline()

            feature_pipeline.run_feature_pipeline()

            logging.info("Training Pipeline Completed Successfully")

        except Exception as e:
            raise CustomException(e, sys)