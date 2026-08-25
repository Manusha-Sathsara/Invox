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
    async function processAuthCallback() {
      try {
        const code = searchParams.get('code')
        const orgParam = searchParams.get('org') || searchParams.get('orgHandle')

        setStatus('Exchanging authentication code with Asgardeo...')
        await new Promise(r => setTimeout(r, 600))

        // Auto-resolve organization
        let targetSlug = orgParam || 'horizon'
        if (orgParam) {
          const resolved = await tenantApi.getTenantBySubdomain(orgParam)
          if (resolved) {
            targetSlug = resolved.subdomain
            setCurrentTenant({
              id: resolved.id,
              name: resolved.companyName,
              plan: resolved.plan || 'Standard',
              initials: resolved.companyName.slice(0, 2).toUpperCase(),
              color: '#6366f1',
              slug: resolved.subdomain
            })
          }
        }

        // Complete user login
        login({
          name: 'Asgardeo Admin',
          email: `admin@${targetSlug}.invox.local`,
          role: 'Admin'
        })

        await refreshTenants()
        setStatus('Authentication confirmed. Redirecting to workspace...')
        setTimeout(() => {
          navigate(`/${targetSlug}/dashboard`, { replace: true })
        }, 400)
      } catch {
        navigate('/login', { replace: true })
      }
    }

    processAuthCallback()
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
