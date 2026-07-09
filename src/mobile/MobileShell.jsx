import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { Home, Clock, CalendarDays, FileText, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'

import MHome from './screens/MHome'
import CheckIn from './screens/CheckIn'
import MAttendance from './screens/MAttendance'
import MProfile from './screens/MProfile'
import MLeave from './screens/MLeave'
import MPayslips from './screens/MPayslips'

const MobileContext = createContext(null)
export const useMobile = () => useContext(MobileContext)

const TABS = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'attendance', label: 'Attendance', icon: Clock },
  { key: 'leave', label: 'Leave', icon: CalendarDays },
  { key: 'payslips', label: 'Payslips', icon: FileText },
  { key: 'profile', label: 'Profile', icon: User },
]

const SCREENS = {
  home: MHome,
  checkin: CheckIn,
  attendance: MAttendance,
  leave: MLeave,
  payslips: MPayslips,
  profile: MProfile,
}

export default function MobileShell() {
  const { profile } = useAuth()
  const [screen, setScreen] = useState('home')
  const [params, setParams] = useState({})
  const [toast, setToast] = useState('')
  // bump to force MHome to refetch after a clock in/out
  const [homeVersion, setHomeVersion] = useState(0)
  const toastTimer = useRef(null)

  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = '#1C1D22'
    return () => { document.body.style.background = prev }
  }, [])

  const navigate = useCallback((next, p = {}) => {
    setParams(p)
    setScreen(next)
    window.scrollTo(0, 0)
  }, [])

  const flash = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])

  const refreshHome = useCallback(() => setHomeVersion((v) => v + 1), [])

  const Screen = SCREENS[screen] || MHome
  const showTabs = screen !== 'checkin'
  const ctx = { screen, params, navigate, flash, profile, refreshHome, homeVersion }

  return (
    <MobileContext.Provider value={ctx}>
      <div className="h-dvh w-full max-w-[520px] mx-auto flex flex-col bg-[#1C1D22] text-white">
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <Screen />
        </div>
        {showTabs && (
          <nav
            className="shrink-0 grid grid-cols-5 border-t border-white/10 bg-[#0A3DB6]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {TABS.map((t) => {
              const active = screen === t.key
              const Icon = t.icon
              return (
                <button
                  key={t.key}
                  onClick={() => navigate(t.key)}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                    active ? 'text-sky-300' : 'text-white/70'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.4 : 2} />
                  {t.label}
                </button>
              )
            })}
          </nav>
        )}
        <Toast message={toast} />
      </div>
    </MobileContext.Provider>
  )
}
