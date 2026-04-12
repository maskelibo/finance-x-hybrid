# EXECUTION CHECKLIST — USAGE GELİNCE
**Tarih:** 10 Nisan 2026  
**Tahmini Süre:** 4-5 saat  
**Hedef:** SISE raporunu 62/100'den 90+/100'e çıkarmak

---

## ⏱️ ZAMAN PLANI

| Adım | Süre | Açıklama |
|------|------|----------|
| **1. Agent Feedback** | 90 dk | 6 agent'a feedback yaz |
| **2. Memory Optimization** | 60 dk | Archive eski feedback'leri |
| **3. Test Run (TEKRAR)** | 15 dk | Tek metrik hesaplama testi |
| **4. SISE Regeneration** | 120 dk | Tam rapor yeniden üretimi |
| **5. Final Review** | 30 dk | CEO quality check + PDF |
| **TOPLAM** | **~5 saat** | |

---

## ✅ ADIM 1: AGENT FEEDBACK (90 dk)

### 1.1 Financial Analysis Agent (30 dk)

**Dosya:** `agents/financial_analysis/memory.md`

**Komutt (Şimdilik):**
```bash
# AGENT_FEEDBACK_READY.md'den ilgili bölümü kopyala
# agents/financial_analysis/memory.md'ye Edit tool ile ekle
```

**Eklenecek Feedback Başlıkları:**
- [ ] DSO, DIO, DPO, CCC formülleri + hesaplama adımları
- [ ] ROE, ROCE, ROIC formülleri + SISE için özel notlar
- [ ] Interest Coverage + CAPEX/FAVÖK
- [ ] Working Capital section zorunluluğu
- [ ] Veri tutarsızlığı protokolü
- [ ] Cash Flow Waterfall zorunluluğu

**Doğrulama:**
- [ ] memory.md'ye eklendi
- [ ] Toplam boyut <15 KB (daha sonra optimize edilecek)

---

### 1.2 Data Collection Agent (15 dk)

**Dosya:** `agents/data_collection/memory.md`

**Eklenecek:**
- [ ] Veri tutarsızlığı çözüm protokolü (ortalama alma YASAK)
- [ ] 5 yıllık detaylı tablo indirme (dipnotlar dahil)
- [ ] Çeyrek raporlar da indir (trend için)
- [ ] Veri kalite kontrolü (kaynak belge + dipnot referansı)

---

### 1.3 Macro Analysis Agent (15 dk)

**Dosya:** `agents/macro_analysis/memory.md`

**Eklenecek:**
- [ ] FX senaryo analizi (Base/Bear/Extreme)
- [ ] Sektör-spesifik göstergeler (inşaat, otomotiv, gıda sektörleri)
- [ ] Faiz politikası transmission zinciri
- [ ] Forward curve analizi (enerji fiyatları)

---

### 1.4 Sector Competition Agent (10 dk)

**Dosya:** `agents/sector_competition/memory.md`

**Eklenecek:**
- [ ] Peer comparison table (Saint-Gobain, AGC, Guardian, Owens-Illinois)
- [ ] Veri kaynakları (annual reports, sector reports)
- [ ] Karşılaştırmalı yorum (neden fark var?)

---

### 1.5 Event Impact Mapper Agent (10 dk)

**Dosya:** `agents/event_impact_mapper/memory.md`

**Eklenecek:**
- [ ] Combined scenario analysis
- [ ] Timeline görselleştirmesi (çeyrek bazında)
- [ ] Liquidity stress testing
- [ ] Tüm KAP bildirimleri review (16/16, neden 10 haritalanmadı?)

---

### 1.6 Final Summary Agent (10 dk)

**Dosya:** `agents/final_summary/memory.md`

**Eklenecek:**
- [ ] Rapor cleanup protokolü
- [ ] Yasak ifadeler listesi
- [ ] Pre-submit checklist
- [ ] CEO quality review kuralları

---

## ✅ ADIM 2: MEMORY OPTIMIZATION (60 dk)

### 2.1 Archive Script Yaz (30 dk)

**Dosya:** `scripts/archive-old-memory.sh`

