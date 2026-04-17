/**
 * Deterministic commentary generator — turns raw Python numbers into
 * Turkish narrative paragraphs without calling the LLM.
 *
 * Why this matters: the LLM-authored final_summary gives us big
 * section-level prose, but individual ratios and events need a
 * one-liner of interpretation attached to them. Doing that
 * deterministically from the numbers themselves (thresholds + sector
 * benchmarks) is faster, cheaper, and doesn't hallucinate.
 *
 * Every function here returns a string (possibly empty when input is
 * null). Caller decides whether to inject into narrative_* slots or
 * append to the table rows directly.
 */

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
}


function fmtPct(n: number, decimals = 1): string {
  return `%${n.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}


interface ProfitabilityInputs {
  grossMargin?: number | null;
  ebitdaMargin?: number | null;
  netMargin?: number | null;
  roe?: number | null;
  roa?: number | null;
  roce?: number | null;
  sector: string;
}


/** Sector-aware profitability thresholds — percentile-based ranges.
 *  P25/P50/P75 approximations for Turkish market sectors. */
function sectorThresholds(sector: string): {
  gm: { p25: number; p50: number; p75: number } | null;
  em: { p25: number; p50: number; p75: number };
  nm: { p25: number; p50: number; p75: number };
  roe: { p25: number; p50: number; p75: number };
} {
  switch (sector) {
    case 'banking': return { gm: null, em: { p25: 35, p50: 45, p75: 55 }, nm: { p25: 15, p50: 22, p75: 30 }, roe: { p25: 10, p50: 18, p75: 28 } };
    case 'holding': return { gm: { p25: 12, p50: 20, p75: 30 }, em: { p25: 8, p50: 14, p75: 22 }, nm: { p25: 5, p50: 10, p75: 16 }, roe: { p25: 8, p50: 14, p75: 22 } };
    case 'aviation': return { gm: { p25: 18, p50: 25, p75: 35 }, em: { p25: 12, p50: 20, p75: 28 }, nm: { p25: 4, p50: 10, p75: 18 }, roe: { p25: 15, p50: 25, p75: 40 } };
    case 'steel': return { gm: { p25: 10, p50: 18, p75: 26 }, em: { p25: 6, p50: 14, p75: 22 }, nm: { p25: 2, p50: 8, p75: 15 }, roe: { p25: 8, p50: 15, p75: 25 } };
    case 'telecom': return { gm: { p25: 50, p50: 58, p75: 65 }, em: { p25: 28, p50: 35, p75: 42 }, nm: { p25: 8, p50: 14, p75: 22 }, roe: { p25: 10, p50: 18, p75: 28 } };
    case 'defense': return { gm: { p25: 22, p50: 30, p75: 38 }, em: { p25: 14, p50: 22, p75: 30 }, nm: { p25: 8, p50: 15, p75: 22 }, roe: { p25: 12, p50: 20, p75: 30 } };
    case 'refinery': return { gm: { p25: 5, p50: 10, p75: 18 }, em: { p25: 3, p50: 8, p75: 14 }, nm: { p25: 1, p50: 4, p75: 9 }, roe: { p25: 10, p50: 18, p75: 28 } };
    case 'retail': return { gm: { p25: 22, p50: 28, p75: 34 }, em: { p25: 4, p50: 7, p75: 11 }, nm: { p25: 1, p50: 3, p75: 6 }, roe: { p25: 15, p50: 25, p75: 40 } };
    default: return { gm: { p25: 15, p50: 22, p75: 32 }, em: { p25: 8, p50: 14, p75: 22 }, nm: { p25: 3, p50: 8, p75: 15 }, roe: { p25: 10, p50: 18, p75: 28 } };
  }
}

/** Estimate TRY cost of equity from TCMB policy rate context.
 *  Formula: Rf (10Y ~policyRate-2%) + ERP (~6%) + sector beta premium.
 *  More accurate than a static 30%. */
function estimatedCoE(sector: string, policyRate?: number | null): number {
  const rf = (policyRate ?? 42.5) - 2;  // 10Y approx
  const erp = 6;
  const sectorBeta: Record<string, number> = {
    banking: 1.1, holding: 0.95, aviation: 1.3, steel: 1.2,
    telecom: 0.85, defense: 0.9, refinery: 1.15, retail: 0.9,
    industrial: 1.0, energy: 1.05, insurance: 0.95, reit: 0.8,
  };
  const beta = sectorBeta[sector] ?? 1.0;
  return rf + erp * beta;
}

/** Quartile label from value vs sector P25/P50/P75. */
function quartileLabel(val: number, pcts: { p25: number; p50: number; p75: number }): string {
  if (val >= pcts.p75) return 'üst çeyrek (Q4)';
  if (val >= pcts.p50) return 'medyanın üzerinde (Q3)';
  if (val >= pcts.p25) return 'medyanın altında (Q2)';
  return 'alt çeyrek (Q1)';
}

/** Profitability paragraph — sector-aware quartile analysis, institutional prose. */
export function commentaryProfitability(inputs: ProfitabilityInputs): string {
  const parts: string[] = [];
  const gm = numOrNull(inputs.grossMargin);
  const em = numOrNull(inputs.ebitdaMargin);
  const nm = numOrNull(inputs.netMargin);
  const roe = numOrNull(inputs.roe);
  const th = sectorThresholds(inputs.sector);

  if (gm != null && th.gm) {
    const q = quartileLabel(gm, th.gm);
    parts.push(`Brüt marj ${fmtPct(gm)} ile sektör dağılımında ${q} konumunda (sektör P50: ${fmtPct(th.gm.p50)}). ${gm >= th.gm.p75 ? 'Fiyatlama gücü ve/veya maliyet avantajı belirgin bir rekabet üstünlüğünü yansıtıyor.' : gm < th.gm.p25 ? 'Hammadde maliyetleri ve ürün karması baskısı brüt kârlılığı sınırlamakta; marj iyileşmesi için fiyatlama veya tedarik zinciri optimizasyonu gerekli görünüyor.' : 'Maliyet yapısı ve ürün karması bu marj seviyesini destekleyen temel faktörler olarak değerlendiriliyor.'}`);
  }

  if (em != null) {
    const q = quartileLabel(em, th.em);
    parts.push(`FAVÖK marjı ${fmtPct(em)} seviyesinde; sektör dağılımında ${q} (sektör P50: ${fmtPct(th.em.p50)}). ${em >= th.em.p75 ? 'Operasyonel verimlilik ve ölçek ekonomisi güçlü nakit yaratma kapasitesini destekliyor.' : em < th.em.p25 ? 'Operasyonel maliyet baskısı belirgin; personel, enerji ve genel yönetim giderlerinde yapısal iyileştirme potansiyeli değerlendirilmeli.' : 'Nakit yaratma kapasitesi yeterli düzeyde olup finansman yükümlülüklerinin karşılanmasında makul esneklik sağlıyor.'}`);
  }

  // Margin interaction: high GM but low NM = OpEx or financing burden
  if (gm != null && nm != null && th.gm) {
    const gmSpread = gm - nm;
    if (gm >= th.gm.p50 && nm < th.nm.p25) {
      parts.push(`Dikkat çekici bir marj sıkışması gözlemleniyor: brüt marj güçlü (${fmtPct(gm)}) olmasına rağmen, net marj (${fmtPct(nm)}) sektör alt çeyreğinde kalmakta. Bu ayrışma, yüksek operasyonel giderler, ağır finansman yükü veya tek seferlik zararlar kaynaklı olabilir; kâr kalitesinin sorgulanmasını gerektiriyor.`);
    } else if (gmSpread > 25 && nm >= th.nm.p50) {
      parts.push(`Brüt marjdan net marjına düşüş (${fmtPct(gmSpread)} puan) operasyonel ve finansman giderlerinin ağırlığını yansıtsa da, net kârlılık sektör medyanının üzerinde korunmakta.`);
    }
  }

  if (nm != null) {
    const q = quartileLabel(nm, th.nm);
    parts.push(`Net kâr marjı ${fmtPct(nm)} olup sektör dağılımında ${q} (sektör P50: ${fmtPct(th.nm.p50)}). Finansman giderleri, vergi etkileri ve tek seferlik kalemler bu marjın oluşmasında belirleyici rol oynuyor.`);
  }

  if (roe != null) {
    const coe = estimatedCoE(inputs.sector);
    const q = quartileLabel(roe, th.roe);
    const spread = roe - coe;
    const verdict = spread > 5 ? 'özsermaye maliyetini belirgin biçimde aşarak pay sahibi değeri yaratan'
                  : spread > 0 ? 'özsermaye maliyetini sınırlı ölçüde aşan'
                  : spread > -5 ? 'özsermaye maliyetine yakın seyreden'
                  : 'özsermaye maliyetinin önemli ölçüde altında kalan ve değer erozyonuna işaret eden';
    parts.push(`Özsermaye kârlılığı (ROE) ${fmtPct(roe)} düzeyinde; sektör dağılımında ${q} (sektör P50: ${fmtPct(th.roe.p50)}). Tahmini TRY özsermaye maliyeti (${fmtPct(coe, 0)}) referans alındığında, bu getiri ${verdict} bir konumlanma ortaya koyuyor.`);
  }

  return parts.join(' ');
}


interface LeverageInputs {
  netDebt?: number | null;
  ebitda?: number | null;
  totalEquity?: number | null;
  currentRatio?: number | null;
  interestCoverage?: number | null;
  sector: string;
}


export function commentaryLeverage(inputs: LeverageInputs): string {
  const parts: string[] = [];
  const nd = numOrNull(inputs.netDebt);
  const eb = numOrNull(inputs.ebitda);
  const eq = numOrNull(inputs.totalEquity);
  const cr = numOrNull(inputs.currentRatio);
  const ic = numOrNull(inputs.interestCoverage);

  // Sector-specific ND/EBITDA thresholds
  const ndEbThresh: Record<string, { safe: number; warning: number; critical: number }> = {
    banking: { safe: 0, warning: 0, critical: 0 },
    holding: { safe: 2.5, warning: 4, critical: 6 },
    aviation: { safe: 3, warning: 5, critical: 7 },
    steel: { safe: 2, warning: 3.5, critical: 5 },
    telecom: { safe: 2.5, warning: 4, critical: 6 },
    refinery: { safe: 1.5, warning: 3, critical: 4.5 },
    retail: { safe: 1.5, warning: 2.5, critical: 4 },
    defense: { safe: 1.5, warning: 3, critical: 5 },
    industrial: { safe: 2, warning: 3.5, critical: 5 },
  };
  const thresh = ndEbThresh[inputs.sector] ?? ndEbThresh.industrial;

  if (nd != null && eb && eb > 0 && inputs.sector !== 'banking') {
    const ratio = nd / eb;
    const verdict = ratio < thresh.safe ? 'konservatif kaldıraç profilinde'
                  : ratio < thresh.warning ? 'kabul edilebilir kaldıraç seviyesinde'
                  : ratio < thresh.critical ? 'yükselmiş kaldıraç nedeniyle yakın izlenmesi gereken'
                  : 'kredi derecelendirme kuruluşlarının eşiklerini aşan, refinansman riski taşıyan';
    parts.push(`Net Borç/FAVÖK oranı ${ratio.toFixed(2)}x seviyesinde olup sektör bağlamında ${verdict} bir yapı sergiliyor (sektör güvenli eşik: <${thresh.safe.toFixed(1)}x). ${ratio >= thresh.warning ? 'Yükselen finansman maliyetleri ve potansiyel kredi notu baskısı yakın dönem riskleri arasında; borç vadesinin yeniden yapılandırma olasılığı değerlendirilmeli.' : 'Bu kaldıraç düzeyi yeni yatırım ve stratejik satın almalar için borçlanma kapasitesi sağlıyor.'}`);
  }

  if (nd != null && eq && eq > 0) {
    const d2e = nd / eq;
    const label = d2e < 0.3 ? 'konservatif sermaye yapısı (düşük kaldıraç)'
                : d2e < 0.7 ? 'dengeli borç-özsermaye karışımı'
                : d2e < 1.2 ? 'agresif finansman kullanımı'
                : 'yüksek kaldıraçlı yapı — özsermayeyi aşan borç yükü';
    parts.push(`Net Borç/Özsermaye oranı ${fmtPct(d2e * 100, 1)} düzeyinde; bu ${label} olarak değerlendiriliyor.`);
  }

  if (cr != null) {
    const verdict = cr >= 2.0 ? 'güçlü kısa vadeli likidite tamponu sağlayan'
                  : cr >= 1.5 ? 'yeterli likidite esnekliğine sahip'
                  : cr >= 1.0 ? 'asgari likidite dengesini koruyan'
                  : 'kısa vadeli likidite baskısı altında olan';
    parts.push(`Cari oran ${cr.toFixed(2)}x ile ${verdict} bir bilanço yapısını yansıtıyor.${cr < 1 ? ' Dönen varlıkların kısa vadeli yükümlülükleri karşılayamaması, işletme sermayesi yönetiminde acil iyileştirme ihtiyacını ortaya koyuyor.' : ''}`);
  }

  if (ic != null) {
    const verdict = ic >= 6 ? 'güçlü faiz karşılama kapasitesi gösteren'
                  : ic >= 3 ? 'yeterli düzeyde faiz yükümlülüklerini karşılayan'
                  : ic >= 1.5 ? 'sınırlı faiz karşılama marjıyla operasyonel baskıya duyarlı'
                  : 'yetersiz faiz karşılama oranıyla finansal stres riski taşıyan';
    parts.push(`Faiz karşılama oranı (ICR) ${ic.toFixed(2)}x seviyesinde olup ${verdict} bir yapı çiziyor.${ic < 1.5 ? ' Bu düzey, borç yeniden yapılandırma veya sermaye artırımı ihtiyacını gündeme getirebilir.' : ''}`);
  }

  return parts.join(' ');
}


interface CashflowInputs {
  ocf?: number | null;
  capex?: number | null;
  fcf?: number | null;
  netIncome?: number | null;
  dividendsPaid?: number | null;
  sector: string;
}


export function commentaryCashflow(inputs: CashflowInputs): string {
  const parts: string[] = [];
  const ocf = numOrNull(inputs.ocf);
  const capex = numOrNull(inputs.capex);
  const fcf = numOrNull(inputs.fcf);
  const ni = numOrNull(inputs.netIncome);
  const dv = numOrNull(inputs.dividendsPaid);

  if (ocf != null && ni != null && ni !== 0) {
    const quality = ocf / ni;
    const verdict = quality >= 1 ? 'net kârı destekleyen ve yüksek kaliteli kârlılığı gösteren' : quality >= 0.6 ? 'net kârı orta düzeyde destekleyen' : 'net kârdan belirgin şekilde ayrışan ve işletme sermayesi tüketimine işaret eden';
    parts.push(`Operasyonel nakit akışı / net kâr oranı ${quality.toFixed(2)}x seviyesinde olup ${verdict} bir tablo ortaya koyuyor. ${quality < 0.6 ? 'Nakit kalitesi göstergesi değerlendirilmeli — alacaklar ve stoklardaki artışların işletme sermayesi üzerindeki etkisi sorgulanmalı.' : ''}`);
  }

  if (fcf != null) {
    const verdict = fcf > 0 ? 'pozitif serbest nakit yaratımı sağlayan' : 'negatif serbest nakit akışıyla dış finansmana bağımlı kalan';
    parts.push(`Şirket ${verdict} bir nakit profiline sahip. ${fcf < 0 ? 'Negatif FCF döneminin kalıcı hâle gelmesi halinde borçlanma ve sermaye artırımı seçenekleri gündeme gelebilir.' : 'Pozitif FCF temettü ve borç ödemesi için esneklik sağlıyor.'}`);
  }

  if (capex != null && capex !== 0 && ocf != null) {
    const reinvest = Math.abs(capex) / Math.abs(ocf);
    parts.push(`CAPEX / OCF oranı ${(reinvest * 100).toFixed(1)}% seviyesinde olup şirketin ${reinvest > 0.7 ? 'operasyonel nakit akışının önemli bir kısmını büyüme ve bakım yatırımlarına kanalize ettiğini' : reinvest > 0.4 ? 'operasyonel nakit akışının orta düzeyde bir kısmını yatırıma ayırdığını' : 'operasyonel nakit akışının sınırlı bir kısmını yatırıma ayırdığını'} gösteriyor.`);
  }

  if (dv != null && ni && ni > 0) {
    const payout = Math.abs(dv) / Math.abs(ni);
    const verdict = payout > 0.8 ? 'agresif temettü politikası' : payout > 0.4 ? 'dengeli temettü politikası' : 'konservatif temettü politikası';
    parts.push(`Payout ratio yaklaşık %${(payout * 100).toFixed(0)} seviyesinde olup ${verdict} sergileniyor.`);
  }

  return parts.join(' ');
}


interface FinancialIntroInputs {
  ticker: string;
  sectorTr: string;
  revenue?: number | null;
  netIncome?: number | null;
  totalAssets?: number | null;
  totalEquity?: number | null;
  netDebt?: number | null;
  periodLabel?: string;
}


/** Kick-off paragraph for Section III — contextualizes the financial
 *  picture before the tables kick in. */
export function commentaryFinancialIntro(inputs: FinancialIntroInputs): string {
  const rev = numOrNull(inputs.revenue);
  const ni = numOrNull(inputs.netIncome);
  const ta = numOrNull(inputs.totalAssets);
  const eq = numOrNull(inputs.totalEquity);
  const period = inputs.periodLabel ?? 'son dönem';

  const parts: string[] = [];

  if (rev != null && ta != null && eq != null) {
    parts.push(`${inputs.ticker}, ${inputs.sectorTr} sektöründe ${period} itibarıyla ${(rev / 1_000_000_000).toFixed(1)} milyar TL hasılat üreten, ${(ta / 1_000_000_000).toFixed(1)} milyar TL bilanço büyüklüğüne ve ${(eq / 1_000_000_000).toFixed(1)} milyar TL özsermayeye sahip bir şirket olarak değerlendirildi.`);
  }

  if (ni != null && rev != null && rev > 0) {
    const margin = ni / rev;
    parts.push(`Net kâr marjı ${(margin * 100).toFixed(2)}% seviyesinde oluşurken, bu profil ${inputs.sectorTr} ortalamasıyla birlikte aşağıda detaylandırılan oran analizinde karşılaştırmalı olarak yorumlanıyor.`);
  }

  parts.push(`Aşağıdaki tablolar son dönem bilanço, gelir tablosu ve nakit akışının yanı sıra 5 yıllık trend ve oran seyrini gösteriyor. Her bir tabloyu takiben yapılan yorum, metriğin mutlak değeri yanında yön ve sektörel konumu üzerinden değerlendiriliyor.`);

  return parts.join(' ');
}


interface ExecSummaryInputs {
  ticker: string;
  sectorTr: string;
  qaScore?: number | null;
  convergenceScore?: number | null;
  recPassRate?: number | null;
  revenue?: number | null;
  netIncome?: number | null;
  roe?: number | null;
  piotroskiF?: number | null;
  altmanZ?: number | null;
  criticalFlagCount: number;
}


export function commentaryExecSummary(inputs: ExecSummaryInputs): string {
  const parts: string[] = [];

  const qa = numOrNull(inputs.qaScore);
  const cs = numOrNull(inputs.convergenceScore);
  const roe = numOrNull(inputs.roe);
  const rev = numOrNull(inputs.revenue);

  if (qa != null && cs != null) {
    const qaVerdict = qa >= 0.85 ? 'yüksek kalite' : qa >= 0.7 ? 'yeterli kalite' : 'sınırlı kalite';
    const csVerdict = cs >= 0.4 ? 'pozitif konverjans' : cs >= 0 ? 'karışık ama hafif pozitif' : cs >= -0.4 ? 'karışık ama hafif negatif' : 'negatif konverjans';
    parts.push(`${inputs.ticker} için üretilen kapsamlı analizde QA skoru ${qa.toFixed(2)} ile ${qaVerdict} standardında, sinyal konverjansı ${cs >= 0 ? '+' : ''}${cs.toFixed(2)} ile ${csVerdict} göstermektedir.`);
  }

  if (roe != null && rev != null) {
    parts.push(`Şirket ${(rev / 1_000_000_000).toFixed(1)} milyar TL hasılat üreterek ${fmtPct(roe)} özsermaye kârlılığıyla ${inputs.sectorTr} sektöründe konumlanmaktadır.`);
  }

  const pf = numOrNull(inputs.piotroskiF);
  if (pf != null) {
    const pfVerdict = pf >= 7 ? 'güçlü finansal sağlık' : pf >= 4 ? 'orta düzey finansal sağlık' : 'zayıf finansal sağlık';
    parts.push(`Piotroski F-skoru ${pf.toFixed(0)}/9 ile ${pfVerdict} profilini doğrular.`);
  }

  if (inputs.criticalFlagCount > 0) {
    parts.push(`Raporda ${inputs.criticalFlagCount} kritik kırmızı bayrak tespit edilmiştir; bunların detayı sonraki bölümlerde ele alınmıştır.`);
  } else {
    parts.push(`Rapor kapsamında kritik bir kırmızı bayrak tespit edilmemiş, ancak izlenmesi gereken orta düzey risk faktörleri ilgili bölümlerde detaylandırılmıştır.`);
  }

  parts.push(`Aşağıdaki skor kartı, ilgili bölümlere hızlı erişim için konumlandırılmış ve detay analizlerin referans noktasını oluşturmaktadır.`);

  return parts.join(' ');
}


interface ValuationIntroInputs {
  ticker: string;
  sector: string;
  dcfPerShare?: number | null;
  lastClose?: number | null;
  wacc?: number | null;
  terminalG?: number | null;
  tryWaccWarning: boolean;
  holdingSotp: boolean;
  bankingWarn: boolean;
}


export function commentaryValuation(inputs: ValuationIntroInputs): string {
  const parts: string[] = [];
  const dcf = numOrNull(inputs.dcfPerShare);
  const lc = numOrNull(inputs.lastClose);
  const wacc = numOrNull(inputs.wacc);

  if (inputs.bankingWarn) {
    parts.push(`${inputs.ticker} bankacılık sektöründe faaliyet gösterdiği için FCF bazlı DCF yöntemi uygun değil; değerleme için DDM (Dividend Discount Model) veya artan getiri (Excess Return) modeli tercih edilmeli.`);
  } else if (inputs.holdingSotp) {
    parts.push(`${inputs.ticker} holding yapısı nedeniyle konsolide DCF bir üst sınır niteliği taşıyor; ana değerleme metodolojisi SOTP (Sum-of-the-Parts) olmalı — her bir iştirak ayrı değerlenip holding indirimiyle birleştirilmeli.`);
  } else if (dcf != null && lc != null) {
    const upside = (dcf / lc - 1) * 100;
    const verdict = upside > 30 ? 'önemli yukarı yönlü potansiyel' : upside > 10 ? 'makul yukarı yönlü potansiyel' : upside > -10 ? 'güncel fiyat seviyesinde makul' : 'güncel fiyat seviyesinde pahalı';
    parts.push(`DCF modeline göre hesaplanan hisse başına değer ${dcf.toFixed(2)} TL olup, ${lc.toFixed(2)} TL'lik güncel piyasa fiyatına kıyasla ${upside >= 0 ? '+' : ''}${upside.toFixed(1)}% ${verdict} bir konumlanma sergilemektedir.`);
  }

  if (inputs.tryWaccWarning) {
    parts.push(`⚠ Metodoloji uyarısı: Kullanılan WACC ${fmtPct((wacc ?? 0) * 100, 1)} seviyesinde olup TRY bazlı bir iskonto oranına karşılık gelebilir. Yüksek enflasyon ortamında faaliyet gösteren Türk şirketlerinde TRY bazlı WACC kullanımı, yüksek nominal iskonto oranı nedeniyle DCF sonucunu sistematik olarak düşük hesaplatabilir. USD bazlı serbest nakit akışı ve USD WACC ile yapılacak değerleme daha güvenilir sonuçlar üretecektir.`);
  }

  if (wacc != null) {
    parts.push(`Değerlemede kullanılan WACC ${(wacc * 100).toFixed(1)}% seviyesinde; terminal büyüme ${((numOrNull(inputs.terminalG) ?? 0.03) * 100).toFixed(1)}% varsayılmıştır. Aşağıdaki senaryo tablosu WACC ±200bps ve terminal g ±50bps duyarlılığını yansıtır.`);
  }

  parts.push(`Senaryo analizinde Bull durumunda sektörel katalizörlerin (yeni kapasite, marj iyileşmesi, makro destek) eş zamanlı materyalize olması, Bear durumunda ise kaldıraç artışı ve marj erozyonunun birleşik etkisi modellenmiştir.`);

  return parts.join(' ');
}


