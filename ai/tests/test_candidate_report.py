"""Tests for JSON-safe explained candidate reports."""

import json

from ai.ml.report import generate_candidate_report


def test_candidate_report_is_json_serializable_and_groups_evidence():
    explanation = {
        "prediction": "Planet Transit Candidate",
        "confidence": 0.96,
        "feature_contributions": [
            {
                "feature": "transit_snr",
                "impact": "positive",
                "score": 0.18,
                "description": "High transit SNR",
            },
            {
                "feature": "stellar_variability_score",
                "impact": "negative",
                "score": -0.05,
                "description": "Moderate stellar variability",
            },
        ],
        "summary": "Strong periodic transit signal with consistent depth.",
        "missing_features": [],
    }

    report = generate_candidate_report("EXO-001", explanation)

    assert report["classification"] == {
        "label": "Planet Transit Candidate",
        "confidence": 0.96,
    }
    assert report["evidence"]["positive"] == ["High transit SNR"]
    assert report["evidence"]["negative"] == ["Moderate stellar variability"]
    assert json.loads(json.dumps(report)) == report


def test_separate_prediction_and_explanation_are_supported():
    report = generate_candidate_report(
        "EXO-002",
        {"class": "Noise", "confidence": 0.8},
        {"feature_contributions": [], "summary": "Likely noise."},
    )

    assert report["candidate_id"] == "EXO-002"
    assert report["classification"]["label"] == "Noise"
