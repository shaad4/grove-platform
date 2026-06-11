import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  X,
  CheckCheck,
  RefreshCw,
  MessageSquare,
  Package,
  CheckCircle2,
  PlusCircle,
  Paperclip,
} from 'lucide-react'
import { useBadges } from '../../hooks/useBadges'

// ── helpers ───────────────────────────────────────────────────

function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function groupByDay(notifications) {
  const groups = {}
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  for (const n of notifications) {
    const d = new Date(n.created_at); d.setHours(0, 0, 0, 0)
    let label
    if (d.getTime() === today.getTime())          label = 'TODAY'
    else if (d.getTime() === yesterday.getTime()) label = 'YESTERDAY'
    else label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' }).toUpperCase()

    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  }
  return groups
}

// ── event config — client light theme ────────────────────────

const EVENT_CONFIG = {
  new_request:     { Icon: PlusCircle,    bg: 'bg-[#f0fdf9]', iconColor: 'text-[#0f6e56]', border: 'border-[#d1fae5]' },
  status_change:   { Icon: RefreshCw,     bg: 'bg-[#f0fdf9]', iconColor: 'text-[#0f6e56]', border: 'border-[#d1fae5]' },
  new_message:     { Icon: MessageSquare, bg: 'bg-[#f5f3ff]', iconColor: 'text-[#7c3aed]', border: 'border-[#ede9fe]' },
  files_delivered: { Icon: Package,       bg: 'bg-[#fffbeb]', iconColor: 'text-[#d97706]', border: 'border-[#fde68a]' },
  invite_accepted: { Icon: CheckCircle2,  bg: 'bg-[#f0fdf9]', iconColor: 'text-[#0f6e56]', border: 'border-[#d1fae5]' },
}

const STATUS_META = {
  received:    { label: 'Submitted',   bg: 'bg-[#f3f4f6]',  text: 'text-[#6b7280]' },
  in_review:   { label: 'In Review',   bg: 'bg-[#fffbeb]',  text: 'text-[#92400e]' },
  in_progress: { label: 'In Progress', bg: 'bg-[#eef2ff]',  text: 'text-[#3730a3]' },
  delivered:   { label: 'Ready',       bg: 'bg-[#ecfdf5]',  text: 'text-[#065f46]' },
  closed:      { label: 'Done',        bg: 'bg-[#f9fafb]',  text: 'text-[#4b5563]' },
}

function parseStatusTransition(notification) {
  if (notification.event_type !== 'status_change') return null
  const match = notification.body?.match(/(\w[\w ]+)\s*→\s*(\w[\w ]+)/)
  if (match) {
    const fromKey = Object.entries(STATUS_META).find(([, v]) =>
      v.label.toLowerCase() === match[1].trim().toLowerCase()
    )?.[0]
    const toKey = Object.entries(STATUS_META).find(([, v]) =>
      v.label.toLowerCase() === match[2].trim().toLowerCase()
    )?.[0]
    if (fromKey && toKey) return { from: fromKey, to: toKey }
  }
  return null
}

function StatusPills({ from, to }) {
  const fromMeta = STATUS_META[from]
  const toMeta   = STATUS_META[to]
  if (!fromMeta || !toMeta) return null
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${fromMeta.bg} ${fromMeta.text}`}>
        {fromMeta.label}
      </span>
      <span className="text-[10px] text-[#9ca3af]">→</span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${toMeta.bg} ${toMeta.text}`}>
        {toMeta.label}
      </span>
    </div>
  )
}

// ── notification item ─────────────────────────────────────────

function NotificationItem({ notification, onRead }) {
  const navigate = useNavigate()
  const cfg        = EVENT_CONFIG[notification.event_type] || EVENT_CONFIG.status_change
  const { Icon, bg, iconColor, border } = cfg
  const transition = parseStatusTransition(notification)

  const snippet   = notification.event_type === 'new_message' ? notification.body : null
  const fileCount = notification.event_type === 'files_delivered' && notification.metadata?.file_count
    ? notification.metadata.file_count : null

  const handleClick = () => {
    if (!notification.is_read) onRead(notification.id)
    if (notification.related_request_id) {
      navigate(`/my-requests/${notification.related_request_id}`)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[#fafafa] border-b border-[#f5f5f5] last:border-none ${
        !notification.is_read ? 'bg-[#fafffe]' : 'bg-white'
      }`}
    >
      {/* icon */}
      <div className="relative shrink-0 mt-0.5">
        <div className={`h-8 w-8 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
          <Icon size={14} className={iconColor} />
        </div>
        {!notification.is_read && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#0f6e56] border-2 border-white" />
        )}
      </div>

      {/* content */}
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] text-[#111] leading-snug font-medium">
          {notification.title}
        </p>
        <p className="text-[11px] text-[#9ca3af] mt-0.5">
          {relativeTime(notification.created_at)}
        </p>
        {snippet && (
          <p className="text-[11px] text-[#6b7280] italic mt-1 line-clamp-1">
            "{snippet}"
          </p>
        )}
        {fileCount && (
          <p className="flex items-center gap-1 text-[11px] text-[#9ca3af] mt-1">
            <Paperclip size={9} />
            {fileCount} file{fileCount !== 1 ? 's' : ''} delivered
          </p>
        )}
        {transition && <StatusPills from={transition.from} to={transition.to} />}
      </div>
    </button>
  )
}

