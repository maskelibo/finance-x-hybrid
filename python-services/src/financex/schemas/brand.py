"""Brand identity used by report_formatter when rendering the final HTML/PDF."""

from __future__ import annotations

from pydantic import Field

from financex.schemas.base import FinancexModel


class BrandIdentity(FinancexModel):
    """Visual identity extracted from the company's annual report cover.

    All optional — report_formatter falls back to a neutral Finance X palette
    if nothing is supplied.
    """

    primary_color_hex: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    secondary_color_hex: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    accent_color_hex: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    font_family: str | None = None
    logo_url: str | None = None
    tagline: str | None = None
    source_page: int | None = Field(default=None, description="Page in the annual report the identity was lifted from.")
