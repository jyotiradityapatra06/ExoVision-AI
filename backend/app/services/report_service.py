"""Professional local PDF generation from stored ExoVision result data."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from reportlab.graphics.shapes import Drawing, PolyLine, Rect, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.services.result_service import ResultNotFoundError, ResultService


class ReportNotFoundError(FileNotFoundError):
    """Raised when source analysis data or a generated report is missing."""


class ReportService:
    """Generate and retrieve local scientific PDF reports."""

    def __init__(
        self,
        upload_root: str | Path,
        report_root: str | Path,
    ) -> None:
        self.result_service = ResultService(upload_root)
        self.report_root = Path(report_root).resolve()

    def generate(self, analysis_id: str) -> dict[str, str]:
        """Generate or replace one report from persisted analysis results."""
        try:
            result = self.result_service.get(analysis_id)
        except ResultNotFoundError as error:
            raise ReportNotFoundError("Completed analysis result not found.") from error
        self.report_root.mkdir(parents=True, exist_ok=True)
        destination = self.report_root / f"{analysis_id}.pdf"
        temporary = self.report_root / f"{analysis_id}.tmp"
        try:
            _build_pdf(temporary, result)
            temporary.replace(destination)
        except Exception:
            temporary.unlink(missing_ok=True)
            raise
        return {
            "analysis_id": analysis_id,
            "status": "generated",
            "filename": destination.name,
            "download_url": f"/api/v1/reports/{analysis_id}/download",
        }

    def download_path(self, analysis_id: str) -> Path:
        """Return a validated generated report path."""
        if not analysis_id or not analysis_id.isalnum():
            raise ReportNotFoundError("Generated report not found.")
        path = self.report_root / f"{analysis_id}.pdf"
        if not path.is_file():
            raise ReportNotFoundError("Generated report not found.")
        return path


def _build_pdf(path: Path, result: dict[str, Any]) -> None:
    styles = _styles()
    document = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=18 * mm,
        title=f"ExoVision AI Analysis {result['analysis_id']}",
        author="ExoVision AI",
        subject="Explainable exoplanet transit analysis",
    )
    story: list[Any] = [
        Spacer(1, 42 * mm),
        Paragraph("EXOVISION AI", styles["brand"]),
        Paragraph("Scientific Analysis Report", styles["title"]),
        Spacer(1, 8 * mm),
        Paragraph(
            "Explainable exoplanet transit detection and candidate classification",
            styles["subtitle"],
        ),
        Spacer(1, 24 * mm),
        _key_value_table(
            [
                ("Analysis ID", str(result["analysis_id"])),
                ("Generated", datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")),
                (
                    "Pipeline status",
                    str(result["summary"].get("pipeline_status", "unknown")),
                ),
            ],
            widths=(42 * mm, 94 * mm),
        ),
        Spacer(1, 25 * mm),
        Paragraph(
            "This report summarizes automated signal processing and "
            "machine-learning evidence. It is intended for scientific review, "
            "not as confirmation of an exoplanet.",
            styles["callout"],
        ),
        PageBreak(),
        Paragraph("1. Analysis Summary", styles["heading"]),
        _key_value_table(
            [
                ("Status", str(result["summary"].get("status", "unknown"))),
                ("Samples analyzed", str(result["summary"].get("sample_count", 0))),
                (
                    "Candidates detected",
                    str(result["summary"].get("candidate_count", 0)),
                ),
                ("Transit detected", "Yes" if result["transit"]["detected"] else "No"),
            ]
        ),
        Spacer(1, 8 * mm),
        Paragraph("2. Raw Light Curve", styles["heading"]),
        _line_chart(
            result["lightcurve"]["time"],
            result["lightcurve"]["flux"],
            "Stellar flux over observation time",
            "Time",
            "Relative flux",
            colors.HexColor("#38BDF8"),
        ),
        Spacer(1, 7 * mm),
        Paragraph("3. Transit Parameters", styles["heading"]),
        _key_value_table(
            [
                (
                    "Orbital period",
                    _measurement(result["transit"].get("period"), "days"),
                ),
                ("Transit epoch", _measurement(result["transit"].get("epoch"), "days")),
                ("Duration", _measurement(result["transit"].get("duration"), "days")),
                (
                    "Transit depth",
                    _measurement(result["transit"].get("depth"), "relative flux", 6),
                ),
                (
                    "Signal-to-noise ratio",
                    _measurement(result["transit"].get("snr"), "", 2),
                ),
            ]
        ),
        PageBreak(),
        Paragraph("4. Phase-Folded Transit", styles["heading"]),
        _line_chart(
            result["transit"]["phase"],
            result["transit"]["flux"],
            "Flux aligned to detected orbital phase",
            "Orbital phase",
            "Relative flux",
            colors.HexColor("#14B8A6"),
        ),
        Spacer(1, 8 * mm),
    ]
    candidates = result.get("candidates", [])
    if candidates:
        candidate = candidates[0]
        story.extend(
            [
                Paragraph("5. Candidate Classification", styles["heading"]),
                _key_value_table(
                    [
                        ("Candidate ID", str(candidate["candidate_id"])),
                        ("Classification", str(candidate["classification"])),
                        (
                            "Model score",
                            f"{float(candidate['confidence']) * 100:.1f}%",
                        ),
                        ("Classifier", "Random Forest"),
                        ("Period", _measurement(candidate.get("period"), "days")),
                        (
                            "Transit depth",
                            _measurement(candidate.get("depth"), "relative flux", 6),
                        ),
                        ("Transit SNR", _measurement(candidate.get("snr"), "", 2)),
                    ]
                ),
                Spacer(1, 8 * mm),
                Paragraph("6. AI Explanation", styles["heading"]),
                Paragraph(
                    str(
                        candidate["explanation"].get(
                            "summary", "No AI summary available."
                        )
                    ),
                    styles["body"],
                ),
                Spacer(1, 3 * mm),
                Paragraph(
                    "The model score reflects the Random Forest classifier output "
                    "for this candidate. It is not a calibrated probability that "
                    "the signal represents a confirmed exoplanet.",
                    styles["callout"],
                ),
                Spacer(1, 4 * mm),
                _evidence_block(
                    "Supporting evidence",
                    candidate["explanation"].get("positive_factors", []),
                    styles,
                    "#047857",
                ),
                Spacer(1, 3 * mm),
                _evidence_block(
                    "Cautionary evidence",
                    candidate["explanation"].get("negative_factors", []),
                    styles,
                    "#B45309",
                ),
            ]
        )
    else:
        story.extend(
            [
                Paragraph("5. Candidate Classification", styles["heading"]),
                Paragraph(
                    "No transit candidate was available for ML classification.",
                    styles["body"],
                ),
            ]
        )
    story.extend(
        [
            Spacer(1, 10 * mm),
            Paragraph("Scientific Disclaimer", styles["heading"]),
            Paragraph(
                "ExoVision AI provides automated candidate screening for education "
                "and research support. A model classification is not a confirmed "
                "discovery. Validation requires independent review, additional "
                "observations, instrument-systematics assessment, and established "
                "astronomical follow-up procedures. Model probabilities are not "
                "calibrated occurrence probabilities.",
                styles["disclaimer"],
            ),
        ]
    )
    document.build(story, onFirstPage=_page_decoration, onLaterPages=_page_decoration)


def _styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "brand": ParagraphStyle(
            "Brand",
            parent=base["Heading2"],
            alignment=TA_CENTER,
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#0284C7"),
            spaceAfter=8,
        ),
        "title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            alignment=TA_CENTER,
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=34,
            textColor=colors.HexColor("#0F172A"),
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["BodyText"],
            alignment=TA_CENTER,
            fontSize=11,
            leading=17,
            textColor=colors.HexColor("#475569"),
        ),
        "heading": ParagraphStyle(
            "Heading",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=19,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=3,
            spaceAfter=9,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#334155"),
        ),
        "callout": ParagraphStyle(
            "Callout",
            parent=base["BodyText"],
            fontSize=9.5,
            leading=15,
            borderColor=colors.HexColor("#BAE6FD"),
            borderWidth=0.8,
            borderPadding=10,
            backColor=colors.HexColor("#F0F9FF"),
            textColor=colors.HexColor("#334155"),
        ),
        "disclaimer": ParagraphStyle(
            "Disclaimer",
            parent=base["BodyText"],
            fontSize=8.5,
            leading=13,
            borderColor=colors.HexColor("#CBD5E1"),
            borderWidth=0.6,
            borderPadding=9,
            backColor=colors.HexColor("#F8FAFC"),
            textColor=colors.HexColor("#475569"),
        ),
    }


def _key_value_table(
    rows: list[tuple[str, str]], widths: tuple[float, float] = (55 * mm, 110 * mm)
) -> Table:
    table = Table(rows, colWidths=list(widths), hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#475569")),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#0F172A")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def _line_chart(
    x_values: list[float],
    y_values: list[float],
    title: str,
    x_label: str,
    y_label: str,
    accent: colors.Color,
) -> Drawing:
    width, height = 480, 190
    drawing = Drawing(width, height)
    drawing.add(
        Rect(
            0,
            0,
            width,
            height,
            fillColor=colors.HexColor("#F8FAFC"),
            strokeColor=colors.HexColor("#CBD5E1"),
            strokeWidth=0.7,
            rx=5,
            ry=5,
        )
    )
    drawing.add(
        String(
            16,
            height - 20,
            title,
            fontName="Helvetica-Bold",
            fontSize=9,
            fillColor=colors.HexColor("#334155"),
        )
    )
    if len(x_values) < 2 or len(y_values) < 2:
        drawing.add(
            String(
                width / 2 - 50,
                height / 2,
                "Chart data unavailable",
                fontSize=9,
                fillColor=colors.HexColor("#64748B"),
            )
        )
        return drawing
    pairs = list(zip(x_values, y_values, strict=False))
    if len(pairs) > 800:
        step = len(pairs) / 800
        pairs = [pairs[min(int(index * step), len(pairs) - 1)] for index in range(800)]
    left, bottom, plot_width, plot_height = 48, 32, width - 66, height - 65
    x_min, x_max = min(point[0] for point in pairs), max(point[0] for point in pairs)
    y_min, y_max = min(point[1] for point in pairs), max(point[1] for point in pairs)
    margin = max((y_max - y_min) * 0.08, abs(y_max) * 0.0005, 1e-9)
    y_min, y_max = y_min - margin, y_max + margin
    for index in range(5):
        vertical = bottom + (plot_height * index) / 4
        drawing.add(
            PolyLine(
                [(left, vertical), (left + plot_width, vertical)],
                strokeColor=colors.HexColor("#E2E8F0"),
                strokeWidth=0.5,
            )
        )
    points = [
        (
            left + ((x - x_min) / (x_max - x_min or 1)) * plot_width,
            bottom + ((y - y_min) / (y_max - y_min or 1)) * plot_height,
        )
        for x, y in pairs
    ]
    drawing.add(PolyLine(points, strokeColor=accent, strokeWidth=1.2))
    drawing.add(
        String(
            left,
            10,
            f"{x_label}: {x_min:.3f} to {x_max:.3f}",
            fontSize=7.5,
            fillColor=colors.HexColor("#64748B"),
        )
    )
    drawing.add(
        String(
            width - 108, 10, y_label, fontSize=7.5, fillColor=colors.HexColor("#64748B")
        )
    )
    return drawing


def _evidence_block(
    title: str, factors: list[str], styles: dict[str, ParagraphStyle], color: str
) -> KeepTogether:
    content: list[Any] = [
        Paragraph(f"<font color='{color}'><b>{title}</b></font>", styles["body"])
    ]
    if factors:
        content.extend(Paragraph(f"- {factor}", styles["body"]) for factor in factors)
    else:
        content.append(Paragraph("- No factors recorded.", styles["body"]))
    return KeepTogether(content)


def _measurement(value: Any, unit: str, digits: int = 4) -> str:
    if value is None:
        return "Not available"
    suffix = f" {unit}" if unit else ""
    return f"{float(value):.{digits}f}{suffix}"


def _page_decoration(canvas: Any, document: Any) -> None:
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(colors.HexColor("#0F172A"))
    canvas.rect(0, height - 9 * mm, width, 9 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#7DD3FC"))
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.drawString(18 * mm, height - 5.8 * mm, "EXOVISION AI - SCIENTIFIC REPORT")
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.setFont("Helvetica", 7.5)
    canvas.drawRightString(width - 18 * mm, 9 * mm, f"Page {document.page}")
    canvas.restoreState()
