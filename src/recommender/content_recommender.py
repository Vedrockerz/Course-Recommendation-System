import sys
import re
import pandas as pd

from src.utils.logger import logging
from src.utils.exception import CustomException
from src.recommender.similarity_engine import SimilarityEngine


class ContentRecommender:

    def __init__(self, df, tfidf, tfidf_matrix):

        self.df = df
        self.tfidf = tfidf
        self.tfidf_matrix = tfidf_matrix
        self.sim_engine = SimilarityEngine()

    def clean_query(self, text):

        text = str(text).lower()
        text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()

        return text

    def get_recommendations(self, query):

        try:

            logging.info("Cleaning user query")

            query = self.clean_query(query)

            logging.info("Transforming query using TF-IDF")

            query_vec = self.tfidf.transform([query])

            logging.info("Computing similarity scores")

            similarity_scores = self.sim_engine.compute_similarity(
                query_vec,
                self.tfidf_matrix
            )

            results = self.df.copy()

            results["similarity_score"] = similarity_scores

            return results

        except Exception as e:
            raise CustomException(e, sys)