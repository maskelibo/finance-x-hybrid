#!/bin/bash
# Monitor THYAO session AKyBn8BMI_5OuhprEd_S7 every 60s until complete.
SID="AKyBn8BMI_5OuhprEd_S7"
URL="http://localhost:4001/api/sessions/${SID}"
OUT="/c/Users/koray/projeler/finance-x-hybrid/scripts/monitor-thyao.log"
: > "$OUT"
for i in $(seq 1 120); do
  SNAPSHOT=$(curl -s -m 10 "$URL" 2>&1)
  STATUS=$(echo "$SNAPSHOT" | python -c "import json,sys;d=json.load(sys.stdin);s=d.get('session',{});print(s.get('status',''))" 2>/dev/null)
  PHASE=$(echo "$SNAPSHOT" | python -c "import json,sys;d=json.load(sys.stdin);s=d.get('session',{});print(s.get('current_phase',''))" 2>/dev/null)
  COST=$(echo "$SNAPSHOT" | python -c "import json,sys;d=json.load(sys.stdin);s=d.get('session',{});print(s.get('total_cost_usd',0))" 2>/dev/null)
  TOK=$(echo "$SNAPSHOT" | python -c "import json,sys;d=json.load(sys.stdin);s=d.get('session',{});print(s.get('total_tokens',0))" 2>/dev/null)
  ERR=$(echo "$SNAPSHOT" | python -c "import json,sys;d=json.load(sys.stdin);s=d.get('session',{});print(s.get('error_message') or '')" 2>/dev/null)
  TS=$(date +"%H:%M:%S")
  echo "[$TS] #$i status=$STATUS phase='$PHASE' cost=\$$COST tokens=$TOK err=$ERR" >> "$OUT"
  # Stop conditions
  case "$STATUS" in
    completed|completed_with_warning|completed_degraded|failed|qa_failed|blocked_for_review)
      echo "[$TS] STOP — terminal status: $STATUS" >> "$OUT"
      break
      ;;
  esac
  sleep 60
done
echo "[$(date +%H:%M:%S)] monitor loop exited" >> "$OUT"
