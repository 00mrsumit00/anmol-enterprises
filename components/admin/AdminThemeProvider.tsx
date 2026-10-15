'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

type AdminTheme = 'dark' | 'light'

interface AdminThemeContextType {
  theme: AdminTheme
  isDark: boolean
  setTheme: (theme: AdminTheme) => void
  toggleTheme: () => void
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined)

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('anmol_admin_theme') as AdminTheme | null
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved)
      } else {
        setThemeState('dark')
      }
    } catch {}
    setMounted(true)
  }, [])

  const setTheme = (newTheme: AdminTheme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem('anmol_admin_theme', newTheme)
    } catch {}
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  const isDark = theme === 'dark'

  return (
    <AdminThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      <div 
        id="admin-theme-root"
        data-admin-theme={theme}
        className={`w-full min-h-screen ${theme === 'light' ? 'admin-theme-light' : 'admin-theme-dark'}`}
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  )
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext)
  if (!context) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider')
  }
  return context
}

export function AdminThemeToggle({ className = '' }: { className?: string }) {
  const { theme, isDark, toggleTheme } = useAdminTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border shadow-xs active:scale-95 ${
        isDark
          ? 'bg-slate-800/90 hover:bg-slate-800 border-slate-700/80 text-amber-400 hover:text-amber-300 hover:border-amber-500/40'
          : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-amber-600 hover:border-amber-500/50'
      } ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  )
}
