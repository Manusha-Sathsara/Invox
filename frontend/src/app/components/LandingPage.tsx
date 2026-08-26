import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import {
  Zap, ArrowRight, CheckCircle2, Star, ChevronDown,
  BarChart3, Shield, Globe, Clock, FileText, Send,
  Mail, MapPin, Menu, X, Sun, Moon, TrendingUp,
  RefreshCw, Sparkles, Building2, CreditCard,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { asgardeoConfig } from '../config/asgardeoConfig'

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(el) } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

const FEATURES = [
  { icon: Building2, title: 'Multi-workspace',    desc: 'Manage all your businesses from one account. Switch contexts instantly without juggling multiple logins.' },
  { icon: FileText,  title: 'Smart invoicing',    desc: 'Auto-calculate taxes, apply discounts, and generate professional PDFs ready to send in seconds.' },
  { icon: TrendingUp,title: 'Real-time tracking', desc: 'Know the moment a client opens your invoice. Instant notifications when payments are received.' },
  { icon: Clock,     title: 'Auto reminders',     desc: 'Set it and forget it. Payment reminders are sent automatically at the cadence you choose.' },
  { icon: Shield,    title: 'Role-based access',  desc: 'Grant your team the exact permissions they need. Admins, accountants, and viewers — all under control.' },
  { icon: BarChart3, title: 'Revenue analytics',  desc: 'Track cash flow, identify your best clients, and forecast revenue with powerful built-in reporting.' },
]

