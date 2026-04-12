#!/usr/bin/env node
import { startAnalysisSession } from './orchestrator.js';
import { db } from './db.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('Finance X — TUPRS Kurumsal Analiz Sistemi');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Şirket: TÜPRAŞ (TUPRS)');
console.log('Analiz Türü: standard_institutional');
console.log('Hedef Süre: 8 dakika altı');
console.log('Rapor Dili: Türkçe');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

const sessionId = startAnalysisSession('TUPRS', 'standard_institutional');

console.log(`✓ Analiz oturumu başlatıldı: ${sessionId}`);
console.log('');
console.log('Çalıştırılan Ajanlar:');
console.log('  1. CEO Meta-Ajan — Görev Yorumlama');
console.log('  2. Veri Toplama — KAP, İş Yatırım, Yahoo Finance');
console.log('  3. Belge Ayrıştırma — Finansal Tabloları Normalize Et');
console.log('  4. Veri Doğrulama — Kalite Kontrolü');
console.log('  5. Bağlam Çıkarma — İş Modeli Analizi');
console.log('  6. Finansal Analiz — Oran Analizi, Karlılık, Likidite');
console.log('  7. Sektör & Rekabet — Rafineri Sektörü Analizi');
console.log('  8. Makro Analiz — Enflasyon, Kur, Enerji');
console.log('  9. Teknik Analiz — Grafik Analizi');
console.log(' 10. KAP İzleme — Son 30 Gün Bildirimleri');
console.log(' 11. Olay Sınıflandırma — Olay Tipleri');
console.log(' 12. Etki Haritalama — Mali Tablo Etkisi');
console.log(' 13. Olay Zaman Çizelgesi — İleriye Dönük Uyarılar');
console.log(' 14. Kalite Kontrol — QA Review');
console.log(' 15. Stratejik Sentez — Bulguların Entegrasyonu');
console.log(' 16. Son Rapor — Yönetici Özeti (Türkçe)');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('İzleme:');
console.log('  Veri tabanı: /backend/data/financex.db');
console.log(`  Session ID: ${sessionId}`);
console.log('');

// Monitor progress
const intervalId = setInterval(() => {
  const session = db.prepare(`
    SELECT status, current_phase, total_cost_usd, total_tokens
    FROM analysis_sessions WHERE id = ?
  `).get(sessionId) as any;

  const runs = db.prepare(`
    SELECT agent_display_name, status, duration_ms, cost_usd
    FROM agent_runs WHERE session_id = ?
    ORDER BY rowid
  `).all(sessionId) as any[];

  console.clear();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Finance X — TUPRS Analiz İlerlemesi');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Durum: ${session.status.toUpperCase()}`);
  console.log(`Mevcut Faz: ${session.current_phase || 'Başlatılıyor...'}`);
  console.log(`Toplam Maliyet: $${session.total_cost_usd.toFixed(4)}`);
  console.log(`Toplam Token: ${session.total_tokens.toLocaleString()}`);
  console.log('');
  console.log('Ajan İlerlemesi:');
  console.log('─────────────────────────────────────────────────────────────');

  let completedCount = 0;
  let runningCount = 0;
  let failedCount = 0;

  runs.forEach((run, idx) => {
    const icon =
      run.status === 'completed' ? '✓' :
      run.status === 'running' ? '⟳' :
      run.status === 'failed' ? '✗' :
      '○';

    const statusColor =
      run.status === 'completed' ? '' :
      run.status === 'running' ? '' :
      run.status === 'failed' ? '' :
      '';

    const duration = run.duration_ms ? ` (${(run.duration_ms / 1000).toFixed(1)}s)` : '';
    const cost = run.cost_usd ? ` [$${run.cost_usd.toFixed(4)}]` : '';

    console.log(`  ${icon} ${run.agent_display_name}${duration}${cost}`);

    if (run.status === 'completed') completedCount++;
    if (run.status === 'running') runningCount++;
    if (run.status === 'failed') failedCount++;
  });

  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Tamamlanan: ${completedCount} | Çalışıyor: ${runningCount} | Hata: ${failedCount}`);
  console.log('');

  if (session.status === 'completed' || session.status === 'failed') {
    clearInterval(intervalId);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`ANALİZ ${session.status === 'completed' ? 'TAMAMLANDI' : 'BAŞARISIZ'}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    if (session.status === 'completed') {
      const report = db.prepare(`
        SELECT title, content FROM reports WHERE session_id = ? ORDER BY created_at DESC LIMIT 1
      `).get(sessionId) as any;

      if (report) {
        console.log('Rapor Başlığı:', report.title);
        console.log('');
        console.log('─────────────────────────────────────────────────────────────');
        console.log(report.content);
        console.log('─────────────────────────────────────────────────────────────');
      }
    }

    console.log('');
    console.log('Özet İstatistikler:');
    console.log(`  Toplam Süre: ${runs.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / 1000}s`);
    console.log(`  Toplam Maliyet: $${session.total_cost_usd.toFixed(4)}`);
    console.log(`  Toplam Token: ${session.total_tokens.toLocaleString()}`);
    console.log('');

    process.exit(0);
  }
}, 2000);
