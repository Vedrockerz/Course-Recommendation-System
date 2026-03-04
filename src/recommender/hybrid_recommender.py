import sys
import pandas as pd

from src.utils.logger import logging
from src.utils.exception import CustomException


class HybridRecommender:

    def normalize_scores(self, df):

        try:

            logging.info("Normalizing weighted score")

            min_score = df["weighted_score"].min()
            max_score = df["weighted_score"].max()

            if max_score - min_score == 0:
                df["weighted_score_norm"] = 0
            else:
                df["weighted_score_norm"] = (
                    (df["weighted_score"] - min_score)
                    /
                    (max_score - min_score)
                )

            return df

        except Exception as e:
            raise CustomException(e, sys)

    def recommend_best_learning(
        self,
        results_df,
        level_filter=None,
        max_hours=None,
        min_hours=None,
        top_n=5
    ):

        try:

            logging.info("Applying recommendation filters")

            if level_filter:
                results_df = results_df[
                    results_df["level"] == level_filter
                ]

            if min_hours is not None:
                results_df = results_df[
                    results_df["duration_hours"] >= min_hours
                ]

            if max_hours:
                results_df = results_df[
                    results_df["duration_hours"] <= max_hours
                ]

            logging.info("Normalizing weighted scores")

            results_df = self.normalize_scores(results_df)

            logging.info("Computing hybrid ranking score")

            results_df["final_score"] = (
                0.7 * results_df["similarity_score"]
                +
                0.3 * results_df["weighted_score_norm"]
            )

            logging.info("Selecting top recommendations")

            final_selection = results_df.sort_values(
                by="final_score",
                ascending=False
            ).head(top_n)

            return final_selection[
                [
                    "course_title",
                    "platform",
                    "level",
                    "duration_hours",
                    "rating",
                    "reviewcount",
                    "final_score"
                ]
            ]

        except Exception as e:
            raise CustomException(e, sys)