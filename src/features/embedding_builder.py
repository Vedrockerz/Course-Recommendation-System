import sys
from src.utils.logger import logging
from src.utils.exception import CustomException


class EmbeddingBuilder:

    def __init__(self):
        pass

    def build_embeddings(self, df):

        try:
            logging.info("Embedding builder placeholder (for BERT or sentence transformers)")
            return None

        except Exception as e:
            raise CustomException(e, sys)