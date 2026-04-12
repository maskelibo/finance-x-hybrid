import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlayCircle,
  Bot,
  ClipboardList,
  Bell,
  FileText,
  DollarSign,
  Settings,
  TrendingUp,
  Activity,
  Crown,
  Network,
  GitBranch,
  X,
  GitCompare,
} from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

const navGroups: Array<{ title: string; items: Array<{ to: string; label: string; icon: any; end?: boolean; badge?: string }> }> = [
  {
    title: 'Operasyon',
    items: [
      { to: '/', label: 'Genel Bakış', icon: LayoutDashboard, end: true },
      { to: '/analiz', label: 'Analiz Başlat', icon: PlayCircle, badge: 'Yeni' },
      { to: '/gorevler', label: 'Görevler', icon: ClipboardList },
      { to: '/raporlar', label: 'Raporlar', icon: FileText },
      { to: '/karsilastir', label: 'Karşılaştır', icon: GitCompare },
      { to: '/kap-olaylari', label: 'KAP Olayları', icon: Bell },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      { to: '/ceo', label: 'CEO Sohbet', icon: Crown },
      { to: '/ceo-aktivite', label: 'CEO Yönetim', icon: Activity },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { to: '/agentlar', label: 'Agentlar', icon: Bot },
      { to: '/organizasyon', label: 'Organizasyon', icon: Network },
      { to: '/is-akisi', label: 'İş Akışı', icon: GitBranch },
      { to: '/maliyetler', label: 'Maliyetler', icon: DollarSign },
    ],
  },
]

const bottomItems = [
  {
    to: '/ayarlar',
    label: 'Ayarlar',
    icon: Settings,
    end: false,
  },
]

const Sidebar: React.FC = () => {
  const { mobileOpen, setMobileOpen, isMobile } = useSidebar()

  // Close drawer when nav item clicked on mobile
  const handleNavClick = () => {
    if (isMobile) setMobileOpen(false)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`w-64 min-h-screen bg-[#13162299] border-r border-[#2d3148] flex flex-col fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300 ${
        isMobile && !mobileOpen ? '-translate-x-full' : 'translate-x-0'
      }`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#2d3148] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
            <span className="text-white font-black text-sm tracking-tight">FX</span>
          </div>
          <div>
            <div className="font-bold text-slate-100 text-base leading-tight">Finance X</div>
            <div className="text-[11px] text-slate-500 leading-tight">Finansal Analiz Platformu</div>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#222537] text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* System Status */}
      <div className="px-4 py-3 border-b border-[#2d3148]">
        <div className="bg-[#0f1117] rounded-lg px-3 py-2 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs text-slate-400">Sistem</span>
          <span className="ml-auto text-xs font-medium text-green-400">Çevrimiçi</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
              {group.title}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#222537] border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[#2d3148] space-y-1">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#222537] border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}

        {/* Version */}
        <div className="px-3 pt-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-slate-600" />
            <span className="text-[11px] text-slate-600">Finance X v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  )
}

export default Sidebar
