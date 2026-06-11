import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import ClientNotificationBell from '../notifications/ClientNotificationBell'
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  LogOut,
  ChevronDown,
  PanelLeftClose,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import ClientPortalSwitcher from './ClientPortalSwitcher'

// ─── Client nav items ─────────────────────────────────────────
const NAV_ITEMS = [
  {
    to: '/portal',
    icon: LayoutDashboard,
    label: 'Home',
  },
  {
    to: '/my-requests',
    icon: FolderOpen,
    label: 'Requests',
    badgeKey: 'requests',
  },
]

export default function ClientSidebar({ badges = {} }) {
  const { user, tenant, logout } = useAuth()

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('provider-sidebar-collapsed')
    return saved === 'true'
  })

  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const popupRef = useRef(null)
  const mobileRef = useRef(null)

  const initials = user?.display_name
    ? user.display_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '??'

  // Provider branding
  const providerName = tenant?.name || 'Portal'
  const providerInitials = providerName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const providerLogoUrl = tenant?.logo_url || null

  useEffect(() => {
    function handleClickOutside(e) {
      const inDesktop = popupRef.current && popupRef.current.contains(e.target)
      const inMobile = mobileRef.current && mobileRef.current.contains(e.target)

      if (!inDesktop && !inMobile) {
        setIsPopupOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    localStorage.setItem('provider-sidebar-collapsed', isCollapsed)
  }, [isCollapsed])

  // ───────────────── User Popup ─────────────────
  const UserPopup = ({ className = '' }) => (
    <div
      className={`
        z-50 w-[220px] rounded-[14px] border border-[#e8e8e8]
        bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)] overflow-visible
        ${className}
      `}
    >
      {/* User */}
      <div className="px-4 py-3 border-b border-[#f0f0f0]">
        <p className="truncate text-[13px] font-semibold text-[#111]">
          {user?.display_name}
        </p>
        <p className="truncate text-[11px] text-[#9b9b9b] mt-0.5">
          {user?.email}
        </p>
      </div>

      {/* Portal switcher */}
      <div className="px-2 py-2 border-b border-[#f0f0f0]">
        <ClientPortalSwitcher />
      </div>

      {/* Actions */}
      <div className="py-1">
        <NavLink
          to="/portal/settings"
          onClick={() => setIsPopupOpen(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#4b5563] hover:bg-[#f7f7f7] transition-colors"
        >
          <Settings size={13} className="opacity-60" />
          Settings
        </NavLink>

        <div className="mx-3 my-1 h-px bg-[#f0f0f0]" />

        <button
          onClick={() => {
            setIsPopupOpen(false)
            logout()
          }}
          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={13} />
          <span className="font-medium">Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ═══════════════ DESKTOP SIDEBAR ═══════════════════════ */}
      <aside
        className={`
          hidden lg:flex flex-col h-screen sticky top-0 shrink-0 select-none
          transition-all duration-300 ease-out border-r border-[#ebebeb] bg-[#edf1ee]
          ${isCollapsed ? 'w-[72px]' : 'w-[240px]'}
        `}
      >
        {/* ───────────────── Header ───────────────── */}
        <div
          className={`
            flex items-center pt-4 pb-3 border-b border-[#f0f0f0]
            ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'}
          `}
        >
          {/* Provider branding */}
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {providerLogoUrl ? (
                <img
                  src={providerLogoUrl}
                  alt={providerName}
                  className="h-8 w-8 rounded-[8px] object-cover shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-[8px] bg-[#111] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {providerInitials}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#111] leading-tight">
                  {providerName}
                </p>
                <p className="text-[10px] text-[#9b9b9b]">Client portal</p>
              </div>
            </div>
          )}

          {/* Collapse button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-[#c0c4c0] hover:text-[#6b7280] hover:bg-[#f5f5f5] transition-all duration-200"
          >
            <PanelLeftClose
              size={15}
              className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* ───────────────── Navigation ───────────────── */}
        <nav className="px-2 pt-3 flex-1 flex flex-col gap-1">
          {/* Notification Bell moved to the absolute top of the navigation list for high visibility */}
          <div className="mb-2">
            <ClientNotificationBell collapsed={isCollapsed} />
          </div>

          {NAV_ITEMS.map(({ to, icon: Icon, label, badgeKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/portal'}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) => `
                relative flex items-center rounded-[9px] text-[13.5px] transition-all duration-150
                ${isCollapsed ? 'justify-center py-2.5 px-0 mx-1' : 'gap-2.5 px-3 py-[7px]'}
                ${isActive ? 'bg-[#edf7f3] text-[#0f6e56] font-medium' : 'text-[#4a544a] hover:text-[#111] hover:bg-[#f7f7f7]'}
              `}
            >
              <Icon size={16} className="shrink-0" />

              {!isCollapsed && <span className="flex-1">{label}</span>}

              {!isCollapsed && badgeKey && badges[badgeKey] > 0 && (
                <span className="text-[10px] font-semibold bg-[#111] text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {badges[badgeKey]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-3 my-1 border-t border-[#f0f0f0]" />

        {/* ───────────────── Footer ───────────────── */}
        <div className="px-2 pb-3 pt-2 relative" ref={popupRef}>
          {/* User row */}
          {!isCollapsed && (
            <div
              onClick={() => setIsPopupOpen(!isPopupOpen)}
              className={`
                flex items-center justify-between gap-2.5 rounded-[9px] cursor-pointer transition-all duration-150 hover:bg-[#f5f5f5] p-2
                ${isPopupOpen ? 'bg-[#f5f5f5]' : ''}
              `}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-semibold text-white bg-[#0f6e56]">
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[13px] text-[#111] font-medium leading-tight">
                    {user?.display_name || 'Client'}
                  </p>
                  <p className="text-[11px] text-[#9b9b9b] mt-0.5 truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </div>

              <ChevronDown
                size={13}
                className={`text-[#c0c4c0] shrink-0 transition-transform duration-200 ${isPopupOpen ? 'rotate-180' : ''}`}
              />
            </div>
          )}

          {/* Desktop popup */}
          {isPopupOpen && !isCollapsed && (
            <UserPopup className="absolute left-2 bottom-[64px]" />
          )}
        </div>
      </aside>

      {/* ═══════════════ MOBILE TOP BAR ════════════════════════ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-[#ebebeb] bg-white/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-2.5">
          {/* Provider branding */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {providerLogoUrl ? (
              <img
                src={providerLogoUrl}
                alt={providerName}
                className="h-7 w-7 rounded-[7px] object-cover shrink-0"
              />
            ) : (
              <div className="h-7 w-7 rounded-[7px] bg-[#111] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                {providerInitials}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#111] leading-tight">
                {providerName}
              </p>
              <p className="text-[10px] text-[#9b9b9b]">Client portal</p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 ml-3 shrink-0" ref={mobileRef}>
            
            {/* Using the unified notification component instead of a raw navlink */}
            <ClientNotificationBell collapsed={true} />

            <div
              onClick={() => setIsPopupOpen(!isPopupOpen)}
              className="h-8 w-8 shrink-0 rounded-full bg-[#0f6e56] flex items-center justify-center text-[10px] font-semibold text-white cursor-pointer"
            >
              {initials}
            </div>

            {/* Mobile popup */}
            {isPopupOpen && (
              <UserPopup className="absolute top-[54px] right-4" />
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ MOBILE BOTTOM NAV ═════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-[#ebebeb] bg-white/95 backdrop-blur-xl">
        <div className="flex items-center justify-around px-1 py-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
          {NAV_ITEMS.map(({ to, icon: Icon, label, badgeKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/portal'}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center gap-0.5 min-w-[60px] rounded-xl px-2 py-2 transition-all duration-150
                ${isActive ? 'text-[#111]' : 'text-[#b0b0b0]'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />

                    {badgeKey && badges[badgeKey] > 0 && (
                      <span className="absolute -top-1 -right-1.5 h-[14px] min-w-[14px] px-0.5 flex items-center justify-center rounded-full bg-[#0f6e56] text-white text-[8px] font-bold">
                        {badges[badgeKey] > 9 ? '9+' : badges[badgeKey]}
                      </span>
                    )}
                  </div>
                  <span className="text-[9.5px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  )
}