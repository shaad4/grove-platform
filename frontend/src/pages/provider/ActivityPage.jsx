import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronDown, Loader2, ArrowUpRight,
  CheckCircle2, FileText, MessageSquare, Bell,
  Lock, Download,
} from 'lucide-react'
import ProviderLayout from '../../components/layout/ProviderLayout'
import ProviderTopbar from '../../components/layout/ProviderTopbar'
import requestsApi from '../../api/requests.api'
import clientsApi from '../../api/clients.api'
import { getAvatarColor, getInitials, timeAgo } from '../../utils/clientHelpers'

// ── Event type config ─────────────────────────────────────────
const EVENT_CONFIG = {
  request_created:  { icon: FileText,      color: 'text-[#0f6e56]',  dot: 'bg-[#0f6e56]',  label: 'Requests' },
  status_change:    { icon: ArrowUpRight,  color: 'text-[#6366f1]',  dot: 'bg-[#6366f1]',  label: 'Status changes' },
  message_sent:     { icon: MessageSquare, color: 'text-[#f59e0b]',  dot: 'bg-[#f59e0b]',  label: 'Messages' },
  delivery_created: { icon: CheckCircle2,  color: 'text-[#0f6e56]',  dot: 'bg-[#0f6e56]',  label: 'Deliveries' },
  note_added:       { icon: Lock,          color: 'text-[#9ea89e]',  dot: 'bg-[#9ea89e]',  label: 'Notes' },
  file_uploaded:    { icon: FileText,      color: 'text-[#9ea89e]',  dot: 'bg-[#9ea89e]',  label: 'Files' },
  ai_summary_generated: { icon: Bell,     color: 'text-[#0f6e56]',  dot: 'bg-[#0f6e56]',  label: 'AI events' },
}

const STATUS_PILL = {
  received:    'bg-[#e6f5f0] text-[#085041]',
  in_review:   'bg-[#fef3e2] text-[#92500a]',
  in_progress: 'bg-[#eef2ff] text-[#3730a3]',
  delivered:   'bg-[#e6f5f0] text-[#0f6e56]',
  closed:      'bg-[#f3f4f3] text-[#4a544a]',
}

const STATUS_LABEL = {
  received: 'Received', in_review: 'In Review', in_progress: 'In Progress',
  delivered: 'Delivered', closed: 'Closed',
}

