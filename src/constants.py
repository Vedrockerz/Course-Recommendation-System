# =========================
# Project Constants
# =========================

# Data paths
RAW_DATA_DIR = "data/raw"
PROCESSED_DATA_DIR = "data/processed"
ARTIFACT_DIR = "data/artifacts"

# Raw data files
COURSERA_FILE = "coursera_course_2024.csv"
UDEMY_FILE = "udemy_courses.csv"

FINAL_DATA_FILE = "final_courses.csv"

# Artifact files
EMBEDDING_MATRIX_FILE = "embedding_matrix.pkl"  # future use
FAISS_INDEX_FILE = "course_faiss.index"
COURSES_DATAFRAME_FILE = "courses_dataframe.pkl"

# Embedding / Retrieval configuration
SENTENCE_MODEL_NAME = "all-MiniLM-L6-v2"
FAISS_CANDIDATE_POOL = 50

# Default Recommendation Settings
DEFAULT_TOP_K = 5

# Reproducibility
RANDOM_STATE = 42