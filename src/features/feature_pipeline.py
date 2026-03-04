import os
import sys
import pickle
import pandas as pd

from src.utils.logger import logging
from src.utils.exception import CustomException
from src.config import DataConfig, ArtifactConfig

from src.features.tfidf_builder import TFIDFBuilder


class FeaturePipeline:

    def __init__(self):
        self.data_config = DataConfig()
        self.artifact_config = ArtifactConfig()

    def run_feature_pipeline(self):

        try:

            logging.info("Loading processed dataset")

            df = pd.read_csv(self.data_config.final_data_path)

            logging.info("Building TF-IDF features")

            tfidf_builder = TFIDFBuilder()
            tfidf, tfidf_matrix = tfidf_builder.build_tfidf(df)

            logging.info("Saving dataframe artifact")

            os.makedirs(self.artifact_config.artifact_dir, exist_ok=True)

            df_path = os.path.join(
                self.artifact_config.artifact_dir,
                "courses_dataframe.pkl"
            )

            with open(df_path, "wb") as f:
                pickle.dump(df, f)

            logging.info("Feature pipeline completed successfully")

            return df, tfidf, tfidf_matrix

        except Exception as e:
            raise CustomException(e, sys)