function Avatar({ name = '', size = 'sm', isAI = false }) {
  if (isAI) return (
    <div className="h-7 w-7 rounded-full bg-[#e6f5f0] flex items-center justify-center shrink-0">
      <span className="text-[9px] font-bold text-[#0f6e56]">AI</span>
    </div>
  )
  const c = getAvatarColor(name)
  return (
    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${c.bg} ${c.text}`}>
      {getInitials(name)}
    </div>
  )
}

function StatusTransitionBadge({ from, to }) {
  return (
    <span className="inline-flex items-center gap-1.5 ml-1">
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_PILL[from] || 'bg-[#f3f4f3] text-[#4a544a]'}`}>
        {STATUS_LABEL[from] || from}
      </span>
      <ArrowUpRight size={11} className="text-[#9ea89e]" />
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_PILL[to] || 'bg-[#f3f4f3] text-[#4a544a]'}`}>
        {STATUS_LABEL[to] || to}
      </span>
    </span>
  )
}

function groupByDate(activities) {
  const groups = {}
  activities.forEach(a => {
    const d = new Date(a.created_at)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    let label
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!groups[label]) groups[label] = []
    groups[label].push(a)
  })
  return groups
}

function ActivityRow({ activity, onNavigate }) {
  const [expanded, setExpanded] = useState(false)
  const isAI = activity.actor_source === 'ai'
  const isSystem = activity.actor_source === 'system'
  const actorName = activity.actor_name || (isAI ? 'Grove AI' : 'System')
  const isYou = activity.is_current_user === true

  const cfg = EVENT_CONFIG[activity.event_type] || EVENT_CONFIG.request_created
  const meta = activity.metadata || {}
  const target = activity.target_info || {}

  const hasTransition = activity.event_type === 'status_change' && meta.from && meta.to
  const hasSummary = activity.event_type === 'ai_summary_generated' && activity.description

  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-[#f1f3f1] last:border-0 group hover:bg-[#fafafa]/40 px-2 rounded-xl transition-colors">
      <div className="flex flex-col items-center pt-1.5 shrink-0">
        <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      </div>

      <Avatar name={actorName} isAI={isAI} />

      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-[#141a14] leading-relaxed">
          <span className={`font-semibold mr-1.5 ${isAI ? 'text-[#0f6e56]' : 'text-[#141a14]'}`}>
            {isYou ? 'You' : actorName}
          </span>
          <span className="text-[#4a544a]">{activity.description}</span>
          
          {target.request_ref && (
            <button
              onClick={() => onNavigate && onNavigate(target.request_id)}
              className="ml-1.5 inline-font font-medium text-[#0f6e56] hover:underline"
              title={target.request_title}
            >
              for <span className="font-semibold">{target.request_ref}</span>
            </button>
          )}

          {hasTransition && <StatusTransitionBadge from={meta.from} to={meta.to} />}
          
          {meta.file_count && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f5f0] px-2 py-0.5 text-[11px] font-medium text-[#0f6e56] ml-2">
              <CheckCircle2 size={10} /> {meta.file_count} files
            </span>
          )}
        </div>

        {target.request_title && (
          <p className="text-[11px] text-[#9ea89e] mt-0.5 truncate max-w-xl">
            {target.request_title}
          </p>
        )}

        {hasSummary && (
          <div className="mt-2 rounded-xl bg-[#f0faf6] border border-[#d1fae5] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#0f6e56]">Summary:</span>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[12px] text-[#0f6e56] hover:underline"
              >
                {expanded ? 'Less ↑' : 'More ↓'}
              </button>
            </div>
            {expanded && <p className="text-[12px] text-[#4a544a] mt-1 leading-relaxed">{activity.description}</p>}
          </div>
        )}
      </div>

      {/* Simplified Right Anchor Flank Container */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        {target.client_name && (
          <div 
            className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold ${getAvatarColor(target.client_name).bg} ${getAvatarColor(target.client_name).text}`}
            title={`Client: ${target.client_name}`}
          >
            {getInitials(target.client_name)}
          </div>
        )}
        <span className="text-[12px] text-[#9ea89e] w-16 text-right whitespace-nowrap">
          {timeAgo(activity.created_at)}
        </span>
      </div>
    </div>
  )
}

const FILTER_TABS = [
  { key: 'all', label: 'All events' },
  { key: 'request_created', label: 'Requests' },
  { key: 'message_sent', label: 'Messages' },
  { key: 'status_change', label: 'Status changes' },
  { key: 'delivery_created', label: 'Deliveries' },
  { key: 'note_added', label: 'Notes' },
]

const DATE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

