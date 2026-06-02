import { useState, useMemo } from 'react'
import {
  Plus,
  ArrowRight,
  CheckCircle2,
  Circle,
  Zap,
  Clock,
  TrendingUp,
  Sparkles,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import ClientLayout from '../../components/layout/ClientLayout'
import NewRequestModal from '../../components/modals/NewRequestModal'

// ───────────────── Status config ─────────────────
const STATUS_CONFIG = {
  received: {
    label: 'Just submitted',
    dot: 'bg-[#d1d5db]',
    pill: 'bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]',
    step: 0,
  },
  in_review: {
    label: "We're looking at it",
    dot: 'bg-[#f59e0b]',
    pill: 'bg-[#fffbeb] text-[#92400e] border border-[#fde68a]',
    step: 1,
  },
  in_progress: {
    label: 'Work has started',
    dot: 'bg-[#6366f1]',
    pill: 'bg-[#eef2ff] text-[#3730a3] border border-[#c7d2fe]',
    step: 2,
  },
  delivered: {
    label: 'Ready for you',
    dot: 'bg-[#10b981]',
    pill: 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]',
    step: 3,
  },
  closed: {
    label: 'Done',
    dot: 'bg-[#d1d5db]',
    pill: 'bg-[#f9fafb] text-[#9ca3af] border border-[#f3f4f6]',
    step: 4,
  },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'delivered', label: 'Ready for you' },
  { key: 'closed', label: 'Done' },
]