// ── main bell ─────────────────────────────────────────────────

export default function ClientNotificationBell({ collapsed = false }) {
  const [open, setOpen]   = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const bellRef     = useRef(null)
  const dropdownRef = useRef(null)
  const navigate    = useNavigate()

  const {
    unreadCount,
    notifications,
    notifLoaded,
    markRead,
    markAllRead,
    loadNotifications,
  } = useBadges()

  // ── compute dropdown position from bell button's actual rect ──────────────
  const computePosition = useCallback(() => {
    if (!bellRef.current) return {}
    const rect = bellRef.current.getBoundingClientRect()
    const vpW  = window.innerWidth
    const vpH  = window.innerHeight
    const dropW = 340
    const dropH = 480

    // prefer opening to the right of the bell
    let left = rect.right + 8
    let top  = rect.top

    // if it would clip the right edge, flip left
    if (left + dropW > vpW - 8) left = rect.left - dropW - 8

    // if it would clip the bottom, push up
    if (top + dropH > vpH - 8) top = vpH - dropH - 8

    // clamp top
    if (top < 8) top = 8

    return { position: 'fixed', top, left, width: dropW, maxHeight: dropH }
  }, [])

  // recompute on open
  useEffect(() => {
    if (open) {
      setDropdownStyle(computePosition())
      loadNotifications()
    }
  }, [open, computePosition, loadNotifications])

  // close on outside click
  useEffect(() => {
    function handler(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        bellRef.current    && !bellRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const grouped   = groupByDay(notifications)
  const groupKeys = Object.keys(grouped)

  return (
    <>
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        className={`
          relative flex items-center justify-center rounded-xl transition-all duration-150
          h-9 w-9
          ${open
            ? 'bg-[#edf7f3] text-[#0f6e56]'
            : 'text-[#6b7280] hover:bg-[#f5f5f5] hover:text-[#111]'
          }
        `}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#0f6e56] px-1 text-[9px] font-bold text-white border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown — portal-rendered so it's never clipped by sidebar overflow */}
      {open && (
        <div
          ref={dropdownRef}
          className="z-[300] rounded-2xl border border-[#ebebeb] bg-white shadow-xl shadow-black/[0.07] overflow-hidden flex flex-col"
          style={dropdownStyle}
        >
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#111]">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold bg-[#0f6e56] text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11.5px] font-medium text-[#0f6e56] hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-[#f5f5f5] transition-colors"
              >
                <X size={13} className="text-[#9ca3af]" />
              </button>
            </div>
          </div>

          {/* body */}
          <div className="overflow-y-auto flex-1">
            {!notifLoaded ? (
              <div className="px-4 py-5 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-xl bg-[#f3f4f6] shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-[#f3f4f6] rounded w-3/4" />
                      <div className="h-2.5 bg-[#f3f4f6] rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="h-10 w-10 rounded-2xl bg-[#f0fdf9] border border-[#d1fae5] flex items-center justify-center mb-3">
                  <Bell size={16} className="text-[#0f6e56]" />
                </div>
                <p className="text-[13px] font-semibold text-[#111]">All caught up</p>
                <p className="text-[11.5px] text-[#9ca3af] mt-1">No notifications yet.</p>
              </div>
            ) : (
              groupKeys.map(label => (
                <div key={label}>
                  <div className="px-4 py-1.5 bg-[#fafafa] border-b border-[#f5f5f5]">
                    <span className="text-[9.5px] font-bold tracking-widest text-[#9ca3af]">
                      {label}
                    </span>
                  </div>
                  {grouped[label].map(n => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onRead={(id) => {
                        markRead(id)
                        setOpen(false)
                      }}
                    />
                  ))}
                </div>
              ))
            )}
          </div>

          {/* footer */}
          {notifications.length > 0 && (
            <div className="shrink-0 border-t border-[#f0f0f0] px-4 py-2.5 bg-[#fafafa]">
              <div className="flex items-center justify-center gap-1.5">
                <CheckCheck size={12} className="text-[#0f6e56]" />
                <p className="text-[11.5px] text-[#6b7280]">
                  {unreadCount > 0
                    ? <><span className="font-semibold text-[#0f6e56]">{unreadCount}</span> unread</>
                    : 'All caught up'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}