interface RiskInputs {
  criticalFlags: Array<{ code: string; message?: string }>;
  warningFlags: Array<{ code: string; message?: string }>;
  divergences: string[];
  tryWaccWarning: boolean;
  holdingSotp: boolean;
  sector: string;
}


const RISK_CODE_TR: Record<string, string> = {
  'LIQUIDITY_TIGHT': 'Likidite Sıkışıklığı',
  'DEBT_RISK': 'Borçluluk Riski',
  'HIGH_LEVERAGE': 'Yüksek Kaldıraç',
  'MARGIN_EROSION': 'Marj Erozyonu',
  'NEGATIVE_FCF': 'Negatif Serbest Nakit Akışı',
  'LOW_COVERAGE': 'Düşük Faiz Karşılama',
  'ALTMAN_DISTRESS': 'Altman Z Distress Bölgesi',
  'PIOTROSKI_WEAK': 'Zayıf Piotroski Skoru',
  'CURRENCY_MISMATCH': 'Döviz Uyumsuzluğu',
  'RELATED_PARTY': 'İlişkili Taraf Riski',
  'GOVERNANCE_FLAG': 'Yönetişim Uyarısı',
  'DIVIDEND_CUT': 'Temettü Kesintisi Riski',
  'CAPEX_OVERRUN': 'Yatırım Bütçe Aşımı',
  'REVENUE_DECLINE': 'Gelir Düşüşü',
  'WORKING_CAPITAL_STRESS': 'İşletme Sermayesi Baskısı',
};

