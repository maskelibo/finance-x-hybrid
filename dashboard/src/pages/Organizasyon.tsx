import React, { useState, useRef, useEffect } from 'react'
import {
  Crown, Bot, Network, Briefcase, Layers, Zap,
  Database, FileSearch, Shield, Brain, BarChart2, Globe, Building2, TrendingUp,
  GitBranch, FileText, ClipboardCheck, Factory, DollarSign, X, Users,
} from 'lucide-react'

type NodeColor = 'amber' | 'blue' | 'purple' | 'green' | 'cyan' | 'indigo' | 'pink' | 'emerald' | 'yellow' | 'rose'

type OrgNode = {
  id: string
  displayName: string
  role: string
  description: string
  group: 'ceo' | 'management' | 'specialist' | 'event' | 'department'
  color: NodeColor
  icon: React.ComponentType<any>
  x: number
  y: number
  w?: number
  h?: number
}

type OrgEdge = {
  from: string
  to: string
}

// Layout constants
const DEFAULT_W = 200
const DEFAULT_H = 90
const CEO_W = 260
const CEO_H = 110
const DEPT_W = 220
const DEPT_H = 85
const CANVAS_WIDTH = 2200
const CANVAS_HEIGHT = 1200

const nodes: OrgNode[] = [
  // CEO — center top
  {
    id: 'ceo',
    displayName: 'CEO Meta-Ajan',
    role: 'Chairman & CEO',
    description: 'Tüm şirketin yönetim ajanı. Mandateleri yorumlar, görevleri atar, çıktıları onaylar, kalite standartlarını uygular, gerektiğinde yeni agent yarattırır.',
    group: 'ceo',
    color: 'amber',
    icon: Crown,
    x: CANVAS_WIDTH / 2 - CEO_W / 2,
    y: 40,
    w: CEO_W,
    h: CEO_H,
  },

  // C-Level executives (Row 2)
  {
    id: 'orchestrator',
    displayName: 'Orkestratör',
    role: 'COO — Operasyon Direktörü',
    description: 'CEO direktiflerini operasyonel iş akışına dönüştürür, tüm agentları koordine eder, paralel görev yönetimi yapar.',
    group: 'management',
    color: 'blue',
    icon: GitBranch,
    x: CANVAS_WIDTH / 2 - 560,
    y: 220,
    w: DEPT_W,
    h: DEPT_H,
  },
  {
    id: 'qa_review',
    displayName: 'Kalite Kontrol',
    role: 'CQO — Kalite Direktörü',
    description: 'Tüm çıktıları rubrik ile değerlendirir, onaylar veya revizyon ister, contradiction tespit eder.',
    group: 'management',
    color: 'yellow',
    icon: ClipboardCheck,
    x: CANVAS_WIDTH / 2 - 110,
    y: 220,
    w: DEPT_W,
    h: DEPT_H,
  },
  {
    id: 'agent_factory',
    displayName: 'Ajan Fabrikası',
    role: 'CHRO — İK & İnovasyon',
    description: 'Yetenek boşluğu tespit edildiğinde yeni agent tasarlar, mevcut agentları iyileştirir.',
    group: 'management',
    color: 'pink',
    icon: Factory,
    x: CANVAS_WIDTH / 2 + 120,
    y: 220,
    w: DEPT_W,
    h: DEPT_H,
  },
  {
    id: 'cost_performance_optimizer',
    displayName: 'Maliyet Optimize Edici',
    role: 'CFO — Performans',
    description: 'Token/maliyet/süre takibi, bütçe aşımı uyarıları, optimizasyon önerileri.',
    group: 'management',
    color: 'emerald',
    icon: DollarSign,
    x: CANVAS_WIDTH / 2 + 350,
    y: 220,
    w: DEPT_W,
    h: DEPT_H,
  },

  // Department heads (Row 3) — Under Orchestrator
  {
    id: 'dept_data',
    displayName: 'Veri Departmanı',
    role: 'Department',
    description: 'Ham veriyi toplar, parse eder, kalite kontrolü yapar ve bağlam çıkarır.',
    group: 'department',
    color: 'cyan',
    icon: Database,
    x: 120,
    y: 430,
    w: DEPT_W,
    h: DEPT_H,
  },
  {
    id: 'dept_analysis',
    displayName: 'Analiz Departmanı',
    role: 'Department',
    description: 'Finansal, sektör, makro ve teknik analizleri gerçekleştirir.',
    group: 'department',
    color: 'indigo',
    icon: BarChart2,
    x: 700,
    y: 430,
    w: DEPT_W,
    h: DEPT_H,
  },
  {
    id: 'dept_event',
    displayName: 'KAP İstihbarat Ekibi',
    role: 'Department',
    description: 'KAP bildirimlerini izler, sınıflandırır ve finansal etki analizi yapar.',
    group: 'department',
    color: 'purple',
    icon: Zap,
    x: 1280,
    y: 430,
    w: DEPT_W,
    h: DEPT_H,
  },
  {
    id: 'dept_synthesis',
    displayName: 'Sentez & Raporlama',
    role: 'Department',
    description: 'Tüm analizleri birleştirir, coherent narratifi oluşturur, final raporları üretir.',
    group: 'department',
    color: 'rose',
    icon: FileText,
    x: 1860,
    y: 430,
    w: DEPT_W,
    h: DEPT_H,
  },

  // Data team specialists (Row 4)
  {
    id: 'data_collection',
    displayName: 'Veri Toplama',
    role: 'Data Engineer',
    description: 'KAP.gov.tr, BIST ve piyasa verisi kaynaklarından ham veri toplama.',
    group: 'specialist',
    color: 'cyan',
    icon: Database,
    x: 30, y: 630, w: DEFAULT_W, h: DEFAULT_H,
  },
  {
    id: 'parse_standardization',
    displayName: 'Belge Ayrıştırma',
    role: 'Parser Specialist',
    description: 'PDF/XBRL dokümanlarını parse eder, standardize eder, line itemları normalize eder.',
    group: 'specialist',
    color: 'cyan',
    icon: FileSearch,
    x: 250, y: 630, w: DEFAULT_W, h: DEFAULT_H,
  },
  {
    id: 'reconciliation',
    displayName: 'Veri Doğrulama',
    role: 'QA Specialist',
    description: 'Bilanço denkliği, cross-statement linkage, muhasebe bütünlüğü kontrolü yapar.',
    group: 'specialist',
    color: 'cyan',
    icon: Shield,
    x: 30, y: 760, w: DEFAULT_W, h: DEFAULT_H,
  },
  {
    id: 'context_extraction',
    displayName: 'Bağlam Çıkarma',
    role: 'Business Analyst',
    description: 'Faaliyet raporlarından iş modeli, segment, FX duyarlılığı ve risk faktörleri çıkarır.',
    group: 'specialist',
    color: 'cyan',
    icon: Brain,
    x: 250, y: 760, w: DEFAULT_W, h: DEFAULT_H,
  },

  // Analysis team specialists
  {
    id: 'financial_analysis',
    displayName: 'Finansal Analiz',
    role: 'Senior Analyst',
    description: 'Oran analizi, trend analizi, karlılık, likidite, kaldıraç değerlendirmesi — bağlam profiliyle yorumlanır.',
    group: 'specialist',
    color: 'indigo',
    icon: BarChart2,
    x: 610, y: 630, w: DEFAULT_W, h: DEFAULT_H,
  },
  {
    id: 'sector_competition',
    displayName: 'Sektör & Rekabet',
    role: 'Sector Analyst',
    description: 'Endüstri yapısı, rakip karşılaştırması, SWOT, market positioning analizi.',
    group: 'specialist',
    color: 'indigo',
    icon: Building2,
    x: 830, y: 630, w: DEFAULT_W, h: DEFAULT_H,
  },
  {
    id: 'macro_analysis',
    displayName: 'Makro Analiz',
    role: 'Economist',
    description: 'Türkiye makro ekonomi, enflasyon, faiz, TL/USD, policy etkisi analizleri.',
    group: 'specialist',
    color: 'indigo',
    icon: Globe,
    x: 610, y: 760, w: DEFAULT_W, h: DEFAULT_H,
  },
  {
    id: 'technical_analysis',
    displayName: 'Teknik Analiz',
    role: 'Technical Analyst',
    description: 'Grafik analizi, moving average, destek/direnç, hacim, trend analizleri.',
    group: 'specialist',
    color: 'indigo',
    icon: TrendingUp,
    x: 830, y: 760, w: DEFAULT_W, h: DEFAULT_H,
  },

  // KAP Event team specialists
  {
    id: 'kap_watch',
    displayName: 'KAP İzleme',
    role: 'Watch Officer',
    description: 'KAP.gov.tr üzerinden anlık disclosure takibi, materiality filtresi.',
    group: 'event',
    color: 'purple',
    icon: Zap,
    x: 1190, y: 630, w: DEFAULT_W, h: DEFAULT_H,
  },
  {
    id: 'event_classification',
    displayName: 'Olay Sınıflandırma',
    role: 'Classifier',
    description: 'Event tipini tespit eder (sözleşme, CAPEX, borçlanma, yasal, yönetim, vb.).',
    group: 'event',
    color: 'purple',
    icon: Layers,
    x: 1410, y: 630, w: DEFAULT_W, h: DEFAULT_H,
  },
  {
    id: 'event_impact_mapper',
    displayName: 'Etki Haritalama',
    role: 'Impact Analyst',
    description: 'Olayın bilanço/gelir tablosu kalemlerine etkisini haritalar, timing horizon tanımlar.',
    group: 'event',
    color: 'purple',
    icon: BarChart2,
    x: 1190, y: 760, w: DEFAULT_W, h: DEFAULT_H,
  },
  {
    id: 'event_timeline_alert',
    displayName: 'Zaman Çizelgesi',
    role: 'Alert Specialist',
    description: 'Kronolojik event timeline, forward-looking alerts, monitoring flag yönetimi.',
    group: 'event',
    color: 'purple',
    icon: Zap,
    x: 1410, y: 760, w: DEFAULT_W, h: DEFAULT_H,
  },

  // Synthesis team specialists
  {
    id: 'strategic_synthesis',
    displayName: 'Stratejik Sentez',
    role: 'Lead Synthesizer',
    description: 'Tüm analitik katmanları coherent narratife dönüştürür, contradiction detection yapar.',
    group: 'specialist',
    color: 'rose',
    icon: Layers,
    x: 1790, y: 630, w: DEFAULT_W, h: DEFAULT_H,
  },
  {
    id: 'final_summary',
    displayName: 'Son Rapor',
    role: 'Editor-in-Chief',
    description: 'Fundamental, teknik ve yönetici özeti raporlarını üretir, confidence label\'ları korur.',
    group: 'specialist',
    color: 'rose',
    icon: FileText,
    x: 1790, y: 760, w: DEFAULT_W, h: DEFAULT_H,
  },
]

