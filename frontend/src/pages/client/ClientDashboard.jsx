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

// ─── Status config (Updated to Tailwind Semantic Tokens) ──────
const STATUS_CONFIG = {
  received: {
    label: 'Submitted',
    text: 'text-text-sub',
    bg: 'bg-surface',
    border: 'border-border/60',
    dot: 'bg-text-dim',
    step: 0,
  },
  in_review: {
    label: 'In review',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    step: 1,
  },
  in_progress: {
    label: 'In progress',
    text: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
    step: 2,
  },
  delivered: {
    label: 'Action Needed',
    text: 'text-primary-dark',
    bg: 'bg-primary-light',
    border: 'border-grove-200',
    dot: 'bg-primary',
    step: 3,
  },
  closed: {
    label: 'Completed',
    text: 'text-text-dim',
    bg: 'bg-surface/50',
    border: 'border-border/40',
    dot: 'bg-border',
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
  return <div className={`animate-pulse rounded-xl bg-surface border border-border/40 ${className}`} />
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
          <img src={logoUrl} alt={providerName} className="h-12 w-12 rounded-xl object-cover shadow-sm border border-border/50" />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-sidebar flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm">
            {initials}
          </div>
        )}
        <div>
          <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-0.5">{providerName}</p>
          <h1 className="text-2xl font-bold text-text-main tracking-tight leading-none">
            Welcome back, {firstName} <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>
        </div>
      </div>

      <button
        onClick={onNew}
        className="hidden sm:flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] transition-all shadow-sm"
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
      border: 'border-border/50',
    },
    {
      label: 'Needs Review',
      value: needsReview,
      icon: Zap,
      iconColor: needsReview > 0 ? 'text-primary' : 'text-text-dim',
      iconBg: needsReview > 0 ? 'bg-primary-light' : 'bg-surface',
      border: needsReview > 0 ? 'border-primary/20 ring-1 ring-primary/10 shadow-sm' : 'border-border/50',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle2,
      iconColor: 'text-text-dim',
      iconBg: 'bg-surface',
      border: 'border-border/50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map(card => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-2xl border bg-white p-5 transition-all ${card.border}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
              <card.icon size={18} className={card.iconColor} />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-10 border-none" />
            ) : (
              <span className="text-3xl font-semibold text-text-main tracking-tight">
                {card.value}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-text-sub">{card.label}</p>
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
        cursor-pointer transition-all duration-200 hover:-translate-y-[1px] hover:shadow-soft
        ${isNew ? 'animate-slide-in ring-1 ring-primary' : ''}
        ${isDelivered ? 'border-grove-200' : 'border-border/60 hover:border-border'}
      `}
    >
      {/* Left side: Status Dot + Title */}
      <div className="flex items-start sm:items-center gap-4 min-w-0">
        <div className={`mt-1.5 sm:mt-0 h-2.5 w-2.5 rounded-full shrink-0 ${cfg.dot}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <h3 className="text-sm font-semibold text-text-main truncate">{req.title}</h3>
            {req._hasUnreadMessage && (
              <span className="flex items-center gap-1 shrink-0 text-[9px] font-bold uppercase tracking-wider text-primary-dark bg-primary-light rounded px-1.5 py-0.5">
                <MessageSquareDot size={10} /> New Message
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-text-dim">
            <span className="uppercase tracking-wider">#{req.id?.substring(0,6) || '---'}</span>
            <span className="w-1 h-1 rounded-full bg-border"></span>
            <span>Updated {timeAgo(req.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Right side: Pill + Arrow */}
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pl-6 sm:pl-0">
        <span
          className={`shrink-0 text-[11px] font-bold tracking-wide rounded-md px-2.5 py-1 border ${cfg.bg} ${cfg.text} ${cfg.border}`}
        >
          {cfg.label}
        </span>
        <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center group-hover:bg-primary transition-colors shrink-0">
          <ChevronRight size={16} className="text-text-dim group-hover:text-white transition-colors" />
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
    <div className="flex items-center justify-between pt-4 mt-6">
      <span className="text-xs font-medium text-text-dim">
        Showing {(current - 1) * ITEMS_PER_PAGE + 1} to {Math.min(current * ITEMS_PER_PAGE, total)} of {total}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className="p-1.5 rounded-lg border border-border/50 text-text-sub hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-semibold text-text-main px-2">
          Page {current} of {pages}
        </span>
        <button
          onClick={() => onChange(current + 1)}
          disabled={current === pages}
          className="p-1.5 rounded-lg border border-border/50 text-text-sub hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl border border-dashed border-border/60 bg-white">
      <div className="h-14 w-14 rounded-2xl bg-surface border border-border/50 flex items-center justify-center mb-5 shadow-sm">
        <Sparkles size={24} className="text-text-dim" />
      </div>
      <h3 className="text-base font-semibold text-text-main mb-1.5">No requests found</h3>
      <p className="text-sm text-text-sub mb-6 max-w-[280px] leading-relaxed">
        Submit your first request to start working with {providerName}.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] transition-all shadow-sm"
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
    <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-soft">
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-dim mb-5">
        Request Lifecycle
      </p>
      <div className="space-y-4">
        {steps.map(({ status, icon: Icon }, i) => {
          const cfg = STATUS_CONFIG[status]
          return (
            <div key={status} className="flex items-start gap-3 relative">
              {/* Connector line */}
              {i !== steps.length - 1 && (
                 <div className="absolute top-8 left-[15px] w-[2px] h-5 bg-border/50" />
              )}
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 z-10 border ${cfg.bg} ${cfg.border}`}
              >
                <Icon size={14} className={cfg.text} />
              </div>
              <div className="pt-1.5">
                <p className="text-xs font-semibold text-text-main leading-none">{cfg.label}</p>
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
          className="w-full flex items-center gap-3 rounded-2xl border border-grove-200 bg-primary-light px-4 py-4 hover:bg-primary-light/80 transition-colors text-left shadow-sm group"
        >
          <div className="h-10 w-10 rounded-xl bg-white border border-grove-100 flex items-center justify-center shrink-0 shadow-sm">
            <Zap size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-primary-dark">Review Delivery</p>
            <p className="text-[11px] font-medium text-primary truncate mt-0.5">{deliveredReq.title}</p>
          </div>
          <ArrowUpRight size={16} className="text-primary shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      <button
        onClick={onNew}
        className="w-full flex items-center gap-3 rounded-2xl border border-border/60 bg-white px-4 py-4 hover:border-primary/50 hover:shadow-soft transition-all text-left group"
      >
        <div className="h-10 w-10 rounded-xl bg-surface flex items-center justify-center shrink-0 group-hover:bg-primary-light transition-colors">
          <Plus size={18} className="text-text-dim group-hover:text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-main">New Request</p>
          <p className="text-[11px] font-medium text-text-sub mt-0.5">Describe what you need</p>
        </div>
        <ArrowUpRight size={16} className="text-text-dim group-hover:text-primary shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
      <div className="flex items-center gap-3 rounded-2xl border border-grove-200 bg-white shadow-soft px-5 py-3.5">
        <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse shrink-0" />
        <p className="text-sm font-semibold text-primary-dark">{message}</p>
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
        @keyframes wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-wave { animation: wave 2s ease-in-out infinite; }
      `}</style>

      {/* Mobile spacer to prevent top nav overlap */}

      {/* Main Content Area (Layout wrapper handles centering and max width) */}
      <div className="w-full">
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
                <h2 className="text-base font-semibold text-text-main">Your Requests</h2>
                {!loading && (
                  <span className="bg-surface border border-border/60 text-text-sub text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {filtered.length}
                  </span>
                )}
              </div>

              {/* Modern Segmented Control for Filters */}
              <div className="inline-flex bg-surface p-1 rounded-xl border border-border/40 overflow-x-auto w-full sm:w-auto shadow-sm">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      filter === f.key
                        ? 'bg-white text-text-main shadow-sm ring-1 ring-border/50'
                        : 'text-text-dim hover:text-text-main hover:bg-white/50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Banner */}
            {reviewCount > 0 && filter !== 'closed' && filter !== 'delivered' && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-grove-200 bg-primary-light px-5 py-3.5 shadow-sm">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                <p className="text-sm font-semibold text-primary-dark flex-1">
                  {reviewCount === 1
                    ? 'You have 1 delivery waiting for your review.'
                    : `You have ${reviewCount} deliveries waiting for your review.`}
                </p>
                <button
                  onClick={() => setFilter('delivered')}
                  className="text-xs font-bold text-primary bg-white border border-grove-100 px-3 py-1.5 rounded-lg hover:bg-surface transition-colors shrink-0 shadow-sm"
                >
                  View Deliveries
                </button>
              </div>
            )}

            {/* List Container */}
            <div className="space-y-3 min-h-[400px]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[76px] w-full" />)
              ) : filtered.length === 0 ? (
                <EmptyState onNew={() => setShowNew(true)} providerName={providerName} />
              ) : (
                <>
                  {paginatedRequests.map((r, index) => (
                    <div key={r.id} className="animate-slide-in" style={{ animationDelay: `${index * 40}ms` }}>
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

      {/* Mobile FAB */}
      <div className="fixed bottom-[104px] right-4 z-30 lg:hidden">
        <button
          onClick={() => setShowNew(true)}
          className="h-14 w-14 flex items-center justify-center rounded-full bg-primary text-white shadow-soft hover:bg-primary-dark active:scale-[0.95] transition-all"
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