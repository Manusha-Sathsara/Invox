import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import {
  DollarSign, AlertCircle, Users, FileText, TrendingUp, TrendingDown,
  ArrowRight, Clock, CheckCircle2, Send, UserPlus, FilePlus, AlertTriangle,
  RefreshCw, Loader2, Package, Info, PlusCircle,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fetchInvoicesFromBackend } from '../services/invoiceService'
import { fetchCustomersFromBackend } from '../services/customerService'
import { fetchProductsFromBackend } from '../services/productService'
import type { Customer, Product } from '../App'

// Helper: Calculate invoice grand total accurately
function calcTotal(invoice: any): number {
  if (invoice.grandTotal !== undefined && invoice.grandTotal !== null) {
    return Number(invoice.grandTotal) || 0
  }
  if (invoice.total !== undefined && invoice.total !== null) {
    return Number(invoice.total) || 0
  }
  if (Array.isArray(invoice.items)) {
    return invoice.items.reduce((sum: number, item: any) => {
      const qty = Number(item.quantity) || 1
      const price = Number(item.unitPrice) || Number(item.price) || 0
      const subtotal = qty * price
      const tax = (subtotal * (Number(item.taxRate) || 0)) / 100
      return sum + subtotal + tax
    }, 0)
  }
  return 0
}

// Helper: Format currency with safe fallback
function formatCurrency(val: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val)
  } catch (_) {
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}

// Helper: Human relative time formatter
function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Recently'
  try {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return 'Recently'
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHours = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch (_) {
    return 'Recently'
  }
}

