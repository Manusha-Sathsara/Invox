import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, useParams } from 'react-router'
import {
  ArrowLeft, Plus, Trash2, Save, Send, FileDown,
  FileText, User, Package, ChevronDown,
  CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { DatePicker } from './DatePicker'
import type { InvoiceStatus, LineItem } from '../App'
import { INVOICES, CUSTOMERS, PRODUCTS } from '../App'
import { useApp } from '../context/AppContext'

const STATUS_COLORS: Record<InvoiceStatus, { text: string; bg: string; border: string; dot: string }> = {
  Draft: {
    text: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700/40',
    dot: 'bg-slate-400',
  },
  Sent: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200/60 dark:border-blue-800/40',
    dot: 'bg-blue-500',
  },
  Paid: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200/60 dark:border-emerald-800/40',
    dot: 'bg-emerald-500',
  },
  Overdue: {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200/60 dark:border-red-800/40',
    dot: 'bg-red-500',
  },
}

function genInvoiceNumber() {
  return `INV-2024-${String(Math.floor(Math.random() * 900) + 100)}`
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function addDays(date: string, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function InvoiceEditor() {
  const { isDark, currentUser, currentTenant } = useApp()
  const navigate = useNavigate()
  const { id } = useParams()
  const invoiceId = id ?? 'new'
  const onBack = () => navigate(`/${currentTenant.slug}/invoices`)
  const isNew = invoiceId === 'new'
  const existingInv = isNew ? null : INVOICES.find(i => i.id === invoiceId) ?? null
  const canEdit = currentUser.role !== 'Viewer'

  const [invoiceNumber, setInvoiceNumber] = useState(existingInv?.number ?? genInvoiceNumber())
  const [status, setStatus] = useState<InvoiceStatus>(existingInv?.status ?? 'Draft')
  const [customerId, setCustomerId] = useState(existingInv?.customerId ?? '')
  const [issueDate, setIssueDate] = useState(existingInv?.issueDate ?? today())
  const [dueDate, setDueDate] = useState(existingInv?.dueDate ?? addDays(today(), 30))
  const [notes, setNotes] = useState(existingInv?.notes ?? '')
  const [items, setItems] = useState<LineItem[]>(
    existingInv?.items ?? [{ id: '1', description: '', quantity: 1, unitPrice: 0, taxRate: 10 }]
  )
  const [customerDropOpen, setCustomerDropOpen] = useState(false)
  const [productDrop, setProductDrop] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const selectedCustomer = CUSTOMERS.find(c => c.id === customerId)

  const subtotal = items.reduce((s, item) => s + item.quantity * item.unitPrice, 0)
  const taxTotal = items.reduce((s, item) => s + (item.quantity * item.unitPrice * item.taxRate) / 100, 0)
  const grandTotal = subtotal + taxTotal

  const addItem = () => {
    setItems([...items, {
      id: String(Date.now()),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 10,
    }])
  }

  const removeItem = (id: string) => {
    if (items.length === 1) return
    setItems(items.filter(i => i.id !== id))
  }

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleProductSelect = (itemId: string, productId: string) => {
    const product = PRODUCTS.find(p => p.id === productId)
    if (!product) return
    setItems(items.map(item => item.id === itemId ? {
      ...item,
      description: product.name,
      unitPrice: product.price,
      taxRate: product.taxRate,
    } : item))
    setProductDrop(null)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-xl'
    : 'bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-black/5'

  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.06] border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-white/[0.08]'
      : 'bg-black/[0.03] border-black/[0.06] text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white/80'
  } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`

  const statusCfg = STATUS_COLORS[status]

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Back + header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className={`p-2 rounded-xl border transition-colors ${
              isDark
                ? 'border-white/[0.08] hover:bg-white/[0.06] text-slate-400'
                : 'border-black/[0.07] hover:bg-black/[0.04] text-slate-500'
            }`}
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div>
            <h1 className={`text-xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
              {isNew ? 'Create Invoice' : `Edit ${existingInv?.number}`}
            </h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {isNew ? 'Fill in the details below to create a new invoice' : 'Update invoice details'}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${statusCfg.bg} ${statusCfg.border}`}>
            <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
            <span className={`text-sm ${statusCfg.text}`} style={{ fontWeight: 600 }}>{status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main editor column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{ position: 'relative', zIndex: customerDropOpen ? 20 : 1 }}
            className={`${glass} rounded-2xl p-5`}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
              <h2 className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
                Invoice Details
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
                  Invoice Number
                </label>
                <input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  disabled={!canEdit}
                  className={inputClass}
                />
              </div>

              {/* Customer selector */}
              <div className="relative">
                <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
                  Customer
                </label>
                <button
                  disabled={!canEdit}
                  onClick={() => canEdit && setCustomerDropOpen(!customerDropOpen)}
                  className={`${inputClass} flex items-center justify-between text-left`}
                >
                  <span className={!selectedCustomer ? (isDark ? 'text-slate-600' : 'text-slate-400') : ''}>
                    {selectedCustomer?.name ?? 'Select customer…'}
                  </span>
                  <ChevronDown size={14} className={`${isDark ? 'text-slate-500' : 'text-slate-400'} flex-shrink-0 ${customerDropOpen ? 'rotate-180' : ''} transition-transform`} />
                </button>
                <AnimatePresence>
                  {customerDropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.13 }}
                      style={{ zIndex: 600 }}
                      className={`absolute top-full left-0 mt-1 w-full rounded-xl border shadow-xl overflow-hidden ${
                        isDark
                          ? 'bg-slate-900/95 backdrop-blur-xl border-white/[0.08]'
                          : 'bg-white/95 backdrop-blur-xl border-black/[0.08] shadow-black/10'
                      }`}
                    >
                      {CUSTOMERS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setCustomerId(c.id); setCustomerDropOpen(false) }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            isDark ? 'hover:bg-white/[0.06] text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                          } ${customerId === c.id ? isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-700' : ''}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                            isDark ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                          }`} style={{ fontWeight: 700 }}>
                            {c.name[0]}
                          </div>
                          <div>
                            <p className="text-sm" style={{ fontWeight: 500 }}>{c.name}</p>
                            <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{c.email}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <DatePicker
                label="Issue Date"
                value={issueDate}
                onChange={setIssueDate}
                disabled={!canEdit}
                isDark={isDark}
              />

              <DatePicker
                label="Due Date"
                value={dueDate}
                onChange={setDueDate}
                disabled={!canEdit}
                isDark={isDark}
              />
            </div>
          </motion.div>

          {/* Line items */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ position: 'relative', zIndex: productDrop ? 20 : 1 }}
            className={`${glass} rounded-2xl p-5`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                <h2 className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
                  Line Items
                </h2>
              </div>
              {canEdit && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={addItem}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    isDark
                      ? 'border-indigo-700/50 text-indigo-400 hover:bg-indigo-900/30'
                      : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  <Plus size={13} />
                  Add Item
                </motion.button>
              )}
            </div>

            {/* Line items — scroll on mobile */}
            <div className="overflow-x-auto -mx-1 px-1">

            {/* Table header */}
            <div className={`grid gap-2 pb-2 mb-1 border-b text-xs min-w-[520px] ${isDark ? 'border-white/[0.06] text-slate-500' : 'border-black/[0.05] text-slate-400'}`}
              style={{ gridTemplateColumns: '1fr 80px 100px 70px 90px 36px', fontWeight: 600 }}>
              <span>Description / Product</span>
              <span>Qty</span>
              <span>Unit Price</span>
              <span>Tax %</span>
              <span className="text-right">Subtotal</span>
              <span />
            </div>

            <AnimatePresence>
              {items.map((item, idx) => {
                const lineSubtotal = item.quantity * item.unitPrice
                const lineTax = (lineSubtotal * item.taxRate) / 100
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`grid gap-2 py-2.5 border-b min-w-[520px] ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}
                    style={{ gridTemplateColumns: '1fr 80px 100px 70px 90px 36px', alignItems: 'center' }}
                  >
                    {/* Description with product picker */}
                    <div className="relative">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        disabled={!canEdit}
                        placeholder="Description…"
                        className={`${inputClass} text-xs py-2`}
                      />
                      {canEdit && (
                        <button
                          onClick={() => setProductDrop(productDrop === item.id ? null : item.id)}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                            isDark ? 'hover:bg-white/10 text-slate-500' : 'hover:bg-black/5 text-slate-400'
                          }`}
                          title="Select product"
                        >
                          <Package size={12} />
                        </button>
                      )}
                      <AnimatePresence>
                        {productDrop === item.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            style={{ zIndex: 600 }}
                            className={`absolute top-full left-0 mt-1 w-64 rounded-xl border shadow-xl overflow-hidden ${
                              isDark
                                ? 'bg-slate-900/95 backdrop-blur-xl border-white/[0.08]'
                                : 'bg-white/95 backdrop-blur-xl border-black/[0.08] shadow-black/10'
                            }`}
                          >
                            {PRODUCTS.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => handleProductSelect(item.id, p.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                  isDark ? 'hover:bg-white/[0.06] text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="flex-1">
                                  <p className="text-xs" style={{ fontWeight: 600 }}>{p.name}</p>
                                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    ${p.price} / {p.unit} · {p.taxRate}% tax
                                  </p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      disabled={!canEdit}
                      min="0"
                      className={`${inputClass} text-xs py-2 text-center`}
                    />

                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>$</span>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        disabled={!canEdit}
                        min="0"
                        className={`${inputClass} text-xs py-2 pl-6`}
                      />
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        value={item.taxRate}
                        onChange={(e) => updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                        disabled={!canEdit}
                        min="0"
                        max="100"
                        className={`${inputClass} text-xs py-2 text-center`}
                      />
                    </div>

                    <div className="text-right">
                      <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 700 }}>
                        ${(lineSubtotal + lineTax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {item.taxRate > 0 && (
                        <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                          +${lineTax.toFixed(2)} tax
                        </p>
                      )}
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className={`p-1.5 rounded-lg transition-colors ${
                          items.length === 1
                            ? 'opacity-30 cursor-not-allowed'
                            : isDark ? 'hover:bg-red-900/30 text-slate-600 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'
                        }`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
            </div>{/* end overflow-x-auto */}
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`${glass} rounded-2xl p-5`}
          >
            <label className={`text-xs mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
              Notes / Payment Terms
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canEdit}
              placeholder="Add a note or payment terms…"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </motion.div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Calculation panel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className={`${glass} rounded-2xl p-5`}
          >
            <h2 className={`text-sm mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
              Summary
            </h2>

            <div className="space-y-2.5">
              <div className={`flex justify-between text-sm pb-2.5 border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.05]'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Subtotal</span>
                <span className={isDark ? 'text-slate-200' : 'text-slate-800'} style={{ fontWeight: 600 }}>
                  ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tax</span>
                <span className={isDark ? 'text-slate-200' : 'text-slate-800'} style={{ fontWeight: 600 }}>
                  ${taxTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.05]'}`}>
              <div className="flex justify-between items-end">
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`} style={{ fontWeight: 600 }}>Total Due</span>
                <div className="text-right">
                  <p className={`text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>
                    ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>USD</p>
                </div>
              </div>
            </div>

            {/* Breakdown per item */}
            <div className={`mt-4 pt-3 border-t ${isDark ? 'border-white/[0.05]' : 'border-black/[0.04]'} space-y-1.5`}>
              {items.filter(item => item.description).map((item) => (
                <div key={item.id} className="flex justify-between text-[11px]">
                  <span className={`truncate max-w-[130px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {item.description || 'Unnamed item'} ×{item.quantity}
                  </span>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    ${(item.quantity * item.unitPrice * (1 + item.taxRate / 100)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Customer info */}
          {selectedCustomer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${glass} rounded-2xl p-5`}
            >
              <div className="flex items-center gap-2 mb-3">
                <User size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>Bill To</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
                {selectedCustomer.name}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{selectedCustomer.email}</p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{selectedCustomer.phone}</p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{selectedCustomer.country}</p>
              <div className={`mt-3 pt-3 border-t text-[11px] flex gap-3 ${isDark ? 'border-white/[0.05]' : 'border-black/[0.04]'}`}>
                <div>
                  <p className={isDark ? 'text-slate-600' : 'text-slate-400'}>Total Invoiced</p>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-600'} style={{ fontWeight: 700 }}>
                    ${selectedCustomer.totalInvoiced.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className={isDark ? 'text-slate-600' : 'text-slate-400'}>Outstanding</p>
                  <p className={selectedCustomer.outstanding > 0 ? 'text-amber-500' : (isDark ? 'text-emerald-400' : 'text-emerald-600')} style={{ fontWeight: 700 }}>
                    ${selectedCustomer.outstanding.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className={`${glass} rounded-2xl p-4 space-y-2.5`}
          >
            <h2 className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
              Actions
            </h2>

            {canEdit ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border transition-all ${
                    saved
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/25'
                      : isDark
                        ? 'border-white/[0.1] text-slate-200 hover:bg-white/[0.06]'
                        : 'border-black/[0.08] text-slate-700 hover:bg-black/[0.04]'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                  {saved ? 'Saved!' : 'Save Draft'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white shadow-lg shadow-indigo-500/30 transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', fontWeight: 600 }}
                >
                  <Send size={16} />
                  Send Invoice
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border transition-all ${
                    isDark
                      ? 'border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      : 'border-black/[0.07] text-slate-500 hover:text-slate-700 hover:bg-black/[0.03]'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  <FileDown size={16} />
                  Preview PDF
                </motion.button>
              </>
            ) : (
              <div className={`p-3 rounded-xl border text-center text-xs ${
                isDark ? 'border-amber-700/30 bg-amber-900/15 text-amber-400' : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}>
                <AlertTriangle size={14} className="inline mr-1" />
                Viewers cannot edit invoices
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
