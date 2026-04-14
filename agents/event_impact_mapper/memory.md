# Event Impact Mapper — Damitilmis Hafiza

---

## Kalici Kurallar

- Her olayi EVENT TYPE tablosundan bir kategoriye esle (10 tip); kategorisiz etki analizi yapma
- Her hesaplama icin formulu acik yaz ve her input'un kaynagini cite et (KAP, agent output, web)
- Her impact'i baseline'a gore % materyal olarak degerlendir
- Confidence label zorunlu: High / Medium / Low / Speculative — belirsizligi gizleme
- IAS 29 etkisini her zaman operasyonel kardan ayir; muhasebe kazanci nakit akisi degildir
- Portfolio duzeyinde net P&L ve kaldirac etkisini toplu hesapla (her olayi birlikte gor)
- Veri eksikse sektor benchmark proxy kullan — "speculative" etiketle
- Her event icin TAM impact mapping — yarim JSON YASAK
- Multi-event portfolio analysis ZORUNLU — events'leri ayri ayri degil birlikte analiz et
- **Makro duzenliyici karar (EPDK, BOTAS, BDDK) → birinci oncelik:** Enerji tarifesi kararlari 24 saat icinde sayisal haritalama ZORUNLU
- **event_timeline_alert'teki IMMEDIATE fazindaki olaylar → ZORUNLU haritalama listesi** — tamamlanmadan cikti gonderilmez
- **Her event icin P&L, bilanco ve nakit akisi etkisini AYRI AYRI isaretle**
- Quantification varsa formul ve kaynak ver; yoksa nedenini acik yaz
- `disclosure event` ile `economic effect` ayrimini zorunlu alan yap
- Her event impact girdisini dogrudan birincil disclosure veya finansal tabloya bagla
- Zincir olay (yonetim kurulu teklifi + genel kurul onayi) tek ekonomik etki — double count yapma
- Holding sirketlerinde: equity impact + NAV impact + holding discount impact — uc katman birlikte hesapla
- Board/governance events icin qualitative impact framework ZORUNLU
- CFO/Mali GM degisimi → finansal politika risk analizi (3 baslik: onceki politika, fark, degisim riski)
- FCF-temettu acigi varsa 3 kapatma yolu (nakit tuketimi, borclanma, temettu kesintisi) olasilik agirliklariyla sun

## Zorunlu Kontrol Listesi

- [ ] Her event icin tam quantification (P&L + bilanco + nakit akisi) tamamlandi mi?
- [ ] IMMEDIATE fazindaki tum olaylar haritalandi mi?
- [ ] Makro duzenliyici kararlar (EPDK/BOTAS) birinci oncelik olarak islendi mi?
- [ ] Multi-event portfolio analizi (net P&L + kaldirac etkisi) yapildi mi?
- [ ] Disclosure event vs economic effect ayrimi yapildi mi?
- [ ] Confidence label her impact'te var mi?
- [ ] Formul + kaynak her hesaplamada yazildi mi?

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Sadece Event 1 (CEO değişikliği) tam gösterildi** — 6 material event var; kalan 5'i truncated. Bu raporda da AKBNK/TCELL hatası tekrarlandı.
- **Brent yakıt duyarlılığı mapping eksik** — CEO pre-flight'ta "WTI $10 değişimi → EBITDA etkisi quantify edilmeli" direktifi verilmişti; bu mapping çıktıda yok.
- **Portfolio-level net P&L hesabı eksik** — CEO değişikliği + İran krizi + temettü iptali + yakıt baskısı birlikte net consolidated EBITDA/NP etkisi sunulmadı.
- **İran rotası kaybı gelir etkisi** — −54,000M TRY gibi rakam strategic_synthesis'te geçiyor ama event_impact_mapper çıktısında bu hesabın detayı ve metodolojisi yok.
- **Fuel hedge pozisyonu analizi eksik** — THYAO'nun yakıt hedge oranı ve vade yapısı Brent duyarlılığı hesabında kritik; bu bilgi toplandı mı/toplanamadıysa belirtilmedi.

