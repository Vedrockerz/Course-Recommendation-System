import os
import sys
import pickle
import faiss

from src.utils.logger import logging
from src.utils.exception import CustomException
from src.config import ArtifactConfig

from src.recommender.content_recommender import ContentRecommender
from src.recommender.hybrid_recommender import HybridRecommender


class PredictionPipeline:

    def __init__(self):

        self.artifact_config = ArtifactConfig()

    def load_artifacts(self):

        try:

            logging.info("Loading recommendation artifacts")

            with open(self.artifact_config.courses_dataframe_path, "rb") as f:
                df = pickle.load(f)

            faiss_index = faiss.read_index(self.artifact_config.faiss_index_path)

            logging.info("Artifacts loaded successfully")

            return df, faiss_index

        except Exception as e:
            raise CustomException(e, sys)

    def predict(
        self,
        query,
        level=None,
        duration_category=None,
        top_k=5,
    ):

        try:

            logging.info("Starting recommendation prediction")

            df, faiss_index = self.load_artifacts()

            content_model = ContentRecommender(
                df,
                faiss_index,
                self.artifact_config.sentence_model_name
            )

            candidate_pool = max(self.artifact_config.faiss_candidate_pool, top_k * 10)
            results = content_model.get_recommendations(query, candidate_pool=candidate_pool)

            hybrid_model = HybridRecommender()

            final_results = hybrid_model.recommend_best_learning(
                results_df=results,
                level_filter=level,
                duration_category_filter=duration_category,
                top_n=top_k
            )

            logging.info("Recommendation generated successfully")

            return final_results

        except Exception as e:
            raise CustomException(e, sys)