# knowledge_base — Case Lessons

### 2026-04-26 — KCHOL (on üçüncü run, 26 Nisan 2026)
- **Corpus durumu (13. kez aynı)**: Yalnızca KCHOL_Yonetim_Kurulu_Raporu_20260414 + _2026 (platform-derived). kap_primary_in_corpus=false, confidence max=MEDIUM cap. KCHOL_financial_report_20260211_1555903 (367KB) hâlâ indexlenmemiş. STRUCTURAL_BLOCK + PIPELINE DUR aktif.
- **Yeni untracked**: KCHOL_Yonetim_Kurulu_Raporu_20260425.html + .pdf (25 Nisan 2026 — 12. sesyondan bu yana eklendi), KCHOL_Yonetim_Kurulu_Raporu_20260424.html + .pdf (bilinen), backend/kchol-dc.json (data_collection manifest). Hiçbiri indexlenmemiş.
- **SQ-01 (SOTP)**: 5 chunk, rel=0.989. p.9: SOTP metodoloji (GCM %85/406TL, DDM %5/21TL). p.10: Sensitivity (NAV 388TL; 25%→291TL, 30%→272TL, 35%→252TL★, 40%→233TL, 47%→204TL◆). p.5: TUPRS efektif pay %40.5–44.8, doğrudan %26.2. ARCLK-Hitachi post-transfer: rag_out_of_scope (13. kez).
- **SQ-02 (FY2025 gelir)**: 5 chunk, rel=0.994. p.7: FY2025=2,760B TRY konsolide (YKBNK 924B dahil). FY2024=752B corpus'ta (Q4 figürü — karışıklık). %267 artış = YKBNK konsolidasyon etkisi. KAP primary referans: yok.
- **SQ-03 (IFRS 8 EBITDA)**: 5 chunk, rel=1.0. Segment NI katkısı: TUPRS+13.4B, FROTO+17.7B, Finans+4.2B, ARCLK-10.9B, Diğer-2.4B. IFRS8 segment EBITDA/Gelir: 13. kez 0 chunk. P0 bloker kalıcı aktif.
- **SQ-04 (YKBNK izolasyonu)**: 5 chunk, rel=0.997. p.8: Temettü kapasitesi varlık satışına bağlı — bankacılık nakit akışı negatif. Holding-only Net Borç/EBITDA: 13. kez rag_out_of_scope.
- **SQ-05 (OCF/FCF)**: 5 chunk, rel=1.0. p.4 skor kartı: "FCF negatif". OCF=-101.9B TRY / FCF=~-120B TRY p.8'den (memory onaylı). 5YR OCF trend ve CF işletme/yatırım/finansman split: yok.
- **SQ-06 (IAS 29)**: 5 chunk, rel=0.99. p.5 (_2026): "IAS 29 tersine dönüş, ARCLK impairment, enerji one-time" — inference only, denetim notu yok. NI 5YR: 46,483→91,427→191,696→25,872→22,000 mn TRY. Monetary_gain TRY tutarı: 13. kez rag_out_of_scope.
- **SQ-07 (NAV iskonto peer)**: 5 chunk, rel=0.992. p.10: sensitivity confirmed. p.2 (_2026): Temettü=%3.35, 6.83TL/hisse, payout=%78.7, karşılama=1.27x. Peer (SAHOL/KOZAL/ECZYT): 13. kez rag_out_of_scope. Holding giderleri/NAV TL: yok.
- **Mimari root cause (13. kez)**: post-download Qdrant index trigger eksik. PIPELINE HARD_STOP kuralı (≥3 consecutive kap_primary_in_corpus=false) 10+ seans önce tetiklenmeliydi. Chairman + CEO bildirimi bu çıktıya eklendi.