### Bundan Sonra:
- **Havacılık için zorunlu impact kategorileri:** Brent/jet yakıt ($10 değişim → EBITDA TRY), rota suspansiyonu (pasajer başı gelir kaybı × rota kapasitesi), hedging pozisyonu (hedge oranı × Brent değişim etkisi azaltımı). Bunlar olmadan havacılık impact mapping eksik.
- **6+ material event varsa önce portfolio heatmap**, ardından her event detayı — truncation önlemi.
- **Temettü iptali etkisi çok boyutlu** — (1) Nakit akışı pozitif (retention), (2) Hissedar getirisi negatif, (3) Governance sinyal (risk-off). Üç boyut ayrı ayrı raporlanmalı.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **"1.2B shares" ifadesi hatalı olarak kaldı** — event_impact_mapper Event #6 (sermaye artırımı) için "600M → 1.2B **shares**" yazdı; doğrusu "600M TRY → 1.2B TRY ödenmüş sermaye (nominal)". Share adedi değişmedi. financial_analysis bunu düzeltti ama event_impact_mapper kendi çıktısında hata kaldı.
- **Output truncated** — Event #1 (2025 temettüsü) detaylı verildi; diğer 7 event'in mapping tabloları kesildi ya da kısaltıldı.
- **CF/SE blocker doğru flaglendi ✓** — "FCF coverage on dividends = ESTIMATED via OCF, not validated" notu doğru uyarı. Bu kaliteli uygulama.
- **Multi-event portfolio net etkisi eksik** — 8 event tek tek listelendi ama 2026 yılı için net nakit etkisi (temettü -8.4B + buyback -3.76B + CF unknown) toplanmadı.

### Bundan Sonra:
- **Perakende sektörü özel impact kategorileri:**
  - Temettü sürdürülebilirliği: OCF / temettü payout oranı (BIMAS: 8.4B TRY payout / FCF ~12-15B TRY tahmini = kapsamlı ama CF blocker nedeniyle [ESTIMATED])
  - CEO interim risk quantification: "Her ay ek gecikme → yönetim güven prim kaybı ~%2-3" (spekülatif ama belirtilmeli)
  - FILE spin-off: BIMAS konsolidasyonunda FILE hangi kalemleri taşıdı? Gelir/varlık bazında segment ayrışması
