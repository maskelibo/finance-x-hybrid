---
id: ifrs16-lease-adjustment
name: "IFRS 16 Lease Adjustments"
description: "Operating lease faiz ve itfa ayristirma; EBITDAR icin kira giderini operating cost'tan geri ekleme."
triggers: ['ifrs 16', 'operating lease', 'kira gideri', 'ebitdar', 'lease liability', 'right of use']
applies_to_agents: ['parse_standardization', 'reconciliation', 'financial_analysis', 'valuation_agent']
category: accounting
priority: high
---

# IFRS 16 Lease Adjustments

## Ne Zaman Kullanılır?
Havacılık, perakende, telekom gibi yüksek operating lease kullanan sektörlerde EBITDAR hesaplamak için. IFRS 16 sonrası lease önden right-of-use asset + lease liability olarak bilançoya giriyor.

## Prosedür
1. **Lease liability** → faiz + anapara kısmına ayrıştır (amortizasyon tablosu kullan).
2. **D&A içinde right-of-use amortization** → ayrı satır, IFRS 16 etkisi.
3. **EBITDAR** = EBITDA + Rent Expense (pre-IFRS 16) veya EBITDA + D&A_leaseROU + Interest_leaseLiab.
4. **Net Debt adjusted** = Financial Debt + Lease Liability.

## Kurallar
- EBITDAR havacılık için zorunlu (airline kira-yoğun).
- Lease-adjusted leverage: Net Debt + 8× Annual Rent (pre-IFRS 16) veya Net Debt + Lease Liability (post).
- Short-term lease (<12ay) ve low-value (<$5k) IFRS 16 dışı — ayrı tutulur.

## Örnek
THYAO FY2025: EBITDA 184.8B TL + lease-ROU amortization 35B TL + lease-liab faiz 8B TL = EBITDAR ~228B TL, marj ~%23.2.

## Bilinen Tuzaklar
1. "Rent expense" ve "Lease D&A + Interest" arasındaki toplam eşit değil — dönem başı/sonu lease liability değişiminden kaynaklanır.
2. Sublease gelirleri ayrı satır; lease cost net alınmalı.
3. Variable lease payment (percentage-of-sales rent) IFRS 16 dışı tutulur.

## Referanslar
- TFRS 16 Kiralamalar
- IASB IFRS 16 staff paper — EBITDA vs EBITDAR
