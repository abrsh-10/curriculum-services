"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

// Define the navigation item type
export interface NavItem {
  icon: React.ReactNode
  href: string
  label: string
}

interface SidebarProps {
  navItems: NavItem[]
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
}

export default function Sidebar({ navItems, onClick, disabled }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loadingHref, setLoadingHref] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setLoadingHref(null) // Reset loading state when navigation completes
  }, [pathname])

  // Helper function to check if the current path matches the nav item
  const isCurrentPath = (href: string) => {
    // For company admin routes: /[companyId]/path
    if (pathname.split('/').length === 3) {
      const routePattern = href.split('/').slice(2).join('/')
      const currentRoute = pathname.split('/').slice(2).join('/')
      return routePattern === currentRoute
    }
// icog admin routes
    const baseHref = href.split('/')[1]  // 'users' from '/users'
    const basePathname = pathname.split('/')[1]  

    // handle normal and nested routes
    return baseHref === basePathname
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="absolute py-[30px] px-4 z-30 md:hidden"
      >
        <img src="/navResponsive.svg" alt="Menu" width={24} height={24} />
      </button>

      {/* Sidebar - hidden on mobile unless menu is open, shows desktop version on md screens */}
      <div 
        className={cn(
          "fixed left-0 top-0 flex flex-col h-screen bg-[#F8F8F8] transition-all duration-300 z-10",
          // Desktop styles
          "hidden md:flex",
          isCollapsed ? "md:w-[65px]" : "md:w-[200px]",
          // Mobile styles - only show when menu is open
          isMobileMenuOpen ? "flex md:w-[200px] w-[150px] z-20" : "hidden"
        )}
      >
        <div className="flex-1 py-8 ">
          <nav className="space-y-3 py-24 px-2">
            {navItems.map((item, index) => {
              const isLoading = loadingHref === item.href
              const isOtherLinkLoading = loadingHref !== null && !isLoading
              
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs md:text-md relative",
                    "hover:bg-gray-300",
                    isCurrentPath(item.href) ? "text-brand bg-brand-opacity" : "text-gray-700",
                    // Only center justify on desktop when collapsed
                    isCollapsed && "md:justify-center",
                    disabled || isOtherLinkLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-opacity',
                    isLoading && 'opacity-70'
                  )}
                  title={isCollapsed ? item.label : undefined}
                  onClick={(e) => {
                    if (disabled || isOtherLinkLoading) {
                      e.preventDefault()
                      return
                    }
                    
                    // Don't show loading if clicking the current page
                    if (!isCurrentPath(item.href)) {
                      setLoadingHref(item.href)
                    }
                    
                    onClick?.(e)
                  }}
                > 
                  {isLoading ? (
                    <svg 
                      className="animate-spin h-[19px] w-[19px] text-current" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    item.icon
                  )}
                  {/* Always show labels on mobile, only show on desktop when not collapsed */}
                  {(!isCollapsed || isMobileMenuOpen) && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Collapse button - only visible on desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex items-center justify-center gap-3 px-3 py-[13px] mx-2 mb-8 rounded-lg transition-colors text-center border border-[#CED4DA]"
        >
          {isCollapsed ? <img src="/sidebarbutton.svg" alt="icon" width={7} height={8} /> : ""}
          {!isCollapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </>
  )
}
