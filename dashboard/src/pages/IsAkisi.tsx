import React, { useState, useRef, useEffect } from 'react'
import {
  GitBranch, Crown, Database, FileSearch, Shield, Brain, BarChart2,
  ClipboardCheck, Layers, FileText, Sparkles, Zap, Play, X,
} from 'lucide-react'

type NodeColor = 'amber' | 'blue' | 'cyan' | 'green' | 'indigo' | 'purple' | 'yellow' | 'pink' | 'emerald'

type FlowNode = {
  id: string
  phase: number
  title: string
  subtitle: string
  duration: string
  agents: string[]
  description: string
  outputs: string[]
  qualityGate?: string
  icon: React.ComponentType<any>
  color: NodeColor
  x: number
  y: number
}

type FlowEdge = {
  from: string
  to: string
  label?: string
}

const NODE_WIDTH = 240
const NODE_HEIGHT = 110
const CANVAS_WIDTH = 1800
const CANVAS_HEIGHT = 900

const nodes: FlowNode[] = [
  {
    id: 'trigger',
    phase: 0,
    title: 'Başlangıç',
    subtitle: 'User Trigger',
    duration: '—',
    agents: ['Chairman'],
    description: 'Kullanıcı bir BIST şirketi seçer ve analiz modunu belirler (fast / standard / deep).',
    outputs: ['Ticker', 'Runtime mode', 'Session ID'],
    icon: Play,
    color: 'green',
    x: 60, y: 400,
  },
  {
    id: 'ceo',
    phase: 1,
    title: 'Mandate Yorumla',
    subtitle: 'CEO',
    duration: '30-60sn',
    agents: ['CEO Meta-Ajan'],
    description: 'CEO kullanıcı isteğini analiz mandatesine dönüştürür, kalite eşiklerini tanımlar ve orchestrator\'a gönderir.',
    outputs: ['Mandate', 'Quality thresholds', 'Audit entry'],
    qualityGate: 'Mandate well-formed mı?',
    icon: Crown,
    color: 'amber',
    x: 340, y: 400,
  },
  {
    id: 'data_collection',
    phase: 2,
    title: 'Veri Toplama',
    subtitle: 'Data Collection',
    duration: '2-10dk',
    agents: ['Veri Toplama'],
    description: 'Son 5 yıl finansal tablolar, annual reports, piyasa verisi toplanır.',
    outputs: ['Raw statements', 'PDF files', 'OHLCV data'],
    icon: Database,
    color: 'blue',
    x: 620, y: 250,
  },
  {
    id: 'kap_watch',
    phase: 2,
    title: 'KAP İzleme',
    subtitle: 'KAP Watch',
    duration: '2-5dk',
    agents: ['KAP İzleme'],
    description: 'KAP.gov.tr üzerinden son 5 yılın tüm disclosure\'ları paralel olarak çekilir.',
    outputs: ['KAP feed', 'Disclosure metadata'],
    icon: Zap,
    color: 'purple',
    x: 620, y: 550,
  },
  {
    id: 'parse',
    phase: 3,
    title: 'Belge Ayrıştırma',
    subtitle: 'Parse & Standardize',
    duration: '3-8dk',
    agents: ['Belge Ayrıştırma'],
    description: 'PDF/XBRL belgeleri parse edilir, finansal tablolar standart formata çevrilir.',
    outputs: ['Parsed docs', 'Standard line items'],
    qualityGate: 'Parser güveni > 0.70?',
    icon: FileSearch,
    color: 'cyan',
    x: 900, y: 250,
  },
  {
    id: 'event_classification',
    phase: 3,
    title: 'Olay Sınıflandırma',
    subtitle: 'Event Classify',
    duration: '2-4dk',
    agents: ['Olay Sınıflandırma'],
    description: 'KAP bildirimleri tiplere ayrılır: sözleşme, CAPEX, borçlanma, yasal, vb.',
    outputs: ['Event categories', 'Materiality scores'],
    icon: Layers,
    color: 'purple',
    x: 900, y: 550,
  },
  {
    id: 'reconciliation',
    phase: 4,
    title: 'Veri Doğrulama',
    subtitle: 'Reconciliation',
    duration: '2-5dk',
    agents: ['Veri Doğrulama'],
    description: 'Bilanço denkliği, cross-statement linkage, muhasebe bütünlüğü kontrolü.',
    outputs: ['Quality scores', 'Consistency report'],
    qualityGate: 'Quality > 0.60?',
    icon: Shield,
    color: 'green',
    x: 1180, y: 100,
  },
  {
    id: 'context',
    phase: 5,
    title: 'Bağlam Çıkarma',
    subtitle: 'Context Extract',
    duration: '3-6dk',
    agents: ['Bağlam Çıkarma'],
    description: 'Faaliyet raporlarından iş modeli, segment, FX duyarlılığı çıkarılır.',
    outputs: ['Context profile', 'Risk factors'],
    icon: Brain,
    color: 'indigo',
    x: 1180, y: 250,
  },
  {
    id: 'financial',
    phase: 6,
    title: 'Finansal Analiz',
    subtitle: 'Financial Analysis',
    duration: '5-10dk',
    agents: ['Finansal Analiz'],
    description: 'Oran analizi, trend, karlılık, likidite, kaldıraç — bağlam profiliyle yorumlanır.',
    outputs: ['Ratios', 'Trend analysis', 'Interpretation'],
    icon: BarChart2,
    color: 'blue',
    x: 1180, y: 400,
  },
  {
    id: 'sector_macro',
    phase: 6,
    title: 'Sektör + Makro',
    subtitle: 'Sector & Macro',
    duration: '4-8dk',
    agents: ['Sektör', 'Makro'],
    description: 'Endüstri yapısı, rakip karşılaştırma, Türkiye makro etkisi.',
    outputs: ['Sector report', 'Macro impact'],
    icon: FileText,
    color: 'indigo',
    x: 1180, y: 700,
  },
  {
    id: 'event_impact',
    phase: 6,
    title: 'Etki Haritalama',
    subtitle: 'Event Impact',
    duration: '3-6dk',
    agents: ['Etki Haritalama', 'Zaman Çizelgesi'],
    description: 'Her olay finansal tablo kalemlerine etkisiyle eşleştirilir, timeline oluşturulur.',
    outputs: ['Impact assessment', 'Event timeline'],
    icon: Zap,
    color: 'purple',
    x: 1180, y: 550,
  },
  {
    id: 'qa',
    phase: 7,
    title: 'Kalite Kontrol',
    subtitle: 'QA Review',
    duration: '3-8dk',
    agents: ['Kalite Kontrol'],
    description: 'Her uzman çıktısı rubrik ile değerlendirilir: evidence, confidence, contradiction.',
    outputs: ['QA decisions', 'Revision requests'],
    qualityGate: 'Tüm çıktılar onaylandı mı?',
    icon: ClipboardCheck,
    color: 'yellow',
    x: 1460, y: 400,
  },
  {
    id: 'synthesis',
    phase: 8,
    title: 'Stratejik Sentez',
    subtitle: 'Strategic Synthesis',
    duration: '5-15dk',
    agents: ['Stratejik Sentez'],
    description: 'Tüm katmanlar birleştirilir, çelişkiler tespit edilir, coherent narratif üretilir.',
    outputs: ['Synthesis report', 'Contradiction reports'],
    icon: Layers,
    color: 'pink',
    x: 1460, y: 550,
  },
  {
    id: 'final',
    phase: 9,
    title: 'Son Rapor',
    subtitle: 'Final Summary',
    duration: '3-8dk',
    agents: ['Son Rapor'],
    description: 'Fundamental, teknik ve yönetici özeti üretilir. Confidence label\'lar korunur.',
    outputs: ['3 raporlar', 'Executive summary'],
    icon: FileText,
    color: 'emerald',
    x: 1460, y: 250,
  },
  {
    id: 'delivery',
    phase: 10,
    title: 'Teslimat',
    subtitle: 'CEO Approval',
    duration: '1-3dk',
    agents: ['CEO Meta-Ajan'],
    description: 'CEO final paketi onaylar, Chairman\'a teslim eder, audit log\'u tamamlar.',
    outputs: ['Delivered reports', 'Audit trail'],
    qualityGate: 'Çelişkiler çözüldü mü?',
    icon: Sparkles,
    color: 'amber',
    x: 1700, y: 400,
  },
]

