import sys
import faiss
import numpy as np

from src.utils.logger import logging
from src.utils.exception import CustomException


class FaissIndexBuilder:

	def build_index(self, embeddings: np.ndarray):
		try:
			logging.info("Building FAISS index")

			vectors = np.array(embeddings, dtype=np.float32, copy=True)
			faiss.normalize_L2(vectors)

			dimension = vectors.shape[1]
			index = faiss.IndexFlatIP(dimension)
			index.add(vectors)

			logging.info("FAISS index built successfully")

			return index

		except Exception as e:
			raise CustomException(e, sys)
