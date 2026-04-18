/**
 * Sector + ticker-specific SWOT analysis.
 *
 * Previous implementation dumped strategic_synthesis signal buckets
 * straight into SWOT slots ("Top quartile: ROE" style). User called
 * that out: SWOT should be real business analysis, not auto-generated
 * signal labels.
 *
 * This module carries hand-curated SWOT rows per sub-sector + per
 * known ticker. Unknown tickers fall back to sector average. Each
 * row is 1-2 sentences of concrete business content.
 */

export interface SwotRows {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}


const SECTOR_SWOT: Record<string, SwotRows> = {
  aviation: {
    strengths: [
      'Uluslararası geniş uçuş ağı ve stratejik coğrafi konum transit yolcu potansiyelini yüksek tutuyor',
      'Yakıt hedging stratejileri volatil petrol fiyatlarına karşı kısmi koruma sağlıyor',
      'Kargo segmenti havacılık gelirine istikrarlı katkı veriyor ve döngüsel yolcu talebini dengeliyor',
      'Modern filo yapısı (A350, B787, A321neo) operasyonel verimlilik sunuyor',
    ],
    weaknesses: [
      'Yüksek sabit maliyet yapısı (uçak leasing, yakıt, personel) marjları kapasite kullanımına aşırı duyarlı hale getiriyor',
      'Döviz açığı — gelirler kısmen USD, giderler büyük oranda USD bazlı (yakıt, leasing, bakım)',
      'Sendikal personel yapısı ve yüksek eğitim maliyetleri rekabetçi ücret esnekliğini sınırlıyor',
    ],
    opportunities: [
      'Uzak doğu rotaları (Çin, Kore, Hindistan) genişleme potansiyeli mevcut pazar payını büyütebilir',
      'İstanbul Havalimanı transit hub konumu küresel havacılık trafiğinde avantaj sağlıyor',
      'Düşük maliyetli taşıyıcı (LCC) iştirakleri ile segmentasyon stratejisi',
      'Kargo taşımacılığında e-ticaret büyümesinden yararlanma potansiyeli',
    ],
    threats: [
      'Jeopolitik riskler (Rusya/Ukrayna hava sahası, Orta Doğu gerilimi) rotaları zorluyor',
      'Brent petrol fiyatında volatilite yakıt giderini (tipik OPEX’in %25-30’u) doğrudan etkiliyor',
      'Pegasus başta olmak üzere LCC rekabeti iç hat marjlarını baskılıyor',
      'IATA güvenlik/çevre düzenlemeleri (SAF kullanım yüzdesi) ilave CAPEX zorunluluğu yaratıyor',
    ],
  },
  refinery: {
    strengths: [
      'Türkiye rafineri pazarında konumlanma ve entegre tesis altyapısı',
      'Yüksek teknolojili rafineri kompleksi (hidrokraker, izomerizasyon) ürün karmasında esneklik',
      'İhracat kapasitesi ve Avrupa piyasasına erişim',
    ],
    weaknesses: [
      'Crack spread volatilitesi rafineri marjını tahmin edilemez kılıyor',
      'Ham petrol tedarik riski — Rus/İran yaptırımları alternatif arz kaynağına bağımlılık yaratıyor',
      'Çevre düzenlemeleri (yakıt sülfür içeriği, karbon ayak izi) sürekli yatırım baskısı',
    ],
    opportunities: [
      'Yenilenebilir yakıt (SAF, biyodizel) pazarında erken hareket avantajı',
      'Petrokimya entegrasyonu ile katma değer ürünlerde büyüme',
      'Elektrikli araç geçişi öncesi dizel/benzin talebinin sürdürülebilir seviyede kalması',
    ],
    threats: [
      'EU CBAM karbon sınır düzenlemesi ihracat maliyetini artırıyor',
      'Elektrikli araç adopsiyonu uzun vadede yakıt talebini eroze edecek',
      'Çin rafineri kapasitesi global arz-talep dengesini bozuyor',
    ],
  },
  steel: {
    strengths: [
      'Entegre üretim tesisi (kok-sinter-yüksek fırın-haddehane) maliyet avantajı',
      'İç pazarda güçlü marka bilinirliği ve dağıtım ağı',
      'Özel çelik ürünlerde (sanayi, otomotiv) teknik kapasite',
    ],
    weaknesses: [
      'Enerji yoğun üretim — gaz ve elektrik tarifelerindeki artış COGS\'u (%25-30) doğrudan etkiliyor',
      'Demir cevheri ithalat bağımlılığı ve dolar kuru hassasiyeti',
      'Siklik sektör yapısı çelik fiyatları ile kâr oranını bağlantılı kılıyor',
    ],
    opportunities: [
      'Yeşil çelik geçişi (elektrikli ark ocağı, yeşil hidrojen) stratejik dönüşüm fırsatı',
      'Savunma sanayii çelik talebi artıyor — özel ürünlerde marj avantajı',
      'Altyapı yatırımları (havaalanı, liman, köprü) iç talebi destekliyor',
    ],
    threats: [
      'AB Safeguard kota kısıtlaması ve CBAM karbon maliyeti ihracat bacağını zayıflatıyor',
      'Çin çelik ihracatının küresel arzı şişirmesi fiyat baskısı oluşturuyor',
      'EPDK enerji tarife kararları marj erozyonuna neden oluyor',
      'IAS 29 enflasyon düzeltmesi parasal kazanç/kayıpları kâr yapısını bozuyor',
    ],
  },
  banking: {
    strengths: [
      'Geniş şube ağı ve dijital bankacılık altyapısı müşteri tabanını koruyor',
      'Ölçek avantajı ve kurumsal müşteri ilişkileri istikrarlı fon tabanı sağlıyor',
      'TCMB nezdindeki likidite ve düzenleyici yeterlilik sermaye oranları',
    ],
    weaknesses: [
      'TCMB sıkı para politikası net faiz marjını baskılıyor',
      'TL mevduat faizi yüksek seviyede fonlama maliyetini artırıyor',
      'Kredi portföy kalitesi takipteki krediler (NPL) oranına duyarlı',
    ],
    opportunities: [
      'Dijital bankacılık ve neobank modeli ile müşteri tabanı genişleme potansiyeli',
      'Sürdürülebilir finans ürünleri (yeşil kredi, yeşil tahvil) pazar büyüklüğünde artış',
      'Kurumsal müşteri segmentinde özel ürünler (treasury, derivatives) ile wallet share büyütmek',
    ],
    threats: [
      'Makro ihtiyati düzenlemeler ve zorunlu karşılık oranlarındaki değişiklikler marjları sınırlıyor',
      'Enflasyon muhasebesi (IAS 29) kâr yapısını bozuyor, sermaye hareketini şeffafsızlaştırıyor',
      'TL değer kaybı dolar/euro cinsinden sermaye yeterliliği oranlarını aşağı çekiyor',
      'Jeopolitik risk türk lirası üzerinde baskı, fon çıkışı riski',
    ],
  },
  holding: {
    strengths: [
      'İştirak portföyü sektörel diversifikasyon ile siklik riski düşürüyor',
      'Güçlü yönetişim yapısı ve uzun vadeli strateji vizyonu',
      'Ana iştiraklerin sektör liderliği holding değerine güçlü katkı',
      'Ölçek avantajı ve kurumsal finansman erişimi',
    ],
    weaknesses: [
      'Konglomerat iskontosu — piyasa holding değerini NAV\'ın altında fiyatlıyor',
      'İştirakler arası sermaye akışının şeffaflığı yatırımcı güvenini zorluyor',
      'Karmaşık yapısı nedeniyle kısa vadeli trading stratejisine uygun değil',
    ],
    opportunities: [
      'Stratejik dönüşüm (ESG, dijitalleşme, yenilenebilir enerji) iştirak seviyesinde ek değer',
      'İştirak satış veya halka arz yoluyla değer kristalizasyonu',
      'Yurt dışı büyüme (M&A, joint venture) global trafik kazandırma potansiyeli',
    ],
    threats: [
      'Ana iştirakte operasyonel sorun holding genelinde değerleme üzerinde çarpan etkisi yaratıyor',
      'Türkiye makro ortamı (enflasyon, kur, jeopolitik) iştirak kârlılığını eş zamanlı etkiliyor',
      'Konglomerat iskontosu genişleme eğilimi — piyasa basitliği tercih ediyor',
    ],
  },
  telecom: {
    strengths: [
      'Geniş mobil abone tabanı ve 4.5G/5G network altyapısı',
      'Kurumsal çözümler ve veri merkezi işletmeciliği',
      'Dijital servis portföyü (TV, müzik, bulut) yeniden değerleme fırsatı yaratıyor',
    ],
    weaknesses: [
      'Yüksek CAPEX yoğunluğu (spektrum + 5G rollout) serbest nakit akışını baskılıyor',
      'ARPU büyüme hızı enflasyonun gerisinde reel gelir erozyonu',
      'Kitlesel churn sosyal medya / süpermarket alternatifleriyle artabilir',
    ],
    opportunities: [
      '5G kurumsal çözümler (IoT, endüstri 4.0) yüksek ARPU segmenti',
      'Veri merkezi ve bulut hizmetleri yeni gelir kaynağı',
      'Spektrum ihalesi fırsatçı fiyatla portföy genişleme',
    ],
    threats: [
      'BTK fiyat regülasyonları ve tavan tarife uygulamaları',
      'Spektrum yenileme maliyetleri serbest nakit akışını yoğun baskı altına alabilir',
      'İnternet sağlayıcı rekabeti (kablolu) pazar payını eritebilir',
    ],
  },
  defense: {
    strengths: [
      'Savunma Sanayii Başkanlığı (SSB) projeleri uzun vadeli gelir görünürlüğü',
      'Teknoloji yerlileştirme politikaları rekabet avantajı',
      'İhracat pazarında artan talep (drone, radar, elektronik savaş)',
    ],
    weaknesses: [
      'Yüksek Ar-Ge yoğunluğu kısa vadeli kâr marjını zorluyor',
      'Proje bazlı gelir yapısı dönemsel volatilite yaratıyor',
      'İhracat lisanslarına bağlı müşteri riski',
    ],
    opportunities: [
      'Küresel savunma harcamalarındaki artış ihracat potansiyelini büyütüyor',
      'NATO + Orta Doğu pazarlarında Turkish savunma ürünlerinin talep görmesi',
      'Sivil/ticari teknoloji ürünlerine geçiş (havacılık, uzay)',
    ],
    threats: [
      'Teknoloji ambargoları ve kritik komponent (çip, sensör) tedarik riski',
      'Jeopolitik gerilimler ihracat onaylarını geciktirebilir',
      'Kur volatilitesi döviz bazlı projede kâr marjını bozabilir',
    ],
  },
  retail: {
    strengths: [
      'Geniş mağaza ağı ve tedarikçi gücü',
      'Dağıtım altyapısı ve lojistik kapasitesi',
      'Özel markalı (private label) ürünlerle marj avantajı',
    ],
    weaknesses: [
      'Düşük marj yapısı (%2-4 net marj) operasyonel verimliliğe yüksek duyarlılık',
      'Elektrik, personel ve kira giderlerinin enflasyonla hızlı artışı',
    ],
    opportunities: [
      'E-ticaret ve hızlı teslimat kanalı',
      'İndirim market (hard discount) büyüme trendi',
      'Organik/sağlıklı ürün segmenti premium marj',
    ],
    threats: [
      'Rakip perakendeciler fiyat savaşı',
      'Hane halkı harcamasında daralma riski',
      'Yeni mağaza yatırım maliyeti + kira artış baskısı',
    ],
  },
};