const edges: FlowEdge[] = [
  { from: 'trigger', to: 'ceo' },
  { from: 'ceo', to: 'data_collection', label: 'fetch' },
  { from: 'ceo', to: 'kap_watch', label: 'monitor' },
  { from: 'data_collection', to: 'parse' },
  { from: 'kap_watch', to: 'event_classification' },
  { from: 'parse', to: 'reconciliation' },
  { from: 'parse', to: 'context' },
  { from: 'reconciliation', to: 'financial' },
  { from: 'context', to: 'financial' },
  { from: 'financial', to: 'sector_macro' },
  { from: 'event_classification', to: 'event_impact' },
  { from: 'financial', to: 'qa' },
  { from: 'sector_macro', to: 'qa' },
  { from: 'event_impact', to: 'qa' },
  { from: 'qa', to: 'synthesis' },
  { from: 'qa', to: 'final' },
  { from: 'synthesis', to: 'final' },
  { from: 'final', to: 'delivery' },
]

const colorMap: Record<NodeColor, { bg: string; border: string; text: string; icon: string; shadow: string; stroke: string; glow: string }> = {
  amber: { bg: '#1a1408', border: '#d97706', text: '#fbbf24', icon: '#fbbf24', shadow: 'rgba(217,119,6,0.3)', stroke: '#b45309', glow: 'rgba(251,191,36,0.15)' },
  blue: { bg: '#0a1020', border: '#2563eb', text: '#60a5fa', icon: '#60a5fa', shadow: 'rgba(37,99,235,0.3)', stroke: '#1d4ed8', glow: 'rgba(96,165,250,0.15)' },
  cyan: { bg: '#051820', border: '#0891b2', text: '#22d3ee', icon: '#22d3ee', shadow: 'rgba(8,145,178,0.3)', stroke: '#0e7490', glow: 'rgba(34,211,238,0.15)' },
  green: { bg: '#051a0c', border: '#16a34a', text: '#4ade80', icon: '#4ade80', shadow: 'rgba(22,163,74,0.3)', stroke: '#15803d', glow: 'rgba(74,222,128,0.15)' },
  indigo: { bg: '#0a0a1f', border: '#4f46e5', text: '#818cf8', icon: '#818cf8', shadow: 'rgba(79,70,229,0.3)', stroke: '#4338ca', glow: 'rgba(129,140,248,0.15)' },
  purple: { bg: '#140820', border: '#9333ea', text: '#c084fc', icon: '#c084fc', shadow: 'rgba(147,51,234,0.3)', stroke: '#7e22ce', glow: 'rgba(192,132,252,0.15)' },
  yellow: { bg: '#1a1505', border: '#ca8a04', text: '#facc15', icon: '#facc15', shadow: 'rgba(202,138,4,0.3)', stroke: '#a16207', glow: 'rgba(250,204,21,0.15)' },
  pink: { bg: '#1a0818', border: '#db2777', text: '#f472b6', icon: '#f472b6', shadow: 'rgba(219,39,119,0.3)', stroke: '#be185d', glow: 'rgba(244,114,182,0.15)' },
  emerald: { bg: '#051a14', border: '#059669', text: '#34d399', icon: '#34d399', shadow: 'rgba(5,150,105,0.3)', stroke: '#047857', glow: 'rgba(52,211,153,0.15)' },
}

