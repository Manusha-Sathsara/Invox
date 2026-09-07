import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import { Zap, Mail, User, Sun, Moon, ArrowRight, Building2, Globe, CheckCircle2, AlertCircle, Loader2, Send, Lock, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { tenantApi } from '../services/tenantApi'

export function RegisterPage() {
  const { isDark, toggleDark, login, refreshTenants, setCurrentTenant } = useApp()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null)

  // Auto-generate suggested subdomain from company name if not manually modified
  const handleCompanyChange = (val: string) => {
    setCompany(val)
    const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
    setSubdomain(slug)
  }

  // Debounced subdomain availability check
  useEffect(() => {
    if (!subdomain || subdomain.trim().length < 2) {
      setSubdomainStatus('idle')
      return
    }

    setSubdomainStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const available = await tenantApi.checkSubdomain(subdomain)
        setSubdomainStatus(available ? 'available' : 'taken')
      } catch {
        setSubdomainStatus('idle')
      }
    }, 450)

    return () => clearTimeout(timer)
  }, [subdomain])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !company || !email || !subdomain || !password) {
      setError('Please fill in all required fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (subdomainStatus === 'taken') {
      setError('This subdomain is already taken. Please choose another one.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await tenantApi.registerTenant({
        companyName: company,
        subdomain: subdomain.trim().toLowerCase(),
        adminEmail: email,
        adminFirstName: firstName,
        adminLastName: lastName || 'Admin',
        adminPassword: password,
      })

      setRegistrationSuccess(response)
      await refreshTenants()
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your backend connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleProceedToWorkspace = async () => {
    if (!registrationSuccess) return
    const newSlug = registrationSuccess.subdomain || subdomain
    const newTenantObj = {
      id: registrationSuccess.id || 'new',
      name: company,
      plan: 'Free Tier',
      initials: company.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      color: '#6366f1',
      slug: newSlug,
    }

    login({
      name: `${firstName} ${lastName}`.trim(),
      email,
      role: 'Admin',
    })
    setCurrentTenant(newTenantObj)
    await refreshTenants(email)
    navigate(`/${newSlug}/dashboard`, { replace: true })
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
        className={`w-full max-w-lg mx-4 rounded-3xl p-8 ${glass}`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={20} className="text-white" />
          </div>
          <span className={`text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>
            Invox
          </span>
        </div>

        <AnimatePresence mode="wait">
          {registrationSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-4 space-y-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-xl shadow-indigo-500/10">
                <Send size={28} />
              </div>
              <h2 className={`text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700 }}>
                Activation Email Sent!
              </h2>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                We've provisioned your B2B workspace <strong>{registrationSuccess.companyName}</strong> and created your administrator account for <span className="font-semibold text-indigo-400">{registrationSuccess.adminEmail}</span>.
              </p>

              <div className={`p-4 rounded-2xl border text-left text-xs space-y-2 ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-slate-300' : 'bg-black/[0.02] border-black/[0.05] text-slate-700'}`}>
                <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
                  <CheckCircle2 size={14} /> Next Steps to Activate:
                </div>
                <div className="pl-4 space-y-1 text-slate-400">
                  <p>1. Your administrator account and password are now active.</p>
                  <p>2. A confirmation email has been sent to your inbox.</p>
                  <p>3. Click Proceed to Sign In to log into your workspace.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm text-white shadow-lg shadow-indigo-500/30"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', fontWeight: 700 }}
                >
                  Proceed to Sign In <ArrowRight size={16} />
                </motion.button>
                <button
                  onClick={handleProceedToWorkspace}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-600 hover:text-slate-800 hover:bg-black/5'
                  }`}
                >
                  Directly Enter Workspace Preview
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className={`text-2xl mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
                Create your workspace
              </h1>
              <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Provision a multi-tenant invoicing organization in seconds
              </p>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ fontWeight: 600 }}>
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      <input type="text" placeholder="Alex" value={firstName} onChange={e => setFirstName(e.target.value)} className={`${inputClass} pl-9`} required />
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ fontWeight: 600 }}>
                      Last Name
                    </label>
                    <div className="relative">
                      <User size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      <input type="text" placeholder="Morgan" value={lastName} onChange={e => setLastName(e.target.value)} className={`${inputClass} pl-9`} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ fontWeight: 600 }}>
                    Company / Organization <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input type="text" placeholder="Acme Global Inc." value={company} onChange={e => handleCompanyChange(e.target.value)} className={`${inputClass} pl-9`} required />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ fontWeight: 600 }}>
                      Organization Subdomain <span className="text-red-400">*</span>
                    </label>
                    {subdomainStatus === 'checking' && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Loader2 size={11} className="animate-spin" /> Checking...
                      </span>
                    )}
                    {subdomainStatus === 'available' && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <CheckCircle2 size={11} /> Available
                      </span>
                    )}
                    {subdomainStatus === 'taken' && (
                      <span className="flex items-center gap-1 text-[11px] text-red-400 font-semibold">
                        <AlertCircle size={11} /> Already taken
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Globe size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      placeholder="acmeglobal"
                      value={subdomain}
                      onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className={`${inputClass} pl-9 pr-28 font-mono text-xs`}
                      required
                    />
                    <span className={`absolute right-3 text-xs font-mono select-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      .invox.local
                    </span>
                  </div>
                </div>

                <div>
                  <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ fontWeight: 600 }}>
                    Work Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input type="email" placeholder="alex@acmeglobal.com" value={email} onChange={e => setEmail(e.target.value)} className={`${inputClass} pl-9`} required />
                  </div>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Your administrator email for workspace notifications.
                  </p>
                </div>

                <div>
                  <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ fontWeight: 600 }}>
                    Admin Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`${inputClass} pl-9 pr-10`}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
                        isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Must be at least 8 characters. Used to sign in to your workspace.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || subdomainStatus === 'taken'}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70 mt-2"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', fontWeight: 700 }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Provisioning Asgardeo Sub-Org...
                    </span>
                  ) : (
                    <>Create Organization Workspace <ArrowRight size={15} /></>
                  )}
                </motion.button>
              </form>

              <div className={`mt-5 pt-5 border-t text-center text-sm ${isDark ? 'border-white/[0.06] text-slate-500' : 'border-black/[0.06] text-slate-400'}`}>
                Already have a workspace?{' '}
                <button onClick={() => navigate('/login')} className="text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
                  Sign in
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