const TESTIMONIALS = [
  { name: 'Sarah Chen',      role: 'CFO at TechStart Inc',        rating: 5, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format', quote: "Invox cut our billing cycle in half. The multi-workspace feature means I manage three subsidiaries from one dashboard — it's genuinely transformed how we operate." },
  { name: 'Marcus Williams', role: 'Founder & CEO at Linear Labs', rating: 5, avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&auto=format', quote: "We switched from a legacy system and went live in a day. The automated reminders alone saved us $40k in late payments last quarter." },
  { name: 'Emma Rodriguez',  role: 'Independent Consultant',       rating: 5, avatar: 'https://images.unsplash.com/photo-1685760259914-ee8d2c92d2e0?w=80&h=80&fit=crop&auto=format', quote: "As a solo consultant, time is money. Invox handles my invoicing so I can focus on client work. Beautiful invoices, zero fuss." },
  { name: 'James Park',      role: 'Co-founder at Notion HQ',      rating: 5, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format', quote: "The enterprise plan gave us white-label invoicing and a REST API to connect our internal systems. Worth every penny at scale." },
]

const FAQS = [
  { q: 'Is there a free trial or a free plan?',                 a: "Yes — our Starter plan is free forever with no credit card required. You get up to 5 invoices per month and 1 workspace. Upgrade anytime when you need more." },
  { q: 'Can I manage multiple businesses from one account?',    a: "Absolutely. Pro and Enterprise plans support multiple workspaces, each with their own clients, invoices, branding, and team members. Switch with a single click." },
  { q: 'What payment methods can my clients use?',              a: "Invox integrates with Stripe, PayPal, and bank transfer. Clients pay directly from the invoice link with a credit card, debit card, or ACH bank transfer." },
  { q: 'How does role-based access work?',                      a: "Invite team members as Admin, Accountant, or Viewer. Admins have full control. Accountants create and manage invoices. Viewers can only read — perfect for stakeholders." },
  { q: 'Can I use my own branding on invoices?',                a: "Pro and Enterprise plans let you upload your logo, set brand colors, and customize invoice headers. Enterprise adds white-label with your custom domain." },
  { q: 'How secure is my financial data?',                      a: "AES-256 encryption at rest, TLS 1.3 in transit, daily geo-redundant backups. We're SOC 2 Type II certified and GDPR compliant." },
]

const PLANS = [
  { name: 'Starter',    desc: 'Perfect for freelancers',             price: { monthly: 0,   annual: 0   }, features: ['5 invoices / month', '1 workspace', 'PDF export', 'Email support', 'Basic analytics'],                                                                    cta: 'Start free',       highlight: false },
  { name: 'Pro',        desc: 'For growing teams',                   price: { monthly: 39,  annual: 29  }, features: ['Unlimited invoices', '5 workspaces', 'Custom branding', 'Auto reminders', 'Advanced analytics', 'Role-based access', 'Priority support'],               cta: 'Start free trial', highlight: true  },
  { name: 'Enterprise', desc: 'For organizations at scale',          price: { monthly: 119, annual: 89  }, features: ['Unlimited everything', 'Unlimited workspaces', 'White-label & domain', 'REST API', 'SSO & SAML', 'Dedicated manager', 'SLA guarantee'],                  cta: 'Contact sales',    highlight: false },
]

const NAV_LINKS = [
  { label: 'Features',     href: '#features'     },
  { label: 'How it works', href: '#how-it-works'  },
  { label: 'Pricing',      href: '#pricing'       },
  { label: 'Testimonials', href: '#testimonials'  },
  { label: 'Contact',      href: '#contact'       },
]

export function LandingPage() {
  const { isDark, toggleDark, isAuthenticated, currentTenant } = useApp()
  const navigate = useNavigate()

  const [navOpen,        setNavOpen]        = useState(false)
  const [scrolled,       setScrolled]       = useState(false)
  const [annual,         setAnnual]         = useState(true)
  const [openFaq,        setOpenFaq]        = useState<number | null>(null)
  const [contactForm,    setContactForm]    = useState({ name: '', email: '', company: '', message: '' })
  const [contactSent,    setContactSent]    = useState(false)
  const [contactLoading, setContactLoading] = useState(false)

  const handleSignIn = () => {
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`)
    const authUrl = `${asgardeoConfig.baseUrl}/oauth2/authorize?client_id=${asgardeoConfig.clientID}&response_type=code&scope=${encodeURIComponent(asgardeoConfig.scope.join(' '))}&redirect_uri=${redirectUri}`
    window.location.href = authUrl
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
      navigate(`/auth/callback${window.location.search}`, { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const scrollTo = (href: string) => {
    setNavOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault()
    setContactLoading(true)
    setTimeout(() => { setContactLoading(false); setContactSent(true) }, 1200)
  }

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-xl shadow-black/30'
    : 'bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl shadow-black/5'

  const glassStrong = isDark
    ? 'bg-white/[0.07] backdrop-blur-2xl border border-white/[0.12] shadow-2xl'
    : 'bg-white/90 backdrop-blur-2xl border border-white shadow-2xl shadow-black/10'

  const tp = isDark ? 'text-white' : 'text-slate-900'
  const ts = isDark ? 'text-slate-400' : 'text-slate-500'
  const tm = isDark ? 'text-slate-500' : 'text-slate-400'

  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.06] border-white/[0.10] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60'
      : 'bg-black/[0.04] border-black/[0.08] text-slate-800 placeholder:text-slate-400 focus:border-indigo-400'
  }`

  const featAnim     = useInView()
  const howAnim      = useInView()
  const pricingAnim  = useInView()
  const testAnim     = useInView()
  const faqAnim      = useInView()
  const contactAnim  = useInView()

  return (
    <div className={`min-h-screen ${isDark ? 'text-slate-100' : 'text-slate-900'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ── NAVBAR ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? isDark
            ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20'
            : 'bg-white/80 backdrop-blur-xl border-b border-black/[0.06] shadow-sm'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-8">
            <div className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Zap size={16} className="text-white" />
              </div>
              <span className={`text-xl ${tp}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>Invox</span>
            </div>

            <nav className="hidden lg:flex items-center gap-1 flex-1">
              {NAV_LINKS.map(link => (
                <button key={link.label} onClick={() => scrollTo(link.href)} className={`px-4 py-2 rounded-lg text-sm transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'}`} style={{ fontWeight: 500 }}>
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <button onClick={toggleDark} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-amber-400 hover:bg-white/[0.06]' : 'text-slate-500 hover:bg-black/[0.04]'}`}>
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={handleSignIn} className={`px-4 py-2 rounded-xl text-sm transition-colors ${isDark ? 'text-slate-300 hover:text-white hover:bg-white/[0.06]' : 'text-slate-700 hover:text-slate-900 hover:bg-black/[0.04]'}`} style={{ fontWeight: 600 }}>
                Sign in
              </button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/register')} className="px-5 py-2 rounded-xl text-sm text-white shadow-lg shadow-indigo-500/25" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', fontWeight: 600 }}>
                Get started free
              </motion.button>
            </div>

            <div className="lg:hidden flex items-center gap-2 ml-auto">
              <button onClick={toggleDark} className={`p-2 rounded-lg ${isDark ? 'text-amber-400' : 'text-slate-500'}`}>
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => setNavOpen(!navOpen)} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-black/[0.04]'}`}>
                {navOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {navOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`lg:hidden border-t overflow-hidden ${isDark ? 'border-white/[0.06] bg-slate-950/95 backdrop-blur-xl' : 'border-black/[0.06] bg-white/95 backdrop-blur-xl'}`}>
              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map(link => (
                  <button key={link.label} onClick={() => scrollTo(link.href)} className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-black/[0.04]'}`} style={{ fontWeight: 500 }}>
                    {link.label}
                  </button>
                ))}
                <div className="pt-3 flex gap-3">
                  <button onClick={handleSignIn} className={`flex-1 py-2.5 rounded-xl text-sm text-center border ${isDark ? 'border-white/[0.08] text-slate-300' : 'border-black/[0.08] text-slate-700'}`} style={{ fontWeight: 600 }}>Sign in</button>
                  <button onClick={() => navigate('/register')} className="flex-1 py-2.5 rounded-xl text-sm text-white text-center" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', fontWeight: 600 }}>Get started</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-48 -right-24 w-[700px] h-[700px] rounded-full blur-3xl opacity-40" style={{ background: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(139,92,246,0.14)' }} />
          <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full blur-3xl opacity-40" style={{ background: isDark ? 'rgba(139,92,246,0.16)' : 'rgba(99,102,241,0.12)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: 'easeOut' }}>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-6 ${isDark ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border border-indigo-100 text-indigo-600'}`} style={{ fontWeight: 600 }}>
                <Sparkles size={12} /> Now with AI-powered insights
              </motion.div>

              <h1 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mb-6 leading-[1.06] ${tp}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>
                Invoice smarter.{' '}
                <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 bg-clip-text text-transparent">
                  Get paid faster.
                </span>
              </h1>

              <p className={`text-lg lg:text-xl mb-8 leading-relaxed max-w-lg ${ts}`}>
                The all-in-one invoicing platform built for modern businesses. Create, send, and track invoices across multiple companies — from one powerful dashboard.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/register')} className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-base text-white shadow-xl shadow-indigo-500/25" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', fontWeight: 700 }}>
                  Start for free <ArrowRight size={18} />
                </motion.button>
                <button onClick={() => scrollTo('#how-it-works')} className={`flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-base border transition-colors ${isDark ? 'border-white/[0.12] text-slate-300 hover:bg-white/[0.04]' : 'border-black/[0.10] text-slate-700 hover:bg-black/[0.03]'}`} style={{ fontWeight: 600 }}>
                  See how it works
                </button>
              </div>

              <div className="flex items-center flex-wrap gap-6">
                {[{ val: '10,000+', label: 'Businesses' }, { val: '$500M+', label: 'Invoiced' }, { val: '99.9%', label: 'Uptime' }].map(s => (
                  <div key={s.label}>
                    <div className={`text-2xl ${tp}`} style={{ fontWeight: 800, letterSpacing: '-0.03em' }}>{s.val}</div>
                    <div className={`text-xs ${tm}`} style={{ fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
                <div className={`h-8 w-px hidden sm:block ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}
                  <span className={`text-xs ml-1 ${tm}`} style={{ fontWeight: 500 }}>4.9 / 5.0</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Dashboard mockup */}
            <motion.div initial={{ opacity: 0, x: 32, y: 16 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }} className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 -m-12 bg-indigo-500/15 blur-3xl rounded-full" />
                <div className={`relative rounded-3xl p-5 ${glassStrong}`} style={{ transform: 'perspective(1200px) rotateY(-5deg) rotateX(3deg)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Zap size={12} className="text-white" /></div>
                      <span className={`text-sm ${tp}`} style={{ fontWeight: 700 }}>Invox Dashboard</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" /><div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                  </div>

                  <div className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50/80 border border-indigo-100'}`}>
                    <div className={`text-xs mb-1 ${tm}`} style={{ fontWeight: 500 }}>Revenue this month</div>
                    <div className="flex items-end justify-between mb-3">
                      <div className={`text-3xl ${tp}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>$124,500</div>
                      <div className="flex items-center gap-1 text-emerald-500 text-xs" style={{ fontWeight: 700 }}><TrendingUp size={12} /> +12.4%</div>
                    </div>
                    <div className="flex items-end gap-0.5 h-10">
                      {[40,58,36,72,50,66,85,62,78,92,71,100].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 11 ? 'linear-gradient(to top, #6366f1, #8b5cf6)' : isDark ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.22)' }} />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {[
                      { client: 'Figma Corp',   num: 'INV-2024-001', amount: '$8,800', status: 'Paid',    sc: 'text-emerald-500', dc: 'bg-emerald-500' },
                      { client: 'Vercel Corp',  num: 'INV-2024-002', amount: '$5,800', status: 'Sent',    sc: 'text-blue-500',    dc: 'bg-blue-500'    },
                      { client: 'Linear Labs', num: 'INV-2023-098', amount: '$3,200', status: 'Overdue', sc: 'text-red-500',     dc: 'bg-red-500'     },
                    ].map(inv => (
                      <div key={inv.num} className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer ${isDark ? 'bg-white/[0.04] hover:bg-white/[0.07]' : 'bg-white/60 hover:bg-white/85'}`}>
                        <div>
                          <div className={`text-xs ${tp}`} style={{ fontWeight: 600 }}>{inv.client}</div>
                          <div className={`text-[10px] ${tm}`}>{inv.num}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs ${tp}`} style={{ fontWeight: 700 }}>{inv.amount}</div>
                          <div className={`text-[10px] flex items-center gap-1 justify-end ${inv.sc}`} style={{ fontWeight: 600 }}>
                            <div className={`w-1.5 h-1.5 rounded-full ${inv.dc}`} />{inv.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[{ label: 'Paid', val: '18', color: 'text-emerald-500' }, { label: 'Pending', val: '7', color: 'text-amber-500' }, { label: 'Overdue', val: '3', color: 'text-red-500' }].map(s => (
                      <div key={s.label} className={`rounded-xl p-2.5 text-center ${isDark ? 'bg-white/[0.04]' : 'bg-white/50'}`}>
                        <div className={`text-xl ${s.color}`} style={{ fontWeight: 800 }}>{s.val}</div>
                        <div className={`text-[10px] ${tm}`} style={{ fontWeight: 500 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9, duration: 0.4 }} className={`absolute -right-4 top-6 rounded-2xl p-3 w-52 ${glass}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0"><CheckCircle2 size={15} className="text-emerald-500" /></div>
                    <div>
                      <div className={`text-xs ${tp}`} style={{ fontWeight: 700 }}>Payment received</div>
                      <div className={`text-[11px] ${tm}`}>Figma Corp · $8,800</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1, duration: 0.4 }} className={`absolute -left-4 bottom-10 rounded-2xl p-3 w-48 ${glass}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs flex-shrink-0" style={{ fontWeight: 700 }}>AM</div>
                    <div>
                      <div className={`text-xs ${tp}`} style={{ fontWeight: 700 }}>Alex Morgan</div>
                      <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className={`text-[10px] ${tm}`}>Admin · Acme Corp</span></div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className={`relative py-12 border-y ${isDark ? 'border-white/[0.06]' : 'border-black/[0.05]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className={`text-center text-xs tracking-widest mb-8 ${tm}`} style={{ fontWeight: 600 }}>TRUSTED BY TEAMS AT</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {['Stripe', 'Vercel', 'Linear', 'Figma', 'Notion', 'Loom'].map(name => (
              <span key={name} className={`text-xl transition-colors duration-200 ${isDark ? 'text-slate-700 hover:text-slate-400' : 'text-slate-200 hover:text-slate-400'}`} style={{ fontWeight: 800, letterSpacing: '-0.03em' }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div ref={featAnim.ref} initial={{ opacity: 0, y: 24 }} animate={featAnim.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-16">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-5 ${isDark ? 'bg-violet-500/15 border border-violet-500/30 text-violet-300' : 'bg-violet-50 border border-violet-100 text-violet-600'}`} style={{ fontWeight: 600 }}><Sparkles size={12} /> Everything you need</div>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl mb-4 ${tp}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>Built for the way you work</h2>
            <p className={`text-lg max-w-2xl mx-auto ${ts}`}>From solo consultants to multi-entity enterprises — Invox scales with your business and keeps your finances organized.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon
              return (
                <motion.div key={feat.title} initial={{ opacity: 0, y: 24 }} animate={featAnim.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.07 }} className={`rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-200 ${glass}`}>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}><Icon size={22} /></div>
                  <h3 className={`text-base mb-2 ${tp}`} style={{ fontWeight: 700 }}>{feat.title}</h3>
                  <p className={`text-sm leading-relaxed ${ts}`}>{feat.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className={`relative py-24 lg:py-32 ${isDark ? 'bg-white/[0.015]' : 'bg-black/[0.02]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div ref={howAnim.ref} initial={{ opacity: 0, y: 24 }} animate={howAnim.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-16">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-5 ${isDark ? 'bg-blue-500/15 border border-blue-500/30 text-blue-300' : 'bg-blue-50 border border-blue-100 text-blue-600'}`} style={{ fontWeight: 600 }}><RefreshCw size={12} /> Simple setup</div>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl mb-4 ${tp}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>Up and running in minutes</h2>
            <p className={`text-lg max-w-xl mx-auto ${ts}`}>No training required. Most businesses send their first invoice within 5 minutes of signing up.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative">
            {[
              { num: '01', icon: Building2, title: 'Create your workspace',   desc: 'Set up your company profile with logo, tax details, and payment info in under 2 minutes.' },
              { num: '02', icon: Send,      title: 'Send professional invoices', desc: 'Build beautiful invoices with line items, taxes, and discounts. Send with one click.' },
              { num: '03', icon: CreditCard,title: 'Get paid and track',      desc: 'Clients pay by card or bank transfer from the invoice. Your books stay up to date automatically.' },
            ].map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div key={step.num} initial={{ opacity: 0, y: 32 }} animate={howAnim.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.12 }} className="text-center">
                  <div className={`w-28 h-28 rounded-3xl flex flex-col items-center justify-center mx-auto mb-6 ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                    <Icon size={30} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                    <span className={`text-xs mt-1.5 ${isDark ? 'text-indigo-400/60' : 'text-indigo-300'}`} style={{ fontWeight: 700 }}>{step.num}</span>
                  </div>
                  <h3 className={`text-lg mb-3 ${tp}`} style={{ fontWeight: 700 }}>{step.title}</h3>
                  <p className={`text-sm leading-relaxed max-w-xs mx-auto ${ts}`}>{step.desc}</p>
                </motion.div>
              )
            })}
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={howAnim.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.4 }} className="mt-16 rounded-3xl overflow-hidden h-64 lg:h-80 relative bg-indigo-100">
            <img src="https://images.unsplash.com/photo-1758518727613-00192aed759b?w=1200&h=400&fit=crop&auto=format" alt="Team collaborating" className="w-full h-full object-cover" />
            <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-r from-slate-950/60 to-transparent' : 'bg-gradient-to-r from-indigo-900/40 to-transparent'}`} />
            <div className="absolute inset-0 flex items-center px-10 lg:px-16">
              <div>
                <p className="text-white text-2xl lg:text-3xl mb-3 max-w-md" style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>"Invox saved our team 8 hours a week in billing admin."</p>
                <p className="text-white/70 text-sm" style={{ fontWeight: 500 }}>— Operations Lead, Series B startup</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div ref={pricingAnim.ref} initial={{ opacity: 0, y: 24 }} animate={pricingAnim.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-12">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-5 ${isDark ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border border-emerald-100 text-emerald-600'}`} style={{ fontWeight: 600 }}><CreditCard size={12} /> Transparent pricing</div>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl mb-4 ${tp}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>Plans that grow with you</h2>
            <p className={`text-lg max-w-xl mx-auto mb-8 ${ts}`}>Start free, upgrade when ready. No hidden fees, no lock-in.</p>
            <div className={`inline-flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/[0.05] border border-white/[0.08]' : 'bg-black/[0.04] border border-black/[0.06]'}`}>
              <button onClick={() => setAnnual(false)} className={`px-5 py-1.5 rounded-lg text-sm transition-all ${!annual ? (isDark ? 'bg-white/10 text-white shadow' : 'bg-white text-slate-900 shadow-sm') : tm}`} style={{ fontWeight: 600 }}>Monthly</button>
              <button onClick={() => setAnnual(true)} className={`px-5 py-1.5 rounded-lg text-sm transition-all ${annual ? (isDark ? 'bg-white/10 text-white shadow' : 'bg-white text-slate-900 shadow-sm') : tm}`} style={{ fontWeight: 600 }}>Annual <span className="text-emerald-500 ml-1">–20%</span></button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 32 }} animate={pricingAnim.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.1 }} className={`relative rounded-3xl p-7 ${plan.highlight ? 'border-0 shadow-2xl shadow-indigo-500/30 lg:-mt-4' : glass}`} style={plan.highlight ? { background: 'linear-gradient(160deg, #4f46e5 0%, #7c3aed 60%, #6d28d9 100%)' } : {}}>
                {plan.highlight && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg whitespace-nowrap" style={{ fontWeight: 700 }}>Most popular</div>}
                <p className={`text-sm mb-1 ${plan.highlight ? 'text-white/70' : tm}`} style={{ fontWeight: 600 }}>{plan.name}</p>
                <div className="flex items-end gap-1 my-3">
                  <span className={`text-5xl ${plan.highlight ? 'text-white' : tp}`} style={{ fontWeight: 800, letterSpacing: '-0.05em' }}>${annual ? plan.price.annual : plan.price.monthly}</span>
                  <span className={`text-sm mb-2 ${plan.highlight ? 'text-white/60' : tm}`}>/mo</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-white/70' : ts}`}>{plan.desc}</p>
                <button onClick={plan.name === 'Enterprise' ? () => scrollTo('#contact') : () => navigate('/register')} className={`w-full py-3 rounded-2xl text-sm mb-7 transition-all ${plan.highlight ? 'bg-white text-indigo-700 hover:bg-white/90 shadow-lg' : 'text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30'}`} style={{ fontWeight: 700, background: plan.highlight ? undefined : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                  {plan.cta}
                </button>
                <ul className="space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-white/80' : 'text-indigo-500'}`} />
                      <span className={`text-sm ${plan.highlight ? 'text-white/90' : ts}`}>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className={`relative py-24 lg:py-32 ${isDark ? 'bg-white/[0.015]' : 'bg-black/[0.02]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div ref={testAnim.ref} initial={{ opacity: 0, y: 24 }} animate={testAnim.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-16">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-5 ${isDark ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' : 'bg-amber-50 border border-amber-100 text-amber-600'}`} style={{ fontWeight: 600 }}><Star size={12} className="fill-current" /> Loved by thousands</div>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl mb-4 ${tp}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>What our customers say</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 24 }} animate={testAnim.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.09 }} className={`rounded-2xl p-6 ${glass}`}>
                <div className="flex items-center gap-0.5 mb-4">{[...Array(t.rating)].map((_, j) => <Star key={j} size={14} className="fill-amber-400 text-amber-400" />)}</div>
                <p className={`text-sm leading-relaxed mb-5 ${ts}`}>"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover bg-slate-200" />
                  <div>
                    <div className={`text-sm ${tp}`} style={{ fontWeight: 700 }}>{t.name}</div>
                    <div className={`text-xs ${tm}`}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative py-24 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div ref={faqAnim.ref} initial={{ opacity: 0, y: 24 }} animate={faqAnim.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl mb-4 ${tp}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>Frequently asked questions</h2>
            <p className={`text-lg ${ts}`}>Can't find what you're looking for? <button onClick={() => scrollTo('#contact')} className="text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>Contact our team</button>.</p>
          </motion.div>

          <div className={`rounded-3xl overflow-hidden divide-y ${isDark ? 'divide-white/[0.06] border border-white/[0.08]' : 'divide-black/[0.05] border border-black/[0.06]'} ${glass}`}>
            {FAQS.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={faqAnim.inView ? { opacity: 1 } : {}} transition={{ delay: i * 0.06 }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className={`w-full flex items-center justify-between px-6 py-5 text-left transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'}`}>
                  <span className={`text-sm pr-4 ${tp}`} style={{ fontWeight: 600 }}>{faq.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                    <ChevronDown size={16} className={tm} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                      <p className={`px-6 pb-5 text-sm leading-relaxed ${ts}`}>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className={`relative py-24 lg:py-32 ${isDark ? 'bg-white/[0.015]' : 'bg-black/[0.02]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            <motion.div ref={contactAnim.ref} initial={{ opacity: 0, x: -24 }} animate={contactAnim.inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5 }}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-6 ${isDark ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border border-indigo-100 text-indigo-600'}`} style={{ fontWeight: 600 }}><Mail size={12} /> Get in touch</div>
              <h2 className={`text-3xl sm:text-4xl lg:text-5xl mb-4 ${tp}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>Let's talk about your business</h2>
              <p className={`text-lg mb-8 ${ts}`}>Whether you're evaluating Invox, need a custom enterprise plan, or have a question — our team is here to help.</p>
              <div className="space-y-4 mb-10">
                {[{ icon: Mail, label: 'Email us', value: 'hello@invox.io' }, { icon: Globe, label: 'Website', value: 'www.invox.io' }, { icon: MapPin, label: 'Headquarters', value: 'San Francisco, CA' }].map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/[0.05]' : 'bg-indigo-50'}`}><Icon size={18} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} /></div>
                      <div>
                        <div className={`text-xs ${tm}`} style={{ fontWeight: 500 }}>{item.label}</div>
                        <div className={`text-sm ${tp}`} style={{ fontWeight: 600 }}>{item.value}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="rounded-2xl overflow-hidden h-52 bg-indigo-100">
                <img src="https://images.unsplash.com/photo-1690378820474-b468b8ee64d3?w=600&h=280&fit=crop&auto=format" alt="Invox team at work" className="w-full h-full object-cover" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} animate={contactAnim.inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }} className={`rounded-3xl p-8 ${glassStrong}`}>
              {contactSent ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 flex items-center justify-center mb-4"><CheckCircle2 size={32} className="text-emerald-500" /></div>
                  <h3 className={`text-xl mb-2 ${tp}`} style={{ fontWeight: 700 }}>Message sent!</h3>
                  <p className={`text-sm ${ts}`}>We'll get back to you within 24 hours.</p>
                  <button onClick={() => { setContactSent(false); setContactForm({ name: '', email: '', company: '', message: '' }) }} className="mt-6 text-indigo-500 text-sm hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-4">
                  <h3 className={`text-lg mb-6 ${tp}`} style={{ fontWeight: 700 }}>Send us a message</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={`text-xs mb-1.5 block ${tm}`} style={{ fontWeight: 600 }}>Name *</label><input required type="text" placeholder="Alex Morgan" value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} className={inputCls} /></div>
                    <div><label className={`text-xs mb-1.5 block ${tm}`} style={{ fontWeight: 600 }}>Company</label><input type="text" placeholder="Acme Corp" value={contactForm.company} onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))} className={inputCls} /></div>
                  </div>
                  <div><label className={`text-xs mb-1.5 block ${tm}`} style={{ fontWeight: 600 }}>Email *</label><input required type="email" placeholder="you@company.com" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} className={inputCls} /></div>
                  <div><label className={`text-xs mb-1.5 block ${tm}`} style={{ fontWeight: 600 }}>Message *</label><textarea required rows={4} placeholder="Tell us about your invoicing needs…" value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} className={`${inputCls} resize-none`} /></div>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={contactLoading} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm text-white shadow-lg shadow-indigo-500/25 disabled:opacity-70" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', fontWeight: 700 }}>
                    {contactLoading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" /> : <>Send message <Send size={15} /></>}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="relative py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden text-center px-8 py-16" style={{ background: 'linear-gradient(145deg, #4338ca 0%, #6d28d9 50%, #7c3aed 100%)' }}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/[0.08] blur-2xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/[0.08] blur-2xl" />
            </div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-white/20 text-white mb-6" style={{ fontWeight: 600 }}><Sparkles size={12} /> No credit card required</div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white mb-4" style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>Ready to streamline your invoicing?</h2>
              <p className="text-lg text-white/75 mb-8 max-w-xl mx-auto">Join 10,000+ businesses saving hours every week with Invox.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/register')} className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-700 shadow-2xl shadow-black/30 text-base" style={{ fontWeight: 700 }}>
                  Start for free <ArrowRight size={18} />
                </motion.button>
                <button onClick={() => navigate('/login')} className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/25 text-white text-base hover:bg-white/10 transition-colors" style={{ fontWeight: 600 }}>
                  Sign in to your account
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={`relative border-t py-14 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.05]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"><Zap size={16} className="text-white" /></div>
                <span className={`text-xl ${tp}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>Invox</span>
              </div>
              <p className={`text-sm leading-relaxed max-w-[200px] ${ts}`}>The modern invoicing platform for teams that move fast.</p>
            </div>
            {[
              { heading: 'Product', links: ['Features', 'Pricing', 'Security', 'Changelog', 'Roadmap'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Partners'] },
              { heading: 'Support', links: ['Help Center', 'Contact', 'Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
            ].map(col => (
              <div key={col.heading}>
                <h4 className={`text-sm mb-4 ${tp}`} style={{ fontWeight: 700 }}>{col.heading}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => <li key={link}><button className={`text-sm transition-colors ${ts} hover:text-indigo-500`}>{link}</button></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className={`pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.05]'}`}>
            <p className={`text-xs ${tm}`}>© 2025 Invox Technologies, Inc. All rights reserved.</p>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className={`text-xs ${tm}`}>All systems operational</span></div>
          </div>
        </div>
      </footer>
    </div>
  )
}
