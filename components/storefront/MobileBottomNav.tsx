'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, ShoppingBag, LayoutGrid, Building2, User, ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams ? searchParams.get('tab') : null
  const { count, isB2BMode, open, isOpen } = useCart()
  const [user, setUser] = useState<any>(null)

  // Fetch logged in user to check if they have registered B2B status
  useEffect(() => {
    let isMounted = true
    const fetchUser = () => {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) {
            setUser(data.user || null)
          }
        })
        .catch(() => {
          if (isMounted) setUser(null)
        })
    }

    fetchUser()

    const handleAuthChange = () => fetchUser()
    window.addEventListener('auth-change', handleAuthChange)
    window.addEventListener('storage', handleAuthChange)

    return () => {
      isMounted = false
      window.removeEventListener('auth-change', handleAuthChange)
      window.removeEventListener('storage', handleAuthChange)
    }
  }, [pathname])

  // Hide on admin/driver dashboard pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/driver')) {
    return null
  }

  const isActive = (path: string, tab?: string) => {
    if (tab) {
      return pathname === path && tabParam === tab
    }
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path) && !tabParam
  }

  const isB2BEnabled = isB2BMode || Boolean(user?.isB2B)

  interface NavItem {
    label: string
    href?: string
    onClick?: () => void
    icon: React.ComponentType<{ className?: string }>
    active: boolean
    badge?: string
    count?: number
  }

  const navItems: NavItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      active: isActive('/'),
    },
    {
      label: 'Order Again',
      href: '/account?tab=orders',
      icon: ShoppingBag,
      active: isActive('/account', 'orders'),
    },
    {
      label: 'Categories',
      href: '/categories',
      icon: LayoutGrid,
      active: isActive('/categories'),
    },
    // Show B2B Partner ONLY if user has B2B enabled; otherwise show Cart option
    isB2BEnabled
      ? {
          label: 'B2B Partner',
          href: '/account?tab=b2b',
          icon: Building2,
          active: isActive('/account', 'b2b'),
          badge: 'B2B',
        }
      : {
          label: 'Cart',
          onClick: () => open(),
          icon: ShoppingCart,
          active: isOpen,
          count: count,
        },
    {
      label: 'Account',
      href: '/account',
      icon: User,
      active: pathname === '/account' && !tabParam,
    },
  ]

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-[90] bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden no-print transition-all duration-200"
    >
      <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const content = (
            <>
              {/* Active Top Bar Indicator */}
              {item.active && (
                <span className="absolute top-0 w-8 h-1 bg-brand-orange rounded-b-full shadow-sm shadow-brand-orange/40 animate-fade-in" />
              )}

              {/* Icon */}
              <div className="relative mt-0.5">
                <Icon className={`w-5 h-5 transition-transform duration-150 ${item.active ? 'scale-110' : ''}`} />
                
                {/* Special B2B Badge */}
                {item.badge && !item.active && (
                  <span className="absolute -top-1.5 -right-3.5 bg-purple-600 text-white text-[8px] font-black px-1 py-0.2 rounded-full uppercase tracking-tighter shadow-sm">
                    {item.badge}
                  </span>
                )}

                {/* Cart Count Badge */}
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#0c831f] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-sm min-w-[16px] text-center leading-tight">
                    {item.count}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] tracking-tight leading-none mt-1 ${item.active ? 'font-black' : 'font-semibold'}`}>
                {item.label}
              </span>
            </>
          )

          const commonClass = `flex flex-col items-center justify-center flex-1 h-full py-1 px-1 relative transition-all duration-150 tap-scale select-none ${
            item.active 
              ? 'text-brand-orange font-bold' 
              : 'text-gray-400 hover:text-gray-600 font-semibold'
          }`

          if (item.onClick) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={commonClass}
              >
                {content}
              </button>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href || '/'}
              className={commonClass}
            >
              {content}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
