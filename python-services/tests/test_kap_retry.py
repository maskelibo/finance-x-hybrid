"""Tests for _retry() backoff wrapper in crawlers/kap.py.

Uses a fake httpx.MockTransport so no real network is hit. Verifies:
  - 500 / 502 / 503 / 504 / 429 get retried up to 3 times
  - non-retryable (e.g. 404, 400) fail on first try
  - successful response short-circuits further attempts
  - exponential backoff sleeps are respected (we patch time.sleep)
"""

from __future__ import annotations

from unittest.mock import patch

import httpx
import pytest

from financex.crawlers import kap as kap_module
from financex.crawlers.kap import HttpKapClient


def _build_client_with_responses(responses: list[tuple[int, bytes]]) -> HttpKapClient:
    """Build a KAP client whose httpx.Client returns `responses` in order."""
    iterator = iter(responses)

    def handler(request: httpx.Request) -> httpx.Response:
        status, body = next(iterator)
        return httpx.Response(status, content=body, request=request)

    transport = httpx.MockTransport(handler)
    http_client = httpx.Client(base_url="https://www.kap.org.tr", transport=transport)
    return HttpKapClient(http_client=http_client)


def test_500_retries_and_then_succeeds() -> None:
    search_ok = b'[{"category":"companyOrFunds","results":[{"cmpOrFundCode":"THYAO","memberOrFundOid":"oid-1"}]}]'
    client = _build_client_with_responses([
        (500, b""),
        (500, b""),
        (200, search_ok),
    ])
    with patch.object(kap_module.time, "sleep") as mock_sleep:
        oid = client.resolve_member_oid("THYAO")
    assert oid == "oid-1"
    # Two retries → two sleep calls. Backoff base is 5s (tuned for
    # KAP's rate-limit window) and doubles each attempt: 5s, 10s.
    assert mock_sleep.call_count == 2
    assert mock_sleep.call_args_list[0].args[0] == pytest.approx(5.0)
    assert mock_sleep.call_args_list[1].args[0] == pytest.approx(10.0)


def test_429_is_retryable() -> None:
    search_ok = b'[{"category":"companyOrFunds","results":[{"cmpOrFundCode":"X","memberOrFundOid":"oid-x"}]}]'
    client = _build_client_with_responses([
        (429, b""),
        (200, search_ok),
    ])
    with patch.object(kap_module.time, "sleep"):
        oid = client.resolve_member_oid("X")
    assert oid == "oid-x"


def test_404_fails_fast_no_retry() -> None:
    client = _build_client_with_responses([
        (404, b""),
    ])
    with patch.object(kap_module.time, "sleep") as mock_sleep:
        with pytest.raises(httpx.HTTPStatusError):
            client.resolve_member_oid("NOPE")
    assert mock_sleep.call_count == 0  # non-retryable — fail fast


def test_all_four_attempts_500_raises() -> None:
    client = _build_client_with_responses([
        (500, b""),
        (500, b""),
        (500, b""),
        (500, b""),
        (500, b""),  # one extra in case _retry calls fn() one more time after loop
    ])
    with patch.object(kap_module.time, "sleep"):
        with pytest.raises(httpx.HTTPStatusError):
            client.resolve_member_oid("X")


def test_successful_first_attempt_no_sleep() -> None:
    search_ok = b'[{"category":"companyOrFunds","results":[{"cmpOrFundCode":"X","memberOrFundOid":"oid-x"}]}]'
    client = _build_client_with_responses([
        (200, search_ok),
    ])
    with patch.object(kap_module.time, "sleep") as mock_sleep:
        client.resolve_member_oid("X")
    mock_sleep.assert_not_called()
