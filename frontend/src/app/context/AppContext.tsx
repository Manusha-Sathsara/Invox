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

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim())
}

function formatNameFromEmail(email: string): string {
  const localPart = email.split('@')[0]
  if (isUuid(localPart)) return 'Manusha Sathsara'
  return localPart
    .replace(/[._-]/g, ' ')
    .replace(/\d+/g, '')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase()) || 'Manusha Sathsara'
}

function resolveUserFromToken(token: any): AppUser {
  const email = token.email || token.username || (token.sub && !isUuid(token.sub) ? token.sub : 'admin@horizon.invox.local')
  let name = ''
  
  if (token.given_name) {
    name = `${token.given_name} ${token.family_name || ''}`.trim()
  } else if (token.name && !isUuid(token.name)) {
    name = token.name
  } else if (token.username && !isUuid(token.username)) {
    name = token.username.includes('@') ? formatNameFromEmail(token.username) : token.username
  } else if (token.email) {
    name = formatNameFromEmail(token.email)
  } else {
    name = 'Manusha Sathsara'
  }

  const role: UserRole = token.roles?.includes('Invox_accountant')
    ? 'Accountant'
    : token.roles?.includes('Invox_viewer')
      ? 'Viewer'
      : 'Admin'

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'MS'

  return {
    id: token.sub || 'admin-1',
    name,
    email: email.includes('@') ? email : `${email}@horizon.invox.local`,
    role,
    initials,
  }
}

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
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.name && !isUuid(parsed.name)) return parsed
      } catch {}
    }
    return {
      id: '1',
      name: 'Manusha Sathsara',
      email: 'jayasinghemanushasathsara@gmail.com',
      role: 'Admin',
      initials: 'MS'
    }
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
          const userObj = resolveUserFromToken(token)
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
      let finalName = userOverride.name || currentUser.name
      if (isUuid(finalName)) {
        finalName = userOverride.email ? formatNameFromEmail(userOverride.email) : 'Manusha Sathsara'
      }

      const updated: AppUser = {
        ...currentUser,
        ...userOverride,
        name: finalName,
        role: (userOverride.role as UserRole) || currentUser.role,
        initials: finalName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'MS',
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
    sessionStorage.clear()

    // Clear local authentication cookies
    if (typeof document !== 'undefined') {
      document.cookie.split(';').forEach((c) => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
      })
    }

    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  const handleSetCurrentUser = (u: AppUser) => {
    let cleanUser = { ...u }
    if (isUuid(cleanUser.name)) {
      cleanUser.name = formatNameFromEmail(cleanUser.email || 'admin@invox.local')
      cleanUser.initials = cleanUser.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MS'
    }
    setCurrentUser(cleanUser)
    localStorage.setItem('invox_user', JSON.stringify(cleanUser))
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
