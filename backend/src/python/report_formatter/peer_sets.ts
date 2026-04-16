/**
 * Sector-aware peer sets with typical market multiples.
 *
 * Until the orchestrator plumbs live peer enrichment (running
 * financial_analysis on each peer ticker), we fall back to curated
 * BIST peer lists per sector + sector-median market multiples so
 * the benchmark tables and bar charts populate with realistic
 * context instead of em-dashes.
 *
 * Numbers are directional 2025/2026 BIST sector medians from
 * research notes — NOT live quotes. The template marks them with
 * a "[sektör medyanı]" footnote badge so the reader knows these
 * are approximations, not current peer filings.
 */

export interface PeerRef {
  ticker: string;
  name: string;
}


export interface SectorMultiples {
  // Market-multiple medians (directional)
  ev_ebitda: number | null;
  pe: number | null;
  pb: number | null;
  dividend_yield_pct: number | null;
  // Operating ratio medians
  gross_margin_pct: number | null;
  ebitda_margin_pct: number | null;
  net_margin_pct: number | null;
  roe_pct: number | null;
  net_debt_to_ebitda: number | null;
}


export interface PeerBundle {
  peers: PeerRef[];
  multiples: SectorMultiples;
  subSector: string;
  notes: string;
}


// Ticker → sub-sector classification. Keep this list small and
// focused — the top 40 BIST tickers cover 90% of real usage.
const TICKER_SUBSECTOR: Record<string, string> = {
  // Aviation
  THYAO: 'aviation',
  PGSUS: 'aviation',
  // Refinery / Energy
  TUPRS: 'refinery',
  AYEN: 'energy',
  ODAS: 'energy',
  ZOREN: 'energy',
  // Steel / Metallurgy
  EREGL: 'steel',
  KRDMD: 'steel',
  KRDMA: 'steel',
  KRDMB: 'steel',
  KARSN: 'automotive',
  // Telecom
  TCELL: 'telecom',
  TTKOM: 'telecom',
  // Banking
  AKBNK: 'banking',
  ISCTR: 'banking',
  GARAN: 'banking',
  YKBNK: 'banking',
  HALKB: 'banking',
  VAKBN: 'banking',
  TSKB: 'banking',
  ALBRK: 'banking',
  // Holdings
  KCHOL: 'holding',
  SAHOL: 'holding',
  DOHOL: 'holding',
  TKFEN: 'conglomerate',
  SISE: 'holding',
  ENKAI: 'holding',
  // Defense
  ASELS: 'defense',
  OTKAR: 'defense',
  // Glass / industrial
  TRKCM: 'glass',
  SODA: 'chemicals',
  // Consumer / Retail
  BIMAS: 'retail',
  MGROS: 'retail',
  SOKM: 'retail',
  ULKER: 'food',
  CCOLA: 'beverage',
  FROTO: 'automotive',
  TOASO: 'automotive',
  // REIT
  EKGYO: 'reit',
  HLGYO: 'reit',
  ISGYO: 'reit',
  TRGYO: 'reit',
  // Insurance
  AKGRT: 'insurance',
  ANSGR: 'insurance',
  ANHYT: 'insurance',
};