export default function ActivityPage() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7')
  const [visibleCount, setVisibleCount] = useState(13)

  useEffect(() => {
    const load = async () => {
      try {
        const reqRes = await requestsApi.list()
        const reqs = reqRes.data.data?.requests || []

        const allActivities = []
        await Promise.all(
          reqs.slice(0, 15).map(async r => {
            try {
              const res = await requestsApi.getActivity(r.id)
              const acts = (res.data.data || []).map(a => ({
                ...a,
                request_title: r.title,
                request_id: r.id,
              }))
              allActivities.push(...acts)
            } catch { /* skip */ }
          })
        )
        allActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setActivities(allActivities)
      } catch { /* error silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const now = new Date()
  const cutoff = new Date(now - parseInt(dateRange) * 86400000)

  const filtered = activities.filter(a => {
    if (eventFilter !== 'all' && a.event_type !== eventFilter) return false
    if (new Date(a.created_at) < cutoff) return false
    if (search) {
      const q = search.toLowerCase()
      return (a.target_info?.request_title || '').toLowerCase().includes(q) ||
        (a.actor_name || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q) ||
        (a.target_info?.client_name || '').toLowerCase().includes(q)
    }
    return true
  })

  const grouped = groupByDate(filtered.slice(0, visibleCount))

  return (
    <ProviderLayout
      badges={{}}
      topbar={
        <ProviderTopbar
          title="Activity"
          // rightSlot={
          //   // <button className="flex items-center gap-2 rounded-xl border border-[#e8eae8] bg-white px-3 py-2 text-[12px] font-medium text-[#4a544a] hover:border-[#0f6e56]/30 transition-colors">
          //   //   <Download size={13} className="text-[#9ea89e]" />
          //   //   Export CSV
          //   // </button>
          // }
        />
      }
    >
      <div className="p-6">
        <div className="rounded-2xl border border-[#e8eae8] bg-white overflow-hidden">

          {/* Search + Input layout */}
          <div className="flex items-center gap-3 p-4 border-b border-[#f1f3f1]">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ea89e]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search activity by client, request title, context..."
                className="w-full h-9 rounded-xl border border-[#e8eae8] pl-9 pr-4 text-[13px] outline-none placeholder:text-[#9ea89e] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {DATE_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setDateRange(o.value)}
                  className={`flex items-center gap-1.5 h-9 rounded-lg border px-3 text-[12px] font-medium transition-colors
                    ${dateRange === o.value ? 'border-[#0f6e56] bg-[#e6f5f0] text-[#0f6e56]' : 'border-[#e8eae8] text-[#4a544a] hover:border-[#0f6e56]/30'}
                  `}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f3f1]">
            <div className="flex items-center gap-1">
              <span className="text-[12px] font-semibold text-[#9ea89e] mr-2">Filter by:</span>
              {FILTER_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setEventFilter(key)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors
                    ${eventFilter === key ? 'bg-[#0f6e56] text-white' : 'text-[#4a544a] hover:bg-[#f7f8f7]'}`
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 h-8 rounded-lg border border-[#e8eae8] px-3 text-[12px] font-medium text-[#4a544a] hover:border-[#0f6e56]/30 transition-colors">
              All clients <ChevronDown size={12} className="text-[#9ea89e]" />
            </button>
          </div>

          {/* Cleaned minimalist event metadata readout block */}
          {!loading && (
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#f1f3f1] bg-[#fafafa]">
              <p className="text-[12px] text-[#4a544a]">
                Showing <span className="font-semibold text-[#141a14]">{filtered.length} logs</span> matching your tracking timeframe filter selection criteria.
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin text-[#0f6e56]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell size={24} className="text-[#9ea89e] mb-3" />
              <p className="text-[15px] font-medium text-[#141a14]">No activity found</p>
              <p className="text-[13px] text-[#9ea89e] mt-1">Try adjusting your filters or date range</p>
            </div>
          ) : (
            <div className="px-5 divide-y divide-[#f1f3f1]">
              {Object.entries(grouped).map(([date, acts]) => (
                <div key={date} className="pt-2">
                  <div className="flex items-center justify-between py-2 sticky top-0 bg-white z-10">
                    <p className="text-[12px] font-semibold text-[#141a14]">{date}</p>
                    <p className="text-[11px] text-[#9ea89e]">{acts.length} logs</p>
                  </div>
                  <div className="pb-3">
                    {acts.map(a => (
                      <ActivityRow
                        key={a.id}
                        activity={a}
                        onNavigate={id => navigate(`/requests/${id}`)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {filtered.length > visibleCount && (
                <div className="py-5 text-center border-t border-[#f1f3f1]">
                  <button
                    onClick={() => setVisibleCount(v => v + 25)}
                    className="text-[13px] font-medium text-[#0f6e56] hover:underline"
                  >
                    Load more events
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProviderLayout>
  )
}