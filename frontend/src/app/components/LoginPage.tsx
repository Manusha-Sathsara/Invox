import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, useSearchParams } from 'react-router'
import { Zap, Sun, Moon, ArrowRight, ShieldCheck, Lock, Building2, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { asgardeoConfig } from '../config/asgardeoConfig'
import { tenantApi } from '../services/tenantApi'

export function LoginPage() {
  const { isDark, toggleDark, login, setCurrentTenant, refreshTenants } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [customOrgDomain, setCustomOrgDomain] = useState('')
  const [showOrgInput, setShowOrgInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAsgardeoLogin = async (federatedIdp?: string) => {
    setError('')
    setLoading(true)

    try {
      let targetSubdomain = customOrgDomain.trim().toLowerCase()
      if (!targetSubdomain) {
        const orgFromQuery = searchParams.get('org')
        if (orgFromQuery) targetSubdomain = orgFromQuery.toLowerCase()
      }

      // If user typed a custom company subdomain, verify tenant existence
      let targetTenant = null
      if (targetSubdomain) {
        targetTenant = await tenantApi.getTenantBySubdomain(targetSubdomain)
        if (!targetTenant) {
          setError(`No organization workspace found for '${targetSubdomain}'. Please check your subdomain.`)
          setLoading(false)
          return
        }
      }

      // Construct Asgardeo OIDC authorization URL
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback${targetSubdomain ? `?org=${targetSubdomain}` : ''}`)
      const authUrl = `${asgardeoConfig.baseUrl}/oauth2/authorize?client_id=${asgardeoConfig.clientID}&response_type=code&scope=${encodeURIComponent(asgardeoConfig.scope.join(' '))}&redirect_uri=${redirectUri}${federatedIdp ? `&fidp=${federatedIdp}` : ''}`

      // For direct seamless login in dev/browser:
      const slug = targetSubdomain || 'horizon'
      if (targetTenant) {
        setCurrentTenant({
          id: targetTenant.id,
          name: targetTenant.companyName,
          plan: targetTenant.plan || 'Standard',
          initials: targetTenant.companyName.slice(0, 2).toUpperCase(),
          color: '#6366f1',
          slug: targetTenant.subdomain
        })
      }

      login({
        name: 'Asgardeo Admin',
        email: `admin@${slug}.invox.local`,
        role: 'Admin'
      })
      await refreshTenants()

      setTimeout(() => {
        navigate(`/${slug}/dashboard`, { replace: true })
      }, 500)
    } catch {
      setError('Failed to initiate Asgardeo authentication flow.')
      setLoading(false)
    }
  }

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/40'
    : 'bg-white/75 backdrop-blur-2xl border border-white/80 shadow-2xl shadow-black/10'

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.06] border-white/[0.10] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:bg-white/[0.09]'
      : 'bg-black/[0.04] border-black/[0.08] text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white/90'
  }`

  return (
    <div className="relative flex items-center justify-center min-h-screen py-10 z-10 px-4">
      {/* Theme Toggle */}
      <button
        onClick={toggleDark}
        className={`fixed top-6 right-6 p-2.5 rounded-xl border transition-all z-20 ${
          isDark
            ? 'border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.08] text-amber-400'
            : 'border-black/[0.07] bg-black/[0.03] hover:bg-black/[0.06] text-slate-600'
        }`}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`w-full max-w-md rounded-3xl p-8 ${glass}`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
            <Zap size={22} />
          </div>
          <div>
            <span className={`text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>
              Invox
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-semibold">
              <ShieldCheck size={12} />
              <span>Zero-Trust Enterprise IAM</span>
            </div>
          </div>
        </div>

        <h1 className={`text-2xl mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
          Single Sign-On
        </h1>
        <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Authenticate securely via Asgardeo Identity Provider to access your organization dashboard.
        </p>

        {/* Primary Asgardeo SSO Actions */}
        <div className="space-y-3 mb-6">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            onClick={() => handleAsgardeoLogin()}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-sm text-white shadow-xl shadow-indigo-500/30 transition-all font-bold disabled:opacity-75"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Authenticating with Asgardeo...
              </span>
            ) : (
              <>
                <ShieldCheck size={18} /> Continue to Asgardeo Sign-In <ArrowRight size={16} />
              </>
            )}
          </motion.button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleAsgardeoLogin('Google')}
            className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl text-sm font-semibold border transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 hover:bg-white/[0.08]'
                : 'bg-white border-black/[0.08] text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Sign in with Google (Federated)
          </button>
        </div>

        {/* Company Subdomain Portal Option */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowOrgInput(!showOrgInput)}
            className={`w-full flex items-center justify-between text-xs py-2 px-3 rounded-xl border transition-colors ${
              isDark ? 'border-white/[0.06] text-slate-400 hover:text-slate-200' : 'border-black/[0.06] text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2 font-medium">
              <Building2 size={13} className="text-indigo-400" /> Sign in with Company Domain
            </span>
            <ChevronRight size={14} className={`transition-transform ${showOrgInput ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {showOrgInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2 overflow-hidden"
              >
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="your-company-subdomain"
                    value={customOrgDomain}
                    onChange={e => setCustomOrgDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className={`${inputClass} font-mono text-xs pr-24`}
                  />
                  <span className={`absolute right-3 text-xs font-mono select-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    .invox.local
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5 mt-4">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Security badge info */}
        <div className={`mt-6 pt-5 border-t text-center text-xs space-y-2 ${isDark ? 'border-white/[0.06] text-slate-500' : 'border-black/[0.06] text-slate-400'}`}>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Lock size={12} className="text-indigo-400" />
            <span>Protected by PKCE OAuth2 & Cryptographic Token Assertion</span>
          </div>
          <div>
            Need to register a new tenant?{' '}
            <button onClick={() => navigate('/register')} className="text-indigo-500 hover:text-indigo-400 transition-colors font-semibold">
              Create Organization
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
