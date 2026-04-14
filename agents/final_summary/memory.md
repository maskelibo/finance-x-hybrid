# Final Summary Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **Final Summary = 3 KATMANLI YAPI:**
  1. Executive Summary (1 sayfa): Investment thesis, recommendation, target price, key catalysts — C-level icin
  2. Skor Karti (1 sayfa): 6 boyut + genel skor (1-10), peer comparison, strength/weakness matrix
  3. Detayli Sonuc (2-3 sayfa): Bull/Baz/Bear scenarios, hedef fiyat metodolojisi, risk/opportunity balance, forward timeline
- **12 bolumlu yapi TAM UYGULANMALI:** Kapak, Icindekiler, Yonetici Ozeti, Sirket Profili, Finansal Analiz, Degerleme, Sektor ve Rekabet, Makroekonomik Baglam, Risk Degerlendirmesi, Sonuc ve Oneriler, Ekler, Zorunlu Bildirimler
- **Skor karti ZORUNLU:** Karlilik, Likidite, Kaldirac, Nakit Akisi, Buyume, Yonetim Kalitesi — her biri 1-10, aciklama + benchmark
- **Hedef fiyat araligiBear/Baz/Bull ZORUNLU.** Agirlikli hesap gorulur olmali: (Bear x agirlik) + (Baz x agirlik) + (Bull x agirlik)
- **Valuation agent DEGRADED ise:** "Hedef fiyat: YETERLI VERI YOK — Q sonrasi revize edilecektir" notu acikca yer almali
- **Veri Kalite Uyarilari bolumu ZORUNLU:** QA P0/P1 sorunlari, cozum durumlari ve etkisiyle birlikte tek bolumde ozetlenmeli
- **En kritik bekleyen tarih summary'nin basinda** (ornek: "ONEMLI: 17 Nisan 2026...")
- **ESG → yatirim tavsiyesi baglantisi kurulmali**
- **Agent meta-text POST-PROCESSING filter ZORUNLU:** agent_id, output_id, session_id, timestamp, runtime_mode, confidence, status, emoji — hepsini SIL. JSON code blocks → tablo veya duz paragraf formatina cevir
- **Grafik tag'leri ekle:** [CHART:LINE], [CHART:PIE], [CHART:BAR] — report_formatter icin gerekli
- **Truncation cozumu:** Cok uzunsa Executive Summary + Detailed Appendix olarak ikiye bol
- **Yarim rapor YASAK** — baslanan her bolum bitirilmeli
- Hisse adedi tutarsizligi varsa CONTESTED etiketi + KAP temettü matematigi ile cross-check
- Belirsizligi saklamak degil siniflandirmak: dogrulanmis, tahmini, spekulatif, contestable

## Zorunlu Kontrol Listesi

- [ ] 12 bolumun hepsi dolu mu?
- [ ] Grafik tag'leri eklendi mi?
- [ ] Agent meta-text temizlendi mi?
- [ ] JSON formatlar duz metne cevrildi mi?
- [ ] Skor karti tam mi (6 boyut + genel skor)?
- [ ] Hedef fiyat araligiBear/Baz/Bull net mi?
- [ ] Agirlikli hedef fiyat hesabi gorunur mu?
- [ ] Veri kalite uyarilari bolumu var mi?
- [ ] ESG → yatirim baglantisi kuruldu mu?
- [ ] En kritik bekleyen tarih summary basinda mi?
- [ ] Zorunlu Bildirimler bolumu dahil mi?

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Grafik tag'leri ([CHART:LINE], [CHART:BAR], [CHART:PIE]) yok** — 12 bölümün içeriği var ama report_formatter için zorunlu grafik tag'leri eklenmedi. Gelir trendi (LINE), segment dağılımı (PIE), peer benchmarking (BAR), senaryo kutuları görsel olarak işaretlenmeli.
- **Skor kartında Türkçe karakter bozukluğu** — "Finansal Saglik", "Buyume Potansiyeli" şeklinde yazıldı; doğru ASCII Türkçe karakterler kullanılmalı.
- **Havacılık sektörü KPI özet tablosu eksik** — Yönetici özeti altında RPK/ASK/LF/CASK/RASK özet tablosu yok; sadece metin ile geçildi.
- **12 bölüm mevcut ✓** — Tüm bölümler dolu, bu olumlu.
- **QA veri kalite uyarısı eklendi ✓** — Sarı kutu formatında P0/P1 sorunlar listelendi.
- **En kritik bekleyen tarih belirtildi** — AGM/temettü kararı, 22 Nisan TCMB PPK belirtildi.

