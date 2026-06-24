import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { selectAdminUser, clearAdminAuth } from '../../features/adminAuth/adminAuthSlice'
import { setAdminLoggingOut } from '../../api/admin/adminAuthResponseInterceptor'
import adminAuthApi from '../../api/admin/adminAuth.api'


const NAV_ITEMS = [
  { to: '/grove-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/grove-admin/tenants', icon: Building2, label: 'Tenants' },
  { to: '/grove-admin/users', icon: Users, label: 'Users' },
  { to: '/grove-admin/plans', icon: CreditCard, label: 'Plans' },
]

export default function AdminSidebar() {
  const admin = useSelector(selectAdminUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    setAdminLoggingOut(true)
    try {
      await adminAuthApi.logout()
    } catch {
      // proceed regardless
    }
    dispatch(clearAdminAuth())
    navigate('/grove-admin/login', { replace: true })
  }

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col bg-[#0A140F] border-r border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="text-[16px] font-semibold text-white">Grove Admin</span>
        <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/50">
          Internal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 pt-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors ${
                isActive
                  ? 'bg-white text-[#0A140F] font-medium'
                  : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] px-4 py-4">
        <p className="truncate px-2 text-[12px] text-white/40">{admin?.email}</p>
        <button
          onClick={handleSignOut}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-white/55 hover:bg-white/[0.06] hover:text-white/90 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )
}