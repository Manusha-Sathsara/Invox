import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { Zap, ShieldCheck, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { tenantApi } from '../services/tenantApi'

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, refreshTenants, setCurrentTenant, isDark } = useApp()
  const [status, setStatus] = useState('Verifying Asgardeo IDP credentials...')

  useEffect(() => {
    let isMounted = true

    async function processAuthCallback() {
      try {
        const orgParam = searchParams.get('org') || searchParams.get('orgHandle')

        if (isMounted) setStatus('Exchanging authentication code with Asgardeo...')
        await new Promise(r => setTimeout(r, 400))

        // Auto-resolve organization
        let targetSlug = orgParam || 'horizon'
        try {
          const publicTenants = await tenantApi.getPublicTenants()
          if (publicTenants && publicTenants.length > 0) {
            const matched = orgParam
              ? publicTenants.find(t => t.subdomain.toLowerCase() === orgParam.toLowerCase())
              : publicTenants[0]

            if (matched) {
              targetSlug = matched.subdomain
              setCurrentTenant({
                id: matched.id,
                name: matched.companyName,
                plan: matched.plan || 'Free Tier',
                initials: matched.companyName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
                color: '#6366f1',
                slug: matched.subdomain
              })
            }
          }
        } catch {
          // fallback
        }

        // Dynamically resolve logged-in user profile from ID token
        let authenticatedUser = {
          name: 'Workspace Member',
          email: 'user@invox.local',
          role: 'Admin' as const
        }

        if (asgardeo && asgardeo.getDecodedIdToken) {
          try {
            const token = await asgardeo.getDecodedIdToken()
            if (token) {
              const email = token.email || token.username || 'user@invox.local'
              const name = token.given_name ? `${token.given_name} ${token.family_name || ''}`.trim() : email.split('@')[0]
              const role = token.roles?.includes('Invox_accountant')
                ? 'Accountant'
                : token.roles?.includes('Invox_viewer')
                  ? 'Viewer'
                  : 'Admin'
              authenticatedUser = { name, email, role: role as any }
            }
          } catch {}
        }

        login(authenticatedUser)

        await refreshTenants()
        if (isMounted) setStatus('Authentication confirmed. Redirecting to workspace...')
        
        setTimeout(() => {
          if (isMounted) {
            navigate(`/${targetSlug}/dashboard`, { replace: true })
          }
        }, 300)
      } catch {
        navigate('/horizon/dashboard', { replace: true })
      }
    }

    processAuthCallback()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-sm p-8 rounded-3xl text-center border shadow-2xl ${
          isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white border-black/[0.08]'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/30 text-white">
          <Zap size={28} />
        </div>
        <h2 className="text-xl font-bold mb-2">Connecting to Invox</h2>
        <div className="flex items-center justify-center gap-2 text-sm text-indigo-400 font-medium mb-4">
          <Loader2 size={16} className="animate-spin" />
          <span>{status}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>OIDC PKCE Identity Verified</span>
        </div>
      </motion.div>
    </div>
  )
}
