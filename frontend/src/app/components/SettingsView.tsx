import { useState } from 'react'
import { motion } from 'motion/react'
import {
  Settings, Users, Bell, Shield, CreditCard, Globe,
  Building, Mail, Phone, Check, ChevronRight,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const TEAM = [
  { id: '1', name: 'Alex Morgan', email: 'alex@acme.com', role: 'Admin', initials: 'AM', color: '#6366f1' },
  { id: '2', name: 'Jamie Lee', email: 'jamie@acme.com', role: 'Accountant', initials: 'JL', color: '#10b981' },
  { id: '3', name: 'Sam Chen', email: 'sam@acme.com', role: 'Viewer', initials: 'SC', color: '#8b5cf6' },
  { id: '4', name: 'Taylor Kim', email: 'taylor@acme.com', role: 'Accountant', initials: 'TK', color: '#f59e0b' },
]

const SETTING_TABS = [
  { id: 'company', label: 'Company', icon: Building },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
]

const NOTIF_ITEMS = [
  { label: 'Invoice Paid', desc: 'When a customer marks an invoice as paid', defaultOn: true },
  { label: 'Invoice Overdue', desc: 'When an invoice passes its due date', defaultOn: true },
  { label: 'New Customer', desc: 'When a new customer is added to your workspace', defaultOn: false },
  { label: 'Invoice Viewed', desc: 'When a customer opens a sent invoice', defaultOn: true },
  { label: 'Team Changes', desc: 'When team members are added or roles change', defaultOn: false },
]

function NotifToggle({ label, desc, defaultOn, isDark }: { label: string; desc: string; defaultOn: boolean; isDark: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border ${isDark ? 'border-white/[0.05]' : 'border-black/[0.05]'}`}>
      <div className="min-w-0">
        <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 600 }}>{label}</p>
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative rounded-full transition-all flex items-center flex-shrink-0 ${on ? 'bg-indigo-500' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
        style={{ height: '22px', width: '40px' }}
      >
        <motion.span
          animate={{ x: on ? 18 : 2 }}
          className="absolute bg-white rounded-full shadow"
          style={{ width: '18px', height: '18px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      </button>
    </div>
  )
}

const ROLE_COLORS: Record<string, string> = {
  Admin: 'text-indigo-500 bg-indigo-50 border-indigo-200/60 dark:text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-700/40',
  Accountant: 'text-emerald-600 bg-emerald-50 border-emerald-200/60 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-700/40',
  Viewer: 'text-slate-500 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800/50 dark:border-slate-700/40',
}

export function SettingsView() {
  const { isDark, currentUser } = useApp()
  const [activeTab, setActiveTab] = useState('company')
  const [companyName, setCompanyName] = useState('Acme Corp')
  const [companyEmail, setCompanyEmail] = useState('billing@acme.com')
  const [companyPhone, setCompanyPhone] = useState('+1 415 123 4567')
  const [companyAddress, setCompanyAddress] = useState('123 Market St, San Francisco CA')
  const [saved, setSaved] = useState(false)

  const canEdit = currentUser.role === 'Admin'

  const glass = isDark
    ? 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-xl'
    : 'bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-black/5'

  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
    isDark
      ? 'bg-white/[0.06] border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50'
      : 'bg-black/[0.03] border-black/[0.06] text-slate-700 placeholder:text-slate-400 focus:border-indigo-300'
  } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className={`text-xl ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
          Team & Settings
        </h1>
        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Manage your workspace, team, and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Tabs — horizontal scroll on mobile, vertical sidebar on lg+ */}
        <div className={`${glass} rounded-2xl p-3 lg:w-52 flex-shrink-0`}>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
            {SETTING_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isActive
                      ? isDark
                        ? 'text-indigo-300 bg-indigo-900/30 border border-indigo-700/30'
                        : 'text-indigo-700 bg-indigo-50 border border-indigo-100'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-black/[0.04]'
                  }`}
                  style={{ fontWeight: isActive ? 600 : 400 }}
                >
                  <Icon size={16} className={isActive ? isDark ? 'text-indigo-400' : 'text-indigo-600' : ''} />
                  {tab.label}
                  {isActive && (
                    <ChevronRight size={14} className="ml-auto" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'company' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${glass} rounded-2xl p-5`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Building size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                  <h2 className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>Company Information</h2>
                </div>
                {!canEdit && (
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${isDark ? 'text-amber-400 bg-amber-900/20 border-amber-700/30' : 'text-amber-700 bg-amber-50 border-amber-200'}`} style={{ fontWeight: 600 }}>
                    View Only
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>Company Name</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={!canEdit} className={inputClass} />
                </div>
                <div>
                  <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>Billing Email</label>
                  <div className="relative">
                    <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} disabled={!canEdit} className={`${inputClass} pl-9`} />
                  </div>
                </div>
                <div>
                  <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>Phone</label>
                  <div className="relative">
                    <Phone size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} disabled={!canEdit} className={`${inputClass} pl-9`} />
                  </div>
                </div>
                <div>
                  <label className={`text-xs mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontWeight: 600 }}>Address</label>
                  <div className="relative">
                    <Globe size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} disabled={!canEdit} className={`${inputClass} pl-9`} />
                  </div>
                </div>
              </div>

              {canEdit && (
                <div className="mt-5 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all ${
                      saved
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                        : 'text-white shadow-lg shadow-indigo-500/25'
                    }`}
                    style={{
                      background: saved ? undefined : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      fontWeight: 600,
                    }}
                  >
                    {saved && <Check size={15} />}
                    {saved ? 'Saved!' : 'Save Changes'}
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'team' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${glass} rounded-2xl p-5`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Users size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                  <h2 className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>Team Members</h2>
                </div>
                {canEdit && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs text-white shadow-lg shadow-indigo-500/25"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 600 }}
                  >
                    Invite Member
                  </motion.button>
                )}
              </div>

              <div className="space-y-2">
                {TEAM.map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      isDark
                        ? 'border-white/[0.05] hover:bg-white/[0.03]'
                        : 'border-black/[0.05] hover:bg-black/[0.02]'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 shadow"
                      style={{ background: member.color, fontWeight: 800 }}
                    >
                      {member.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 600 }}>
                        {member.name}
                        {member.id === currentUser.id && (
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            You
                          </span>
                        )}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{member.email}</p>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full border ${ROLE_COLORS[member.role]}`} style={{ fontWeight: 600 }}>
                      {member.role}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className={`mt-4 pt-4 border-t text-xs ${isDark ? 'border-white/[0.05] text-slate-500' : 'border-black/[0.05] text-slate-400'}`}>
                <p>Role permissions: <span className="font-semibold text-indigo-500">Admin</span> — full access · <span className="font-semibold text-emerald-500">Accountant</span> — create & edit · <span className="font-semibold">Viewer</span> — read only</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${glass} rounded-2xl p-5`}
            >
              <div className="flex items-center gap-2 mb-5">
                <Bell size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                <h2 className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>Notification Preferences</h2>
              </div>
              <div className="space-y-3">
                {NOTIF_ITEMS.map((item, i) => (
                  <NotifToggle key={i} label={item.label} desc={item.desc} defaultOn={item.defaultOn} isDark={isDark} />
                ))}
              </div>
            </motion.div>
          )}

          {(activeTab === 'billing' || activeTab === 'security') && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${glass} rounded-2xl p-10 text-center`}
            >
              <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/[0.06]' : 'bg-indigo-50'}`}>
                {activeTab === 'billing'
                  ? <CreditCard size={24} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                  : <Shield size={24} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />}
              </div>
              <h3 className={`text-sm mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 700 }}>
                {activeTab === 'billing' ? 'Billing & Subscription' : 'Security Settings'}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {activeTab === 'billing'
                  ? 'Manage your subscription plan, payment methods, and billing history.'
                  : 'Configure two-factor authentication, API keys, and audit logs.'}
              </p>
              <button
                className="mt-5 px-5 py-2.5 rounded-xl text-sm text-white shadow-lg shadow-indigo-500/25"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 600 }}
              >
                {activeTab === 'billing' ? 'Manage Billing' : 'Security Center'}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
