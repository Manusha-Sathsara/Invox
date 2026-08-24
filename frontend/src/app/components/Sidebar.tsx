import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import {
  Zap, LayoutDashboard, FileText, Users, Package, Settings,
  ChevronDown, Check, Layers, Shield, BookOpen, Eye,
  ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { TENANTS, APP_USERS } from '../App'
import type { ViewType } from '../App'

interface SidebarProps {
  currentView: ViewType
  collapsed: boolean
  onCollapsedChange: (v: boolean) => void
  mobileOpen: boolean
}

const navItems = [
  { id: 'dashboard' as ViewType, label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'invoices'  as ViewType, label: 'Invoices',        icon: FileText        },
  { id: 'customers' as ViewType, label: 'Customers',       icon: Users           },
  { id: 'products'  as ViewType, label: 'Products',        icon: Package         },
  { id: 'settings'  as ViewType, label: 'Team & Settings', icon: Settings        },
]

const roleConfig = {
  Admin:      { icon: Shield,   color: 'text-indigo-500',  bg: 'bg-indigo-50 border-indigo-200/50'    },
  Accountant: { icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200/50'  },
  Viewer:     { icon: Eye,      color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200/50'      },
}

const roleConfigDark = {
  Admin:      { color: 'text-indigo-400',  bg: 'bg-indigo-900/30 border-indigo-700/30'   },
  Accountant: { color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-700/30' },
  Viewer:     { color: 'text-slate-400',   bg: 'bg-slate-800/50 border-slate-700/30'     },
}

export function Sidebar({ currentView, collapsed, onCollapsedChange, mobileOpen }: SidebarProps) {
  const { isDark, currentTenant, setCurrentTenant, currentUser, setCurrentUser, logout } = useApp()
  const navigate = useNavigate()

  const [tenantDropOpen, setTenantDropOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [tenantRect, setTenantRect] = useState<DOMRect | null>(null)
  const [userRect, setUserRect] = useState<DOMRect | null>(null)

  const tenantBtnRef = useRef<HTMLButtonElement>(null)
  const userBtnRef = useRef<HTMLButtonElement>(null)
  const tenantPortalRef = useRef<HTMLDivElement>(null)
  const userPortalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as Node
      if (tenantBtnRef.current && !tenantBtnRef.current.contains(t) && tenantPortalRef.current && !tenantPortalRef.current.contains(t))
        setTenantDropOpen(false)
      if (userBtnRef.current && !userBtnRef.current.contains(t) && userPortalRef.current && !userPortalRef.current.contains(t))
        setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setTenantDropOpen(false)
    setUserMenuOpen(false)
  }, [currentView])

  const openTenantDrop = () => {
    if (tenantBtnRef.current) setTenantRect(tenantBtnRef.current.getBoundingClientRect())
    setTenantDropOpen(v => !v)
  }

  const openUserMenu = () => {
    if (userBtnRef.current) setUserRect(userBtnRef.current.getBoundingClientRect())
    setUserMenuOpen(v => !v)
  }

  const handleNavClick = (view: ViewType) => {
    navigate(`/${currentTenant.slug}/${view}`)
  }

  const handleTenantSwitch = (tenant: typeof TENANTS[0]) => {
    setCurrentTenant(tenant)
    setTenantDropOpen(false)
    navigate(`/${tenant.slug}/dashboard`)
  }

  const handleLogout = () => {
    setUserMenuOpen(false)
    logout()
    navigate('/')
  }

  const sidebarBase = `
    fixed top-0 left-0 h-full flex flex-col z-40
    border-r transition-all duration-300
    ${collapsed ? 'w-[72px]' : 'w-64'}
    ${isDark
      ? 'bg-slate-950/80 backdrop-blur-2xl border-white/[0.06]'
      : 'bg-white/80 backdrop-blur-2xl border-black/[0.06]'}
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `

  const dropdownBase = isDark
    ? 'bg-slate-900 border border-white/[0.08] shadow-2xl shadow-black/60'
    : 'bg-white border border-black/[0.08] shadow-2xl shadow-black/20'

  const activeView = currentView === 'invoice-editor' ? 'invoices' : currentView
  const RoleIcon = roleConfig[currentUser.role].icon
  const roleColor = isDark ? roleConfigDark[currentUser.role].color : roleConfig[currentUser.role].color
  const roleBg = isDark ? roleConfigDark[currentUser.role].bg : roleConfig[currentUser.role].bg

  return (
    <>
      <div className={sidebarBase}>
        {/* Header */}
        <div className={`flex items-center px-4 h-16 border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.05]'}`}>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2.5 flex-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
                <Zap size={16} className="text-white" />
              </div>
              <span className={`text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
                Invox
              </span>
            </motion.div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 mx-auto">
              <Zap size={16} className="text-white" />
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => onCollapsedChange(!collapsed)}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {collapsed && (
          <div className={`flex justify-center py-2 border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.05]'}`}>
            <button
              onClick={() => onCollapsedChange(false)}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Tenant switcher */}
        {!collapsed && (
          <div className="px-3 py-3">
            <p className={`text-[10px] uppercase tracking-wider px-2 mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} style={{ fontWeight: 600 }}>
              Workspace
            </p>
            <button
              ref={tenantBtnRef}
              onClick={openTenantDrop}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-all duration-150 ${
                isDark
                  ? 'bg-white/[0.04] hover:bg-white/[0.07] border-white/[0.07] text-white'
                  : 'bg-black/[0.03] hover:bg-black/[0.06] border-black/[0.06] text-slate-800'
              }`}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow" style={{ background: currentTenant.color, fontSize: '11px', fontWeight: 700 }}>
                {currentTenant.initials}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 600 }}>{currentTenant.name}</p>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentTenant.plan} Plan</p>
              </div>
              <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'} ${tenantDropOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className={`text-[10px] uppercase tracking-wider px-2 mb-1.5 mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} style={{ fontWeight: 600 }}>
              Navigation
            </p>
          )}
          {navItems.map((item) => {
            const isActive = activeView === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? isDark ? 'text-white' : 'text-indigo-700'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-black/[0.04]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className={`absolute inset-0 rounded-xl ${isDark ? 'bg-white/[0.08] border border-white/[0.1]' : 'bg-indigo-50 border border-indigo-100'}`}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon size={18} className={`relative z-10 flex-shrink-0 ${isActive ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : ''}`} />
                {!collapsed && (
                  <span className="relative z-10" style={{ fontWeight: isActive ? 600 : 400 }}>
                    {item.label}
                  </span>
                )}
                {isActive && !collapsed && <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </button>
            )
          })}
        </nav>

        {/* User profile */}
        <div className={`px-3 pb-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.05]'}`}>
          {!collapsed && (
            <div className="pt-3">
              {/* Role switcher (demo) */}
              <div className="flex gap-1 mb-2">
                {(Object.keys(APP_USERS) as (keyof typeof APP_USERS)[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setCurrentUser(APP_USERS[role])}
                    className={`flex-1 py-1 rounded-lg text-[10px] transition-all border ${
                      currentUser.role === role
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : isDark
                          ? 'border-white/[0.08] text-slate-400 hover:bg-white/[0.05]'
                          : 'border-black/[0.06] text-slate-500 hover:bg-black/[0.03]'
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <button
                ref={userBtnRef}
                onClick={openUserMenu}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-black/[0.04]'}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs flex-shrink-0 shadow-md" style={{ fontWeight: 700 }}>
                  {currentUser.initials}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 600 }}>{currentUser.name}</p>
                  <p className={`text-[11px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{currentUser.email}</p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${roleBg} ${roleColor}`} style={{ fontWeight: 600 }}>
                  <RoleIcon size={9} />
                  {currentUser.role}
                </div>
              </button>
            </div>
          )}

          {collapsed && (
            <div className="pt-3 flex justify-center">
              <button className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs shadow-md" style={{ fontWeight: 700 }}>
                {currentUser.initials}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tenant dropdown — portaled to escape stacking context */}
      {createPortal(
        <AnimatePresence>
          {tenantDropOpen && tenantRect && (
            <motion.div
              ref={tenantPortalRef}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'fixed', top: tenantRect.bottom + 6, left: tenantRect.left, width: tenantRect.width, zIndex: 99999 }}
              className={`rounded-xl overflow-hidden ${dropdownBase}`}
            >
              {TENANTS.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleTenantSwitch(tenant)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors ${isDark ? 'hover:bg-white/[0.06] text-slate-200' : 'hover:bg-black/[0.04] text-slate-800'}`}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: tenant.color, fontSize: '11px', fontWeight: 700 }}>
                    {tenant.initials}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm" style={{ fontWeight: 500 }}>{tenant.name}</p>
                    <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{tenant.plan}</p>
                  </div>
                  {currentTenant.id === tenant.id && <Check size={14} className="text-indigo-500" />}
                </button>
              ))}
              <div className={`border-t mx-1 my-1 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.05]'}`} />
              <button className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${isDark ? 'hover:bg-white/[0.06] text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'}`}>
                <Layers size={14} />
                Manage Workspaces
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* User menu — portaled to escape stacking context */}
      {createPortal(
        <AnimatePresence>
          {userMenuOpen && userRect && (
            <motion.div
              ref={userPortalRef}
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'fixed', bottom: window.innerHeight - userRect.top + 4, left: userRect.left, width: userRect.width, zIndex: 99999 }}
              className={`rounded-xl overflow-hidden ${dropdownBase}`}
            >
              <div className={`px-3 py-2.5 border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.05]'}`}>
                <p className={`text-xs truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>{currentUser.name}</p>
                <p className={`text-[11px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{currentUser.email}</p>
              </div>
              <button className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${isDark ? 'hover:bg-white/[0.06] text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                <Settings size={14} />
                Account Settings
              </button>
              <div className={`border-t mx-1 my-1 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.05]'}`} />
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${isDark ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
