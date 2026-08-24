import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate, useSearchParams } from 'react-router'
import { Zap, Mail, Lock, Eye, EyeOff, Sun, Moon, ArrowRight, ShieldCheck, Building2, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { asgardeoConfig } from '../config/asgardeoConfig'

export function LoginPage() {
  const { isDark, toggleDark, login, tenants, currentTenant, setCurrentTenant } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedTenantSlug, setSelectedTenantSlug] = useState(currentTenant?.slug || (tenants[0]?.slug ?? 'horizon'))
  const [error, setError] = useState('')

  const handleDirectSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)
    setTimeout(() => {
      const active = tenants.find(t => t.slug === selectedTenantSlug) || currentTenant
      setCurrentTenant(active)
      login({
        email,
        name: email.split('@')[0].replace('.', ' '),
        role: 'Admin',
      })
      const next = searchParams.get('next')
      navigate(next || `/${active.slug}/dashboard`, { replace: true })
    }, 600)
  }

  const handleAsgardeoOidcLogin = (federatedIdp?: string) => {
    const active = tenants.find(t => t.slug === selectedTenantSlug) || currentTenant
    // Construct Asgardeo OIDC authorization URL
    const orgQuery = active ? active.slug : 'pixelaura'
    const redirectUri = encodeURIComponent(window.location.origin + `/${orgQuery}/dashboard`)
    const authUrl = `${asgardeoConfig.baseUrl}/oauth2/authorize?client_id=${asgardeoConfig.clientID}&response_type=code&scope=${encodeURIComponent(asgardeoConfig.scope.join(' '))}&redirect_uri=${redirectUri}${federatedIdp ? `&fidp=${federatedIdp}` : ''}`
    
    // For local dev preview, simulate or redirect
    login({ email: `admin@${active.slug}.com`, role: 'Admin', name: 'Asgardeo Admin' })
    navigate(`/${active.slug}/dashboard`, { replace: true })
  }

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.06] border-white/[0.10] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:bg-white/[0.09]'
      : 'bg-black/[0.04] border-black/[0.08] text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white/90'
  }`

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/40'
    : 'bg-white/70 backdrop-blur-2xl border border-white/80 shadow-2xl shadow-black/10'

  return (
    <div className="relative flex items-center justify-center min-h-screen py-10 z-10">
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
        className={`w-full max-w-md mx-4 rounded-3xl p-8 ${glass}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={20} className="text-white" />
          </div>
          <span className={`text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>
            Invox
          </span>
        </div>

        <h1 className={`text-2xl mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
          Welcome back
        </h1>
        <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Sign in to your organization workspace
        </p>

        {/* Organization workspace selector */}
        <div className="mb-4">
          <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ fontWeight: 600 }}>
            Target Workspace Organization
          </label>
          <div className="relative">
            <Building2 size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <select
              value={selectedTenantSlug}
              onChange={(e) => setSelectedTenantSlug(e.target.value)}
              className={`${inputClass} pl-10 pr-8 appearance-none cursor-pointer`}
            >
              {tenants.map(t => (
                <option key={t.id} value={t.slug} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                  {t.name} ({t.slug}.invox.local)
                </option>
              ))}
            </select>
            <ChevronDown size={14} className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>
        </div>

        {/* Asgardeo OIDC single click sign in */}
        <div className="space-y-2 mb-5">
          <button
            type="button"
            onClick={() => handleAsgardeoOidcLogin()}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
              borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
              color: isDark ? '#a5b4fc' : '#4f46e5',
            }}
          >
            <ShieldCheck size={16} /> Sign in with Asgardeo IDP
          </button>

          <button
            type="button"
            onClick={() => handleAsgardeoOidcLogin('Google')}
            className={`w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all hover:scale-[1.01] active:scale-[0.99] ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 hover:bg-white/[0.07]'
                : 'bg-white border-black/[0.08] text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        <div className="relative flex items-center justify-center mb-5">
          <div className={`w-full border-t ${isDark ? 'border-white/[0.08]' : 'border-black/[0.06]'}`} />
          <span className={`absolute px-2 text-[11px] uppercase tracking-wider ${isDark ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>
            or standard email
          </span>
        </div>

        <form onSubmit={handleDirectSignIn} className="space-y-3.5">
          <div>
            <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ fontWeight: 600 }}>Email</label>
            <div className="relative">
              <Mail size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className={`${inputClass} pl-10`} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ fontWeight: 600 }}>Password</label>
              <button type="button" className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={`${inputClass} pl-10 pr-10`} />
              <button type="button" onClick={() => setShowPass(!showPass)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', fontWeight: 700 }}
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>Sign in <ArrowRight size={15} /></>
            )}
          </motion.button>
        </form>

        <div className={`mt-5 pt-5 border-t text-center text-sm ${isDark ? 'border-white/[0.06] text-slate-500' : 'border-black/[0.06] text-slate-400'}`}>
          Don't have an organization workspace?{' '}
          <button onClick={() => navigate('/register')} className="text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
            Create one
          </button>
        </div>
      </motion.div>
    </div>
  )
}
