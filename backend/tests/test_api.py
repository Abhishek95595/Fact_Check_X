import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.model_service import model_service
import time

@pytest.fixture(scope="module")
def client():
    # Use FastAPI TestClient with lifespan context
    with TestClient(app) as test_client:
        yield test_client

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["models_loaded"] is True
    assert "ensemble" in data["available_models"]
    assert data["model_version"] == "1.0.0"

def test_predict_ensemble_valid(client):
    payload = {
        "headline": "SHOCKING: what they are hiding about inflation will leave you speechless!",
        "body_text": "Insiders have leaked that the national budget numbers are completely fabricated. Share this now before authorities take it down and delete everything from the internet!",
        "model": "ensemble"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_label"] in ["REAL", "FAKE"]
    assert data["model_name"] == "ensemble"
    assert 0.0 <= data["model_score"] <= 1.0
    assert "disclaimer" in data
    assert len(data["top_terms"]) > 0

def test_predict_all_models(client):
    models = ["logistic_regression", "naive_bayes", "linear_svm", "random_forest", "ensemble"]
    payload = {
        "headline": "Officials announced economic growth figures for the quarter",
        "body_text": "The ministry of finance reported on Wednesday that gross domestic product rose by 2.4 percent compared to the previous fiscal quarter according to official statistical records."
    }
    for m in models:
        payload["model"] = m
        res = client.post("/api/predict", json=payload)
        assert res.status_code == 200, f"Failed for model {m}: {res.text}"
        data = res.json()
        assert data["predicted_label"] in ["REAL", "FAKE"]
        assert 0.0 <= data["model_score"] <= 1.0

def test_predict_empty_inputs(client):
    # Empty headline
    res = client.post("/api/predict", json={"headline": "", "body_text": "Some long body text here with many words to satisfy length.", "model": "ensemble"})
    assert res.status_code == 422

    # Empty body
    res = client.post("/api/predict", json={"headline": "Valid headline text", "body_text": "", "model": "ensemble"})
    assert res.status_code == 422

def test_predict_short_text(client):
    # Under 15 words
    res = client.post("/api/predict", json={"headline": "Breaking News", "body_text": "Just three words.", "model": "ensemble"})
    assert res.status_code == 422
    assert "too short" in res.json()["detail"].lower()

def test_predict_invalid_model(client):
    res = client.post("/api/predict", json={
        "headline": "A sufficiently long valid headline",
        "body_text": "This is a body text with plenty of words to easily pass the fifteen words minimum required limit for valid news analysis.",
        "model": "gpt4_fake_detector"
    })
    assert res.status_code == 422

def test_explain_endpoint(client):
    payload = {
        "headline": "BREAKING: Insiders leak shocking coverup about the committee review",
        "body_text": "Whistleblowers released secret documents showing that government officials said the inflation figures are under review. Share this immediately before it gets deleted!"
    }
    res = client.post("/api/explain", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "top_fake_terms" in data
    assert "top_real_terms" in data
    assert "explanation_method" in data

def test_metrics_endpoint(client):
    res = client.get("/api/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "ensemble" in data["models"]
    assert "logistic_regression" in data["models"]
    assert data["evaluation_test_size"] == 237
    assert data["models"]["ensemble"]["accuracy"] >= 0.85

def test_confusion_matrix_endpoint(client):
    res = client.get("/api/confusion-matrix?model=ensemble")
    assert res.status_code == 200
    data = res.json()
    assert data["labels"] == ["REAL", "FAKE"]
    assert len(data["matrix"]) == 2
    assert len(data["matrix"][0]) == 2
    assert data["total_evaluated"] == 237

def test_fairness_endpoint(client):
    res = client.get("/api/fairness")
    assert res.status_code == 200
    data = res.json()
    assert "political_lean_metrics" in data
    assert len(data["political_lean_metrics"]) >= 3
    assert "topic_metrics" in data

def test_samples_endpoint_pagination_and_filter(client):
    # Default page 1
    res = client.get("/api/samples?page=1&page_size=5")
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 237
    assert len(data["samples"]) == 5

    # Topic filter
    res_filtered = client.get("/api/samples?topic=health")
    assert res_filtered.status_code == 200
    data_filtered = res_filtered.json()
    for s in data_filtered["samples"]:
        assert s["topic"].lower() == "health"

def test_inference_latency_benchmark(client):
    """
    Measures inference latency for a standard prediction request over 50 iterations.
    Ensures mean latency is under 100ms.
    """
    payload = {
        "headline": "Officials announced review on healthcare reform proposals",
        "body_text": "The public health committee met on Monday to discuss revised budget estimates for hospital modernizations across the regional healthcare network.",
        "model": "ensemble"
    }
    latencies = []
    # Warmup
    client.post("/api/predict", json=payload)

    for _ in range(50):
        t0 = time.perf_counter()
        res = client.post("/api/predict", json=payload)
        t1 = time.perf_counter()
        assert res.status_code == 200
        latencies.append((t1 - t0) * 1000)

    mean_ms = sum(latencies) / len(latencies)
    p95_ms = sorted(latencies)[int(len(latencies) * 0.95)]
    print(f"\n[LATENCY BENCHMARK] Mean: {mean_ms:.2f}ms, P95: {p95_ms:.2f}ms (over 50 iterations)")
    assert mean_ms < 100.0, f"Mean latency {mean_ms:.2f}ms exceeded 100ms threshold"
