import pickle
import faiss
import asyncio
import os
import numpy as np

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from src.config import ArtifactConfig
from src.utils.artifact_loader import ensure_startup_artifacts
from src.utils.logger import logging

from app.routes import router


def _parse_csv_env(var_name: str, default: str) -> list[str]:
    raw_value = os.getenv(var_name, default)
    return [item.strip() for item in raw_value.split(",") if item.strip()]


app = FastAPI(
    title="AI Course Recommendation API",
    description="FastAPI backend for BERT + FAISS + Hybrid ranked course recommendations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

cors_allow_origins = _parse_csv_env(
    "CORS_ALLOW_ORIGINS",
    "https://www.learn-wise.me,https://learn-wise.me,http://localhost:3000",
)
cors_allow_credentials = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"

if "*" in cors_allow_origins and cors_allow_credentials:
    logging.warning(
        "CORS_ALLOW_CREDENTIALS=true is not valid with CORS_ALLOW_ORIGINS='*'. "
        "Falling back to CORS_ALLOW_CREDENTIALS=false."
    )
    cors_allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins,
    allow_credentials=cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=_parse_csv_env("ALLOWED_HOSTS", "*"),
)


def _load_recommender_artifacts() -> dict:
    from src.recommender.content_recommender import ContentRecommender
    from src.recommender.hybrid_recommender import HybridRecommender

    artifact_config = ArtifactConfig()

    logging.info("Loading FAISS index from %s", artifact_config.faiss_index_path)
    faiss_index = faiss.read_index(artifact_config.faiss_index_path)
    logging.info("FAISS index loaded: %s vectors", faiss_index.ntotal)

    logging.info("Loading course dataframe from %s", artifact_config.courses_dataframe_path)
    with open(artifact_config.courses_dataframe_path, "rb") as f:
        df = pickle.load(f)
    logging.info("Course dataframe loaded: %s rows", len(df))

    embedding_matrix = None
    if os.path.exists(artifact_config.embedding_matrix_path):
        logging.info("Loading precomputed embedding matrix from %s", artifact_config.embedding_matrix_path)
        with open(artifact_config.embedding_matrix_path, "rb") as f:
            loaded_embeddings = pickle.load(f)

        embedding_matrix = np.asarray(loaded_embeddings, dtype=np.float32)
        logging.info("Embedding matrix loaded: shape=%s", tuple(embedding_matrix.shape))

        if embedding_matrix.shape[0] != faiss_index.ntotal:
            logging.warning(
                "Embedding matrix rows (%s) do not match FAISS vectors (%s)",
                embedding_matrix.shape[0],
                faiss_index.ntotal,
            )
        else:
            logging.info("Embedding matrix is aligned with FAISS index")
    else:
        logging.info("Precomputed embedding matrix not found at %s", artifact_config.embedding_matrix_path)

    title_lookup = {str(title).strip().lower(): str(title) for title in df["course_title"].astype(str).tolist()}

    content_model = ContentRecommender(
        df=df,
        faiss_index=faiss_index,
        model_name=artifact_config.sentence_model_name,
        embedding_matrix=embedding_matrix,
    )

    hybrid_model = HybridRecommender()

    return {
        "artifact_config": artifact_config,
        "df": df,
        "faiss_index": faiss_index,
        "embedding_matrix": embedding_matrix,
        "title_lookup": title_lookup,
        "content_model": content_model,
        "hybrid_model": hybrid_model,
    }


@app.on_event("startup")
async def startup_event() -> None:
    app.state.is_ready = False
    app.state.init_error = None
    app.state.init_task = None

    try:
        logging.info("Server startup event triggered")
        logging.info("Checking startup artifact availability")
        await asyncio.to_thread(ensure_startup_artifacts)

        artifacts = await asyncio.to_thread(_load_recommender_artifacts)

        app.state.artifact_config = artifacts["artifact_config"]
        app.state.df = artifacts["df"]
        app.state.faiss_index = artifacts["faiss_index"]
        app.state.embedding_matrix = artifacts["embedding_matrix"]
        app.state.title_lookup = artifacts["title_lookup"]
        app.state.content_model = artifacts["content_model"]
        app.state.hybrid_model = artifacts["hybrid_model"]
        app.state.is_ready = True

        logging.info("Backend ready for queries")
    except Exception as exc:
        app.state.init_error = str(exc)
        logging.exception("Startup artifact initialization failed")

@app.on_event("shutdown")
def shutdown_event() -> None:
    logging.info("Shutting down AI Course Recommendation API")


app.include_router(router)
