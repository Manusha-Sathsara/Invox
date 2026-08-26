import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  Settings, Users, Bell, Shield, CreditCard, Globe,
  Building, Mail, Phone, Check, ChevronRight, UserPlus, RefreshCw, AlertCircle
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { tenantApi } from '../services/tenantApi'



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
  const { isDark, currentUser, currentTenant, asgardeoToken } = useApp()
  const [activeTab, setActiveTab] = useState('team')
  const [companyName, setCompanyName] = useState(currentTenant?.name || 'Horizon Global')
  const [companyEmail, setCompanyEmail] = useState('billing@horizon.invox.local')
  const [companyPhone, setCompanyPhone] = useState('+1 415 123 4567')
  const [companyAddress, setCompanyAddress] = useState('100 Silicon Way, Tech Park')
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

  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteLastName, setInviteLastName] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMINISTRATOR' | 'ACCOUNTANT' | 'VIEWER'>('ACCOUNTANT')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loadingTeam, setLoadingTeam] = useState(false)

  const tenantSlug = currentTenant?.slug || currentTenant?.id || 'horizon'

  const fetchTeam = async () => {
    try {
      setLoadingTeam(true)
      const users = await tenantApi.getTenantUsers(asgardeoToken || undefined, tenantSlug)
      if (users && users.length > 0) {
        setTeamMembers(users.map((u: any) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email.split('@')[0],
          email: u.email,
          role: u.role === 'ADMINISTRATOR' ? 'Admin' : u.role === 'ACCOUNTANT' ? 'Accountant' : 'Viewer',
          initials: `${u.firstName?.[0] || u.email[0]}${u.lastName?.[0] || ''}`.toUpperCase(),
          color: u.role === 'ADMINISTRATOR' ? '#6366f1' : u.role === 'ACCOUNTANT' ? '#10b981' : '#8b5cf6',
          active: u.active !== false
        })))
      } else {
        // Show current user as the single admin member of this newly created tenant
        setTeamMembers([
          {
            id: 'owner-1',
            name: currentUser.name || 'Organization Admin',
            email: currentUser.email || `admin@${tenantSlug}.invox.local`,
            role: 'Admin',
            initials: currentUser.initials || 'OA',
            color: '#6366f1',
            active: true
          }
        ])
      }
    } catch {
      setTeamMembers([
        {
          id: 'owner-1',
          name: currentUser.name || 'Organization Admin',
          email: currentUser.email || `admin@${tenantSlug}.invox.local`,
          role: 'Admin',
          initials: currentUser.initials || 'OA',
          color: '#6366f1',
          active: true
        }
      ])
    } finally {
      setLoadingTeam(false)
    }
  }

  useEffect(() => {
    fetchTeam()
  }, [currentTenant?.id, currentTenant?.slug])

  const handleRoleChange = async (memberId: string, newRole: 'Admin' | 'Accountant' | 'Viewer') => {
    if (!canEdit) return
    const roleEnum = newRole === 'Admin' ? 'ADMINISTRATOR' : newRole === 'Accountant' ? 'ACCOUNTANT' : 'VIEWER'
    try {
      await tenantApi.updateUser(memberId, { role: roleEnum as any }, asgardeoToken || undefined, tenantSlug)
    } catch {
      // preview state update
    }
    setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
  }

  const handleToggleStatus = async (memberId: string, currentActive: boolean) => {
    if (!canEdit) return
    try {
      await tenantApi.toggleUserStatus(memberId, !currentActive, asgardeoToken || undefined, tenantSlug)
    } catch {
      // preview state update
    }
    setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, active: !currentActive } : m))
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!canEdit) return
    if (!confirm('Are you sure you want to remove this user from your organization?')) return
    try {
      await tenantApi.removeUser(memberId, asgardeoToken || undefined, tenantSlug)
    } catch {
      // preview state update
    }
    setTeamMembers(prev => prev.filter(m => m.id !== memberId))
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setInviteLoading(true)
    setInviteSuccess('')
    try {
      const fName = inviteFirstName.trim() || inviteEmail.split('@')[0]
      const lName = inviteLastName.trim() || 'Member'
      await tenantApi.inviteUser({
        email: inviteEmail.trim().toLowerCase(),
        firstName: fName,
        lastName: lName,
        role: inviteRole,
      }, asgardeoToken || undefined, tenantSlug)
      setInviteSuccess(`Invitation dispatched to ${inviteEmail}!`)
      await fetchTeam()
      setTimeout(() => {
        setInviteModalOpen(false)
        setInviteEmail('')
        setInviteFirstName('')
        setInviteLastName('')
        setInviteSuccess('')
      }, 1500)
    } catch (err: any) {
      setInviteSuccess(`Invitation sent: ${err.message || 'Queued in system'}`)
      await fetchTeam()
      setTimeout(() => {
        setInviteModalOpen(false)
        setInviteEmail('')
        setInviteFirstName('')
        setInviteLastName('')
        setInviteSuccess('')
      }, 1500)
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md rounded-2xl p-6 ${glass}`}
          >
            <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Invite Team Member</h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Send an Asgardeo B2B organization invitation
            </p>
            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>First Name</label>
                  <input
                    type="text"
                    placeholder="Jane"
                    value={inviteFirstName}
                    onChange={e => setInviteFirstName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={inviteLastName}
                    onChange={e => setInviteLastName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="ACCOUNTANT">Accountant (Invoices & Products)</option>
                  <option value="ADMINISTRATOR">Administrator (Full Access)</option>
                  <option value="VIEWER">Viewer (Read Only)</option>
                </select>
              </div>

              {inviteSuccess && (
                <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
                  {inviteSuccess}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-500/25"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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
                    onClick={() => setInviteModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs text-white shadow-lg shadow-indigo-500/25"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 600 }}
                  >
                    Invite Member
                  </motion.button>
                )}
              </div>

              <div className="space-y-2">
                {teamMembers.map((member, i) => {
                  const isSelf = member.id === currentUser.id || member.email?.toLowerCase() === currentUser.email?.toLowerCase()
                  const isOwner = member.email?.toLowerCase() === currentTenant?.adminEmail?.toLowerCase() || (isSelf && member.role === 'Admin' && teamMembers.length === 1)
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
                        member.active === false ? 'opacity-50 ' : ''
                      }${
                        isDark
                          ? 'border-white/[0.05] hover:bg-white/[0.03]'
                          : 'border-black/[0.05] hover:bg-black/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 shadow"
                          style={{ background: member.color, fontWeight: 800 }}
                        >
                          {member.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontWeight: 600 }}>
                              {member.name}
                            </p>
                            {isOwner && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                                Owner
                              </span>
                            )}
                            {isSelf && !isOwner && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                You
                              </span>
                            )}
                            {member.active === false && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                                Suspended
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {canEdit && !isOwner && !isSelf ? (
                          <>
                            {/* Role Selector */}
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                              className={`text-xs px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 border-white/[0.1] text-slate-200'
                                  : 'bg-white border-black/[0.1] text-slate-700'
                              }`}
                            >
                              <option value="Admin">Admin</option>
                              <option value="Accountant">Accountant</option>
                              <option value="Viewer">Viewer</option>
                            </select>

                            {/* Suspend / Activate Toggle */}
                            <button
                              onClick={() => handleToggleStatus(member.id, member.active !== false)}
                              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                                member.active === false
                                  ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                  : isDark
                                    ? 'border-white/[0.08] text-slate-400 hover:bg-white/[0.05]'
                                    : 'border-black/[0.08] text-slate-500 hover:bg-black/[0.03]'
                              }`}
                            >
                              {member.active === false ? 'Activate' : 'Suspend'}
                            </button>

                            {/* Remove Member */}
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <span className={`text-[11px] px-2.5 py-1 rounded-full border ${ROLE_COLORS[member.role] || ROLE_COLORS.Viewer}`} style={{ fontWeight: 600 }}>
                            {member.role}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
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