// Build a smooth curved path between two nodes
function buildEdgePath(from: FlowNode, to: FlowNode): string {
  const startX = from.x + NODE_WIDTH
  const startY = from.y + NODE_HEIGHT / 2
  const endX = to.x
  const endY = to.y + NODE_HEIGHT / 2
  const midX = (startX + endX) / 2
  return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`
}

const IsAkisi: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [zoom, setZoom] = useState(0.75)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  useEffect(() => {
    // Auto-center on mount
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth
      const h = containerRef.current.offsetHeight
      setPan({
        x: (w - CANVAS_WIDTH * 0.75) / 2,
        y: (h - CANVAS_HEIGHT * 0.75) / 2,
      })
    }
  }, [])

  // Non-passive wheel listener so preventDefault works
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(prev => Math.max(0.3, Math.min(2, prev + delta)))
    }
    el.addEventListener('wheel', wheelHandler, { passive: false })
    return () => el.removeEventListener('wheel', wheelHandler)
  }, [])

  // Global mouse handlers so drag doesn't get stuck when cursor leaves canvas
  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => {
      setPan({
        x: dragStart.current.panX + (e.clientX - dragStart.current.x),
        y: dragStart.current.panY + (e.clientY - dragStart.current.y),
      })
    }
    const onUp = () => setIsDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isDragging])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.flow-node')) return
    setIsDragging(true)
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
  }

  const resetView = () => {
    setZoom(0.75)
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth
      const h = containerRef.current.offsetHeight
      setPan({
        x: (w - CANVAS_WIDTH * 0.75) / 2,
        y: (h - CANVAS_HEIGHT * 0.75) / 2,
      })
    }
  }

  const isConnectedToHovered = (nodeId: string): boolean => {
    if (!hoveredNode) return false
    return edges.some(e => (e.from === hoveredNode && e.to === nodeId) || (e.to === hoveredNode && e.from === nodeId))
  }

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] sm:h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">İş Akışı</h1>
            <p className="text-xs text-slate-500">Otonom analiz pipeline'ı — görsel akış</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="w-9 h-9 bg-[#0f1117] border border-[#2d3148] rounded-lg text-slate-300 hover:bg-[#161a2b] font-semibold"
          >
            +
          </button>
          <span className="text-xs text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
            className="w-9 h-9 bg-[#0f1117] border border-[#2d3148] rounded-lg text-slate-300 hover:bg-[#161a2b] font-semibold"
          >
            −
          </button>
          <button
            onClick={resetView}
            className="text-xs bg-[#0f1117] border border-[#2d3148] text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg"
          >
            Sıfırla
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 card relative overflow-hidden select-none"
        style={{
          backgroundColor: '#0a0c14',
          backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.08) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* Edges SVG */}
          <svg
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#a78bfa" />
              </marker>
            </defs>
            {edges.map((edge, idx) => {
              const fromNode = nodes.find(n => n.id === edge.from)
              const toNode = nodes.find(n => n.id === edge.to)
              if (!fromNode || !toNode) return null
              const path = buildEdgePath(fromNode, toNode)
              const isActive = hoveredNode === edge.from || hoveredNode === edge.to
              return (
                <g key={idx}>
                  <path
                    d={path}
                    stroke={isActive ? '#a78bfa' : '#334155'}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    fill="none"
                    markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  {edge.label && (
                    <text
                      x={(fromNode.x + NODE_WIDTH + toNode.x) / 2}
                      y={(fromNode.y + toNode.y + NODE_HEIGHT) / 2 - 6}
                      fill="#64748b"
                      fontSize="10"
                      textAnchor="middle"
                      style={{ userSelect: 'none' }}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const colors = colorMap[node.color]
            const Icon = node.icon
            const isHovered = hoveredNode === node.id
            const isConnected = isConnectedToHovered(node.id)
            const isDimmed = hoveredNode && !isHovered && !isConnected

            return (
              <div
                key={node.id}
                className="flow-node absolute cursor-pointer transition-all"
                style={{
                  left: node.x,
                  top: node.y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                  opacity: isDimmed ? 0.35 : 1,
                  transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                  zIndex: isHovered ? 10 : 1,
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedNode(node)
                }}
              >
                <div
                  className="w-full h-full rounded-xl border-2 p-3 flex flex-col justify-between"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    boxShadow: isHovered
                      ? `0 12px 28px ${colors.shadow}, 0 0 0 4px ${colors.glow}`
                      : `0 4px 12px rgba(0,0,0,0.4)`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${colors.border}25`, border: `1px solid ${colors.border}` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: colors.icon }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: colors.text, opacity: 0.7 }}>
                        {node.subtitle}
                      </div>
                      <div className="text-sm font-bold text-slate-100 truncate leading-tight">
                        {node.title}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono" style={{ backgroundColor: `${colors.border}20`, color: colors.text }}>
                      #{node.phase}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{node.duration}</span>
                    {node.qualityGate && (
                      <Shield className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Minimap hint */}
        <div className="absolute bottom-4 left-4 text-[10px] text-slate-600 bg-[#0f1117]/80 border border-[#2d3148] rounded-lg px-3 py-2 backdrop-blur-sm pointer-events-none">
          <div>🖱 Sürükle ile hareket et</div>
          <div>⚙ Fare tekerleği ile yakınlaş</div>
          <div>👆 Düğüme tıkla ile detay</div>
        </div>

        {/* Stats overlay */}
        <div className="absolute top-4 right-4 bg-[#0f1117]/80 border border-[#2d3148] rounded-lg p-3 backdrop-blur-sm pointer-events-none">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            <span className="text-slate-500">Düğüm:</span>
            <span className="text-slate-200 font-semibold">{nodes.length}</span>
            <span className="text-slate-500">Bağlantı:</span>
            <span className="text-slate-200 font-semibold">{edges.length}</span>
            <span className="text-slate-500">Faz:</span>
            <span className="text-slate-200 font-semibold">{Math.max(...nodes.map(n => n.phase))}</span>
            <span className="text-slate-500">Kalite geçidi:</span>
            <span className="text-slate-200 font-semibold">{nodes.filter(n => n.qualityGate).length}</span>
          </div>
        </div>
      </div>

      {/* Node Detail Panel */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedNode(null)}>
          <div
            className="bg-[#1a1d27] border border-[#2d3148] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="p-6 border-b border-[#2d3148]"
              style={{
                background: `linear-gradient(135deg, ${colorMap[selectedNode.color].border}15, transparent)`,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: colorMap[selectedNode.color].bg,
                      borderColor: colorMap[selectedNode.color].border,
                    }}
                  >
                    <selectedNode.icon className="w-6 h-6" style={{ color: colorMap[selectedNode.color].icon }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: colorMap[selectedNode.color].text }}>
                      {selectedNode.subtitle} · FAZ {selectedNode.phase}
                    </div>
                    <h2 className="text-xl font-bold text-slate-100">{selectedNode.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                        backgroundColor: `${colorMap[selectedNode.color].border}20`,
                        color: colorMap[selectedNode.color].text,
                        border: `1px solid ${colorMap[selectedNode.color].border}40`,
                      }}>
                        {selectedNode.duration}
                      </span>
                      {selectedNode.qualityGate && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-medium flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" />
                          KALİTE GEÇİDİ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-2 rounded-lg hover:bg-[#222537] text-slate-500 hover:text-slate-200 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              <div>
                <h3 className="text-[11px] font-semibold uppercase text-slate-500 mb-2 tracking-wider">Açıklama</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedNode.description}</p>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold uppercase text-slate-500 mb-2 tracking-wider">Sorumlu Ajanlar</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.agents.map((a) => (
                    <span key={a} className="text-xs bg-[#0f1117] border border-[#2d3148] text-slate-300 px-3 py-1.5 rounded-lg">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold uppercase text-slate-500 mb-2 tracking-wider">Çıktılar</h3>
                <div className="space-y-1.5">
                  {selectedNode.outputs.map((o, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400 bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorMap[selectedNode.color].border }} />
                      {o}
                    </div>
                  ))}
                </div>
              </div>

              {selectedNode.qualityGate && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase text-slate-500 mb-2 tracking-wider">Kalite Geçidi</h3>
                  <div className="flex items-center gap-2 text-xs text-yellow-300 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2.5">
                    <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                    {selectedNode.qualityGate}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IsAkisi
