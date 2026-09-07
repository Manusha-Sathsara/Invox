import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import {
  Plus, Search, Eye, Edit3, Send, Trash2,
  FileText, MoreHorizontal, Download,
  CheckCircle2, AlertTriangle, X, RefreshCw, Loader2,
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import type { InvoiceStatus } from '../App'
import { useApp } from '../context/AppContext'
import {
  fetchInvoicesFromBackend,
  payInvoiceInBackend,
  sendExistingInvoiceInBackend,
  downloadInvoicePdfFromBackend,
  DIRECT_INVOICE_BASE_URL,
} from '../services/invoiceService'

const STATUS_DOT: Record<InvoiceStatus, string> = {
  Draft: 'bg-slate-400',
  Sent: 'bg-blue-500',
  Paid: 'bg-emerald-500',
  Overdue: 'bg-red-500',
}

const FILTERS: { label: string; value: InvoiceStatus | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Sent', value: 'Sent' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Overdue', value: 'Overdue' },
]

function calcTotal(invoice: any) {
  if (invoice.grandTotal !== undefined && invoice.grandTotal !== null) {
    return Number(invoice.grandTotal)
  }
  if (invoice.total !== undefined && invoice.total !== null) {
    return Number(invoice.total)
  }
  if (Array.isArray(invoice.items)) {
    return invoice.items.reduce((sum: number, item: any) => {
      const subtotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || Number(item.price) || 0)
      return sum + subtotal + (subtotal * (Number(item.taxRate) || 0)) / 100
    }, 0)
  }
  return 0
}

function normalizeStatus(s: string): InvoiceStatus {
  const up = String(s || '').toUpperCase()
  if (up === 'PAID') return 'Paid'
  if (up === 'SENT') return 'Sent'
  if (up === 'DRAFT') return 'Draft'
  if (up === 'OVERDUE') return 'Overdue'
  return (s as InvoiceStatus) || 'Draft'
}

function StatusBadge({ status, isDark }: { status: InvoiceStatus | string; isDark: boolean }) {
  const normStatus = normalizeStatus(status)

  const colors: Record<InvoiceStatus, string> = {
    Draft: isDark
      ? 'bg-slate-800/60 border-slate-700/40 text-slate-400'
      : 'bg-slate-100 border-slate-200 text-slate-500',
    Sent: isDark
      ? 'bg-blue-900/30 border-blue-700/30 text-blue-400'
      : 'bg-blue-50 border-blue-200/60 text-blue-600',
    Paid: isDark
      ? 'bg-emerald-900/30 border-emerald-700/30 text-emerald-400'
      : 'bg-emerald-50 border-emerald-200/60 text-emerald-600',
    Overdue: isDark
      ? 'bg-red-900/30 border-red-700/30 text-red-400'
      : 'bg-red-50 border-red-200/60 text-red-600',
  }

  const glowColors: Record<InvoiceStatus, string> = {
    Draft: '',
    Sent: 'shadow-blue-500/20',
    Paid: 'shadow-emerald-500/20',
    Overdue: 'shadow-red-500/20',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border shadow-sm ${colors[normStatus] || colors.Draft} ${glowColors[normStatus] || ''}`}
      style={{ fontWeight: 600 }}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[normStatus] || STATUS_DOT.Draft}`} />
      {normStatus}
    </span>
  )
}

