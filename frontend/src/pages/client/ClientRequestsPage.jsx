import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, Loader2, FileText, ChevronRight, CheckCircle2, 
  Clock, Calendar, Search, SlidersHorizontal, Layers, CheckCircle,
  ChevronLeft
} from 'lucide-react'
import ClientLayout from '../../components/layout/ClientLayout'
import NewRequestModal from '../../components/modals/NewRequestModal'
import requestsApi from '../../api/requests.api'
import { timeAgo, formatDate } from '../../utils/clientHelpers'
import { useAuth } from '../../context/AuthContext'

const CARDS_PER_PAGE = 6

// ── Status config with distinct matching colors ──────────────────
const STATUS_CONFIG = {
  received:    { label: 'Submitted',        step: 0, pill: 'bg-[#e6f5f0] text-[#085041]',  dot: 'bg-[#1d9e75]' },
  in_review:   { label: "In Review",        step: 1, pill: 'bg-[#fef3e2] text-[#92500a]',  dot: 'bg-[#f59e0b]' },
  in_progress: { label: 'In Progress',      step: 2, pill: 'bg-[#eef2ff] text-[#3730a3]',  dot: 'bg-[#6366f1]' },
  delivered:   { label: 'Ready for Review',  step: 3, pill: 'bg-[#f0f9ff] text-[#1e40af]',  dot: 'bg-[#3b82f6]' },
  closed:      { label: 'Completed',        step: 4, pill: 'bg-[#f3f4f3] text-[#4a544a]',  dot: 'bg-[#9ea89e]' },
}

const STATUS_STEPS = ['received', 'in_review', 'in_progress', 'delivered', 'closed']

const STATUS_FILTER_TABS = [
  { key: 'all',         label: 'All Requests' },
  { key: 'received',    label: 'Submitted' },
  { key: 'in_review',   label: 'In Review' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'delivered',   label: 'Ready' },
  { key: 'closed',      label: 'Completed' },
]

// ── Stat Deck Item ────────────────────────────────────────────
function MiniStatCard({ title, value, subtitle, icon: Icon, iconColor }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8eae8] p-5 flex items-center justify-between transition-all duration-200">
      <div className="space-y-1">
        <p className="text-[12px] font-medium text-[#9ea89e] uppercase tracking-wider">{title}</p>
        <p className="text-[24px] font-bold text-[#141a14] leading-none">{value}</p>
        <p className="text-[11px] text-[#9ea89e]">{subtitle}</p>
      </div>
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon size={18} />
      </div>
    </div>
  )
}

