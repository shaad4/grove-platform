import { useState, useMemo, useEffect, useCallback } from 'react'
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
  MessageSquareDot,
  ChevronLeft
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { useBadges } from '../../hooks/useBadges'
import ClientLayout from '../../components/layout/ClientLayout'
import NewRequestModal from '../../components/modals/NewRequestModal'

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG = {
  received: {
    label: 'Submitted',
    color: '#4b5563',
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
    label: 'Action Needed',
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
  { key: 'all',       label: 'All Requests' },
  { key: 'open',      label: 'Active' },
  { key: 'delivered', label: 'Needs Review' },
  { key: 'closed',    label: 'Completed' },
]

const ITEMS_PER_PAGE = 4; // Pagination limit

// ─── Helpers ──────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return 'Unknown'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Yesterday' : `${d}d ago`
}

function sortRequests(reqs) {
  return [...reqs].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status)
    const bi = STATUS_ORDER.indexOf(b.status)
    if (ai !== bi) return ai - bi
    return new Date(b.updated_at) - new Date(a.updated_at)
  })
}

// ─── Skeleton ─────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
}

// ─── Top welcome bar ──────────────────────────────────────────
function WelcomeBar({ firstName, providerName, logoUrl, onNew }) {
  const initials = providerName
    ? providerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <img src={logoUrl} alt={providerName} className="h-14 w-14 rounded-2xl object-cover shadow-sm" />
        ) : (
          <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-lg font-bold text-white shrink-0 shadow-sm">
            {initials}
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">{providerName}</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-none">
            Welcome back, {firstName} 👋
          </h1>
        </div>
      </div>

      <button
        onClick={onNew}
        className="hidden sm:flex items-center gap-2 rounded-xl bg-[#0f6e56] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c5b47] active:scale-95 transition-all shadow-md shadow-[#0f6e56]/20"
      >
        <Plus size={16} />
        New Request
      </button>
    </div>
  )
}