export function translateRiskCode(code: string): string {
  return RISK_CODE_TR[code] ?? code.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, c => c.toLocaleUpperCase('tr-TR'));
}


export function commentaryRisk(inputs: RiskInputs): string {
  const parts: string[] = [];

  if (inputs.criticalFlags.length > 0) {
    const codes = inputs.criticalFlags.slice(0, 3).map(f => translateRiskCode(f.code)).join(', ');
    parts.push(`Rapor, ${inputs.criticalFlags.length} kritik risk faktörü tespit etmiştir (${codes}). Bu faktörler yatırım tezini doğrudan etkileyebilecek yapıda olup, yakın izlenme gerektirmektedir.`);
  }

  if (inputs.warningFlags.length > 0) {
    parts.push(`${inputs.warningFlags.length} orta düzey uyarı mevcut — bunlar doğrudan yatırım kararını bozmasa da raporlama ve izleme açısından takip edilmeli.`);
  }

  if (inputs.divergences.length > 0) {
    parts.push(`Sinyal kaynakları arasında ${inputs.divergences.length} sapma tespit edilmiştir; farklı kaynakların birbirini doğrulamayan sinyalleri bulunması yatırım tezinin konfidans seviyesini sınırlamaktadır.`);
  }

  if (inputs.tryWaccWarning) {
    parts.push(`TRY WACC tuzağı riski mevcut — değerleme metodolojisi USD bazlı dönüşüme çevrilmedikçe DCF sonuçları ciddi hata payı taşıyabilir.`);
  }

  // Sector-specific risk narratives
  const sectorRiskNarrative: Record<string, string> = {
    banking: `Bankacılık sektöründe ana risk faktörleri: (i) net faiz marjı sıkışması — TCMB politika faizi değişimleri NIM üzerinde doğrudan etki yaratıyor, (ii) kredi riski — takipteki alacaklar (NPL) artışı ve karşılık yükü, (iii) BDDK sermaye yeterliliği revizyonları ve makro-ihtiyati önlemler, (iv) döviz pozisyonu açığı ve kur volatilitesi.`,
    holding: `Holding yapısında başlıca riskler: (i) iştirak seviyesindeki operasyonel sorunların konsolide tabloya yansıması, (ii) sektörel konsantrasyon riski — portföyün belirli sektörlere aşırı ağırlığı, (iii) piyasa değerlemesinde konglomerat indirimi genişlemesi, (iv) iştirakler arası kaynak tahsisi verimsizliği.`,
    aviation: `Havacılık sektörü riskleri: (i) yakıt maliyeti — toplam giderlerin %25-30'u, Brent fiyatına doğrudan duyarlı, (ii) döviz kuru — gelirin %80-90'ı hard currency, borç servisi USD bazlı, (iii) jeopolitik hava sahası kısıtlamaları ve slot kayıpları, (iv) turist taşımacılığı mevsimselliği ve makro tüketim baskısı.`,
    steel: `Demir-çelik sektörü riskleri: (i) hammadde fiyat volatilitesi (demir cevheri, kok kömürü, hurda), (ii) CBAM 2026+ karbon maliyeti — ihracat kanalında ek yük, (iii) Çin fazla kapasitesi ve dumping baskısı, (iv) EPDK enerji tarifesi artışları üretim maliyetini doğrudan etkiliyor.`,
    defense: `Savunma sektörü riskleri: (i) kamu alım bütçesi kesintileri veya proje ertelemesi — gelirin büyük kısmı SSB/TSK projeleri, (ii) ithal komponent tedarik zinciri aksamaları ve yaptırım riskleri, (iii) ihracat lisansı engelleri ve jeopolitik müşteri riski, (iv) Ar-Ge geri dönüş süresinin uzunluğu ve teknoloji eskimesi.`,
    telecom: `Telekomünikasyon sektörü riskleri: (i) BTK tarife düzenlemeleri fiyatlama esnekliğini sınırlıyor, (ii) 5G yatırım döngüsü yüksek CAPEX gerektiriyor — finansman maliyeti baskısı, (iii) ARPU büyümesinin enflasyonun altında kalma riski, (iv) sayısal vergi ve düzenleyici yük artışı.`,
    refinery: `Rafineri sektörü riskleri: (i) crack spread daralması — küresel rafine kapasitesi artışı, (ii) Brent petrol fiyat volatilitesi stok değerleme etkisi, (iii) çevresel düzenleme sıkılaşması ve karbon maliyeti, (iv) TL zayıflamasının yurt içi talepte yaratacağı baskı.`,
    retail: `Perakende sektörü riskleri: (i) tüketici güveni düşüşü ve ihtiyari harcama daralması, (ii) gıda enflasyonu ve tedarik zinciri maliyetleri, (iii) minimum ücret artışlarının çift yönlü etkisi (maliyet + talep), (iv) online rekabet baskısı ve mağaza verimliliği erozyonu.`,
    energy: `Enerji sektörü riskleri: (i) EPDK tarife düzenlemeleri gelir tavanını belirliyor, (ii) kur riski — USD bazlı yatırım maliyetleri, (iii) yenilenebilir enerji yatırımlarında lisans ve çevresel izin süreçleri, (iv) küresel enerji fiyat volatilitesi ve arz güvenliği.`,
    industrial: `Sanayi sektöründe ana riskler: (i) hammadde fiyat volatilitesi ve tedarik zinciri aksamaları, (ii) enerji maliyet artışları (doğalgaz, elektrik), (iii) döviz kuru — ithal girdi bağımlılığı, (iv) iç ve dış talep yavaşlaması.`,
  };
  const sectorRisk = sectorRiskNarrative[inputs.sector] ?? sectorRiskNarrative.industrial;
  parts.push(sectorRisk);

  parts.push(`Risk matrisi (etki × olasılık) yukarıda tespit edilen faktörleri 3×3 grid üzerinde konumlandırmakta ve yakın izleme önceliğini görsel olarak iletmektedir.`);

  return parts.join(' ');
}


