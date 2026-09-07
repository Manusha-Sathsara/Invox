import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Users, Plus, Search, Mail, Phone, Globe, MoreHorizontal,
  TrendingUp, X, Check, Edit3, Trash2, Eye,
  UserPlus, ChevronDown, MapPin, CreditCard,
  Loader2, RefreshCw, AlertTriangle, Hash, UserCheck
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import type { Customer } from '../App'
import { useApp } from '../context/AppContext'
import {
  fetchCustomersFromBackend,
  createCustomerInBackend,
  updateCustomerInBackend,
  deleteCustomerInBackend,
} from '../services/customerService'

const COUNTRIES = [
  'USA',
  'Canada',
  'UK',
  'Germany',
  'France',
  'Australia',
  'Singapore',
  'Japan',
  'Sri Lanka',
  'India',
  'Netherlands',
  'Switzerland',
  'Sweden',
  'UAE',
]

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

type ModalTab = 'general' | 'address' | 'billing'

function CustomerModal({
  isDark,
  initialData,
  onClose,
  onSave,
}: {
  isDark: boolean
  initialData?: Customer | null
  onClose: () => void
  onSave: (c: Customer) => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState<ModalTab>('general')

  // General Details
  const [name, setName] = useState(initialData?.name ?? '')
  const [email, setEmail] = useState(initialData?.email ?? '')
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [contactPerson, setContactPerson] = useState(initialData?.contactPerson ?? '')

  // Billing Address
  const [addressLine1, setAddressLine1] = useState(initialData?.addressLine1 ?? '')
  const [addressLine2, setAddressLine2] = useState(initialData?.addressLine2 ?? '')
  const [city, setCity] = useState(initialData?.city ?? '')
  const [state, setState] = useState(initialData?.state ?? '')
  const [postalCode, setPostalCode] = useState(initialData?.postalCode ?? '')
  const [country, setCountry] = useState(initialData?.country ?? 'USA')
  const [countryOpen, setCountryOpen] = useState(false)

  // Invoicing & Tax Defaults
  const [currency, setCurrency] = useState(initialData?.currency ?? 'USD')
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [taxId, setTaxId] = useState(initialData?.taxId ?? '')
  const [notes, setNotes] = useState(initialData?.notes ?? '')

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const glass = isDark
    ? 'bg-slate-900/98 backdrop-blur-2xl border border-white/[0.1]'
    : 'bg-white/98 backdrop-blur-2xl border border-black/[0.08]'

  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.06] border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/60 focus:bg-white/[0.09]'
      : 'bg-black/[0.03] border-black/[0.06] text-slate-700 placeholder:text-slate-400 focus:border-emerald-500/50 focus:bg-white'
  }`

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Customer / Company name is required'
    if (!email.trim()) e.email = 'Email address is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format'
    setErrors(e)
    if (Object.keys(e).length > 0 && activeTab !== 'general') {
      setActiveTab('general')
    }
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload: Customer = {
        id: initialData?.id || '',
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        country: country.trim() || undefined,
        addressLine1: addressLine1.trim() || undefined,
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        currency: currency.trim() || 'USD',
        taxId: taxId.trim() || undefined,
        notes: notes.trim() || undefined,
        active: initialData?.active ?? true,
        totalInvoiced: initialData?.totalInvoiced ?? 0,
        outstanding: initialData?.outstanding ?? 0,
      }
      await onSave(payload)
      onClose()
    } catch (_) {
      // handled in parent
    } finally {
      setSubmitting(false)
    }
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${glass}`}
        style={{ zIndex: 710 }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/[0.07]' : 'border-black/[0.06]'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <UserPlus size={15} className="text-white" />
            </div>
            <div>
              <h2 className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700 }}>
                {initialData ? 'Edit Customer Profile' : 'Add New Customer'}
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {initialData ? `Updating ${initialData.name}` : 'Saved to backend database'}
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

        {/* Tab Switcher */}
        <div className={`flex border-b px-5 pt-2 gap-4 text-xs font-medium ${isDark ? 'border-white/[0.07]' : 'border-black/[0.06]'}`}>
          {[
            { key: 'general', label: '1. Primary Info' },
            { key: 'address', label: '2. Billing Address' },
            { key: 'billing', label: '3. Tax & Currency' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as ModalTab)}
              className={`pb-2.5 transition-colors relative ${
                activeTab === tab.key
                  ? isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-600 font-semibold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Modal Form Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3.5"
            >
              <div>
                <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                  Customer / Business Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                  placeholder="Acme Corporation"
                  className={`${inputClass} ${errors.name ? 'border-red-400/80' : ''}`}
                />
                {errors.name && <p className="text-red-400 text-[11px] mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                  Billing Email Address *
                </label>
                <div className="relative">
                  <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                    placeholder="billing@acme.com"
                    className={`${inputClass} pl-9 ${errors.email ? 'border-red-400/80' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                    Contact Person
                  </label>
                  <div className="relative">
                    <UserCheck size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Jane Doe"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (415) 000-0000"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'address' && (
            <motion.div
              key="address"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3.5"
            >
              <div>
                <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                  Street Address (Line 1)
                </label>
                <div className="relative">
                  <MapPin size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. 500 Howard Street"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                  Apartment, Suite, Unit (Line 2)
                </label>
                <input
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="e.g. Suite 400"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                    City
                  </label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="San Francisco"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                    State / Province
                  </label>
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="CA"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                    Postal / Zip Code
                  </label>
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="94105"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="relative">
                <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                  Country
                </label>
                <button
                  type="button"
                  onClick={() => setCountryOpen(!countryOpen)}
                  className={`${inputClass} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <Globe size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                    {country}
                  </div>
                  <ChevronDown size={14} className={`${isDark ? 'text-slate-400' : 'text-slate-500'} transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {countryOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className={`absolute top-full left-0 mt-1 w-full rounded-xl border shadow-2xl overflow-hidden max-h-48 overflow-y-auto ${
                        isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-black/10 shadow-black/10'
                      }`}
                      style={{ zIndex: 720 }}
                    >
                      {COUNTRIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setCountry(c); setCountryOpen(false) }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                            isDark ? 'hover:bg-white/[0.08] text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                          } ${country === c ? isDark ? 'text-emerald-400 bg-white/[0.04]' : 'text-emerald-600 bg-emerald-50/50 font-medium' : ''}`}
                        >
                          {c}
                          {country === c && <Check size={13} className="text-emerald-500" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                    Default Invoice Currency
                  </label>
                  <button
                    type="button"
                    onClick={() => setCurrencyOpen(!currencyOpen)}
                    className={`${inputClass} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                      {CURRENCY_OPTIONS.find(c => c.code === currency)?.label || currency}
                    </div>
                    <ChevronDown size={14} className={`${isDark ? 'text-slate-400' : 'text-slate-500'} transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {currencyOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className={`absolute top-full left-0 mt-1 w-full rounded-xl border shadow-2xl overflow-hidden max-h-48 overflow-y-auto ${
                          isDark ? 'bg-slate-850 border-white/10' : 'bg-white border-black/10 shadow-black/10'
                        }`}
                        style={{ zIndex: 720 }}
                      >
                        {CURRENCY_OPTIONS.map((cur) => (
                          <button
                            key={cur.code}
                            type="button"
                            onClick={() => { setCurrency(cur.code); setCurrencyOpen(false) }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                              isDark ? 'hover:bg-white/[0.08] text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                            } ${currency === cur.code ? isDark ? 'text-emerald-400 bg-white/[0.04]' : 'text-emerald-600 bg-emerald-50/50 font-medium' : ''}`}
                          >
                            <span>{cur.label}</span>
                            {currency === cur.code && <Check size={13} className="text-emerald-500" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                    Tax ID / VAT Number
                  </label>
                  <div className="relative">
                    <Hash size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="e.g. US892341234 or EU12345678"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
                  Internal Notes & Payment Terms
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Net 30 payment terms. Requires purchase order number."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-5 py-4 border-t ${isDark ? 'border-white/[0.07]' : 'border-black/[0.06]'}`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${errors.name || errors.email ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeTab === 'general' ? 'Step 1 of 3: Primary Info' : activeTab === 'address' ? 'Step 2 of 3: Address' : 'Step 3 of 3: Billing & Tax'}
            </span>
          </div>
          <div className="flex items-center gap-2">
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
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', fontWeight: 600 }}
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : initialData ? (
                <Check size={15} />
              ) : (
                <UserPlus size={15} />
              )}
              {initialData ? 'Save Changes' : 'Create Customer'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Customer Profile Details Modal (Full View)
 */
function CustomerProfileModal({
  isDark,
  customer,
  onClose,
  onEdit,
}: {
  isDark: boolean
  customer: Customer
  onClose: () => void
  onEdit: () => void
}) {
  const glass = isDark
    ? 'bg-slate-900/98 backdrop-blur-2xl border border-white/[0.1]'
    : 'bg-white/98 backdrop-blur-2xl border border-black/[0.08]'

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
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${glass}`}
        style={{ zIndex: 710 }}
      >
        {/* Header */}
        <div className={`p-5 border-b ${isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-black/[0.05] bg-slate-50/50'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg font-bold"
                style={{
                  background: `hsl(${(customer.name.charCodeAt(0) * 15) % 360}, 65%, 55%)`,
                }}
              >
                {customer.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-base ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700 }}>
                    {customer.name}
                  </h2>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    customer.active !== false
                      ? isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {customer.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {customer.contactPerson && (
                  <p className={`text-xs flex items-center gap-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <UserCheck size={12} /> Contact: {customer.contactPerson}
                  </p>
                )}
                {customer.country && (
                  <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {customer.country}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Financial summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-black/[0.05]'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Invoiced</p>
              <p className={`text-base mt-1 font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                ${Number(customer.totalInvoiced || 0).toLocaleString()}
              </p>
            </div>
            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-black/[0.05]'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Outstanding Balance</p>
              <p className={`text-base mt-1 font-bold ${Number(customer.outstanding || 0) > 0 ? 'text-amber-500' : isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                ${Number(customer.outstanding || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
            <h3 className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
              Contact Information
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-indigo-400" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-emerald-400" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Billing Address */}
          <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
            <h3 className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
              Billing Address
            </h3>
            {customer.addressLine1 || customer.city || customer.country ? (
              <div className="space-y-1 text-xs">
                {customer.addressLine1 && <p className={isDark ? 'text-slate-200' : 'text-slate-700'}>{customer.addressLine1}</p>}
                {customer.addressLine2 && <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>{customer.addressLine2}</p>}
                {(customer.city || customer.state || customer.postalCode) && (
                  <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    {[customer.city, customer.state, customer.postalCode].filter(Boolean).join(', ')}
                  </p>
                )}
                {customer.country && <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{customer.country}</p>}
              </div>
            ) : (
              <p className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No billing address provided</p>
            )}
          </div>

          {/* Tax & Currency */}
          <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
            <h3 className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
              Tax & Invoicing Settings
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className={isDark ? 'text-slate-500' : 'text-slate-400'}>Tax / VAT ID</p>
                <p className={`font-medium ${customer.taxId ? isDark ? 'text-slate-200' : 'text-slate-700' : 'italic text-slate-500'}`}>
                  {customer.taxId || 'Not specified'}
                </p>
              </div>
              <div>
                <p className={isDark ? 'text-slate-500' : 'text-slate-400'}>Default Currency</p>
                <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {customer.currency || 'USD'}
                </p>
              </div>
            </div>
            {customer.notes && (
              <div className="pt-2 border-t text-xs border-white/[0.05]">
                <p className={isDark ? 'text-slate-500' : 'text-slate-400'}>Notes</p>
                <p className={`mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-end gap-2 px-5 py-4 border-t ${isDark ? 'border-white/[0.07]' : 'border-black/[0.06]'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
              isDark ? 'border-white/[0.1] text-slate-400 hover:bg-white/[0.05]' : 'border-black/[0.08] text-slate-600 hover:bg-black/[0.03]'
            }`}
          >
            Close
          </button>
          <button
            onClick={() => { onClose(); onEdit() }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white shadow-md shadow-emerald-500/20"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', fontWeight: 600 }}
          >
            <Edit3 size={14} /> Edit Customer
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function CustomersView() {
  const { isDark, currentUser, getAccessToken, getDecodedIdToken, currentTenant } = useApp()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingProfileCustomer, setViewingProfileCustomer] = useState<Customer | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
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

  const loadBackendCustomers = useCallback(async () => {
    setLoadingBackend(true)
    setBackendError(null)
    try {
      let token = ''
      try { if (getAccessToken) token = await getAccessToken() } catch (_) {}
      const tenantId = await getActiveTenantId()

      const fetched = await fetchCustomersFromBackend(token, undefined, tenantId)
      if (Array.isArray(fetched)) {
        setCustomers(fetched)
        setBackendConnected(true)
      } else {
        setCustomers([])
        setBackendConnected(true)
      }
    } catch (err: any) {
      console.warn('Customer Service backend connection error:', err)
      setBackendConnected(false)
      setBackendError(err.message || 'Connection failed')
      setCustomers([])
    } finally {
      setLoadingBackend(false)
    }
  }, [getAccessToken, getActiveTenantId])

  useEffect(() => {
    loadBackendCustomers()
  }, [loadBackendCustomers])

  const filtered = customers.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.country && c.country.toLowerCase().includes(search.toLowerCase())) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
      (c.taxId && c.taxId.toLowerCase().includes(search.toLowerCase())) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAddOrEdit = async (c: Customer) => {
    const isEdit = Boolean(c.id && customers.some(item => item.id === c.id))
    try {
      let token = ''
      try { if (getAccessToken) token = await getAccessToken() } catch (_) {}
      const tenantId = await getActiveTenantId()

      let saved: Customer

      if (isEdit) {
        saved = await updateCustomerInBackend(c.id, c, token, undefined, tenantId)
      } else {
        const { id, ...createBody } = c
        saved = await createCustomerInBackend(createBody, token, undefined, tenantId)
      }

      setCustomers(prev => {
        const exists = prev.some(item => item.id === saved.id)
        return exists
          ? prev.map(item => item.id === saved.id ? saved : item)
          : [saved, ...prev]
      })

      setBackendConnected(true)
      toast.success(isEdit ? `"${saved.name}" updated` : `"${saved.name}" added successfully`, {
        description: saved.email ? `Email: ${saved.email}` : 'Customer profile saved to backend.',
        icon: '🎉',
      })
    } catch (err: any) {
      console.error('Customer backend save error:', err)
      // Optimistic local update fallback if gateway error
      if (isEdit) {
        setCustomers(prev => prev.map(item => item.id === c.id ? c : item))
        toast.warning(`Updated locally (${err.message})`)
      } else {
        const localCustomer = { ...c, id: c.id || String(Date.now()) }
        setCustomers(prev => [localCustomer, ...prev])
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

      await deleteCustomerInBackend(id, token, undefined, tenantId)
      setCustomers(prev => prev.filter(c => c.id !== id))
      toast.success(`"${name}" removed from database`)
    } catch (err: any) {
      console.error('Customer delete failed:', err)
      // Optimistic delete
      setCustomers(prev => prev.filter(c => c.id !== id))
      toast.warning(`Deleted locally (${err.message})`)
    } finally {
      setDeletingId(null)
      setOpenMenu(null)
    }
  }

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-xl'
    : 'bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-black/5'

  const totalInvoiced = customers.reduce((sum, c) => sum + Number(c.totalInvoiced || 0), 0)
  const totalOutstanding = customers.reduce((sum, c) => sum + Number(c.outstanding || 0), 0)

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <Toaster position="top-right" theme={isDark ? 'dark' : 'light'} richColors />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
              Customers
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
            {customers.length} customer records in database
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadBackendCustomers}
            disabled={loadingBackend}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-white/[0.08] hover:bg-white/[0.06] text-slate-400'
                : 'border-black/[0.07] hover:bg-black/[0.04] text-slate-500'
            }`}
            title="Reload from backend"
          >
            <RefreshCw size={15} className={loadingBackend ? 'animate-spin text-emerald-500' : ''} />
          </button>

          {canEdit && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setEditingCustomer(null); setShowModal(true) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white shadow-lg shadow-emerald-500/25 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', fontWeight: 600 }}
            >
              <Plus size={16} />
              Add Customer
            </motion.button>
          )}
        </div>
      </div>

      {backendError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle size={14} /> Backend sync notice: {backendError}
          </span>
          <button onClick={loadBackendCustomers} className="underline hover:text-amber-400 font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Customers',  value: customers.length.toString(), icon: Users,      color: 'text-indigo-500',  bg: 'bg-indigo-500/10' },
          { label: 'Total Invoiced',   value: `$${totalInvoiced.toLocaleString()}`,    icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Outstanding',value: `$${totalOutstanding.toLocaleString()}`, icon: CreditCard, color: 'text-amber-500',   bg: 'bg-amber-500/10' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`${glass} rounded-2xl p-4 flex items-center gap-3.5`}>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={stat.color} />
              </div>
              <div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 500 }}>{stat.label}</p>
                <p className={`text-lg mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {stat.value}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search Filter */}
      <div className={`${glass} rounded-2xl p-3 flex items-center gap-3`}>
        <div className="relative flex-1">
          <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, contact person, or country..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm border outline-none transition-all ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.07] text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50'
                : 'bg-black/[0.02] border-black/[0.06] text-slate-800 placeholder:text-slate-400 focus:border-emerald-500/50 focus:bg-white'
            }`}
          />
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-lg ${isDark ? 'bg-white/[0.05] text-slate-400' : 'bg-black/[0.04] text-slate-500'}`}>
          {filtered.length} of {customers.length}
        </span>
      </div>

      {/* Customers Table / Grid */}
      <div className={`${glass} rounded-2xl overflow-hidden`}>
        {loadingBackend && customers.length === 0 ? (
          <div className="py-16 text-center">
            <Loader2 size={24} className="animate-spin text-emerald-500 mx-auto mb-2" />
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fetching customers from backend database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className={`mx-auto mb-2.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontWeight: 600 }}>
              {search ? 'No customers found' : 'No customers recorded yet'}
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {search ? 'Try adjusting your search criteria.' : 'Create your first customer to start invoicing.'}
            </p>
            {canEdit && !search && (
              <button
                onClick={() => { setEditingCustomer(null); setShowModal(true) }}
                className="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Plus size={14} /> Add First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-black/[0.05] bg-black/[0.02]'}`}>
                  <th className={`py-3.5 px-4 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Customer</th>
                  <th className={`py-3.5 px-4 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Contact</th>
                  <th className={`py-3.5 px-4 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Location</th>
                  <th className={`py-3.5 px-4 font-semibold text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Invoiced</th>
                  <th className={`py-3.5 px-4 font-semibold text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Outstanding</th>
                  <th className={`py-3.5 px-4 font-semibold text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-black/[0.04]'}`}>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.01]'}`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs shadow-md font-bold flex-shrink-0"
                          style={{
                            background: `hsl(${(c.name.charCodeAt(0) * 15) % 360}, 65%, 55%)`,
                          }}
                        >
                          {c.name[0]}
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{c.name}</p>
                          {c.contactPerson && (
                            <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              Attn: {c.contactPerson}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-indigo-400 flex-shrink-0" />
                          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-emerald-400 flex-shrink-0" />
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{c.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Globe size={13} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                          {[c.city, c.country].filter(Boolean).join(', ') || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        ${Number(c.totalInvoiced || 0).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-semibold ${
                          Number(c.outstanding || 0) > 0
                            ? 'text-amber-500'
                            : isDark ? 'text-emerald-400' : 'text-emerald-600'
                        }`}
                      >
                        ${Number(c.outstanding || 0).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingProfileCustomer(c)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'
                          }`}
                          title="View Profile Details"
                        >
                          <Eye size={14} />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => { setEditingCustomer(c); setShowModal(true) }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/5 text-slate-500'
                            }`}
                            title="Edit Customer"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}

                        {canEdit && (
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            disabled={deletingId === c.id}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer text-red-400 ${
                              isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                            }`}
                            title="Delete Customer"
                          >
                            {deletingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <AnimatePresence>
        {showModal && (
          <CustomerModal
            isDark={isDark}
            initialData={editingCustomer}
            onClose={() => { setShowModal(false); setEditingCustomer(null) }}
            onSave={handleAddOrEdit}
          />
        )}
      </AnimatePresence>

      {/* Customer Profile Details View Modal */}
      <AnimatePresence>
        {viewingProfileCustomer && (
          <CustomerProfileModal
            isDark={isDark}
            customer={viewingProfileCustomer}
            onClose={() => setViewingProfileCustomer(null)}
            onEdit={() => {
              const c = viewingProfileCustomer
              setViewingProfileCustomer(null)
              setEditingCustomer(c)
              setShowModal(true)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
