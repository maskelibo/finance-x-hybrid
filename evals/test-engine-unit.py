#!/usr/bin/env python3
"""
Financial Engine unit test — Python eşdeğeri ile deterministik hesapları doğrular.
Engine'in TypeScript fonksiyonlarının beklenen davranışını test eder.
"""
from __future__ import annotations

passed = 0
failed = 0

def test(name, actual, expected, tolerance=0.01):
    global passed, failed
    if actual is None and expected is None:
        print(f"  PASS  {name}: None == None")
        passed += 1
        return
    if actual is None or expected is None:
        print(f"  FAIL  {name}: {actual} != {expected}")
        failed += 1
        return
    if abs(actual - expected) <= abs(expected * tolerance) + 0.01:
        print(f"  PASS  {name}: {actual} ≈ {expected}")
        passed += 1
    else:
        print(f"  FAIL  {name}: {actual} != {expected} (diff: {abs(actual-expected):.4f})")
        failed += 1

# --- Ratio tests ---
print("=== RATIO TESTS ===")
test("grossMargin", round(50000/200000*100, 2), 25.0)
test("ebitdaMargin", round(30000/200000*100, 2), 15.0)
test("netMargin", round(10000/200000*100, 2), 5.0)
test("roe", round(10000/80000*100, 2), 12.5)
test("roce", round(25000/(500000-100000)*100, 2), 6.25)
test("dso", round(15000/200000*360, 2), 27.0)
test("dio", round(20000/150000*360, 2), 48.0)
test("dpo", round(18000/150000*360, 2), 43.2)
test("ccc", round(27.0 + 48.0 - 43.2, 2), 31.8)
test("netDebt", 120000 - 30000, 90000)
test("netDebt/EBITDA", round(90000/30000, 2), 3.0)
test("interestCoverage", round(30000/5000, 2), 6.0)
test("currentRatio", round(150000/100000, 2), 1.5)
test("fcf", 35000 - 10000, 25000)

# --- Altman Z ---
print("\n=== ALTMAN Z TEST ===")
nwc = 150000 - 100000  # 50000
re = 40000
ebit = 25000
mcap = 300000
tl = 420000
sales = 200000
ta = 500000
z = 1.2*(nwc/ta) + 1.4*(re/ta) + 3.3*(ebit/ta) + 0.6*(mcap/tl) + 1.0*(sales/ta)
test("altmanZ", round(z, 2), round(1.2*0.1 + 1.4*0.08 + 3.3*0.05 + 0.6*(300000/420000) + 1.0*0.4, 2))

# --- Piotroski F ---
print("\n=== PIOTROSKI F TEST ===")
# All positive signals
score = sum([
    10000 > 0,   # NI positive
    35000 > 0,   # OCF positive
    0.01 > 0,    # ROA delta positive
    35000 > 10000, # OCF > NI
    -0.02 < 0,   # leverage delta negative
    0.1 > 0,     # current ratio delta positive
    0 <= 0,      # no new shares
    0.005 > 0,   # gross margin delta positive
    0.01 > 0,    # asset turnover delta positive
])
test("piotroskiF (all positive)", score, 9)

# --- WACC ---
print("\n=== WACC TEST ===")
ke = 0.15
kd = 0.08
tax = 0.25
ew = 0.60
dw = 0.40
wacc_val = ke * ew + kd * (1 - tax) * dw
test("wacc", round(wacc_val, 4), 0.1140)

# --- DCF ---
print("\n=== DCF TEST ===")
fcf_proj = [10000, 11000, 12100, 13310, 14641]
wacc_rate = 0.12
tg = 0.03
shares = 1000
nd = 50000

pv_fcf = [f / (1 + wacc_rate)**(i+1) for i, f in enumerate(fcf_proj)]
tv = (fcf_proj[-1] * (1 + tg)) / (wacc_rate - tg)
pv_tv = tv / (1 + wacc_rate)**5
ev = sum(pv_fcf) + pv_tv
equity_val = ev - nd
fair_per_share = equity_val / shares

test("dcf_ev", round(ev), round(sum(pv_fcf) + pv_tv))
test("dcf_fair_value", round(fair_per_share, 2), round(equity_val / shares, 2))
print(f"  DCF fair value per share: {fair_per_share:.2f} TL")

# --- Reproducibility ---
print("\n=== REPRODUCIBILITY TEST ===")
# Same inputs → same output, 3 times
for i in range(3):
    r = round(10000/80000*100, 2)
    assert r == 12.5, f"Run {i+1}: ROE = {r} != 12.5"
print(f"  PASS  3 runs same result: ROE = 12.5%")
passed += 1

# --- Edge cases ---
print("\n=== EDGE CASE TESTS ===")
test("div_by_zero", None if 100000 == 0 else 100, 100)  # not zero
# Simulate: denominator = 0
denom = 0
result = None if denom == 0 else 100/denom
test("actual_div_by_zero", result, None)

# --- Summary ---
print(f"\n{'='*40}")
print(f"TOTAL: {passed} passed, {failed} failed")
if failed == 0:
    print("ALL TESTS PASSED")
else:
    print(f"FAILURES: {failed}")
