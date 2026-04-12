#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const agents = [
  {
    id: 'agent_factory',
    name: 'Agent Factory',
    expertise: 'Agent Tasarımı ve Sistem Mimarisi',
    subTopics: [
      { topic: 'Agent tasarım prensipleri', level: 1 },
      { topic: 'Sistem mimarisi', level: 1 },
      { topic: 'Görev dağılımı', level: 1 },
      { topic: 'Kalite standartları', level: 1 },
      { topic: 'Performans optimizasyonu', level: 1 }
    ]
  },
  {
    id: 'ceo',
    name: 'CEO Meta-Agent',
    expertise: 'Yönetim ve Kalite Kontrolü',
    subTopics: [
      { topic: 'Stratejik yönetim', level: 1 },
      { topic: 'Kalite kontrol protokolleri', level: 1 },
      { topic: 'Agent performans değerlendirmesi', level: 1 },
      { topic: 'Eğitim programı yönetimi', level: 1 },
      { topic: 'Platform koordinasyonu', level: 1 }
    ]
  },
  {
    id: 'context_extraction',
    name: 'Context Extraction Agent',
    expertise: 'Veri Çıkarımı ve Anlam Analizi',
    subTopics: [
      { topic: 'Doküman analizi', level: 1 },
      { topic: 'Bağlam çıkarımı', level: 1 },
      { topic: 'Önemli bilgi tespiti', level: 1 },
      { topic: 'Yapısal veri çıkarımı', level: 1 },
      { topic: 'Anlam ilişkilendirme', level: 1 }
    ]
  },
  {
    id: 'data_collection',
    name: 'Data Collection Agent',
    expertise: 'Veri Toplama ve Kaynak Yönetimi',
    subTopics: [
      { topic: 'Kaynak tarama', level: 1 },
      { topic: 'Veri doğrulama', level: 1 },
      { topic: 'Veri standardizasyonu', level: 1 },
      { topic: 'Kaynak güvenilirlik değerlendirmesi', level: 1 },
      { topic: 'Veri aktarım protokolleri', level: 1 }
    ]
  },
  {
    id: 'event_classification',
    name: 'Event Classification Agent',
    expertise: 'Olay Sınıflandırması',
    subTopics: [
      { topic: 'Olay tipi tanıma', level: 1 },
      { topic: 'Önem seviyesi belirleme', level: 1 },
      { topic: 'Kategorizasyon kriterleri', level: 1 },
      { topic: 'Anomali tespiti', level: 1 },
      { topic: 'Sınıflandırma doğruluğu', level: 1 }
    ]
  },
  {
    id: 'event_impact_mapper',
    name: 'Event Impact Mapper',
    expertise: 'Olay Etki Analizi',
    subTopics: [
      { topic: 'Etki büyüklüğü hesaplama', level: 1 },
      { topic: 'Finansal etkiler', level: 1 },
      { topic: 'Zaman boyutu analizi', level: 1 },
      { topic: 'İkincil etkiler', level: 1 },
      { topic: 'Etki güven seviyesi', level: 1 }
    ]
  },
  {
    id: 'event_timeline_alert',
    name: 'Event Timeline Alert',
    expertise: 'Zaman Çizelgesi ve Uyarı Sistemi',
    subTopics: [
      { topic: 'Zaman çizelgesi yönetimi', level: 1 },
      { topic: 'Uyarı önceliklendirme', level: 1 },
      { topic: 'Kritik tarihlerin takibi', level: 1 },
      { topic: 'Gecikmeli etkilerin tespiti', level: 1 },
      { topic: 'Alert dağıtımı', level: 1 }
    ]
  },
  {
    id: 'final_summary',
    name: 'Final Summary Agent',
    expertise: 'Rapor Özeti ve Sentez',
    subTopics: [
      { topic: 'Bilgi sentezi', level: 1 },
      { topic: 'Özetleme teknikleri', level: 1 },
      { topic: 'Çelişki çözümleme', level: 1 },
      { topic: 'Rapor yapılandırması', level: 1 },
      { topic: 'Ana sonuçların belirlenmesi', level: 1 }
    ]
  },
  {
    id: 'financial_analysis',
    name: 'Financial Analysis Agent',
    expertise: 'Finansal Analiz',
    subTopics: [
      { topic: 'Karlılık analizi', level: 1 },
      { topic: 'Likidite analizi', level: 1 },
      { topic: 'Finansal rasyolar', level: 1 },
      { topic: 'Nakit akış analizi', level: 1 },
      { topic: 'Trend analizi', level: 1 }
    ]
  },
  {
    id: 'kap_watch',
    name: 'KAP Watch Agent',
    expertise: 'KAP Bildirimleri İzleme',
    subTopics: [
      { topic: 'Bildirim tipleri', level: 1 },
      { topic: 'Önem değerlendirmesi', level: 1 },
      { topic: 'Zamansal örüntüler', level: 1 },
      { topic: 'Şirket davranışları', level: 1 },
      { topic: 'Etki analizi', level: 1 }
    ]
  },
  {
    id: 'macro_analysis',
    name: 'Macro Analysis Agent',
    expertise: 'Makroekonomik Analiz',
    subTopics: [
      { topic: 'Enflasyon', level: 1 },
      { topic: 'Faiz politikası', level: 1 },
      { topic: 'Döviz kurları', level: 1 },
      { topic: 'Büyüme göstergeleri', level: 1 },
      { topic: 'Para politikası', level: 1 }
    ]
  },
  {
    id: 'orchestrator',
    name: 'Orchestrator Agent',
    expertise: 'Süreç Yönetimi ve Koordinasyon',
    subTopics: [
      { topic: 'Görev dağılımı', level: 1 },
      { topic: 'Bağımlılık yönetimi', level: 1 },
      { topic: 'Akış kontrolü', level: 1 },
      { topic: 'Performans izleme', level: 1 },
      { topic: 'Hata yönetimi', level: 1 }
    ]
  },
  {
    id: 'parse_standardization',
    name: 'Parse Standardization Agent',
    expertise: 'Veri Standardizasyonu',
    subTopics: [
      { topic: 'Format dönüşümleri', level: 1 },
      { topic: 'Şema uyumlama', level: 1 },
      { topic: 'Veri temizleme', level: 1 },
      { topic: 'Standardizasyon kuralları', level: 1 },
      { topic: 'Kalite kontrol', level: 1 }
    ]
  },
  {
    id: 'qa_review',
    name: 'QA Review Agent',
    expertise: 'Kalite Kontrolü',
    subTopics: [
      { topic: 'Kalite kriterleri', level: 1 },
      { topic: 'Doğrulama yöntemleri', level: 1 },
      { topic: 'Hata tespiti', level: 1 },
      { topic: 'İyileştirme önerileri', level: 1 },
      { topic: 'Onay süreçleri', level: 1 }
    ]
  },
  {
    id: 'reconciliation',
    name: 'Reconciliation Agent',
    expertise: 'Veri Mutabakatı',
    subTopics: [
      { topic: 'Veri karşılaştırma', level: 1 },
      { topic: 'Tutarsızlık tespiti', level: 1 },
      { topic: 'Çelişki çözümleme', level: 1 },
      { topic: 'Kaynak önceliklendirme', level: 1 },
      { topic: 'Mutabakat raporu', level: 1 }
    ]
  },
  {
    id: 'sector_competition',
    name: 'Sector Competition Agent',
    expertise: 'Sektör ve Rekabet Analizi',
    subTopics: [
      { topic: 'Sektör dinamikleri', level: 1 },
      { topic: 'Rekabet analizi', level: 1 },
      { topic: 'Pazar payı', level: 1 },
      { topic: 'Sektörel trendler', level: 1 },
      { topic: 'Benchmark karşılaştırması', level: 1 }
    ]
  },
  {
    id: 'strategic_synthesis',
    name: 'Strategic Synthesis Agent',
    expertise: 'Stratejik Sentez',
    subTopics: [
      { topic: 'Stratejik görüş sentezi', level: 1 },
      { topic: 'Uzun vadeli eğilimler', level: 1 },
      { topic: 'Rekabet konumlandırması', level: 1 },
      { topic: 'Fırsat ve risk analizi', level: 1 },
      { topic: 'Stratejik öneriler', level: 1 }
    ]
  },
  {
    id: 'technical_analysis',
    name: 'Technical Analysis Agent',
    expertise: 'Teknik Analiz',
    subTopics: [
      { topic: 'Chart patterns', level: 1 },
      { topic: 'İndikatörler', level: 1 },
      { topic: 'Destek/Direnç seviyeleri', level: 1 },
      { topic: 'Hacim analizi', level: 1 },
      { topic: 'Trend takibi', level: 1 }
    ]
  }
];