const edges: OrgEdge[] = [
  // CEO → C-level
  { from: 'ceo', to: 'orchestrator' },
  { from: 'ceo', to: 'qa_review' },
  { from: 'ceo', to: 'agent_factory' },
  { from: 'ceo', to: 'cost_performance_optimizer' },

  // Orchestrator → Departments
  { from: 'orchestrator', to: 'dept_data' },
  { from: 'orchestrator', to: 'dept_analysis' },
  { from: 'orchestrator', to: 'dept_event' },
  { from: 'orchestrator', to: 'dept_synthesis' },

  // Data department → specialists
  { from: 'dept_data', to: 'data_collection' },
  { from: 'dept_data', to: 'parse_standardization' },
  { from: 'dept_data', to: 'reconciliation' },
  { from: 'dept_data', to: 'context_extraction' },

  // Analysis department → specialists
  { from: 'dept_analysis', to: 'financial_analysis' },
  { from: 'dept_analysis', to: 'sector_competition' },
  { from: 'dept_analysis', to: 'macro_analysis' },
  { from: 'dept_analysis', to: 'technical_analysis' },

  // Event department → specialists
  { from: 'dept_event', to: 'kap_watch' },
  { from: 'dept_event', to: 'event_classification' },
  { from: 'dept_event', to: 'event_impact_mapper' },
  { from: 'dept_event', to: 'event_timeline_alert' },

  // Synthesis department → specialists
  { from: 'dept_synthesis', to: 'strategic_synthesis' },
  { from: 'dept_synthesis', to: 'final_summary' },
]

