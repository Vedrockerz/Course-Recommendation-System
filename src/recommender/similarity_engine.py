import sys

from sklearn.metrics.pairwise import cosine_similarity

from src.utils.logger import logging
from src.utils.exception import CustomException


class SimilarityEngine:

    def compute_similarity(self, query_vector, tfidf_matrix):

        try:

            logging.info("Computing cosine similarity between query and course vectors")

            similarity_scores = cosine_similarity(
                query_vector,
                tfidf_matrix
            ).flatten()

            return similarity_scores

        except Exception as e:
            raise CustomException(e, sys)