import React, { createContext, useContext, useEffect, useState } from 'react'

type SidebarContextValue = {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  toggleMobile: () => void
  isMobile: boolean
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const toggleMobile = () => setMobileOpen(o => !o)

  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen, toggleMobile, isMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used inside SidebarProvider')
  return ctx
}