interface CompanyProfileInputs {
  ticker: string;
  sectorTr: string;
  sector: string;
  periodLabel?: string;
  totalAssets?: number | null;
  totalEquity?: number | null;
  revenue?: number | null;
  netIncome?: number | null;
}


export function commentaryCompanyProfile(inputs: CompanyProfileInputs): string {
  const parts: string[] = [];

  const rev = numOrNull(inputs.revenue);
  const eq = numOrNull(inputs.totalEquity);
  const ta = numOrNull(inputs.totalAssets);

  if (rev != null && eq != null && ta != null) {
    parts.push(`${inputs.ticker}, Borsa İstanbul'da işlem gören ${inputs.sectorTr} sektöründen bir şirket olup ${inputs.periodLabel ?? 'son dönem'} itibarıyla ${(rev / 1_000_000_000).toFixed(1)} milyar TL hasılat, ${(eq / 1_000_000_000).toFixed(1)} milyar TL özsermaye ve ${(ta / 1_000_000_000).toFixed(1)} milyar TL bilanço büyüklüğüne ulaşmıştır.`);
  }

  const sectorDesc: Record<string, string> = {
    industrial: `Faaliyet alanı sanayi ve üretim odaklı olup; kapasite kullanım oranı, hammadde tedariki ve ihracat performansı operasyonel temel göstergeler arasında. Yerel pazar dinamiklerinin yanı sıra uluslararası talep ve rekabet koşulları doğrudan kâr yapısını şekillendirmektedir.`,
    banking: `Bankacılık ana faaliyet alanı olup mevduat tabanı, kredi portföyü, sermaye yeterliliği ve net faiz marjı üzerinden performans sergilemekte. TCMB para politikası ve BDDK düzenlemeleri sektör dinamiklerini belirleyen temel unsurlar arasında yer alıyor.`,
    holding: `Holding yapısında faaliyet gösteren şirket, birden fazla iştirak aracılığıyla farklı sektörlerde konumlanmakta. Portföy kompozisyonu, iştirak seviyesindeki operasyonel performanslar ve sermaye dağıtım politikası yatırımcı değerini şekillendiren başlıca faktörler.`,
    insurance: `Sigorta ana faaliyet kolu olan şirket, prim üretimi, rezerv yönetimi ve yatırım portföyü performansı üzerinden değer yaratmakta. SEDDK düzenlemeleri ve reasürans piyasası koşulları operasyonel dinamikleri etkileyen dış faktörler arasında.`,
    reit: `Gayrimenkul Yatırım Ortaklığı (GYO) yapısında faaliyet gösteren şirket, portföyündeki gayrimenkuller üzerinden kira ve değerleme geliri üretmekte. NAV (net aktif değer), portföy çeşitliliği ve kira doluluk oranı ana performans göstergeleri.`,
    aviation: `Havacılık sektöründe faaliyet gösteren şirket; yolcu trafiği (RPK/ASK), doluluk oranı (load factor), birim gelir (RASK) ve birim maliyet (CASK) operasyonel performansın temel göstergeleri arasında. Yakıt maliyeti toplam giderlerin %25-30'unu oluştururken, döviz kuru (gelirin büyük kısmı USD/EUR bazlı), jeopolitik riskler ve hava sahası kısıtlamaları kârlılığı doğrudan etkileyen dış faktörler. Hub ağı kapasitesi, filo yapısı ve MRO (bakım-onarım) operasyonları uzun vadeli değer yaratmanın temelini oluşturmaktadır.`,
    steel: `Demir-çelik sektöründe faaliyet gösteren şirket; üretim kapasitesi, kapasite kullanım oranı, hammadde tedarik maliyetleri (cevher, hurda, enerji) ve ihracat performansı temel göstergeler arasında. CBAM düzenlemeleri karbon maliyetini artırırken, küresel çelik talebi ve Çin rekabeti fiyatlama gücünü belirlemektedir.`,
    telecom: `Telekomünikasyon sektöründe faaliyet gösteren şirket; abone bazı, ARPU (kullanıcı başına ortalama gelir), churn oranı ve data gelir payı operasyonel temel metrikleri. BTK düzenlemeleri, 5G yatırımları ve sayısal dönüşüm harcamaları sektör dinamiklerini şekillendirmektedir.`,
    energy: `Enerji sektöründe faaliyet gösteren şirket; üretim kapasitesi, kapasite faktörü, enerji fiyatları (EPDK tarifesi veya serbest piyasa) ve yatırım planları operasyonel performansın belirleyicileri. YEKDEM/YEKA mekanizmaları ve karbon hedefleri düzenleyici çerçeveyi oluşturmaktadır.`,
    refinery: `Rafineri sektöründe faaliyet gösteren şirket; crack spread (rafine marjı), kapasite kullanım oranı, ürün portföyü ve lojistik avantaj temel performans göstergeleri. Brent petrol fiyatı ve döviz kuru doğrudan kârlılığı etkileyen dış değişkenler.`,
    defense: `Savunma ve havacılık sanayiinde faaliyet gösteren şirket; sipariş defteri (backlog), yurt dışı ihracat oranı, Ar-Ge harcama yoğunluğu ve kamu alım programları temel göstergeler. SSB projeleri ve NATO standartları sektörel çerçeveyi belirlemektedir.`,
    retail: `Perakende sektöründe faaliyet gösteren şirket; mağaza sayısı, metrekare başına satış, sepet büyüklüğü ve özel marka penetrasyonu operasyonel temel metrikleri. Tüketici güveni, enflasyon ve gıda fiyatları sektörel dinamikleri şekillendirmektedir.`,
  };

  parts.push(sectorDesc[inputs.sector] ?? sectorDesc.industrial);

  parts.push(`Şirket Profili bölümü, yatırımcının şirketi doğru değerlendirebilmesi için gerekli kurumsal yapı, iş modeli ve segment bilgisini sunmayı amaçlamaktadır. Aşağıdaki tabloda temel kurumsal göstergeler özetlenmiş olup, ileride detaylandırılacak segment analizi ve yönetim kadrosu bilgisi bu bölümü tamamlayacaktır.`);

  return parts.join(' ');
}


