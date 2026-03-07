import sys
import re
import numpy as np
import pandas as pd

from difflib import get_close_matches
from sentence_transformers import SentenceTransformer

from src.utils.logger import logging
from src.utils.exception import CustomException
from src.recommender.similarity_engine import SimilarityEngine


class ContentRecommender:

	def __init__(self, df, faiss_index, model_name):
		self.df = df.copy()
		self.faiss_index = faiss_index
		self.model = SentenceTransformer(model_name)
		self.sim_engine = SimilarityEngine()

	@staticmethod
	def clean_query(text):
		text = str(text).lower()
		text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
		text = re.sub(r"\s+", " ", text).strip()
		return text

	def _course_index_map(self):
		return pd.Series(self.df.index, index=self.df["course_title"]).drop_duplicates()

	def _hybrid_scoring(self, scores, indices):
		selected_indices = []
		selected_scores = []

		for idx, score in zip(indices[0], scores[0]):
			if idx >= 0:
				selected_indices.append(int(idx))
				selected_scores.append(float(score))

		if not selected_indices:
			return pd.DataFrame(columns=list(self.df.columns) + ["similarity_score"])

		candidates = self.df.iloc[selected_indices].copy()
		candidates["similarity_score"] = selected_scores

		return candidates

	def recommend_by_query(self, query, candidate_pool=50):
		logging.info("Generating recommendations from query embedding")

		cleaned_query = self.clean_query(query)
		query_embedding = self.model.encode([cleaned_query], convert_to_numpy=True).astype(np.float32)

		scores, indices = self.sim_engine.search(query_embedding, self.faiss_index, candidate_pool)

		return self._hybrid_scoring(scores, indices)

	def recommend_by_course_name(self, course_name, candidate_pool=50):
		logging.info("Generating recommendations from matched course name")

		course_to_idx = self._course_index_map()

		if course_name not in course_to_idx:
			return pd.DataFrame(columns=list(self.df.columns) + ["similarity_score"])

		idx = int(course_to_idx[course_name])
		query_vector = np.array(self.faiss_index.reconstruct(idx), dtype=np.float32).reshape(1, -1)

		scores, indices = self.sim_engine.search(query_vector, self.faiss_index, candidate_pool)

		return self._hybrid_scoring(scores, indices)

	def get_recommendations(self, query, candidate_pool=50):
		try:
			match = get_close_matches(query, self.df["course_title"].astype(str).tolist(), n=1, cutoff=0.8)

			if match:
				return self.recommend_by_course_name(match[0], candidate_pool=candidate_pool)

			return self.recommend_by_query(query, candidate_pool=candidate_pool)

		except Exception as e:
			raise CustomException(e, sys)
