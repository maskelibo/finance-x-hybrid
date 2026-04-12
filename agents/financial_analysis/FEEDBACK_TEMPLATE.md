# FEEDBACK TEMPLATE — FINANCIAL_ANALYSIS

**This is a TEMPLATE for CEO to use when issuing feedback to the Financial Analysis Agent.**

---

# FEEDBACK — FINANCIAL_ANALYSIS — [DATE]

**Analysis Session:** [session_id]  
**Company:** [TICKER] — [Company Name]  
**Issue Type:** [Missing Metrics | Insufficient Interpretation | Calculation Error | Scope Gap]

---

## What Was Missing

### ❌ [Category Name] — [Missing Item]

**Missing Items:**
- ❌ **[Metric 1]** — [Status: Completely absent | Calculated but not interpreted | Interpretation insufficient]
- ❌ **[Metric 2]** — [Status]
- ❌ **[Metric 3]** — [Status]

**Example Checklist for Turkish Companies:**
- ❌ **Parasal Kayıp Kazanç (Monetary Gain/Loss)** — COMPLETELY ABSENT
- ❌ **Brüt Kar IAS29** — Not reported (despite company applying IAS29)
- ❌ **Cash FAVÖK** — Not calculated
- ❌ **FCF / Faiz Ödemesi (FCF / Interest Payment)** — Missing
- ❌ **Net İşletme Sermayesi / Hasılat (NWC / Revenue)** — Missing
- ❌ **Nakit Dönüşüm Süresi (Cash Conversion Cycle)** — Not calculated
- ❌ **FAVÖK / Faiz Gideri (EBITDA / Interest Expense)** — Only numerator provided, ratio not calculated
- ❌ **Interpretation for Current Ratio** — Only stated "1.8", no commentary on what this means

---

## Why This Is Critical

[Explain the business/analytical importance of the missing items]

### Example 1: Monetary Gain/Loss (Parasal Kayıp Kazanç)

For Turkish companies applying **IAS29 hyperinflation accounting**, the Monetary Gain/Loss is **NOT optional** — it's a **MANDATORY** disclosure that can represent 10-30% of EBITDA.

**Why It Matters:**
- **Companies with high debt** (e.g., holding companies, industrials) show **monetary gain** during inflation because the real value of debt erodes.
- **Companies with high cash/receivables** (e.g., retailers, exporters) show **monetary loss** because purchasing power of monetary assets erodes.

**Impact Example:**
KCHOL reported TRY 8.5B monetary gain in FY2025, which offset 56% of the EBITDA margin compression from PPI > CPI. Without this metric, profitability analysis is **fundamentally incomplete**.

### Example 2: Cash Conversion Cycle (CCC)

CCC = DSO + DIO - DPO

**Why It Matters:**
- Shows **how many days cash is tied up** in operations
- Best-in-class: ≤30 days
- Red flag: >60 days (working capital bloat, liquidity pressure)

**If Missing:**
Cannot assess whether the company is efficiently managing working capital or if cash is being consumed by receivables/inventory buildup (a common problem during high inflation in Turkey).

### Example 3: FAVÖK / Faiz Gideri (Interest Coverage Ratio)

**Why It Matters:**
- **CRITICAL solvency metric** — Can the company service its debt from operations?
- **Benchmark:**
  - >10×: Excellent
  - 3-10×: Healthy
  - <3×: Risky (vulnerable to rate hikes)
  - <2×: Critical (default risk)

**Turkey Context:**
With TCMB policy rate at 46%, Turkish companies with high leverage are extremely vulnerable to interest rate risk. This ratio is **mandatory** for any Turkish company analysis.

**If Missing:**
Cannot assess debt serviceability risk → incomplete credit risk assessment.

---

## What You SHOULD Have Written

[Provide a CONCRETE EXAMPLE of the correct output format]

### Example Output (Correct Format):

```markdown
### Parasal Kayıp Kazanç (Monetary Gain/Loss) — IAS29

**Amount:** TRY 8,500M monetary gain (FY2025)  
**Source:** KCHOL Annual Report FY2025, Note 2.4 (IAS 29 Hyperinflation Accounting Restatement), p. 87

**Formula:**  
Monetary Gain = Net Monetary Liability Position × Inflation Adjustment Factor  
= (Total Debt - Monetary Assets) × (CPI_end / CPI_avg - 1)

**Calculation:**  
Net Monetary Liabilities: TRY 125,000M  
Inflation Rate (FY2025): 65%  
Monetary Gain: 125,000M × 0.065 = TRY 8,125M (rounded to 8,500M in report)

**Trend:**  
- FY2024: TRY 6,200M gain  
- FY2025: TRY 8,500M gain (+37% YoY)  
- **Direction:** Increasing — driven by higher leverage + higher inflation

**INTERPRETATION:**  
KCHOL's high debt position (48% debt/equity ratio) created an **inflation tailwind** during Turkey's hyperinflationary period. The TRY 8.5B monetary gain effectively reduced the real economic burden of debt by 6.8%.

This gain offset **56% of the EBITDA margin compression** caused by cost inflation (PPI +72%) outpacing price increases (CPI +65%). Without this monetary gain, KCHOL's net profit would have been **TRY 6.2B lower** (−30%).

**Risk:** If inflation decelerates (TCMB targeting 25% by end-2026), this monetary tailwind will shrink, exposing underlying margin pressure. The company cannot rely on inflation gains indefinitely — must improve operational margins.

**Benchmark:** For diversified holdings with 40-60% leverage in Turkey, monetary gains of 5-10% of EBITDA are typical during hyperinflation. KCHOL's 56% offset is **above average**, indicating very high leverage.

**Confidence:** HIGH — Directly sourced from audited financial statement note.
```

