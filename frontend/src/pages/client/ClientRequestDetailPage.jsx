import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ChatPanel from '../../components/chat/ChatPanel'
import ConnectionPill from '../../components/ui/ConnectionPill'
import { usePanelResize } from '../../hooks/usePanelResize'
import {
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock3,
  FileText,
  Download,
  Sparkles,
  Send,
  Paperclip,
  MessageSquare,
  X,
  RotateCcw,
  Pencil,
} from 'lucide-react'

import ClientLayout from '../../components/layout/ClientLayout'
import requestsApi from '../../api/requests.api'
import { timeAgo, formatDate } from '../../utils/clientHelpers'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  received:    { label: 'Submitted',   step: 0 },
  in_review:   { label: 'In review',   step: 1 },
  in_progress: { label: 'In progress', step: 2 },
  delivered:   { label: 'Delivered',   step: 3 },
  closed:      { label: 'Completed',   step: 4 },
}

const STATUS_STEPS = ['received', 'in_review', 'in_progress', 'delivered', 'closed']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

function getDueDateText(date) {
  if (!date) return null
  const today = new Date()
  const due   = new Date(date)
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
  if (diff < 0)  return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? 's' : ''}`
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `Due in ${diff} days`
}

// ─── Delivery Review Modal ────────────────────────────────────────────────────

function DeliveryReviewModal({ delivery, onClose, onSubmit, loading }) {
  const [step, setStep] = useState('choice') // 'choice' | 'rework'
  const [reworkMessage, setReworkMessage] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => !loading && onClose()}
      />

      {/* Sheet / Modal */}
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden">

        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#e8eae8]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eae8]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#141a14]">
              {step === 'choice' ? 'Review delivery' : 'Request rework'}
            </h2>
            <p className="text-[12px] text-[#9ea89e] mt-0.5">
              Delivery #{delivery.delivery_number}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="h-8 w-8 rounded-lg border border-[#e8eae8] flex items-center justify-center text-[#9ea89e] hover:text-[#141a14] transition-colors disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">

          {step === 'choice' ? (
            <div className="space-y-3">

              <p className="text-[13px] text-[#4a544a] leading-6 mb-4">
                Happy with the work? Approve to close this request. Need changes? Request a rework and leave a note for your provider.
              </p>

              {/* Approve option */}
              <button
                onClick={() => onSubmit(delivery.id, 'approve', '')}
                disabled={loading}
                className="w-full flex items-center gap-4 rounded-xl border-2 border-[#0f6e56] p-4 text-left hover:bg-[#f3fbf7] transition-colors disabled:opacity-50 group"
              >
                <div className="h-10 w-10 rounded-xl bg-[#edf7f3] flex items-center justify-center shrink-0">
                  {loading ? (
                    <Loader2 size={18} className="animate-spin text-[#0f6e56]" />
                  ) : (
                    <CheckCircle2 size={18} className="text-[#0f6e56]" />
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#141a14]">
                    Approve & close
                  </p>
                  <p className="text-[12px] text-[#9ea89e] mt-0.5">
                    Marks this request as completed
                  </p>
                </div>
              </button>

              {/* Rework option */}
              <button
                onClick={() => setStep('rework')}
                disabled={loading}
                className="w-full flex items-center gap-4 rounded-xl border border-[#e8eae8] p-4 text-left hover:bg-[#f7f8f7] transition-colors disabled:opacity-50"
              >
                <div className="h-10 w-10 rounded-xl bg-[#f5f7f5] flex items-center justify-center shrink-0">
                  <RotateCcw size={18} className="text-[#9ea89e]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#141a14]">
                    Request rework
                  </p>
                  <p className="text-[12px] text-[#9ea89e] mt-0.5">
                    Sends it back with a note for changes
                  </p>
                </div>
              </button>

            </div>
          ) : (
            <div className="space-y-4">

              <p className="text-[13px] text-[#4a544a] leading-6">
                Let your provider know what needs to change. This is optional but helps them get it right the next time.
              </p>

              <textarea
                value={reworkMessage}
                onChange={e => setReworkMessage(e.target.value)}
                placeholder="e.g. The logo needs to be centered and the font size increased on mobile..."
                rows={4}
                autoFocus
                className="w-full rounded-xl border border-[#e8eae8] bg-[#fafbfa] px-4 py-3 text-[13px] text-[#141a14] placeholder:text-[#9ea89e] resize-none focus:outline-none focus:border-[#0f6e56] transition-colors"
              />

              <div className="flex gap-3">

                <button
                  onClick={() => setStep('choice')}
                  disabled={loading}
                  className="h-10 px-4 rounded-xl border border-[#e8eae8] text-[13px] text-[#9ea89e] hover:text-[#141a14] transition-colors disabled:opacity-50"
                >
                  Back
                </button>

                <button
                  onClick={() => onSubmit(delivery.id, 'rework', reworkMessage)}
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl bg-[#141a14] text-white text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#1f2a1f] transition-colors"
                >
                  {loading
                    ? <Loader2 size={14} className="animate-spin" />
                    : <RotateCcw size={14} />
                  }
                  Send rework request
                </button>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientRequestDetailPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()

  const [req, setReq]               = useState(null)
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showChat, setShowChat]     = useState(false)

  const [activities, setActivities] = useState([])

  // Review modal
  const [reviewModal, setReviewModal]   = useState(null)  // delivery object | null
  const [reviewLoading, setReviewLoading] = useState(false)

  
  // Edit Request
  const [isEditing, setIsEditing]   = useState(false)
  const [editTitle, setEditTitle]   = useState('')
  const [editDesc, setEditDesc]     = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError]   = useState(null)

  const { width: sidebarWidth, onMouseDown: startSidebarResize } = usePanelResize({
    storageKey: 'client-request-sidebar-width',
    initialWidth: 340,
    minWidth: 280,
    maxWidth: 480,
    direction: 'left',
  })

  const { width: chatWidth, onMouseDown: startChatResize } = usePanelResize({
    storageKey: 'client-request-chat-width',
    initialWidth: 360,
    minWidth: 300,
    maxWidth: 650,
    direction: 'right',
  })


  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingSidebar.current) {
        setSidebarWidth(Math.max(280, Math.min(480, e.clientX)))
      } else if (isResizingChat.current) {
        setChatWidth(Math.max(300, Math.min(500, window.innerWidth - e.clientX)))
      }
    }
    const handleMouseUp = () => {
      if (isResizingSidebar.current || isResizingChat.current) {
        isResizingSidebar.current = false
        isResizingChat.current    = false
        document.body.style.cursor    = ''
        document.body.style.userSelect = ''
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup',   handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup',   handleMouseUp)
    }
  }, [])

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      const [reqRes, delRes, actRes] = await Promise.all([
        requestsApi.get(requestId),
        requestsApi.getDeliveries(requestId),
        requestsApi.getActivity(requestId),
      ])
      setReq(reqRes.data.data)
      setDeliveries(delRes.data.data || [])
      setActivities(actRes.data.data || []) 
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }, [requestId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleEditSave = async () => {
    setEditLoading(true)
    setEditError(null)
    try {
      await requestsApi.update(requestId, {
        title: editTitle,
        description: editDesc,
      })
      await fetchAll()
      setIsEditing(false)
    } catch (err) {
      setEditError(err?.response?.data?.message || 'Failed to save changes.')
    } finally {
      setEditLoading(false)
    }
  } 

  // ── Review handler ─────────────────────────────────────────────────────────

  const handleReview = async (deliveryId, action, message) => {
    setReviewLoading(true)
    try {
      await requestsApi.reviewDelivery(requestId, deliveryId, action, message)
      await fetchAll()
      setReviewModal(null)
    } catch {
      //
    } finally {
      setReviewLoading(false)
    }
  }

  // ── Loading / not found states ─────────────────────────────────────────────

  if (loading) {
    return (
      <ClientLayout>
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <Loader2 size={22} className="animate-spin text-[#0f6e56]" />
        </div>
      </ClientLayout>
    )
  }

  if (!req) {
    return (
      <ClientLayout>
        <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-6">
          <div className="h-16 w-16 rounded-2xl bg-[#f5f7f5] flex items-center justify-center mb-4">
            <AlertCircle size={28} className="text-[#9ea89e]" />
          </div>
          <h2 className="text-[18px] font-semibold text-[#141a14]">Request not found</h2>
          <p className="text-[13px] text-[#9ea89e] mt-1">
            The request may have been removed or unavailable.
          </p>
          <button
            onClick={() => navigate('/my-requests')}
            className="mt-5 h-10 px-4 rounded-xl border border-[#e8eae8] bg-white text-[13px] font-medium text-[#141a14]"
          >
            Back to requests
          </button>
        </div>
      </ClientLayout>
    )
  }

  const cfg         = STATUS_CONFIG[req.status] || STATUS_CONFIG.received
  const currentStep = cfg.step

  // Latest delivery number — used to know which card gets the review button
  const latestDeliveryNumber = deliveries.length
    ? Math.max(...deliveries.map(d => d.delivery_number))
    : null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ClientLayout>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#fbfcfb]">

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="h-[68px] border-b border-[#e8eae8] bg-white px-4 lg:px-6 flex items-center justify-between shrink-0">

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[12px] text-[#9ea89e] mb-1">
              <button
                onClick={() => navigate('/my-requests')}
                className="hover:text-[#141a14]"
              >
                My requests
              </button>
              <ChevronRight size={12} />
              <span className="truncate max-w-[180px] lg:max-w-none">{req.title}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[16px] lg:text-[18px] font-semibold text-[#141a14] truncate">
                {req.title}
              </h1>
              <div className="h-6 px-2.5 rounded-full bg-[#edf7f3] text-[#0f6e56] text-[11px] font-semibold flex items-center">
                {cfg.label}
              </div>
            </div>
          </div>

          {/* Mobile chat button */}
          <button
            onClick={() => setShowChat(true)}
            className="lg:hidden h-10 px-3 rounded-xl border border-[#e8eae8] bg-white flex items-center gap-2"
          >
            <MessageSquare size={15} className="text-[#141a14]" />
            <span className="text-[12px] font-medium text-[#141a14]">Chat</span>
          </button>

        </div>

        {/* ── MAIN LAYOUT ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden h-full">

          {/* LEFT SIDEBAR */}
          <div
            style={{ width: window.innerWidth >= 1024 ? `${sidebarWidth}px` : '100%' }}
            className="w-full lg:w-[340px] border-r border-[#e8eae8] bg-white overflow-y-auto no-scrollbar shrink-0 h-full"
          >
            <div className="p-4 lg:p-5 space-y-4">

              {/* Progress */}
              <div className="rounded-2xl border border-[#e8eae8] bg-white p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[15px] font-semibold text-[#141a14]">Progress</h2>
                  <span className="text-[12px] font-semibold text-[#0f6e56]">{cfg.label}</span>
                </div>

                <div className="space-y-0">
                  {STATUS_STEPS.map((step, index) => {
                    const isDone    = index < currentStep
                    const isCurrent = index === currentStep
                    return (
                      <div key={step} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center
                            ${isCurrent || isDone ? 'bg-[#0f6e56] border-[#0f6e56]' : 'bg-white border-[#d9ded9]'}`}
                          >
                            {isDone    && <CheckCircle2 size={8} className="text-white" />}
                            {isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                          {index < STATUS_STEPS.length - 1 && (
                            <div className={`w-0.5 h-7 mt-1 ${isDone ? 'bg-[#0f6e56]/30' : 'bg-[#e8eae8]'}`} />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className={`text-[13px] font-medium
                            ${isCurrent ? 'text-[#0f6e56]' : isDone ? 'text-[#141a14]' : 'text-[#9ea89e]'}`}
                          >
                            {STATUS_CONFIG[step].label}
                          </p>
                          {isCurrent && (
                            <p className="text-[11px] text-[#9ea89e] mt-0.5">
                              Updated {timeAgo(req.updated_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Meta */}
              <div className="rounded-2xl border border-[#e8eae8] bg-white p-5">
                <div className="space-y-4">

                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#f5f7f5] flex items-center justify-center shrink-0">
                      <Calendar size={16} className="text-[#9ea89e]" />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#9ea89e] mb-1">Submitted</p>
                      <p className="text-[13px] font-medium text-[#141a14]">{formatDate(req.created_at)}</p>
                    </div>
                  </div>

                  {req.due_date && (
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#f5f7f5] flex items-center justify-center shrink-0">
                        <Clock3 size={16} className="text-[#9ea89e]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-[#9ea89e] mb-1">Due date</p>
                        <p className="text-[13px] font-medium text-[#141a14]">{formatDate(req.due_date)}</p>
                        <p className="text-[11px] text-[#0f6e56] mt-1 font-medium">{getDueDateText(req.due_date)}</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-[#e8eae8] bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[15px] font-semibold text-[#141a14]">Request details</h2>
                  {req.status === 'received' && !isEditing && (
                    <button
                      onClick={() => {
                        setEditTitle(req.title)
                        setEditDesc(req.description)
                        setIsEditing(true)
                        setEditError(null)
                      }}
                      className="h-7 px-2.5 rounded-lg border border-[#e8eae8] flex items-center gap-1.5 text-[11px] text-[#9ea89e] hover:text-[#141a14] hover:border-[#d0d4d0] transition-colors"
                    >
                      <Pencil size={11} />
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-[#9ea89e] mb-1.5 block">Title</label>
                      <input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full rounded-xl border border-[#e8eae8] bg-[#fafbfa] px-4 py-2.5 text-[13px] text-[#141a14] focus:outline-none focus:border-[#0f6e56] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#9ea89e] mb-1.5 block">Description</label>
                      <textarea
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        rows={5}
                        className="w-full rounded-xl border border-[#e8eae8] bg-[#fafbfa] px-4 py-3 text-[13px] text-[#141a14] resize-none focus:outline-none focus:border-[#0f6e56] transition-colors"
                      />
                    </div>

                    {editError && (
                      <p className="text-[12px] text-red-500">{editError}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => { setIsEditing(false); setEditError(null) }}
                        disabled={editLoading}
                        className="h-9 px-4 rounded-xl border border-[#e8eae8] text-[12px] text-[#9ea89e] hover:text-[#141a14] transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditSave}
                        disabled={editLoading || !editTitle.trim() || !editDesc.trim()}
                        className="flex-1 h-9 rounded-xl bg-[#141a14] text-white text-[12px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#1f2a1f] transition-colors"
                      >
                        {editLoading
                          ? <Loader2 size={13} className="animate-spin" />
                          : <CheckCircle2 size={13} />
                        }
                        Save changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] leading-7 text-[#4a544a] whitespace-pre-wrap">
                    {req.description}
                  </p>
                )}
              </div>

              {/* Attachments */}
              <div className="rounded-2xl border border-[#e8eae8] bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-[15px] font-semibold text-[#141a14]">Attachments</h2>
                    <p className="text-[12px] text-[#9ea89e] mt-0.5">{req.files?.length || 0} files</p>
                  </div>
                  <FileText size={16} className="text-[#9ea89e]" />
                </div>

                {!req.files?.length ? (
                  <div className="rounded-xl bg-[#f7f8f7] py-6 text-center">
                    <p className="text-[12px] text-[#9ea89e]">No attachments</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {req.files.map(file => (
                    <a
                      key={file.id}
                      href={file.download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-[#e8eae8] px-3 py-3 hover:bg-[#f7f8f7] transition-colors"
                    >
                      <div className="h-10 w-10 rounded-xl bg-[#f5f7f5] flex items-center justify-center shrink-0">
                        <FileText size={15} className="text-[#9ea89e]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#141a14] truncate">{file.file_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-[#9ea89e]">{formatFileSize(file.file_size_bytes)}</span>
                          <span className="text-[#d6dad6]">•</span>
                          <span className="text-[11px] text-[#9ea89e] uppercase">{file.file_extension}</span>
                        </div>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          try {
                            const res = await fetch(file.download_url)
                            const blob = await res.blob()
                            const blobUrl = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = blobUrl
                            a.download = file.file_name
                            a.click()
                            URL.revokeObjectURL(blobUrl)
                          } catch {
                            window.open(file.download_url, '_blank')
                          }
                        }}
                        className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-[#9ea89e] hover:text-[#0f6e56] hover:bg-[#edf7f3] transition-colors"
                      >
                        <Download size={15} />
                      </button>
                    </a>
                  ))}
                  </div>
                )}
              </div>

              {/* AI summary */}
              {req.ai_summary && (
                <div className="rounded-2xl border border-[#d8f3e8] bg-[#f3fbf7] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-[#e4f7ef] flex items-center justify-center">
                      <Sparkles size={14} className="text-[#0f6e56]" />
                    </div>
                    <div>
                      <h2 className="text-[14px] font-semibold text-[#141a14]">AI summary</h2>
                      <p className="text-[11px] text-[#9ea89e]">Auto generated</p>
                    </div>
                  </div>
                  <p className="text-[13px] leading-7 text-[#4a544a]">{req.ai_summary}</p>
                </div>
              )}

            </div>
          </div>

          {/* Sidebar resize handle */}
          <div
            onMouseDown={startSidebarResize}
            className="hidden lg:flex w-[5px] shrink-0 relative cursor-col-resize group items-center justify-center bg-transparent hover:bg-[#0f6e56]/10 transition-colors z-10"
            title="Drag to resize sidebar"
          >
            <div className="absolute inset-y-0 left-[2px] w-px bg-[#e8eae8] group-hover:bg-[#0f6e56]/30 transition-colors" />
            <div className="relative z-10 flex flex-col gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#0f6e56]/50" />
              ))}
            </div>
          </div>

          {/* ── CENTER — DELIVERIES ────────────────────────────────────────── */}
          <div className="hidden md:flex flex-1 flex-col overflow-hidden h-full">

            <div className="h-[68px] border-b border-[#e8eae8] bg-white px-6 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[15px] font-semibold text-[#141a14]">Deliveries</h2>
                <p className="text-[12px] text-[#9ea89e] mt-0.5">Files and updates from your provider</p>
              </div>
              <div className="h-8 px-3 rounded-full bg-[#f5f7f5] text-[11px] font-medium text-[#4a544a] flex items-center">
                {deliveries.length} updates
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6">

              {/* ── Pending review banner ──────────────────────────────────── */}
              {req.status === 'delivered' && deliveries.length > 0 && (
                <div className="mb-5 rounded-2xl border border-[#d8f3e8] bg-[#f3fbf7] px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#edf7f3] flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} className="text-[#0f6e56]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#141a14]">
                        Your delivery is ready for review
                      </p>
                      <p className="text-[12px] text-[#4a544a] mt-0.5">
                        Approve to close, or request changes if needed.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const latest = deliveries.find(d => d.delivery_number === latestDeliveryNumber)
                      setReviewModal(latest)
                    }}
                    className="shrink-0 h-9 px-4 rounded-xl bg-[#0f6e56] text-white text-[12px] font-semibold hover:bg-[#085041] transition-colors"
                  >
                    Review
                  </button>
                </div>
              )}

              {deliveries.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="max-w-sm text-center">
                    <div className="h-16 w-16 rounded-2xl bg-[#f5f7f5] flex items-center justify-center mx-auto mb-4">
                      <Send size={24} className="text-[#9ea89e]" />
                    </div>
                    <h3 className="text-[16px] font-semibold text-[#141a14]">No deliveries yet</h3>
                    <p className="text-[13px] text-[#9ea89e] mt-2 leading-6">
                      Delivered files and updates will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {deliveries.map(delivery => {
                    const isLatest = delivery.delivery_number === latestDeliveryNumber
                    const isPendingReview = req.status === 'delivered' && isLatest

                    return (
                      <div
                        key={delivery.id}
                        className={`rounded-2xl border bg-white overflow-hidden
                          ${isPendingReview ? 'border-[#0f6e56]/30' : 'border-[#e8eae8]'}`}
                      >
                        {/* Card header */}
                        <div className="px-5 py-4 border-b border-[#e8eae8] bg-[#fcfcfc]">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-[14px] font-semibold text-[#141a14]">
                                  Delivery #{delivery.delivery_number}
                                </h3>
                                {isPendingReview ? (
                                  <div className="h-6 px-2 rounded-full bg-[#fff8e6] text-[#92500a] text-[10px] font-semibold flex items-center gap-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                                    Awaiting your review
                                  </div>
                                ) : (
                                  <div className="h-6 px-2 rounded-full bg-[#edf7f3] text-[#0f6e56] text-[10px] font-semibold flex items-center">
                                    Delivered
                                  </div>
                                )}
                              </div>
                              <p className="text-[12px] text-[#9ea89e] mt-1">{timeAgo(delivery.created_at)}</p>
                            </div>

                            {/* Per-card review button — only on latest when delivered */}
                            {isPendingReview && (
                              <button
                                onClick={() => setReviewModal(delivery)}
                                className="h-8 px-3 rounded-lg border border-[#0f6e56] text-[#0f6e56] text-[12px] font-semibold hover:bg-[#f3fbf7] transition-colors flex items-center gap-1.5"
                              >
                                <CheckCircle2 size={13} />
                                Review
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Card body */}
                        <div className="p-5">

                          {delivery.message && (
                            <p className="text-[13px] leading-7 text-[#4a544a] whitespace-pre-wrap mb-5">
                              {delivery.message}
                            </p>
                          )}
                          
                          {!!delivery.links?.length && (
                            <div className="space-y-2 mb-5">
                              {delivery.links.map((link, i) => (
                                <a
                                  key={i}
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group flex items-center gap-3 rounded-xl border border-[#e8eae8] px-4 py-3 hover:bg-[#f3fbf7] transition-colors"
                                >
                                  <div className="h-10 w-10 rounded-xl bg-[#edf7f3] flex items-center justify-center shrink-0">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f6e56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium text-[#141a14] truncate">
                                      {link.label || link.url}
                                    </p>
                                    {link.label && (
                                      <p className="text-[11px] text-[#9ea89e] truncate mt-0.5">{link.url}</p>
                                    )}
                                  </div>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9ea89e] group-hover:text-[#0f6e56] shrink-0">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15 3 21 3 21 9"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                  </svg>
                                </a>
                              ))}
                            </div>
                          )}

                          {!!delivery.files?.length && (
                            <div className="space-y-2">
                              {delivery.files.map(file => (
                              <a
                                key={file.id}
                                href={file.download_url}
                                target="_blank"
                                rel="noreferrer"
                                className="group flex items-center gap-3 rounded-xl border border-[#e8eae8] px-4 py-3 hover:bg-[#f7f8f7] transition-colors"
                              >
                                <div className="h-10 w-10 rounded-xl bg-[#f5f7f5] flex items-center justify-center shrink-0">
                                  <FileText size={15} className="text-[#9ea89e]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-medium text-[#141a14] truncate">{file.file_name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[11px] text-[#9ea89e]">{formatFileSize(file.file_size_bytes)}</span>
                                    <span className="text-[#d6dad6]">•</span>
                                    <span className="text-[11px] text-[#9ea89e] uppercase">{file.file_extension}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={async (e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    try {
                                      const res = await fetch(file.download_url)
                                      const blob = await res.blob()
                                      const blobUrl = URL.createObjectURL(blob)
                                      const a = document.createElement('a')
                                      a.href = blobUrl
                                      a.download = file.file_name
                                      a.click()
                                      URL.revokeObjectURL(blobUrl)
                                    } catch {
                                      window.open(file.download_url, '_blank')
                                    }
                                  }}
                                  className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-[#9ea89e] hover:text-[#0f6e56] hover:bg-[#edf7f3] transition-colors"
                                >
                                  <Download size={15} />
                                </button>
                              </a>
                            ))}
                            </div>
                          )}

                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

            </div>
          </div>

          {/* Chat resize handle */}
          <div
            onMouseDown={startChatResize}
            className="hidden lg:flex w-[5px] shrink-0 relative cursor-col-resize group items-center justify-center bg-transparent hover:bg-[#0f6e56]/10 transition-colors z-10"
            title="Drag to resize conversation"
          >
            <div className="absolute inset-y-0 left-[2px] w-px bg-[#e8eae8] group-hover:bg-[#0f6e56]/30 transition-colors" />
            <div className="relative z-10 flex flex-col gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#0f6e56]/50" />
              ))}
            </div>
          </div>

          {/* ── DESKTOP CHAT ───────────────────────────────────────────────── */}
          
          <div
            style={{ width: `${chatWidth}px` }}
            className="hidden lg:flex border-l border-[#e8eae8] bg-white flex-col shrink-0 h-full overflow-hidden"
          >
            {/* Chat header */}
            <div className="h-[68px] border-b border-[#e8eae8] px-5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[15px] font-semibold text-[#141a14]">Conversation</h2>
                <p className="text-[12px] text-[#9ea89e] mt-0.5">with your provider</p>
              </div>
              <ConnectionPill connectionKey={`chat-${requestId}`} />
            </div>

            <ChatPanel
              clientName={req?.provider_name || 'Provider'}
              requestId={requestId}
              requestStatus={req?.status}
              activities={[]}
            />
          </div>

        </div>

        {/* ── MOBILE CHAT DRAWER ────────────────────────────────────────────── */}
        {showChat && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
            <div className="h-[64px] border-b border-[#e8eae8] px-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[15px] font-semibold text-[#141a14]">Conversation</h2>
                <p className="text-[12px] text-[#9ea89e]">Messaging coming soon</p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="h-10 w-10 rounded-xl border border-[#e8eae8] flex items-center justify-center"
              >
                <X size={18} className="text-[#141a14]" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center px-8 min-h-0 overflow-y-auto no-scrollbar">
              <div className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-[#f5f7f5] flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={22} className="text-[#9ea89e]" />
                </div>
                <h3 className="text-[15px] font-semibold text-[#141a14]">Chat coming soon</h3>
                <p className="text-[13px] text-[#9ea89e] mt-2 leading-6">Real-time conversation will appear here.</p>
              </div>
            </div>

            <div className="border-t border-[#e8eae8] p-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-12 rounded-xl border border-[#e8eae8] bg-[#fafbfa] px-4 flex items-center gap-3 opacity-50">
                  <Paperclip size={15} className="text-[#9ea89e]" />
                  <span className="text-[13px] text-[#9ea89e]">Send a message...</span>
                </div>
                <button disabled className="h-12 w-12 rounded-xl bg-[#0f6e56] opacity-50 flex items-center justify-center">
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── DELIVERY REVIEW MODAL ─────────────────────────────────────────── */}
      {reviewModal && (
        <DeliveryReviewModal
          delivery={reviewModal}
          loading={reviewLoading}
          onClose={() => !reviewLoading && setReviewModal(null)}
          onSubmit={handleReview}
        />
      )}

    </ClientLayout>
  )
}