// Ticker-specific overrides (in addition to / instead of sector SWOT).
const TICKER_SWOT_OVERRIDES: Record<string, Partial<SwotRows>> = {
  THYAO: {
    strengths: [
      'Türkiye\'nin bayrak taşıyıcısı olarak İstanbul Havalimanı hub statüsü — ACI Europe 2025 küresel #1',
      '~516-530 uçaklık modern filo, 129 ülkede 340+ destinasyon ağı',
      'Turkish Cargo\'nun dünya kargo pazarında ilk 10\'da yer alması — e-ticaret büyümesi sürücü',
      '2024\'te 85M yolcu, 2034\'te 150M hedefi ile uzun vadeli büyüme görünürlüğü',
      'Rusya üstgeçiş ayrıcalığı — Batılı rakiplerin kaybettiği yapısal avantaj',
    ],
    weaknesses: [
      'TVF %49 devlet sahipliği — kurumsal yatırımcı katılımını sınırlıyor ve yönetişim kaygısı yaratıyor',
      'Gelirin ~%90 USD/EUR bazlı ancak TRY maliyet tabanı — döviz uyumsuzluğu marj volatilitesi',
      'ESG profili zayıf — net-sıfır taahhüdü yok, CORSIA yol haritası açıklanmamış',
      'Yakıt maliyeti toplam giderlerin %25-30\'u — Brent fiyatına yüksek maruziyet',
    ],
    opportunities: [
      'Air Europa satın alımı — Avrupa iç hat ağına doğrudan erişim ve transit trafik artışı',
      'İstanbul Havalimanı 3. pist genişlemesi — 2028-2030 kapasite artışı',
      'Kargo segmentinde e-ticaret büyümesi — Turkish Cargo global ölçekleme potansiyeli',
      'Yeni nesil uçak teslimatları (B787/A350) — yakıt verimliliği ve uzun menzil kabiliyeti',
    ],
    threats: [
      'Rusya hava sahası kısıtlamaları uzak doğu rotalarını zorluyor',
      'Ortadoğu rotalarında İran gerilimi uçuş yollarında belirsizlik yaratıyor',
      'Brent petrol fiyatı (tipik yakıt %25-30 OPEX) kâr yapısına doğrudan etkili',
      'Pegasus (PGSUS) LCC modeli iç hat marjını baskılıyor',
      'Boeing/Airbus teslimat gecikmeleri — filo yenileme planını aksatabilir',
    ],
  },
  KCHOL: {
    strengths: [
      'Sabit iştirak portföyü: TUPRS (rafineri), YKB (banka), Ford Otosan (otomotiv), Arçelik (beyaz eşya)',
      'Türkiye\'nin en büyük sanayi grubu, toplam 130+ şirket',
      'Güçlü governance + 60+ yıllık kurumsal miras',
    ],
    threats: [
      'TUPRS crack spread volatilitesi holding net kârı üzerinde dalgalanma',
      'Ford Otosan elektrikli araç geçişinde CAPEX yükü',
      'Arçelik Avrupa pazarında zayıflayan talep',
    ],
  },
  EREGL: {
    strengths: [
      'Türkiye\'nin en büyük entegre çelik üreticisi, yıllık ~10 milyon ton kapasite',
      'Ermaden madencilik iştiraki stratejik demir cevheri kaynağı',
      'Otomotiv, beyaz eşya, savunma sanayii müşterileri çeşitli talep kaynağı',
    ],
    threats: [
      'AB Safeguard çelik kotası %47 kesinti + %25→%50 tarife',
      'CBAM karbon sınır düzenlemesi 2034\'e kadar kademeli artacak',
      'EPDK gaz+elektrik tarifesi artışları yıllık -4-5B TL EBITDA etkisi',
      'IAS 29 enflasyon muhasebesi parasal kazanç/kayıpları tutarsızlık yaratıyor',
    ],
  },
  TCELL: {
    strengths: [
      '~28M mobil abone ile Türkiye\'nin en büyük mobil operatörü',
      '5G altyapısı yatırımı + dijital servis portföyü (TV+, Fizy, BiP)',
      'Paycell fintech iştiraki dijital ödeme pazarında güçlü konum',
    ],
    threats: [
      'Spektrum yenileme maliyeti (2029) yüksek CAPEX yükü',
      'Turkcell Holding + TVF ortaklık yapısı yönetim süreçlerinde yavaşlık',
      'Türk Telekom sabit hattan mobile geçiş rekabeti',
    ],
  },
};


export function resolveSwot(ticker: string, sector: string): SwotRows {
  const upper = ticker.toUpperCase();
  const base = SECTOR_SWOT[sector] ?? SECTOR_SWOT.holding;
  const override = TICKER_SWOT_OVERRIDES[upper];

  if (!override) return base;

  return {
    strengths: override.strengths ?? base.strengths,
    weaknesses: override.weaknesses ?? base.weaknesses,
    opportunities: override.opportunities ?? base.opportunities,
    threats: override.threats ?? base.threats,
  };
}