// Pure SVG dynamic sparkline
function DynamicSparkline({
  values,
  color,
  hasEnoughData,
}: {
  values: number[]
  color: string
  hasEnoughData: boolean
}) {
  const W = 200
  const H = 48
  const pad = 4

  if (!hasEnoughData || values.every(v => v === 0)) {
    return (
      <div className="h-12 flex items-center justify-between px-2 text-[10px] text-slate-400 dark:text-slate-500 bg-black/[0.02] dark:bg-white/[0.02] rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
        <span className="flex items-center gap-1">
          <Info size={11} className="text-amber-500/80" />
          Awaiting more monthly data
        </span>
        <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70">
          {values.filter(v => v > 0).length}/6 Mo
        </span>
      </div>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const pts = values.map((v, i) => ({
    x: pad + (i / Math.max(values.length - 1, 1)) * (W - pad * 2),
    y: pad + ((max - v) / range) * (H - pad * 2),
  }))

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

// Pure SVG dynamic grouped bar chart for last 6 months
function DynamicRevenueBarChart({
  data,
  isDark,
  hasTransactions,
  onCreateInvoice,
}: {
  data: { month: string; revenue: number; outstanding: number; count: number }[]
  isDark: boolean
  hasTransactions: boolean
  onCreateInvoice: () => void
}) {
  const W = 500
  const H = 200
  const padL = 48
  const padB = 28
  const padT = 12
  const padR = 12
  const chartW = W - padL - padR
  const chartH = H - padB - padT

  const maxVal = Math.max(1000, ...data.flatMap(d => [d.revenue, d.outstanding]))
  const yTicks = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal]

  const barGroupW = chartW / Math.max(data.length, 1)
  const barW = Math.min(26, barGroupW * 0.36)
  const gap = 4

  const tickColor = isDark ? '#6b7280' : '#9ca3af'
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'

  function toY(v: number) {
    return padT + chartH - (v / maxVal) * chartH
  }

  function toX(i: number) {
    return padL + barGroupW * i + barGroupW / 2
  }

  function formatTick(v: number) {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `$${Math.round(v / 1000)}k`
    return `$${v}`
  }

  return (
    <div className="relative">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* Grid lines */}
        {yTicks.map((tick, idx) => {
          const y = toY(tick)
          return (
            <g key={`grid-${idx}-${tick}`}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={gridColor} strokeWidth={1} strokeDasharray={tick === 0 ? undefined : '3 3'} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill={tickColor} fontFamily="sans-serif">
                {formatTick(tick)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const cx = toX(i)
          const revH = (d.revenue / maxVal) * chartH
          const outH = (d.outstanding / maxVal) * chartH
          const revY = padT + chartH - revH
          const outY = padT + chartH - outH
          const r = 3

          return (
            <g key={`bar-${d.month}-${i}`}>
              {/* Revenue (Paid) bar */}
              {revH > 0 && (
                <rect
                  x={cx - barW - gap / 2}
                  y={revY}
                  width={barW}
                  height={Math.max(revH, 2)}
                  fill="#6366f1"
                  rx={r}
                  ry={r}
                />
              )}
              {/* Outstanding (Pending) bar */}
              {outH > 0 && (
                <rect
                  x={cx + gap / 2}
                  y={outY}
                  width={barW}
                  height={Math.max(outH, 2)}
                  fill="#f59e0b"
                  rx={r}
                  ry={r}
                />
              )}
              {/* Zero-level indicator if month has no transactions */}
              {revH === 0 && outH === 0 && (
                <line
                  x1={cx - barW}
                  y1={padT + chartH - 1}
                  x2={cx + barW}
                  y2={padT + chartH - 1}
                  stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              )}
              {/* Month label */}
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

      {/* Insufficient data notification overlay when no transactions exist */}
      {!hasTransactions && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/10 dark:bg-black/40 backdrop-blur-[2px] border border-amber-500/20">
          <div className="text-center max-w-sm">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
              <Info size={16} />
            </div>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Not enough billing data to display monthly trends
            </p>
            <p className={`text-[11px] mt-1 mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              0 recorded transactions across the last 6 months. Create your first invoice to begin tracking revenue.
            </p>
            <button
              onClick={onCreateInvoice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <PlusCircle size={13} />
              Create First Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function Dashboard() {
  const { isDark, currentUser, currentTenant, getAccessToken, getDecodedIdToken } = useApp()
  const navigate = useNavigate()

  const tenantSlug = currentTenant?.slug || 'workspace'
  const onNavigate = (view: string) => navigate(`/${tenantSlug}/${view}`)
  const onCreateInvoice = () => navigate(`/${tenantSlug}/invoices/new`)

  // Live tenant data states
  const [invoices, setInvoices] = useState<any[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date())
  const [loadError, setLoadError] = useState<string | null>(null)

  // Resolve active tenant ID
  const getActiveTenantId = useCallback(async (): Promise<string> => {
    try {
      if (getDecodedIdToken) {
        const decoded = await getDecodedIdToken()
        if (decoded) {
          const tid =
            decoded.org_id ||
            decoded.orgId ||
            decoded.organization_id ||
            decoded.user_org ||
            decoded.ou ||
            decoded.tenant_domain ||
            (decoded.iss && decoded.iss.includes('/t/') ? decoded.iss.split('/t/')[1].split('/')[0] : '')
          if (tid && tid !== 'default-tenant') return String(tid).trim()
        }
      }
    } catch (_) {}

    if (currentTenant?.id && currentTenant.id !== 'default-tenant' && currentTenant.id !== 'workspace') {
      return currentTenant.id.trim()
    }
    if (currentTenant?.slug && currentTenant.slug !== 'workspace') {
      return currentTenant.slug.trim()
    }
    return ''
  }, [getDecodedIdToken, currentTenant])

  // Load live data from database services for active tenant
  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    setLoadError(null)

    try {
      let token = ''
      try { if (getAccessToken) token = await getAccessToken() } catch (_) {}
      const tenantId = await getActiveTenantId()

      const [invoicesRes, customersRes, productsRes] = await Promise.allSettled([
        fetchInvoicesFromBackend(token, undefined, tenantId),
        fetchCustomersFromBackend(token, undefined, tenantId),
        fetchProductsFromBackend(token, undefined, tenantId),
      ])

      if (invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value)) {
        setInvoices(invoicesRes.value)
      } else {
        setInvoices([])
      }

      if (customersRes.status === 'fulfilled' && Array.isArray(customersRes.value)) {
        setCustomers(customersRes.value)
      } else {
        setCustomers([])
      }

      if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) {
        setProducts(productsRes.value)
      } else {
        setProducts([])
      }

      setLastRefreshedAt(new Date())
    } catch (err: any) {
      console.error('Failed to load dashboard data from database:', err)
      setLoadError(err?.message || 'Failed to connect to backend database.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [getAccessToken, getActiveTenantId])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Real Metrics Calculation
  const {
    totalRevenue,
    paidInvoicesCount,
    outstandingBalance,
    pendingInvoicesCount,
    activeCustomersCount,
    invoicedThisMonth,
    thisMonthCount,
    monthGrowthChange,
    monthlyChartData,
    hasTransactionsInWindow,
    sparklinesData,
    recentActivities,
  } = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // 1. Paid Invoices & Revenue
    let revenueSum = 0
    let paidCount = 0
    let outstandingSum = 0
    let pendingCount = 0
    let thisMonthSum = 0
    let thisMoCount = 0
    let prevMonthSum = 0

    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1

    invoices.forEach((inv) => {
      const status = String(inv.status || '').toUpperCase()
      const total = calcTotal(inv)

      if (status === 'PAID') {
        revenueSum += total
        paidCount++
      } else {
        outstandingSum += total
        pendingCount++
      }

      // Check date for month calculations
      const rawDate = inv.issueDate || inv.createdAt
      if (rawDate) {
        const invDate = new Date(rawDate)
        if (!isNaN(invDate.getTime())) {
          if (invDate.getFullYear() === currentYear && invDate.getMonth() === currentMonth) {
            thisMonthSum += total
            thisMoCount++
          } else if (invDate.getFullYear() === prevMonthYear && invDate.getMonth() === prevMonthIdx) {
            prevMonthSum += total
          }
        }
      }
    })

    // Month-over-month growth calculation
    let growthText = ''
    let growthUp = true
    let growthHasComparison = false

    if (prevMonthSum > 0) {
      const changePct = ((thisMonthSum - prevMonthSum) / prevMonthSum) * 100
      growthText = `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`
      growthUp = changePct >= 0
      growthHasComparison = true
    } else if (thisMonthSum > 0) {
      growthText = 'First active billing month'
      growthUp = true
      growthHasComparison = false
    } else {
      growthText = 'No prior month data'
      growthUp = true
      growthHasComparison = false
    }

    // 2. Dynamic 6-Month Chart Data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const last6Months = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(currentYear, currentMonth - (5 - idx), 1)
      return {
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        revenue: 0,
        outstanding: 0,
        count: 0,
      }
    })

    invoices.forEach((inv) => {
      const rawDate = inv.issueDate || inv.createdAt
      if (!rawDate) return
      const invDate = new Date(rawDate)
      if (isNaN(invDate.getTime())) return

      const invYear = invDate.getFullYear()
      const invMonth = invDate.getMonth()
      const bucket = last6Months.find(m => m.year === invYear && m.monthIndex === invMonth)
      if (bucket) {
        const total = calcTotal(inv)
        const isPaid = String(inv.status || '').toUpperCase() === 'PAID'
        if (isPaid) bucket.revenue += total
        else bucket.outstanding += total
        bucket.count++
      }
    })

    const hasTxInWindow = last6Months.some(m => m.count > 0 || m.revenue > 0 || m.outstanding > 0)

    // 3. Dynamic Sparklines
    const revSparkline = last6Months.map(m => m.revenue)
    const outSparkline = last6Months.map(m => m.outstanding)
    const custSparkline = last6Months.map((_, i) => Math.round((customers.length / 6) * (i + 1)))
    const moSparkline = last6Months.map(m => m.revenue + m.outstanding)

    // 4. Real Recent Activity Feed
    const activityItems: {
      id: string
      icon: any
      color: string
      bg: string
      text: string
      sub: string
      time: string
      rawTimestamp: number
    }[] = []

    invoices.slice(0, 15).forEach((inv) => {
      const num = inv.number || inv.invoiceNumber || (inv.id ? `INV-${inv.id.slice(0, 6)}` : 'Invoice')
      const totalStr = formatCurrency(calcTotal(inv), inv.currency)
      const client = inv.customerName || 'Customer'
      const status = String(inv.status || '').toUpperCase()
      const dateStr = inv.updatedAt || inv.issueDate || inv.createdAt
      const ts = dateStr ? new Date(dateStr).getTime() : 0

      if (status === 'PAID') {
        activityItems.push({
          id: `inv-${inv.id}-paid`,
          icon: CheckCircle2,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
          text: `Invoice #${num} marked as Paid`,
          sub: `${client} • ${totalStr}`,
          time: formatRelativeTime(dateStr),
          rawTimestamp: ts,
        })
      } else if (status === 'SENT') {
        activityItems.push({
          id: `inv-${inv.id}-sent`,
          icon: Send,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          text: `Invoice #${num} sent to ${client}`,
          sub: `${client} • ${totalStr}`,
          time: formatRelativeTime(dateStr),
          rawTimestamp: ts,
        })
      } else if (status === 'OVERDUE') {
        activityItems.push({
          id: `inv-${inv.id}-overdue`,
          icon: AlertTriangle,
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
          text: `Invoice #${num} is now Overdue`,
          sub: `${client} • ${totalStr}`,
          time: formatRelativeTime(inv.dueDate || dateStr),
          rawTimestamp: ts,
        })
      } else {
        activityItems.push({
          id: `inv-${inv.id}-draft`,
          icon: FilePlus,
          color: 'text-indigo-500',
          bg: 'bg-indigo-500/10',
          text: `Invoice #${num} draft created`,
          sub: `${client} • ${totalStr}`,
          time: formatRelativeTime(dateStr),
          rawTimestamp: ts,
        })
      }
    })

    customers.slice(0, 5).forEach((c) => {
      const ts = c.createdAt ? new Date(c.createdAt).getTime() : 0
      activityItems.push({
        id: `cust-${c.id}`,
        icon: UserPlus,
        color: 'text-violet-500',
        bg: 'bg-violet-500/10',
        text: `Customer ${c.name} recorded`,
        sub: c.email || c.country || 'Active Customer',
        time: formatRelativeTime(c.createdAt),
        rawTimestamp: ts,
      })
    })

    // Sort by timestamp descending
    activityItems.sort((a, b) => b.rawTimestamp - a.rawTimestamp)

    return {
      totalRevenue: revenueSum,
      paidInvoicesCount: paidCount,
      outstandingBalance: outstandingSum,
      pendingInvoicesCount: pendingCount,
      activeCustomersCount: customers.filter(c => c.active !== false).length,
      invoicedThisMonth: thisMonthSum,
      thisMonthCount: thisMoCount,
      monthGrowthChange: {
        text: growthText,
        up: growthUp,
        hasComparison: growthHasComparison,
      },
      monthlyChartData: last6Months,
      hasTransactionsInWindow: hasTxInWindow,
      sparklinesData: {
        revenue: revSparkline,
        outstanding: outSparkline,
        customers: custSparkline,
        month: moSparkline,
      },
      recentActivities: activityItems.slice(0, 6),
    }
  }, [invoices, customers])

  // Metric cards definitions with dynamic database data
  const metrics = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      notice:
        paidInvoicesCount > 0
          ? `${paidInvoicesCount} paid invoice${paidInvoicesCount === 1 ? '' : 's'}`
          : invoices.length > 0
            ? 'No paid invoices yet'
            : 'No invoice records yet',
      hasEnoughData: paidInvoicesCount > 0,
      icon: DollarSign,
      iconBg: 'from-indigo-500 to-violet-600',
      color: '#6366f1',
      sparkKey: 'revenue' as const,
      subNotice: paidInvoicesCount === 0 ? 'Collect payments to log revenue' : undefined,
    },
    {
      label: 'Outstanding Balance',
      value: formatCurrency(outstandingBalance),
      notice:
        outstandingBalance > 0
          ? `${pendingInvoicesCount} pending invoice${pendingInvoicesCount === 1 ? '' : 's'}`
          : invoices.length > 0
            ? 'All invoices settled'
            : 'No outstanding dues',
      hasEnoughData: outstandingBalance > 0 || invoices.length > 0,
      icon: AlertCircle,
      iconBg: 'from-amber-400 to-orange-500',
      color: '#f59e0b',
      sparkKey: 'outstanding' as const,
      subNotice: invoices.length === 0 ? 'No invoices issued yet' : undefined,
    },
    {
      label: 'Active Customers',
      value: activeCustomersCount.toString(),
      notice:
        activeCustomersCount > 0
          ? `${activeCustomersCount} in directory`
          : 'No customers recorded yet',
      hasEnoughData: activeCustomersCount > 0,
      icon: Users,
      iconBg: 'from-emerald-400 to-teal-500',
      color: '#10b981',
      sparkKey: 'customers' as const,
      subNotice: activeCustomersCount === 0 ? 'Add customer to enable invoicing' : undefined,
    },
    {
      label: 'Invoiced This Month',
      value: formatCurrency(invoicedThisMonth),
      notice:
        monthGrowthChange.hasComparison
          ? `${monthGrowthChange.text} vs last month`
          : monthGrowthChange.text,
      hasEnoughData: thisMonthCount > 0,
      up: monthGrowthChange.up,
      hasComparison: monthGrowthChange.hasComparison,
      icon: FileText,
      iconBg: 'from-blue-400 to-cyan-500',
      color: '#3b82f6',
      sparkKey: 'month' as const,
      subNotice: thisMonthCount === 0 ? '0 invoices issued this month' : `${thisMonthCount} invoice${thisMonthCount === 1 ? '' : 's'} issued`,
    },
  ]

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-xl'
    : 'bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-black/5'

  const tenantDisplayName = currentTenant?.name || 'Workspace'
  const tenantInitials = currentTenant?.initials || tenantDisplayName.slice(0, 2).toUpperCase()

  return (
    <div className="space-y-5">
      {/* Real Tenant & Database Sync Status Bar */}
      <div className={`${glass} rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
            {tenantInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {tenantDisplayName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Database
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tenant slug: <span className="font-mono">{tenantSlug}</span> • Synced with backend microservices
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`hidden sm:flex items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1">
              <FileText size={13} className="text-indigo-400" />
              <strong>{invoices.length}</strong> Invoices
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users size={13} className="text-emerald-400" />
              <strong>{customers.length}</strong> Customers
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Package size={13} className="text-blue-400" />
              <strong>{products.length}</strong> Products
            </span>
          </div>

          <button
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing || isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/[0.1] border-white/10 text-slate-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
            }`}
            title="Refresh database records"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-indigo-500' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <span>Backend sync notice: {loadError}</span>
          <button onClick={() => loadDashboardData(true)} className="underline hover:text-red-300 font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`${glass} rounded-2xl p-5 h-44 animate-pulse flex flex-col justify-between`}>
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-slate-400/20 rounded" />
                  <div className="h-6 w-32 bg-slate-400/30 rounded" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-400/20" />
              </div>
              <div className="h-10 bg-slate-400/10 rounded" />
              <div className="h-3 w-28 bg-slate-400/20 rounded" />
            </div>
          ))}
        </div>
      ) : (
        /* Real Metric cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {metrics.map((m, i) => {
            const Icon = m.icon
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className={`${glass} rounded-2xl p-5 relative overflow-hidden cursor-default flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
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

                  <div className="h-12 -mx-1 mb-3">
                    <DynamicSparkline
                      values={sparklinesData[m.sparkKey]}
                      color={m.color}
                      hasEnoughData={m.hasEnoughData}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                  {m.hasEnoughData ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold flex items-center gap-1 ${m.up !== false ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {m.hasComparison && (m.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />)}
                        {m.notice}
                      </span>
                      {m.subNotice && (
                        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {m.subNotice}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-medium">
                      <AlertCircle size={12} className="flex-shrink-0" />
                      <span>{m.notice}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Main chart + activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Overview Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.28 }}
          className={`${glass} rounded-2xl p-5 xl:col-span-2`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
                  Revenue & Pending Overview
                </h2>
                {!hasTransactionsInWindow && !isLoading && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Awaiting data
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Last 6 months • paid revenue vs pending invoices from database
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-indigo-500" />
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Paid Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-amber-500" />
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Pending / Due</span>
              </div>
            </div>
          </div>
          <div className="w-full">
            <DynamicRevenueBarChart
              data={monthlyChartData}
              isDark={isDark}
              hasTransactions={hasTransactionsInWindow}
              onCreateInvoice={onCreateInvoice}
            />
          </div>
        </motion.div>

        {/* Real Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className={`${glass} rounded-2xl p-5 flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className={`text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
                  Recent Activity
                </h2>
                {recentActivities.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400">
                    {recentActivities.length}
                  </span>
                )}
              </div>
              <Clock size={15} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            </div>

            {recentActivities.length === 0 ? (
              <div className="text-center py-8 px-4 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center mb-2.5">
                  <Clock size={18} />
                </div>
                <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  No recent activity recorded
                </p>
                <p className={`text-[11px] mt-1 mb-3 max-w-[200px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Invoices and customer events for this tenant will appear here automatically.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onCreateInvoice}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-all"
                  >
                    + Invoice
                  </button>
                  <button
                    onClick={() => onNavigate('customers')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border cursor-pointer transition-all ${
                      isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    + Customer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 overflow-y-auto max-h-60 pr-1">
                {recentActivities.map((a, i) => {
                  const Icon = a.icon
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-default ${
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.03]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${a.bg}`}>
                        <Icon size={13} className={a.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 500 }}>
                          {a.text}
                        </p>
                        <p className={`text-[11px] mt-0.5 truncate ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{a.sub}</p>
                      </div>
                      <span className={`text-[10px] flex-shrink-0 mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        {a.time}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.04] text-[11px] flex items-center justify-between text-slate-400">
            <span>Data synced from microservices</span>
            <span className="font-mono text-[10px]">{formatRelativeTime(lastRefreshedAt)}</span>
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
            transition={{ delay: 0.4 + i * 0.06 }}
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
                <p className="text-[10px] text-amber-500 mt-1" style={{ fontWeight: 600 }}>Viewer role • restricted</p>
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
