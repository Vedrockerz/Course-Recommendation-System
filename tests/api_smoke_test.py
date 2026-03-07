from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/")

        assert response.status_code == 200
        payload = response.json()
        assert payload["status"] == "ok"
        assert "running" in payload["message"].lower()


def test_recommend_endpoint():
    with TestClient(app) as client:
        response = client.get(
            "/recommend",
            params={
                "query": "data science",
                "top_k": 5,
            },
        )

        assert response.status_code == 200
        payload = response.json()

        assert payload["query"] == "data science"
        assert payload["top_k"] == 5
        assert "results" in payload
        assert isinstance(payload["results"], list)


def test_similar_endpoint_valid_course():
    with TestClient(app) as client:
        df = client.app.state.df
        sample_course = str(df["course_title"].iloc[0])

        response = client.get(
            "/similar",
            params={
                "course_name": sample_course,
                "top_k": 5,
            },
        )

        assert response.status_code == 200
        payload = response.json()

        assert payload["course_name"] == sample_course
        assert payload["top_k"] == 5
        assert "results" in payload
        assert isinstance(payload["results"], list)


def test_similar_endpoint_invalid_course():
    with TestClient(app) as client:
        response = client.get(
            "/similar",
            params={
                "course_name": "this course definitely does not exist",
                "top_k": 5,
            },
        )

        assert response.status_code == 404
        payload = response.json()
        assert "detail" in payload
