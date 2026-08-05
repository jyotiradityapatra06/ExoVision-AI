"""Kepler-specific MAST search adapter."""

from app.services.nasa.mast_service import MastService


class KeplerService:
    def __init__(self, mast: MastService | None = None) -> None:
        self.mast = mast or MastService()

    def search(self, target: str, *, limit: int = 20):
        return self.mast.search(target, ("KEPLER", "K2"), limit=limit)
