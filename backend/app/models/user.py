"""SQLite-backed user persistence."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from app.models.database import connect_database


@dataclass(frozen=True)
class User:
    """A persisted ExoVision account."""

    id: str
    email: str
    display_name: str
    password_hash: str
    created_at: str


class UserRepository:
    """Store and retrieve users from the local SQLite database."""

    def __init__(self, database_path: str | Path) -> None:
        self.database_path = Path(database_path).resolve()

    def create(self, email: str, display_name: str, password_hash: str) -> User:
        """Create a user, relying on the database uniqueness constraint."""
        user = User(
            id=uuid4().hex,
            email=email.lower(),
            display_name=display_name.strip(),
            password_hash=password_hash,
            created_at=datetime.now(UTC).isoformat(),
        )
        with self._connect() as connection:
            connection.execute(
                """INSERT INTO users
                (id, email, display_name, password_hash, created_at)
                VALUES (?, ?, ?, ?, ?)""",
                (
                    user.id,
                    user.email,
                    user.display_name,
                    user.password_hash,
                    user.created_at,
                ),
            )
        return user

    def by_email(self, email: str) -> User | None:
        """Return a user by normalized email address."""
        return self._one("SELECT * FROM users WHERE email = ?", (email.lower(),))

    def by_id(self, user_id: str) -> User | None:
        """Return a user by primary key."""
        return self._one("SELECT * FROM users WHERE id = ?", (user_id,))

    def _one(self, query: str, parameters: tuple[str, ...]) -> User | None:
        with self._connect() as connection:
            row = connection.execute(query, parameters).fetchone()
        return User(**dict(row)) if row is not None else None

    def _connect(self):
        return connect_database(self.database_path)
