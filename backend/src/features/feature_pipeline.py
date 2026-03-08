import os
import sys
import pickle
import faiss
import pandas as pd

from src.utils.logger import logging
from src.utils.exception import CustomException
from src.config import DataConfig, ArtifactConfig

from src.features.embedding_builder import EmbeddingBuilder
from src.features.faiss_index_builder import FaissIndexBuilder


class FeaturePipeline:

	def __init__(self):
		self.data_config = DataConfig()
		self.artifact_config = ArtifactConfig()

	def run_feature_pipeline(self):

		try:

			logging.info("Loading processed dataset for embedding features")

			df = pd.read_csv(self.data_config.final_data_path)

			df["metadata"] = df["metadata"].fillna("")
			df = df[df["metadata"].str.strip() != ""].copy()
			df["metadata"] = df["metadata"].str[:512]
			df.reset_index(drop=True, inplace=True)

			texts = df["metadata"].tolist()

			logging.info("Generating sentence-transformer embeddings")

			embedding_builder = EmbeddingBuilder()
			embeddings = embedding_builder.build_embeddings(texts)

			logging.info("Generating FAISS index")

			faiss_builder = FaissIndexBuilder()
			faiss_index = faiss_builder.build_index(embeddings)

			os.makedirs(self.artifact_config.artifact_dir, exist_ok=True)

			logging.info("Saving feature artifacts")

			with open(self.artifact_config.embedding_matrix_path, "wb") as f:
				pickle.dump(embeddings, f)

			with open(self.artifact_config.courses_dataframe_path, "wb") as f:
				pickle.dump(df, f)

			faiss.write_index(faiss_index, self.artifact_config.faiss_index_path)

			logging.info("Feature pipeline completed successfully")

			return df, embeddings, faiss_index

		except Exception as e:
			raise CustomException(e, sys)
