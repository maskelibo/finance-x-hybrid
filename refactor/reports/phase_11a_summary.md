# Phase 11A Summary — Observability Dashboard

- Branch: `refactor/phase-11a-observability-dashboard`
- Başlangıç: `refactor/phase-10a-regression-extension` HEAD (commit 66af2e91)
- Davranış değişimi: **SIFIR** (pipeline'a dokunmadı). Yalnızca server'a 6 yeni read-only API endpoint + 1 static HTML dashboard eklendi.

## Hedef

`CLAUDE_MASTER_PROMPT.md` §8 adım 12 (observability/dashboard) + brief Faz 11
(Dashboard & Observability). Phase 3A/4A/5A/6A/7A'da kurulan observer
katmanının verisine insan gözüyle bakılabilmesi için.

## Ne yapıldı

### 1. `backend/src/refactor/dashboard-api.ts` — 6 yeni endpoint

Tümü read-only, tümü migration yoksa `{ migration_applied: false, reason }`
döner (500 atmaz). `safeQuery` / `safeQueryOne` helper'ları "no such
column" / "no such table" hatalarını yutup null döndürür.

| Path | Ne döner |
| --- | --- |
| `GET /api/refactor/overview` | Tüm observer'ların toplam kayıt sayısı + compression ratio ortalaması |
| `GET /api/refactor/gates` | Phase 3A: gate event'leri gate_kind × decision_taken breakdown + would_have_blocked counts + son 25 event |
| `GET /api/refactor/validation` | Phase 4A: validation_category dağılımı + top 40 agent×category çifti |
| `GET /api/refactor/manifest` | Phase 5A: agent bazında raw/manifest byte ortalamaları + compression_ratio + truncation_risk count |
| `GET /api/refactor/checklist` | Phase 6A: session rollup (avg addressal_rate, escalation_count) + son 25 escalation + ticker bazında avg rate |
| `GET /api/refactor/doctrine` | Phase 7A: gate_events detail_json parse → OI-* violation hit sayıları (shadow validator zaten bunları yazıyor) |

### 2. `backend/public/refactor-dashboard/index.html` — static UI

Framework yok, build step yok, node_modules'a dokunmaz. Vanilla JS:

- API key input (localStorage'a kaydeder, her request `x-api-key` header'ına ekler)
- Her 30 sn otomatik refresh + manuel "Yenile" butonu
- Overview cards: session sayısı, her phase'in kayıt sayısı
- Phase 3A: kind/decision grid + recent events tablosu
- Phase 4A: category breakdown cards
- Phase 5A: agent compression tablosu (raw bytes → manifest bytes → ratio → truncation risk)
- Phase 6A: rollup cards (avg rate, escalation count) + escalation table
- Phase 7A: OI-* rule hit tablosu (boşsa "henüz OI-* violation yok — iyi haber")
- Migration pending uyarıları dashboard'da pill olarak gözükür (sessiz fail değil)

`backend/src/server.ts` Phase 11A wiring:

```ts
import { registerRefactorDashboardRoutes } from './refactor/dashboard-api.js';
…
registerRefactorDashboardRoutes(app);
const REFACTOR_DASHBOARD_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  '..', 'public', 'refactor-dashboard',
);
if (fs.existsSync(REFACTOR_DASHBOARD_DIR)) {
  app.use('/refactor-dashboard', express.static(REFACTOR_DASHBOARD_DIR));
}
```

ESM-compatible path resolve (backend `"type": "module"`). Windows drive
letter düzeltmesi dahil.

### 3. Dashboard URL'leri

Server ayağa kalktığında:

- UI: `http://<host>:<PORT>/refactor-dashboard/`
- API (JSON): `http://<host>:<PORT>/api/refactor/overview` (+ diğerleri)

`FINANCE_X_API_KEY` tanımlıysa API auth geçerli; dashboard UI key'i input
field'dan ister, localStorage'da tutar.

## Tests

```
cd backend && npx tsc --noEmit                             exit 0
python canonical/_loader/python/loader.py --selftest       OK
python evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json           OK (15/15)
python evals/golden/canonical_structure_test.py            canonical structure: OK
```

Dashboard manuel test (migration uygulanmadığı için tüm endpoints
"migration_applied: false" döner; yeşil/kırmızı pill'ler doğru render'
oluyor).

## Canlı davranış beklenen değişimi

**Hiçbir.** Pipeline aynı. Yalnızca mevcut sunucuya 6 GET endpoint + 1
static klasör eklendi. Migration uygulandığında dashboard canlı veri
göstermeye başlar.

## Phase 11A → 11B roadmap (paralel)

- **11B:** Historical trend grafikleri (sparkline'lar) — Canvas/SVG ile
  time-series gösterimi (irony: OI-007 Chart.js yasak ama dashboard
  için iç kullanıma Chart.js açılabilir mi? Hayır — canvas yasağı
  delivery/rapor path'i için; dashboard ayrı bir yüzey. Yine de inline
  SVG tercih ederiz).
- **11C:** Alerting — escalation_flag=1 session için Slack/email hook.
- **11D:** CSV export.

Hiçbiri master §8 kapsamında değil; opsiyonel iyileştirmeler.

## Kapsam dışında (başka fazın işi)

- Migration uygulama mekanizması — DB-tool phase'i olur (Phase 12A?) — Node
  tabanlı `apply-migrations.ts` script `better-sqlite3` kullanarak.
- Dashboard'a canlı seans akışı (WebSocket). Phase 11B.
- User management / RBAC. Out of scope.
