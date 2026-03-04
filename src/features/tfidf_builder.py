import os
import sys
import pickle

from sklearn.feature_extraction.text import TfidfVectorizer

from src.utils.logger import logging
from src.utils.exception import CustomException
from src.config import ArtifactConfig


class TFIDFBuilder:

    def __init__(self):
        self.artifact_config = ArtifactConfig()

    def build_tfidf(self, df):

        try:

            logging.info("Initializing TF-IDF Vectorizer")

            tfidf = TfidfVectorizer(
                stop_words="english",
                ngram_range=(1, 2),
                max_features=10000
            )

            logging.info("Fitting TF-IDF on metadata")

            tfidf_matrix = tfidf.fit_transform(
                df["metadata"].fillna("")
            )

            # Ensure artifact directory exists
            os.makedirs(
                self.artifact_config.artifact_dir,
                exist_ok=True
            )

            logging.info("Saving TF-IDF vectorizer")

            with open(
                self.artifact_config.tfidf_vectorizer_path,
                "wb"
            ) as f:
                pickle.dump(tfidf, f)

            logging.info("Saving similarity matrix")

            with open(
                self.artifact_config.similarity_matrix_path,
                "wb"
            ) as f:
                pickle.dump(tfidf_matrix, f)

            logging.info("TF-IDF artifacts saved successfully")

            return tfidf, tfidf_matrix

        except Exception as e:
            raise CustomException(e, sys)