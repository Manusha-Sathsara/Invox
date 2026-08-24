import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Package, Plus, Search, Tag, Percent, Edit3, Trash2, X,
  ChevronDown, Check, DollarSign,
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { PRODUCTS as INITIAL_PRODUCTS } from '../App'
import { useApp } from '../context/AppContext'

const UNIT_OPTIONS = ['hour', 'day', 'month', 'project', 'unit', 'seat', 'license']

const CATEGORY_COLORS: Record<string, string> = {
  project: 'from-violet-500 to-purple-600',
  month: 'from-blue-500 to-cyan-600',
  hour: 'from-emerald-500 to-teal-600',
  day: 'from-amber-400 to-orange-500',
  unit: 'from-rose-500 to-pink-600',
  seat: 'from-indigo-500 to-blue-600',
  license: 'from-slate-500 to-slate-600',
}

function AddProductModal({
  isDark,
  onClose,
  onAdd,
}: {
  isDark: boolean
  onClose: () => void
  onAdd: (p: typeof INITIAL_PRODUCTS[0]) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('hour')
  const [taxRate, setTaxRate] = useState('10')
  const [unitOpen, setUnitOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const glass = isDark
    ? 'bg-slate-900/98 backdrop-blur-2xl border border-white/[0.1]'
    : 'bg-white/98 backdrop-blur-2xl border border-black/[0.08]'

  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.06] border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:bg-white/[0.09]'
      : 'bg-black/[0.03] border-black/[0.06] text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white'
  }`

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!price || isNaN(Number(price)) || Number(price) <= 0) e.price = 'Valid price is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onAdd({
      id: String(Date.now()),
      name: name.trim(),
      description: description.trim() || name.trim(),
      price: parseFloat(price),
      unit,
      taxRate: parseFloat(taxRate) || 0,
    })
    onClose()
  }

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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`relative w-full max-w-md rounded-2xl shadow-2xl ${glass}`}
        style={{ zIndex: 710 }}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/[0.07]' : 'border-black/[0.06]'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Package size={15} className="text-white" />
            </div>
            <div>
              <h2 className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700 }}>Add Product / Service</h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Add an item to your catalog</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
              Product / Service Name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
              placeholder="e.g. Development Hours"
              className={`${inputClass} ${errors.name ? 'border-red-400/60' : ''}`}
            />
            {errors.name && <p className="text-red-400 text-[11px] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of the item"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); setErrors(p => ({ ...p, price: '' })) }}
                  placeholder="0.00"
                  className={`${inputClass} pl-9 ${errors.price ? 'border-red-400/60' : ''}`}
                />
              </div>
              {errors.price && <p className="text-red-400 text-[11px] mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>Tax Rate %</label>
              <div className="relative">
                <Percent size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
          </div>

          <div className="relative">
            <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>Billing Unit</label>
            <button
              type="button"
              onClick={() => setUnitOpen(!unitOpen)}
              className={`${inputClass} flex items-center justify-between`}
            >
              <span className="capitalize">{unit}</span>
              <ChevronDown size={14} className={`${isDark ? 'text-slate-500' : 'text-slate-400'} transition-transform ${unitOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {unitOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className={`absolute top-full left-0 mt-1 w-full rounded-xl border shadow-xl overflow-hidden ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-black/10'}`}
                  style={{ zIndex: 720 }}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <button
                      key={u}
                      onClick={() => { setUnit(u); setUnitOpen(false) }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm capitalize transition-colors ${
                        isDark ? 'hover:bg-white/[0.06] text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                      } ${unit === u ? isDark ? 'text-indigo-400' : 'text-indigo-600' : ''}`}
                    >
                      {u}
                      {unit === u && <Check size={13} className="text-indigo-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live preview */}
          {name && price && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`p-3.5 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-indigo-50/50 border-indigo-100'}`}
            >
              <p className={`text-[11px] mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} style={{ fontWeight: 600 }}>PREVIEW</p>
              <div className="flex items-center justify-between">
                <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>{name}</p>
                <div className="text-right">
                  <p className="text-indigo-500 text-sm" style={{ fontWeight: 800 }}>
                    ${parseFloat(price || '0').toLocaleString()} / {unit}
                  </p>
                  {parseFloat(taxRate) > 0 && (
                    <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>+{taxRate}% tax</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className={`flex items-center justify-end gap-2 px-5 py-4 border-t ${isDark ? 'border-white/[0.07]' : 'border-black/[0.06]'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm border transition-colors ${isDark ? 'border-white/[0.1] text-slate-400 hover:bg-white/[0.05]' : 'border-black/[0.08] text-slate-600 hover:bg-black/[0.03]'}`}
            style={{ fontWeight: 500 }}
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm text-white shadow-lg shadow-violet-500/25"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', fontWeight: 600 }}
          >
            <Package size={15} />
            Add Product
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function ProductsView() {
  const { isDark, currentUser } = useApp()
  const [products, setProducts] = useState(INITIAL_PRODUCTS)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const canEdit = currentUser.role !== 'Viewer'

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (p: typeof INITIAL_PRODUCTS[0]) => {
    setProducts(prev => [p, ...prev])
    toast.success(`"${p.name}" added to catalog`, {
      description: `$${p.price} / ${p.unit}`,
      icon: '📦',
    })
  }

  const handleDelete = (id: string, name: string) => {
    setDeletingId(id)
    setTimeout(() => {
      setProducts(prev => prev.filter(p => p.id !== id))
      setDeletingId(null)
      toast.error(`"${name}" removed from catalog`)
    }, 300)
  }

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-xl'
    : 'bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-black/5'

  return (
    <>
      <Toaster position="bottom-right" theme={isDark ? 'dark' : 'light'} richColors />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className={`text-xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
              Products & Services
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{products.length} items in catalog</p>
          </div>
          {canEdit ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white shadow-lg shadow-violet-500/25"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', fontWeight: 600 }}
            >
              <Plus size={16} />
              Add Product
            </motion.button>
          ) : (
            <div className="relative group">
              <button disabled className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-not-allowed opacity-40 ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500'}`} style={{ fontWeight: 600 }}>
                <Plus size={16} /> Add Product
              </button>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={`${glass} rounded-2xl p-5`}
        >
          <div className="relative flex items-center rounded-xl border mb-5">
            <div className={`absolute inset-0 rounded-xl ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-black/[0.07] bg-black/[0.03]'} border`} />
            <Search size={15} className={`absolute left-3 ${isDark ? 'text-slate-500' : 'text-slate-400'} z-10`} />
            <input
              type="text"
              placeholder="Search products and services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`relative w-full bg-transparent pl-9 pr-4 py-2.5 text-sm outline-none z-10 ${isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-700 placeholder:text-slate-400'}`}
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearch('')}
                  className="absolute right-3 z-10"
                >
                  <X size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                <Package size={32} className={`mx-auto mb-2 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {search ? `No products matching "${search}"` : 'No products yet'}
                </p>
                {!search && canEdit && (
                  <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
                    Add your first product →
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((product, i) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: deletingId === product.id ? 0 : 1, y: 0, scale: deletingId === product.id ? 0.95 : 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05, layout: { duration: 0.2 } }}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    className={`p-4 rounded-xl border group cursor-default transition-colors ${
                      isDark
                        ? 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]'
                        : 'border-black/[0.06] bg-black/[0.01] hover:bg-black/[0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: -3 }}
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[product.unit] ?? 'from-indigo-500 to-violet-600'} flex items-center justify-center shadow-lg`}
                      >
                        <Package size={18} className="text-white" />
                      </motion.div>
                      {canEdit && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-500 hover:text-indigo-400' : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'}`}
                            title="Edit"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-red-900/20 text-slate-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className={`text-sm mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
                      {product.name}
                    </h3>
                    <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{product.description}</p>

                    <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-white/[0.05]' : 'border-black/[0.05]'}`}>
                      <div className="flex items-center gap-1.5">
                        <Tag size={12} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                        <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 800 }}>
                          ${product.price.toLocaleString()}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ {product.unit}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Percent size={11} className={product.taxRate > 0 ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-slate-600' : 'text-slate-400')} />
                        <span className={`text-xs ${product.taxRate > 0 ? isDark ? 'text-amber-400' : 'text-amber-600' : isDark ? 'text-slate-600' : 'text-slate-400'}`} style={{ fontWeight: 600 }}>
                          {product.taxRate > 0 ? `${product.taxRate}%` : 'No tax'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && (
          <AddProductModal isDark={isDark} onClose={() => setShowModal(false)} onAdd={handleAdd} />
        )}
      </AnimatePresence>
    </>
  )
}
