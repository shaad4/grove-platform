import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import requestsApi from '../../api/requests.api'
import {
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles,
  ChevronRight,
  AlertCircle,
  RotateCcw,
  FileText,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { useBadges } from '../../hooks/useBadges'
import ClientLayout from '../../components/layout/ClientLayout'
import NewRequestModal from '../../components/modals/NewRequestModal'

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG = {
  received: {
    label: 'Submitted',
    color: '#6b7280',
    bg: '#f3f4f6',
    border: '#e5e7eb',
    dot: '#9ca3af',
    step: 0,
  },
  in_review: {
    label: 'In review',
    color: '#92400e',
    bg: '#fffbeb',
    border: '#fde68a',
    dot: '#f59e0b',
    step: 1,
  },
  in_progress: {
    label: 'In progress',
    color: '#3730a3',
    bg: '#eef2ff',
    border: '#c7d2fe',
    dot: '#6366f1',
    step: 2,
  },
  delivered: {
    label: 'Ready for you',
    color: '#065f46',
    bg: '#ecfdf5',
    border: '#6ee7b7',
    dot: '#10b981',
    step: 3,
  },
  closed: {
    label: 'Completed',
    color: '#4b5563',
    bg: '#f9fafb',
    border: '#e5e7eb',
    dot: '#d1d5db',
    step: 4,
  },
}

// Statuses considered "active" — closed goes to bottom when sorting
const STATUS_ORDER = ['in_progress', 'in_review', 'received', 'delivered', 'closed']

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'open',      label: 'Active' },
  { key: 'delivered', label: 'Needs review' },
  { key: 'closed',    label: 'Completed' },
]

// ─── Helpers ──────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'yesterday' : `${d}d ago`
}

// ─── Skeleton ─────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-[#f1f3f1] ${className}`} />
}

// ─── Top welcome bar ──────────────────────────────────────────
function WelcomeBar({ firstName, providerName, logoUrl, onNew }) {
  const initials = providerName
    ? providerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt={providerName} className="h-9 w-9 rounded-xl object-cover" />
        ) : (
          <div className="h-9 w-9 rounded-xl bg-[#141a14] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {initials}
          </div>
        )}
        <div>
          <p className="text-[11px] text-[#9ea89e] font-medium uppercase tracking-widest">{providerName}</p>
          <h1 className="text-[20px] font-semibold text-[#141a14] leading-tight tracking-[-0.3px]">
            Hey {firstName} 👋
          </h1>
        </div>
      </div>

      <button
        onClick={onNew}
        className="flex items-center gap-2 rounded-xl bg-[#0f6e56] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0c5b47] active:scale-[0.98] transition-all duration-150 shadow-sm"
      >
        <Plus size={14} />
        New request
      </button>
    </div>
  )
}