interface ClosingInputs {
  ticker: string;
  convergenceScore?: number | null;
  qaScore?: number | null;
  dcfPerShare?: number | null;
  lastClose?: number | null;
  criticalFlagCount: number;
  catalystsCount: number;
  sectorTr: string;
}


interface SectorInputs {
  ticker: string;
  sectorTr: string;
  sector: string;
  benchmarksCount: number;
  peersCount: number;
  strengthsCount: number;
  weaknessesCount: number;
}


export function commentarySector(inputs: SectorInputs): string {
  const parts: string[] = [];

  const templates: Record<string, string> = {
    banking: `Bankacılık sektörü Türkiye'de kamu, özel ve yabancı sermayeli 30+ oyuncuyla yüksek rekabetçi bir yapıya sahip. Sektör dinamiklerinde net faiz marjı (NIM), takipteki krediler oranı (NPL), sermaye yeterliliği (CET1) ve kredi/mevduat oranı kritik göstergeler olarak öne çıkıyor. BDDK'nın makro ihtiyati politikaları, TCMB para politikası kararları ve enflasyon dinamikleri sektörel karlılığı doğrudan şekillendiriyor.`,
    holding: `Holding yapısı iştirak portföyü üzerinden değer yaratıyor; ana değerleme yaklaşımı Sum-of-the-Parts (SOTP) olup konsolide DCF bir üst sınır anlamı taşımaktadır. Piyasa genelde holding indirimi uygulayarak iştiraklerin bireysel piyasa değerlerinin altında fiyatlama yapmaktadır; bu indirimin tarihsel aralığı ve genişleme/daralma dönemleri yatırım tezinin önemli bir parçasıdır. Yönetim karar alma hızı, sermaye dağıtım politikası ve iştirakler arası sinerji yaratma kapasitesi holding primi/indirimini belirleyen faktörlerdir.`,
    industrial: `Sanayi sektörünün geneli maliyet yapısı, kapasite kullanım oranı ve ihracat karma riskine duyarlıdır. Hammadde fiyat volatilitesi, enerji maliyeti (özellikle EPDK kararları sonrası gaz ve elektrik fiyat artışları), döviz kuru hareketleri ve uluslararası talep dinamikleri operasyonel kârlılığı belirleyen temel dış değişkenler olarak öne çıkıyor. Turizm ve havacılık alt-segmentinde ise yolcu trafiği, yakıt hedge yapısı ve kapasite yönetimi başlıca performans göstergeleri.`,
    insurance: `Sigorta sektörü prim büyümesi, hasar/prim oranı (claim ratio), yatırım gelirleri ve reasürans dağılımı üzerinden analiz edilir. Yüksek enflasyon ortamında rezerv yeterliliği ve gerçekleşen zarar trendi yakından izlenmelidir; SEDDK'nın sermaye düzenlemeleri şirketlerin büyüme hızını doğrudan etkiliyor.`,
    reit: `Gayrimenkul yatırım ortaklığı (GYO) yapısında NAV (net aktif değer), P/NAV indirimi, kira geliri / FAVÖK profili ve portföy kompozisyonu kritik. Faiz oranları ve inşaat maliyet endeksleri doğrudan değerleme üzerinde etkili; portföy kalitesi ve coğrafi dağılım uzun vadeli kira akışı görünürlüğünü şekillendirir.`,
  };

  parts.push(templates[inputs.sector] ?? templates.industrial);

  if (inputs.benchmarksCount > 0) {
    parts.push(`Aşağıdaki benchmark tablosu ${inputs.peersCount > 0 ? `${inputs.peersCount} emsal şirkete göre` : 'sektör içindeki konumlanmaya göre'} ${inputs.benchmarksCount} temel metriği karşılaştırmaktadır. ${inputs.strengthsCount > 0 ? `${inputs.ticker} ${inputs.strengthsCount} metrikte üst çeyreğe yerleşirken` : ''}${inputs.weaknessesCount > 0 ? ` ${inputs.weaknessesCount} metrikte alt çeyrekte kalarak` : ''} sektör içinde diferansiye olmaktadır.`);
  } else {
    parts.push(`Emsal karşılaştırma için peer enrichment henüz sağlanmadığından tablonun dolması için ek veri gerekmektedir; Porter analizi ve SWOT matrisi sektörün niteliksel rekabet yapısını yansıtmaktadır.`);
  }

  parts.push(`Porter 5 Forces çerçevesinde sektörel rekabet baskısı, yeni giren tehdidi, ikame riski, tedarikçi ve alıcı pazarlık gücü aşağıda detaylandırılmıştır. SWOT analizi ise şirketin mevcut pozisyonunu Strengths/Weaknesses/Opportunities/Threats üzerinden özetlemektedir.`);

  return parts.join(' ');
}


