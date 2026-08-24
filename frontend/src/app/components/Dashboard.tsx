import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import {
  DollarSign, AlertCircle, Users, FileText, TrendingUp, TrendingDown,
  ArrowRight, Clock, CheckCircle2, Send, UserPlus, FilePlus, AlertTriangle,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const MONTHLY_DATA = [
  { month: 'Aug', revenue: 38200, expenses: 16400 },
  { month: 'Sep', revenue: 42800, expenses: 18200 },
  { month: 'Oct', revenue: 51600, expenses: 22100 },
  { month: 'Nov', revenue: 47300, expenses: 20500 },
  { month: 'Dec', revenue: 64100, expenses: 28700 },
  { month: 'Jan', revenue: 58750, expenses: 24200 },
]

const SPARKLINES = {
  revenue:     [38200, 42800, 51600, 47300, 64100, 58750],
  outstanding: [24000, 19500, 22800, 18300, 21000, 17600],
  customers:   [38, 41, 43, 44, 46, 47],
  month:       [18200, 22400, 26100, 21800, 30500, 28400],
}

const ACTIVITY = [
  { id: '1', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', text: 'Invoice #INV-2024-005 marked as Paid', sub: 'Figma Corp · $8,800.00', time: '2m ago' },
  { id: '2', icon: Send,         color: 'text-blue-500',    bg: 'bg-blue-500/10',    text: 'Invoice #INV-2024-006 sent to Loom Tech', sub: 'Loom Tech · $3,630.00', time: '18m ago' },
  { id: '3', icon: UserPlus,     color: 'text-violet-500',  bg: 'bg-violet-500/10',  text: 'New customer Webflow Inc added', sub: 'webflow.com · USA', time: '1h ago' },
  { id: '4', icon: AlertTriangle,color: 'text-amber-500',   bg: 'bg-amber-500/10',   text: 'Invoice #INV-2023-098 is now Overdue', sub: 'Linear Labs · $3,520.00', time: '3h ago' },
  { id: '5', icon: FilePlus,     color: 'text-indigo-500',  bg: 'bg-indigo-500/10',  text: 'Invoice #INV-2024-003 draft created', sub: 'Notion HQ · $6,280.00', time: '5h ago' },
  { id: '6', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', text: 'Invoice #INV-2024-001 marked as Paid', sub: 'Stripe Inc · $8,800.00', time: '1d ago' },
]

const METRICS = [
  { label: 'Total Revenue',      value: '$176,750', change: '+12.4%',      up: true,  icon: DollarSign,  iconBg: 'from-indigo-500 to-violet-600', color: '#6366f1', sparkKey: 'revenue'     as const },
  { label: 'Outstanding Balance',value: '$17,600',  change: '-8.2%',       up: false, icon: AlertCircle, iconBg: 'from-amber-400 to-orange-500',   color: '#f59e0b', sparkKey: 'outstanding' as const },
  { label: 'Active Customers',   value: '47',       change: '+2 this month',up: true,  icon: Users,       iconBg: 'from-emerald-400 to-teal-500',   color: '#10b981', sparkKey: 'customers'   as const },
  { label: 'Invoiced This Month',value: '$28,400',  change: '+6.8%',       up: true,  icon: FileText,    iconBg: 'from-blue-400 to-cyan-500',      color: '#3b82f6', sparkKey: 'month'       as const },
]

// Pure SVG sparkline — no recharts, no key collisions
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 200
  const H = 48
  const pad = 3
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const pts = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (W - pad * 2),
    y: pad + ((max - v) / range) * (H - pad * 2),
  }))

  // Smooth monotone curve via cubic beziers
  let linePath = `M ${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const curr = pts[i]
    const cpx = (prev.x + curr.x) / 2
    linePath += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`
  }

  const last = pts[pts.length - 1]
  const first = pts[0]
  const areaPath = `${linePath} L ${last.x},${H} L ${first.x},${H} Z`

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={areaPath} fill={color} fillOpacity={0.12} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Pure SVG grouped bar chart — no recharts
function RevenueBarChart({ data, isDark }: { data: typeof MONTHLY_DATA; isDark: boolean }) {
  const W = 500
  const H = 200
  const padL = 48
  const padB = 28
  const padT = 8
  const padR = 8
  const chartW = W - padL - padR
  const chartH = H - padB - padT

  const maxVal = Math.max(...data.flatMap(d => [d.revenue, d.expenses]))
  const yTicks = [0, 20000, 40000, 60000]

  const barGroupW = chartW / data.length
  const barW = Math.min(28, barGroupW * 0.35)
  const gap = 4

  const tickColor = isDark ? '#6b7280' : '#9ca3af'
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'

  function toY(v: number) {
    return padT + chartH - (v / maxVal) * chartH
  }

  function toX(i: number) {
    return padL + barGroupW * i + barGroupW / 2
  }

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {/* Grid lines */}
      {yTicks.map(tick => {
        const y = toY(tick)
        return (
          <g key={`grid-${tick}`}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={gridColor} strokeWidth={1} />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill={tickColor}>
              ${tick === 0 ? '0' : `${tick / 1000}k`}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const cx = toX(i)
        const revH = (d.revenue / maxVal) * chartH
        const expH = (d.expenses / maxVal) * chartH
        const revY = padT + chartH - revH
        const expY = padT + chartH - expH
        const r = 4

        return (
          <g key={`bar-${d.month}`}>
            {/* Revenue bar */}
            <rect
              x={cx - barW - gap / 2}
              y={revY}
              width={barW}
              height={revH}
              fill="#6366f1"
              rx={r}
              ry={r}
            />
            {/* Expenses bar */}
            <rect
              x={cx + gap / 2}
              y={expY}
              width={barW}
              height={expH}
              fill="#8b5cf6"
              fillOpacity={0.45}
              rx={r}
              ry={r}
            />
            {/* X label */}
            <text
              x={cx}
              y={H - 8}
              textAnchor="middle"
              fontSize={11}
              fill={tickColor}
              fontWeight={500}
            >
              {d.month}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function Dashboard() {
  const { isDark, currentUser, currentTenant } = useApp()
  const navigate = useNavigate()
  const onNavigate = (view: string) => navigate(`/${currentTenant.slug}/${view}`)
  const onCreateInvoice = () => navigate(`/${currentTenant.slug}/invoices/new`)
  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-xl'
    : 'bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-black/5'

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {METRICS.map((m, i) => {
          const Icon = m.icon
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className={`${glass} rounded-2xl p-5 relative overflow-hidden cursor-default`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 500 }}>
                    {m.label}
                  </p>
                  <p className={`text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
                    {m.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.iconBg} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>

              <div className="h-12 -mx-1 mb-2">
                <Sparkline values={SPARKLINES[m.sparkKey]} color={m.color} />
              </div>

              <div className={`flex items-center gap-1.5 text-xs ${m.up ? 'text-emerald-500' : 'text-amber-500'}`}>
                {m.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span style={{ fontWeight: 600 }}>{m.change}</span>
                <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>vs last month</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Main chart + activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.28 }}
          className={`${glass} rounded-2xl p-5 xl:col-span-2`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2 className={`text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
                Revenue Overview
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Last 6 months · revenue vs expenses
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-indigo-500" />
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full" style={{ background: 'rgba(139,92,246,0.5)' }} />
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Expenses</span>
              </div>
            </div>
          </div>
          <div className="w-full">
            <RevenueBarChart data={MONTHLY_DATA} isDark={isDark} />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className={`${glass} rounded-2xl p-5`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
              Recent Activity
            </h2>
            <Clock size={15} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
          </div>

          <div className="space-y-1 overflow-y-auto max-h-56 pr-1">
            {ACTIVITY.map((a, i) => {
              const Icon = a.icon
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-default ${
                    isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.03]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${a.bg}`}>
                    <Icon size={13} className={a.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 500 }}>
                      {a.text}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{a.sub}</p>
                  </div>
                  <span className={`text-[10px] flex-shrink-0 mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    {a.time}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Create Invoice',  desc: 'Generate a new invoice for a client',   gradient: 'from-indigo-500 to-violet-600', action: onCreateInvoice,              disabled: currentUser.role === 'Viewer' },
          { label: 'View Customers',  desc: 'Manage your customer database',          gradient: 'from-emerald-500 to-teal-600',  action: () => onNavigate('customers'), disabled: false },
          { label: 'Invoice Reports', desc: 'Track outstanding and paid invoices',    gradient: 'from-blue-500 to-cyan-600',     action: () => onNavigate('invoices'),  disabled: false },
        ].map((card, i) => (
          <motion.button
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 + i * 0.08 }}
            whileHover={card.disabled ? {} : { y: -2, transition: { duration: 0.15 } }}
            whileTap={card.disabled ? {} : { scale: 0.98 }}
            onClick={card.disabled ? undefined : card.action}
            disabled={card.disabled}
            className={`${glass} rounded-2xl p-4 text-left flex items-center justify-between gap-4 group transition-all ${
              card.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div>
              <div className={`text-transparent bg-clip-text bg-gradient-to-r ${card.gradient} text-sm mb-0.5`} style={{ fontWeight: 700 }}>
                {card.label}
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{card.desc}</p>
              {card.disabled && (
                <p className="text-[10px] text-amber-500 mt-1" style={{ fontWeight: 600 }}>Viewer role – restricted</p>
              )}
            </div>
            <ArrowRight
              size={16}
              className={`flex-shrink-0 transition-transform ${
                card.disabled
                  ? 'text-slate-400'
                  : isDark
                    ? 'text-slate-500 group-hover:text-slate-300 group-hover:translate-x-1'
                    : 'text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1'
              }`}
            />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
