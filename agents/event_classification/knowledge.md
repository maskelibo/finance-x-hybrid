# Event Classification Agent — Bilgi Bankasi (Katman 2)

> Bu dosya gece egitimlerinden damitilmis domain bilgisi icerir.
> Normal gorevde ihtiyac duydugunda `Read` ile ac.
> Gece egitiminde guncellenir.

---

## 1. KAP Olay Taksonomisi

### Ana Kategoriler

| Kod | Kategori | Ornek | Tipik Confidence |
|---|---|---|---|
| `debt_issuance` | Tahvil/eurobond ihrac, kredi anlasmasi | SISE $500M Eurobond | HIGH (tutar+faiz+vade) |
| `dividend_buyback` | Temettu bildirimi, hisse geri alim | KCHOL 6.83 TL/hisse | HIGH (explicit tutar) |
| `management_change` | YK baskan/CEO degisikligi | THYAO CEO+Chairman degisim | routine=MEDIUM, unexpected=HIGH |
| `production_halt` | Uretim durusu/yeniden baslatma | SISE Italya plant re-start | HIGH |
| `capex_decision` | Fabrika transferi/yatirim karari | SISE Denizli→Kirklareli | MEDIUM (inference) |
| `routine_filing` | Finansal raporlar, governance form | Ceyreklik finansal tablo | HIGH |
| `corporate_governance` | Denetci secimi, komite atamalari | EREGL denetci secimi | HIGH |
| `macro_event` | EPDK, BOTAS, TCMB, jeopolitik | Hurmuz krizi, TCMB +900bps | HIGH (olay kesin) |
| `macro_regulatory_event` | EPDK/BOTAS tarife kararlari | EPDK gaz +%18.61 | HIGH |
| `trade_regulatory_event` | AB Safeguard, CBAM, anti-dumping | AB safeguard kota -%47 | HIGH |
| `commodity_market_event` | HRC, demir cevheri, kok komuru soklari | HRC >$1,100/ton | MEDIUM |
| `corporate_action` | Temettu, sermaye artirimi, borclanma | Sermaye artirimi | HIGH |

### Sektor-Ozel Ek Kategoriler

**Telekom:**
- `spectrum_acquisition` — Spectrum auction, lisans alimi (TCELL 160 MHz, $1.224B)
- `network_rollout` — 5G/4G coverage expansion, sehir lansmanlari
- `regulatory_compliance` — BTK filings, interconnection anlasmalar

**Celik/Emtia:**
- 5 zorunlu kategori: kap_material_disclosure, macro_regulatory_event, trade_regulatory_event, commodity_market_event, corporate_action

---

## 2. Confidence Scoring Kalibrasyon

**HIGH Confidence Kosullari:**
- Acik sartlar mevcut: tutar, faiz orani, vade, explicit dil
- SPK approval language = OTOMATIK HIGH
- Kesin temettu tutari (TL/hisse)
- Yururlukteki duzenliyici karar (EPDK tarife artisi)

**MEDIUM Confidence Kosullari:**
- Inference gereken durumlar (CAPEX karari baglam gerektirir)
- Routine/expected event (AGM board elections)
- Yonetim kurulu istifasi (yorum gerektirir)

**LOW Confidence Kosullari:**
- Yalnizca dolayli kanit
- Haber kaynagindan gelen dogrulanmamis bilgi

---

## 3. Zaman Damgasi Oncelik Siralamasi

| Kategori | Aralik | Downstream Kullanim |
|---|---|---|
| AKTIF | Son 30 gun | event_impact_mapper birincil input |
| GECMIS-GECERLI | 30-180 gun | Baglam ve trend analizi |
| ARSIV | 180+ gun | Tarihsel referans |

---

## 4. Quantitative Impact Protokolu

Her event icin ZORUNLU hesaplama:

```
Business Outcome Metrics:
- Cash impact: [Inflow/Outflow] X TRY
- P&L impact: EBITDA +/- Y TRY, Net income +/- Z TRY
- Balance sheet impact: Equity +/- A TRY, Debt +/- B TRY
- Cash flow impact: Operating/Financing/Investing CF breakdown
- % of metrics: % of equity, % of market cap, % of annual EBITDA
- FX conversion: USD/EUR → TRY at disclosure date rate
- Amortization/depreciation impact (spectrum, network equipment)
```

Rakam yoksa → sektor benchmark proxy kullan, estimate yap.

---

## 5. Multi-Event Interaction Analizi

Ayni ceyrekte birden fazla event varsa:

```
Cross-Event Impact Analysis:
- Event #1: [Type] → [Impact]
- Event #2: [Type] → [Impact]
- Interaction effect: Amplify mi, offset mi?
- Net consolidated impact: Combined equity/P&L/CF etkisi
- Ornek: Dividend payout (equity -) + Bond issuance (debt +) → net likidite?
```

AKBNK ornegi: AT1 bond + covered bonds + dividend uclusu → sermaye uzerindeki birlesik etki analiz edilmeli.

---

## 6. Sektor-Spesifik Siniflandirma Kaliplari

### Holding Sirketleri
- Event density dusuk: Yilda 3-5 materyel event (operating companies 8-12)
- Board governance events daha yuksek materiality — aile mirasi, independent director atamalari stratejik sinyal
- Dividend payout ratio indicator: >%70 = mature, distribution odakli
- Bagli ortaklik islemleri (pay satis/alim) = ZORUNLU classify

### Celik Sirketleri
- EPDK tarife kararlari = macro_regulatory_event (KAP bildirimi olmasa da siniflandirilir)
- AB Safeguard kota degisikligi = trade_regulatory_event
- CBAM gecis donemi = trade_regulatory_event
- Reserve determination/drilling updates net karar yoksa → `unclassified` escalate

### Telekom
- 5G spectrum amortization 17 yil = industry standard → HIGH confidence
- Network rollout milestones ayri event
- BTK filings = regulatory_compliance

---

## 7. Ozel Siniflandirma Kurallari

- Tek event birden fazla tip icerebilir → primary + secondary classification yap
- AGM/Genel Kurul: gundemde birden fazla materyel karar varsa her karar AYRI olay
- Annual/integrated report → `routine_filing` (olay tipi degil)
- Audit firm secimi → `corporate_governance` (operasyonel event degil)
- Board committee reassignments → `corporate_governance` primary
- Subsidiary board appointments → `corporate_governance` + `management_change`
- Makro olaylar (Hurmuz, TCMB faiz) KAP bildirimi OLMASA DA siniflandirilir
- Routine filing vs event distinction kritik: "Board appointments" (event) vs "governance compliance form" (routine)
- Primary kaynak yoksa placeholder event uretme → `unclassified_due_to_missing_primary_source`
- Her event'te gercek bildirim URL'si ve mumkunse bildirim numarasi ZORUNLU
- Rakam iceren event'leri authoritative source ile capraz kontrol etmeden miktar yazma
- `primary_type` yaninda kisa downstream muhasebe etkisi notu ver

---

## 8. Discrepancy Protokolu

1. Veri celiskisi tespit et (ornek: Context "$1.5B" vs KAP "$500M")
2. KAP Watch'a data request gonder
3. Primary source'dan arastir (KAP PDF, web search)
4. Resolve et veya CEO'ya eskalat et
5. Cozumsuz kalirsa → flag olarak downstream'e ilet

---