interface MacroInputs {
  ticker: string;
  sectorTr: string;
  usdTry?: string | null;
  policyRate?: string | null;
  cpiYoy?: string | null;
  gdpYoy?: string | null;
}


export function commentaryMacro(inputs: MacroInputs): string {
  const parts: string[] = [];

  parts.push(`Türkiye makro ortamı rapor tarihi itibarıyla yüksek enflasyon, sıkı para politikası ve TL'nin seyri üzerinden şekillenmektedir. USD/TRY ${inputs.usdTry ?? '—'} seviyesinde; TCMB politika faizi ${inputs.policyRate ?? '—'} olup enflasyon dinamikleri ve kur geçişkenliği fiyat istikrarının en kritik değişkenleri arasında yer almaktadır.`);

  const sectorImpact: Record<string, string> = {
    industrial: `Sanayi sektöründe TL'nin değer kaybı ihracatçıya kısa vadeli avantaj sağlarken, ithalata bağlı hammadde maliyetlerini artırmakta; net etki şirketin ihracat/ithalat dengesi ile şekillenmektedir. TCMB sıkı para politikası finansman maliyetini artırarak yatırım kararlarını geciktirebilir.`,
    banking: `Bankacılık sektörü için faiz artışları genelde NIM genişlemesi fırsatı sunsa da kredi talebinin yavaşlaması ve NPL artışı karşı etki olarak devreye giriyor. TCMB'nin makro-prudansiyel araçları (zorunlu karşılıklar, BDDK likidite düzenlemeleri) doğrudan kâr yapısını etkilemektedir.`,
    holding: `Holding yapısı yüksek enflasyon ortamında iştirak seviyesinde farklılaşan sektör dinamikleriyle karşılaşmaktadır. İştirak portföyünün defansif-döngüsel dengesi, yüksek faiz ortamında hisse performansının ana belirleyicilerinden birisidir.`,
    insurance: `Sigorta şirketleri için yüksek enflasyon hem prim fiyatlamasını hem hasar trendini baskılamakta; reasürans koşulları sıkılaşmakta. Yatırım portföyünün getirisi ise hisse karlılığını destekleyen en önemli faktörlerden.`,
    reit: `GYO sektörü yüksek faiz ortamında değerleme baskısı altında; konut/ofis satış dinamikleri zayıflasa da kira gelirleri enflasyon endeksli artış göstermekte.`,
    aviation: `Havacılık sektöründe gelirin ~%80-90'ı USD/EUR bazlı olduğundan TL zayıflaması gelir tarafında olumlu etki yaratırken, USD bazlı borç servisi (uçak finansmanı) ve yakıt maliyeti (Brent) olumsuz baskı oluşturmaktadır. Brent petrol fiyatı ve jeopolitik hava sahası kısıtlamaları kısa vadeli kârlılığın en kritik dış değişkenleri.`,
    steel: `Demir-çelik sektöründe EPDK enerji tarifeleri doğrudan maliyet baskısı oluştururken, TL zayıflaması ihracat rekabet gücünü desteklemektedir. AB CBAM karbon düzenlemesi 2026'dan itibaren ihracat kanalında ek maliyet unsuru. Küresel çelik fazla kapasitesi ve Çin dumping riski fiyatlama gücünü sınırlamaktadır.`,
    defense: `Savunma sektöründe kamu alım bütçeleri ve SSB projeleri gelir görünürlüğünü belirlemektedir. TL zayıflaması USD bazlı sipariş defteri (backlog) değerini artırırken, ithal komponent maliyetlerini yükseltmektedir. **Jeopolitik bağlam:** İran-ABD gerilimi ve Hürmüz Boğazı kapanma riski küresel enerji fiyatlarını yukarı çekerken, bölgesel güvenlik kaygılarını artırarak savunma harcamalarına olumlu his yaratmaktadır. Rusya-Ukrayna çatışmasının devamı NATO üyelerinin savunma bütçelerini GDP'nin %2+'sine çıkarma baskısını sürdürmekte — bu Türk savunma sanayii ihracatı için yapısal talep artışı anlamına gelmektedir. Ortadoğu'daki tırmanan gerilimler, elektronik harp, İHA/SİHA ve hava savunma sistemlerine olan küresel talebi artırmakta; bu durum ASELSAN gibi yerli savunma şirketlerinin sipariş defterini olumlu etkilemektedir.`,
    telecom: `Telekomünikasyon sektöründe ARPU artışı enflasyona paralel seyir gösterirken, yüksek CAPEX gerektiren 5G yatırımları finansman maliyeti baskısı altında. BTK tarife düzenlemeleri ve sayısal vergi politikaları sektörel marjları doğrudan etkilemektedir.`,
    energy: `Enerji sektöründe EPDK tarife düzenlemeleri ve YEKDEM/YEKA mekanizmaları gelir tavanını belirlerken, TL zayıflaması USD bazlı enerji yatırımlarının geri dönüş süresini kısaltmaktadır. Küresel enerji fiyatları ve karbon hedefleri yatırım kararlarını yönlendirmektedir.`,
    refinery: `Rafineri sektöründe crack spread (rafine marjı) ve Brent petrol fiyatı kârlılığın temel belirleyicileri. TL zayıflaması yurt içi pompa fiyatlarını artırarak talep baskısı oluştururken, ihracat kanalında rekabet avantajı sağlamaktadır.`,
    retail: `Perakende sektöründe yüksek enflasyon tüketici güvenini ve harcama kalıplarını doğrudan etkilemektedir. Gıda enflasyonu özelinde defansif talep korunurken, ihtiyari harcamalar baskı altında. Minimum ücret artışları hem maliyet hem talep tarafını eş zamanlı etkilemektedir.`,
  };

  const sectorKey = inputs.sectorTr === 'Bankacılık' ? 'banking'
                  : inputs.sectorTr === 'Holding' ? 'holding'
                  : inputs.sectorTr === 'Sigorta' ? 'insurance'
                  : inputs.sectorTr === 'GYO' ? 'reit'
                  : inputs.sectorTr === 'Havacılık' ? 'aviation'
                  : inputs.sectorTr === 'Demir-Çelik' ? 'steel'
                  : inputs.sectorTr === 'Savunma' ? 'defense'
                  : inputs.sectorTr === 'Telekomünikasyon' ? 'telecom'
                  : inputs.sectorTr === 'Enerji' ? 'energy'
                  : inputs.sectorTr === 'Rafineri' ? 'refinery'
                  : inputs.sectorTr === 'Perakende' ? 'retail'
                  : 'industrial';
  parts.push(sectorImpact[sectorKey]);

  parts.push(`Küresel dinamiklerde petrol fiyatları, emtia trendleri ve FED politikaları TL üzerindeki dolaylı baskıyı belirleyen faktörler arasında. Jeopolitik gelişmeler (Ukrayna, Orta Doğu) ${inputs.sectorTr} sektöründe doğrudan veya dolaylı etkiye sahiptir.`);

  return parts.join(' ');
}


