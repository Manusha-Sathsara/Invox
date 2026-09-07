import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Package, Plus, Search, Tag, Percent, Edit3, Trash2, X,
  ChevronDown, Check, Barcode, Globe, Loader2, RefreshCw, AlertTriangle
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import type { Product } from '../App'
import { useApp } from '../context/AppContext'
import {
  fetchProductsFromBackend,
  createProductInBackend,
  updateProductInBackend,
  deleteProductInBackend,
} from '../services/productService'

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
  { code: 'LKR', symbol: 'Rs', label: 'LKR (Rs)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
]

const UNIT_MEASURE_OPTIONS = [
  'UNIT',
  'PCS',
  'HOUR',
  'DAY',
  'MONTH',
  'PROJECT',
  'SEAT',
  'LICENSE',
  'KG',
  'ITEM',
  'PACK',
]

const CATEGORY_COLORS: Record<string, string> = {
  PROJECT: 'from-violet-500 to-purple-600',
  MONTH: 'from-blue-500 to-cyan-600',
  HOUR: 'from-emerald-500 to-teal-600',
  DAY: 'from-amber-400 to-orange-500',
  UNIT: 'from-rose-500 to-pink-600',
  PCS: 'from-pink-500 to-rose-600',
  SEAT: 'from-indigo-500 to-blue-600',
  LICENSE: 'from-slate-500 to-slate-600',
  ITEM: 'from-teal-500 to-emerald-600',
}