// ─── Summary cards ────────────────────────────────────────────
function SummaryCards({ active, needsReview, completed, loading }) {
  const cards = [
    {
      label: 'Active Requests',
      value: active,
      icon: Clock,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      border: 'border-gray-200',
    },
    {
      label: 'Needs Review',
      value: needsReview,
      icon: Zap,
      iconColor: needsReview > 0 ? 'text-emerald-600' : 'text-gray-400',
      iconBg: needsReview > 0 ? 'bg-emerald-50' : 'bg-gray-50',
      border: needsReview > 0 ? 'border-emerald-200 ring-1 ring-emerald-50' : 'border-gray-200',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle2,
      iconColor: 'text-gray-500',
      iconBg: 'bg-gray-50',
      border: 'border-gray-200',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map(card => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all ${card.border}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
              <card.icon size={18} className={card.iconColor} />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-10" />
            ) : (
              <span className="text-3xl font-bold text-gray-900 tracking-tight">
                {card.value}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500">{card.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Request row ──────────────────────────────────────────────
function RequestRow({ req, onClick, isNew }) {
  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.received
  const isDelivered = req.status === 'delivered'

  return (
    <div
      onClick={onClick}
      className={`
        group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border bg-white p-4 
        cursor-pointer transition-all duration-200 hover:shadow-md
        ${isNew ? 'animate-slide-in ring-2 ring-[#0f6e56]/20' : ''}
        ${isDelivered ? 'border-emerald-200 hover:border-emerald-400' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      {/* Left side: Status Dot + Title */}
      <div className="flex items-start sm:items-center gap-4 min-w-0">
        <div
          className="mt-1 sm:mt-0 h-3 w-3 rounded-full shrink-0 shadow-inner"
          style={{ backgroundColor: cfg.dot }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate pr-2">{req.title}</h3>
            {req._hasUnreadMessage && (
              <span className="flex items-center gap-1 shrink-0 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">
                <MessageSquareDot size={10} /> New Message
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span>ID: #{req.id?.substring(0,6) || '---'}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>Updated {timeAgo(req.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Right side: Pill + Arrow */}
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pl-7 sm:pl-0">
        <span
          className="shrink-0 text-xs font-semibold rounded-md px-3 py-1.5 border"
          style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
        >
          {cfg.label}
        </span>
        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#0f6e56] transition-colors shrink-0">
          <ChevronRight size={16} className="text-gray-400 group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  )
}

// ─── Pagination Control ───────────────────────────────────────
function Pagination({ total, current, onChange }) {
  const pages = Math.ceil(total / ITEMS_PER_PAGE)
  if (pages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-6">
      <span className="text-xs font-medium text-gray-500">
        Showing {(current - 1) * ITEMS_PER_PAGE + 1} to {Math.min(current * ITEMS_PER_PAGE, total)} of {total} requests
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-semibold text-gray-900 px-2">
          Page {current} of {pages}
        </span>
        <button
          onClick={() => onChange(current + 1)}
          disabled={current === pages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────
function EmptyState({ onNew, providerName }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-white">
      <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5 shadow-sm">
        <Sparkles size={24} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">No requests found</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-[280px] leading-relaxed">
        Submit your first request to start working with {providerName}.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 rounded-xl bg-[#0f6e56] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c5b47] active:scale-95 transition-all shadow-md shadow-[#0f6e56]/20"
      >
        <Plus size={16} />
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-5">
        Request Lifecycle
      </p>
      <div className="space-y-4">
        {steps.map(({ status, icon: Icon }, i) => {
          const cfg = STATUS_CONFIG[status]
          return (
            <div key={status} className="flex items-start gap-3 relative">
              {/* Connector line */}
              {i !== steps.length - 1 && (
                 <div className="absolute top-8 left-4 w-[2px] h-6 bg-gray-100" />
              )}
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 z-10"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <Icon size={14} style={{ color: cfg.dot }} />
              </div>
              <div className="pt-1.5">
                <p className="text-sm font-semibold text-gray-700 leading-none">{cfg.label}</p>
              </div>
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
    <div className="space-y-3">
      {needsReview > 0 && deliveredReq && (
        <button
          onClick={() => navigate(`/my-requests/${deliveredReq.id}`)}
          className="w-full flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 hover:bg-emerald-100 transition-colors text-left shadow-sm group"
        >
          <div className="h-10 w-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
            <Zap size={18} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-800">Review Delivery</p>
            <p className="text-xs font-medium text-emerald-600 truncate mt-0.5">{deliveredReq.title}</p>
          </div>
          <ArrowUpRight size={16} className="text-emerald-600 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      <button
        onClick={onNew}
        className="w-full flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 hover:border-[#0f6e56] hover:shadow-md transition-all text-left group"
      >
        <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-[#0f6e56]/10 transition-colors">
          <Plus size={18} className="text-gray-400 group-hover:text-[#0f6e56]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">New Request</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Describe what you need</p>
        </div>
        <ArrowUpRight size={16} className="text-gray-300 group-hover:text-[#0f6e56] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 lg:bottom-8 lg:left-auto lg:right-8 lg:translate-x-0 animate-slide-in">
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white shadow-xl shadow-emerald-900/5 px-5 py-3.5">
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <p className="text-sm font-semibold text-emerald-800">{message}</p>
      </div>
    </div>
  )
}


// ─── Page ─────────────────────────────────────────────────────
export default function ClientDashboard() {
  const { user, tenant } = useAuth()
  const navigate = useNavigate()
  const { registerPortalListener } = useBadges()

  const [filter, setFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1) // Pagination state
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])

  const [updatedIds, setUpdatedIds] = useState(new Set())
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

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

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

        setUpdatedIds((s) => new Set([...s, msg.request_id]))
        setTimeout(() => {
          setUpdatedIds((s) => {
            const next = new Set(s)
            next.delete(msg.request_id)
            return next
          })
        }, 2000)

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

  const firstName = user?.display_name?.split(' ')[0] || 'there'
  const providerName = tenant?.name || 'Your Portal'
  const logoUrl = tenant?.logo_url || null

  const activeCount = requests.filter(r => !['closed'].includes(r.status)).length
  const completedCount = requests.filter(r => r.status === 'closed').length
  const reviewCount = requests.filter(r => r.status === 'delivered').length

  // Filter Logic
  const filtered = useMemo(() => {
    let list = requests
    if (filter === 'open')      list = requests.filter(r => !['delivered', 'closed'].includes(r.status))
    if (filter === 'delivered') list = requests.filter(r => r.status === 'delivered')
    if (filter === 'closed')    list = requests.filter(r => r.status === 'closed')
    return list
  }, [filter, requests])

  // Pagination Logic
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filtered, currentPage])


  return (
    <ClientLayout>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* Mobile spacer for top nav */}
      <div className="pt-[60px] lg:pt-0" />

      <div className="min-h-screen bg-[#f9fafb]">
        <div className="max-w-7xl mx-auto px-4 py-8 lg:px-8 lg:py-10">

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

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Left Area — Request List */}
            <div className="flex-1 w-full min-w-0">
              
              {/* Controls Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-900">Your Requests</h2>
                  {!loading && (
                    <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {filtered.length}
                    </span>
                  )}
                </div>

                {/* Modern Segmented Control for Filters */}
                <div className="inline-flex bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 overflow-x-auto w-full sm:w-auto">
                  {FILTERS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                        filter === f.key
                          ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-900/5'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Banner */}
              {reviewCount > 0 && filter !== 'closed' && filter !== 'delivered' && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <p className="text-sm font-semibold text-emerald-800 flex-1">
                    {reviewCount === 1
                      ? 'You have 1 delivery waiting for your review.'
                      : `You have ${reviewCount} deliveries waiting for your review.`}
                  </p>
                  <button
                    onClick={() => setFilter('delivered')}
                    className="text-sm font-bold text-[#0f6e56] bg-white border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors shrink-0 shadow-sm"
                  >
                    View Deliveries
                  </button>
                </div>
              )}

              {/* List Container */}
              <div className="space-y-3 min-h-[400px]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[84px] w-full" />)
                ) : filtered.length === 0 ? (
                  <EmptyState onNew={() => setShowNew(true)} providerName={providerName} />
                ) : (
                  <>
                    {paginatedRequests.map((r, index) => (
                      <div key={r.id} className="animate-slide-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <RequestRow
                          req={r}
                          isNew={updatedIds.has(r.id)}
                          onClick={() => navigate(`/my-requests/${r.id}`)}
                        />
                      </div>
                    ))}
                    <Pagination 
                      total={filtered.length} 
                      current={currentPage} 
                      onChange={setCurrentPage} 
                    />
                  </>
                )}
              </div>
            </div>

            {/* Right Panel (Desktop only) */}
            <div className="hidden lg:flex flex-col gap-6 w-[280px] shrink-0 sticky top-8">
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
      <div className="fixed bottom-[24px] right-4 z-30 lg:hidden">
        <button
          onClick={() => setShowNew(true)}
          className="h-14 w-14 flex items-center justify-center rounded-full bg-[#0f6e56] text-white shadow-xl shadow-[#0f6e56]/30 hover:bg-[#0c5b47] active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Live toast */}
      {toast && (
        <LiveToast message={toast} onDismiss={() => setToast(null)} />
      )}

      {/* Modal */}
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