interface TechnicalInputs {
  trend?: string;
  rsi?: number | null;
  lastClose?: number | null;
  volumeAvg?: number | null;
}


export function commentaryTechnical(inputs: TechnicalInputs): string {
  const parts: string[] = [];
  const trend = (inputs.trend ?? '').toLowerCase();
  const rsi = numOrNull(inputs.rsi);

  if (trend === 'bullish') {
    parts.push(`Teknik görünüm kısa-orta vadede yükseliş trendini koruyor; fiyat hareketli ortalamaların üzerinde seyrederken momentum göstergeleri pozitif bölgede bulunuyor.`);
  } else if (trend === 'bearish') {
    parts.push(`Teknik görünüm düşüş trendinde; fiyat hareketli ortalamaların altında ve momentum göstergeleri satış baskısını yansıtıyor.`);
  } else {
    parts.push(`Teknik görünüm nötr/yatay trendde; fiyat hareketli ortalamalar ile hacim göstergeleri net bir yön sinyali vermiyor.`);
  }

  if (rsi != null) {
    if (rsi >= 70) parts.push(`RSI(14) ${rsi.toFixed(1)} seviyesinde olup aşırı alım bölgesinde bulunuyor; kısa vadeli düzeltme riski yükselmiş durumda.`);
    else if (rsi <= 30) parts.push(`RSI(14) ${rsi.toFixed(1)} seviyesinde ve aşırı satım bölgesinde; tepki alımı olasılığı artmış durumda.`);
    else if (rsi >= 55) parts.push(`RSI(14) ${rsi.toFixed(1)} ile pozitif momentum bölgesinde.`);
    else if (rsi <= 45) parts.push(`RSI(14) ${rsi.toFixed(1)} ile zayıf momentum bölgesinde.`);
    else parts.push(`RSI(14) ${rsi.toFixed(1)} nötr momentum bölgesinde.`);
  }

  parts.push(`Destek ve direnç seviyeleri son 60 günlük fiyat aralığından türetilmiş olup, fiyatın bu seviyelerden gösterdiği reaksiyon kısa vadeli trading kararları için referans noktaları olarak kullanılabilir. Kapanışın bu seviyelerin yukarı/aşağı kırılması yeni yön sinyali olarak değerlendirilmelidir.`);

  return parts.join(' ');
}


