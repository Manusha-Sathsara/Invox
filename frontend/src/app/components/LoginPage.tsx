import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate, useSearchParams } from 'react-router'
import { Zap, Mail, Lock, Eye, EyeOff, Sun, Moon, ArrowRight } from 'lucide-react'
import { useApp } from '../context/AppContext'

export function LoginPage() {
  const { isDark, toggleDark, login, currentTenant } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setError('')
    setLoading(true)
    setTimeout(() => {
      login()
      const next = searchParams.get('next')
      navigate(next || `/${currentTenant.slug}/dashboard`, { replace: true })
    }, 900)
  }

  const inputClass = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.06] border-white/[0.10] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:bg-white/[0.09]'
      : 'bg-black/[0.04] border-black/[0.08] text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white/90'
  }`

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/40'
    : 'bg-white/70 backdrop-blur-2xl border border-white/80 shadow-2xl shadow-black/10'

  return (
    <div className="relative flex items-center justify-center min-h-screen py-8 z-10">
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
        <div className="flex items-center gap-3 mb-8">
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
        <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Sign in to your Invox account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ fontWeight: 600 }}>Email</label>
            <div className="relative">
              <Mail size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className={`${inputClass} pl-10`} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ fontWeight: 600 }}>Password</label>
              <button type="button" className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={`${inputClass} pl-10 pr-10`} />
              <button type="button" onClick={() => setShowPass(!showPass)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

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

        <div className={`mt-6 pt-6 border-t text-center text-sm ${isDark ? 'border-white/[0.06] text-slate-500' : 'border-black/[0.06] text-slate-400'}`}>
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
            Create one
          </button>
        </div>

        <div className={`mt-4 px-4 py-3 rounded-xl text-center text-xs ${isDark ? 'bg-indigo-900/20 border border-indigo-700/30 text-indigo-300' : 'bg-indigo-50 border border-indigo-100 text-indigo-600'}`}>
          Demo: any email + password to sign in
        </div>
      </motion.div>
    </div>
  )
}
