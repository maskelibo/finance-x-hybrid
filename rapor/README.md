# Rapor Arşivi

Pipeline milestone'ları için live validation raporları ve örnek rendered HTML/PDF arşivi.

## 2026-04-27 — P4.alpha Live KCHOL Validation

| Dosya | İçerik |
|---|---|
| [`p4-validation-report-20260427.md`](./p4-validation-report-20260427.md) | P3 + P4.alpha live KCHOL validation özet raporu (10/10 PASS) |
| [`KCHOL_Yonetim_Kurulu_Raporu_20260427.html`](./KCHOL_Yonetim_Kurulu_Raporu_20260427.html) | Canlı render edilmiş KCHOL FY2025 raporu (297 KB, 16 sayfa, 9 SVG) — P3+P4 boardroom intelligence sections görünür: İç Tutarlılık Kontrolü + Yönetim Kurulu Beklenen Soruları + Kanıt İndeksi |
| [`KCHOL_Yonetim_Kurulu_Raporu_20260427.pdf`](./KCHOL_Yonetim_Kurulu_Raporu_20260427.pdf) | Aynı raporun PDF render'ı (9.6 MB) |

### HTML/PDF görüntüleme linkleri

GitHub web UI HTML'i kaynak kod olarak gösterir. Direkt render için:

- **HTML rendered preview:** https://htmlpreview.github.io/?https://github.com/maskelibo/finance-x-hybrid/blob/finance-x-execution/rapor/KCHOL_Yonetim_Kurulu_Raporu_20260427.html
- **PDF raw download:** https://github.com/maskelibo/finance-x-hybrid/raw/finance-x-execution/rapor/KCHOL_Yonetim_Kurulu_Raporu_20260427.pdf

### Özet metrikler

- Session: `oQEnLXNHqT033cz0yl3Vi`
- Süre: ~87 dk
- Maliyet: $5.09 USD
- HEAD: `b315ec25` (P4.alpha shipped)
- Verdict: **PASS ✅**

### Live doğrulanan katmanlar

| Katman | Status | Kanıt |
|---|---|---|
| P1.gamma source=hint | ✅ | `pdf=KCHOL_financial_report_20260211_1555903.pdf source=hint` |
| P2.beta confidence | ✅ | `[truth-layer] KCHOL ... confidence=1.00` |
| P3.alpha contradiction-hunter | ✅ | `findings=2 high=0 medium=1 low=1` |
| P3.gamma chairman-anticipator | ✅ | 7 question, source=llm, $0.0824, 68s |
| P3.delta citation-backfill | ✅ | 32 citations, must_cited=2/2, uncited_must=0 |
| P4.alpha 3 yeni HTML section | ✅ | İç Tutarlılık + Boardroom Q&A + Kanıt İndeksi rendered |
