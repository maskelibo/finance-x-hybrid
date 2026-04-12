# SISE RAPOR EKSİKLER VE İYİLEŞTİRME PLANI
**Tarih:** 10 Nisan 2026
**Durum:** Usage limit - 2 saat 7 dakika sonra devam
**İlerleme:** 5/100 - Daha çok yol var

---

## ❌ TESPİT EDİLEN EKSİKLER

### 1. HESAPLANAMAYAN FİNANSAL METRİKLER

**Eksik Metrikler:**
- ❌ DSO (Days Sales Outstanding)
- ❌ DIO (Days Inventory Outstanding)  
- ❌ DPO (Days Payable Outstanding)
- ❌ CCC (Cash Conversion Cycle)
- ❌ NWC/Revenue (Net Working Capital / Hasılat)
- ❌ ROE (Return on Equity - equity verisi çelişkili)
- ❌ ROCE (Return on Capital Employed)
- ❌ ROIC (Return on Invested Capital)
- ❌ CAPEX/FAVÖK
- ❌ Faiz Karşılama Oranı (Interest Coverage)
- ❌ Net İşletme Sermayesi Gün Sayısı

**NEDEN EKSİK?**
Agentlar "veri yok" diyerek geçmiş. OYSA:
- ✅ 5 yıllık finansal rapor KAP'ta mevcut
- ✅ Formüller Google'da aranabilir
- ✅ Her metrik hesaplanabilir

**ÇÖZÜM:**
1. Google'dan formülleri search et
2. Agent memory.md'sine kaydet
3. KAP'tan eksik verileri indir
4. Metrikleri hesapla

---

### 2. RAPORDA KALAN İNTERNAL COMMENTLER

**Sorun:** Raporda hala agent yorumları/meta-text var
**Etki:** Profesyonel görünmüyor, Chairman'a sunulamaz

**ÖRNEKLERİ KONTROL ET:**
- Agent self-evaluation sections
- "Hafızamı inceledim" gibi meta-yorumlar
- Internal notlar

**ÇÖZÜM:** Rapor finalization süreci düzelt

---

### 3. TÜRKİYE MAKRO ANALİZİ EKSİK

**Eksik İçerik:**
- Türkiye ekonomisi güncel durum
- TCMB politika faizi
- Enflasyon (CPI, PPI)
- TL/USD, TL/EUR kurlar
- İnşaat sektörü (Şişecam için kritik)
- Enerji fiyatları

**NEDEN ÖNEMLİ:**
Şişecam Türkiye'nin lider cam şirketi - Türkiye makrosu **kritik**

---

### 4. TOKEN KULLANIMI ÇOK YÜKSEK

**Sorun:** memory.md dosyaları çok büyük → çok token harcıyor

**KONTROL ET:**
- agents/financial_analysis/memory.md → kaç KB?
- agents/macro_analysis/memory.md → kaç KB?
- agents/ceo/memory.md → kaç KB?

**OPTİMİZASYON FİKİRLERİ:**
1. Memory'leri özetleyebilir miyiz?
2. Eski feedback'leri arşivleyebilir miyiz?
3. Sadece son 3-6 ay feedback'i memory'de tut?
4. Kritik kuralları ayrı dosyada tut (rules.md)?

---

## ✅ USAGE GERİ GELİNCE YAPILACAKLAR

### ADIM 1: EKSİKLERİ DETAYLI TESPİT (30 dk)

```bash
# SISE raporunu baştan sona oku
# Her eksik metriği listele
# Her eksik analiz bölümünü not et
```

**Çıktı:** Detaylı eksikler listesi (spreadsheet formatında)

---

### ADIM 2: AGENT FEEDBACK VE EĞİTİM (60 dk)

**Financial Analysis Agent'a:**
```
## CEO Feedback - SISE Raporu Eksiklikleri

### Hesaplanmayan Metrikler:
1. DSO = (Ticari Alacaklar / Net Satışlar) × 365
   - Formula: Google'dan ara, memory'ne kaydet
   - Veri: KAP'tan bilançodan ticari alacaklar çek
   
2. DIO = (Stoklar / SMM) × 365
   - Formula: [...]
   - Veri: [...]

### Bundan Sonra:
- HER metrik için önce Google'da formula ara
- Formula'yı memory.md'ye kaydet  
- Veri yoksa KAP'a git ve indir
- "Veri yok" excuse YASAK
```

**Macro Analysis Agent'a:**
```
## CEO Feedback - Türkiye Analizi Eksik

SISE Türkiye'nin lider şirketi, Türkiye makrosu ZORUNLU:
- TCMB faiz kararları (son 12 ay)
- Enflasyon trendi
- İnşaat sektörü (düzcam talebi)
- Enerji fiyatları (cam üretimi enerji-yoğun)

KAYNAK: TCMB websitesi, TÜİK, sektör raporları
```

**Data Collection Agent'a:**
```
## CEO Feedback - Veri Toplama Eksiklikleri

5 yıllık TÜM finansal tablolar indirilmeli:
- Bilanço (detaylı - stoklar, alacaklar, borçlar ayrımıyla)
- Gelir tablosu (segment bazında)
- Nakit akış tablosu (CFO, CFI, CFF ayrımıyla)
- Dipnotlar (working capital detayları için)

HER çeyrek rapor da indirilmeli (trend analizi için)
```

---

### ADIM 3: MEMORY OPTİMİZASYONU (45 dk)

**Strateji:**
1. Her agent memory.md'sini oku
2. Boyutları tespit et
3. Optimize et:
   - Son 6 ay feedback tut
   - Eski feedback → archive/ klasörüne taşı
   - Kimlik kartı + son kurallar = memory.md (lightweight)
   - Detaylı örnekler = examples/ klasörü

