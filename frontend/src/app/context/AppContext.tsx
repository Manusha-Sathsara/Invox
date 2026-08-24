import { createContext, useContext, useState, type ReactNode } from 'react'
import { TENANTS, APP_USERS } from '../App'
import type { Tenant, AppUser } from '../App'

interface AppContextValue {
  isDark: boolean
  toggleDark: () => void
  isAuthenticated: boolean
  login: () => void
  logout: () => void
  currentUser: AppUser
  setCurrentUser: (u: AppUser) => void
  currentTenant: Tenant
  setCurrentTenant: (t: Tenant) => void
}

const AppContext = createContext<AppContextValue>(null!)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<AppUser>(APP_USERS.Admin)
  const [currentTenant, setCurrentTenant] = useState<Tenant>(TENANTS[0])

  return (
    <AppContext.Provider value={{
      isDark,
      toggleDark: () => setIsDark(d => !d),
      isAuthenticated,
      login: () => setIsAuthenticated(true),
      logout: () => setIsAuthenticated(false),
      currentUser,
      setCurrentUser,
      currentTenant,
      setCurrentTenant,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
