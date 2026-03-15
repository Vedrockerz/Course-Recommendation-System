import sys
import re
import time
import threading
import numpy as np
import pandas as pd

from difflib import get_close_matches

from src.utils.logger import logging
from src.utils.exception import CustomException
from src.recommender.similarity_engine import SimilarityEngine


class ContentRecommender:

	def __init__(self, df, faiss_index, model_name, embedding_matrix=None):
		self.df = df
		self.faiss_index = faiss_index
		self.model_name = model_name
		self.model = None
		self._model_error = None
		self._model_lock = threading.Lock()
		self._model_ready = threading.Event()
		self.embedding_matrix = None

		if embedding_matrix is not None:
			self.embedding_matrix = np.asarray(embedding_matrix, dtype=np.float32)
			logging.info("Using precomputed embeddings in recommender: shape=%s", tuple(self.embedding_matrix.shape))
		else:
			logging.info("No precomputed embedding matrix provided; using FAISS vectors for course-based queries")

		self.course_titles = self.df["course_title"].astype(str).tolist()
		self.course_to_idx = pd.Series(self.df.index, index=self.df["course_title"]).drop_duplicates()
		self.sim_engine = SimilarityEngine()

	def get_model(self):
		if self.model is not None:
			return self.model

		if self._model_error is not None:
			raise RuntimeError("SentenceTransformer model failed to initialize") from self._model_error

		acquired = self._model_lock.acquire(blocking=False)

		if acquired:
			try:
				if self.model is None and self._model_error is None:
					load_start = time.perf_counter()
					logging.info("Lazy loading sentence transformer model: %s", self.model_name)
					from sentence_transformers import SentenceTransformer

					self.model = SentenceTransformer(self.model_name)
					load_seconds = time.perf_counter() - load_start
					logging.info("SentenceTransformer model loaded in %.2f seconds", load_seconds)
			except Exception as exc:
				self._model_error = exc
				self._model_ready.set()
				raise
			else:
				self._model_ready.set()
			finally:
				self._model_lock.release()
		else:
			logging.info("Sentence transformer model is currently loading; waiting for initialization")
			self._model_ready.wait()

		if self.model is None:
			raise RuntimeError("SentenceTransformer model is unavailable") from self._model_error

		return self.model

	@staticmethod
	def clean_query(text):
		text = str(text).lower()
		text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
		text = re.sub(r"\s+", " ", text).strip()
		return text

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
		logging.info("Encoding query text")
		model = self.get_model()

		cleaned_query = self.clean_query(query)
		query_embedding = model.encode([cleaned_query], convert_to_numpy=True).astype(np.float32)
		logging.info("Performing FAISS search for query candidates")

		scores, indices = self.sim_engine.search(query_embedding, self.faiss_index, candidate_pool)
		logging.info("Returning recommendations from query search")

		return self._hybrid_scoring(scores, indices)

	def recommend_by_course_name(self, course_name, candidate_pool=50):
		logging.info("Generating recommendations from matched course name")

		if course_name not in self.course_to_idx:
			return pd.DataFrame(columns=list(self.df.columns) + ["similarity_score"])

		idx = int(self.course_to_idx[course_name])
		if self.embedding_matrix is not None and idx < len(self.embedding_matrix):
			query_vector = np.array(self.embedding_matrix[idx], dtype=np.float32).reshape(1, -1)
			logging.info("Using precomputed embedding vector for course lookup")
		else:
			query_vector = np.array(self.faiss_index.reconstruct(idx), dtype=np.float32).reshape(1, -1)

		logging.info("Performing FAISS search for similar courses")

		scores, indices = self.sim_engine.search(query_vector, self.faiss_index, candidate_pool)
		logging.info("Returning recommendations from course similarity search")

		return self._hybrid_scoring(scores, indices)

	def get_recommendations(self, query, candidate_pool=50):
		try:
			match = get_close_matches(query, self.course_titles, n=1, cutoff=0.8)

			if match:
				return self.recommend_by_course_name(match[0], candidate_pool=candidate_pool)

			return self.recommend_by_query(query, candidate_pool=candidate_pool)

		except Exception as e:
			raise CustomException(e, sys)