// Sub-sector → peer list (target ticker excluded at runtime).
const SUBSECTOR_PEERS: Record<string, PeerRef[]> = {
  aviation: [
    { ticker: 'THYAO', name: 'Türk Hava Yolları' },
    { ticker: 'PGSUS', name: 'Pegasus Hava Yolları' },
  ],
  refinery: [
    { ticker: 'TUPRS', name: 'Tüpraş' },
  ],
  energy: [
    { ticker: 'AYEN', name: 'Aydem Enerji' },
    { ticker: 'ODAS', name: 'Odaş Elektrik' },
    { ticker: 'ZOREN', name: 'Zorlu Enerji' },
  ],
  steel: [
    { ticker: 'EREGL', name: 'Ereğli Demir Çelik' },
    { ticker: 'KRDMD', name: 'Kardemir' },
  ],
  telecom: [
    { ticker: 'TCELL', name: 'Turkcell' },
    { ticker: 'TTKOM', name: 'Türk Telekom' },
  ],
  banking: [
    { ticker: 'AKBNK', name: 'Akbank' },
    { ticker: 'ISCTR', name: 'İş Bankası' },
    { ticker: 'GARAN', name: 'Garanti BBVA' },
    { ticker: 'YKBNK', name: 'Yapı Kredi' },
    { ticker: 'HALKB', name: 'Halkbank' },
    { ticker: 'VAKBN', name: 'Vakıfbank' },
  ],
  holding: [
    { ticker: 'KCHOL', name: 'Koç Holding' },
    { ticker: 'SAHOL', name: 'Sabancı Holding' },
    { ticker: 'DOHOL', name: 'Doğan Holding' },
    { ticker: 'SISE', name: 'Şişe Cam' },
    { ticker: 'ENKAI', name: 'Enka İnşaat' },
  ],
  conglomerate: [
    { ticker: 'TKFEN', name: 'Tekfen Holding' },
    { ticker: 'KCHOL', name: 'Koç Holding' },
    { ticker: 'SAHOL', name: 'Sabancı Holding' },
  ],
  defense: [
    { ticker: 'ASELS', name: 'Aselsan' },
    { ticker: 'OTKAR', name: 'Otokar' },
  ],
  glass: [
    { ticker: 'TRKCM', name: 'Trakya Cam' },
    { ticker: 'SISE', name: 'Şişe Cam' },
  ],
  chemicals: [
    { ticker: 'SODA', name: 'Soda Sanayii' },
    { ticker: 'BAGFS', name: 'Bagfaş' },
  ],
  retail: [
    { ticker: 'BIMAS', name: 'BİM Birleşik Mağazalar' },
    { ticker: 'MGROS', name: 'Migros' },
    { ticker: 'SOKM', name: 'Şok Marketler' },
  ],
  food: [
    { ticker: 'ULKER', name: 'Ülker Bisküvi' },
    { ticker: 'TATGD', name: 'Tat Gıda' },
  ],
  beverage: [
    { ticker: 'CCOLA', name: 'Coca-Cola İçecek' },
    { ticker: 'AEFES', name: 'Anadolu Efes' },
  ],
  automotive: [
    { ticker: 'FROTO', name: 'Ford Otomotiv' },
    { ticker: 'TOASO', name: 'Tofaş' },
    { ticker: 'KARSN', name: 'Karsan Otomotiv' },
    { ticker: 'OTKAR', name: 'Otokar' },
  ],
  reit: [
    { ticker: 'EKGYO', name: 'Emlak Konut GYO' },
    { ticker: 'ISGYO', name: 'İş GYO' },
    { ticker: 'TRGYO', name: 'Torunlar GYO' },
    { ticker: 'HLGYO', name: 'Halk GYO' },
  ],
  insurance: [
    { ticker: 'AKGRT', name: 'Aksigorta' },
    { ticker: 'ANSGR', name: 'Anadolu Sigorta' },
    { ticker: 'ANHYT', name: 'Anadolu Hayat Emeklilik' },
  ],
};


