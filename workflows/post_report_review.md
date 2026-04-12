# POST-REPORT REVIEW WORKFLOW
## Automatic Feedback Loop for Continuous Agent Improvement

**Purpose:** After every analysis report is generated, the CEO Agent MUST automatically review the report, identify gaps, and issue feedback to specialist agents so they improve over time.

---

## TRIGGER CONDITIONS

This workflow is triggered AUTOMATICALLY when:
- `final_summary` agent completes its output
- `report_formatter` agent delivers the final report
- Analysis session status = `completed`

**Execution:** CEO Agent spawns a background review task

---

## WORKFLOW STEPS

### STEP 1: CEO READS FINAL OUTPUT

**Inputs:**
- Final formatted report (from `report_formatter`)
- All specialist agent outputs (from session context)
- Company ticker and sector

**CEO Actions:**
1. Read the complete final report
2. Read individual agent outputs: `financial_analysis`, `macro_analysis`, `sector_competition`, `technical_analysis`, `strategic_synthesis`

---

### STEP 2: CEO APPLIES QUALITY CHECKLISTS

For each specialist agent, CEO runs the checklist from `system_prompt.md` lines 648-681:

#### Financial Analysis Checklist
- [ ] All mandatory ratios present? (Net Satışlar, Brüt Kar, Brüt Kar Oranı, FAVÖK, FAVÖK Oranı, etc.)
- [ ] **IAS29 metrics** present if applicable? (Brüt Kar IAS29, Parasal Kayıp Kazanç)
- [ ] **Working capital metrics** present? (DSO, DIO, DPO, CCC, NWC/Revenue)
- [ ] **Cash flow metrics** present? (OCF/FAVÖK, FCF/Faiz Ödemesi, Cash FAVÖK)
- [ ] **Leverage metrics** present? (Net Debt/FAVÖK, FAVÖK/Faiz Gideri, Faiz Gideri/FAVÖK)
- [ ] **Return metrics** present? (ROE, ROCE, ROIC)
- [ ] **CapEx analysis** present? (CapEx/FAVÖK)
- [ ] **Interpretation provided** for each ratio? (Not just numbers, but "what does this mean?")
- [ ] Section summaries present? (Profitability summary, liquidity summary, etc.)

#### Macro Analysis Checklist
- [ ] **Geopolitical analysis** present? (For defense/aerospace/energy companies, MANDATORY)
- [ ] **Regional conflicts** identified with sources?
- [ ] **Company-product linkage** to macro events?
- [ ] **Impact quantification** provided (with confidence labels)?
- [ ] **Turkey-specific macro factors** covered? (Inflation, TCMB policy, FX impact)

#### Sector & Competition Checklist
- [ ] Peer comparison present?
- [ ] Industry trends identified?
- [ ] Competitive positioning assessed?

#### Technical Analysis Checklist
- [ ] Price trend analysis present?
- [ ] Support/resistance levels identified?
- [ ] Volume analysis included?

#### Strategic Synthesis Checklist
- [ ] Cross-layer integration present?
- [ ] Contradictions addressed?
- [ ] Clear "so what?" statement?

---

### STEP 3: IDENTIFY GAPS

For each agent with unchecked items:
- Log the specific missing items
- Categorize severity: CRITICAL (missing mandatory metrics), HIGH (missing important context), MEDIUM (incomplete interpretation)

**Output:** Gap inventory per agent

---

### STEP 4: GENERATE FEEDBACK DOCUMENTS

For each agent with gaps, CEO generates a FEEDBACK file:

**File Path:** `agents/[agent_id]/FEEDBACK_[DATE]_[TICKER].md`

**Template:**

```markdown
# FEEDBACK — [AGENT_NAME] — [DATE]

**Analysis Session:** [session_id]  
**Company:** [TICKER] — [Company Name]  
**Issue Type:** [Scope Gap | Quality Issue | Missing Metric | Insufficient Interpretation]

---

## What Was Missing

[Detailed list of missing items with ❌ marks]

**Example:**
- ❌ **Parasal Kayıp Kazanç (Monetary Gain/Loss)** — COMPLETELY ABSENT
- ❌ **Cash FAVÖK** — Not calculated
- ❌ **FCF / Interest Payment Ratio** — Missing
- ❌ **Interpretation for Current Ratio** — Only number provided, no context

---

## Why This Is Critical

[Explanation of why these items matter]

**Example:**
For Turkish companies applying IAS29 hyperinflation accounting, **Monetary Gain/Loss** is a CRITICAL metric. It shows whether the company benefits from inflation (if it holds net debt) or suffers from it (if it holds net monetary assets like cash/receivables).

Without this metric, the profitability analysis is INCOMPLETE because inflation can add or subtract 10-30% of EBITDA from real economic profit.

---

## What You SHOULD Have Written

[Provide a concrete example of the correct output]

**Example:**
```markdown
### Monetary Gain/Loss (Parasal Kayıp Kazanç)