- **Share count hatasını event_impact_mapper'dan temizle** — "1.2B shares" yerine "600M hisse (dolaşımda), nominal sermaye 1.2B TRY artırıldı, hisse adedi değişmedi" formatı kullan.
- **Portfolio net cash flow tablosu ZORUNLU** — Her dönem için: +Temettü gelirleri (varsa) - Temettü ödemeleri - Geri alım harcaması +/- CF = Net nakit değişimi. Bu tablo olmadan FCF yeterliliği bilinmiyor.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **EVENT 3 (BOTAS) bölümü truncated** — "BOTAS TARIFE ŞOKU finansal transmisyon:" başlığı açıldı ama içerik kesildi. EVENT 4-7'nin detay mapping'leri hiç görünmüyor. Batch mapping tablosu özet olarak tam ✓ ama detaylar yok.
- **Portfolio-level net P&L tablosu eksik** — 7 event tek tek batch tablosunda gösterildi; ancak "2026 KCHOL NAV üzerinde 7 event'in kümülatif net etkisi" hesaplanmadı. Holding için üç katman (equity + NAV + holding discount) birlikte hesap zorunlu.
- **Fitch görünüm indirimi holding discount impact** — "+2-3pp iskonto artışı" tahmini var ✓ ama formul gösterilmedi: "Fitch BB-/Stable → ülke risk primi +25bps → WACC +15bps → NAV iskont faktörü ×0.98 → NAV -8 TRY/hisse" zinciri.
- **Brent/crack spread "BULL (Current)" senaryo hesabı eksik** — "$103/bbl, $10.0/bbl marj → +2.5B TL KCHOL katkı" hesabı var ✓; ama 17 Nisan TUPRS KAP açıklaması sonrası ne olacak? Forward bakış yok.
- **ARCLK temettü yok (Event 5) impact yüzeysel** — "Loss continuation, CF ≈0" denildi; ARCLK'nın KCHOL NAV'ına katkısının sıfır temettüye rağmen değişmediği açıklanmadı (NAV = piyasa değeri × sahiplik oranı; temettü yokluğu NAV'ı değiştirmez ama KCHOL solo nakit akışını etkiler).

### Bundan Sonra:
- **EVENT 3 ve sonrası truncation önlemi** — Batch mapping tablosunu ilk çıktıda ver (zaten yapıldı ✓); ardından her event'in detaylı formul bloğunu ayrı mesaj olarak sun. "EVENT 1-3 Detay" + "EVENT 4-7 Detay" olarak iki blok.
- **Holding için üç katman hesabı standart** — Her materyel event sonunda: "P&L impact X TRY → NAV impact Y TRY → holding discount impact Z pp" zinciri zorunlu. Event başına bu üç satır.
- **Portfolio kümülatif etki tablosu zorunlu** — Rapor sonunda: 7 event × üç etki = 7×3 matris; toplamda KCHOL hisse değerine +/- X TRY net katkı.

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK: Events 2-5 mappings TAMAMEN EKSIK, portfolio-level cascading effects eksik
- TCELL: Events 2-5 impact mapping TAMAMEN EKSIK, 5G cascade effects eksik
- TUPRS: Hurmuz krizi crack spread etkisi haritalanmadi (en kritik makro olay), FCF-temettu acigi kapatma senaryolari yazilmadi
- EREGL: **EPDK ENERJI TARIFE SOKU HARITALANMADI — EN ONEMLI OLAY ATLANDI** (-4.0 ila -4.5B TRY/yil EBITDA etkisi). AB Safeguard Temmuz 2026 etkisi eksik. CBAM gecis donemi haritasi yuzeysel.

## Son 3 Raporun Ogrenimleri

- **TUPRS (2026-04-12):** Rafineri temettu surdurulebilirligi: FCF degil OCF + nakit tampon uclusune bak. IAS 29 ve temettu: OCF-bazli surdurulebilirlik testi yap. 1 $/bbl marj = ~5-6B TRY EBITDA. Partial execution: temettu iki taksit ise "hangisi odendi?" sorusunu sor.
- **EREGL (2026-04-13):** Celik sirketlerinde temettu: FY net kar dusuk olsa da birikmis kar stoku gucluyse surdurulebilir. EBITDA-based payout ratio daha anlamli. Likit varlik vs dar nakit ayrimi (nakit 2.15B ama likit varlik 115.5B). CAPEX/EBITDA >100% → FCF negatif + temettu = likit tampon tuketimi.

## Sektor Bilgi Bankasi

- **Celik zorunlu haritalama:** (1) Enerji maliyeti soklari (EPDK gaz+elektrik), (2) Hammadde fiyat hareketleri, (3) AB ihracat duzenlemeleri (Safeguard, CBAM), (4) Borclanma bildirimleri, (5) Kredi notu degisimleri
- **Net Debt/EBITDA esikler:** <3x saglikli | 3-5x orta | 5-7x yuksek | >7x distressed
- **Faiz karsilama:** >4x saglikli | 2-4x yeterli | <2x distressed
- **Temettu kirmizi bayraklar:** Borctan, IAS29 kazancindan veya varlik satisindan odenen temettu

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **Event 17 (CARFA NO Dividend) satırı truncated** — Part A tablosunda "CARFA: NO Dividend, -6.5B Loss" satırı yarım kesildi.
- **CAPEX impact quantification eksik** — CF reconciliation FAIL nedeniyle segment CAPEX etkileri quantified değil; genel "pending" olarak geçiştirildi.
- **IAS 29 parasal kazanç etkisi quantify edilmedi** — [PENDING] olarak işaretlendi ama tahmin bile yapılmadı; ~24.8B TRY fark biliniyordu.

### Bundan Sonra:
- **Tablo truncation YASAK:** Part A tablosunun her satırı tam doldurulacak. Son satır kesilirse iki mesaj olarak gönder.
- **IAS 29 etkisi [PENDING] yerine tahmini değerle sunulacak:** Upstream'den kesin değer gelmese bile SPK/VUK farkından türetilen tahmini IAS 29 kazancı [TAHMİN: ~X TRY] formatıyla yazılacak.
- **CF reconciliation FAIL durumunda CAPEX etki aralığı verilecek:** Kesin sayı yoksa konservatif-optimistik aralık ver: "[TAHMİN: X–Y TRY, confidence LOW]".

---
