import pickle
import faiss

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import ArtifactConfig
from src.recommender.content_recommender import ContentRecommender
from src.recommender.hybrid_recommender import HybridRecommender
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


@app.on_event("startup")
def startup_event() -> None:
    logging.info("Starting API and loading recommender artifacts")

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

    app.state.artifact_config = artifact_config
    app.state.df = df
    app.state.faiss_index = faiss_index
    app.state.content_model = content_model
    app.state.hybrid_model = hybrid_model

    logging.info("Artifacts loaded successfully and kept in memory")


@app.on_event("shutdown")
def shutdown_event() -> None:
    logging.info("Shutting down AI Course Recommendation API")


app.include_router(router)