```bash
#!/bin/bash

# Memory optimization script
# Archives feedback older than 6 months

AGENTS_DIR="agents"
ARCHIVE_DATE="2025-10-01"  # 6 months ago from 2026-04-10

for agent_dir in "$AGENTS_DIR"/*/; do
  agent=$(basename "$agent_dir")
  memory_file="${agent_dir}memory.md"
  archive_dir="${agent_dir}archive"
  
  echo "Processing $agent..."
  
  # Create archive directory if not exists
  mkdir -p "$archive_dir"
  
  # Extract old feedback (manual for now, regex later)
  # TODO: Implement date-based extraction
  
  echo "  → Archive directory ready"
done
```

**Test:**
- [ ] Script çalışıyor
- [ ] Archive klasörleri oluşturuluyor

---

### 2.2 Manual Archive (CEO, Financial, Macro) (30 dk)

**En büyük 3 memory'yi manuel temizle:**

**CEO (60 KB → 10 KB):**
- [ ] Son 6 ay feedback tut (2025-10-01 sonrası)
- [ ] Chairman direktifleri tut (kalıcı)
- [ ] Eski feedback'leri `agents/ceo/archive/2025-Q4.md` taşı

**Macro Analysis (31 KB → 10 KB):**
- [ ] Kimlik kartı + yetenek haritası tut
- [ ] Son 6 ay öğrenme geçmişi tut
- [ ] Eski öğrenme notlarını `agents/macro_analysis/archive/learning-2025.md` taşı

**Financial Analysis (22 KB → 10 KB):**
- [ ] Kimlik kartı tut
- [ ] Temel formüller tut
- [ ] Detaylı örnekleri `agents/financial_analysis/examples/` taşı

**Doğrulama:**
- [ ] CEO memory: <12 KB
- [ ] Macro memory: <12 KB  
- [ ] Financial memory: <12 KB
- [ ] Archive dosyaları oluşturuldu

---

## ✅ ADIM 3: TEST RUN (15 dk)

**Tek Metrik Hesaplama Testi:**

```bash
# Test: Financial Analysis agent'ın DSO hesaplayabildiğini doğrula

# Küçük test görevi oluştur
cat > /tmp/test-dso-task.txt << 'EOF'
SISE için DSO (Days Sales Outstanding) hesapla.

Veriler:
- Ticari Alacaklar: 15.2B TRY (KAP Q4 2024, Dipnot 7)
- Net Satışlar: 185.6B TRY (2024)

Formül: (Ticari Alacaklar / Net Satışlar) × 365

Hesapla, yorumla, benchmark ile karşılaştır (cam sektörü 50-60 gün).
EOF

# Agent çalıştır (mock - gerçekte backend script ile)
# node backend/src/test-agent.ts financial_analysis /tmp/test-dso-task.txt
```

**Beklenen Çıktı:**
```
DSO = (15.2 / 185.6) × 365 = 29.9 gün

Yorum: SISE'nin DSO'su 29.9 gün, sektör benchmark'ı (50-60 gün) altında.
Bu ÇOK İYİ bir performans - alacakları çok hızlı tahsil ediyor.
Muhtemel nedenler: Güçlü müşteri tabanı, ön ödeme politikaları, veya nakit satış ağırlıklı.
```

**Doğrulama:**
- [ ] Agent formülü doğru uyguladı
- [ ] Hesaplama doğru
- [ ] Yorum yapıldı
- [ ] Benchmark ile karşılaştırıldı

**Başarısızsa:**
- Feedback'i tekrar gözden geçir
- Formülü memory'ye daha net yaz
- Tekrar test et

---

## ✅ ADIM 4: SISE REGENERATION (120 dk)

### 4.1 Prepare Context (10 dk)

```bash
# SISE session bilgilerini getir
SESSION_ID="fwSLyU9JEeiMGoH8ja840"

sqlite3 backend/data/financex.db "SELECT ticker, runtime_mode FROM analysis_sessions WHERE id = '$SESSION_ID'"
# Output: SISE | FAST
```

**Context Hazırlığı:**
- [ ] Ticker: SISE
- [ ] Runtime mode: FAST (değiştirilsin mi? → DEEP muhtemelen daha iyi)
- [ ] Existing agent outputs: 16 completed

**Karar: Hangi Agentları Yeniden Çalıştıralım?**

