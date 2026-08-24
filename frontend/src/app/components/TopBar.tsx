import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import { Search, Bell, Sun, Moon, Plus, Menu, FileText, LayoutDashboard, Users, Package, Settings, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { ViewType } from '../App'

interface TopBarProps {
  currentView: ViewType
  notificationCount: number
  onMobileMenuToggle: () => void
}

const VIEW_LABELS: Record<ViewType, { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  landing:         { label: 'Home',           icon: LayoutDashboard },
  login:           { label: 'Sign In',         icon: LayoutDashboard },
  register:        { label: 'Register',        icon: LayoutDashboard },
  dashboard:       { label: 'Dashboard',       icon: LayoutDashboard },
  invoices:        { label: 'Invoices',        icon: FileText        },
  'invoice-editor':{ label: 'Invoice Editor',  icon: FileText        },
  customers:       { label: 'Customers',       icon: Users           },
  products:        { label: 'Products',        icon: Package         },
  settings:        { label: 'Team & Settings', icon: Settings        },
}

const NOTIFICATIONS = [
  { id: '1', title: 'Invoice #INV-2024-005 paid',  desc: 'Figma Corp paid $8,800',       time: '2m ago', type: 'success' },
  { id: '2', title: 'Invoice overdue',              desc: 'Linear Labs – #INV-2023-098',  time: '1h ago', type: 'warning' },
  { id: '3', title: 'New customer added',           desc: 'Webflow Inc joined',           time: '3h ago', type: 'info'    },
]

export function TopBar({ currentView, notificationCount, onMobileMenuToggle }: TopBarProps) {
  const { isDark, toggleDark, currentUser, currentTenant } = useApp()
  const navigate = useNavigate()
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setNotifOpen(false) }, [currentView])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const viewConfig = VIEW_LABELS[currentView] ?? VIEW_LABELS.dashboard
  const ViewIcon = viewConfig.icon
  const canCreate = currentUser.role !== 'Viewer'

  const handleCreateInvoice = () => navigate(`/${currentTenant.slug}/invoices/new`)

  const topBarBg = isDark
    ? 'bg-slate-950/60 backdrop-blur-xl border-b border-white/[0.06]'
    : 'bg-white/60 backdrop-blur-xl border-b border-black/[0.06]'

  return (
    <div className={`flex items-center h-16 px-3 lg:px-6 gap-2 lg:gap-4 flex-shrink-0 min-w-0 ${topBarBg}`} style={{ position: 'relative', zIndex: 10 }}>
      {/* Mobile menu */}
      <button
        onClick={onMobileMenuToggle}
        className={`lg:hidden p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-black/5 text-slate-600'}`}
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex items-center gap-2">
        <ViewIcon size={18} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
        <h1 className={`text-base hidden sm:block ${isDark ? 'text-slate-100' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
          {viewConfig.label}
        </h1>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:block">
        <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
          searchFocused
            ? isDark ? 'border-indigo-500/50 bg-white/[0.06] shadow-lg shadow-indigo-500/10' : 'border-indigo-300 bg-white/80 shadow-lg shadow-indigo-500/10'
            : isDark ? 'border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.06]' : 'border-black/[0.07] bg-black/[0.03] hover:bg-black/[0.05]'
        }`}>
          <Search size={15} className={`absolute left-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search invoices, customers…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`w-full bg-transparent pl-9 pr-4 py-2 text-sm outline-none ${isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-700 placeholder:text-slate-400'}`}
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-3"
              >
                <X size={14} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Create Invoice */}
        {canCreate ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateInvoice}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white shadow-lg shadow-indigo-500/25 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', fontWeight: 600 }}
          >
            <Plus size={15} />
            New Invoice
          </motion.button>
        ) : (
          <div className="relative hidden sm:block group">
            <button
              disabled
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm cursor-not-allowed opacity-50 ${isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-400'}`}
              style={{ fontWeight: 600 }}
            >
              <Plus size={15} />
              New Invoice
            </button>
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[600] ${isDark ? 'bg-slate-800 text-slate-200 border border-white/10' : 'bg-slate-800 text-white'}`}>
              Viewers cannot create invoices
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotifOpen(!notifOpen)}
            className={`relative p-2.5 rounded-xl border transition-all ${isDark ? 'border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300' : 'border-black/[0.07] bg-black/[0.03] hover:bg-black/[0.06] text-slate-600'}`}
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex">
                <span className="animate-ping absolute h-2 w-2 rounded-full bg-indigo-400 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-indigo-500" />
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl overflow-hidden"
                style={{ zIndex: 600 }}
              >
                <div className={`${isDark ? 'bg-slate-900/98 backdrop-blur-xl border-white/[0.08]' : 'bg-white/98 backdrop-blur-xl border-black/[0.08]'} rounded-2xl border shadow-2xl`}>
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                    <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>Notifications</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500 text-white" style={{ fontWeight: 600 }}>{notificationCount}</span>
                      <button onClick={() => setNotifOpen(false)} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-500' : 'hover:bg-black/5 text-slate-400'}`}>
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                  <div>
                    {NOTIFICATIONS.map((n, i) => (
                      <motion.button
                        key={n.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`w-full px-4 py-3 text-left transition-colors border-b ${isDark ? 'hover:bg-white/[0.04] border-white/[0.04]' : 'hover:bg-slate-50 border-black/[0.04]'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 600 }}>{n.title}</p>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{n.desc}</p>
                          </div>
                          <span className={`text-[11px] flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{n.time}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 text-center">
                    <button className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
                      Mark all as read
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dark mode toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDark}
          className={`p-2.5 rounded-xl border transition-all ${isDark ? 'border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.08] text-amber-400' : 'border-black/[0.07] bg-black/[0.03] hover:bg-black/[0.06] text-slate-600'}`}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Sun size={18} />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Moon size={18} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}
