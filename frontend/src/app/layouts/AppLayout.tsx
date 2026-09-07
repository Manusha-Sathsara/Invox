import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, useParams } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../context/AppContext'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'
import { Building2, Plus, LogOut } from 'lucide-react'
import type { ViewType } from '../App'

function viewFromPath(pathname: string): ViewType {
  const parts = pathname.split('/').filter(Boolean)
  const section = parts[1] || 'dashboard'
  if (section === 'invoices' && parts.length > 2) return 'invoice-editor'
  const map: Record<string, ViewType> = {
    dashboard: 'dashboard',
    invoices:  'invoices',
    customers: 'customers',
    products:  'products',
    settings:  'settings',
  }
  return (map[section] as ViewType) ?? 'dashboard'
}

export function AppLayout() {
  const { isAuthenticated, tenants, currentTenant, setCurrentTenant, currentUser, logout, isDark } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const { tenant: tenantSlug } = useParams()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const isAuth = isAuthenticated || (typeof window !== 'undefined' && localStorage.getItem('invox_auth') === 'true')

  // Auth guard — redirect to landing page if unauthenticated
  useEffect(() => {
    if (!isAuth) {
      navigate('/', { replace: true })
    }
  }, [isAuth, navigate])

  // Tenant authorization & URL synchronization guard
  useEffect(() => {
    if (!isAuth || tenants.length === 0) return

    const authorizedTenant = tenants.find(t => t.slug.toLowerCase() === tenantSlug?.toLowerCase())
    if (authorizedTenant) {
      if (!currentTenant || currentTenant.id !== authorizedTenant.id) {
        setCurrentTenant(authorizedTenant)
      }
    } else {
      // User is NOT a member of this tenant! Route to their authorized workspace
      navigate(`/${tenants[0].slug}/dashboard`, { replace: true })
    }
  }, [isAuth, tenantSlug, tenants, currentTenant, navigate, setCurrentTenant])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  if (!isAuth) return null

  // If user is authenticated but has no organizations registered
  if (tenants.length === 0 && !currentTenant) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-md p-8 rounded-3xl text-center border shadow-2xl ${
            isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white border-black/[0.08]'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5 text-indigo-400">
            <Building2 size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">No Workspace Found</h2>
          <p className={`text-xs mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Signed in as <span className="font-semibold text-indigo-400">{currentUser.email || 'your account'}</span>
          </p>
          <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Your account is not associated with any organization workspace yet. Register a new company workspace or ask your organization administrator to invite you.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/register')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-500/25"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Plus size={16} />
              Create Organization Workspace
            </button>
            <button
              onClick={logout}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold ${
                isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5'
              }`}
            >
              <LogOut size={14} />
              Sign Out & Switch Account
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const currentView = viewFromPath(location.pathname)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <Sidebar
        currentView={currentView}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
      />

      {/* Sidebar spacer — pushes content on desktop */}
      <div
        className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden z-10 min-w-0">
        <TopBar
          currentView={currentView}
          notificationCount={3}
          onMobileMenuToggle={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
