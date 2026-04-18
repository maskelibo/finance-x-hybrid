#!/bin/bash
# Download the 6 tickers that failed in the first run
cd "/Users/ibrahimpeyman/Documents/Finance X"
PYTHON="/Users/ibrahimpeyman/Documents/Finance X/python-services/.venv/bin/python"

for TICKER in GARAN ISCTR KOZAA KOZAL KRDMD YKBNK; do
  echo "=============================="
  echo "Starting $TICKER"
  echo "=============================="
  "$PYTHON" -u scripts/download_bist30_reports.py --ticker "$TICKER"
  echo ""
done

echo "ALL 6 MISSING TICKERS DONE"
