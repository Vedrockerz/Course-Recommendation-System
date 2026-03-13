import pickle
import faiss
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import ArtifactConfig
from src.recommender.content_recommender import ContentRecommender
from src.recommender.hybrid_recommender import HybridRecommender
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
    artifact_config = ArtifactConfig()

    with open(artifact_config.courses_dataframe_path, "rb") as f:
        df = pickle.load(f)

    faiss_index = faiss.read_index(artifact_config.faiss_index_path)

    content_model = ContentRecommender(
        df=df,
        faiss_index=faiss_index,
        model_name=artifact_config.sentence_model_name,
    )

    hybrid_model = HybridRecommender()

    return {
        "artifact_config": artifact_config,
        "df": df,
        "faiss_index": faiss_index,
        "content_model": content_model,
        "hybrid_model": hybrid_model,
    }


async def _initialize_models(app_ref: FastAPI) -> None:
    try:
        logging.info("Starting startup artifact availability check")
        await asyncio.to_thread(ensure_startup_artifacts)

        logging.info("Starting async recommender model loading")
        artifacts = await asyncio.to_thread(_load_recommender_artifacts)

        app_ref.state.artifact_config = artifacts["artifact_config"]
        app_ref.state.df = artifacts["df"]
        app_ref.state.faiss_index = artifacts["faiss_index"]
        app_ref.state.content_model = artifacts["content_model"]
        app_ref.state.hybrid_model = artifacts["hybrid_model"]
        app_ref.state.is_ready = True

        logging.info("Artifacts loaded successfully and kept in memory")
    except Exception:
        app_ref.state.is_ready = False
        logging.exception("Artifact initialization failed")


@app.on_event("startup")
async def startup_event() -> None:
    logging.info("Starting API and scheduling recommender initialization")
    app.state.is_ready = False
    app.state.init_task = asyncio.create_task(_initialize_models(app))

@app.on_event("shutdown")
def shutdown_event() -> None:
    logging.info("Shutting down AI Course Recommendation API")


app.include_router(router)
