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


def test_invoke_retries_on_timeout_and_raises_mast_service_error(
    monkeypatch: pytest.MonkeyPatch,
):
    attempts = 0

    def mock_urlopen(*_args, **_kwargs):
        nonlocal attempts
        attempts += 1
        raise TimeoutError("The read operation timed out")

    monkeypatch.setattr("app.services.nasa.mast_service.urlopen", mock_urlopen)
    monkeypatch.setattr("time.sleep", lambda _sec: None)

    service = MastService(timeout=1.0, attempts=3)
    with pytest.raises(MastServiceError, match="timed out or failed"):
        service._invoke({"service": "Test.Lookup"})

    assert attempts == 3


def test_invoke_succeeds_on_retry(monkeypatch: pytest.MonkeyPatch):
    attempts = 0

    def mock_urlopen(*_args, **_kwargs):
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            raise TimeoutError("The read operation timed out")
        return _Response(b'{"status": "COMPLETE", "data": []}')

    monkeypatch.setattr("app.services.nasa.mast_service.urlopen", mock_urlopen)
    monkeypatch.setattr("time.sleep", lambda _sec: None)

    service = MastService(timeout=1.0, attempts=2)
    result = service._invoke({"service": "Test.Lookup"})

    assert attempts == 2
    assert result == {"status": "COMPLETE", "data": []}


def test_invoke_polls_executing_response_until_complete(
    monkeypatch: pytest.MonkeyPatch,
):
    responses = iter(
        [
            _Response(b'{"status": "EXECUTING"}'),
            _Response(b'{"status": "COMPLETE", "data": [{"obsid": 1}]}'),
        ]
    )
    monkeypatch.setattr(
        "app.services.nasa.mast_service.urlopen",
        lambda *_args, **_kwargs: next(responses),
    )
    monkeypatch.setattr("time.sleep", lambda _sec: None)

    result = MastService(timeout=1.0, attempts=1)._invoke(
        {"service": "Mast.Caom.Filtered.Position"}
    )

    assert result["status"] == "COMPLETE"
    assert result["data"] == [{"obsid": 1}]


def test_search_filters_missions_batches_products_and_accepts_fits(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
):
    payloads = iter(
        [
            {"status": "COMPLETE", "resolvedCoordinate": [{"ra": 1.0, "decl": 2.0}]},
            {
                "status": "COMPLETE",
                "data": [
                    {
                        "obsid": 11,
                        "obs_collection": "Kepler Mission",
                        "target_name": "Kepler-10",
                        "t_min": 1.0,
                        "t_max": 2.0,
                    },
                    {"obsid": 12, "obs_collection": "TESS", "target_name": "TOI-700"},
                    {"obsid": 13, "obs_collection": "HST", "target_name": "Other"},
                ],
            },
            {
                "status": "COMPLETE",
                "data": [
                    {
                        "obsID": 11,
                        "productFilename": "generic.fits",
                        "dataURI": "mast:Kepler/product/generic.fits",
                        "size": "42",
                    },
                    {
                        "obsID": 11,
                        "productFilename": "kepler_llc.fits",
                        "dataURI": "mast:Kepler/product/kepler_llc.fits",
                        "size": 84,
                    },
                    {
                        "obsID": 11,
                        "productFilename": "preview.jpg",
                        "dataURI": "mast:Kepler/product/preview.jpg",
                    },
                ],
            },
        ]
    )
    requests = []

    def fake_invoke(request):
        requests.append(request)
        return next(payloads)

    service = MastService()
    monkeypatch.setattr(service, "_invoke", fake_invoke)

    with caplog.at_level("INFO"):
        results = service.search("Kepler-10", ("KEPLER", "K2"))

    assert [item["filename"] for item in results] == ["kepler_llc.fits", "generic.fits"]
    assert results[0]["mission"] == "Kepler Mission"
    assert requests[1]["service"] == "Mast.Caom.Filtered.Position"
    assert requests[1]["params"]["filters"][1]["values"] == [
        "Kepler",
        "KEPLER",
        "Kepler Mission",
        "K2",
        "K2 Mission",
    ]
    assert requests[2]["params"]["obsid"] == "11"
    assert "MAST observations found: 3" in caplog.text
    assert "Filtered mission observations: 1" in caplog.text
    assert "Products found: 3" in caplog.text
    assert "Light curve FITS files: 2" in caplog.text


