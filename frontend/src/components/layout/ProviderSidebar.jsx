import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Activity,
  Settings,
  LogOut,
  ChevronDown,
  PanelLeftClose,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import PortalSwitcher from './PortalSwitcher'

import ProviderSettingsModal from '../modals/ProviderSettingsModal'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    to: '/clients',
    icon: Users,
    label: 'Clients',
    badgeKey: 'clients',
  },
  {
    to: '/requests',
    icon: FolderKanban,
    label: 'Requests',
    badgeKey: 'requests',
  },
  {
    to: '/activity',
    icon: Activity,
    label: 'Activity',
  },
]

export default function ProviderSidebar({
  badges = {},
}) {
  const { user, logout } = useAuth()

  const [isCollapsed, setIsCollapsed] =
    useState(() => {
      const saved = localStorage.getItem(
        'provider-sidebar-collapsed'
      )

      return saved === 'true'
    })

  const [isPopupOpen, setIsPopupOpen] =
    useState(false)

  const [showSettings, setShowSettings] =
    useState(false)

  const popupRef = useRef(null)

  const initials = user?.display_name
    ? user.display_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '??'

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popupRef.current &&
        !popupRef.current.contains(
          event.target
        )
      ) {
        setIsPopupOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'provider-sidebar-collapsed',
      isCollapsed
    )
  }, [isCollapsed])

  return (
    <>
      {/* ───────────────── Desktop Sidebar ───────────────── */}
      <aside
        className={`
          hidden lg:flex flex-col

          h-screen

          sticky top-0

          shrink-0
          select-none

          transition-all duration-300 ease-out

          border-r border-white/[0.04]

          bg-gradient-to-b
          from-[#071A15]
          to-[#04110D]

          shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]

          ${
            isCollapsed
              ? 'w-[72px]'
              : 'w-[240px]'
          }
        `}
      >
       {/* ───────────────── Header ───────────────── */}
        <div
          className={`flex items-center pt-5 pb-6 ${
            isCollapsed
              ? 'px-0 justify-center'
              : 'px-4 justify-between'
          }`}
        >
          {!isCollapsed && (
            <div className="flex-1 min-w-0 mr-2">
              <PortalSwitcher />
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={
              isCollapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
            className="
              p-1.5 rounded-lg

              text-white/30

              hover:text-white/80
              hover:bg-white/[0.05]

              transition-all duration-200
            "
          >
            <PanelLeftClose
              size={17}
              className={`
                transition-transform duration-300

                ${
                  isCollapsed
                    ? 'rotate-180 opacity-60'
                    : ''
                }
              `}
            />
          </button>
        </div>
        {/* ───────────────── Navigation ───────────────── */}
        <nav className="px-3 flex-1 space-y-1.5">
          {NAV_ITEMS.map(
            ({
              to,
              icon: Icon,
              label,
              badgeKey,
            }) => (
              <NavLink
                key={to}
                to={to}
                title={
                  isCollapsed
                    ? label
                    : undefined
                }
                className={({
                  isActive,
                }) =>
                  `
                  relative flex items-center rounded-xl text-[14px]

                  transition-all duration-200

                  ${
                    isCollapsed
                      ? 'justify-center py-2.5'
                      : 'gap-3 px-3 py-2.5'
                  }

                  ${
                    isActive
                      ? `
                        bg-white/[0.07]

                        text-white

                        font-medium

                        shadow-lg shadow-black/20

                        before:absolute
                        before:left-0
                        before:top-2
                        before:bottom-2
                        before:w-[3px]
                        before:rounded-full
                        before:bg-emerald-400
                      `
                      : `
                        text-white/45

                        hover:text-white/85
                        hover:bg-white/[0.03]
                        hover:translate-x-[1px]
                      `
                  }
                `
                }
              >
                <Icon
                  size={17}
                  className="shrink-0 opacity-80"
                />

                {!isCollapsed && (
                  <span className="flex-1 tracking-wide">
                    {label}
                  </span>
                )}

                {!isCollapsed &&
                  badgeKey &&
                  badges[
                    badgeKey
                  ] != null && (
                    <span
                      className="
                        text-[11px]

                        bg-white/[0.08]

                        text-white/55

                        px-1.5 py-0.5

                        rounded-md

                        font-normal
                      "
                    >
                      {
                        badges[
                          badgeKey
                        ]
                      }
                    </span>
                  )}
              </NavLink>
            )
          )}
        </nav>

        {/* ───────────────── Footer ───────────────── */}
        <div
          className="p-4 relative"
          ref={popupRef}
        >
          <div
            onClick={() =>
              setIsPopupOpen(
                !isPopupOpen
              )
            }
            className={`
              flex items-center rounded-xl cursor-pointer

              transition-all duration-200

              hover:bg-white/[0.04]

              p-1.5

              ${
                isCollapsed
                  ? 'justify-center'
                  : 'justify-between gap-3'
              }

              ${
                isPopupOpen
                  ? 'bg-white/[0.04]'
                  : ''
              }
            `}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="
                  h-8 w-8
                  shrink-0
                  rounded-full
                  overflow-hidden
                  bg-[#0f6e56]
                "
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="
                      w-full h-full
                      flex items-center justify-center
                      text-[11px]
                      font-semibold
                      text-white
                    "
                  >
                    {initials}
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <p
                    className="
                      truncate text-[13px]
                      text-white/90
                      font-medium leading-tight
                    "
                  >
                    {user?.display_name ||
                      'clientonly'}
                  </p>

                  <p className="text-[11px] text-white/30 mt-0.5">
                    Free plan
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <ChevronDown
                size={14}
                className={`
                  text-white/30 mr-1

                  transition-transform duration-200

                  ${
                    isPopupOpen
                      ? 'rotate-180'
                      : ''
                  }
                `}
              />
            )}
          </div>

          {/* ───────────────── Popup ───────────────── */}
          {isPopupOpen && (
            <div
              className="
                absolute left-4 bottom-[72px]

                w-[200px]

                z-50

                rounded-2xl

                border border-white/[0.08]

                bg-[#0A231C]/95

                backdrop-blur-xl

                shadow-2xl shadow-black/40

                overflow-hidden
              "
            >
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="truncate text-[13px] font-medium text-white">
                  {user?.display_name ||
                    'clientonly'}
                </p>

                <p className="truncate text-[11px] text-white/40 mt-0.5">
                  {user?.email ||
                    'clientonly@yopmail.com'}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsPopupOpen(false)
                  setShowSettings(true)
                }}
                className="
                  flex items-center gap-3

                  w-full text-left

                  px-4 py-2.5

                  text-[13px]
                  text-white/65

                  hover:bg-white/[0.04]
                  hover:text-white

                  transition-all duration-200
                "
              >

                <Settings
                  size={15}
                  className="opacity-60"
                />

                <span>Settings</span>

              </button>

              <div className="border-t border-white/[0.06]" />

              <button
                onClick={() => {
                  setIsPopupOpen(
                    false
                  )
                  logout()
                }}
                className="
                  flex items-center gap-3

                  w-full text-left

                  px-4 py-2.5

                  text-[13px]
                  text-red-400

                  hover:bg-red-500/[0.08]

                  transition-all duration-200
                "
              >
                <LogOut
                  size={15}
                  className="opacity-80"
                />

                <span className="font-medium">
                  Sign out
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ───────────────── Mobile Top Bar ───────────────── */}
      <div
        className="
          lg:hidden

          fixed top-0 left-0 right-0

          z-40

          border-b border-white/[0.06]

          bg-[#071A15]/95

          backdrop-blur-xl
        "
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Portal Switcher */}
          <div className="min-w-0 flex-1">
            <PortalSwitcher />
          </div>

          {/* Profile */}
          <div
            onClick={() =>
              setIsPopupOpen(
                !isPopupOpen
              )
            }
            className="
              ml-3
              h-9 w-9
              shrink-0
              rounded-full
              overflow-hidden
              bg-[#0f6e56]
              cursor-pointer
            "
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="
                  w-full h-full
                  flex items-center justify-center
                  text-[11px]
                  font-semibold
                  text-white
                "
              >
                {initials}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ───────────────── Mobile Profile Popup ───────────────── */}
      {isPopupOpen && (
        <div
          className="
            lg:hidden

            fixed top-[72px] right-4

            w-[220px]

            z-50

            rounded-2xl

            border border-white/[0.08]

            bg-[#0A231C]/95

            backdrop-blur-xl

            shadow-2xl shadow-black/40

            overflow-hidden
          "
        >
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="truncate text-[13px] font-medium text-white">
              {user?.display_name ||
                'clientonly'}
            </p>

            <p className="truncate text-[11px] text-white/40 mt-0.5">
              {user?.email ||
                'clientonly@yopmail.com'}
            </p>
          </div>

          <button
            onClick={() => {
              setIsPopupOpen(false)
              setShowSettings(true)
            }}
            className="
              flex items-center gap-3

              w-full text-left

              px-4 py-2.5

              text-[13px]
              text-white/65

              hover:bg-white/[0.04]
              hover:text-white

              transition-all duration-200
            "
          >
            <Settings
              size={15}
              className="opacity-60"
            />

            <span>Settings</span>
          </button>

          <div className="border-t border-white/[0.06]" />

          <button
            onClick={() => {
              setIsPopupOpen(false)
              logout()
            }}
            className="
              flex items-center gap-3

              w-full text-left

              px-4 py-2.5

              text-[13px]
              text-red-400

              hover:bg-red-500/[0.08]
            "
          >
            <LogOut
              size={15}
              className="opacity-80"
            />

            <span className="font-medium">
              Sign out
            </span>
          </button>
        </div>
      )}

      {/* ───────────────── Mobile Bottom Nav ───────────────── */}
      <div
        className="
          fixed bottom-0 left-0 right-0

          z-50

          lg:hidden

          border-t border-white/[0.06]

          bg-[#071A15]/95

          backdrop-blur-xl
        "
      >
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(
            ({
              to,
              icon: Icon,
              label,
            }) => (
              <NavLink
                key={to}
                to={to}
                className={({
                  isActive,
                }) =>
                  `
                  flex flex-col items-center justify-center

                  gap-1

                  min-w-[64px]

                  rounded-xl

                  px-3 py-2

                  transition-all duration-200

                  ${
                    isActive
                      ? `
                        text-white
                        bg-white/[0.06]
                      `
                      : `
                        text-white/45
                      `
                  }
                `
                }
              >
                <Icon size={18} />

                <span className="text-[10px]">
                  {label}
                </span>
              </NavLink>
            )
          )}
        </div>
      </div>
      {showSettings && (
        <ProviderSettingsModal
          open={showSettings}
          onClose={() =>
            setShowSettings(false)
          }
        />
      )}
    </>
  )
}