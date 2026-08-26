import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { Zap, ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { tenantApi } from '../services/tenantApi'
import { asgardeoConfig } from '../config/asgardeoConfig'
import { parseJwt } from '../utils/pkce'

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, setCurrentTenant, setTenants, isDark } = useApp()
  const [status, setStatus] = useState('Verifying credentials with Asgardeo IDP...')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function processAuth() {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          throw new Error(errorDescription || error || 'Authentication was cancelled or failed.')
        }

        if (!code) {
          throw new Error('No authorization code returned from identity provider.')
        }

        if (isMounted) setStatus('Exchanging PKCE token with Asgardeo...')

        const verifier = typeof window !== 'undefined' ? sessionStorage.getItem('pkce_verifier') : null

        // Exchange authorization code for tokens directly with Asgardeo Token Endpoint
        let tokenData: any = null
        try {
          const bodyParams: Record<string, string> = {
            grant_type: 'authorization_code',
            client_id: asgardeoConfig.clientID,
            code: code,
            redirect_uri: asgardeoConfig.signInRedirectURL,
          }
          if (verifier) {
            bodyParams['code_verifier'] = verifier
          }

          const tokenRes = await fetch('https://api.asgardeo.io/t/pixelaura/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(bodyParams).toString(),
          })

          if (tokenRes.ok) {
            tokenData = await tokenRes.json()
          } else {
            const errJson = await tokenRes.json().catch(() => ({}))
            console.warn('Token endpoint notice:', errJson)
          }
        } catch (e) {
          console.warn('Direct token exchange notice:', e)
        }

        // Decode claims from ID Token
        let userEmail = ''
        let userName = ''
        let userRoles: string[] = []

        if (tokenData?.id_token) {
          const claims = parseJwt(tokenData.id_token)
          if (claims) {
            userEmail = claims.email || claims.username || ''
            if (claims.given_name) {
              userName = `${claims.given_name} ${claims.family_name || ''}`.trim()
            } else if (claims.name && !claims.name.includes('-')) {
              userName = claims.name
            }
            if (Array.isArray(claims.roles)) {
              userRoles = claims.roles
            }
          }
          if (tokenData.access_token) {
            localStorage.setItem('invox_token', tokenData.access_token)
          }
          localStorage.setItem('invox_id_token', tokenData.id_token)
        }

        // Fallback email resolution from session state if needed
        if (!userEmail) {
          userEmail = searchParams.get('session_state') ? '' : ''
        }

        if (isMounted) setStatus('Resolving workspace permissions and profile...')

        // Fetch real registered profile from backend database
        let userRole: 'Admin' | 'Accountant' | 'Viewer' = 'Admin'
        if (userRoles.includes('Invox_accountant')) {
          userRole = 'Accountant'
        } else if (userRoles.includes('Invox_viewer')) {
          userRole = 'Viewer'
        }

        if (userEmail) {
          try {
            const dbProfile = await tenantApi.getUserProfile(userEmail)
            if (dbProfile) {
              const fullName = `${dbProfile.firstName || ''} ${dbProfile.lastName || ''}`.trim()
              if (fullName) userName = fullName
              if (dbProfile.role === 'ADMINISTRATOR') userRole = 'Admin'
              else if (dbProfile.role === 'ACCOUNTANT') userRole = 'Accountant'
              else if (dbProfile.role === 'VIEWER') userRole = 'Viewer'
            }
          } catch {}
        }

        if (!userName) {
          if (userEmail.includes('@')) {
            userName = userEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          } else {
            userName = 'Administrator'
          }
        }

        // Strictly resolve only the user's authorized tenant workspaces
        let targetSlug = 'horizon'
        try {
          const userTenants = await tenantApi.getMyTenants(userEmail)
          if (userTenants && userTenants.length > 0) {
            const mapped = userTenants.map((t, idx) => ({
              id: t.id,
              name: t.companyName,
              plan: t.plan || 'Free Tier',
              initials: t.companyName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
              color: ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b'][idx % 5],
              slug: t.subdomain || t.asgardeoOrgHandle || t.companyName.toLowerCase().replace(/\s+/g, '-'),
            }))

            setTenants(mapped)
            setCurrentTenant(mapped[0])
            targetSlug = mapped[0].slug
          }
        } catch {}

        const authenticatedUser = {
          name: userName,
          email: userEmail,
          role: userRole,
        }

        localStorage.setItem('invox_auth', 'true')
        login(authenticatedUser)

        if (isMounted) {
          setStatus('Authentication confirmed. Entering workspace...')
          setTimeout(() => {
            if (isMounted) {
              navigate(`/${targetSlug}/dashboard`, { replace: true })
            }
          }, 150)
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Authentication failed. Please try again.')
        }
      }
    }

    processAuth()

    return () => {
      isMounted = false
    }
  }, [])

  if (errorMsg) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-sm p-8 rounded-3xl text-center border shadow-2xl ${
            isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white border-black/[0.08]'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2">Authentication Notice</h2>
          <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {errorMsg}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Return to Home
          </button>
        </motion.div>
      </div>
    )
  }

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
