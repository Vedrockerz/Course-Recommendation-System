import os
import sys
import pickle

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

            with open(self.artifact_config.tfidf_vectorizer_path, "rb") as f:
                tfidf = pickle.load(f)

            with open(self.artifact_config.similarity_matrix_path, "rb") as f:
                tfidf_matrix = pickle.load(f)

            df_path = os.path.join(
                self.artifact_config.artifact_dir,
                "courses_dataframe.pkl"
            )

            with open(df_path, "rb") as f:
                df = pickle.load(f)

            logging.info("Artifacts loaded successfully")

            return df, tfidf, tfidf_matrix

        except Exception as e:
            raise CustomException(e, sys)

    def predict(self, query, level=None, max_hours=None, min_hours=None , top_k=5):

        try:

            logging.info("Starting recommendation prediction")

            df, tfidf, tfidf_matrix = self.load_artifacts()

            content_model = ContentRecommender(
                df,
                tfidf,
                tfidf_matrix
            )

            results = content_model.get_recommendations(query)

            hybrid_model = HybridRecommender()

            final_results = hybrid_model.recommend_best_learning(
                results_df=results,
                level_filter=level,
                max_hours=max_hours,
                min_hours=min_hours,
                top_n=top_k
            )

            logging.info("Recommendation generated successfully")

            return final_results

        except Exception as e:
            raise CustomException(e, sys)