const colorMap: Record<NodeColor, { bg: string; bgDeep: string; border: string; text: string; icon: string; shadow: string; glow: string; gradFrom: string; gradTo: string }> = {
  amber: { bg: '#1a1308', bgDeep: '#0f0a05', border: '#d97706', text: '#fbbf24', icon: '#fbbf24', shadow: 'rgba(217,119,6,0.35)', glow: 'rgba(251,191,36,0.2)', gradFrom: '#f59e0b', gradTo: '#b45309' },
  blue: { bg: '#0a1324', bgDeep: '#050a14', border: '#2563eb', text: '#60a5fa', icon: '#60a5fa', shadow: 'rgba(37,99,235,0.3)', glow: 'rgba(96,165,250,0.15)', gradFrom: '#3b82f6', gradTo: '#1d4ed8' },
  cyan: { bg: '#051a22', bgDeep: '#020f14', border: '#0891b2', text: '#22d3ee', icon: '#22d3ee', shadow: 'rgba(8,145,178,0.3)', glow: 'rgba(34,211,238,0.15)', gradFrom: '#06b6d4', gradTo: '#0e7490' },
  green: { bg: '#051a0c', bgDeep: '#020d06', border: '#16a34a', text: '#4ade80', icon: '#4ade80', shadow: 'rgba(22,163,74,0.3)', glow: 'rgba(74,222,128,0.15)', gradFrom: '#22c55e', gradTo: '#15803d' },
  indigo: { bg: '#0a0a20', bgDeep: '#050510', border: '#4f46e5', text: '#818cf8', icon: '#818cf8', shadow: 'rgba(79,70,229,0.3)', glow: 'rgba(129,140,248,0.15)', gradFrom: '#6366f1', gradTo: '#4338ca' },
  purple: { bg: '#140820', bgDeep: '#0a0410', border: '#9333ea', text: '#c084fc', icon: '#c084fc', shadow: 'rgba(147,51,234,0.3)', glow: 'rgba(192,132,252,0.15)', gradFrom: '#a855f7', gradTo: '#7e22ce' },
  yellow: { bg: '#1a1508', bgDeep: '#0f0a04', border: '#ca8a04', text: '#facc15', icon: '#facc15', shadow: 'rgba(202,138,4,0.3)', glow: 'rgba(250,204,21,0.15)', gradFrom: '#eab308', gradTo: '#a16207' },
  pink: { bg: '#1a081a', bgDeep: '#0f040f', border: '#db2777', text: '#f472b6', icon: '#f472b6', shadow: 'rgba(219,39,119,0.3)', glow: 'rgba(244,114,182,0.15)', gradFrom: '#ec4899', gradTo: '#be185d' },
  emerald: { bg: '#051a14', bgDeep: '#020d0a', border: '#059669', text: '#34d399', icon: '#34d399', shadow: 'rgba(5,150,105,0.3)', glow: 'rgba(52,211,153,0.15)', gradFrom: '#10b981', gradTo: '#047857' },
  rose: { bg: '#1a0810', bgDeep: '#0f0408', border: '#e11d48', text: '#fb7185', icon: '#fb7185', shadow: 'rgba(225,29,72,0.3)', glow: 'rgba(251,113,133,0.15)', gradFrom: '#f43f5e', gradTo: '#be123c' },
}