| Agent | Yeniden Çalışsın mı? | Neden? |
|-------|---------------------|--------|
| data_collection | ✅ EVET | Dipnotları yeniden indir, tutarsızlıkları çöz |
| financial_analysis | ✅ EVET | 11 metrik hesapla |
| macro_analysis | ✅ EVET | Senaryo analizi ekle |
| sector_competition | ✅ EVET | Peer comparison table |
| event_impact_mapper | ❌ HAYIR | Zaten iyi çalışmış |
| strategic_synthesis | ✅ EVET | Yeni metriklerle yeniden sentezle |
| final_summary | ✅ EVET | Cleanup protokolü ile yeniden |

**Yaklaşım:**
- Tüm analizi BAŞTAN çalıştırmak yerine
- Sadece critical agentları rerun et
- Yeni çıktıları mevcut session'a ekle

---

### 4.2 Agent Rerun Script (20 dk)

**Dosya:** `backend/src/rerun-sise-critical-agents.ts`

```typescript
import { db } from './db.js';
import { runAgent } from './agent-runner.js';

const SESSION_ID = 'fwSLyU9JEeiMGoH8ja840';
const CRITICAL_AGENTS = [
  'data_collection',
  'financial_analysis',
  'macro_analysis',
  'sector_competition',
  'strategic_synthesis',
  'final_summary'
];

async function main() {
  for (const agentId of CRITICAL_AGENTS) {
    console.log(`\n🔄 Re-running ${agentId}...`);
    
    // Build context from OTHER completed agents
    const context = buildContext(SESSION_ID, agentId);
    
    // Run agent
    const result = await runAgent({
      agentId,
      taskPrompt: getTaskPrompt(agentId),
      context,
      timeoutMs: 10 * 60 * 1000 // 10 min
    });
    
    // Update database
    if (result.success) {
      updateAgentRun(SESSION_ID, agentId, result);
    }
  }
}
```

**Run:**
```bash
cd backend
npm run tsx src/rerun-sise-critical-agents.ts
```

**Tahmini Süre:**
- data_collection: 15 dk
- financial_analysis: 25 dk (11 metrik + yorumlar)
- macro_analysis: 10 dk
- sector_competition: 15 dk
- strategic_synthesis: 20 dk
- final_summary: 15 dk
- **TOPLAM: ~100 dk**

---

### 4.3 Monitor Progress (20 dk)

**Terminal output izle:**
```
🔄 Re-running data_collection...
...............  (her nokta 10 saniye)
✅ data_collection completed (12.3s, 5.2K tokens, $0.12)

🔄 Re-running financial_analysis...
.............................  (28.5s)
✅ financial_analysis completed (28.5s, 18.4K tokens, $0.31)
```

**Sorun Çıkarsa:**
- Rate limit → Bekle, devam et
- Timeout → Timeout süresini artır (15 dk)
- Agent error → Log'u oku, feedback'i düzelt, tekrar dene

---

## ✅ ADIM 5: FINAL REVIEW & PDF (30 dk)

### 5.1 CEO Quality Review (15 dk)

**Final Summary output'u oku:**

```bash
sqlite3 backend/data/financex.db \
  "SELECT output_text FROM agent_runs 
   WHERE session_id = 'fwSLyU9JEeiMGoH8ja840' AND agent_id = 'final_summary'
   ORDER BY rowid DESC LIMIT 1" > /tmp/sise-final-new.md
```

**Checklist:**
- [ ] Her metrik hesaplanmış mı? (DSO, DIO, DPO, CCC, ROE, ROCE, Interest Coverage...)
- [ ] Her metrik yorumlanmış mı? (Sadece sayı değil, ne anlama geliyor?)
- [ ] Belirsiz ifadeler var mı? ("Yüksek", "düşük" context olmadan kullanılmış mı?)
- [ ] Segment breakdown var mı? (7 segment analiz edilmiş mi?)
- [ ] Peer comparison var mı? (Saint-Gobain, AGC rakamları ile karşılaştırma?)
- [ ] Senaryo analizi var mı? (FX scenarios, combined event impact?)
- [ ] Agent internal comments temiz mi? (Meta-text yok mu?)
- [ ] Kaynak referansları var mı? (Web araştırma yapılmış mı?)
- [ ] Rapor bir sonuca varıyor mu? (Actionable insights?)

