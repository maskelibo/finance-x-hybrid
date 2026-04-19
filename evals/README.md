# Finance X Evals

Rapor kalite ve agent çıktı doğrulama için eval framework.

## İçerik

- `golden/` — Ticker başına beklenen çıktı snapshot'ları (bölüm sayısı, char count, SVG sayısı, kritik metrikler)
- `baseline.json` — Baseline latency/cost/quality metrikleri
- `run-eval.py` / `run-eval.ts` — Eval runner (Python + TypeScript muadili)
- `test-engine*.py` — Financial engine test suite
- `test-validator.py` — Schema validation test

## Gereksinimler

- Python 3.11+, uv
- Node.js 20+
- `.env` içinde `ANTHROPIC_API_KEY`

## Çalıştırma

```bash
# Tam regression
python evals/run-eval.py

# Tek ticker golden compare
python evals/run-eval.py --ticker TUPRS

# Financial engine unit
python evals/test-engine-unit.py
```

## Yeni Golden Ekleme

1. Tam pipeline çalıştır: `pnpm dev` → `POST /api/analysis/start { ticker, runtime_mode }`
2. Üretilen rapor onaylandıktan sonra:
   ```bash
   python evals/run-eval.py --ticker XXX --save-golden
   ```
3. `evals/golden/XXX.expected.json` oluşur — PR'a ekle.

## Regression Eşikleri

- Rapor HTML min 30.000 karakter
- Bölüm sayısı = 12 (I–XII)
- Minimum 4 SVG grafik
- Kapak + 11 içerik sayfa = toplam 12 `.page` div
- Chart.js canvas yasak (svgCount ≥ 1 ve canvasCount = 0)
