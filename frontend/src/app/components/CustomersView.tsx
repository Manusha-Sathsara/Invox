import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Users, Plus, Search, Mail, Phone, Globe, MoreHorizontal,
  TrendingUp, X, Check, Edit3, Trash2, FileText, Eye,
  UserPlus, ChevronDown,
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { CUSTOMERS as INITIAL_CUSTOMERS } from '../App'
import { useApp } from '../context/AppContext'

const COUNTRIES = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Australia', 'Singapore', 'Japan']

function AddCustomerModal({
  isDark,
  onClose,
  onAdd,
}: {
  isDark: boolean
  onClose: () => void
  onAdd: (c: typeof INITIAL_CUSTOMERS[0]) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('USA')
  const [countryOpen, setCountryOpen] = useState(false)
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
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onAdd({
      id: String(Date.now()),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '—',
      country,
      totalInvoiced: 0,
      outstanding: 0,
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
      {/* Backdrop */}
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
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/[0.07]' : 'border-black/[0.06]'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <UserPlus size={15} className="text-white" />
            </div>
            <div>
              <h2 className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700 }}>Add Customer</h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Create a new customer account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-3.5">
          <div>
            <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
              Company / Full Name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
              placeholder="e.g. Acme Corp"
              className={`${inputClass} ${errors.name ? 'border-red-400/60' : ''}`}
            />
            {errors.name && <p className="text-red-400 text-[11px] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                placeholder="billing@company.com"
                className={`${inputClass} pl-9 ${errors.email ? 'border-red-400/60' : ''}`}
              />
            </div>
            {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>Phone</label>
            <div className="relative">
              <Phone size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 415 000 0000"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          <div className="relative">
            <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>Country</label>
            <button
              type="button"
              onClick={() => setCountryOpen(!countryOpen)}
              className={`${inputClass} flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <Globe size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                {country}
              </div>
              <ChevronDown size={14} className={`${isDark ? 'text-slate-500' : 'text-slate-400'} transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {countryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className={`absolute top-full left-0 mt-1 w-full rounded-xl border shadow-xl overflow-hidden ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-black/10 shadow-black/10'}`}
                  style={{ zIndex: 720 }}
                >
                  {COUNTRIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCountry(c); setCountryOpen(false) }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                        isDark ? 'hover:bg-white/[0.06] text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                      } ${country === c ? isDark ? 'text-indigo-400' : 'text-indigo-600' : ''}`}
                    >
                      {c}
                      {country === c && <Check size={13} className="text-indigo-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
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
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm text-white shadow-lg shadow-emerald-500/25"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', fontWeight: 600 }}
          >
            <UserPlus size={15} />
            Add Customer
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function CustomersView() {
  const { isDark, currentUser } = useApp()
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const canEdit = currentUser.role !== 'Viewer'

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (c: typeof INITIAL_CUSTOMERS[0]) => {
    setCustomers(prev => [c, ...prev])
    toast.success(`${c.name} added successfully`, {
      description: 'New customer is ready to invoice.',
      icon: '🎉',
    })
  }

  const handleDelete = (id: string, name: string) => {
    setDeletingId(id)
    setTimeout(() => {
      setCustomers(prev => prev.filter(c => c.id !== id))
      setDeletingId(null)
      toast.error(`${name} removed`, { description: 'Customer deleted from workspace.' })
    }, 300)
  }

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-xl'
    : 'bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-black/5'

  const totalRevenue = customers.reduce((s, c) => s + c.totalInvoiced, 0)
  const totalOutstanding = customers.reduce((s, c) => s + c.outstanding, 0)

  return (
    <>
      <Toaster position="bottom-right" theme={isDark ? 'dark' : 'light'} richColors />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className={`text-xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
              Customers
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{customers.length} total customers</p>
          </div>
          {canEdit ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white shadow-lg shadow-emerald-500/25"
              style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', fontWeight: 600 }}
            >
              <Plus size={16} />
              Add Customer
            </motion.button>
          ) : (
            <div className="relative group">
              <button disabled className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-not-allowed opacity-40 ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500'}`} style={{ fontWeight: 600 }}>
                <Plus size={16} /> Add Customer
              </button>
              <div className={`absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-800 text-white'}`} style={{ zIndex: 600 }}>
                Viewers cannot add customers
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Customers', value: String(customers.length), icon: Users, color: 'from-indigo-500 to-violet-600' },
            { label: 'Total Invoiced', value: `$${(totalRevenue / 1000).toFixed(0)}k`, icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
            { label: 'Outstanding', value: `$${totalOutstanding.toLocaleString()}`, icon: FileText, color: 'from-amber-400 to-orange-500' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`${glass} rounded-2xl p-4 flex items-center gap-3`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`} style={{ fontWeight: 500 }}>{stat.label}</p>
                  <motion.p
                    key={stat.value}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}
                    style={{ fontWeight: 700, letterSpacing: '-0.03em' }}
                  >
                    {stat.value}
                  </motion.p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Customer grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.21 }}
          className={`${glass} rounded-2xl p-5`}
        >
          <div className={`relative flex items-center rounded-xl border mb-4 ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-black/[0.07] bg-black/[0.03]'}`}>
            <Search size={15} className={`absolute left-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search by name, email, or country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full bg-transparent pl-9 pr-4 py-2.5 text-sm outline-none ${isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-700 placeholder:text-slate-400'}`}
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearch('')}
                  className="absolute right-3"
                >
                  <X size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <Users size={32} className={`mx-auto mb-2 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {search ? `No customers matching "${search}"` : 'No customers yet'}
                </p>
                {!search && canEdit && (
                  <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
                    Add your first customer →
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map((customer, i) => (
                  <motion.div
                    key={customer.id}
                    layout
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: deletingId === customer.id ? 0 : 1, y: 0, scale: deletingId === customer.id ? 0.95 : 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ delay: i * 0.04, layout: { duration: 0.2 } }}
                    whileHover={{ y: -1, transition: { duration: 0.15 } }}
                    className={`p-4 rounded-xl border cursor-default transition-colors group relative ${
                      isDark
                        ? 'border-white/[0.06] hover:bg-white/[0.04] bg-white/[0.02]'
                        : 'border-black/[0.06] hover:bg-black/[0.03] bg-black/[0.01]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 3 }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0 shadow"
                          style={{
                            background: `hsl(${(customer.name.charCodeAt(0) * 15) % 360}, 65%, 55%)`,
                            fontWeight: 800,
                          }}
                        >
                          {customer.name[0]}
                        </motion.div>
                        <div>
                          <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
                            {customer.name}
                          </p>
                          <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{customer.country}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === customer.id ? null : customer.id)}
                          className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-400'}`}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        <AnimatePresence>
                          {openMenu === customer.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.12 }}
                              className={`absolute right-0 top-full mt-1 w-40 rounded-xl border shadow-xl overflow-hidden ${
                                isDark ? 'bg-slate-900/98 border-white/[0.08]' : 'bg-white/98 border-black/[0.08] shadow-black/10'
                              }`}
                              style={{ zIndex: 600 }}
                              onMouseLeave={() => setOpenMenu(null)}
                            >
                              <button className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-50'}`}>
                                <Eye size={12} /> View Profile
                              </button>
                              {canEdit && (
                                <>
                                  <button className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${isDark ? 'text-indigo-400 hover:bg-indigo-900/20' : 'text-indigo-600 hover:bg-indigo-50'}`}>
                                    <Edit3 size={12} /> Edit
                                  </button>
                                  <button
                                    onClick={() => { handleDelete(customer.id, customer.name); setOpenMenu(null) }}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                </>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className={`space-y-1 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-3`}>
                      <div className="flex items-center gap-1.5">
                        <Mail size={11} />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={11} />
                        {customer.phone}
                      </div>
                    </div>

                    <div className={`flex gap-4 pt-3 border-t text-xs ${isDark ? 'border-white/[0.05]' : 'border-black/[0.04]'}`}>
                      <div>
                        <p className={isDark ? 'text-slate-600' : 'text-slate-400'}>Total Invoiced</p>
                        <p className={isDark ? 'text-slate-300' : 'text-slate-700'} style={{ fontWeight: 700 }}>
                          {customer.totalInvoiced > 0 ? `$${customer.totalInvoiced.toLocaleString()}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className={isDark ? 'text-slate-600' : 'text-slate-400'}>Outstanding</p>
                        <p className={customer.outstanding > 0 ? 'text-amber-500' : isDark ? 'text-emerald-400' : 'text-emerald-600'} style={{ fontWeight: 700 }}>
                          {customer.outstanding > 0 ? `$${customer.outstanding.toLocaleString()}` : 'Paid up'}
                        </p>
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
          <AddCustomerModal isDark={isDark} onClose={() => setShowModal(false)} onAdd={handleAdd} />
        )}
      </AnimatePresence>
    </>
  )
}