// ─── Summary cards ────────────────────────────────────────────
function SummaryCards({ active, needsReview, completed, loading }) {
  const cards = [
    {
      label: 'Active',
      value: active,
      icon: Clock,
      iconColor: 'text-[#6366f1]',
      iconBg: 'bg-[#eef2ff]',
      accent: false,
    },
    {
      label: 'Needs your review',
      value: needsReview,
      icon: Zap,
      iconColor: needsReview > 0 ? 'text-[#0f6e56]' : 'text-[#9ea89e]',
      iconBg: needsReview > 0 ? 'bg-[#ecfdf5]' : 'bg-[#f5f7f5]',
      accent: needsReview > 0,
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle2,
      iconColor: 'text-[#9ea89e]',
      iconBg: 'bg-[#f5f7f5]',
      accent: false,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {cards.map(card => (
        <div
          key={card.label}
          className={`rounded-2xl border p-4 transition-all ${
            card.accent ? 'border-[#6ee7b7] bg-[#f0fdf9]' : 'border-[#e8eae8] bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
              <card.icon size={14} className={card.iconColor} />
            </div>
            {loading
              ? <Skeleton className="h-7 w-8" />
              : (
                <span className={`text-[26px] font-semibold leading-none tracking-tight ${
                  card.accent ? 'text-[#0f6e56]' : 'text-[#141a14]'
                }`}>
                  {card.value}
                </span>
              )
            }
          </div>
          <p className="text-[11px] text-[#9ea89e] font-medium">{card.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Request row ──────────────────────────────────────────────
function RequestRow({ req, onClick, isNew }) {
  const cfg        = STATUS_CONFIG[req.status] || STATUS_CONFIG.received
  const isDelivered = req.status === 'delivered'

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left group flex items-center gap-4 rounded-2xl border px-4 py-3.5 bg-white
        transition-all duration-300 hover:shadow-sm
        ${isNew ? 'animate-slide-in' : ''}
        ${isDelivered
          ? 'border-[#6ee7b7] hover:border-[#34d399]'
          : 'border-[#e8eae8] hover:border-[#c8cec8]'
        }
      `}
    >
      {/* Status dot */}
      <div
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: cfg.dot }}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[13.5px] font-medium text-[#141a14] truncate">{req.title}</p>
          {isDelivered && (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-[#065f46] bg-[#ecfdf5] border border-[#6ee7b7] rounded px-1.5 py-0.5">
              Action needed
            </span>
          )}
          {req._hasUnreadMessage && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-[#6366f1]" title="New message" />
          )}
        </div>
        <p className="text-[11px] text-[#9ea89e]">{timeAgo(req.updated_at)}</p>
      </div>

      {/* Status pill */}
      <span
        className="shrink-0 text-[11px] font-medium rounded-full px-2.5 py-1 border transition-all duration-300"
        style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
      >
        {cfg.label}
      </span>

      {/* Arrow */}
      <ChevronRight
        size={14}
        className="shrink-0 text-[#c8cec8] group-hover:text-[#0f6e56] transition-colors"
      />
    </button>
  )
}

// ─── Empty state ──────────────────────────────────────────────
function EmptyState({ onNew, providerName }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border border-dashed border-[#e8eae8] bg-white">
      <div className="h-12 w-12 rounded-2xl bg-[#f5f7f5] border border-dashed border-[#d9ded9] flex items-center justify-center mb-4">
        <Sparkles size={18} className="text-[#9ea89e]" />
      </div>
      <p className="text-[15px] font-semibold text-[#141a14] mb-1">No requests yet</p>
      <p className="text-[12px] text-[#9ea89e] mb-5 max-w-[220px] leading-relaxed">
        Submit your first request to start working with {providerName}.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-1.5 rounded-xl bg-[#0f6e56] px-4 py-2.5 text-[12.5px] font-semibold text-white hover:bg-[#0c5b47] active:scale-[0.98] transition-all"
      >
        <Plus size={13} />
        Submit a request
      </button>
    </div>
  )
}

// ─── Status guide (right panel) ───────────────────────────────
function StatusGuide() {
  const steps = [
    { status: 'received',    icon: FileText },
    { status: 'in_review',   icon: AlertCircle },
    { status: 'in_progress', icon: RotateCcw },
    { status: 'delivered',   icon: Zap },
    { status: 'closed',      icon: CheckCircle2 },
  ]

  return (
    <div className="rounded-2xl border border-[#e8eae8] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9ea89e] mb-4">
        Request lifecycle
      </p>
      <div className="space-y-1">
        {steps.map(({ status, icon: Icon }) => {
          const cfg = STATUS_CONFIG[status]
          return (
            <div key={status} className="flex items-center gap-3 py-2">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <Icon size={12} style={{ color: cfg.dot }} />
              </div>
              <p className="text-[12.5px] font-medium text-[#4a544a]">{cfg.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Quick action card ────────────────────────────────────────
function QuickActions({ onNew, needsReview, requests, navigate }) {
  const deliveredReq = requests.find(r => r.status === 'delivered')

  return (
    <div className="space-y-2">
      {needsReview > 0 && deliveredReq && (
        <button
          onClick={() => navigate(`/my-requests/${deliveredReq.id}`)}
          className="w-full flex items-center gap-3 rounded-2xl border border-[#6ee7b7] bg-[#f0fdf9] px-4 py-3.5 hover:bg-[#ecfdf5] transition-colors text-left"
        >
          <div className="h-8 w-8 rounded-lg bg-[#ecfdf5] border border-[#6ee7b7] flex items-center justify-center shrink-0">
            <Zap size={13} className="text-[#0f6e56]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-[#065f46]">Review delivery</p>
            <p className="text-[11px] text-[#059669] truncate mt-0.5">{deliveredReq.title}</p>
          </div>
          <ArrowUpRight size={13} className="text-[#059669] shrink-0" />
        </button>
      )}

      <button
        onClick={onNew}
        className="w-full flex items-center gap-3 rounded-2xl border border-[#e8eae8] bg-white px-4 py-3.5 hover:border-[#0f6e56] hover:bg-[#f7fdfb] transition-colors text-left group"
      >
        <div className="h-8 w-8 rounded-lg bg-[#f5f7f5] flex items-center justify-center shrink-0 group-hover:bg-[#edf7f3]">
          <Plus size={13} className="text-[#9ea89e] group-hover:text-[#0f6e56]" />
        </div>
        <div className="flex-1">
          <p className="text-[12.5px] font-semibold text-[#141a14]">New request</p>
          <p className="text-[11px] text-[#9ea89e] mt-0.5">Describe what you need</p>
        </div>
        <ArrowUpRight size={13} className="text-[#c8cec8] group-hover:text-[#0f6e56] shrink-0" />
      </button>
    </div>
  )
}

// ─── Live update toast ────────────────────────────────────────
function LiveToast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0">
      <div className="flex items-center gap-3 rounded-2xl border border-[#6ee7b7] bg-white shadow-lg shadow-black/[0.06] px-4 py-3">
        <div className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse shrink-0" />
        <p className="text-[13px] font-medium text-[#065f46]">{message}</p>
      </div>
    </div>
  )
}

// ─── Sort helper — active requests first, closed last ─────────
function sortRequests(reqs) {
  return [...reqs].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status)
    const bi = STATUS_ORDER.indexOf(b.status)
    if (ai !== bi) return ai - bi
    // within same status: newest updated_at first
    return new Date(b.updated_at) - new Date(a.updated_at)
  })
}

// ─── Page ─────────────────────────────────────────────────────
export default function ClientDashboard() {
  const { user, tenant } = useAuth()
  const navigate = useNavigate()
  const { registerPortalListener } = useBadges()

  const [filter,   setFilter]   = useState('all')
  const [showNew,  setShowNew]  = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [requests, setRequests] = useState([])

  // tracks which request IDs were just updated (for flash animation)
  const [updatedIds, setUpdatedIds] = useState(new Set())
  // live toast message
  const [toast, setToast] = useState(null)

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const res = await requestsApi.list()
      const raw = res.data.data?.requests || []
      setRequests(sortRequests(raw))
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  // ── Real-time portal listener ──────────────────────────────────────────────
  useEffect(() => {
    const unregister = registerPortalListener((msg) => {
      if (msg.type === 'status_change') {
        setRequests((prev) => {
          const updated = prev.map((r) =>
            r.id === msg.request_id
              ? { ...r, status: msg.new_status, updated_at: msg.updated_at ?? new Date().toISOString() }
              : r
          )
          return sortRequests(updated)
        })

        // flash the updated card
        setUpdatedIds((s) => new Set([...s, msg.request_id]))
        setTimeout(() => {
          setUpdatedIds((s) => {
            const next = new Set(s)
            next.delete(msg.request_id)
            return next
          })
        }, 2000)

        // show toast
        const cfg = STATUS_CONFIG[msg.new_status]
        if (cfg) setToast(`Request status updated to "${cfg.label}"`)
      }

      if (msg.type === 'new_message') {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === msg.request_id
              ? { ...r, _hasUnreadMessage: true, updated_at: new Date().toISOString() }
              : r
          )
        )
        setToast('New message from your provider')
      }

      if (msg.type === 'files_delivered') {
        setRequests((prev) => {
          const updated = prev.map((r) =>
            r.id === msg.request_id
              ? { ...r, status: 'delivered', updated_at: new Date().toISOString() }
              : r
          )
          return sortRequests(updated)
        })
        setToast('Your delivery is ready for review')
      }
    })

    return unregister
  }, [registerPortalListener])

  const firstName    = user?.display_name?.split(' ')[0] || 'there'
  const providerName = tenant?.name || 'Your Portal'
  const logoUrl      = tenant?.logo_url || null

  const activeCount    = requests.filter(r => !['closed'].includes(r.status)).length
  const completedCount = requests.filter(r => r.status === 'closed').length
  const reviewCount    = requests.filter(r => r.status === 'delivered').length

  const filtered = useMemo(() => {
    let list = requests
    if (filter === 'open')      list = requests.filter(r => !['delivered', 'closed'].includes(r.status))
    if (filter === 'delivered') list = requests.filter(r => r.status === 'delivered')
    if (filter === 'closed')    list = requests.filter(r => r.status === 'closed')
    return list
  }, [filter, requests])

  return (
    <ClientLayout>
      {/* slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0.6; transform: translateY(-4px); }
          to   { opacity: 1;   transform: translateY(0); }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
      `}</style>

      {/* Mobile spacer for top nav */}
      <div className="pt-[57px] lg:pt-0" />

      <div className="min-h-screen bg-[#f7f8f7]">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">

          <WelcomeBar
            firstName={firstName}
            providerName={providerName}
            logoUrl={logoUrl}
            onNew={() => setShowNew(true)}
          />

          <SummaryCards
            active={activeCount}
            needsReview={reviewCount}
            completed={completedCount}
            loading={loading}
          />

          <div className="flex gap-5 items-start">

            {/* Left — request list */}
            <div className="flex-1 min-w-0">

              {/* Section header + filters */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-[#141a14]">Requests</h2>
                  {!loading && requests.length > 0 && (
                    <span className="text-[12px] text-[#9ea89e]">{requests.length} total</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {FILTERS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`rounded-lg px-3 py-1.5 text-[11.5px] font-medium transition-all whitespace-nowrap ${
                        filter === f.key
                          ? 'bg-[#141a14] text-white'
                          : 'text-[#4a544a] hover:bg-[#eceeed]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Needs review banner */}
              {reviewCount > 0 && filter !== 'closed' && (
                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[#6ee7b7] bg-[#f0fdf9] px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse shrink-0" />
                  <p className="text-[12.5px] font-medium text-[#065f46] flex-1">
                    {reviewCount === 1
                      ? '1 delivery is ready for your review.'
                      : `${reviewCount} deliveries are ready for your review.`}
                  </p>
                  <button
                    onClick={() => setFilter('delivered')}
                    className="text-[11.5px] font-semibold text-[#0f6e56] hover:underline shrink-0"
                  >
                    View →
                  </button>
                </div>
              )}

              {/* Request list */}
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[68px]" />)}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState onNew={() => setShowNew(true)} providerName={providerName} />
              ) : (
                <div className="space-y-2">
                  {filtered.map(r => (
                    <RequestRow
                      key={r.id}
                      req={r}
                      isNew={updatedIds.has(r.id)}
                      onClick={() => navigate(`/my-requests/${r.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="hidden xl:flex flex-col gap-4 w-[220px] shrink-0">
              <QuickActions
                onNew={() => setShowNew(true)}
                needsReview={reviewCount}
                requests={requests}
                navigate={navigate}
              />
              <StatusGuide />
            </div>

          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="fixed bottom-[84px] right-4 z-30 lg:hidden">
        <button
          onClick={() => setShowNew(true)}
          className="h-14 flex items-center gap-2 rounded-2xl bg-[#0f6e56] px-5 text-[13px] font-semibold text-white shadow-lg shadow-black/10 hover:bg-[#0c5b47] active:scale-[0.96] transition-all duration-150"
        >
          <Plus size={15} />
          New request
        </button>
      </div>

      {/* Live toast */}
      {toast && (
        <LiveToast message={toast} onDismiss={() => setToast(null)} />
      )}

      {showNew && (
        <NewRequestModal
          providerName={providerName}
          onClose={() => setShowNew(false)}
          onSuccess={(newReq) => {
            setShowNew(false)
            fetchRequests()
            navigate(`/my-requests/${newReq.id}`)
          }}
        />
      )}
    </ClientLayout>
  )
}