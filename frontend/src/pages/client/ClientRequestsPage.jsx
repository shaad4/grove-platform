import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, Loader2, FileText, ChevronRight, CheckCircle2, 
  Clock, Search, Layers, CheckCircle, ChevronLeft
} from 'lucide-react'
import ClientLayout from '../../components/layout/ClientLayout'
import NewRequestModal from '../../components/modals/NewRequestModal'
import requestsApi from '../../api/requests.api'
import { timeAgo } from '../../utils/clientHelpers'
import { useAuth } from '../../context/AuthContext'

const CARDS_PER_PAGE = 4

const STATUS_CONFIG = {
  received:    { label: 'Submitted',        step: 1, pill: 'bg-emerald-50 text-emerald-700 border-emerald-100',       dot: 'bg-emerald-500' },
  in_review:   { label: "In Review",        step: 2, pill: 'bg-amber-50 text-amber-700 border-amber-100',           dot: 'bg-amber-500' },
  in_progress: { label: 'In Progress',      step: 3, pill: 'bg-indigo-50 text-indigo-700 border-indigo-100',         dot: 'bg-indigo-500' },
  delivered:   { label: 'Ready for Review',  step: 4, pill: 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse', dot: 'bg-blue-500' },
  closed:      { label: 'Completed',        step: 5, pill: 'bg-gray-50 text-gray-600 border-gray-100',              dot: 'bg-gray-400' },
}

const STATUS_FILTER_TABS = [
  { key: 'all',         label: 'All Requests' },
  { key: 'received',    label: 'Submitted' },
  { key: 'in_review',   label: 'In Review' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'delivered',   label: 'Ready' },
  { key: 'closed',      label: 'Completed' },
]

// ── Scaled-Up Stat Card ──────────────────────────────────────
function StatCard({ title, value, subtitle, icon: Icon, iconColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-6 flex items-center justify-between shadow-sm">
      <div className="space-y-1.5">
        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-gray-900 tracking-tight leading-none">{value}</p>
        <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
      </div>
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon size={20} />
      </div>
    </div>
  )
}

// ── Clean Pagination ──────────────────────────────────────────
function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null
  
  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-100 w-full mt-6">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-800">{(page - 1) * perPage + 1}</span>–<span className="font-medium text-gray-800">{Math.min(page * perPage, total)}</span> of <span className="font-medium text-gray-800">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 bg-white hover:border-gray-300 disabled:opacity-40 transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-9 w-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all
              ${p === page ? 'bg-[#0f6e56] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 bg-white hover:border-gray-300 disabled:opacity-40 transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Roomier, More Impactful List Row ───────────────────────
function RequestRow({ req, onClick }) {
  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.received
  const hasDeliveries = req.deliveries?.length > 0

  return (
    <div
      onClick={onClick}
      className="group flex items-center justify-between gap-4 p-5 bg-white border border-gray-200/70 rounded-xl hover:border-gray-300 hover:shadow-md/5 transition-all duration-200 cursor-pointer"
    >
      {/* Left Context Group */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="hidden sm:flex items-center justify-center h-11 w-11 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-[#0f6e56] transition-colors shrink-0">
          <FileText size={20} />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-[15px] font-semibold text-gray-900 group-hover:text-[#0f6e56] transition-colors truncate max-w-[200px] sm:max-w-[350px] md:max-w-[550px]">
              {req.title}
            </h3>
            {req.category && (
              <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {req.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              Updated {timeAgo(req.updated_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Right Metrics & Steppers */}
      <div className="flex items-center gap-5 shrink-0">
        {hasDeliveries && (
          <span className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
            <CheckCircle2 size={13} /> Files ready
          </span>
        )}
        
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${cfg.pill}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>

        {/* Scaled Step Indicators */}
        <div className="hidden lg:flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((stepNumber) => (
            <div 
              key={stepNumber}
              className={`h-2 w-6 rounded-full transition-all duration-300 ${
                stepNumber <= cfg.step ? 'bg-[#0f6e56]' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>

        <div className="text-gray-400 group-hover:text-gray-900 transition-colors pl-1">
          <ChevronRight size={18} className="transform group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  )
}

// ── Redesigned Page Scaffold ──────────────────────────────────
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
      // safe fallback
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])
  useEffect(() => { setPage(1) }, [statusFilter, searchQuery])

  const totalCount = requests.length
  const dynamicActiveCount = requests.filter(r => ['received', 'in_review', 'in_progress'].includes(r.status)).length
  const dynamicReadyCount = requests.filter(r => r.status === 'delivered').length
  const dynamicClosedCount = requests.filter(r => r.status === 'closed').length

  const filtered = requests.filter(r => {
    const matchesTab = statusFilter === 'all' || r.status === statusFilter
    return matchesTab && (searchQuery.trim() === '' || r.title.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  const paginatedRequests = filtered.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE)

  return (
    <ClientLayout badges={{ requests: dynamicReadyCount }}>
      {/* Max width set to 6xl to match higher display densities beautifully */}
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 antialiased">

        {/* Title Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Request Hub</h1>
            <p className="text-sm text-gray-400">View updates and track work submitted to {providerName}.</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0f6e56] px-5 h-11 text-sm font-semibold text-white hover:bg-[#085041] transition-all w-full sm:w-auto shadow-sm"
          >
            <Plus size={16} />
            New Request
          </button>
        </div>

        {/* Status Metrics Deck */}
        <div className="hidden sm:grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Requests" value={totalCount} subtitle="All items created" icon={Layers} iconColor="bg-gray-50 text-gray-500" />
          <StatCard title="In Progress" value={dynamicActiveCount} subtitle="Currently being built" icon={Clock} iconColor="bg-indigo-50 text-indigo-600" />
          <StatCard title="Ready For Review" value={dynamicReadyCount} subtitle="Awaiting your approval" icon={CheckCircle2} iconColor="bg-emerald-50 text-[#0f6e56]" />
          <StatCard title="Completed" value={dynamicClosedCount} subtitle="Finished requests" icon={CheckCircle} iconColor="bg-gray-100 text-gray-400" />
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none border-b md:border-0 border-gray-100">
            {STATUS_FILTER_TABS.map(({ key, label }) => {
              const active = statusFilter === key
              const count = key === 'all' ? totalCount : requests.filter(r => r.status === key).length
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`shrink-0 flex items-center gap-2 rounded-lg px-3.5 h-9 text-sm font-medium transition-all
                    ${active ? 'bg-gray-900 text-white font-semibold' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <span>{label}</span>
                  {count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="relative w-full md:w-64 shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search requests by title..."
              className="w-full h-9 rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-gray-900 transition-all placeholder:text-gray-400 text-gray-800"
            />
          </div>
        </div>

        {/* Central Display Layer */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center px-4">
            <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center mb-4">
              <FileText size={20} className="text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-900">No requests found</p>
            <p className="text-sm text-gray-400 mt-1 mb-6 max-w-xs leading-normal">
              Try changing your filters or create a brand new request to get started.
            </p>
            {(statusFilter === 'all' && !searchQuery.trim()) && (
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 rounded-xl bg-[#0f6e56] px-5 h-10 text-sm font-semibold text-white hover:bg-[#085041] transition-all"
              >
                <Plus size={16} />
                Create a Request
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              {paginatedRequests.map(req => (
                <RequestRow
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