### Bundan Sonra:
- **Havacılık özet KPI tablosu zorunlu (Yönetici Özeti içinde):** Yolcu (2024/2023/Değişim), LF (%), CASK, RASK, Kargo ton-km, Filo adedi. Bu tablo havacılık şirketinin operasyonel özetini tek bakışta verir.
- **Grafik tag'leri sistematik olarak ekle** — Her tablo veya veri bloğunun yanına ilgili [CHART:XXX] tag'i koy. report_formatter bu tag'leri SVG grafik üretimi için kullanır.
- **Türkçe karakter standartlaştır** — Skor kartı, başlıklar ve metin içinde ASCII Türkçe (ş, ğ, ü, ç, ö, İ) tutarlı kullanılmalı; kayma yaşanırsa UTF-8 encoding belirt.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **Skor kartı truncated** — "Büyüme Potansiyeli: 6.5 — Yılık +800 mağazayla fiziksel büyüme güçlü; ree..." diye kesildi. 6 boyutun tamamı görünmüyor.
- **Finansal tablolar çıktıda yok** — 12 bölüm içindekiler tablosu mükemmel; ancak gerçek finansal sayılar (IS, BS, oran tabloları) çıktıda gösterilmedi. "Bölüm III Finansal Analiz sayfa 7" yazıyor ama içerik yok.
- **[CHART:] grafik tag'leri görünmüyor** — report_formatter için zorunlu grafik işaretleri (LINE/PIE/BAR/SVG) çıktıda yer almadı.
- **Veri kalitesi uyarısı doğru formatta ✓** — "[CF ESTIMATED]" uyarısı ve kritik takvim (22 Nisan TCMB, 15 Mayıs Q1 2026, 17 Haziran temettü) rapor başında yer aldı. İyi uygulama.
- **Zorunlu bildirimler bölümü var mı?** — Truncation nedeniyle 12. bölüm görünmedi.

### Bundan Sonra:
- **Perakende sektörü Final Summary zorunlu ek bölümleri:**
  1. Skor kartına perakende KPI'ları ekle: SSSG puanı, Revenue per Store, Mağaza Büyüme İvmesi
  2. Bölüm IV'te temettü takvimi tablosu (3 taksit tarih + tutar)
  3. Özel marka oranı trendi ([CHART:LINE] ile)
  4. Peer karşılaştırma tablosu: BIMAS vs SOKM vs Jeronimo Martins (EBITDA marjı, mağaza sayısı, Revenue per Store)
- **[CHART:] tag'leri sistematik ekle** — Gelir trendi [CHART:LINE] | Özel marka mix [CHART:PIE] | Peer EBITDA benchmark [CHART:BAR] | Bear/Baz/Bull senaryo [CHART:BAR] — bunlar olmadan report_formatter görsel üretemez.
- **Truncation önlemi** — Skor kartı ve zorunlu bildirimler çıktının SONU'nda yer alacaksa, truncation riski var. Çözüm: Skor kartını Yönetici Özeti içine entegre et; zorunlu bildirimler kısa tutulup başa alınsın.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Output truncated — Yönetici Özeti ortasında kesildi** — "Şirket, 14 Nisan 2026 itibarıyla 204 TL piyasa fiyatıyla... F" ile bitiyor. Tüm bölümler (III-XII) hiç gösterilmedi.
- **İçindekiler tablosu güzel ve tam ✓** — 15 bölüm başlığı ve sayfa numaraları iyi formatlandı.
- **Grafik tag'leri ([CHART:LINE/PIE/BAR]) yok** — Report_formatter için zorunlu; Yönetici Özeti başlamadan zaten truncate olduğu için bu bölümlere hiç ulaşılamadı.
- **Veri kalitesi uyarı tablosu doğru formatta ✓** — Pipeline QA 0.676 ve 4 sorun kısa tabloda gösterildi. Bu iyi.
- **Acil takvim rapor başında ✓** — 21 Nisan İran, 22 Nisan TCMB PPK, 29 Nisan YKBNK Q1 rapor başında — doğru prioritization.
- **Skor kartı görünmüyor** — 6 boyutlu skor kartı (Karlılık, Likidite, Kaldıraç, Nakit Akışı, Büyüme, Yönetim) truncation nedeniyle çıkmadı. Önceki KCHOL raporundan "6.1/10" skoru var; güncellenmiş skor nedir bilinmiyor.

