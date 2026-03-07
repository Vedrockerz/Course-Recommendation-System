from dataclasses import dataclass
import os
from src.constants import *


# =========================
# Data Configuration
# =========================

@dataclass
class DataConfig:
    raw_data_dir: str = RAW_DATA_DIR
    processed_data_dir: str = PROCESSED_DATA_DIR

    coursera_path: str = os.path.join(RAW_DATA_DIR, COURSERA_FILE)
    udemy_path: str = os.path.join(RAW_DATA_DIR, UDEMY_FILE)
    
    final_data_path: str = os.path.join(PROCESSED_DATA_DIR, FINAL_DATA_FILE)


# =========================
# Artifact Configuration
# =========================

@dataclass
class ArtifactConfig:
    artifact_dir: str = ARTIFACT_DIR
    embedding_matrix_path: str = os.path.join(ARTIFACT_DIR, EMBEDDING_MATRIX_FILE)
    faiss_index_path: str = os.path.join(ARTIFACT_DIR, FAISS_INDEX_FILE)
    courses_dataframe_path: str = os.path.join(ARTIFACT_DIR, COURSES_DATAFRAME_FILE)
    sentence_model_name: str = SENTENCE_MODEL_NAME
    faiss_candidate_pool: int = FAISS_CANDIDATE_POOL


# =========================
# Recommendation Configuration
# =========================

# @dataclass
# class RecommendationConfig:
#     top_k: int = DEFAULT_TOP_K
#     similarity_weight: float = SIMILARITY_WEIGHT
#     rating_weight: float = RATING_WEIGHT
#     popularity_weight: float = POPULARITY_WEIGHT
#     random_state: int = RANDOM_STATE