import pickle
import faiss
import asyncio
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import ArtifactConfig
from src.utils.artifact_loader import ensure_startup_artifacts
from src.utils.logger import logging

from app.routes import router


app = FastAPI(
    title="AI Course Recommendation API",
    description="FastAPI backend for BERT + FAISS + Hybrid ranked course recommendations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_recommender_artifacts() -> dict:
    # Import heavy recommender modules lazily so process startup can bind port quickly.
    from src.recommender.content_recommender import ContentRecommender
    from src.recommender.hybrid_recommender import HybridRecommender

    artifact_config = ArtifactConfig()

    logging.info("Loading dataset artifact from %s", artifact_config.courses_dataframe_path)
    with open(artifact_config.courses_dataframe_path, "rb") as f:
        df = pickle.load(f)
    logging.info("Dataset loaded: %s rows", len(df))

    logging.info("Loading FAISS index from %s", artifact_config.faiss_index_path)
    faiss_index = faiss.read_index(artifact_config.faiss_index_path)
    logging.info("FAISS index loaded: %s vectors", faiss_index.ntotal)

    title_lookup = {str(title).strip().lower(): str(title) for title in df["course_title"].astype(str).tolist()}

    logging.info("Loading multilingual embedding model: %s", artifact_config.sentence_model_name)
    content_model = ContentRecommender(
        df=df,
        faiss_index=faiss_index,
        model_name=artifact_config.sentence_model_name,
    )
    logging.info("Embedding model loaded")

    hybrid_model = HybridRecommender()

    return {
        "artifact_config": artifact_config,
        "df": df,
        "faiss_index": faiss_index,
        "title_lookup": title_lookup,
        "content_model": content_model,
        "hybrid_model": hybrid_model,
    }


async def _initialize_models(app_ref: FastAPI) -> None:
    try:
        app_ref.state.init_error = None

        init_start = time.perf_counter()
        logging.info("Starting startup artifact availability check")
        await asyncio.to_thread(ensure_startup_artifacts)

        logging.info("Starting async recommender model loading")
        artifacts = await asyncio.to_thread(_load_recommender_artifacts)

        app_ref.state.artifact_config = artifacts["artifact_config"]
        app_ref.state.df = artifacts["df"]
        app_ref.state.faiss_index = artifacts["faiss_index"]
        app_ref.state.title_lookup = artifacts["title_lookup"]
        app_ref.state.content_model = artifacts["content_model"]
        app_ref.state.hybrid_model = artifacts["hybrid_model"]
        app_ref.state.is_ready = True

        init_seconds = time.perf_counter() - init_start
        logging.info("Startup initialization complete: backend ready in %.2f seconds", init_seconds)
    except Exception as exc:
        app_ref.state.is_ready = False
        app_ref.state.init_error = str(exc)
        logging.exception("Artifact initialization failed")


@app.on_event("startup")
async def startup_event() -> None:
    logging.info("Server startup event triggered")
    logging.info("Scheduling background recommender warmup")
    app.state.is_ready = False
    app.state.init_error = None
    app.state.init_task = asyncio.create_task(_initialize_models(app))
    logging.info("Startup event completed; waiting for warmup readiness")

@app.on_event("shutdown")
def shutdown_event() -> None:
    logging.info("Shutting down AI Course Recommendation API")


app.include_router(router)
