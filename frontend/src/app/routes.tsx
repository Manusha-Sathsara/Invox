import { createBrowserRouter, redirect, Outlet } from 'react-router'
import { AppProvider, useApp } from './context/AppContext'
import { LandingPage } from './components/LandingPage'
import { LoginPage } from './components/LoginPage'
import { RegisterPage } from './components/RegisterPage'
import { AppLayout } from './layouts/AppLayout'
import { Dashboard } from './components/Dashboard'
import { InvoiceList } from './components/InvoiceList'
import { InvoiceEditor } from './components/InvoiceEditor'
import { CustomersView } from './components/CustomersView'
import { ProductsView } from './components/ProductsView'
import { SettingsView } from './components/SettingsView'

function RootInner() {
  const { isDark } = useApp()
  const bgStyle = {
    background: isDark
      ? 'linear-gradient(135deg, #0a0a1a 0%, #0f1729 50%, #110f2a 100%)'
      : 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #eff6ff 100%)',
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="transition-colors duration-500" style={bgStyle}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full blur-3xl opacity-70 transition-colors duration-500"
            style={{ background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(139,92,246,0.15)' }}
          />
          <div
            className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full blur-3xl opacity-70 transition-colors duration-500"
            style={{ background: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(99,102,241,0.12)' }}
          />
        </div>
        <div className="relative z-[1]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

function Root() {
  return (
    <AppProvider>
      <RootInner />
    </AppProvider>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: 'login', Component: LoginPage },
      { path: 'register', Component: RegisterPage },
      {
        path: ':tenant',
        Component: AppLayout,
        children: [
          { index: true, loader: ({ params }) => redirect(`/${params.tenant}/dashboard`) },
          { path: 'dashboard',      Component: Dashboard     },
          { path: 'invoices',       Component: InvoiceList   },
          { path: 'invoices/new',   Component: InvoiceEditor },
          { path: 'invoices/:id',   Component: InvoiceEditor },
          { path: 'customers',      Component: CustomersView },
          { path: 'products',       Component: ProductsView  },
          { path: 'settings',       Component: SettingsView  },
        ],
      },
      { path: '*', loader: () => redirect('/') },
    ],
  },
])
