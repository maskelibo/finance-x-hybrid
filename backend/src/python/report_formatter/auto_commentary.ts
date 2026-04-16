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


/** Profitability paragraph — 4-6 cümle. */
export function commentaryProfitability(inputs: ProfitabilityInputs): string {
  const parts: string[] = [];
  const gm = numOrNull(inputs.grossMargin);
  const em = numOrNull(inputs.ebitdaMargin);
  const nm = numOrNull(inputs.netMargin);
  const roe = numOrNull(inputs.roe);

  // Sector thresholds — industrial vs services vs banking differ.
  const industryThresholds = inputs.sector === 'banking'
    ? { gm: null, em: 45, nm: 20, roe: 15 }      // banking NIM substitutes gm
    : inputs.sector === 'holding'
      ? { gm: 20, em: 12, nm: 8, roe: 12 }
      : { gm: 20, em: 12, nm: 7, roe: 15 };       // industrial default

  if (gm != null && industryThresholds.gm) {
    const verdict = gm >= industryThresholds.gm ? 'sektör ortalamasının üzerinde konumlanan'
                  : gm >= industryThresholds.gm * 0.75 ? 'sektör ortalamasına yakın seyreden'
                  : 'sektör ortalamasının altında kalan';
    parts.push(`Brüt marj ${fmtPct(gm)} ile ${verdict} bir seviye sergiliyor. Maliyet yapısı ve ürün karması bu marj seviyesini destekleyen temel faktörler arasında.`);
  }

  if (em != null && industryThresholds.em) {
    const verdict = em >= industryThresholds.em ? 'güçlü operasyonel kârlılığa işaret eden'
                  : em >= industryThresholds.em * 0.7 ? 'kabul edilebilir bir operasyonel kârlılık gösteren'
                  : 'operasyonel maliyet baskısını yansıtan';
    parts.push(`FAVÖK marjı ${fmtPct(em)} seviyesinde ve ${verdict} bir tabloya işaret ediyor. ${em < industryThresholds.em * 0.7 ? 'Operasyonel iyileştirme inisiyatifleri kısa vadede marj kalitesini artıracak temel kaldıraç olarak öne çıkıyor.' : 'Bu marj seviyesi nakit yaratma kapasitesini desteklerken finansman yükümlülüklerinin karşılanmasında konfor sağlıyor.'}`);
  }

  if (nm != null && industryThresholds.nm) {
    const verdict = nm >= industryThresholds.nm ? 'sektör liderleri arasında yer alan' : nm >= industryThresholds.nm * 0.6 ? 'ortalama seviyede olan' : 'zayıf kalan';
    parts.push(`Net kâr marjı ${fmtPct(nm)} olup ${verdict} bir profil çiziyor. Finansman giderleri, vergi etkileri ve tek seferlik kalemler bu marjın oluşmasında belirleyici rol oynuyor.`);
  }

  if (roe != null && industryThresholds.roe) {
    const tlCostOfEquity = 30; // Turkish TRY cost of equity approximation
    const verdict = roe >= tlCostOfEquity ? 'özsermaye maliyetini aşan ve pay sahibi değeri yaratan' : roe >= tlCostOfEquity * 0.6 ? 'özsermaye maliyetine yaklaşan' : 'özsermaye maliyetinin altında kalan ve değer erozyonuna işaret eden';
    parts.push(`Özsermaye kârlılığı (ROE) ${fmtPct(roe)} düzeyinde gerçekleşti; bu rakam ${verdict} bir getiri anlamına geliyor. TRY bazında kabul gören yaklaşık %${tlCostOfEquity} özsermaye maliyeti eşiği referans alındığında, şirketin sermaye kullanımındaki etkinliği ${roe >= tlCostOfEquity ? 'güçlü' : 'sınırlı'}.`);
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

  if (nd != null && eb && eb > 0) {
    const ratio = nd / eb;
    const verdict = ratio < 2 ? 'sağlıklı kaldıraç profiline işaret eden'
                  : ratio < 3.5 ? 'orta düzey kaldıraç profiline işaret eden'
                  : ratio < 5 ? 'yükselmiş kaldıraç nedeniyle yakın izlenmesi gereken'
                  : 'distressed seviyeye yaklaşan ve refinansman riskini artıran';
    parts.push(`Net borç/FAVÖK oranı ${ratio.toFixed(2)}x seviyesinde olup ${verdict} bir yapı oluşturuyor. ${ratio >= 3.5 ? 'Kredi derecelendirme kuruluşlarının eşiklerine yaklaşma potansiyeli ve olası bir outlook değişikliği riski raporlama sürecinde dikkatle takip edilmeli.' : 'Bu oran seviyesi yeni borçlanma esnekliği ve stratejik yatırımlar için manevra alanı sağlıyor.'}`);
  }

  if (nd != null && eq && eq > 0) {
    const d2e = nd / eq;
    parts.push(`Net borç / özsermaye oranı ${(d2e * 100).toFixed(1)}% düzeyinde; bu ${d2e < 0.3 ? 'düşük finansal kaldıraçla konservatif bir sermaye yapısına' : d2e < 0.7 ? 'dengeli bir finansman karışımına' : 'agresif finansman kullanımına'} işaret ediyor.`);
  }

  if (cr != null) {
    const verdict = cr >= 1.5 ? 'güçlü kısa vadeli likidite tamponu' : cr >= 1 ? 'asgari likidite gereksinimini karşılayan' : 'kısa vadeli likidite baskısı altında olan';
    parts.push(`Cari oran ${cr.toFixed(2)} ile ${verdict} bir pozisyonu yansıtıyor. ${cr < 1 ? 'Dönen varlıkların kısa vadeli yükümlülükleri karşılamakta yetersiz kalması işletme sermayesi yönetiminin kritik önem taşıdığını gösteriyor.' : ''}`);
  }

  if (ic != null) {
    const verdict = ic >= 4 ? 'faiz giderlerini rahatlıkla karşılayan' : ic >= 2 ? 'faiz yükümlülüklerini yeterli düzeyde karşılayan' : 'faiz karşılama oranı zayıf kalan';
    parts.push(`Faiz karşılama oranı ${ic.toFixed(2)}x seviyesinde olup ${verdict} bir yapı çiziyor.`);
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
    parts.push(`⚠ Dikkat: Kullanılan WACC %${((wacc ?? 0) * 100).toFixed(1)} seviyesinde olup TRY bazlı bir orana karşılık gelebilir; Turkish filers'da TRY WACC tuzağı DCF'i sıfıra yaklaştırabilir. USD bazlı WACC önerilmelidir.`);
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


export function commentaryRisk(inputs: RiskInputs): string {
  const parts: string[] = [];

  if (inputs.criticalFlags.length > 0) {
    const codes = inputs.criticalFlags.slice(0, 3).map(f => f.code).join(', ');
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

  // Sector-specific risks
  if (inputs.sector === 'banking') {
    parts.push(`Bankacılık sektör risklerinin başında net faiz marjı sıkışması, kredi kaybı karşılık artışı (LLP), BDDK sermaye yeterliliği revizyonları ve TCMB para politikası sürprizleri yer almaktadır.`);
  } else if (inputs.sector === 'holding') {
    parts.push(`Holding yapısında başlıca riskler arasında iştirak seviyesindeki operasyonel sorunların holdinge yansıması, sektörel konsantrasyon riski ve piyasa değerlemesinde konglomerat indirimi genişlemesi bulunmaktadır.`);
  } else if (inputs.sector === 'industrial') {
    parts.push(`Sanayi sektörlerinde maruziyet genel olarak hammadde fiyat volatilitesi, enerji maliyet artışları, talep daralması ve döviz kuru hareketleri şeklinde tezahür eder. THYAO gibi havacılık şirketleri için ise yakıt maliyeti, rezervasyon iptalleri ve jeopolitik kapatmalar kritik değişkenlerdir.`);
  }

  parts.push(`Risk matrisi (etki × olasılık) yukarıda tespit edilen faktörleri 3×3 grid üzerinde konumlandırmakta ve yakın izleme önceliğini görsel olarak iletmektedir.`);

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
