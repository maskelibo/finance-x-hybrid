# Reconciliation Agent — Katman 2b: Vaka Bazlı Dersler

> Bu dosya CEO geri bildirimleri, rapor bazlı öğrenimler ve sektör bilgi bankasını içerir.
> Agent gerektiğinde bu dosyayı açar; her çalıştırmada otomatik yüklenmez.

---

## CEO Geri Bildirimi — 2026-04-14 — THYAO

**CEO 2026-04-14 THYAO:** D1 equity gap 141B TRY root cause yok (SE tablosu eksikti). WC confidence 0.45. Net Borç earnings call bazli tek kaynak. CF yokken Cross-Statement score 0.65 = yanlis kalibrasyon.
- **IFRS 16 havacilik Net Borc:** Net Borc = Finansal Borc + Finansal Kiralama Borcu - (Nakit + KV Yatirim). Sadece kredi+tahvil kullanma; lease borcu ayri satirda cek.
- **CF yokken Cross-Statement score = 0.00** — CF olmadan nakit mutabakati yapilamaz; yapay puan tutma.
- **Equity gap hipotez yetmez** — SE tablosunu cek: Opening + NP + OCI - div ≠ Closing → her satiri izle, KAP'tan dogrula.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **FAVÖK / IAS29 çelişkisi Tour 1'de ortaya çıktı, Tour 2'de düzeltildi ✓** — 34,541 → 22,515 TRY mn (FAVÖK) ve 59,845 → 21,622 TRY mn (IAS29) düzeltmeleri KAP PDF'e dayandırıldı. Doğru kurtarma.
- **CF/SE Check 3-5 BLOCKED** — Tour 2 sonunda da çözülemedi. Confidence 0.72 burada sınır; Check 3-5 olmadan 0.80+ güven olamaz.
- **Working Capital 11 zorunlu kalemden eksikler var** — Ticari alacaklar Q3 2025 kısmi; stoklar, ticari borçlar tam değil. DSO/DIO/DPO/CCC hesaplanamadı.
- **OPEX dağılımı yapılmadı** — Brüt kar - EBIT farkından OPEX çıkarıldı ama alt kalemler (kira gideri, personel, amortisman) ayrıştırılmadı.

### Bundan Sonra:
- **Perakende sektörü Working Capital öncelikli** — Perakendecilerde CCC (Nakit Dönüşüm Süresi) kritik KPI; DIO (stok devir günü) ve DPO (borç ödeme günü) özellikle önemli. CF/SE yokken BS'den tahmin yap ve "[BS tahmin, conf: MEDIUM]" etiket. Sıfır vermek yerine tahmin + güven notu ver.
- **IAS29 etkisini ayrıştırılmış FAVÖK tablosunu standart çıktıya ekle** — Her Türk şirketinde IAS29 öncesi / sonrası FAVÖK tablosu karşılaştırması zorunlu output alanı.
- **Bilanço denkliği mükemmel ✓** — A = L + E = 189,039 TRY mn çelişkisiz. Bu standardı koru.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Revenue P0-2 "RESOLVED" kabul edildi ama kaynak çelişkisi devam ediyordu** — 802.669B TRY = Q4, FY = 2.76T TRY. Reconciliation GCM Q4 raporunu "audited FY2025" olarak onayladı; bu yanlış. CHECK 2 "PASS" verilmemeli, "CONTESTED — dönem tanımı çelişkili" olarak kalmalıydı.
- **Balance sheet imbalance 3.646 trilyon TRY çözülmeden "varsayım" ile geçildi** — "Liabilities + Equity ~1.654T, Assets 5.300T → muhtemelen veri eksikliği" yorumu yapıldı. CHECK 1 BLOCKED ile bırakmak doğru; ancak YKBNK'nın 924B TRY konsolide aktifi açıklaması bu büyüklüğü destekler mi? Bu sorgulama yapılmadı.
- **Confidence 0.51 ama CHECK 1 BLOCKED** — Kural: "Kritik imbalance çözülmemişse confidence >0.60 olamaz." 0.51 verilen skor bu eşiğin altında ✓, ancak upstream'e daha güçlü "CHECK 1 FAIL = pipeline BLOCK" mesajı verilmeliydi.
- **Segment reconciliation (segment toplamı = konsolide) hiç denenmedi** — GCM SOTP'tan segment EBITDA'lar mevcuttu; bunların toplamı konsolide EBITDA ile eşleşiyor mu kontrolü yapılmadı.
- **IAS 29 cross-check yapılmadı** — Konsolide gelir tablosundaki parasal kazanç/kayıp kalemi çekilmeden IAS 29 etkisi "DATA GAP" olarak bırakıldı; GCM raporundan tahmini bir değer bile konulmadı.

