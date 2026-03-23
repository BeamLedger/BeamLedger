import os

# Force SQLite for tests
os.environ["DATABASE_URL"] = "sqlite:///./test_lighting.db"
