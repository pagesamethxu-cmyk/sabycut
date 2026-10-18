import pytest
from app.main import app
from app.config import Config

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data["status"] == "UP"
    assert json_data["service"] == "sabycut-ai-service"

def test_unauthorized_internal_access(client):
    response = client.post("/analyze")
    assert response.status_code == 401

def test_authorized_internal_access(client):
    headers = {"Authorization": f"Bearer {Config.INTERNAL_API_TOKEN}"}
    response = client.post("/analyze", headers=headers)
    assert response.status_code == 200