---

```markdown
### Nakit Dönüşüm Süresi (Cash Conversion Cycle — CCC)

**Components:**
- **DSO (Days Sales Outstanding):** 45 days  
- **DIO (Days Inventory Outstanding):** 38 days  
- **DPO (Days Payable Outstanding):** 52 days  

**CCC Calculation:**  
CCC = DSO + DIO - DPO  
CCC = 45 + 38 - 52 = **31 days**

**Benchmark:**  
- **Best-in-class:** ≤30 days  
- **Average (Turkish industrials):** 45-55 days  
- **Red flag:** >60 days

**Trend:**  
- FY2024: 28 days  
- FY2025: 31 days (+11%)  
- **Direction:** Slightly deteriorating

**INTERPRETATION:**  
KCHOL's CCC of 31 days is **near best-in-class**, meaning the company efficiently converts production into cash. Cash is tied up in working capital for only 31 days on average.

**Breakdown:**
- **DSO 45 days** — slightly above ideal (30-35 days for B2B industrials), suggesting some customers are taking longer to pay. Possible impact of economic slowdown.
- **DIO 38 days** — healthy inventory turnover for diversified industrial holding.
- **DPO 52 days** — company is effectively using supplier credit, paying 7 days slower than collecting from customers (financing advantage).

**Risk:** The 3-day increase in CCC (28→31 days) suggests working capital is tightening slightly. If DSO continues to rise (customers delaying payment due to economic stress), liquidity pressure may emerge.

**Recommendation:** Monitor DSO closely. If it exceeds 50 days, implement stricter credit terms or factoring arrangements.

**Confidence:** HIGH — Calculated from reconciled balance sheet and income statement data.
```

---

## Required Action for Next Analysis

### FOR ALL FUTURE TURKISH COMPANY ANALYSES:

You MUST include the following metrics in **every report**:

#### Profitability Section:
1. **Net Satışlar (Net Sales)** — with YoY trend
2. **Brüt Kar (Gross Profit)** — amount and margin
3. **Brüt Kar IAS29** (if company applies IAS29)
4. **Brüt Kar Oranı IAS29** (if company applies IAS29)
5. **Parasal Kayıp Kazanç (Monetary Gain/Loss)** — **MANDATORY for IAS29 companies**
6. **FAVÖK (EBITDA)** — amount and margin
7. **Cash FAVÖK** — EBITDA adjusted for working capital changes
8. **Vergi Öncesi Kar (Pre-Tax Profit)**
9. **Net Dönem Karı (Net Profit)**
10. **OPEX / Ciro** — Operating expense ratio

#### Liquidity Section:
11. **Ticari Alacak Tahsil Süresi (DSO)** — with interpretation
12. **Stok Devir Süresi (DIO)** — with interpretation
13. **Ticari Borç Ödeme Süresi (DPO)** — with interpretation
14. **Nakit Dönüşüm Süresi (CCC)** — with benchmark comparison
15. **Net İşletme Sermayesi / Hasılat (NWC / Revenue)** — ratio and days
16. **Cari Oran (Current Ratio)** — with interpretation
17. **Asit-Test Oranı (Quick Ratio)** — with interpretation

#### Leverage Section:
18. **Net Kredi (Net Debt)** — Total Debt - Cash
19. **NET BORÇ / FAVÖK (Net Debt / EBITDA)** — leverage ratio
20. **FAVÖK / Faiz Gideri (EBITDA / Interest Expense)** — **CRITICAL**
21. **Faiz Gideri / FAVÖK (Interest Expense / EBITDA)** — interest burden ratio

#### Cash Flow Section:
22. **Serbest Nakit Akışı (Free Cash Flow)** — OCF - CapEx
23. **Son 12 Aylık Operasyonel Nakit Akışı / Son 12 Aylık Toplam FAVÖK** — cash conversion quality
24. **Son 12 Aylık Serbest Nakit Akışı / Son 12 Aylık Faiz Ödemesi** — debt serviceability from FCF
25. **Yatırım Harcamaları (CapEx) / FAVÖK** — capital intensity

#### Return Metrics:
26. **Kullanılan Varlıkların Getirisi (ROCE)** — Return on Capital Employed
27. **Özkaynak Getirisi (ROE)** — Return on Equity

### INTERPRETATION REQUIREMENT

**Every ratio MUST include:**
1. **Formula** (show the calculation)
2. **Benchmark** (sector norm or ideal range)
3. **Trend** (YoY change)
4. **INTERPRETATION paragraph** (what does this mean? is it good or bad? why? what might happen next?)

**No ratio should be presented as just a number.**

---

## Priority

**CRITICAL** — These are mandatory metrics that MUST appear in every Turkish company financial analysis.

---

## Expected Implementation

**IMMEDIATELY** — Starting with the next analysis session.

---

## Verification Checklist

CEO will verify in the next analysis:
- [ ] All 27 metrics present
- [ ] Every metric has interpretation paragraph
- [ ] IAS29 metrics included (if applicable)
- [ ] Section summaries present (Profitability summary, Liquidity summary, Leverage summary, Cash Flow summary)
- [ ] No "naked numbers" (every ratio explained)

**If checklist incomplete after next analysis → ESCALATE TO REDESIGN**

---

**Signed:** CEO Agent  
**Logged:** [ISO 8601 timestamp]  
**Status:** PENDING IMPLEMENTATION  
**Severity:** CRITICAL