const memoryTemplate = (agent) => `# ${agent.name} — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | ${agent.name} |
| Uzmanlık | ${agent.expertise} |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 0 |
| Ortalama Öğrenme Puanı | — |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
${agent.subTopics.map(t => `| ${t.topic} | ${t.level} | Başlangıç seviyesi |`).join('\n')}

---

## Öğrenme Geçmişi

*(Her gece eğitim sonrası bu bölüm güncellenir)*

---

## Birikimli Bilgi Bankası

### Anahtar Kavramlar

*(Öğrenilen temel kavramlar buraya eklenir)*

### Kaynak Arşivi

*(Güvenilir kaynaklar ve referanslar buraya eklenir)*

### Uygulama Örnekleri

*(Somut uygulama örnekleri buraya eklenir)*

---

## KPI Takip Tablosu

| Tarih | Hedef | Sonuç | Puan |
|---|---|---|---|
| — | — | — | — |

---

## Güçlü Yönlerim

*(Henüz belirlenmedi — gece eğitimleriyle ortaya çıkacak)*

## Gelişim Alanlarım

*(Henüz belirlenmedi — gece eğitimleriyle ortaya çıkacak)*

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*
*Dosya sahibi: ${agent.name} | Denetleyen: META (CEO)*
`;

let updated = 0;
let backed = 0;

for (const agent of agents) {
  const memoryPath = path.resolve(`../agents/${agent.id}/memory.md`);

  if (!fs.existsSync(memoryPath)) {
    console.log(`⚠️  ${agent.id} - memory.md bulunamadı`);
    continue;
  }

  // Mevcut içeriği yedekle
  const oldContent = fs.readFileSync(memoryPath, 'utf8');
  const backupPath = path.resolve(`../agents/${agent.id}/memory.backup.md`);
  fs.writeFileSync(backupPath, oldContent, 'utf8');
  backed++;

  // Yeni formatı yaz
  const newContent = memoryTemplate(agent);
  fs.writeFileSync(memoryPath, newContent, 'utf8');
  console.log(`✅ ${agent.id} - yeni formata güncellendi (yedek: memory.backup.md)`);
  updated++;
}

console.log(`\n📊 Özet: ${updated} agent güncellendi, ${backed} yedek oluşturuldu`);
