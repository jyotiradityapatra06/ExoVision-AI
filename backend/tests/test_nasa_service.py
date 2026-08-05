"""NASA MAST boundary validation tests."""

from io import BytesIO

import pytest

from app.services.nasa.mast_service import MastService, MastServiceError


class _Response(BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        self.close()


def test_download_rejects_non_mast_identifiers():
    with pytest.raises(MastServiceError, match="Invalid"):
        MastService().download("https://example.com/file.fits")


def test_download_rejects_non_fits_response(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        "app.services.nasa.mast_service.urlopen",
        lambda *_args, **_kwargs: _Response(b"<html>upstream error</html>"),
    )

    with pytest.raises(MastServiceError, match="valid FITS"):
        MastService().download("mast:TESS/product/test_lc.fits")


def test_download_sanitizes_product_filename(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        "app.services.nasa.mast_service.urlopen",
        lambda *_args, **_kwargs: _Response(b"SIMPLE" + b" " * 80),
    )

    filename, content = MastService().download("mast:TESS/product/test_lc.fits")

    assert filename == "test_lc.fits"
    assert content.startswith(b"SIMPLE")
