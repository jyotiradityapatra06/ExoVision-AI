"""Shared authenticated defaults for Phase 4 API contract tests."""

from collections.abc import Iterator

import pytest

from app.api.dependencies import (
    get_analysis_repository,
    get_current_user,
    require_analysis_owner,
)
from app.core.security import rate_limiter
from app.main import app
from app.models.analysis import AnalysisRecord
from app.models.user import User

TEST_USER = User(
    id="test-user",
    email="researcher@example.com",
    display_name="Test Researcher",
    password_hash="not-exposed",
    created_at="2026-01-01T00:00:00+00:00",
)


class TestAnalysisRepository:
    """In-memory ownership substitute for endpoint contract tests."""

    __test__ = False

    def create(self, analysis_id: str, user_id: str, filename: str) -> AnalysisRecord:
        return AnalysisRecord(
            analysis_id, user_id, filename, "uploaded", TEST_USER.created_at
        )

    def list_for_user(
        self, _user_id: str, limit: int | None = None, offset: int = 0
    ) -> list[AnalysisRecord]:
        return []

    def status_counts_for_user(self, _user_id: str) -> dict[str, int]:
        return {"total": 0, "completed": 0, "processing": 0, "failed": 0}

    def update_status(self, _analysis_id: str, _status: str) -> None:
        return None

    def transition_status(
        self, _analysis_id: str, _expected: str, _replacement: str
    ) -> bool:
        return True

    def by_id(self, analysis_id: str) -> AnalysisRecord:
        return AnalysisRecord(
            analysis_id,
            TEST_USER.id,
            "observation.csv",
            "processing",
            TEST_USER.created_at,
        )

    def count_for_user(self, _user_id: str) -> int:
        return 0

    def ids_for_user(self, _user_id: str) -> list[str]:
        return []

    def claim_processing(
        self, _analysis_id: str, _user_id: str, _expected: str, _max_active: int
    ) -> str:
        return "claimed"


@pytest.fixture(autouse=True)
def authenticated_api_defaults() -> Iterator[None]:
    """Preserve historical route tests now that product APIs require auth."""
    rate_limiter.reset()
    app.dependency_overrides[get_current_user] = lambda: TEST_USER
    app.dependency_overrides[require_analysis_owner] = lambda: TEST_USER
    app.dependency_overrides[get_analysis_repository] = TestAnalysisRepository
    yield
    rate_limiter.reset()
    app.dependency_overrides.clear()
