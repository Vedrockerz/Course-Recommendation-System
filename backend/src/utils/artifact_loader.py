from __future__ import annotations

import os
from pathlib import Path
from typing import Dict

import requests

from src.config import ArtifactConfig, DataConfig
from src.utils.logger import logging


ARTIFACT_URLS: Dict[str, str] = {
    "course_faiss.index": "https://huggingface.co/IneedBREAK/course-recommendation/resolve/main/course_faiss.index",
    "courses_dataframe.pkl": "https://huggingface.co/IneedBREAK/course-recommendation/resolve/main/courses_dataframe.pkl",
    "embedding_matrix.pkl": "https://huggingface.co/IneedBREAK/course-recommendation/resolve/main/embedding_matrix.pkl",
    "final_courses.csv": "https://huggingface.co/IneedBREAK/course-recommendation/resolve/main/final_courses.csv",
}

RUNTIME_REQUIRED_ARTIFACTS = (
    "course_faiss.index",
    "courses_dataframe.pkl",
)

OPTIONAL_ARTIFACTS = (
    "embedding_matrix.pkl",
    "final_courses.csv",
)


def _download_file(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temp_path = destination.with_suffix(destination.suffix + ".part")

    logging.info("Downloading artifact... %s", destination.name)

    with requests.get(url, stream=True, timeout=(10, 300)) as response:
        response.raise_for_status()
        with open(temp_path, "wb") as file:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    file.write(chunk)

    os.replace(temp_path, destination)
    logging.info("Artifact ready: %s", destination)


def ensure_startup_artifacts(include_optional: bool = False) -> None:
    artifact_config = ArtifactConfig()
    data_config = DataConfig()

    target_paths: Dict[str, Path] = {
        "course_faiss.index": Path(artifact_config.faiss_index_path),
        "courses_dataframe.pkl": Path(artifact_config.courses_dataframe_path),
        "embedding_matrix.pkl": Path(artifact_config.embedding_matrix_path),
        "final_courses.csv": Path(data_config.final_data_path),
    }

    selected_artifacts = set(RUNTIME_REQUIRED_ARTIFACTS)

    if include_optional:
        selected_artifacts.update(OPTIONAL_ARTIFACTS)

    for file_name, path in target_paths.items():
        if file_name not in selected_artifacts:
            continue

        path.parent.mkdir(parents=True, exist_ok=True)

        if path.exists():
            logging.info("Artifact ready: %s", path)
            continue

        url = ARTIFACT_URLS[file_name]
        _download_file(url, path)
