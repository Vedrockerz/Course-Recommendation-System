import sys
import faiss
import numpy as np

from src.utils.logger import logging
from src.utils.exception import CustomException


class SimilarityEngine:

	def search(self, query_embedding: np.ndarray, faiss_index, top_k: int):
		try:
			logging.info("Running FAISS similarity search")

			query_vector = np.array(query_embedding, dtype=np.float32, copy=True)
			faiss.normalize_L2(query_vector)

			scores, indices = faiss_index.search(query_vector, top_k)

			return scores, indices

		except Exception as e:
			raise CustomException(e, sys)