**Hedef:** 
- Memory.md: <10 KB (şu an muhtemelen >50 KB)
- Token kullanımı: %50 azaltma

---

### ADIM 4: RAPOR FINALIZATION SÜRECİ DÜZELTİNational (30 dk)

**Sorun:** Agent yorumları raporda kalıyor

**Çözüm:**
1. Final Summary agent system prompt'unu güncelle:
   ```
   YASAK: "Hafızamı inceledim", "Şimdi hazırlıyorum" gibi meta-text
   YASAK: "Agent Internal", "ÖZ-DEĞERLENDİRME" bölümleri
   
   SADECE: Profesyonel analiz içeriği
   ```

2. Post-processing script yaz:
   ```python
   def clean_report(content):
       # Remove all agent meta-commentary
       # Remove self-evaluation sections
       # Keep only analysis content
       return cleaned_content
   ```

---

### ADIM 5: SISE RAPORU YENİDEN ÜRETİM (90 dk)

**Süreç:**
1. Eksik metrikleri hesapla (Financial Analysis agent)
2. Türkiye makro analizi ekle (Macro Analysis agent)
3. Raporu yeniden derle (Final Summary agent)
4. Agent yorumlarını temizle (post-processing)
5. PDF oluştur (grafikler + tam detay)

**Hedef:** 
- %95+ metrik coverage
- Türkiye makro analizi tam
- Temiz, profesyonel rapor
- ASELS seviyesi kalite

---

## 🧠 DÜŞÜNME SÜRECİ VE İYİLEŞTİRME

### Şu An Nerede Hata Yapıyoruz?

**1. Agent Accountability Eksik:**
- Problem: Agent "veri yok" deyince kabul ediyoruz
- Çözüm: CEO agent QA yapmalı, "veri yok" excuse challenge etmeli

**2. Proactive Data Search Yok:**
- Problem: Agentlar pasif - sadece pipeline'dan gelen veriyi kullanıyor
- Çözüm: WebFetch + Google search mandatory yap

**3. Memory Overload:**
- Problem: Her feedback memory'ye ekleniyor, asla temizlenmiyor
- Çözüm: Memory rotation + archiving strategy

**4. Report Quality Control Zayıf:**
- Problem: Final rapor direk çıkıyor, QA yok
- Çözüm: CEO post-review + cleanup pipeline

### Nasıl Daha İyi Olabilir?

**Kısa Vade (1 hafta):**
1. ✅ Eksik metrikleri hesapla
2. ✅ Memory'leri optimize et
3. ✅ Report cleanup pipeline ekle
4. ✅ SISE raporunu düzelt

**Orta Vade (1 ay):**
1. Agent self-check mekanizması (her agent kendi çıktısını validate etsin)
2. Automated metric calculator service (formüller database'de, auto-calculate)
3. Memory summarization agent (eski feedback'leri özetle)
4. Quality gates (rapor <0.80 quality ise CEO reddetsin)

**Uzun Vade (3 ay):**
1. Full agentic automation (Chairman sadece approve/reject)
2. Learning from mistakes (her hata → system-wide improvement)
3. Benchmark against real analyst reports (ne kadar yakınız?)
4. Multi-company portfolio analysis

---

## 📊 TOKEN OPTİMİZASYONU STRATEJİSİ

### Mevcut Token Harcaması (Tahmin):

**Analysis Session:**
- CEO mandate: ~5K tokens
- 20 Agent runs × ~15K tokens = 300K tokens
- Memory loading: ~50K tokens (HER agent için 2-3K)
- Final summary: ~30K tokens
- **TOPLAM: ~385K tokens**

**Memory Sorunu:**
- Şu an: Her agent memory'si ~50 KB → ~12K tokens
- 20 agent × 12K = 240K tokens SADECE MEMORY'DEN!
- **%62 token kullanımı memory'den geliyor!**

### Optimizasyon Hedefleri:

**Memory Reduction:**
- Hedef: Her agent memory <10 KB (3K tokens)
- 20 agent × 3K = 60K tokens
- **Tasarruf: 180K tokens (%47 azalma)**

**Nasıl:**
1. Lightweight memory.md (sadece son 6 ay + kritik kurallar)
2. Archive old feedback
3. Use references (detaylar ayrı dosyada, lazımsa oku)

---

## 💬 TARTIŞMA İÇİN SORULAR

**Chairman, usage gelince şunları tartışalım:**

1. **Agent Özerkliği vs Guidance:**
   - Agentlar'a daha fazla özerklik mi verelim? (kendi formüllerini bulsunlar)
   - Yoksa detaylı SOP'lar mı yazalım? (step-by-step instructions)

2. **Quality vs Speed:**
   - %95 quality için 3 saat mi harcansın?
   - Yoksa %80 quality 1 saatte yeterli mi?

3. **Memory Strategy:**
   - Sürekli büyüyen memory mi?
   - Yoksa rotating memory (son N feedback) mi?

4. **Rapor Formatı:**
   - Mevcut 40-50 sayfa yeterli mi?
   - Yoksa daha detaylı (80-100 sayfa) mi istiyorsunuz?

5. **Öncelikler:**
   - Önce mevcut SISE raporunu mükemmelleştir?
   - Yoksa sistemi genel olarak düzelt, sonra SISE'yi yeniden yap?

---

**ÖZET:** 
- Eksikler tespit edildi
- Plan hazır
- Usage gelince execute ederiz
- 5/100'deyiz, hedef 100 - ama doğru yöndeyiz!