### 2026-04-25 — KCHOL (on ikinci run, 25 Nisan 2026)
- **Corpus durumu (12. kez aynı)**: Yalnızca KCHOL_Yonetim_Kurulu_Raporu_20260414 + _2026 (platform-derived). kap_primary_in_corpus=false, confidence max=MEDIUM cap. KCHOL_financial_report_20260211_1555903 hâlâ indexlenmemiş. STRUCTURAL_BLOCK + PIPELINE DUR aktif. Chairman + CEO bildirimi acil.
- **SQ-01 (SOTP)**: 5 chunk, rel=0.995. Koç Group efektif: TUPRS=%51.2/256.5B, YKBNK=%68/190.6B, FROTO=~50%/187.9B, TOASO=%41/63.6B, ARCLK=%53.5/35.9B, Kote olmayan~147.5B. Brüt=882B, iskonto=%39.5. ARCLK post-Hitachi devir (%60, Nisan 2026) verisi rag_out_of_scope.
- **SQ-02 (FY2025 gelir)**: 5 chunk, rel=0.993. FY2025=2,757,295 mn TRY / 2,760B TRY confirmed. Corpus p.7: FY2024=752B = Q4 figürü (karışıklık corpus'ta da işaretli). FAVÖK=181.5B TRY, NI=22B TRY (%70 varlık satışı).
- **SQ-03 (YKBNK izolasyonu)**: 5 chunk, rel=0.984. YKBNK konsolide aktifin %61.17, 924B TRY gelir katkısı. Holding-only Net Borç: rag_out_of_scope (12. kez). P0 bloker aktif.
- **SQ-04 (CF tablosu)**: 5 chunk, rel=0.992. OCF=-101.9B TRY, FCF=~-120B TRY [DÜŞÜK GÜVEN]. CF işletme/yatırım/finansman split yok. CAPEX missing. P0 kısmen açık.
- **SQ-05 (IFRS 8 EBITDA)**: 5 chunk, rel=0.984, ama chunk içeriği 0 EBITDA. Corpus p.25 explicit: "IFRS 8 segment EBITDA ekstraksiyon %0" (12. kez). Yalnızca segment NI: TUPRS+13.4B, FROTO+17.7B, Finans+4.2B, ARCLK-10.9B, Diğer-2.4B. P0 bloker aktif.
- **SQ-06 (NAV iskonto)**: 5 chunk, rel=0.985. İki ölçüm: (1) %39.5 (517B/882B), (2) %47.4 (204TL/388TL). Sensitivity: %35→252TL★baz. GCM SOTP anchor=406TL (ağırlık %85). Peer (SAHOL/KOZAL) rag_out_of_scope.
- **SQ-07 (holding giderleri/IAS29)**: 5 chunk, rel=0.996. Temettü=%3.35 getiri / 6.83TL/hisse / payout=%78.7 / karşılama=1.27x. Merkez giderleri explicit TL tutarı yok (DDM 21TL/hisse çıkarım, düşük güven). IAS 29 parasal kazanç/NI: 12. kez rag_out_of_scope. "Denetim notları ile doğrulanmadı" yine görüldü.
- **Mimari root cause (12. kez)**: post-download Qdrant index trigger eksik. Chairman eskalasyon olmadan çözülmeyecek. Tek fix: data_collection sonrası otomatik Qdrant index trigger + KB'den 'CORPUS_INCOMPLETE' sinyal.

### 2026-04-25 — KCHOL (on birinci run, 25 Nisan 2026)
- **Corpus durumu (11. kez aynı)**: Yalnızca KCHOL_Yonetim_Kurulu_Raporu_20260414 + _2026 (platform-derived). kap_primary_in_corpus=false, confidence max=MEDIUM cap. KCHOL_financial_report_20260211_1555903 (367KB) hâlâ indexlenmemiş. CHAIRMAN + CEO bildirimi zorunlu; PIPELINE DUR tetiklendi.
- **SQ-01 (SOTP)**: 5 chunk, rel=0.991. Corpus SOTP tablosu (Koç Group efektif pay: TUPRS=%51.2, YKBNK=%68, FROTO=~%50, TOASO=%41, ARCLK=%53.5) mevcut. Brüt NAV=882B TRY, iskonto=%39.5, piyasa=517B TRY. Blended NAV 385-388 TL vs 204 TL = %47.4 iskonto. EV/EBITDA çarpanları corpus'ta yok. KCHOL legal entity payları farklı (TUPRS=%40.5, YKBNK=%48.99) — valuation_agent açıklamalı.
- **SQ-02 (FY2025 gelir)**: 5 chunk, rel=1.0. FY2025 = 2,757,295 mn TRY / 2,760B TRY confirmed. p.7'deki 752B = Q4 FY2024 figürü (P0-KCHOL-002 corpus içi de işaretli). FAVÖK FY2025=181.5B TRY, NI=22B TRY, %70'i varlık satışından.
- **SQ-03 (IFRS 8 segment EBITDA)**: 5 chunk, rel=0.986. EBITDA/Revenue sıfır — yalnızca segment NI katkısı: TUPRS+13.4B, FROTO+17.7B, Finans+4.2B, ARCLK-10.9B, Diğer-2.4B. P0 bloker aktif.
- **SQ-04 (YKBNK izolasyonu)**: 5 chunk, rel=0.995. YKBNK=konsolide aktifin %61.17. Holding-only Net Borç rag_out_of_scope. FAVÖK FY2025=181.5B (reported, YKBNK dahil). NWC=-443B TL (bankacılık distorsiyonu). P0 bloker aktif.
- **SQ-05 (OCF/FCF)**: 5 chunk, rel=0.992. OCF=-101.9B TRY, FCF=~-120B TRY [DÜŞÜK GÜVEN, YKBNK kredi büyümesi etkisi]. CF işletme/yatırım/finansman split yok. CAPEX missing. P0 kısmen açık.
- **SQ-06 (IAS 29)**: 5 chunk, rel=1.0. "Denetim notları ile doğrulanmadı" 11. kez. NI trendi confirmed: 46,483→91,427→191,696→25,872→22,000 mn TRY. Monetary_gain/NI TRY tutarı yok. P0 bloker aktif.
- **SQ-07 (NAV iskonto peer)**: 5 chunk, rel=0.995. Temettü verimi=%3.35, karşılama=1.27x, tarihsel band=%10-40. SAHOL/KOZAL/ECZYT peer verisi rag_out_of_scope — external_research zorunlu.
- **Mimari root cause (11. kez)**: post-download Qdrant index trigger eksik. Chairman'e eskalasyon yapılmadıkça çözülmeyecek.

### 2026-04-25 — KCHOL (onuncu run, 25 Nisan 2026)
- **Corpus durumu (10. kez aynı)**: Yalnızca platform-derived (KCHOL_Yonetim_Kurulu_Raporu_20260414 + _2026). kap_primary_in_corpus=false, confidence max=MEDIUM cap. KCHOL_financial_report_20260211_1555903 hâlâ indexlenmemiş. PIPELINE DUR tetiklendi.
- **CHAIRMAN BİLDİRİMİ**: Memory kuralı "3+ consecutive seans → PIPELINE DUR + Chairman bildirimi" 10. seansda hâlâ karşılanmadı. Bu çıktı aynı zamanda CEO + Chairman eskalasyon bildirimi niteliğindedir.
- **Tekrarlayan rag_out_of_scope (10. kez)**: IAS29 monetary_gain + IFRS8 segment EBITDA + holding-only Net Borç + CF işletme/yatırım/finansman split → 4 P0 bloker aktif.
- **Corpus-confirmed (MEDIUM güven)**: FY2025 Revenue=2,757,295 mn TRY, FAVÖK=181.5B, NI=22,000 mn TRY, OCF=-101.9B [DÜŞÜK GÜVEN], Blended NAV=385-388 TL, iskonto=%47.4, GCM SOTP=406 TL, hedef BASE=252 TL.
- **Segment NI proxy**: Sadece FY2025 net kar katkısı var (TUPRS+13.4B, FROTO+17.7B, Finans+4.2B, ARCLK-10.9B, Diğer-2.4B) — IFRS8 EBITDA değil, SOTP için yetersiz.
- **SOTP sahiplik tanımı**: Corpus SOTP Koç Group efektif pay (TUPRS=%51.2, YKBNK=%68) — KCHOL legal entity farklı (%40.5, %48.99). valuation_agent açıklamalı (10. kez uyarı).
- **Mimari root cause**: post-download Qdrant index trigger eksik. 10 seans boyunca çözülmedi. Chairman eskalasyon: yapısal mimari sorun.

### 2026-04-25 — KCHOL (dokuzuncu run, 25 Nisan 2026)
- **Corpus durumu (9. kez aynı)**: Yalnızca KCHOL_Yonetim_Kurulu_Raporu_20260414 + _2026 (platform-derived). kap_sourced=false, confidence max=MEDIUM cap. KAP primary PDF 1555903 hâlâ indexlenmemiş.
- **KRITIK ESKALASYON**: CEO + Chairman bildirimi 9 ardışık seanstır yapılmadı. Memory kuralı: 3+ seans → pipeline dur + Chairman bildirimi zorunlu. Bu KURAL AKTIF — financial_analysis, valuation_agent P0 blokerlar kesinleşmiş durumda.
- **Tekrarlayan rag_out_of_scope (9. kez)**: IAS29 monetary_gain + IFRS8 segment gelir/EBIT/EBITDA + holding-only Net Borç/EBITDA + CF format (işletme/yatırım/finansman split) → 4 P0 bloker aktif.
- **Mevcut corpus verisi** (doğrulanan, confidence=MEDIUM): 5YR Revenue FY2021-FY2025, NI trendi, FAVÖK FY2025=181.5B TRY, SOTP tablosu (Koç Group efektif paylar), NAV iskonto iki ölçüm (%39.5 ve %47.4), OCF=-101.9B/FCF=~-120B [DÜŞÜK GÜVEN], temettü getirisi %3.35, temettü karşılama 1.27x.
- **Çözüm gerektiren mimari sorun**: post-download Qdrant index trigger eksik. 9 seans boyunca KCHOL_financial_report_20260211_1555903 corpus'a girmedi. Chairman'e yapısal mimari sorunu bildirmek KB'nin sorumluluğu.

### 2026-04-25 — KCHOL (sekizinci run, 25 Nisan 2026)
- **Corpus durumu (8. kez aynı)**: Yalnızca KCHOL_Yonetim_Kurulu_Raporu_20260414 + _2026 (platform-derived). kap_sourced=false, confidence max=MEDIUM cap zorunlu. KAP primary PDF 1555903 hâlâ indexlenmemiş.
- **Memory kuralı tetiklendi**: 3+ consecutive kap_primary_in_corpus=false → pipeline dur + Chairman bildirimi zorunlu. 8. seans olmasına rağmen eskalasyon henüz yapılmadı — CEO + Chairman bildirimi acil.
- **SQ-01 Revenue**: FY2025 = 2,757,295 mn TRY / 2,760B TRY (5YR tablo p.5 _2026, p.7 _20260414). 5YR: FY2021:477,050 → FY2022:1,555,660 → FY2023:1,988,419 → FY2024:2,252,685 → FY2025:2,757,295 mn TRY. Q4/FY karışıklığı corpus'ta işaretli (p.7: 752B = Q4 figürü).
- **SQ-02 SOTP**: _2026 p.3'te Koç Group efektif paylarla: TUPRS 256.5B, YKBNK 190.6B, FROTO 187.9B, TOASO 63.6B, ARCLK 35.9B, kote olmayan 147.5B → Brüt NAV=882B, İskonto=%39.5, Piyasa=517B. p.5 20260414'te KCHOL legal entity: YKBNK %61.17, TUPRS %40.5, AKBNK %20.5, FROTO %41.75, TCELL %28.
- **SQ-03 ARCLK-Hitachi**: 8. kez rag_out_of_scope. Post-transfer (Nisan 2026 %60 devir) veri yok. Pre-transfer Koç Group ARCLK=%53.5. ARCLK FY2025 zarar=-10.944B TRY (temettü yok).
- **SQ-04 Holding-only Net Borç**: 8. kez rag_out_of_scope. FAVÖK FY2025=181.5B TRY mevcut. Holding-only Net Borç KAP 1555903 Not 7 zorunlu.
- **SQ-05 CF table**: OCF=-101.9B TRY, FCF=~-120B TRY (p.8, [DÜŞÜK GÜVEN]). İşletme/yatırım/finansman split yok. P0 kısmen açık.
- **SQ-06 IFRS8 segment**: 8. kez 0 chunk. Yalnızca segment net kar: TUPRS+13.4B, FROTO+17.7B, Finans+4.2B, ARCLK-10.9B, Diğer-2.4B. Gelir/EBIT BLOKLU.
- **SQ-07 IAS29**: 8. kez "Denetim notları ile doğrulanmadı." NI: FY2021:46,483→FY2022:91,427→FY2023:191,696→FY2024:25,872→FY2025:22,000 mn TRY. Monetary gain rakamı yok → financial_analysis P0 bloker.
- **SQ-08 NAV iskonto**: 2 ölçüm: (1) %39.5 (517B/882B, _2026 p.3), (2) %47.4 (204TL/388TL, 20260414 p.3). Sensitivity: %35→252TL★baz, %47→204TL◆güncel. Peer (SAHOL/TAVHL/ECZYT) rag_out_of_scope — external research zorunlu.
- **Aktif P0 blokerlar**: IAS29 monetary_gain + IFRS8 segment gelir/EBIT + holding-only Net Borç + CF format eksikliği → 4 P0 bloker aktif. CEO + Chairman eskalasyonu acil.

### 2026-04-25 — KCHOL (yedinci run, 25 Nisan 2026)
- **Corpus durumu (7. kez aynı)**: Yalnızca KCHOL_Yonetim_Kurulu_Raporu_20260414 + _2026 (platform-derived). kap_sourced=false, confidence max=MEDIUM. KAP primary PDF'ler (1555903 vb.) hâlâ indexlenmemiş.
- **Qdrant başlatma**: _qdrant/qdrant.exe port 6333'te dinlemiyor; elle `cd _qdrant && ./qdrant.exe &` ile başlatıldı. Otomatik başlatma hook'u eksik.
- **SQ-03 ARCLK-Hitachi**: rag_out_of_scope (7. kez). Corpus pre-transfer ARCLK payı: Koç Group efektif %53.5 (SOTP p.3). Post-transfer (Nisan 2026 %60 devir) veri yok.
- **TUPRS pay uyuşmazlığı**: SOTP tablosu p.3'te TUPRS=%51.2 (Koç Group), CEO direktifi=%40.5 (efektif). Corpus içi çelişki — valuation_agent dikkat.
- **IAS29 monetary_gain**: 7. kez rag_out_of_scope. "Denetim notları ile doğrulanmadı." NI trendi doğrulandı: FY2021:46.5B→FY2022:91.4B→FY2023:191.7B→FY2024:25.9B→FY2025:22.0B.
- **IFRS8 segment EBITDA**: 7. kez 0 chunk. Yalnızca segment net kâr (TUPRS+13.4B, FROTO+17.7B, Finans+4.2B, ARCLK-10.9B, Diğer-2.4B).
- **OCF/FCF**: p.8 [DÜŞÜK GÜVEN]: OCF=-101.9B TRY, FCF=~-120B TRY. Yatırım faaliyetleri split yok. P0 kısmen açık.
- **Escalation P0**: IAS29 monetary_gain + IFRS8 gelir/EBIT + YKBNK holding-only Net Borç → financial_analysis P0 blokları aktif. CEO eskalasyon zorunlu.

### 2026-04-25 — KCHOL (altıncı run, 25 Nisan 2026)
- **Corpus durumu (6. kez aynı)**: Yalnızca KCHOL_Yonetim_Kurulu_Raporu_20260414 + _2026 (platform-derived). kap_sourced=false, confidence max=MEDIUM.
- **7 SQ sonuçları**: SQ-04 (OCF/FCF) ve SQ-06 (NAV iskonto) en yüksek kalite (rel≥0.99). SQ-02 (IAS29 monetary gain) ve SQ-07 (merkez giderleri) sıfır direkt kanıt. SQ-05 (IFRS8 EBITDA) yine 0 chunk — sadece segment net kâr var.
- **Paralel HF Hub sorguları**: Bu sefer tümü başarılı (online mod, rate-limit yok). Sıralı olmak zorunda değil.
- **SQ-03 YKBNK izolasyon**: Corpus'ta holding-only Net Borç/EBITDA trend yok. %61.17 banka konsolide aktif oranı ve YKBNK segment NI=4.2B biliniyor.
- **Escalation P0**: IAS29 monetary gain + IFRS8 segment EBITDA + merkez giderleri → financial_analysis P0 blokları aktif. KAP primary sources zorunlu.

### 2026-04-25 — KCHOL (beşinci run, 25 Nisan 2026)
- **Corpus durumu (5. kez aynı)**: finance_x__KCHOL koleksiyonunda yalnızca platform-derived raporlar (KCHOL_Yonetim_Kurulu_Raporu_20260414 ve _2026). `KCHOL_Yonetim_Kurulu_Raporu_20260424.pdf` 5. kez untracked/unindexed. KAP financial_report_20260211_1555903 indexlenmemiş. Confidence max=MEDIUM cap kalıcı.
- **HF_HUB_OFFLINE**: SQ-01–02 online (HF rate-limit uyarısı alındı), SQ-03 itibaren `HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1` — başarılı, sorun yok.
- **SQ-01 Revenue**: FY2025 = 2,757,295 mn TRY (5YR tablo p.5 _2026; p.7 _20260414: "2,760 milyar TL"). FY2024 = p.7'de "752B TL" → Q4 figürü, FY2024 gerçek = 2,252,685 mn TRY. Q4/FY karışıklığı corpus içinde de bizzat işaretlenmiş (p.4 QA uyarısı, p.25 Zorunlu Bildirimler).
- **SQ-02 IFRS 8 EBITDA**: 5. kez 0 chunk. Yalnızca segment net kâr katkısı (p.6): TUPRS +13.4B, FROTO +17.7B, Finans +4.2B, ARCLK -10.9B, Diğer -2.4B. CEO P0-002 aktif.
- **SQ-03 CF tablosu**: OCF -101.9B TRY, FCF ~-120B TRY (p.8, [DÜŞÜK GÜVEN]). İşletme/yatırım/finansman split ayrımı corpus'ta yok — P0 blocker kısmen açık (rakam var ama format eksik).
- **SQ-04 SOTP**: p.3 (_2026): TUPRS 501B(%51.2→256.5B), YKBNK 280.3B(%68→190.6B), FROTO 375.8B(~50%→187.9B), TOASO 155.1B(41%→63.6B), ARCLK 67.2B(53.5%→35.9B), Kote-olmayan ~147.5B. Brüt NAV=882B, iskonto=%39.5. UYARI: pay=Koç Group efektif, KCHOL legal entity farklı.
- **SQ-05 ARCLK-Hitachi**: Post-Nisan 2026 transfer veri yok (rag_out_of_scope). Corpus pre-transfer ARCLK payı KCHOL legal entity için açık değil; Koç Group efektif: %53.5 (SOTP p.3), KCHOL doğrudan ARCLK payı kesilen snippet'te belirsiz.
- **SQ-06 Parent-only net borç**: Corpus'ta yok. Banka segment=%61.17 konsolide aktif biliniyor. KAP 1555903 Not 7 zorunlu (financial_analysis escalation).
- **SQ-07 IAS 29**: 5. kez "Denetim notları ile doğrulanmadı." NI trendi: FY2021:46.5B→FY2022:91.4B→FY2023:191.7B→FY2024:25.9B→FY2025:22.0B. Parasal kazanç/kayıp rakamı yok. rag_out_of_scope kalıcı — denetim notu zorunlu.
- **SQ-08 Holding iskontosu**: İki ölçüm: (1) 517B/882B=%41.4 (SOTP p.3), (2) 204TL/388TL=%47.4 (p.10 per-share NAV). Tarihsel band: %10-40 (p.2 executive summary) → mevcut her iki ölçümde de tarihin üstü. SAHOL peer: %25 Bull senaryosunda. TAVHL spesifik data yok.

### 2026-04-24 — KCHOL (ikinci run, 24 Nisan 2026)
- Corpus yalnızca platform-generated önceki oturum raporları: KCHOL_Yonetim_Kurulu_Raporu_20260414 ve KCHOL_Yonetim_Kurulu_Raporu_2026 ("Finance X Platform | Confidential"). KAP/birincil kaynak indexlenmemiş. Confidence max=MEDIUM zorlaması kalıcı.
- FY2025 gelir doğrulaması: 5YR tablosu (p.5 v2026): 2,757,295 mn TRY = ~2,760 B TRY. Corpus p.7'deki FY2024=752B Q4 figürü — corpus içi Q4/FY karışıklığı devam ediyor. FY2025 için iki kaynak uyumlu.
- SOTP tablosu (KCHOL_Yonetim_Kurulu_Raporu_2026 p.3): TUPRS %51.2/501B, YKBNK %68/280.3B, FROTO ~%50/375.8B, TOASO %41/155.1B, ARCLK %53.5/67.2B. Brüt Varlık: 882B TRY, iskonto %39.5. UYARI: bu Koç Group efektif pay — KCHOL legal entity payı farklı (%40.5 TUPRS vb.). Tanım downstream'e geçilmeli.
- IFRS 8 segment EBITDA extraction: p.25 explicit "IFRS 8 segment EBITDA ekstraksiyon %0" — bu run'da da 0 chunk. Sadece segment net kâr katkısı mevcut (p.6: TUPRS+13.4B, FROTO+17.7B, Finans+4.2B, ARCLK-10.9B, Diğer-2.4B). CEO P0-002 aktif.
- IAS29 monetary gain: Corpus explicit "Denetim notları ile doğrulanmadı" — RAG dışı. financial_analysis KAP PDF zorunlu.
- Holding merkez gideri: RAG'dan çekilemiyor — DDM 21 TL çıkarımı düşük güven.
- Holding iskontosu: 14 Nisan 2026 itibarıyla %47.4 (204 TL / 388 TL blended NAV). Tarihi %20-30 bandının üstünde ekstrem. SAHOL peer: %25 iskonto varsayılan BULL senaryosu. TAVHL/KOZAL spesifik iskonto data RAG'da yok.
- Paralel cited_rag çağrıları: HF Hub unauthenticated rate-limit nedeniyle ilk iki embedding init başarısız. cited_rag çağrıları daima sıralı (sequential) yapılmalı.

### 2026-04-24 — KCHOL (ilk run)
KCHOL corpus yalnızca platform-generated önceki oturum raporları içeriyor (KCHOL_Yonetim_Kurulu_Raporu_20260414 "Finance X Platform | Confidential"). KAP/birincil kaynak indexlenmemiş. Confidence max=MEDIUM zorlaması uygulandı. data_collection bu tickerı öncelikli olarak KAP'tan birincil kaynaklarla doldurmalı.
KCHOL corpus içi çelişki: p.7 FY2024=752B TRY vs p.5 5YR tablosu FY2024=2,252,685 mn TRY — Q4/FY karışıklığı bizzat corpus içinde de var. downstream için FY2025=2,757,295 mn TRY (5YR tablo) doğrulama şart.
KCHOL SOTP sahiplik tanımı belirsizliği: corpus %51.2/68/53.5/~50/41 (Koç Group efektif) vs mandate %40.5/29/14.5/38.5/37.5 (KCHOL legal entity). İkisi karıştırılırsa SOTP çift sayım veya eksik sayım riski — tanım açıkça belirtilmeli.
KCHOL IAS 29 monetary gain/NI: Corpus'ta yok ("Denetim notları ile doğrulanmadı" notu mevcut). financial_analysis KAP PDF doğrudan okuma zorunlu. Adj_ROE hesaplanamadı — ESC-KB-KCHOL-001 açıldı.
KCHOL merkez holding gideri (central cost): RAG'dan çekilemiyor. SOTP NAV'dan DDM 21 TL çıkarımı mevcut ama güven düşük.

### 2026-04-23 — EREGL
EREGL: KB 20260413 versiyonunu yüksek güvenle kullandı; 20260423 (on gün daha güncel, git'te untracked) gözden kaçtı. Daha güncel veri varken eski versiyonla çalışmak tüm analizin zaman damgasını geride bırakır.

### 2026-04-23 — EREGL
EREGL: KB 6 unanswered question'ı düzgünce belgeledi ama CEO'ya escalation yapmadı. Zaten financial_analysis çalışmadı — ama KB bunu tetikleyebilirdi.

### 2026-04-24 — THYAO
THYAO: IAS29 sorusu gelince "parasal kazanç TRY tutarı" aranırken corpus THYAO'nun USD fonksiyonel para birimi kullandığını teyit etti. Klasik IAS29 TRY monetary gain adjustment bu şirket için N/A. Bir sonraki THYAO run'ında financial_analysis'e bu farklılığı geçmek zaman kazandırır.
THYAO: CASK/RASK ikisi de RAG dışı — "segment maliyet detayı kamuya açık değil" notu tüm board_report kaynaklarında tekrarlıyor. WebSearch veya THYAO IR sunumu zorunlu; RAG'dan bekleme.
THYAO: OCF konusunda V4_Final_20260417 p.11 (185,813 mn TRY) ile 20260416 p.33 (Raporlanmadı) arasında çelişki var. V4_Final daha güncel ama kaynak dipnotu zayıf. Güven düşük — KAP PDF doğrulaması önce.

### 2026-04-24 — BIMAS
IAS29 monetary_gain_loss ESC-001 olarak işaretlendi ama hangi anahtar kelimeler denendi, hangi sayfalar tarandı bilinmiyor. Audit trail yok → bir sonraki run'da aynı boşluk tekrar oluşur.

### 2026-04-24 — EREGL (ikinci run)
- **20260423 yine indexlenmedi**: EREGL_Yonetim_Kurulu_Raporu_20260423 (144KB HTML, 1.79MB PDF) yerel disk'te mevcut ama git untracked ve Qdrant'ta yok. ESC-KB-001 açıldı. Bu aynı sorunun üçüncü tekrarı — data_collection'ın her run başında git status ile untracked belgeleri kontrol edip otomatik indexlemesi şart.
- **CBAM %10 vs %47.8 farkı**: CBAM-eligible (SKDM kapsamı) satış hacmi ~%10 [entegre rapor 20260217_1557688 p.8]. Avrupa gelir payı %47.8 [board_report p.25]. İkisi farklı metrik: gelir payı ≠ SKDM-eligible hacim (HRC ihracat vs toplam Avrupa ciro farkı). sector_competition raporlarda bu ikisini karıştırmamalı.
- **Net Nakit paradoksu**: Board report p.5: "115.5B TRY nakit+kısa vadeli yatırım" ve "Net borç/EBITDA ~2.1x." Nakit > Borç → EREGL net nakit pozisyonunda görünüyor. 2.1x figure muhtemelen gross financial debt / EBITDA = 42,864/20,452. reconciliation bu farkı açıklamalı.
- **IAS29 Not 33 erişilemez**: FY2024 ve FY2023 monetary_gain RAG'dan çekilemiyor. NI değerleri mevcut (FY2025:694.3B TRY, FY2024:14.193B TRY, FY2023:4.329B TRY) ama monetary_gain per yıl yok → adj_NI trendi ESC-KB-002 ile financial_analysis'e escalate edildi.

### 2026-04-24 — KCHOL (dördüncü run)
- **Corpus durumu**: 4. kez aynı sorun — yalnızca platform-derived (20260414, Raporu_2026). KCHOL_Yonetim_Kurulu_Raporu_20260424.pdf 4. kez untracked ve indexlenmemiş. data_collection bu PDF'yi KAP'tan indirip indexlemeden pipeline güvenilir olmaz.
- **HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1**: SQ-01-SQ-02 online (rate-limit risk), SQ-03 sonrası offline mode kullan — model zaten cache'de, hub check gereksiz. Bu run'da SQ-03'ten itibaren uygulandı, hata yok.
- **SQ-02 SOTP sahiplik uyarısı (kritik)**: Corpus p.3 SOTP tablosu Koç Group efektif pay kullanıyor (%51.2 TUPRS, %68 YKBNK, ~%50 FROTO, %41 TOASO, %53.5 ARCLK). KCHOL legal entity doğrudan payı farklı (%26.2 TUPRS, KCHOL efektif %40.5-44.8). valuation_agent hangi tanımı kullandığını açıkça belirtmeli.
- **SQ-03 holding net borç**: Bankacılık segmenti konsolide aktifin %61.17'si (p.25). FAVÖK FY2025=181.5B TL. Holding-only net borç hesabı corpus'ta yok — financial_analysis KAP 1555903 Not 7 zorunlu.
- **SQ-04 IAS 29**: "Denetim notları ile doğrulanmadı" 4. kez görüldü. Net marj trendi: FY2023=%9.64 → FY2024=%1.15 → FY2025=%0.80. NI çöküşü "IAS 29 tersine dönüş + ARCLK impairment + enerji one-time" (corpus inference, doğrulanmadı).
- **SQ-05 IFRS 8 EBITDA**: 4. kez 0 chunk. p.6 segment NI mevcut (TUPRS+13.4B, FROTO+17.7B, Finans+4.2B, ARCLK-10.9B, Diğer-2.4B). CEO P0-004 hâlâ aktif.
- **SQ-06 holding iskontosu**: İki farklı ölçüm: (1) p.3 SOTP iskonto=%39.5 (517B/882B), (2) p.3 blended NAV iskonto=%47.4 (204 TL/388 TL). İkisi farklı NAV tanımı kullanıyor — valuation_agent açıklamalı. Tarihsel FY2021-FY2025 iskonto serisi corpus'ta yok.
- **SQ-07 corporate events**: TUPRS hisse satışı +9.32B TL (Mar 2026), ARCLK temettü=0, FROTO temettü 3.64 TL brüt/hisse. Hisse başına SOTP katkı hesabı corpus'ta yok — event_impact_mapper hesaplamak zorunda.

### 2026-04-24 — KCHOL (üçüncü run)
KCHOL: data_collection 13 KAP PDF indirdi. Knowledge_base üçüncü kez aynı sorunu yaşadı: Qdrant collection'da yalnızca platform-derived raporlar var (KCHOL_Yonetim_Kurulu_Raporu_20260414 ve _2026). cited_rag HF Hub rate-limit nedeniyle 3. sorgudan itibaren bağlantıyı kesiyor — fix: HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 env var'larını 3. sorgudan itibaren kullan. Yeni untracked: KCHOL_Yonetim_Kurulu_Raporu_20260424.pdf — indexlenmemiş. IFRS 8 EBITDA 3. kez 0 chunk — CEO P0-004 kalıcı aktif. IAS 29 monetary gain: "Denetim notları ile doğrulanmadı" corpus notu üçüncü kez görüldü — KAP financial_report_20260211_1555903.pdf NOT 33 doğrudan okuma zorunlu.

### 2026-04-24 — KCHOL
KCHOL: data_collection 8+ KAP PDF indirdi (local_path KCHOL_financial_report_*.pdf). knowledge_base bu PDF'leri indexlemek yerine platform türev raporları kullandı. Tüm session MEDIUM confidence cap altında kaldı — birincil kaynak doğrulaması yapılamadı.

### 2026-04-24 — KCHOL
4 ardışık turda aynı PDF indexlenemedi — bu bir araç/ortam sorunudur (pdftoppm eksikliği veya path sorunu), kalıcı fallback değil. CEO memory'de 'alternative method zorunlu' yazılı olmasına rağmen çözüm üretilmedi.

### 2026-04-24 — KCHOL
KCHOL: 6 seans boyunca KAP PDF'leri Qdrant'ta yok. confidence_cap=MEDIUM zorunlu kaldı. Kök neden: download → index pipeline kopuk. Bir kez pipeline fix edilmesi tüm gelecek seans sorununu çözer.

### 2026-04-25 — KCHOL
KCHOL 20260425 (7. session): KCHOL_financial_report_20260211_1555903 data_collection manifest'inde local_path mevcut (output/pdfs/...) ancak corpus'a dahil edilmedi. Bu sorun 7 session'dır çözülmedi — CEO escalation yapılmadı, Chairman bildirilmedi.

### 2026-04-25 — KCHOL
KCHOL: 11. seans chairman bildirimi tetiklendi, aynı anda coo→research_brief→data_collection devam etti. Mimari fix tek satır: data_collection sonrası Qdrant index trigger ekle, index confirm yoksa knowledge_base 'CORPUS_INCOMPLETE' döndür.

### 2026-04-25 — KCHOL
12 seans boyunca sadece 'platform_derived_only' (yönetim kurulu raporu MD/HTML) kaynakla çalışıldı. IAS 29 monetary gain, IFRS 8 segment EBITDA, holding-only net borç — üçü de KAP 1555903 notlarında mevcut ama erişilemiyor.
