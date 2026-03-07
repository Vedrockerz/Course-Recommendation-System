import sys
import numpy as np

from sentence_transformers import SentenceTransformer

from src.utils.logger import logging
from src.utils.exception import CustomException
from src.config import ArtifactConfig


class EmbeddingBuilder:

	def __init__(self):
		self.artifact_config = ArtifactConfig()
		self.model = SentenceTransformer(self.artifact_config.sentence_model_name)

	def build_embeddings(self, texts):
		try:
			logging.info("Building sentence-transformer embeddings")

			embeddings = self.model.encode(
				texts,
				batch_size=256,
				show_progress_bar=False,
				convert_to_numpy=True,
			)

			return embeddings.astype(np.float32)

		except Exception as e:
			raise CustomException(e, sys)