**Amount:** TRY 8,500M monetary gain (FY2025)  
**Source:** Annual Report FY2025, Note 2.4 (IAS 29 Restatement)

**Interpretation:**  
KCHOL reported a TRY 8.5B monetary gain due to its net debt position during a 65% inflation period. This means inflation effectively reduced the real burden of KCHOL's debt by 8.5B TRY.

**Impact:** This monetary gain offset 56% of the EBITDA margin compression caused by PPI > CPI cost inflation. Without this gain, net profit would have been 30% lower.

**Direction:** POSITIVE — High leverage during hyperinflation creates a monetary tailwind.
```
---

## Required Action for Next Analysis

[Specific instructions for future analyses]

**Example:**
### FOR ALL FUTURE ANALYSES OF TURKISH COMPANIES:

You MUST include the following metrics in the Profitability section:
1. **Brüt Kar IAS29** (if company applies IAS29)
2. **Brüt Kar Oranı IAS29** (if company applies IAS29)
3. **Parasal Kayıp Kazanç** (MANDATORY for IAS29 companies)

You MUST provide interpretation for every ratio (not just numbers).

---

## Priority

**CRITICAL** | **HIGH** | **MEDIUM**

---

## Expected Implementation

**IMMEDIATELY** — Next analysis MUST include these items.

---

## Verification Checklist

CEO will verify in next analysis:
- [ ] Parasal Kayıp Kazanç present and interpreted
- [ ] Cash FAVÖK calculated
- [ ] FCF / Interest Payment ratio calculated
- [ ] All ratios have interpretation paragraphs

**If checklist incomplete after next analysis → ESCALATE TO REDESIGN**

---

**Signed:** CEO Agent  
**Logged:** [ISO 8601 timestamp]  
**Status:** PENDING IMPLEMENTATION  
**Severity:** [CRITICAL | HIGH | MEDIUM]
```

---

### STEP 5: DELIVER FEEDBACK

1. **Write FEEDBACK files** to each agent's directory
2. **Update feedback tracker** in `agents/ceo/feedback_issued.md`:

```markdown
## Feedback Issued — [DATE]

| Agent | Session | Company | Issue Type | Severity | File | Status |
|-------|---------|---------|------------|----------|------|--------|
| financial_analysis | WPd5Q877 | ASELS | Missing Metrics | CRITICAL | FEEDBACK_2026-04-10_ASELS.md | PENDING |
| macro_analysis | WPd5Q877 | ASELS | Scope Gap | CRITICAL | FEEDBACK_2026-04-10_ASELS.md | PENDING |
```

3. **Agent memory update** (Optional for now, can be implemented later)

---

### STEP 6: TRACK IMPROVEMENT

For each agent:
- **First feedback:** Status = PENDING
- **Second analysis (same agent):** CEO checks if the gap was filled
  - If YES: Update status to IMPLEMENTED → Log as "improving agent"
  - If NO: Escalate severity → Issue CRITICAL feedback
- **Third strike (same gap):** Trigger REDESIGN escalation

---

## EXECUTION FREQUENCY

**EVERY analysis session without exception.**

---

## SUCCESS METRICS

- **Feedback issued within 60 seconds** of report completion
- **Agent improvement rate:** % of feedback items implemented in next analysis
- **Repeat failure rate:** % of feedback items still missing after 2 sessions

---

## AUTOMATION TRIGGER

**File:** `workflows/trigger_post_report_review.sh`

```bash
#!/bin/bash
# Triggered automatically when report_formatter completes

SESSION_ID=$1
COMPANY_TICKER=$2

# CEO Agent reviews the final report
echo "🔍 CEO Post-Report Review Starting..."
echo "Session: $SESSION_ID"
echo "Company: $COMPANY_TICKER"

# Execute CEO review (to be implemented in backend)
# This will spawn a CEO agent task with mode: POST_REPORT_REVIEW

# Output: FEEDBACK files written to agents/[agent_id]/FEEDBACK_*.md
```

---

**Next Step:** Implement this workflow in the backend orchestrator so it runs automatically after every report.