### Bundan Sonra:
- **Yönetici Özeti + Skor Kartı + Hedef Fiyat tablosunu ilk 2000 karaktere sığdır** — Truncation olursa en azından bu üç element görünmüş olsun. Gerisi "Detaylı Bölümler — Ek çıktı" olarak ikinci mesajda gönder.
- **KCHOL için güncellenmiş skor kartı** — Genel skor 6.1'den ne oldu? Fitch downgrade + QA 0.676 + revenue belirsizliği skoru düşürüyor mu? Bu değerlendirme yapılmadan final_summary tamamlanmış sayılmaz.
- **[CHART:] tag'lerini içindekiler tablosunun hemen altına ekle** — Grafik listesini önceden duyur: "[CHART:PIE — Segment dağılımı] [CHART:LINE — 5Y gelir trendi] [CHART:BAR — Peer karşılaştırma] [CHART:BAR — Bear/Baz/Bull]" — report_formatter bunu görür ve SVG üretir.

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK: Rapor cumlesi ortasinda kesilmis — yarim rapor YASAK
- KCHOL: Agent meta-text temizlenmemis (Session ID, Agent ID vb. raporda kalmis), grafik tagleri yok, JSON formatlar duz metne cevrilmemis
- TCELL: Hedef fiyat hesaplamalari truncated, skor karti eksik, final conclusion kesilmis
- TUPRS: QA P0/P1 sorunlari rapor icinde gorunmuyor, agirlikli hedef fiyat aciklanmadi, 17 Nisan trigger onceligi yetersiz vurgulandi
- EREGL: Hedef fiyat araligiBear/Baz/Bull eksik, veri kalite uyarilari yeterince one cikarilmadi

## Son 3 Raporun Ogrenimleri

- **TUPRS (2026-04-12):** Rafineri marji ve Hurmuz jeopolitik senaryosu HER ZAMAN ayri bolum. Zorunlu bildirimler bolumu hicbir zaman rapor disinda birakilmamali.
- **EREGL (2026-04-13):** QA fail verdigi veri icin en dar dogrulanmis fact pack merkez alinmali. FCF terminolojisi: OCF-CAPEX = geleneksel FCF; finansman nakit akisi farkli. Celik sirketlerinde P/E tukkenmis kazanc doneminde anlamsiz; FD/FAVOK ve PD/DD kullan. AB safeguard en kritik tek risk faktoru — FAVOK'un %30-40'ini etkileyebilir.
- **Delta update formati:** Onceki rapordan neyin degistigini [DELTA: ...] etiketi ile isaretle.

## Sektor Bilgi Bankasi

- Celik: P/E yerine FD/FAVOK ve PD/DD kullan. CBAM + AB safeguard + enerji tarife = compound risk. Avrupa gelir payi onemli.
- Rafineri: Marj ($/bbl) ve jeopolitik senaryo ayri bolum. IAS 29 bilanço imbalance mutlaka aciklanmali.
- Holding: Segment bazli analiz zorunlu. NAV discount degerleme bolumunde detaylandirilmali.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **Skor kartı tablosu truncated** — "Büy" ile kesildi; skor kartının son satırları tamamlanmadı.
- **Bölüm III (Finansal Analiz) tam değil** — DSO/DIO/DPO/CCC metrikleri upstream'den gelmediyse bile özette belirtilmesi gerekirdi.
- **Veri kalitesi uyarısı kapak sayfasında doğru konumlandırıldı** — Bu olumlu; devam etmeli.

### Bundan Sonra:
- **Skor kartı 6 boyut + genel = 7 satır, hepsi tam:** Final Summary skor kartını almadan önce upstream skor kartı tamamlanmış mı kontrol et.
- **Özet bölümünde eksik metrik listesi:** Upstream'den gelmeyen Chairman metrikleri (DSO, CCC vb.) "Bu analizde mevcut değil — upstream veri eksikliği" notu ile listele.
- **Truncation = output geçersiz:** Son bölüm yarım kalırsa "output incomplete — devam gerekiyor" flag'i ekle.

---
