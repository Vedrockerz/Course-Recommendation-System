from pathlib import Path

# =========================
# Project Constants
# =========================

# Base project path (backend directory)
BACKEND_DIR = Path(__file__).resolve().parent.parent

# Data paths
RAW_DATA_DIR = str(BACKEND_DIR / "data" / "raw")
PROCESSED_DATA_DIR = str(BACKEND_DIR / "data" / "processed")
ARTIFACT_DIR = str(BACKEND_DIR / "data" / "artifacts")
LOG_DIR = str(BACKEND_DIR / "logs")

# Raw data files
COURSERA_FILE = "coursera_course_2024.csv"
UDEMY_FILE = "udemy_courses.csv"

FINAL_DATA_FILE = "final_courses.csv"

# Artifact files
EMBEDDING_MATRIX_FILE = "embedding_matrix.pkl"  # future use
FAISS_INDEX_FILE = "course_faiss.index"
COURSES_DATAFRAME_FILE = "courses_dataframe.pkl"

# Embedding / Retrieval configuration
# Multilingual model: supports 50+ languages, handles multilingual course titles
# without requiring translation.
SENTENCE_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
FAISS_CANDIDATE_POOL = 50

# Default Recommendation Settings
DEFAULT_TOP_K = 5

# Reproducibility
RANDOM_STATE = 42