function generateSkuFromName(str: string): string {
  if (!str.trim()) return ''
  return str
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function AddProductModal({
  isDark,
  initialData,
  onClose,
  onAdd,
}: {
  isDark: boolean
  initialData?: Product | null
  onClose: () => void
  onAdd: (p: Product) => Promise<void>
}) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [sku, setSku] = useState(initialData?.sku ?? '')
  const [unitPrice, setUnitPrice] = useState(
    initialData?.unitPrice !== undefined ? String(initialData.unitPrice) : (initialData?.price !== undefined ? String(initialData.price) : '')
  )
  const [currency, setCurrency] = useState(initialData?.currency ?? 'USD')
  const [taxRate, setTaxRate] = useState(initialData?.taxRate !== undefined ? String(initialData.taxRate) : '8.25')
  const [unitOfMeasure, setUnitOfMeasure] = useState(initialData?.unitOfMeasure ?? initialData?.unit ?? 'UNIT')

  const [skuEdited, setSkuEdited] = useState(Boolean(initialData?.sku))
  const [unitOpen, setUnitOpen] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const glass = isDark
    ? 'bg-slate-900/98 backdrop-blur-2xl border border-white/[0.1]'
    : 'bg-white/98 backdrop-blur-2xl border border-black/[0.08]'

  const inputClass = `w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.06] border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:bg-white/[0.09]'
      : 'bg-black/[0.03] border-black/[0.06] text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white'
  }`

  const handleNameChange = (val: string) => {
    setName(val)
    setErrors(p => ({ ...p, name: '' }))
    if (!skuEdited) {
      setSku(generateSkuFromName(val))
    }
  }

  const handleSkuChange = (val: string) => {
    setSku(val.toUpperCase())
    setSkuEdited(true)
    setErrors(p => ({ ...p, sku: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Product name is required'
    if (!unitPrice || isNaN(Number(unitPrice)) || Number(unitPrice) < 0) {
      e.unitPrice = 'Valid unit price is required (>= 0)'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const p: Product = {
        id: initialData?.id || '',
        name: name.trim(),
        description: description.trim() || undefined,
        sku: (sku.trim() || generateSkuFromName(name)).toUpperCase(),
        unitPrice: Number(unitPrice),
        currency: currency.trim() || 'USD',
        taxRate: Number(taxRate) || 0,
        unitOfMeasure: unitOfMeasure.toUpperCase(),
        active: initialData?.active ?? true,
      }
      await onAdd(p)
      onClose()
    } catch (_) {
      // handled in parent
    } finally {
      setSubmitting(false)
    }
  }

  const currentCurrencySymbol = CURRENCY_OPTIONS.find(c => c.code === currency)?.symbol || '$'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 700 }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${glass}`}
        style={{ zIndex: 710 }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/[0.07]' : 'border-black/[0.06]'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Package size={15} className="text-white" />
            </div>
            <div>
              <h2 className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700 }}>
                {initialData ? 'Edit Product Item' : 'New Product Item'}
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {initialData ? `SKU: ${initialData.sku}` : 'Synced with backend catalog'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
              Product Name *
            </label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Enterprise SLA Monthly"
              className={`${inputClass} ${errors.name ? 'border-red-400/60' : ''}`}
            />
            {errors.name && <p className="text-red-400 text-[11px] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of product or service..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
              SKU (Stock Keeping Unit)
            </label>
            <div className="relative">
              <Barcode size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                value={sku}
                onChange={(e) => handleSkuChange(e.target.value)}
                placeholder="SKU-AUTO-GEN"
                className={`${inputClass} pl-9 font-mono uppercase text-xs`}
              />
            </div>
          </div>

          {/* Unit Price & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
                Unit Price *
              </label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {currentCurrencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => { setUnitPrice(e.target.value); setErrors(p => ({ ...p, unitPrice: '' })) }}
                  placeholder="1299.99"
                  className={`${inputClass} pl-8 ${errors.unitPrice ? 'border-red-400/60' : ''}`}
                />
              </div>
              {errors.unitPrice && <p className="text-red-400 text-[11px] mt-1">{errors.unitPrice}</p>}
            </div>

            {/* Currency Dropdown */}
            <div className="relative">
              <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
                Currency
              </label>
              <button
                type="button"
                onClick={() => { setCurrencyOpen(!currencyOpen); setUnitOpen(false) }}
                className={`${inputClass} flex items-center justify-between`}
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <Globe size={13} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                  {currency} ({currentCurrencySymbol})
                </span>
                <ChevronDown size={14} className={`${isDark ? 'text-slate-500' : 'text-slate-400'} transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {currencyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className={`absolute top-full left-0 mt-1 w-full rounded-xl border shadow-2xl overflow-hidden max-h-48 overflow-y-auto ${
                      isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-black/10'
                    }`}
                    style={{ zIndex: 730 }}
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { setCurrency(c.code); setCurrencyOpen(false) }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                          isDark ? 'hover:bg-white/[0.06] text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                        } ${currency === c.code ? (isDark ? 'text-indigo-400 bg-white/[0.04]' : 'text-indigo-600 bg-indigo-50/50') : ''}`}
                      >
                        <span>{c.label}</span>
                        {currency === c.code && <Check size={13} className="text-indigo-500" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Tax Rate & Unit of Measure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
                Tax Rate (%)
              </label>
              <div className="relative">
                <Percent size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="8.25"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            {/* Unit of Measure Dropdown */}
            <div className="relative">
              <label className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
                Unit of Measure
              </label>
              <button
                type="button"
                onClick={() => { setUnitOpen(!unitOpen); setCurrencyOpen(false) }}
                className={`${inputClass} flex items-center justify-between`}
              >
                <span className="font-medium tracking-wide">{unitOfMeasure}</span>
                <ChevronDown size={14} className={`${isDark ? 'text-slate-500' : 'text-slate-400'} transition-transform ${unitOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {unitOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className={`absolute top-full left-0 mt-1 w-full rounded-xl border shadow-2xl overflow-hidden max-h-48 overflow-y-auto ${
                      isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-black/10'
                    }`}
                    style={{ zIndex: 730 }}
                  >
                    {UNIT_MEASURE_OPTIONS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => { setUnitOfMeasure(u); setUnitOpen(false) }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                          isDark ? 'hover:bg-white/[0.06] text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                        } ${unitOfMeasure === u ? (isDark ? 'text-indigo-400 bg-white/[0.04]' : 'text-indigo-600 bg-indigo-50/50') : ''}`}
                      >
                        <span>{u}</span>
                        {unitOfMeasure === u && <Check size={13} className="text-indigo-500" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-2 px-5 py-4 border-t ${isDark ? 'border-white/[0.07]' : 'border-black/[0.06]'}`}>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
              isDark ? 'border-white/[0.1] text-slate-400 hover:bg-white/[0.05]' : 'border-black/[0.08] text-slate-600 hover:bg-black/[0.03]'
            }`}
            style={{ fontWeight: 500 }}
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={submitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 600 }}
          >
            {submitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : initialData ? (
              <Check size={15} />
            ) : (
              <Plus size={15} />
            )}
            {initialData ? 'Save Changes' : 'Create Product'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function ProductsView() {
  const { isDark, currentUser, getAccessToken, getDecodedIdToken, currentTenant } = useApp()

  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Backend connection states
  const [loadingBackend, setLoadingBackend] = useState(true)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [backendError, setBackendError] = useState<string | null>(null)

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

  const loadBackendProducts = useCallback(async () => {
    setLoadingBackend(true)
    setBackendError(null)
    try {
      let token = ''
      try { if (getAccessToken) token = await getAccessToken() } catch (_) {}
      const tenantId = await getActiveTenantId()

      const fetched = await fetchProductsFromBackend(token, undefined, tenantId)
      if (Array.isArray(fetched)) {
        setProducts(fetched)
        setBackendConnected(true)
      } else {
        setProducts([])
        setBackendConnected(true)
      }
    } catch (err: any) {
      console.warn('Product Service backend connection error:', err)
      setBackendConnected(false)
      setBackendError(err.message || 'Connection failed')
      setProducts([])
    } finally {
      setLoadingBackend(false)
    }
  }, [getAccessToken, getActiveTenantId])

  useEffect(() => {
    loadBackendProducts()
  }, [loadBackendProducts])

  const filtered = products.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.unitOfMeasure && p.unitOfMeasure.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAddOrEdit = async (p: Product) => {
    const isEdit = Boolean(p.id && products.some(item => item.id === p.id))
    try {
      let token = ''
      try { if (getAccessToken) token = await getAccessToken() } catch (_) {}
      const tenantId = await getActiveTenantId()

      let saved: Product

      if (isEdit) {
        saved = await updateProductInBackend(p.id, p, token, undefined, tenantId)
      } else {
        const { id, ...createBody } = p
        saved = await createProductInBackend(createBody, token, undefined, tenantId)
      }

      setProducts(prev => {
        const exists = prev.some(item => item.id === saved.id)
        return exists
          ? prev.map(item => item.id === saved.id ? saved : item)
          : [saved, ...prev]
      })

      setBackendConnected(true)
      toast.success(isEdit ? `"${saved.name}" updated` : `"${saved.name}" created`, {
        description: saved.sku ? `SKU: ${saved.sku}` : 'Product item synced to backend.',
        icon: '🎉',
      })
    } catch (err: any) {
      console.error('Product save error:', err)
      if (isEdit) {
        setProducts(prev => prev.map(item => item.id === p.id ? p : item))
        toast.warning(`Updated locally (${err.message})`)
      } else {
        const localProduct = { ...p, id: p.id || String(Date.now()) }
        setProducts(prev => [localProduct, ...prev])
        toast.warning(`Saved locally (${err.message})`)
      }
    }
  }

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id)
    try {
      let token = ''
      try { if (getAccessToken) token = await getAccessToken() } catch (_) {}
      const tenantId = await getActiveTenantId()

      await deleteProductInBackend(id, token, undefined, tenantId)
      setProducts(prev => prev.filter(p => p.id !== id))
      toast.success(`"${name}" removed from catalog`)
    } catch (err: any) {
      console.error('Product delete error:', err)
      setProducts(prev => prev.filter(p => p.id !== id))
      toast.warning(`Deleted locally (${err.message})`)
    } finally {
      setDeletingId(null)
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
              Products & Services
            </h1>
            {backendConnected === true && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Database
              </span>
            )}
            {backendConnected === false && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Offline Mode
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {products.length} line items configured in catalog
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadBackendProducts}
            disabled={loadingBackend}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-white/[0.08] hover:bg-white/[0.06] text-slate-400'
                : 'border-black/[0.07] hover:bg-black/[0.04] text-slate-500'
            }`}
            title="Reload from backend"
          >
            <RefreshCw size={15} className={loadingBackend ? 'animate-spin text-indigo-500' : ''} />
          </button>

          {canEdit && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setEditingProduct(null); setShowModal(true) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white shadow-lg shadow-indigo-500/25 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 600 }}
            >
              <Plus size={16} />
              Add Product
            </motion.button>
          )}
        </div>
      </div>

      {backendError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle size={14} /> Backend sync notice: {backendError}
          </span>
          <button onClick={loadBackendProducts} className="underline hover:text-amber-400 font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className={`${glass} rounded-2xl p-3 flex items-center gap-3`}>
        <div className="relative flex-1">
          <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product title, SKU code, or category..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm border outline-none transition-all ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.07] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50'
                : 'bg-black/[0.02] border-black/[0.06] text-slate-800 placeholder:text-slate-400 focus:border-indigo-500/50 focus:bg-white'
            }`}
          />
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-lg ${isDark ? 'bg-white/[0.05] text-slate-400' : 'bg-black/[0.04] text-slate-500'}`}>
          {filtered.length} of {products.length}
        </span>
      </div>

      {/* Products Grid */}
      {loadingBackend && products.length === 0 ? (
        <div className={`${glass} rounded-2xl py-16 text-center`}>
          <Loader2 size={24} className="animate-spin text-indigo-500 mx-auto mb-2" />
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading catalog items from database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${glass} rounded-2xl py-16 text-center`}>
          <Package size={32} className={`mx-auto mb-2.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
            {search ? 'No matching products' : 'No products in catalog yet'}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {search ? 'Try adjusting your search terms.' : 'Create your first product or service item.'}
          </p>
          {canEdit && !search && (
            <button
              onClick={() => { setEditingProduct(null); setShowModal(true) }}
              className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <Plus size={14} /> Add First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p, i) => {
            const unit = (p.unitOfMeasure || p.unit || 'UNIT').toUpperCase()
            const categoryGradient = CATEGORY_COLORS[unit] || 'from-indigo-500 to-purple-600'
            const price = Number(p.unitPrice !== undefined ? p.unitPrice : (p.price !== undefined ? p.price : 0))

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`${glass} rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${categoryGradient} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                        <Tag size={14} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isDark ? 'bg-white/[0.08] text-slate-300' : 'bg-black/[0.05] text-slate-600'
                      }`}>
                        {unit}
                      </span>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingProduct(p); setShowModal(true) }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'
                          }`}
                          title="Edit Product"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deletingId === p.id}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer text-red-400 ${
                            isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                          }`}
                          title="Delete Product"
                        >
                          {deletingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700 }}>
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className={`text-xs line-clamp-2 mb-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {p.description}
                    </p>
                  )}
                  {p.sku && (
                    <p className="font-mono text-[10px] tracking-wider text-indigo-400 mb-3 uppercase">
                      SKU: {p.sku}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
                  <div>
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-xs ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      / {unit.toLowerCase()}
                    </span>
                  </div>

                  {p.taxRate !== undefined && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-black/[0.04] text-slate-600'
                    }`}>
                      {p.taxRate}% Tax
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {showModal && (
          <AddProductModal
            isDark={isDark}
            initialData={editingProduct}
            onClose={() => { setShowModal(false); setEditingProduct(null) }}
            onAdd={handleAddOrEdit}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
