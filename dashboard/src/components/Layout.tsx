import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { WifiOff, Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { api } from '../api'
import { useSidebar } from '../context/SidebarContext'

const Layout: React.FC = () => {
  const [backendOnline, setBackendOnline] = useState(true)
  const [checkedOnce, setCheckedOnce] = useState(false)
  const { isMobile, toggleMobile } = useSidebar()

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        await api.health()
        if (!cancelled) {
          setBackendOnline(true)
          setCheckedOnce(true)
        }
      } catch {
        if (!cancelled) {
          setBackendOnline(false)
          setCheckedOnce(true)
        }
      }
    }
    check()
    const i = setInterval(check, 10000)
    return () => { cancelled = true; clearInterval(i) }
  }, [])

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <Sidebar />
      <main className={`flex-1 min-h-screen ${isMobile ? 'ml-0' : 'ml-64'}`}>
        {/* Mobile header */}
        {isMobile && (
          <div className="sticky top-0 z-20 bg-[#13162299] backdrop-blur-sm border-b border-[#2d3148] px-4 py-3 flex items-center gap-3">
            <button
              onClick={toggleMobile}
              className="p-2 rounded-lg hover:bg-[#222537] text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <span className="text-white font-black text-[10px] tracking-tight">FX</span>
              </div>
              <span className="font-bold text-slate-100 text-sm">Finance X</span>
            </div>
          </div>
        )}

        {checkedOnce && !backendOnline && (
          <div className="sticky top-0 z-30 bg-red-500/90 backdrop-blur-sm border-b border-red-400 text-white text-sm px-4 sm:px-6 py-2.5 flex items-center gap-2">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">
              <strong>Backend bağlantısı yok</strong> — http://localhost:4000 erişilemiyor.
            </span>
          </div>
        )}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
