import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAsgardeo } from '@asgardeo/react'
import { TENANTS, APP_USERS } from '../App'
import type { Tenant, AppUser, UserRole } from '../App'
import { tenantApi, type TenantResponse } from '../services/tenantApi'

interface AppContextValue {
  isDark: boolean
  toggleDark: () => void
  isAuthenticated: boolean
  login: (user?: Partial<AppUser>) => void
  logout: () => void
  currentUser: AppUser
  setCurrentUser: (u: AppUser) => void
  currentTenant: Tenant
  setCurrentTenant: (t: Tenant) => void
  tenants: Tenant[]
  refreshTenants: () => Promise<void>
  asgardeoToken: string | null
  setAsgardeoToken: (t: string | null) => void
  asgardeo: any
}

const AppContext = createContext<AppContextValue>(null!)

export function AppProvider({ children }: { children: ReactNode }) {
  let asgardeo: any = null
  try {
    asgardeo = useAsgardeo()
  } catch {
    // AsgardeoProvider fallback
  }

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('invox_theme') === 'dark'
  })
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('invox_auth') === 'true'
  })
  const [asgardeoToken, setAsgardeoToken] = useState<string | null>(() => {
    return localStorage.getItem('invox_token')
  })
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem('invox_user')
    return saved ? JSON.parse(saved) : APP_USERS.Admin
  })
  const [tenants, setTenants] = useState<Tenant[]>(TENANTS)
  const [currentTenant, setCurrentTenant] = useState<Tenant>(TENANTS[0])

  const refreshTenants = async () => {
    try {
      const publicList = await tenantApi.getPublicTenants()
      if (publicList && publicList.length > 0) {
        const mapped: Tenant[] = publicList.map((t: TenantResponse, idx: number) => ({
          id: t.id,
          name: t.companyName,
          plan: t.plan || 'Free Tier',
          initials: t.companyName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
          color: ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b'][idx % 5],
          slug: t.subdomain || t.asgardeoOrgHandle || t.companyName.toLowerCase().replace(/\s+/g, '-'),
        }))
        setTenants(mapped)
        if (!mapped.some((m: Tenant) => m.slug === currentTenant.slug)) {
          setCurrentTenant(mapped[0])
        }
      }
    } catch {
      // Keep static defaults on network fallback
    }
  }

  useEffect(() => {
    refreshTenants()
  }, [])

  // Synchronize authenticated state with Asgardeo SDK
  useEffect(() => {
    if (asgardeo && asgardeo.isSignedIn) {
      setIsAuthenticated(true)
      localStorage.setItem('invox_auth', 'true')

      asgardeo.getDecodedIdToken?.().then((token: any) => {
        if (token) {
          const email = token.email || token.sub || 'admin@invox.local'
          const role: UserRole = token.roles?.includes('Invox_accountant')
            ? 'Accountant'
            : token.roles?.includes('Invox_viewer')
              ? 'Viewer'
              : 'Admin'
          const userObj: AppUser = {
            id: token.sub || 'user-1',
            name: token.given_name ? `${token.given_name} ${token.family_name || ''}`.trim() : email.split('@')[0],
            email,
            role,
            initials: (token.given_name?.[0] || email[0]).toUpperCase(),
            color: '#6366f1'
          }
          setCurrentUser(userObj)
          localStorage.setItem('invox_user', JSON.stringify(userObj))
        }
      }).catch(() => {})
    }
  }, [asgardeo?.isSignedIn])

  const toggleDark = () => {
    setIsDark(d => {
      const next = !d
      localStorage.setItem('invox_theme', next ? 'dark' : 'light')
      return next
    })
  }

  const login = (userOverride?: Partial<AppUser>) => {
    setIsAuthenticated(true)
    localStorage.setItem('invox_auth', 'true')
    if (userOverride) {
      const updated: AppUser = {
        ...currentUser,
        ...userOverride,
        role: (userOverride.role as UserRole) || currentUser.role,
        initials: userOverride.name
          ? userOverride.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
          : currentUser.initials,
      }
      setCurrentUser(updated)
      localStorage.setItem('invox_user', JSON.stringify(updated))
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setAsgardeoToken(null)
    localStorage.removeItem('invox_auth')
    localStorage.removeItem('invox_token')
    localStorage.removeItem('invox_user')
    if (asgardeo && asgardeo.isSignedIn) {
      asgardeo.signOut?.().catch(() => {})
    }
  }

  const handleSetCurrentUser = (u: AppUser) => {
    setCurrentUser(u)
    localStorage.setItem('invox_user', JSON.stringify(u))
  }

  return (
    <AppContext.Provider value={{
      isDark,
      toggleDark,
      isAuthenticated,
      login,
      logout,
      currentUser,
      setCurrentUser: handleSetCurrentUser,
      currentTenant,
      setCurrentTenant,
      tenants,
      refreshTenants,
      asgardeoToken,
      setAsgardeoToken,
      asgardeo,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