// ───────────────── Provider Header ─────────────────
function ProviderHeader({ name, logoUrl, firstName, onNew }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div
      className="
        relative overflow-hidden
        rounded-2xl
        border border-[#ebebeb]
        bg-gradient-to-b from-white to-[#fcfcfc]
        shadow-[0_1px_2px_rgba(0,0,0,0.03)]
        mb-4
      "
    >
      <div className="h-[3px] w-full bg-gradient-to-r from-[#0f6e56] via-[#1d9e75] to-transparent" />
      <div className="absolute right-[-40px] top-[-40px] h-[140px] w-[140px] rounded-full bg-[#0f6e56]/[0.04] blur-3xl" />

      <div className="relative px-4 py-4 sm:px-5 sm:py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="h-10 w-10 rounded-[10px] object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-[10px] bg-[#111] flex items-center justify-center text-[13px] font-bold text-white">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[11px] font-semibold text-[#9b9b9b] uppercase tracking-[0.08em] truncate">
                {name}
              </p>
              <span className="text-[10px] text-[#d1d5db]">·</span>
              <p className="text-[11px] text-[#c0c0c0] shrink-0">Client portal</p>
            </div>
            <h1 className="text-[18px] lg:text-[20px] font-semibold text-[#111] leading-none tracking-[-0.4px]">
              Hi {firstName} 👋
            </h1>
          </div>
        </div>

        <button
          onClick={onNew}
          className="
            hidden sm:flex items-center gap-2 shrink-0
            rounded-xl bg-[#111] px-4 py-2.5
            text-[13px] font-medium text-white
            hover:bg-[#222] active:scale-[0.98] transition-all duration-150
          "
        >
          <Plus size={14} />
          New request
        </button>
      </div>
    </div>
  )
}

// ───────────────── Stats Strip ─────────────────
function StatsStrip({ active, action, done }) {
  const items = [
    {
      label: 'Active',
      value: active,
      icon: <Circle size={13} />,
      color: 'text-[#6366f1]',
      bg: 'bg-[#f0f0ff]',
      highlight: false,
    },
    {
      label: 'Need your action',
      value: action,
      icon: <Zap size={13} />,
      color: action > 0 ? 'text-[#059669]' : 'text-[#9b9b9b]',
      bg: action > 0 ? 'bg-[#ecfdf5]' : 'bg-[#f5f5f5]',
      highlight: action > 0,
    },
    {
      label: 'Done',
      value: done,
      icon: <CheckCircle2 size={13} />,
      color: 'text-[#9b9b9b]',
      bg: 'bg-[#f5f5f5]',
      highlight: false,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {items.map((s) => (
        <div
          key={s.label}
          className={`
            rounded-xl border px-3.5 py-3
            transition-all duration-200 hover:translate-y-[-1px]
            ${s.highlight
              ? 'bg-[#f0fdf9] border-[#a7f3d0] shadow-[0_4px_16px_rgba(16,185,129,0.08)]'
              : 'bg-white border-[#ebebeb] hover:border-[#d8d8d8]'
            }
          `}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className={`flex h-6 w-6 items-center justify-center rounded-md ${s.bg} ${s.color}`}>
              {s.icon}
            </div>
            <span className={`text-[22px] font-semibold leading-none tracking-tight ${s.highlight ? 'text-[#059669]' : 'text-[#111]'}`}>
              {s.value}
            </span>
          </div>
          <p className="text-[11px] text-[#9b9b9b] leading-none">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ───────────────── Skeletons ─────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#ebebeb] bg-white p-4 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="h-3 w-[140px] rounded bg-[#f1f1f1]" />
          <div className="mt-2 h-2.5 w-[220px] rounded bg-[#f5f5f5]" />
        </div>
        <div className="h-6 w-[90px] rounded-full bg-[#f3f3f3]" />
      </div>
      <div className="mt-4 h-[1px] w-full bg-[#f5f5f5]" />
      <div className="mt-3 flex justify-between">
        <div className="h-2.5 w-[50px] rounded bg-[#f3f3f3]" />
        <div className="h-2.5 w-[70px] rounded bg-[#f3f3f3]" />
      </div>
    </div>
  )
}

// ───────────────── Request Card ─────────────────
function RequestCard({ request }) {
  const cfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.received
  const isDelivered = request.status === 'delivered'

  return (
    <div
      className={`
        group relative bg-white border rounded-xl cursor-pointer
        transition-all duration-200
        hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] hover:-translate-y-[1px]
        ${isDelivered
          ? 'border-[#a7f3d0] hover:border-[#6ee7b7]'
          : 'border-[#ebebeb] hover:border-[#d4d4d4]'
        }
      `}
    >
      {isDelivered && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[#10b981]" />
      )}

      <div className="px-4 py-3 pl-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className={`mt-[5px] h-[7px] w-[7px] rounded-full shrink-0 ${cfg.dot}`} />
            <div className="min-w-0">
              <h3 className="text-[13.5px] font-medium text-[#111] leading-snug truncate">
                {request.title}
              </h3>
              {request.description && (
                <p className="mt-0.5 text-[12px] text-[#9b9b9b] line-clamp-1">
                  {request.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {isDelivered && (
              <span className="text-[9.5px] font-bold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] rounded px-1.5 py-0.5 uppercase tracking-wide whitespace-nowrap">
                Action needed
              </span>
            )}
            <span className={`text-[11px] font-medium rounded-full px-2.5 py-0.5 whitespace-nowrap ${cfg.pill}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between pt-2.5 border-t border-[#f5f5f5]">
          <span className="text-[11px] text-[#c8c8c8]">
            {new Date(request.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
          </span>
          <button
            className={`
              flex items-center gap-1 text-[11.5px] font-medium transition-colors
              ${isDelivered ? 'text-[#059669]' : 'text-[#d4d4d4] group-hover:text-[#6b7280]'}
            `}
          >
            View
            <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ───────────────── Empty State ─────────────────
function EmptyRequests({ onNew, providerName }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-xl border border-dashed border-[#e0e0e0]">
      <div className="h-11 w-11 rounded-xl border border-dashed border-[#d4d4d4] flex items-center justify-center mb-3">
        <Sparkles size={18} className="text-[#c0c0c0]" />
      </div>
      <p className="text-[14px] font-semibold text-[#111] mb-1">
        Everything starts with a request.
      </p>
      <p className="text-[12px] text-[#9b9b9b] mb-4 max-w-[240px] leading-relaxed">
        Submit your first request to begin collaborating with {providerName}.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-1.5 rounded-xl bg-[#111] px-4 py-2 text-[12.5px] font-medium text-white hover:bg-[#222] active:scale-[0.98] transition-all duration-150"
      >
        <Plus size={13} />
        Submit a request
      </button>
    </div>
  )
}

// ───────────────── Side Panel ─────────────────
function SidePanel({ providerName, requestCount }) {
  return (
    <div className="space-y-3 sticky top-6">
      {requestCount === 0 && (
        <div className="rounded-xl border border-[#ebebeb] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f5f5f5]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b9b9b]">
              How it works
            </p>
          </div>
          <div className="px-4 py-3 space-y-3.5">
            {[
              { icon: <Plus size={13} />, title: 'Submit a request', desc: 'Describe what you need' },
              { icon: <Clock size={13} />, title: 'Track progress', desc: `${providerName} updates the status` },
              { icon: <TrendingUp size={13} />, title: 'Get notified', desc: "We'll ping you when it's ready" },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-md bg-[#f5f5f5] flex items-center justify-center text-[#6b7280] shrink-0 mt-0.5">
                  {step.icon}
                </div>
                <div>
                  <p className="text-[12.5px] font-medium text-[#111]">{step.title}</p>
                  <p className="text-[11.5px] text-[#9b9b9b] mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#ebebeb] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[#f5f5f5] flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b9b9b]">
            Live status
          </p>
          <div className="flex items-center gap-1 text-[10px] text-[#9b9b9b]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
            Updated now
          </div>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {Object.entries(STATUS_CONFIG)
            .filter(([k]) => k !== 'closed')
            .map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2.5">
                <div className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
                <span className="text-[12px] text-[#4b5563]">{cfg.label}</span>
              </div>
            ))}
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full shrink-0 bg-[#d1d5db]" />
            <span className="text-[12px] text-[#4b5563]">Done</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ───────────────── Page ─────────────────
export default function ClientDashboard() {
  const { user, tenant } = useAuth()

  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)

  const loading = false

  // Mock — replace with real API call when wiring dashboard data
  const requests = []

  const firstName = user?.display_name?.split(' ')[0] || 'there'
  const providerName = tenant?.name || 'Your Portal'
  const logoUrl = tenant?.logo_url || null

  const activeCount = requests.filter((r) => !['closed'].includes(r.status)).length
  const completedCount = requests.filter((r) => r.status === 'closed').length
  const actionCount = requests.filter((r) => r.status === 'delivered').length

  const filtered = useMemo(() => {
    if (filter === 'all') return requests
    if (filter === 'open') return requests.filter((r) => !['delivered', 'closed'].includes(r.status))
    if (filter === 'delivered') return requests.filter((r) => r.status === 'delivered')
    if (filter === 'closed') return requests.filter((r) => r.status === 'closed')
    return requests
  }, [filter, requests])

  return (
    <ClientLayout>
      {/* Mobile spacer */}
      <div className="pt-[57px] lg:pt-0" />

      <div className="px-4 py-4 lg:px-6 lg:py-5">

        {/* Header */}
        <ProviderHeader
          name={providerName}
          logoUrl={logoUrl}
          firstName={firstName}
          onNew={() => setShowNew(true)}
        />

        {/* Stats */}
        <StatsStrip
          active={activeCount}
          action={actionCount}
          done={completedCount}
        />

        {/* Layout */}
        <div className="flex gap-4 items-start">

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-semibold text-[#111]">Requests</h2>
                {requests.length > 0 && (
                  <span className="text-[12px] text-[#9b9b9b]">
                    {requests.length}
                    {actionCount > 0 && (
                      <span className="ml-1 text-[#059669] font-medium">
                        · {actionCount} need action
                      </span>
                    )}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`
                      rounded-full px-3 py-1.5 text-[11.5px] font-medium whitespace-nowrap
                      transition-all duration-150 active:scale-[0.98]
                      ${filter === f.key
                        ? 'bg-[#111] text-white'
                        : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:border-[#d1d5db] hover:text-[#111]'
                      }
                    `}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {actionCount > 0 && (
              <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-[#a7f3d0] bg-[#f0fdf9] px-4 py-2.5">
                <div className="h-2 w-2 rounded-full bg-[#10b981] shrink-0 animate-pulse" />
                <p className="text-[12.5px] text-[#065f46] font-medium">
                  {actionCount === 1 ? '1 request is ready for you.' : `${actionCount} requests are ready for you.`}
                </p>
              </div>
            )}

            {loading ? (
              <div className="space-y-2">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyRequests
                providerName={providerName}
                onNew={() => setShowNew(true)}
              />
            ) : (
              <div className="space-y-2">
                {filtered.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            )}
          </div>

          {/* Side */}
          <div className="hidden xl:block w-[220px] shrink-0">
            <SidePanel
              providerName={providerName}
              requestCount={requests.length}
            />
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="fixed bottom-[84px] right-4 z-30 lg:hidden">
        <button
          onClick={() => setShowNew(true)}
          className="
            h-14 flex items-center gap-2 rounded-2xl bg-[#111] px-5
            text-[13px] font-semibold text-white
            shadow-lg shadow-black/20
            hover:bg-[#222] active:scale-[0.96] transition-all duration-150
          "
        >
          <Plus size={15} />
          New request
        </button>
      </div>

      {/* New request modal */}
      {showNew && (
        <NewRequestModal
          providerName={providerName}
          onClose={() => setShowNew(false)}
          onSuccess={() => setShowNew(false)}
        />
      )}
    </ClientLayout>
  )
}