export function InvoiceList() {
  const { isDark, currentUser, currentTenant, getAccessToken, getDecodedIdToken } = useApp()
  const navigate = useNavigate()

  const tenantSlug = currentTenant?.slug || 'workspace'
  const onEdit = (id: string) => navigate(`/${tenantSlug}/invoices/${id}`)
  const onCreate = () => navigate(`/${tenantSlug}/invoices/new`)

  const [activeFilter, setActiveFilter] = useState<InvoiceStatus | 'All'>('All')
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const canEdit = currentUser.role !== 'Viewer'

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
            decoded.tenant_id
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

  // Load invoices from backend
  const loadInvoices = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      let token = ''
      try { if (getAccessToken) token = await getAccessToken() } catch (_) {}
      const tenantId = await getActiveTenantId()

      const data = await fetchInvoicesFromBackend(token, undefined, tenantId)
      if (Array.isArray(data)) {
        setInvoices(data)
      } else {
        setInvoices([])
      }
    } catch (err: any) {
      console.warn('Failed to load invoices from backend:', err)
      setLoadError(err?.message || 'Could not connect to invoice database')
      setInvoices([])
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken, getActiveTenantId])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const filtered = invoices.filter((inv) => {
    const norm = normalizeStatus(inv.status)
    const matchFilter = activeFilter === 'All' || norm === activeFilter
    const num = String(inv.number || inv.invoiceNumber || '')
    const cName = String(inv.customerName || '')
    const matchSearch =
      num.toLowerCase().includes(search.toLowerCase()) ||
      cName.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  // Action: Mark as Paid
  const handleMarkPaid = async (id: string, num: string) => {
    setUpdatingId(id)
    try {
      let token = ''
      try { if (getAccessToken) token = await getAccessToken() } catch (_) {}
      await payInvoiceInBackend(id, token)
      setInvoices(prev =>
        prev.map(i => (i.id === id ? { ...i, status: 'PAID' } : i))
      )
      toast.success(`Invoice ${num} marked as Paid`, {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      })
    } catch (err: any) {
      console.error('Failed to mark invoice as paid:', err)
      toast.error(`Could not update invoice ${num}`, {
        description: err.message || 'Payment update failed.',
      })
    } finally {
      setUpdatingId(null)
      setOpenMenu(null)
    }
  }

  // Action: Send invoice
  const handleSend = async (id: string, num: string) => {
    setUpdatingId(id)
    try {
      let token = ''
      try { if (getAccessToken) token = await getAccessToken() } catch (_) {}
      await sendExistingInvoiceInBackend(id, token)
      setInvoices(prev =>
        prev.map(i => (i.id === id ? { ...i, status: 'SENT' } : i))
      )
      toast.success(`Invoice ${num} sent to customer`, {
        description: 'Customer notified with attached PDF invoice.',
        icon: <Send className="w-5 h-5 text-blue-500" />,
      })
    } catch (err: any) {
      console.error('Failed to send invoice:', err)
      toast.error(`Could not send invoice ${num}`, {
        description: err.message,
      })
    } finally {
      setUpdatingId(null)
      setOpenMenu(null)
    }
  }

  // Action: Download PDF from backend
  const handleDownloadPdf = async (id: string, num: string) => {
    setDownloadingId(id)
    try {
      let token = ''
      try { if (getAccessToken) token = await getAccessToken() } catch (_) {}
      await downloadInvoicePdfFromBackend(id, num, token)
      toast.success(`Downloaded ${num}.pdf`)
    } catch (err: any) {
      console.error('PDF download error:', err)
      toast.error(`Unable to download PDF for ${num}`, {
        description: err.message || 'Make sure invoice PDF has been rendered on the backend.',
      })
    } finally {
      setDownloadingId(null)
      setOpenMenu(null)
    }
  }

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-xl'
    : 'bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-black/5'

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <Toaster position="top-right" theme={isDark ? 'dark' : 'light'} richColors />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
              Invoices
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Live Database
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {invoices.length} total invoice records loaded from backend
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadInvoices}
            disabled={isLoading}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-white/[0.08] hover:bg-white/[0.06] text-slate-400'
                : 'border-black/[0.07] hover:bg-black/[0.04] text-slate-500'
            }`}
            title="Refresh invoices"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-indigo-500' : ''} />
          </button>

          {canEdit && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white shadow-lg shadow-indigo-500/25 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 600 }}
            >
              <Plus size={16} />
              New Invoice
            </motion.button>
          )}
        </div>
      </div>

      {loadError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle size={14} /> Backend notice: {loadError}
          </span>
          <button onClick={loadInvoices} className="underline hover:text-amber-400 font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Controls: Search + Filter Tabs */}
      <div className={`${glass} rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3`}>
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === f.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
              {f.value !== 'All' && (
                <span className="ml-1.5 opacity-70 text-[10px]">
                  {invoices.filter(i => normalizeStatus(i.status) === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice # or client..."
            className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none transition-all ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.07] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50'
                : 'bg-black/[0.02] border-black/[0.06] text-slate-800 placeholder:text-slate-400 focus:border-indigo-500/50 focus:bg-white'
            }`}
          />
        </div>
      </div>

      {/* Invoice Table */}
      <div className={`${glass} rounded-2xl overflow-hidden`}>
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 size={24} className="animate-spin text-indigo-500 mx-auto mb-2" />
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading invoices from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={32} className={`mx-auto mb-2.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
              {search || activeFilter !== 'All' ? 'No matching invoices' : 'No invoices created yet'}
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {search || activeFilter !== 'All' ? 'Try changing your search or filter.' : 'Generate your first invoice for a customer.'}
            </p>
            {canEdit && !search && activeFilter === 'All' && (
              <button
                onClick={onCreate}
                className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                <Plus size={14} /> Create First Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-black/[0.05] bg-black/[0.02]'}`}>
                  <th className={`py-3.5 px-4 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Invoice #</th>
                  <th className={`py-3.5 px-4 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Customer</th>
                  <th className={`py-3.5 px-4 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                  <th className={`py-3.5 px-4 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Issue Date</th>
                  <th className={`py-3.5 px-4 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Due Date</th>
                  <th className={`py-3.5 px-4 font-semibold text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total</th>
                  <th className={`py-3.5 px-4 font-semibold text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-black/[0.04]'}`}>
                {filtered.map((inv) => {
                  const num = inv.number || inv.invoiceNumber || `INV-${String(inv.id).slice(-4)}`
                  const normStatus = normalizeStatus(inv.status)
                  const total = calcTotal(inv)

                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.01]'}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">
                        {num}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[11px]">
                            {(inv.customerName || 'C')[0]}
                          </div>
                          <div>
                            <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {inv.customerName || 'Direct Client'}
                            </p>
                            {inv.customerEmail && (
                              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {inv.customerEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={normStatus} isDark={isDark} />
                      </td>

                      <td className={`py-3.5 px-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {inv.issueDate || '—'}
                      </td>

                      <td className={`py-3.5 px-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {inv.dueDate || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-sm">
                        <span className={isDark ? 'text-white' : 'text-slate-900'}>
                          ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(inv.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'
                            }`}
                            title="Edit / View Details"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleDownloadPdf(inv.id, num)}
                            disabled={downloadingId === inv.id}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'
                            }`}
                            title="Download PDF"
                          >
                            {downloadingId === inv.id ? <Loader2 size={14} className="animate-spin text-indigo-500" /> : <Download size={14} />}
                          </button>

                          {canEdit && normStatus !== 'Paid' && (
                            <button
                              onClick={() => handleMarkPaid(inv.id, num)}
                              disabled={updatingId === inv.id}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer text-emerald-400 ${
                                isDark ? 'hover:bg-emerald-500/10' : 'hover:bg-emerald-50'
                              }`}
                              title="Mark as Paid"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}

                          {canEdit && normStatus !== 'Paid' && (
                            <button
                              onClick={() => handleSend(inv.id, num)}
                              disabled={updatingId === inv.id}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer text-blue-400 ${
                                isDark ? 'hover:bg-blue-500/10' : 'hover:bg-blue-50'
                              }`}
                              title="Send Invoice PDF via Email"
                            >
                              <Send size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
