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
TFIDF_VECTORIZER_FILE = "tfidf_vectorizer.pkl"
SIMILARITY_MATRIX_FILE = "similarity_matrix.pkl"
EMBEDDING_MATRIX_FILE = "embedding_matrix.pkl"  # future use

# Default Recommendation Settings
DEFAULT_TOP_K = 5

# Reproducibility
RANDOM_STATE = 42