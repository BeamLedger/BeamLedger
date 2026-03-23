import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.utils.security import hash_password
from app.models.user import User


@pytest.fixture(scope="module")
def client():
    # Create test database
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    # Create a test user
    db = SessionLocal()
    user = User(email="test@example.com", full_name="Test User", hashed_password=hash_password("password"))
    db.add(user)
    db.commit()
    db.close()
    with TestClient(app) as c:
        yield c


def test_register_and_login(client):
    # Register new user
    response = client.post("/auth/register", json={
        "email": "user@example.com",
        "full_name": "New User",
        "password": "secretpassword"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@example.com"
    # Login with OAuth2 form
    response = client.post("/auth/token", data={"username": "user@example.com", "password": "secretpassword"})
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data