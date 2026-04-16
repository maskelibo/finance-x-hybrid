"""data_collection tests — classification, period inference, manifest building."""

from __future__ import annotations

from datetime import date, datetime, timezone
from pathlib import Path

from financex.calculators.data_collection import (
    classify_kind,
    infer_period,
    run_data_collection,
)
from financex.crawlers.kap import MockKapClient, RawDisclosure


# ---------- kind classification ----------

def test_category_fr_is_financial_report() -> None:
    assert classify_kind("Finansal Rapor", "FR", None) == "financial_report"


def test_title_faaliyet_is_activity_report() -> None:
    assert classify_kind("Faaliyet Raporu (Konsolide)", "ODA", None) == "activity_report"


def test_title_financial_report_in_english() -> None:
    assert classify_kind("Financial Report", "ODA", None) == "financial_report"


def test_unknown_kind_falls_through_to_disclosure() -> None:
    assert classify_kind("Kredi Derecelendirmesi", "ODA", None) == "disclosure"


def test_classify_is_case_insensitive_turkish() -> None:
    # Turkish-aware lower means 'FİNANSAL' normalizes correctly.
    assert classify_kind("FİNANSAL RAPOR", "ODA", None) == "financial_report"


# ---------- period inference ----------

def test_period_from_date_range_q3() -> None:
    label, year = infer_period(
        "Faaliyet Raporu",
        "01.01.2024 - 30.09.2024 Faaliyet Raporu",
        datetime(2024, 11, 7, tzinfo=timezone.utc),
    )
    assert label == "Q3-2024"
    assert year == 2024


def test_period_from_date_range_fy() -> None:
    label, year = infer_period(
        "Faaliyet Raporu",
        "01.01.2023 - 31.12.2023",
        datetime(2024, 3, 15, tzinfo=timezone.utc),
    )
    assert label == "FY2023"
    assert year == 2023


def test_period_turkish_quarter_fallback() -> None:
    label, year = infer_period(
        "2024 3. Çeyrek Finansal Takvim", None, datetime(2024, 10, 1, tzinfo=timezone.utc)
    )
    assert label == "Q3-2024"
    assert year == 2024


def test_period_fallback_to_publish_year() -> None:
    label, year = infer_period(
        "Kredi Derecelendirmesi", None, datetime(2024, 11, 19, tzinfo=timezone.utc)
    )
    assert label is None
    assert year == 2024


# ---------- runner with a mock client ----------

class _MockClientWithPdf(MockKapClient):
    """MockKapClient + stub download_pdf so run_data_collection exercises the PDF path."""

    def __init__(self, fixtures: list[RawDisclosure], pdf_body: bytes = b"%PDF-stub") -> None:
        super().__init__(fixtures)
        self.pdf_body = pdf_body
        self.downloads: list[str] = []

    def download_pdf(self, disclosure_index) -> bytes:
        self.downloads.append(str(disclosure_index))
        return self.pdf_body


def _raw(
    idx: str,
    ticker: str,
    title: str,
    when: datetime,
    *,
    category: str | None = None,
    summary: str | None = None,
) -> RawDisclosure:
    return RawDisclosure(
        disclosure_id=idx,
        ticker=ticker,
        announced_at=when,
        title=title,
        url=f"https://www.kap.org.tr/tr/Bildirim/{idx}",
        category=category,
        summary=summary,
    )


def test_run_downloads_only_chosen_kinds(tmp_path: Path) -> None:
    fixtures = [
        _raw("100", "KCHOL", "Finansal Rapor", datetime(2024, 11, 7, tzinfo=timezone.utc), category="FR"),
        _raw("101", "KCHOL", "Faaliyet Raporu", datetime(2024, 11, 7, tzinfo=timezone.utc),
             summary="01.01.2024 - 30.09.2024 Faaliyet Raporu"),
        _raw("102", "KCHOL", "Kredi Derecelendirmesi", datetime(2024, 11, 19, tzinfo=timezone.utc)),
    ]
    client = _MockClientWithPdf(fixtures)
    manifest = run_data_collection(
        "KCHOL",
        since=date(2024, 1, 1),
        until=date(2024, 12, 31),
        client=client,
        pdf_dir=tmp_path,
    )
    # Two reports should be downloaded; credit rating disclosure skipped.
    assert len(manifest.documents) == 2
    assert {d.disclosure_index for d in manifest.documents} == {"100", "101"}
    assert client.downloads == ["100", "101"]
    # Files actually landed on disk.
    for doc in manifest.documents:
        assert Path(doc.local_path).exists()


def test_run_writes_pdf_with_expected_name(tmp_path: Path) -> None:
    fixtures = [
        _raw("100", "KCHOL", "Finansal Rapor", datetime(2024, 11, 7, 18, 17, tzinfo=timezone.utc), category="FR"),
    ]
    client = _MockClientWithPdf(fixtures)
    manifest = run_data_collection("KCHOL", since=date(2024, 1, 1), until=date(2024, 12, 31),
                                    client=client, pdf_dir=tmp_path)
    name = Path(manifest.documents[0].local_path).name
    assert name == "KCHOL_financial_report_20241107_100.pdf"
    assert manifest.documents[0].content_sha256 != ""
    assert manifest.documents[0].size_bytes == len(b"%PDF-stub")


def test_run_is_idempotent_reuses_existing_file(tmp_path: Path) -> None:
    fixtures = [
        _raw("100", "KCHOL", "Finansal Rapor", datetime(2024, 11, 7, tzinfo=timezone.utc), category="FR"),
    ]
    client = _MockClientWithPdf(fixtures)
    manifest1 = run_data_collection("KCHOL", since=date(2024, 1, 1), until=date(2024, 12, 31),
                                     client=client, pdf_dir=tmp_path)
    mtime1 = Path(manifest1.documents[0].local_path).stat().st_mtime

    client2 = _MockClientWithPdf(fixtures)
    manifest2 = run_data_collection("KCHOL", since=date(2024, 1, 1), until=date(2024, 12, 31),
                                     client=client2, pdf_dir=tmp_path)
    mtime2 = Path(manifest2.documents[0].local_path).stat().st_mtime

    # Second run may re-fetch from network but must not rewrite file on disk
    # (same SHA means write skipped).
    assert mtime1 == mtime2


def test_manifest_exposes_financial_vs_activity_helpers(tmp_path: Path) -> None:
    fixtures = [
        _raw("100", "KCHOL", "Finansal Rapor", datetime(2024, 11, 7, tzinfo=timezone.utc), category="FR"),
        _raw("101", "KCHOL", "Faaliyet Raporu", datetime(2024, 11, 7, tzinfo=timezone.utc)),
    ]
    client = _MockClientWithPdf(fixtures)
    manifest = run_data_collection("KCHOL", since=date(2024, 1, 1), until=date(2024, 12, 31),
                                    client=client, pdf_dir=tmp_path)
    assert len(manifest.financial_reports()) == 1
    assert len(manifest.activity_reports()) == 1
