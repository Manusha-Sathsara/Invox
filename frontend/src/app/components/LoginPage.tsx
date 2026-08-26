import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Zap, Loader2, ShieldCheck } from 'lucide-react'
import { asgardeoConfig } from '../config/asgardeoConfig'

export function LoginPage() {
  useEffect(() => {
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`)
    const authUrl = `${asgardeoConfig.baseUrl}/oauth2/authorize?client_id=${asgardeoConfig.clientID}&response_type=code&scope=${encodeURIComponent(asgardeoConfig.scope.join(' '))}&redirect_uri=${redirectUri}`
    window.location.href = authUrl
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm p-8 rounded-3xl text-center border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-2xl"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/30 text-white">
          <Zap size={28} />
        </div>
        <h2 className="text-xl font-bold mb-2">Redirecting to Asgardeo</h2>
        <div className="flex items-center justify-center gap-2 text-sm text-indigo-400 font-medium mb-4">
          <Loader2 size={16} className="animate-spin" />
          <span>Opening secure sign-in portal...</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Enterprise IAM OpenID Connect</span>
        </div>
      </motion.div>
    </div>
  )
}