interface ESGInputs {
  sector: string;
  cbamTotalEur?: number | null;
  scope1?: number | null;
}


export function commentaryEsg(inputs: ESGInputs): string {
  const parts: string[] = [];

  const sectorESG: Record<string, string> = {
    industrial: `Sanayi sektörü ESG profilinde Çevresel (E) boyut öne çıkıyor: Scope 1 ve Scope 2 emisyonları, AB CBAM (Sınır Karbon Düzenleme Mekanizması) maruziyeti ve enerji tüketim yoğunluğu en kritik göstergeler. Sosyal (S) boyutta işçi sağlığı ve iş güvenliği, çalışan devamlılığı ve tedarik zinciri insan hakları denetimleri önemli. Yönetişim (G) tarafında bağımsız yönetim kurulu oranı, ilişkili taraf işlemleri ve şeffaflık uygulamaları değerlendirme unsurlarıdır.`,
    banking: `Bankacılık sektöründe ESG yaklaşımı kredi portföyünün karbon yoğunluğu, sürdürülebilir finans ürünleri (yeşil tahvil, yeşil kredi) payı ve iklim değişikliği stres testlerine bağlı. Sosyal boyutta dijital erişim, ücret dengesi ve müşteri şikayet yönetimi değerlendirilir. Yönetişim kriterleri arasında yönetim kurulu bağımsızlığı, risk komiteleri yapısı ve siber güvenlik uygulamaları öne çıkıyor.`,
    holding: `Holding yapısında ESG değerlendirmesi iştirak bazlı yapılıyor; konsolide ESG skoru ağırlıklı ortalamayı yansıtmakta. Çevresel risk iştiraklerin sektörlerine göre farklılaşırken sosyal ve yönetişim uygulamaları holding düzeyinde standardize edilebiliyor. Holding'in sermaye yapısı ve uzun vadeli strateji açıklamaları yatırımcılar için önemli ESG sinyalleri.`,
    insurance: `Sigorta sektöründe ESG perspektifinde iklim değişikliği kaynaklı hasar riskine karşı portföy ayarlamaları, yatırım portföyünün ESG uyumu ve ürün portföyündeki sürdürülebilir seçenekler önemli. Sosyal boyut çalışan çeşitliliği ve adil fiyatlama uygulamalarıyla şekillenir.`,
    reit: `GYO sektörü ESG tarafında bina enerji verimliliği (LEED, BREEAM sertifikaları), yenilenebilir enerji kullanımı ve yeşil alan oranı ön plana çıkıyor. Sosyal boyut erişilebilirlik ve kiracı memnuniyeti, yönetişim ise portföy değerleme şeffaflığıyla ilişkili.`,
    aviation: `Havacılık sektörü ESG profilinde Çevresel (E) boyut en kritik alan: CO₂ emisyon yoğunluğu, CORSIA (Uluslararası Havacılık Karbon Denkleştirme ve Azaltma Planı) uyumu, SAF (Sürdürülebilir Havacılık Yakıtı) kullanım oranı ve filo yakıt verimliliği değerlendirmenin temelini oluşturuyor. Sosyal (S) boyutta personel güvenliği, uçuş ekibi çalışma koşulları, sendika ilişkileri ve müşteri deneyimi ön plana çıkıyor. Yönetişim (G) tarafında devlet sahipliğinin yönetim bağımsızlığına etkisi, atama süreçlerinin şeffaflığı ve ilişkili taraf işlem politikası değerlendirme kriterleri arasında.`,
  };

  parts.push(sectorESG[inputs.sector] ?? sectorESG.industrial);

  const cbam = numOrNull(inputs.cbamTotalEur);
  if (cbam != null && cbam > 0) {
    parts.push(`Hesaplanan yıllık CBAM + ETS maliyeti ${(cbam / 1_000_000).toFixed(1)} milyon EUR seviyesinde olup, 2034'e kadar kademeli olarak artacak phase-in faktörü (2026: %48.5, 2030: %75, 2034: %100) dikkate alındığında gelecek yıllarda daha belirgin bir marj baskısı beklenmelidir.`);
  } else {
    parts.push(`CBAM hesaplaması için gerekli input verileri (Scope 1 emisyon, ürün tonnage, default intensity) henüz sağlanmadığından detaylı karbon maliyet projeksiyonu bu raporda yer almamaktadır; faaliyet raporunda yayımlanan sürdürülebilirlik verileriyle bir sonraki raporlama döneminde güncellenecektir.`);
  }

  parts.push(`Şirketin sürdürülebilirlik raporu, TSRS uyum durumu, karbon hedefleri (Net Zero 2050 commitment'i varsa), çeşitlilik istatistikleri ve Yönetim Kurulu ESG sorumluluğu raporun bu bölümünde ayrı ayrı değerlendirilmelidir.`);

  return parts.join(' ');
}


export function commentaryClosing(inputs: ClosingInputs): string {
  const parts: string[] = [];
  const cs = numOrNull(inputs.convergenceScore);
  const qa = numOrNull(inputs.qaScore);
  const dcf = numOrNull(inputs.dcfPerShare);
  const lc = numOrNull(inputs.lastClose);

  let stance = 'nötr';
  if (cs != null && qa != null) {
    if (cs > 0.3 && qa > 0.85) stance = 'temkinli pozitif';
    else if (cs > 0 && qa > 0.75) stance = 'dengelenmiş pozitif';
    else if (cs < -0.3) stance = 'temkinli negatif';
    else if (cs < 0) stance = 'hafif negatif';
    else stance = 'nötr';
  }

  parts.push(`${inputs.ticker} için üretilen bu kapsamlı analiz ${stance} bir değerlendirme sunmaktadır. Finansal sağlık, sektörel konumlanma, makro bağlam ve KAP olay akışı birlikte ele alındığında, yatırım tezi ${inputs.criticalFlagCount === 0 ? 'taşınabilir risk profiliyle' : 'yakın izlenmesi gereken risk profiliyle'} şekillenmektedir.`);

  if (dcf != null && lc != null) {
    const spread = ((dcf / lc) - 1) * 100;
    parts.push(`Değerleme açısından hesaplanan içsel değer ${dcf.toFixed(2)} TL ile güncel piyasa fiyatına göre ${spread >= 0 ? '+' : ''}${spread.toFixed(1)}% bir konumlanma ortaya koyarken, senaryo analizinde Bull/Base/Bear aralıkları yatırımcıya geniş bir değerleme bandı sunmaktadır.`);
  }

  if (inputs.catalystsCount > 0) {
    parts.push(`Ana katalizörler arasında yatırım planı uygulanması, sektörel dönüş sinyalleri ve makro iyileşmeler yer alırken, bu katalizörlerin uygun zamanlamayla materyalize olması üst senaryoların gerçekleşme olasılığını artıracaktır.`);
  }

  parts.push(`Bu rapor ${inputs.sectorTr} özelinde sektör-spesifik dinamikleri yansıtmakta olup, ileri dönemde yeni KAP bildirimleri ve finansal tabloların yayımlanmasıyla yenilenmesi önerilmektedir. Yatırımcı, raporu kendi risk iştahı, portföy diversifikasyonu ve zaman ufku çerçevesinde değerlendirmelidir.`);

  parts.push(`Finance X platformu deterministic Python hesaplamalar ile LLM narrative blokları hibrit yaklaşımıyla üretilen bu rapor, yatırım tavsiyesi niteliği taşımaz. Nihai kararlar için lisanslı yatırım danışmanına başvurulmalıdır.`);

  return parts.join(' ');
}