**Tek bir HAYIR varsa:** REJECT → Agent'a geri gönder

---

### 5.2 PDF Generation (15 dk)

**Raporu temizle:**
```bash
# Agent yorumlarını temizle (olmamalı ama kontrol et)
sed -i.bak '/^Hafızamı/d' /tmp/sise-final-new.md
sed -i.bak '/^## ÖZ-DEĞERLENDİRME/,/^---/d' /tmp/sise-final-new.md
```

**PDF oluştur:**
```bash
python3 backend/src/generate-sise-pdf-v2.py
```

**Output:**
- PDF: `SISE_YONETIM_RAPORU_FINAL_V2.pdf`
- Grafikler: `/tmp/sise_charts_v2/` (5 chart)

**Doğrulama:**
- [ ] PDF açılıyor
- [ ] Tüm bölümler var (A. KÂRLILIK METRİKLERİ dahil)
- [ ] Tablolar düzgün
- [ ] Grafikler embedded
- [ ] Türkçe karakterler doğru

---

### 5.3 Database Update (5 dk)

**Reports tablosunu güncelle:**

```bash
sqlite3 backend/data/financex.db << EOF
UPDATE reports 
SET 
  content = readfile('/tmp/sise-final-new.md'),
  pdf_path = 'SISE_YONETIM_RAPORU_FINAL_V2.pdf',
  web_html_path = NULL,
  status = 'completed',
  completed_at = datetime('now')
WHERE session_id = 'fwSLyU9JEeiMGoH8ja840';
EOF
```

**Analysis session totals güncelle:**
```bash
# Total cost ve tokens yeni agent run'lardan ekle
# (Script otomatik yapıyor zaten)
```

---

## ✅ BAŞARI KRİTERLERİ

### Metrik Coverage:
- [x] DSO hesaplanmış
- [x] DIO hesaplanmış  
- [x] DPO hesaplanmış
- [x] CCC hesaplanmış
- [x] NWC/Revenue hesaplanmış
- [x] ROE hesaplanmış (IAS29 with/without)
- [x] ROCE hesaplanmış
- [x] ROIC hesaplanmış (bonus)
- [x] Interest Coverage hesaplanmış
- [x] CAPEX/FAVÖK hesaplanmış
- [x] NWC Days hesaplanmış

### Analiz Kalitesi:
- [x] Segment breakdown (7 segment × 3 metrik minimum)
- [x] Peer comparison (4+ rakip ile karşılaştırma)
- [x] FX senaryo analizi (Base/Bear/Extreme)
- [x] Combined event scenarios
- [x] Cash flow waterfall
- [x] Sektör-spesifik makro göstergeler

### Veri Kalitesi:
- [x] Equity tutarsızlığı çözüldü
- [x] 2021 EBITDA hatası düzeltildi veya hariç tutuldu
- [x] Tüm metrikler kaynak referanslı
- [x] Dipnot referansları var

### Profesyonellik:
- [x] Agent internal comments YOK
- [x] Meta-text temiz
- [x] PDF kaliteli (ASELS standardında)
- [x] Türkçe karakterler doğru

---

## 📊 BEKLENEN SONUÇ

**Önceki Rapor:** 62/100
- İçerik: 7/10
- Metrik: 4/10
- Veri: 6/10
- Profesyonellik: 8/10

**Yeni Rapor Hedefi:** 90+/100
- İçerik: 9.5/10 (tüm segmentler + senaryolar)
- Metrik: 9/10 (11/11 kritik metrik hesaplandı)
- Veri: 9/10 (tutarsızlıklar çözüldü)
- Profesyonellik: 9.5/10 (temiz, kaynaklı, detaylı)

---

**CHECKLIST HAZIR**

**Başlangıç Komutu (Usage Gelince):**
```bash
cd /Users/ibrahimpeyman/Documents/Finance\ X
open EXECUTION_CHECKLIST.md
open AGENT_FEEDBACK_READY.md

# ADIM 1: Agent Feedback'leri uygula (90 dk)
# Her agent için Edit tool kullan
```

**İlerleme Takibi:**
- Her checkbox işaretle
- Sorun çıkarsa not et
- Tamamlandığında Chairman'a rapor et
