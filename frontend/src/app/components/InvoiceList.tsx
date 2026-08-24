import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import {
  Plus, Search, Eye, Edit3, Send, Trash2,
  FileText, MoreHorizontal, Download,
  CheckCircle2, AlertTriangle, X,
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import type { InvoiceStatus, Invoice } from '../App'
import { INVOICES } from '../App'
import { useApp } from '../context/AppContext'

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

function calcTotal(invoice: Invoice) {
  return invoice.items.reduce((sum, item) => {
    const subtotal = item.quantity * item.unitPrice
    return sum + subtotal + (subtotal * item.taxRate) / 100
  }, 0)
}

function StatusBadge({ status, isDark }: { status: InvoiceStatus; isDark: boolean }) {
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border shadow-sm ${colors[status]} ${glowColors[status]}`}
      style={{ fontWeight: 600 }}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} />
      {status}
    </span>
  )
}

export function InvoiceList() {
  const { isDark, currentUser, currentTenant } = useApp()
  const navigate = useNavigate()
  const onEdit = (id: string) => navigate(`/${currentTenant.slug}/invoices/${id}`)
  const onCreate = () => navigate(`/${currentTenant.slug}/invoices/new`)
  const [activeFilter, setActiveFilter] = useState<InvoiceStatus | 'All'>('All')
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const canEdit = currentUser.role !== 'Viewer'

  const markAsPaid = (inv: Invoice) => {
    setUpdatingId(inv.id)
    setTimeout(() => {
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'Paid' as InvoiceStatus } : i))
      setUpdatingId(null)
      toast.success(`${inv.number} marked as Paid`, {
        description: `${inv.customerName} · $${calcTotal(inv).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: '✅',
      })
    }, 600)
  }

  const deleteInvoice = (inv: Invoice) => {
    setInvoices(prev => prev.filter(i => i.id !== inv.id))
    toast.error(`${inv.number} deleted`)
  }

  const filtered = invoices.filter((inv) => {
    const matchFilter = activeFilter === 'All' || inv.status === activeFilter
    const matchSearch = search === '' ||
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-xl'
    : 'bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-black/5'

  const totals = {
    All: invoices.length,
    Draft: invoices.filter(i => i.status === 'Draft').length,
    Sent: invoices.filter(i => i.status === 'Sent').length,
    Paid: invoices.filter(i => i.status === 'Paid').length,
    Overdue: invoices.filter(i => i.status === 'Overdue').length,
  }

  const filterAccentColors: Record<string, string> = {
    Draft: isDark ? 'border-slate-600 text-slate-300 bg-slate-800/60' : 'border-slate-300 text-slate-700 bg-slate-50',
    Sent: isDark ? 'border-blue-700/50 text-blue-400 bg-blue-900/20' : 'border-blue-200 text-blue-700 bg-blue-50',
    Paid: isDark ? 'border-emerald-700/50 text-emerald-400 bg-emerald-900/20' : 'border-emerald-200 text-emerald-700 bg-emerald-50',
    Overdue: isDark ? 'border-red-700/50 text-red-400 bg-red-900/20' : 'border-red-200 text-red-700 bg-red-50',
    All: isDark ? 'border-indigo-700/50 text-indigo-400 bg-indigo-900/20' : 'border-indigo-200 text-indigo-700 bg-indigo-50',
  }

  return (
    <>
    <Toaster position="bottom-right" theme={isDark ? 'dark' : 'light'} richColors />
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
            Invoices
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{invoices.length} total invoices</p>
        </div>
        {canEdit ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white shadow-lg shadow-indigo-500/25"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 600 }}
          >
            <Plus size={16} />
            New Invoice
          </motion.button>
        ) : (
          <div className="relative group">
            <button disabled className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-not-allowed opacity-40 ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500'}`}
              style={{ fontWeight: 600 }}>
              <Plus size={16} />
              New Invoice
            </button>
            <div className={`absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-800 text-white'}`}>
              Viewers cannot create invoices
            </div>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className={`${glass} rounded-2xl p-4`}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className={`relative flex items-center rounded-xl border flex-1 min-w-[180px] ${
            isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-black/[0.07] bg-black/[0.03]'
          }`}>
            <Search size={15} className={`absolute left-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search by number or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full bg-transparent pl-9 pr-4 py-2 text-sm outline-none ${isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-700 placeholder:text-slate-400'}`}
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.value
              return (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                    isActive
                      ? filterAccentColors[f.value]
                      : isDark
                        ? 'border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.12]'
                        : 'border-black/[0.06] text-slate-400 hover:text-slate-600 hover:border-black/[0.12]'
                  }`}
                  style={{ fontWeight: isActive ? 700 : 500 }}
                >
                  {f.label}
                  <span className={`ml-1.5 ${isActive ? 'opacity-80' : 'opacity-50'}`}>
                    {totals[f.value]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden space-y-2">
          <AnimatePresence>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <FileText size={32} className={`mx-auto mb-2 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No invoices found</p>
              </div>
            )}
            {filtered.map((inv) => {
              const total = calcTotal(inv)
              const isUpdating = updatingId === inv.id
              return (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: isUpdating ? 0.45 : 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                    isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-black/[0.05] bg-black/[0.01]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                      <FileText size={13} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 600 }}>{inv.number}</p>
                      <p className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{inv.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={inv.status} isDark={isDark} />
                    <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
                      ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {canEdit && (inv.status === 'Sent' || inv.status === 'Overdue') && (
                      <button
                        onClick={() => markAsPaid(inv)}
                        disabled={isUpdating}
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        title="Mark as Paid"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => onEdit(inv.id)}
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/[0.06] text-slate-400' : 'hover:bg-black/[0.05] text-slate-400'}`}
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className={`text-xs border-b ${isDark ? 'border-white/[0.06] text-slate-500' : 'border-black/[0.05] text-slate-400'}`}
                style={{ fontWeight: 600 }}>
                <th className="text-left pb-3 pl-2">Invoice</th>
                <th className="text-left pb-3">Customer</th>
                <th className="text-left pb-3">Issue Date</th>
                <th className="text-left pb-3">Due Date</th>
                <th className="text-left pb-3">Status</th>
                <th className="text-right pb-3 pr-2">Amount</th>
                <th className="text-right pb-3 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <FileText size={32} className={`mx-auto mb-2 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                      <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No invoices found</p>
                    </td>
                  </tr>
                )}
                {filtered.map((inv, i) => {
                  const total = calcTotal(inv)
                  const isUpdating = updatingId === inv.id
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: isUpdating ? 0.45 : 1, y: 0, scale: isUpdating ? 0.995 : 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: isUpdating ? 0 : i * 0.04, duration: isUpdating ? 0.2 : 0.3 }}
                      className={`border-b text-sm transition-colors ${
                        isDark
                          ? 'border-white/[0.04] hover:bg-white/[0.03]'
                          : 'border-black/[0.04] hover:bg-black/[0.02]'
                      }`}
                    >
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'
                          }`}>
                            <FileText size={13} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                          </div>
                          <span className={isDark ? 'text-slate-200' : 'text-slate-800'} style={{ fontWeight: 600 }}>
                            {inv.number}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{inv.customerName}</span>
                      </td>
                      <td className="py-3.5">
                        <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>{inv.issueDate}</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`${inv.status === 'Overdue' ? 'text-red-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {inv.dueDate}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <StatusBadge status={inv.status} isDark={isDark} />
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <span className={isDark ? 'text-slate-200' : 'text-slate-800'} style={{ fontWeight: 700 }}>
                          ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (inv.status === 'Sent' || inv.status === 'Overdue') && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => markAsPaid(inv)}
                              disabled={isUpdating}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
                                isUpdating
                                  ? 'opacity-50 cursor-not-allowed'
                                  : isDark
                                    ? 'bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-700/30'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/60'
                              }`}
                              style={{ fontWeight: 600 }}
                              title="Mark as Paid"
                            >
                              {isUpdating ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                  className="w-3 h-3 rounded-full border-2 border-current border-t-transparent"
                                />
                              ) : (
                                <CheckCircle2 size={12} />
                              )}
                              {!isUpdating && 'Mark Paid'}
                            </motion.button>
                          )}
                          <button
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/[0.06] text-slate-400 hover:text-slate-200' : 'hover:bg-black/[0.05] text-slate-400 hover:text-slate-700'}`}
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => onEdit(inv.id)}
                              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/[0.06] text-slate-400 hover:text-indigo-400' : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'}`}
                              title="Edit"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenu(openMenu === inv.id ? null : inv.id)}
                              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/[0.06] text-slate-400' : 'hover:bg-black/[0.05] text-slate-400'}`}
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            <AnimatePresence>
                              {openMenu === inv.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                  transition={{ duration: 0.12 }}
                                  style={{ zIndex: 600 }}
                            className={`absolute right-0 top-full mt-1 w-40 rounded-xl border shadow-xl overflow-hidden ${
                                    isDark
                                      ? 'bg-slate-900/95 backdrop-blur-xl border-white/[0.08]'
                                      : 'bg-white/95 backdrop-blur-xl border-black/[0.08] shadow-black/10'
                                  }`}
                                  onMouseLeave={() => setOpenMenu(null)}
                                >
                                  <button className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-50'}`}>
                                    <Download size={13} />
                                    Download PDF
                                  </button>
                                  {canEdit && (
                                    <>
                                      {inv.status === 'Draft' && (
                                        <button className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${isDark ? 'text-blue-400 hover:bg-blue-900/20' : 'text-blue-600 hover:bg-blue-50'}`}>
                                          <Send size={13} />
                                          Send Invoice
                                        </button>
                                      )}
                                      <button
                                        onClick={() => { deleteInvoice(inv); setOpenMenu(null) }}
                                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}
                                      >
                                        <Trash2 size={13} />
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div className={`mt-4 pt-4 border-t flex items-center justify-between text-xs ${isDark ? 'border-white/[0.05] text-slate-500' : 'border-black/[0.05] text-slate-400'}`}>
            <span>Showing {filtered.length} of {invoices.length} invoices</span>
            <span style={{ fontWeight: 600 }}>
              Total: ${filtered.reduce((s, inv) => s + calcTotal(inv), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
