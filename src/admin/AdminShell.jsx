import { createContext, useContext, useState, useCallback, useRef } from 'react'
import {
  LayoutDashboard, Clock, Users, CheckSquare, CalendarDays, Banknote, Receipt,
  Package, QrCode, BarChart3, HardDrive, Settings as SettingsIcon, Menu, LogOut, Search,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './ui'
import BrandLogo from '../components/BrandLogo'
import Toast from '../components/Toast'

import Dashboard from './screens/Dashboard'
import Attendance from './screens/Attendance'
import Employees from './screens/Employees'
import Tasks from './screens/Tasks'
import Leave from './screens/Leave'
import Payroll from './screens/Payroll'
import Expenses from './screens/Expenses'
import Inventory from './screens/Inventory'
import QRGenerate from './screens/QRGenerate'
import Reports from './screens/Reports'
import Backup from './screens/Backup'
import Settings from './screens/Settings'

const AdminContext = createContext(null)
export const useAdmin = () => useContext(AdminContext)

const NAV = [
  { section: 'Main', items: [{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    section: 'Workforce',
    items: [
      { key: 'attendance', label: 'Attendance', icon: Clock },
      { key: 'employees', label: 'Employees', icon: Users },
      { key: 'tasks', label: 'Tasks', icon: CheckSquare },
      { key: 'leave', label: 'Leave Management', icon: CalendarDays },
    ],
  },
  {
    section: 'Finance',
    items: [
      { key: 'payroll', label: 'Payroll', icon: Banknote },
      { key: 'expenses', label: 'Expenses', icon: Receipt },
    ],
  },
  {
    section: 'Operations',
    items: [
      { key: 'inventory', label: 'Inventory', icon: Package },
      { key: 'qr', label: 'Generate QR', icon: QrCode },
    ],
  },
  {
    section: 'System',
    items: [
      { key: 'reports', label: 'Reports', icon: BarChart3 },
      { key: 'backup', label: 'Backup', icon: HardDrive },
      { key: 'settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

const TITLES = {
  dashboard: 'Dashboard',
  attendance: 'Attendance',
  employees: 'Employees',
  tasks: 'Tasks',
  leave: 'Leave Management',
  payroll: 'Payroll',
  expenses: 'Expenses',
  inventory: 'Inventory',
  qr: 'Generate QR codes',
  reports: 'Reports',
  backup: 'Backup',
  settings: 'Settings',
}

const SCREENS = {
  dashboard: Dashboard,
  attendance: Attendance,
  employees: Employees,
  tasks: Tasks,
  leave: Leave,
  payroll: Payroll,
  expenses: Expenses,
  inventory: Inventory,
  qr: QRGenerate,
  reports: Reports,
  backup: Backup,
  settings: Settings,
}

export default function AdminShell() {
  const { profile, signOut } = useAuth()
  const [screen, setScreen] = useState('dashboard')
  const [params, setParams] = useState({})
  const [toast, setToast] = useState('')
  const [drawer, setDrawer] = useState(false)
  const toastTimer = useRef(null)

  const navigate = useCallback((next, p = {}) => {
    setParams(p)
    setScreen(next)
    setDrawer(false)
  }, [])

  const flash = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])

  const Screen = SCREENS[screen] || Dashboard
  const ctx = { screen, params, navigate, flash, profile }

  const Sidebar = () => (
    <div className="w-[248px] sidebar-gradient flex flex-col h-full shrink-0 text-white">
      <div className="flex flex-col items-center gap-1 py-5 border-b border-white/10">
        <BrandLogo size={19} />
        <div className="text-[7px] tracking-[2.5px] text-white/45">WORKFORCE MANAGEMENT, SYNCED.</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.section} className="mb-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-white/35 px-3 mb-1.5">{group.section}</div>
            {group.items.map((item) => {
              const active = screen === item.key
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium mb-0.5 transition-colors ' +
                    (active ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white/85 hover:bg-white/5')
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-2.5 px-4 py-3 border-t border-white/10">
        <Avatar name={profile.full_name} src={profile.avatar_url} size={32} />
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold truncate">{profile.full_name}</div>
          <div className="text-[11px] text-white/45 truncate">{profile.is_admin ? 'Owner' : profile.position}</div>
        </div>
        <button onClick={signOut} aria-label="Log out" className="text-white/45 hover:text-white shrink-0">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )

  return (
    <AdminContext.Provider value={ctx}>
      <div className="h-dvh w-full bg-bg-soft flex overflow-hidden">
        <div className="hidden lg:block"><Sidebar /></div>

        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
            <div className="absolute left-0 top-0 bottom-0"><Sidebar /></div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-16 bg-white border-b border-border flex items-center px-4 sm:px-6 gap-4 shrink-0">
            <button
              onClick={() => setDrawer(true)}
              className="lg:hidden border-none bg-bg-tint w-9 h-9 rounded-md flex items-center justify-center"
              aria-label="Menu"
            >
              <Menu size={18} />
            </button>
            <div className="text-lg font-bold">{TITLES[screen]}</div>
            <div className="flex-1" />
            <div className="hidden md:flex items-center gap-2 border border-border rounded-md px-3 py-2 w-[220px] text-faint text-[13px]">
              <Search size={14} /> Search…
            </div>
            <Avatar name={profile.full_name} src={profile.avatar_url} size={34} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Screen />
          </div>
        </div>

        <Toast message={toast} />
      </div>
    </AdminContext.Provider>
  )
}