def test_search_returns_empty_when_observation_has_no_products(
    monkeypatch: pytest.MonkeyPatch,
):
    payloads = iter(
        [
            {"status": "COMPLETE", "resolvedCoordinate": [{"ra": 1.0, "decl": 2.0}]},
            {
                "status": "COMPLETE",
                "data": [
                    {"obsid": 12, "obs_collection": "TESS", "target_name": "TOI-700"}
                ],
            },
            {"status": "COMPLETE", "data": []},
        ]
    )
    service = MastService()
    monkeypatch.setattr(service, "_invoke", lambda _request: next(payloads))

    assert service.search("HD 1", ("TESS",)) == []


def test_toi_search_resolves_tic_and_uses_exact_target_query(
    monkeypatch: pytest.MonkeyPatch,
):
    payloads = iter(
        [
            {"status": "", "resolvedCoordinate": [{"ra": 1.0, "decl": 2.0}]},
            {"status": "COMPLETE", "data": [{"ID": 150428135}]},
            {
                "status": "COMPLETE",
                "data": [
                    {
                        "obsid": 12,
                        "obs_collection": "TESS Mission",
                        "target_name": "150428135",
                    }
                ],
            },
            {
                "status": "COMPLETE",
                "data": [
                    {
                        "obsID": 12,
                        "productFilename": "toi700_lc.fits",
                        "dataURI": "mast:TESS/product/toi700_lc.fits",
                    }
                ],
            },
        ]
    )
    requests = []
    service = MastService()

    def fake_invoke(request):
        requests.append(request)
        return next(payloads)

    monkeypatch.setattr(service, "_invoke", fake_invoke)

    results = service.search("TOI-700", ("TESS",))

    assert results[0]["filename"] == "toi700_lc.fits"
    assert requests[1]["service"] == "Mast.Catalogs.Tic.Cone"
    assert requests[2]["service"] == "Mast.Caom.Filtered"
    assert requests[2]["params"]["filters"][-1] == {
        "paramName": "target_name",
        "values": ["150428135"],
    }


def test_search_rejects_invalid_observation_payload(monkeypatch: pytest.MonkeyPatch):
    payloads = iter(
        [
            {"status": "COMPLETE", "resolvedCoordinate": [{"ra": 1.0, "decl": 2.0}]},
            {"status": "COMPLETE", "data": "not-a-list"},
        ]
    )
    service = MastService()
    monkeypatch.setattr(service, "_invoke", lambda _request: next(payloads))

    with pytest.raises(MastServiceError, match="invalid observation search"):
        service.search("HD 1", ("TESS",))


def test_datasets_api_returns_502_with_safe_error_message(
    monkeypatch: pytest.MonkeyPatch,
):
    from fastapi.testclient import TestClient

    from app.api.dependencies import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user"}

    def mock_search(*_args, **_kwargs):
        raise MastServiceError("MAST request failed: The read operation timed out")

    monkeypatch.setattr(
        "app.services.nasa.mast_service.MastService.search", mock_search
    )

    try:
        with TestClient(app) as client:
            response = client.get(
                "/api/v1/datasets/search?target=Kepler-10&mission=all"
            )

        assert response.status_code == 502
        assert response.json()["detail"] == (
            "NASA MAST archive is temporarily unavailable. Please retry the search."
        )
    finally:
        app.dependency_overrides.clear()


def test_datasets_api_returns_authenticated_search_results(
    monkeypatch: pytest.MonkeyPatch,
):
    from fastapi.testclient import TestClient

    from app.api.dependencies import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user"}
    expected = [
        {
            "target_name": "TOI-700",
            "mission": "TESS",
            "observation_period": "Archive observation",
            "format": "FITS",
            "filename": "toi700_lc.fits",
            "data_uri": "mast:TESS/product/toi700_lc.fits",
            "size_bytes": 10,
        }
    ]
    monkeypatch.setattr(
        "app.services.nasa.mast_service.MastService.search",
        lambda *_args, **_kwargs: expected,
    )

    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/datasets/search?target=TOI-700&mission=all")
        assert response.status_code == 200
        assert response.json() == expected
    finally:
        app.dependency_overrides.clear()


def test_datasets_api_returns_empty_search_results(monkeypatch: pytest.MonkeyPatch):
    from fastapi.testclient import TestClient

    from app.api.dependencies import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user"}
    monkeypatch.setattr(
        "app.services.nasa.mast_service.MastService.search",
        lambda *_args, **_kwargs: [],
    )

    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/datasets/search?target=Unknown&mission=all")
        assert response.status_code == 200
        assert response.json() == []
    finally:
        app.dependency_overrides.clear()
