import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, useParams } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../context/AppContext'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'
import { TENANTS } from '../App'
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
  const { isAuthenticated, currentTenant, setCurrentTenant } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const { tenant: tenantSlug } = useParams()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Auth guard — redirect to /login with return URL
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`, { replace: true })
    }
  }, [isAuthenticated, location.pathname, navigate])

  // Sync tenant from URL slug
  useEffect(() => {
    const found = TENANTS.find(t => t.slug === tenantSlug)
    if (found && found.id !== currentTenant.id) setCurrentTenant(found)
  }, [tenantSlug])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  if (!isAuthenticated) return null

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
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