// Sub-sector median market multiples (directional, 2025/2026 BIST).
const SUBSECTOR_MULTIPLES: Record<string, SectorMultiples> = {
  aviation: {
    ev_ebitda: 4.5, pe: 6.8, pb: 1.4, dividend_yield_pct: 2.5,
    gross_margin_pct: 18, ebitda_margin_pct: 18, net_margin_pct: 9,
    roe_pct: 18, net_debt_to_ebitda: 2.8,
  },
  refinery: {
    ev_ebitda: 3.2, pe: 4.5, pb: 1.0, dividend_yield_pct: 12,
    gross_margin_pct: 14, ebitda_margin_pct: 14, net_margin_pct: 9,
    roe_pct: 25, net_debt_to_ebitda: 0.5,
  },
  energy: {
    ev_ebitda: 5.8, pe: 7.2, pb: 1.1, dividend_yield_pct: 3,
    gross_margin_pct: 22, ebitda_margin_pct: 20, net_margin_pct: 7,
    roe_pct: 12, net_debt_to_ebitda: 3.2,
  },
  steel: {
    ev_ebitda: 4.2, pe: 5.5, pb: 0.7, dividend_yield_pct: 6,
    gross_margin_pct: 14, ebitda_margin_pct: 14, net_margin_pct: 6,
    roe_pct: 10, net_debt_to_ebitda: 2.0,
  },
  telecom: {
    ev_ebitda: 4.5, pe: 9.5, pb: 2.2, dividend_yield_pct: 4,
    gross_margin_pct: 55, ebitda_margin_pct: 40, net_margin_pct: 8,
    roe_pct: 15, net_debt_to_ebitda: 1.5,
  },
  banking: {
    ev_ebitda: null, pe: 3.5, pb: 0.8, dividend_yield_pct: 3,
    gross_margin_pct: null, ebitda_margin_pct: null, net_margin_pct: 28,
    roe_pct: 30, net_debt_to_ebitda: null,
  },
  holding: {
    ev_ebitda: 3.0, pe: 4.0, pb: 0.45, dividend_yield_pct: 4,
    gross_margin_pct: 18, ebitda_margin_pct: 15, net_margin_pct: 9,
    roe_pct: 14, net_debt_to_ebitda: 2.5,
  },
  conglomerate: {
    ev_ebitda: 3.5, pe: 5.0, pb: 0.6, dividend_yield_pct: 4,
    gross_margin_pct: 20, ebitda_margin_pct: 15, net_margin_pct: 8,
    roe_pct: 13, net_debt_to_ebitda: 2.2,
  },
  defense: {
    ev_ebitda: 8.5, pe: 14, pb: 3.5, dividend_yield_pct: 1,
    gross_margin_pct: 30, ebitda_margin_pct: 20, net_margin_pct: 12,
    roe_pct: 22, net_debt_to_ebitda: 0.5,
  },
  glass: {
    ev_ebitda: 3.8, pe: 6.5, pb: 1.0, dividend_yield_pct: 5,
    gross_margin_pct: 25, ebitda_margin_pct: 20, net_margin_pct: 10,
    roe_pct: 14, net_debt_to_ebitda: 1.8,
  },
  chemicals: {
    ev_ebitda: 4.5, pe: 7, pb: 1.2, dividend_yield_pct: 3,
    gross_margin_pct: 22, ebitda_margin_pct: 16, net_margin_pct: 9,
    roe_pct: 14, net_debt_to_ebitda: 2.0,
  },
  retail: {
    ev_ebitda: 8.5, pe: 14, pb: 4.5, dividend_yield_pct: 2,
    gross_margin_pct: 22, ebitda_margin_pct: 8, net_margin_pct: 3,
    roe_pct: 22, net_debt_to_ebitda: 1.2,
  },
  food: {
    ev_ebitda: 7.2, pe: 11, pb: 2.1, dividend_yield_pct: 3,
    gross_margin_pct: 28, ebitda_margin_pct: 14, net_margin_pct: 8,
    roe_pct: 16, net_debt_to_ebitda: 2.0,
  },
  beverage: {
    ev_ebitda: 8.0, pe: 13, pb: 2.5, dividend_yield_pct: 3,
    gross_margin_pct: 32, ebitda_margin_pct: 18, net_margin_pct: 9,
    roe_pct: 18, net_debt_to_ebitda: 1.5,
  },
  automotive: {
    ev_ebitda: 4.5, pe: 7, pb: 2.0, dividend_yield_pct: 5,
    gross_margin_pct: 12, ebitda_margin_pct: 10, net_margin_pct: 6,
    roe_pct: 20, net_debt_to_ebitda: 1.5,
  },
  reit: {
    ev_ebitda: 12, pe: 8, pb: 0.4, dividend_yield_pct: 6,
    gross_margin_pct: 75, ebitda_margin_pct: 70, net_margin_pct: 55,
    roe_pct: 8, net_debt_to_ebitda: 4.0,
  },
  insurance: {
    ev_ebitda: null, pe: 5, pb: 1.4, dividend_yield_pct: 4,
    gross_margin_pct: null, ebitda_margin_pct: null, net_margin_pct: 12,
    roe_pct: 18, net_debt_to_ebitda: null,
  },
};


export function resolvePeerBundle(ticker: string): PeerBundle | null {
  const upper = ticker.toUpperCase();
  const subSector = TICKER_SUBSECTOR[upper];
  if (!subSector) return null;

  const peerList = SUBSECTOR_PEERS[subSector] ?? [];
  const multiples = SUBSECTOR_MULTIPLES[subSector] ?? SUBSECTOR_MULTIPLES.holding;
  // Exclude target ticker from its own peer list.
  const peers = peerList.filter(p => p.ticker !== upper);

  return {
    peers,
    multiples,
    subSector,
    notes: 'Emsal değerler sektör medyanlarından türetilmiştir (2025-2026 yaklaşık) — canlı filer verisi için peer enrichment sistemi devreye alınacak.',
  };
}