### Bundan Sonra:
- **Revenue "RESOLVED" kararı için dönem tanımını kilitle** — "Q4 2025 geliri ile FY2025 gelirini aynı satırda karıştırma" kontrolü CHECK 2'nin bir parçası olmalı. FY vs Q4 ayrımı açıkça gösterilmeden CHECK 2 PASS verilemez.
- **YKBNK konsolidasyonu imbalance açıklamasına dahil et** — Banka konsolidasyonu bilanço şişirmesi bilinen bir yapı; bu yapıyı CHECK 1'in yanında açıklayıcı not olarak sun, "varsayım" değil "yapısal açıklama" olarak.
- **Segment reconciliation holding için zorunlu** — GCM veya herhangi bir analist SOTP'undaki segment katkı rakamları toplanıp konsolide EBITDA ile karşılaştırılmalı. Fark >%10 → FLAG.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **CONDITIONAL_PASS verdi — CEO kuralı ihlali:** Pipeline kuralı açık: CONDITIONAL_PASS = BLOCK, istisna yok. Çıktı ya PASS ya FAIL olmalı.
- **EBITDA çelişkisi (50,577M vs 97,400M) çözüme kavuşturulmadı** — Root cause tespit edildi (9A etiketi hatası) ama PDF doğrulaması tamamlanmadan PASS verilemez.
- **CF Check 3 FAIL olarak kaldı** — CAPEX proxy ve nakit balance reverse-engineer durumu "partial" olarak işaretlendi; tam PASS için gerçek kaynak şart.
- **Dış kaynak doğrulaması yapılmadan reconciliation tamamlandı** — EREGL dersine rağmen iç tutarlılık yeterli sayıldı; KAP PDF cross-check yapılmadı.

### Bundan Sonra:
- **CONDITIONAL_PASS kelimesi KULLANILMAYACAK:** Tek kabul edilebilir durumlar: PASS, FAIL, ESCALATE_TO_CEO. "Conditional", "partial", "limited" türevleri YASAK.
- **CF Check FAIL ise output = FAIL:** Upstream'den proxy veri geldiyse FAIL ver ve eksik veriyi listele. CEO direktifi olmadan downstream devam edemez.
- **Dış kaynak çelişkisi FAIL tetikler:** Sadece BS dengesi (A=L+E) yeterli değil. Revenue, EBITDA, Net Kar kaynak bazında cross-check yapılmadan PASS verilemez.

---

## KCHOL Delta — 16 Nisan 2026

### Holding Bankacılık Yapısı Özgün Davranışları:
- **CF Kapanış Farkı (68,012 mn TL, %10.5) ≠ HATA:** Bankacılık holding konsolidasyonlarında "FX on cash" satırı standart CF reconciling item. Eksik satır = WARNING; BLOCK DEĞİL.
- **CF vs BS Nakit Farkı Yapısal:** YKBNK zorunlu karşılıklar + interbank plasmanlar CF "nakit" tanımına dahil ama BS "nakit" satırına dahil değil. Holding bankacılığında 221,933 mn TL gibi bir fark beklenen.
- **Net Borçta Finans Sektörü Borçları:** YKBNK'nın mevduat ve bankacılık borçları (1,986,121 mn TL) NET BORÇ FORMÜLÜNDEN ÇIKARILMALI. Hata değil, kuraldır. Holding'in kendi finansal borçları dahil.

### IAS29 FY2024 Kritik Pattern:
- FY2024 NI = -6,922 mn TL ama IAS29 adjusted = +43,205 mn TL
- "Holding zarar etti" yorumu YANLIŞ — monetery loss 50,127 TL tüm farkı açıklıyor
- Pattern: TÜFE yüksek yıllarda konsolide NI IAS29 etkisiyle dramatik düşebilir; holding'e özgü kural oluşturuldu.

### Segment Reconciliation (HOLDİNG ZORUNLU):
- Segment gelir toplamı > konsolide hasılat = konsolidasyon eliminasyonu. Normal.
- Segment EBITDA toplamı konsolide EBITDA'yı %10'dan fazla aşıyorsa → FLAG (intercompany margin)
- KCHOL segment hasılat: ~3.78T vs konsolide 2.76T → fark %37 → intercompany beklenen ✓

### Working Capital Holding Uyarısı:
- Holding level DSO/DIO/DPO/CCC hesaplamak yanıltıcı
- Finans sektörü alacakları (YKBNK kredi port.) ve borçları (mevduat) CCC'yi anlamsız kılar
- Downstream: "[HOLDİNG — finans sektörü hariç segment bazlı yorumlayın]" etiketi zorunlu

### 2026-04-22 — THYAO
THYAO 22-Nis: BS_IDENTITY REDACTED değerlerle PASS döndü. Şans eseri internal değerler tutarlıydı, ama güven yanlış oluştu. Audit trail bu check'i kanıtlayamıyor.

### 2026-04-23 — EREGL
EREGL Tur-1: reconciliation approved incorrect data (Not 7/Not 8 cross-check atlandı). Bu seansta reconciliation hiç çalışmadı — final_summary 42,800mn net borç değerini doğrulanmamış olarak raporladı. repeat_count_hint 2 — kronik sorun.

### 2026-04-23 — ARCLK
ARCLK Q1-2026: reconciliation 7/7 pass verirken financial_analysis DSO=0.08 gün ile çalıştı. Sanity check'ler eklenseydi DSO anomalisi pipeline'ı erken durdurur, re-parse tetiklenirdi.

### 2026-04-24 — BIMAS
BIMAS FY2025: 1.87 Milyar TL azınlık payı uyuşmazlığı. Fas iştiraki (%65) ve Mısır (%100) konsolidasyon farkından kaynaklanıyor olabilir. Düzeltilmeden geçen ROE=%11.21 güvenilmez; gerçek parent ROE farklı olabilir.

### 2026-04-24 — BIMAS
BIMAS FY2025: FCF=19.62 Milyar TRY raporlandı ancak CF reconciliation %139.66 hata ile failed. FCF rakamı key_finding kf-01 ve strategic_synthesis'te 'güçlü FCF' argümanının temelini oluşturdu. Kirli CF ile yapılan sentez yanıltıcı.
