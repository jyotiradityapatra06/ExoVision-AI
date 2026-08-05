"""Generate release-ready architecture and workflow diagrams for documentation."""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

OUTPUT = Path(__file__).resolve().parents[1] / "docs" / "assets"
BACKGROUND = "#020617"
PANEL = "#0f172a"
CYAN = "#22d3ee"
VIOLET = "#a78bfa"
TEXT = "#f8fafc"
MUTED = "#94a3b8"


def _canvas(width: float, height: float):
    figure, axis = plt.subplots(figsize=(width, height), dpi=160)
    figure.patch.set_facecolor(BACKGROUND)
    axis.set_facecolor(BACKGROUND)
    axis.set_xlim(0, 16)
    axis.set_ylim(0, 9)
    axis.axis("off")
    return figure, axis


def _node(axis, x, y, width, height, title, subtitle="", color=CYAN):
    patch = FancyBboxPatch(
        (x, y),
        width,
        height,
        boxstyle="round,pad=0.18,rounding_size=0.2",
        linewidth=1.4,
        edgecolor=color,
        facecolor=PANEL,
    )
    axis.add_patch(patch)
    axis.text(
        x + width / 2,
        y + height * 0.61,
        title,
        ha="center",
        va="center",
        color=TEXT,
        fontsize=10,
        fontweight="bold",
    )
    if subtitle:
        axis.text(
            x + width / 2,
            y + height * 0.30,
            subtitle,
            ha="center",
            va="center",
            color=MUTED,
            fontsize=7.2,
        )


def _arrow(axis, start, end, color=CYAN):
    axis.add_patch(
        FancyArrowPatch(
            start,
            end,
            arrowstyle="-|>",
            mutation_scale=13,
            linewidth=1.25,
            color=color,
            connectionstyle="arc3,rad=0",
        )
    )


def architecture():
    figure, axis = _canvas(12, 6.75)
    axis.text(
        0.7,
        8.35,
        "EXOVISION AI — SYSTEM ARCHITECTURE",
        color=TEXT,
        fontsize=17,
        fontweight="bold",
    )
    axis.text(
        0.7,
        7.92,
        "From astronomical archives to explainable scientific evidence",
        color=MUTED,
        fontsize=9,
    )
    _node(axis, 0.7, 5.5, 3.0, 1.25, "Data sources", "NASA MAST · FITS · CSV · TXT")
    _node(
        axis, 4.9, 5.5, 3.0, 1.25, "Next.js product", "Auth · demo · datasets · results"
    )
    _node(
        axis, 9.1, 5.5, 3.0, 1.25, "FastAPI service", "REST · ownership · orchestration"
    )
    _node(
        axis,
        2.8,
        2.7,
        3.4,
        1.25,
        "Scientific pipeline",
        "Preprocess · BLS · phase fold",
        VIOLET,
    )
    _node(
        axis,
        7.0,
        2.7,
        3.4,
        1.25,
        "ML + explainability",
        "Features · Random Forest · evidence",
        VIOLET,
    )
    _node(
        axis,
        11.2,
        2.7,
        3.4,
        1.25,
        "Persistent outputs",
        "SQLite/PostgreSQL · FITS · PDF",
    )
    _node(
        axis,
        5.9,
        0.45,
        4.2,
        1.15,
        "Human-reviewed result",
        "Charts · confidence · report · caveats",
        CYAN,
    )
    _arrow(axis, (3.7, 6.12), (4.9, 6.12))
    _arrow(axis, (7.9, 6.12), (9.1, 6.12))
    _arrow(axis, (10.6, 5.5), (6.2, 3.65), VIOLET)
    _arrow(axis, (6.2, 3.32), (7.0, 3.32), VIOLET)
    _arrow(axis, (10.4, 3.32), (11.2, 3.32))
    _arrow(axis, (12.0, 2.7), (9.5, 1.6))
    _arrow(axis, (7.0, 2.7), (7.7, 1.6), CYAN)
    figure.savefig(
        OUTPUT / "architecture-diagram.png", bbox_inches="tight", facecolor=BACKGROUND
    )
    plt.close(figure)


def workflow():
    figure, axis = _canvas(12, 6.75)
    axis.text(
        0.7,
        8.35,
        "EXOVISION — ANALYSIS WORKFLOW",
        color=TEXT,
        fontsize=15,
        fontweight="bold",
    )
    axis.text(
        0.7,
        7.92,
        "One scientific path for local, demo, Kepler, K2, and TESS light curves",
        color=MUTED,
        fontsize=9,
    )
    steps = [
        ("01", "Acquire", "MAST or upload"),
        ("02", "Validate", "FITS / tabular"),
        ("03", "Preprocess", "clean + detrend"),
        ("04", "Detect", "BLS transit search"),
        ("05", "Extract", "candidate features"),
        ("06", "Classify", "Random Forest"),
        ("07", "Explain", "ranked evidence"),
        ("08", "Report", "charts + PDF"),
    ]
    positions = [
        (0.7 + (index % 4) * 3.8, 5.15 if index < 4 else 2.45) for index in range(8)
    ]
    for (number, title, subtitle), (x, y) in zip(steps, positions, strict=True):
        color = CYAN if int(number) <= 4 else VIOLET
        _node(axis, x, y, 2.8, 1.35, f"{number}  {title}", subtitle, color)
    for index in range(3):
        _arrow(
            axis,
            (positions[index][0] + 2.8, positions[index][1] + 0.67),
            (positions[index + 1][0], positions[index + 1][1] + 0.67),
        )
    _arrow(
        axis,
        (positions[3][0] + 1.4, positions[3][1]),
        (positions[7][0] + 1.4, positions[7][1] + 1.35),
        VIOLET,
    )
    for index in range(7, 4, -1):
        _arrow(
            axis,
            (positions[index][0], positions[index][1] + 0.67),
            (positions[index - 1][0] + 2.8, positions[index - 1][1] + 0.67),
            VIOLET,
        )
    _arrow(
        axis,
        (positions[4][0] + 1.4, positions[4][1]),
        (positions[4][0] + 1.4, 1.35),
        CYAN,
    )
    axis.text(
        8,
        0.9,
        "REVIEWABLE PLANETARY EVIDENCE",
        ha="center",
        color=TEXT,
        fontsize=12,
        fontweight="bold",
    )
    axis.text(
        8,
        0.55,
        "Automated screening — not confirmation",
        ha="center",
        color=MUTED,
        fontsize=8,
    )
    figure.savefig(
        OUTPUT / "workflow-diagram.png", bbox_inches="tight", facecolor=BACKGROUND
    )
    plt.close(figure)


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    architecture()
    workflow()
    print(f"Generated portfolio diagrams in {OUTPUT}")
