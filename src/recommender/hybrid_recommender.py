import sys
import numpy as np
import pandas as pd

from src.utils.logger import logging
from src.utils.exception import CustomException


class HybridRecommender:

	@staticmethod
	def apply_hybrid_ranking(results_df: pd.DataFrame):
		ranked_df = results_df.copy()

		ranked_df["rating_score"] = ranked_df["rating"].fillna(0) / 5.0
		ranked_df["popularity_score"] = np.log1p(ranked_df["reviewcount"].fillna(0))

		ranked_df["final_score"] = (
			0.7 * ranked_df["similarity_score"].fillna(0)
			+
			0.2 * ranked_df["rating_score"]
			+
			0.1 * ranked_df["popularity_score"]
		)

		return ranked_df

	def recommend_best_learning(
		self,
		results_df,
		level_filter=None,
		duration_category_filter=None,
		max_hours=None,
		min_hours=None,
		top_n=5,
	):

		try:
			logging.info("Applying recommendation filters and hybrid ranking")

			filtered = results_df.copy()

			if level_filter:
				filtered = filtered[filtered["level"] == level_filter]

			duration_col = None
			if "duration_category" in filtered.columns:
				duration_col = "duration_category"
			elif "Duration_Category" in filtered.columns:
				duration_col = "Duration_Category"

			if duration_category_filter and duration_col:
				filtered = filtered[
					filtered[duration_col].astype(str).str.lower()
					== str(duration_category_filter).strip().lower()
				]

			if filtered.empty:
				return pd.DataFrame(
					columns=[
						"course_title",
						"platform",
						"level",
						"Duration_Category",
						"rating",
						"reviewcount",
						"final_score",
					]
				)

			ranked = self.apply_hybrid_ranking(filtered)

			final_selection = ranked.sort_values(by="final_score", ascending=False).head(top_n)

			output_cols = [
				"course_title",
				"platform",
				"level",
				"rating",
				"reviewcount",
				"final_score",
			]

			if "Duration_Category" in final_selection.columns:
				output_cols.insert(3, "Duration_Category")
			elif "duration_category" in final_selection.columns:
				output_cols.insert(3, "duration_category")

			if "duration_hours" in final_selection.columns:
				output_cols.insert(4, "duration_hours")

			return final_selection[output_cols]

		except Exception as e:
			raise CustomException(e, sys)
