import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, useParams } from 'react-router'
import {
  ArrowLeft, Plus, Trash2, Save, Send, FileDown,
  FileText, Package, ChevronDown,
  CheckCircle2, Loader2, Mail, X, Search,
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { DatePicker } from './DatePicker'
import type { InvoiceStatus, LineItem, Product, Customer } from '../App'
import { useApp } from '../context/AppContext'
import { fetchProductsFromBackend } from '../services/productService'
import { fetchCustomersFromBackend } from '../services/customerService'
import {
  createAndSendInvoiceInBackend,
  fetchInvoiceByIdFromBackend,
  downloadInvoicePdfFromBackend,
  calculateInvoiceTotals,
  DIRECT_INVOICE_BASE_URL,
} from '../services/invoiceService'

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
  return `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`
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
  const { isDark, currentUser, currentTenant, getAccessToken, getDecodedIdToken } = useApp()
  const navigate = useNavigate()
  const { id } = useParams()
  const invoiceId = id ?? 'new'
  const tenantSlug = currentTenant?.slug || 'workspace'
  const onBack = () => navigate(`/${tenantSlug}/invoices`)
  const isNew = invoiceId === 'new'
  const canEdit = currentUser.role !== 'Viewer'

  const [invoiceNumber, setInvoiceNumber] = useState(genInvoiceNumber())
  const [status, setStatus] = useState<InvoiceStatus>('Draft')
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [issueDate, setIssueDate] = useState(today())
  const [dueDate, setDueDate] = useState(addDays(today(), 30))
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, taxRate: 10 },
  ])
  const [customerDropOpen, setCustomerDropOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [productDrop, setProductDrop] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])

  // Request States
  const [isSending, setIsSending] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false)

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

  // Click outside listener to close dropdowns smoothly
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.customer-dropdown-container')) {
        setCustomerDropOpen(false)
      }
      if (!target.closest('.product-dropdown-container')) {
        setProductDrop(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load existing invoice on mount
  useEffect(() => {
    if (!isNew && invoiceId) {
      const loadExisting = async () => {
        setIsLoadingInvoice(true)
        try {
          let token = ''
          try { if (getAccessToken) token = await getAccessToken() } catch (_) {}

          const data = await fetchInvoiceByIdFromBackend(invoiceId, token)
          if (data) {
            setInvoiceNumber(data.number || data.invoiceNumber || genInvoiceNumber())
            setStatus((data.status === 'PAID' ? 'Paid' : data.status === 'SENT' ? 'Sent' : 'Draft') as InvoiceStatus)
            setCustomerId(data.customerId || '')
            setCustomerName(data.customerName || '')
            setCustomerEmail(data.customerEmail || '')
            if (data.issueDate) setIssueDate(data.issueDate)
            if (data.dueDate) setDueDate(data.dueDate)
            if (data.notes) setNotes(data.notes)
            if (Array.isArray(data.items) && data.items.length > 0) {
              setItems(data.items.map((it: any, idx: number) => ({
                id: it.id || String(idx + 1),
                description: it.description || '',
                quantity: Number(it.quantity) || 1,
                unitPrice: Number(it.unitPrice) || 0,
                taxRate: Number(it.taxRate) || 0,
              })))
            }
          }
        } catch (err: any) {
          console.warn('Could not fetch invoice from backend:', err)
          toast.error('Could not load invoice from server')
        } finally {
          setIsLoadingInvoice(false)
        }
      }
      loadExisting()
    }
  }, [invoiceId, isNew, getAccessToken])

  // Load customers from database
  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoadingCustomers(true)
      try {
        let token = ''
        try { if (getAccessToken) token = await getAccessToken() } catch (_) {}
        const tenantId = await getActiveTenantId()
        const list = await fetchCustomersFromBackend(token, undefined, tenantId)
        if (Array.isArray(list)) {
          setAvailableCustomers(list)
        } else {
          setAvailableCustomers([])
        }
      } catch (err) {
        console.warn('Could not fetch customers from database:', err)
        setAvailableCustomers([])
      } finally {
        setIsLoadingCustomers(false)
      }
    }
    loadCustomers()
  }, [getAccessToken, getActiveTenantId])

  // Load product catalog from backend for line item dropdown
  useEffect(() => {
    const loadProducts = async () => {
      try {
        let token = ''
        try { if (getAccessToken) token = await getAccessToken() } catch (_) {}
        const tenantId = await getActiveTenantId()
        const list = await fetchProductsFromBackend(token, undefined, tenantId)
        if (Array.isArray(list)) {
          setAvailableProducts(list)
        }
      } catch (err) {
        console.warn('Could not fetch product catalog for invoice items:', err)
      }
    }
    loadProducts()
  }, [getAccessToken, getActiveTenantId])

  const selectedCustomer = availableCustomers.find((c) => c.id === customerId)

  const handleSelectCustomer = (c: Customer) => {
    setCustomerId(c.id)
    setCustomerName(c.name)
    setCustomerEmail(c.email)
    setCustomerDropOpen(false)
  }

  const { subtotal, taxTotal, grandTotal } = calculateInvoiceTotals(items)

  const addItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 10,
      },
    ])
  }

  const removeItem = (id: string) => {
    if (items.length === 1) return
    setItems(items.filter((i) => i.id !== id))
  }

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleProductSelect = (itemId: string, productOrId: Product | string) => {
    let product: any = productOrId
    if (typeof productOrId === 'string') {
      const found = availableProducts.find((p) => p.id === productOrId || p.name === productOrId)
      if (found) product = found
      else product = { name: productOrId, unitPrice: 0 }
    }
    if (!product) return

    const pName =
      (typeof product === 'string'
        ? product
        : (product.name || product.description || 'Product'))
    const pPrice = Number(
      product.unitPrice !== undefined
        ? product.unitPrice
        : (product.price !== undefined ? product.price : 0)
    )
    const pTax = Number(product.taxRate !== undefined ? product.taxRate : 10)

    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              description: pName,
              unitPrice: pPrice,
              taxRate: pTax,
            }
          : item
      )
    )
    setProductDrop(null)
    setProductSearch('')
  }

  /**
   * Send Invoice Action:
   * Calls POST https://localhost:8243/api/invoices/1.0.0
   * Backend generates PDF and emails the customer automatically!
   */
  const handleSendInvoice = async () => {
    const targetEmail = customerEmail || selectedCustomer?.email
    const targetName = customerName || selectedCustomer?.name

    if (!targetName) {
      toast.error('Please select or specify a Customer name.')
      return
    }
    if (!targetEmail) {
      toast.error('Please provide a valid Customer Email address for PDF dispatch.')
      return
    }
    if (items.length === 0 || !items[0].description) {
      toast.error('Please add at least one line item with a description.')
      return
    }

    setIsSending(true)

    try {
      let token = ''
      try { if (getAccessToken) token = await getAccessToken() } catch (_) {}

      const payload = {
        number: invoiceNumber,
        customerId: customerId || '1',
        customerName: targetName,
        customerEmail: targetEmail,
        creatorEmail: currentUser?.email || '',
        status: 'SENT',
        issueDate,
        dueDate,
        notes,
        currency: 'USD',
        subtotal,
        taxTotal,
        grandTotal,
        items: items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          taxRate: Number(it.taxRate) || 0,
        })),
      }

      await createAndSendInvoiceInBackend(payload, token)
      setStatus('Sent')

      toast.success(`Invoice ${invoiceNumber} sent successfully!`, {
        description: `Generated PDF attached and emailed to ${targetEmail}.`,
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      })

      setTimeout(() => {
        navigate(`/${tenantSlug}/invoices`)
      }, 1200)
    } catch (err: any) {
      console.error('Failed to send invoice:', err)
      toast.error(`Failed to send invoice ${invoiceNumber}`, {
        description: err?.message || 'Check backend and WSO2 Gateway connection.',
      })
    } finally {
      setIsSending(false)
    }
  }

  /**
   * Save Draft Action
   */
  const handleSaveDraft = async () => {
    const targetName = customerName || selectedCustomer?.name || 'Direct Client'
    const targetEmail = customerEmail || selectedCustomer?.email || 'billing@customer.com'

    setIsSaving(true)

    try {
      let token = ''
      try { if (getAccessToken) token = await getAccessToken() } catch (_) {}

      const payload = {
        number: invoiceNumber,
        customerId: customerId || '1',
        customerName: targetName,
        customerEmail: targetEmail,
        creatorEmail: currentUser?.email || '',
        status: 'DRAFT',
        issueDate,
        dueDate,
        notes,
        currency: 'USD',
        subtotal,
        taxTotal,
        grandTotal,
        items: items.map((it) => ({
          description: it.description || 'Service',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          taxRate: Number(it.taxRate) || 0,
        })),
      }

      await createAndSendInvoiceInBackend(payload, token)
      setStatus('Draft')
      toast.success(`Draft saved for ${invoiceNumber}`)
    } catch (err: any) {
      console.error('Failed to save draft:', err)
      toast.error('Draft saved locally (Backend notification)', {
        description: err?.message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Preview / Download PDF
   */
  const handlePreviewPdf = async () => {
    if (!isNew && invoiceId) {
      setIsPreviewing(true)
      try {
        let token = ''
        try { if (getAccessToken) token = await getAccessToken() } catch (_) {}

        await downloadInvoicePdfFromBackend(invoiceId, invoiceNumber, token)
        toast.success(`Downloaded ${invoiceNumber}.pdf`)
      } catch (err: any) {
        toast.error('Unable to fetch PDF for preview', { description: err.message })
      } finally {
        setIsPreviewing(false)
      }
    } else {
      toast.info('Save or Send the invoice first to generate the official PDF record.')
    }
  }

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-xl'
    : 'bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-black/5'

  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.06] border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-white/[0.08]'
      : 'bg-black/[0.03] border-black/[0.06] text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white/80'
  } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`

  const statusCfg = STATUS_COLORS[status] || STATUS_COLORS.Draft

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      <Toaster position="top-right" theme={isDark ? 'dark' : 'light'} richColors />

      {/* Back + header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-white/[0.08] hover:bg-white/[0.06] text-slate-400'
                : 'border-black/[0.07] hover:bg-black/[0.04] text-slate-500'
            }`}
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div>
            <h1
              className={`text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}
              style={{ fontWeight: 700, letterSpacing: '-0.03em' }}
            >
              {isNew ? 'Create & Send Invoice' : `Edit ${invoiceNumber}`}
            </h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              API Gateway Target: <code className="text-indigo-400">{DIRECT_INVOICE_BASE_URL}</code>
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${statusCfg.bg} ${statusCfg.border}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
            <span className={`text-sm ${statusCfg.text}`} style={{ fontWeight: 600 }}>
              {status}
            </span>
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
                <label
                  className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                  style={{ fontWeight: 600 }}
                >
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
              <div className="relative customer-dropdown-container">
                <label
                  className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                  style={{ fontWeight: 600 }}
                >
                  Customer
                </label>
                <div className="relative">
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => canEdit && setCustomerDropOpen(!customerDropOpen)}
                    className={`${inputClass} flex items-center justify-between text-left ${customerName ? 'pr-8' : ''}`}
                  >
                    <span className={!customerName && !selectedCustomer ? (isDark ? 'text-slate-600' : 'text-slate-400') : 'truncate'}>
                      {customerName || selectedCustomer?.name || 'Select customer from database...'}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`${isDark ? 'text-slate-500' : 'text-slate-400'} flex-shrink-0 ${
                        customerDropOpen ? 'rotate-180' : ''
                      } transition-transform`}
                    />
                  </button>
                  {customerName && canEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCustomerId('')
                        setCustomerName('')
                        setCustomerEmail('')
                      }}
                      className="absolute right-7 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="Clear customer selection"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {customerDropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.13 }}
                      style={{ zIndex: 600 }}
                      className={`absolute top-full left-0 mt-1 w-full rounded-xl border shadow-2xl overflow-hidden ${
                        isDark
                          ? 'bg-slate-900/98 backdrop-blur-xl border-white/[0.12] shadow-black/60'
                          : 'bg-white/98 backdrop-blur-xl border-black/[0.08] shadow-black/15'
                      }`}
                    >
                      {/* Search box */}
                      <div className={`p-2 border-b flex items-center gap-2 ${isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.06] bg-slate-50/50'}`}>
                        <Search size={13} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                        <input
                          type="text"
                          placeholder="Search database customers..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className={`w-full text-xs bg-transparent outline-none ${
                            isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-700 placeholder:text-slate-400'
                          }`}
                        />
                        {customerSearch && (
                          <button type="button" onClick={() => setCustomerSearch('')}>
                            <X size={12} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                          </button>
                        )}
                      </div>

                      <div className="max-h-56 overflow-y-auto">
                        {isLoadingCustomers ? (
                          <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin text-indigo-500" />
                            Loading customers from database...
                          </div>
                        ) : availableCustomers.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                            <p className="font-semibold">No customers found in database</p>
                            <p className="text-[11px] opacity-75">You can enter customer name and email manually below.</p>
                          </div>
                        ) : availableCustomers.filter((c) =>
                            (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
                            (c.email || '').toLowerCase().includes(customerSearch.toLowerCase())
                          ).length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                            <p>No customers matching "{customerSearch}"</p>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomerName(customerSearch)
                                setCustomerId('')
                                setCustomerDropOpen(false)
                              }}
                              className="text-xs text-indigo-500 hover:underline font-semibold"
                            >
                              Use "{customerSearch}" as custom name
                            </button>
                          </div>
                        ) : (
                          availableCustomers
                            .filter((c) =>
                              (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
                              (c.email || '').toLowerCase().includes(customerSearch.toLowerCase())
                            )
                            .map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectCustomer(c)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                  isDark ? 'hover:bg-white/[0.06] text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                                } ${
                                  customerId === c.id
                                    ? isDark
                                      ? 'bg-indigo-900/30 text-indigo-300'
                                      : 'bg-indigo-50 text-indigo-700'
                                    : ''
                                }`}
                              >
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                                    isDark ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                                  }`}
                                  style={{ fontWeight: 700 }}
                                >
                                  {(c.name || 'C')[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm truncate" style={{ fontWeight: 500 }}>
                                    {c.name}
                                  </p>
                                  <p className={`text-[11px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{c.email}</p>
                                </div>
                              </button>
                            ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Customer Email Dispatch Input */}
              <div className="sm:col-span-2">
                <label
                  className={`text-xs mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                  style={{ fontWeight: 600 }}
                >
                  <Mail size={13} className="text-indigo-500" />
                  <span>Customer Email (PDF Delivery Destination)</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. finance@customer.com"
                  disabled={!canEdit}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                  style={{ fontWeight: 600 }}
                >
                  Issue Date
                </label>
                <DatePicker value={issueDate} onChange={setIssueDate} isDark={isDark} disabled={!canEdit} />
              </div>

              <div>
                <label
                  className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                  style={{ fontWeight: 600 }}
                >
                  Due Date
                </label>
                <DatePicker value={dueDate} onChange={setDueDate} isDark={isDark} disabled={!canEdit} />
              </div>
            </div>
          </motion.div>

          {/* Line items table */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ position: 'relative', zIndex: productDrop ? 30 : 1 }}
            className={`${glass} rounded-2xl p-5`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                <h2 className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
                  Items & Services
                </h2>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={addItem}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-400 border-indigo-700/30'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200/60'
                  }`}
                >
                  <Plus size={13} />
                  Add Item
                </button>
              )}
            </div>

            <div className="overflow-visible space-y-2">
              <div
                className={`grid grid-cols-12 gap-2 text-[11px] pb-2 border-b uppercase tracking-wider ${
                  isDark ? 'border-white/[0.06] text-slate-500' : 'border-black/[0.05] text-slate-400'
                }`}
                style={{ fontWeight: 600 }}
              >
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-1 text-center">Tax%</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              <AnimatePresence>
                {items.map((item, index) => {
                  const lineSubtotal = item.quantity * item.unitPrice
                  const lineTax = (lineSubtotal * item.taxRate) / 100
                  const isDropOpen = productDrop === item.id
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-12 gap-2 items-center pt-1 relative"
                      style={{ zIndex: isDropOpen ? 50 : 20 - index }}
                    >
                      <div className={`col-span-5 relative product-dropdown-container ${isDropOpen ? 'z-50' : 'z-10'}`}>
                        <div className="relative flex items-center">
                          <input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            onFocus={() => {
                              if (availableProducts.length > 0) setProductDrop(item.id)
                            }}
                            placeholder="Item or service description"
                            disabled={!canEdit}
                            className={`${inputClass} text-xs py-2 w-full pr-8`}
                          />
                          {canEdit && availableProducts.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setProductDrop(isDropOpen ? null : item.id)
                              }}
                              className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              title="Pick product from catalog"
                            >
                              <ChevronDown size={14} className={isDropOpen ? 'rotate-180' : ''} />
                            </button>
                          )}
                        </div>

                        {/* Product autocompletion dropdown */}
                        <AnimatePresence>
                          {isDropOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.98 }}
                              transition={{ duration: 0.12 }}
                              className={`absolute top-full left-0 mt-1 w-80 rounded-xl border shadow-2xl p-2 max-h-60 overflow-y-auto ${
                                isDark ? 'bg-slate-900/98 border-white/10' : 'bg-white/98 border-black/10 shadow-black/10'
                              }`}
                              style={{ zIndex: 700 }}
                            >
                              {availableProducts.length > 4 && (
                                <div className={`p-1.5 mb-2 border-b flex items-center gap-1.5 ${isDark ? 'border-white/10' : 'border-black/5'}`}>
                                  <Search size={12} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                  <input
                                    type="text"
                                    placeholder="Filter catalog..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`w-full text-xs bg-transparent outline-none ${
                                      isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'
                                    }`}
                                  />
                                  {productSearch && (
                                    <button type="button" onClick={() => setProductSearch('')}>
                                      <X size={11} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                                    </button>
                                  )}
                                </div>
                              )}

                              <div className="space-y-1">
                                {availableProducts
                                  .filter((p) => {
                                    if (!productSearch.trim()) return true
                                    const q = productSearch.toLowerCase()
                                    const name = (p.name || p.description || '').toLowerCase()
                                    const sku = (p.sku || '').toLowerCase()
                                    return name.includes(q) || sku.includes(q)
                                  })
                                  .map((p, pIdx) => {
                                    const pName = p.name || p.description || `Catalog Item #${pIdx + 1}`
                                    const pSku = p.sku || ''
                                    const pPrice = Number(p.unitPrice !== undefined ? p.unitPrice : (p.price !== undefined ? p.price : 0))
                                    const pUnit = p.unitOfMeasure || p.unit || 'UNIT'
                                    const pDesc = p.description && p.description !== pName ? p.description : ''

                                    return (
                                      <button
                                        key={p.id || pIdx}
                                        type="button"
                                        onClick={() => handleProductSelect(item.id, p)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer border ${
                                          isDark
                                            ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-indigo-500/40 text-slate-200'
                                            : 'bg-slate-50 hover:bg-indigo-50/80 border-slate-200/80 hover:border-indigo-200 text-slate-800'
                                        }`}
                                      >
                                        <div className="truncate mr-3 flex-1">
                                          <div className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-indigo-500 transition-colors`}>
                                            {pName}
                                          </div>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            {pSku && (
                                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                                                isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200/80 text-slate-700'
                                              }`}>
                                                {pSku}
                                              </span>
                                            )}
                                            {pDesc && (
                                              <span className={`text-[10px] truncate max-w-[180px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {pDesc}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                          <div className="font-extrabold text-xs text-indigo-500">${pPrice.toFixed(2)}</div>
                                          <div className={`text-[9px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{pUnit}</div>
                                        </div>
                                      </button>
                                    )
                                  })}
                              </div>

                              {availableProducts.filter((p) => {
                                if (!productSearch.trim()) return true
                                const q = productSearch.toLowerCase()
                                const name = (p.name || p.description || '').toLowerCase()
                                const sku = (p.sku || '').toLowerCase()
                                return name.includes(q) || sku.includes(q)
                              }).length === 0 && (
                                <div className="p-3 text-center text-xs text-slate-400">
                                  No matching items for "{productSearch}"
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          disabled={!canEdit}
                          min="1"
                          className={`${inputClass} text-xs py-2 text-center`}
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          disabled={!canEdit}
                          min="0"
                          step="0.01"
                          className={`${inputClass} text-xs py-2 text-center`}
                        />
                      </div>

                      <div className="col-span-1">
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

                      <div className="col-span-2 flex items-center justify-end gap-1.5">
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          ${(lineSubtotal + lineTax).toFixed(2)}
                        </span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              items.length === 1
                                ? 'opacity-30 cursor-not-allowed'
                                : isDark
                                  ? 'hover:bg-red-900/30 text-slate-500 hover:text-red-400'
                                  : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                            }`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ position: 'relative', zIndex: 1 }}
            className={`${glass} rounded-2xl p-5`}
          >
            <label
              className={`text-xs mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              style={{ fontWeight: 600 }}
            >
              Notes & Terms
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canEdit}
              placeholder="Payment terms, bank transfer details, or thank you note..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </motion.div>
        </div>

        {/* Right side calculation & Actions */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className={`${glass} rounded-2xl p-5 space-y-3`}
          >
            <h2 className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
              Summary
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tax Total</span>
                <span className="font-semibold">${taxTotal.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08] flex justify-between items-end text-sm font-bold">
                <span>Grand Total:</span>
                <span className="text-xl text-indigo-500 font-extrabold font-mono">${grandTotal.toFixed(2)} USD</span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className={`${glass} rounded-2xl p-4 space-y-2.5`}
          >
            <h2 className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
              Actions
            </h2>

            {canEdit ? (
              <>
                {/* Primary Action: Send Invoice */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendInvoice}
                  disabled={isSending}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white shadow-lg transition-all bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:opacity-95 shadow-indigo-500/30 disabled:opacity-60 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending & Dispatching Email...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Send Invoice (Email PDF)</span>
                    </>
                  )}
                </motion.button>

                {/* Secondary Action: Save Draft */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isDark
                      ? 'border-white/[0.1] hover:bg-white/[0.06] text-slate-200'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save size={14} />}
                  <span>Save Draft</span>
                </motion.button>

                {/* Preview PDF */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePreviewPdf}
                  disabled={isPreviewing}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isDark
                      ? 'border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {isPreviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown size={14} />}
                  <span>Download / Preview PDF</span>
                </motion.button>
              </>
            ) : (
              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500 text-xs text-center">
                Viewers cannot edit or send invoices
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
