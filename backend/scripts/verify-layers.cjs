const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'data', 'financex.db'), { readonly: true });

const rows = db.prepare(`
  SELECT id, ticker, runtime_mode, selected_layers, status, started_at
  FROM analysis_sessions
  WHERE ticker IN ('BIMAS','THYAO','ARCLK','EREGL','TUPRS')
  ORDER BY started_at DESC LIMIT 15
`).all();
for (const r of rows) {
  console.log(`${r.ticker}  mode=${r.runtime_mode}  layers=${r.selected_layers}  status=${r.status}  ${r.started_at.substring(0,19)}  id=${r.id}`);
}
