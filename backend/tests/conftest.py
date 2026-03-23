import os

# Force SQLite for tests
os.environ["DATABASE_URL"] = "sqlite:///./test_lighting.db"
# Set a test JWT secret (required by security module)
os.environ.setdefault("JWT_SECRET", "test-secret-do-not-use-in-production")