// ── Pagination Component ──────────────────────────────────────
function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null
  
  return (
    <div className="flex items-center justify-between pt-4 border-t border-[#e8eae8] w-full mt-6">
      <p className="text-[12px] text-[#9ea89e]">
        Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="h-8 w-8 flex items-center justify-center rounded-xl border border-[#e8eae8] text-[#9ea89e] hover:border-[#0f6e56] hover:text-[#0f6e56] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-8 w-8 flex items-center justify-center rounded-xl text-[12px] font-medium transition-all
              ${p === page ? 'bg-[#0f6e56] text-white' : 'border border-[#e8eae8] text-[#4a544a] hover:border-[#0f6e56] hover:text-[#0f6e56]'}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-xl border border-[#e8eae8] text-[#9ea89e] hover:border-[#0f6e56] hover:text-[#0f6e56] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Request card ──────────────────────────────────────────────
function RequestCard({ req, onClick }) {
  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.received
  const hasDeliveries = req.deliveries?.length > 0

  return (
    <div
      className="group bg-white rounded-2xl border border-[#e8eae8] p-5 cursor-pointer hover:border-[#0f6e56]/30 hover:shadow-lg hover:shadow-black/[0.02] hover:-translate-y-[1px] transition-all duration-200 flex flex-col justify-between"
      onClick={onClick}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${cfg.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          {req.category && (
            <span className="text-[11px] font-medium text-[#4a544a] bg-[#f5f7f5] px-2 py-0.5 rounded-md">
              {req.category}
            </span>
          )}
        </div>

        <div className="space-y-1 mb-4">
          <p className="text-[15px] font-semibold text-[#141a14] leading-snug group-hover:text-[#0f6e56] transition-colors line-clamp-1">{req.title}</p>
          <p className="text-[13px] text-[#4a544a] line-clamp-2 leading-relaxed">{req.description || 'No description provided.'}</p>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-[#f7f8f7]">
        <div className="flex gap-1">
          {STATUS_STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-all ${i <= cfg.step ? 'bg-[#0f6e56]' : 'bg-[#e8eae8]'}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-[#9ea89e]">
            <Clock size={12} />
            <span>Updated {timeAgo(req.updated_at)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {hasDeliveries && (
              <span className="flex items-center gap-1 text-[#0f6e56] font-semibold bg-[#edf7f3] px-2 py-0.5 rounded-md mr-1 animate-pulse">
                <CheckCircle2 size={11} /> Files ready
              </span>
            )}
            <ChevronRight size={14} className="text-[#9ea89e] group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function ClientRequestsPage() {
  const navigate = useNavigate()
  const { tenant } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const providerName = tenant?.name || 'your provider'

  const fetchRequests = useCallback(async () => {
    try {
      const res = await requestsApi.list()
      setRequests(res.data.data?.requests || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  // Reset current pagination layer whenever active tabs shift context
  useEffect(() => { setPage(1) }, [statusFilter, searchQuery])

  // System dynamic calculation metrics
  const totalCount = requests.length
  const dynamicActiveCount = requests.filter(r => ['received', 'in_review', 'in_progress'].includes(r.status)).length
  const dynamicReadyCount = requests.filter(r => r.status === 'delivered').length
  const dynamicClosedCount = requests.filter(r => r.status === 'closed').length

  // Filter Pipeline Processing
  const filtered = requests.filter(r => {
    const matchesTab = statusFilter === 'all' || r.status === statusFilter
    const matchesSearch = searchQuery.trim() === '' || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesTab && matchesSearch
  })

  // Pagination Window Slice Block
  const paginatedRequests = filtered.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE)

  return (
    <ClientLayout badges={{ requests: dynamicReadyCount }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8eae8] pb-5">
          <div>
            <h1 className="text-[22px] font-bold text-[#141a14] tracking-tight">Request Hub</h1>
            <p className="text-[13px] text-[#9ea89e] mt-0.5">Manage and submit tracking milestones with {providerName}.</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0f6e56] px-4 h-11 text-[13px] font-semibold text-white hover:bg-[#085041] shadow-sm shadow-[#0f6e56]/10 transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            New Request
          </button>
        </div>

        {/* Stat strip summary deck */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MiniStatCard 
            title="All Boarded" 
            value={totalCount} 
            subtitle="Historical backlog entries" 
            icon={Layers} 
            iconColor="bg-[#f5f7f5] text-[#4a544a]" 
          />
          <MiniStatCard 
            title="Active Track" 
            value={dynamicActiveCount} 
            subtitle="In production queue" 
            icon={Clock} 
            iconColor="bg-[#eef2ff] text-[#3730a3]" 
          />
          <MiniStatCard 
            title="Ready Actions" 
            value={dynamicReadyCount} 
            subtitle="Awaiting final clearance" 
            icon={CheckCircle2} 
            iconColor="bg-[#e6f5f0] text-[#0f6e56]" 
          />
          <MiniStatCard 
            title="Closed Items" 
            value={dynamicClosedCount} 
            subtitle="Fully processed logs" 
            icon={CheckCircle} 
            iconColor="bg-[#f3f4f3] text-[#9ea89e]" 
          />
        </div>

        {/* Toolbar Filter Grid Wrapper */}
        <div className="bg-white rounded-2xl border border-[#e8eae8] p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20 shadow-sm shadow-black/[0.01]">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-image">
            {STATUS_FILTER_TABS.map(({ key, label }) => {
              const active = statusFilter === key
              const count = key === 'all' ? totalCount : requests.filter(r => r.status === key).length
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 h-9 text-[12px] font-medium transition-all whitespace-nowrap
                    ${active 
                      ? 'bg-[#0f6e56] text-white font-semibold' 
                      : 'text-[#4a544a] hover:bg-[#f5f7f5] hover:text-[#141a14]'
                    }
                  `}
                >
                  <span>{label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 rounded-full font-medium ${active ? 'bg-white/20 text-white' : 'bg-[#f0f2f0] text-[#9ea89e]'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="relative w-full md:w-64 shrink-0">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ea89e]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search request title..."
              className="w-full h-9 rounded-xl border border-[#e8eae8] bg-[#fbfcfb] focus:bg-white pl-9 pr-4 text-[12px] outline-none placeholder:text-[#9ea89e] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/5 transition-all"
            />
          </div>
        </div>

        {/* Request Card Grid Section */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-[#0f6e56]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8eae8] bg-white py-20 text-center px-6">
            <div className="h-14 w-14 rounded-2xl bg-[#f5f7f5] flex items-center justify-center mb-4 border border-[#e8eae8]/40">
              <FileText size={22} className="text-[#9ea89e]" />
            </div>
            <p className="text-[15px] font-semibold text-[#141a14]">
              {searchQuery.trim() || statusFilter !== 'all' ? 'No matching logs found' : 'Workspace registry empty'}
            </p>
            <p className="text-[13px] text-[#9ea89e] mt-1 mb-6 max-w-sm leading-normal">
              {searchQuery.trim() || statusFilter !== 'all' 
                ? 'Try adjusting or clearing your search queries and filter tabs.' 
                : "Submit your task specifications to your assigned provider pipeline to scale production."}
            </p>
            {(statusFilter === 'all' && !searchQuery.trim()) && (
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 rounded-xl bg-[#0f6e56] px-5 h-11 text-[13px] font-semibold text-white hover:bg-[#085041] transition-all active:scale-[0.98]"
              >
                <Plus size={16} />
                Submit Your First Request
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedRequests.map(req => (
                <RequestCard
                  key={req.id}
                  req={req}
                  onClick={() => navigate(`/my-requests/${req.id}`)}
                />
              ))}
            </div>

            <Pagination
              page={page}
              total={filtered.length}
              perPage={CARDS_PER_PAGE}
              onChange={setPage}
            />
          </div>
        )}

      </div>

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