// Orthogonal path (L-shape with rounded corners) like org chart lines
function buildOrgPath(from: OrgNode, to: OrgNode): string {
  const fromW = from.w || DEFAULT_W
  const fromH = from.h || DEFAULT_H
  const toW = to.w || DEFAULT_W

  const startX = from.x + fromW / 2
  const startY = from.y + fromH
  const endX = to.x + toW / 2
  const endY = to.y
  const midY = startY + (endY - startY) / 2

  // Smooth orthogonal path with rounded corners
  return `M ${startX} ${startY} L ${startX} ${midY - 8} Q ${startX} ${midY} ${startX + (endX > startX ? 8 : -8)} ${midY} L ${endX - (endX > startX ? 8 : -8)} ${midY} Q ${endX} ${midY} ${endX} ${midY + 8} L ${endX} ${endY}`
}

const Organizasyon: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null)
  const [zoom, setZoom] = useState(0.55)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth
      setPan({
        x: (w - CANVAS_WIDTH * 0.55) / 2,
        y: 20,
      })
    }
  }, [])

  // Non-passive wheel listener
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.05 : 0.05
      setZoom(prev => Math.max(0.25, Math.min(2, prev + delta)))
    }
    el.addEventListener('wheel', wheelHandler, { passive: false })
    return () => el.removeEventListener('wheel', wheelHandler)
  }, [])

  // Global drag handlers
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
    if ((e.target as HTMLElement).closest('.org-node')) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }

  const resetView = () => {
    setZoom(0.55)
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth
      setPan({ x: (w - CANVAS_WIDTH * 0.55) / 2, y: 20 })
    }
  }

  // Check if node is in hovered subtree (ancestor or descendant)
  const getRelated = (nodeId: string): Set<string> => {
    const related = new Set<string>([nodeId])
    const queue = [nodeId]
    while (queue.length > 0) {
      const current = queue.shift()!
      edges.forEach(e => {
        if (e.from === current && !related.has(e.to)) {
          related.add(e.to)
          queue.push(e.to)
        }
        if (e.to === current && !related.has(e.from)) {
          related.add(e.from)
          queue.push(e.from)
        }
      })
    }
    return related
  }

  const hoveredRelated = hoveredNode ? getRelated(hoveredNode) : null

  const groupCounts = {
    ceo: nodes.filter(n => n.group === 'ceo').length,
    management: nodes.filter(n => n.group === 'management').length,
    department: nodes.filter(n => n.group === 'department').length,
    specialist: nodes.filter(n => n.group === 'specialist').length,
    event: nodes.filter(n => n.group === 'event').length,
  }
  const totalAgents = groupCounts.ceo + groupCounts.management + groupCounts.specialist + groupCounts.event

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] sm:h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <Network className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Organizasyon Şeması</h1>
            <p className="text-xs text-slate-500">Finance X şirket hiyerarşisi ve departman yapısı</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-400">{totalAgents} ajan</span>
          </div>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-9 h-9 bg-[#0f1117] border border-[#2d3148] rounded-lg text-slate-300 hover:bg-[#161a2b] font-semibold">+</button>
          <span className="text-xs text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} className="w-9 h-9 bg-[#0f1117] border border-[#2d3148] rounded-lg text-slate-300 hover:bg-[#161a2b] font-semibold">−</button>
          <button onClick={resetView} className="text-xs bg-[#0f1117] border border-[#2d3148] text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg">Sıfırla</button>
        </div>
      </div>

      {/* Group Stats */}
      <div className="grid grid-cols-5 gap-3 flex-shrink-0">
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">CEO</span>
          </div>
          <div className="text-2xl font-bold text-amber-300">{groupCounts.ceo}</div>
        </div>
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">C-Level</span>
          </div>
          <div className="text-2xl font-bold text-blue-300">{groupCounts.management}</div>
        </div>
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Departman</span>
          </div>
          <div className="text-2xl font-bold text-cyan-300">{groupCounts.department}</div>
        </div>
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Uzman</span>
          </div>
          <div className="text-2xl font-bold text-indigo-300">{groupCounts.specialist}</div>
        </div>
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">KAP Ekibi</span>
          </div>
          <div className="text-2xl font-bold text-purple-300">{groupCounts.event}</div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 card relative overflow-hidden select-none"
        style={{
          backgroundColor: '#070912',
          backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.06) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
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
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {/* Department zone backgrounds */}
          <div style={{ position: 'absolute', left: 15, top: 420, width: 460, height: 470, backgroundColor: 'rgba(6, 182, 212, 0.03)', border: '1px dashed rgba(8, 145, 178, 0.2)', borderRadius: 20 }} />
          <div style={{ position: 'absolute', left: 595, top: 420, width: 460, height: 470, backgroundColor: 'rgba(79, 70, 229, 0.03)', border: '1px dashed rgba(79, 70, 229, 0.2)', borderRadius: 20 }} />
          <div style={{ position: 'absolute', left: 1175, top: 420, width: 460, height: 470, backgroundColor: 'rgba(147, 51, 234, 0.03)', border: '1px dashed rgba(147, 51, 234, 0.2)', borderRadius: 20 }} />
          <div style={{ position: 'absolute', left: 1755, top: 420, width: 240, height: 470, backgroundColor: 'rgba(225, 29, 72, 0.03)', border: '1px dashed rgba(225, 29, 72, 0.2)', borderRadius: 20 }} />

          {/* Edges */}
          <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            {edges.map((edge, idx) => {
              const fromNode = nodes.find(n => n.id === edge.from)
              const toNode = nodes.find(n => n.id === edge.to)
              if (!fromNode || !toNode) return null
              const path = buildOrgPath(fromNode, toNode)
              const isActive = hoveredRelated?.has(edge.from) && hoveredRelated?.has(edge.to)
              return (
                <path
                  key={idx}
                  d={path}
                  stroke={isActive ? colorMap[toNode.color].border : '#2d3148'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transition: 'all 0.25s ease' }}
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const colors = colorMap[node.color]
            const Icon = node.icon
            const w = node.w || DEFAULT_W
            const h = node.h || DEFAULT_H
            const isHovered = hoveredNode === node.id
            const isRelated = hoveredRelated?.has(node.id) ?? false
            const isDimmed = hoveredNode && !isRelated

            const isCEO = node.group === 'ceo'
            const isDept = node.group === 'department'

            return (
              <div
                key={node.id}
                className="org-node absolute cursor-pointer"
                style={{
                  left: node.x,
                  top: node.y,
                  width: w,
                  height: h,
                  opacity: isDimmed ? 0.3 : 1,
                  transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                  zIndex: isHovered ? 20 : isCEO ? 10 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedNode(node)
                }}
              >
                <div
                  className="w-full h-full rounded-xl border-2 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(145deg, ${colors.bg} 0%, ${colors.bgDeep} 100%)`,
                    borderColor: colors.border,
                    boxShadow: isHovered
                      ? `0 16px 40px ${colors.shadow}, 0 0 0 4px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`
                      : isCEO
                      ? `0 8px 24px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.08)`
                      : `0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)`,
                  }}
                >
                  {/* Top accent gradient */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)` }}
                  />

                  {/* Glow corner effect for CEO */}
                  {isCEO && (
                    <div
                      className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl"
                      style={{ backgroundColor: colors.glow }}
                    />
                  )}

                  <div className="relative p-3 h-full flex items-center gap-3">
                    {/* Icon badge */}
                    <div
                      className="flex-shrink-0 rounded-xl flex items-center justify-center"
                      style={{
                        width: isCEO ? 56 : isDept ? 44 : 38,
                        height: isCEO ? 56 : isDept ? 44 : 38,
                        background: `linear-gradient(135deg, ${colors.gradFrom}, ${colors.gradTo})`,
                        boxShadow: `0 4px 12px ${colors.shadow}`,
                      }}
                    >
                      <Icon className="text-white" style={{ width: isCEO ? 28 : isDept ? 22 : 18, height: isCEO ? 28 : isDept ? 22 : 18 }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-slate-100 truncate leading-tight ${isCEO ? 'text-lg' : isDept ? 'text-sm' : 'text-[13px]'}`}>
                        {node.displayName}
                      </div>
                      <div
                        className="text-[10px] font-mono uppercase tracking-wider mt-0.5 truncate"
                        style={{ color: colors.text, opacity: 0.85 }}
                      >
                        {node.role}
                      </div>
                      {isCEO && (
                        <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                          Governance & Strategy
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Department labels */}
          <div style={{ position: 'absolute', left: 20, top: 388, color: '#22d3ee', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6 }}>
            ◆ Veri Departmanı
          </div>
          <div style={{ position: 'absolute', left: 600, top: 388, color: '#818cf8', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6 }}>
            ◆ Analiz Departmanı
          </div>
          <div style={{ position: 'absolute', left: 1180, top: 388, color: '#c084fc', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6 }}>
            ◆ KAP İstihbarat Ekibi
          </div>
          <div style={{ position: 'absolute', left: 1760, top: 388, color: '#fb7185', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6 }}>
            ◆ Sentez & Rapor
          </div>
        </div>

        {/* Minimap / Legend */}
        <div className="absolute bottom-4 left-4 text-[10px] text-slate-600 bg-[#0f1117]/90 border border-[#2d3148] rounded-lg px-3 py-2 backdrop-blur-sm pointer-events-none">
          <div>🖱 Sürükle ile hareket et</div>
          <div>⚙ Fare tekerleği ile yakınlaş</div>
          <div>👆 Düğüme tıkla ile detay</div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedNode(null)}>
          <div
            className="bg-[#1a1d27] border border-[#2d3148] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-6 border-b border-[#2d3148] relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${colorMap[selectedNode.color].border}15, transparent)`,
              }}
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl" style={{ backgroundColor: colorMap[selectedNode.color].glow }} />
              <div className="flex items-start justify-between relative">
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${colorMap[selectedNode.color].gradFrom}, ${colorMap[selectedNode.color].gradTo})`,
                      boxShadow: `0 8px 24px ${colorMap[selectedNode.color].shadow}`,
                    }}
                  >
                    <selectedNode.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: colorMap[selectedNode.color].text }}>
                      {selectedNode.role}
                    </div>
                    <h2 className="text-xl font-bold text-slate-100">{selectedNode.displayName}</h2>
                    <div className="mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                        backgroundColor: `${colorMap[selectedNode.color].border}20`,
                        color: colorMap[selectedNode.color].text,
                        border: `1px solid ${colorMap[selectedNode.color].border}40`,
                      }}>
                        {selectedNode.group === 'ceo' ? 'CEO / Üst Yönetim' :
                         selectedNode.group === 'management' ? 'C-Level Yönetim' :
                         selectedNode.group === 'department' ? 'Departman Başkanı' :
                         selectedNode.group === 'event' ? 'KAP Ekibi' : 'Uzman Ajan'}
                      </span>
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
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              <div>
                <h3 className="text-[11px] font-semibold uppercase text-slate-500 mb-2 tracking-wider">Açıklama</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedNode.description}</p>
              </div>

              {/* Connected agents */}
              {(() => {
                const children = edges.filter(e => e.from === selectedNode.id).map(e => nodes.find(n => n.id === e.to)).filter(Boolean) as OrgNode[]
                const parents = edges.filter(e => e.to === selectedNode.id).map(e => nodes.find(n => n.id === e.from)).filter(Boolean) as OrgNode[]
                return (
                  <>
                    {parents.length > 0 && (
                      <div>
                        <h3 className="text-[11px] font-semibold uppercase text-slate-500 mb-2 tracking-wider">Raporladığı</h3>
                        <div className="flex flex-wrap gap-2">
                          {parents.map((p) => (
                            <span key={p.id} className="text-xs bg-[#0f1117] border border-[#2d3148] text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <p.icon className="w-3 h-3" style={{ color: colorMap[p.color].icon }} />
                              {p.displayName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {children.length > 0 && (
                      <div>
                        <h3 className="text-[11px] font-semibold uppercase text-slate-500 mb-2 tracking-wider">Yönettiği ({children.length})</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {children.map((c) => (
                            <div key={c.id} className="text-xs bg-[#0f1117] border border-[#2d3148] text-slate-300 px-3 py-2 rounded-lg flex items-center gap-2">
                              <c.icon className="w-3 h-3 flex-shrink-0" style={{ color: colorMap[c.color].icon }} />
                              <span className="truncate">{c.displayName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Organizasyon
