import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronRight, Flag, Calendar, Loader2, AlertCircle,
  Lock, Plus, X, Link2, Upload, FileText,
  CheckCircle2, Circle, Clock, Send, Paperclip,
  MoreHorizontal, Copy, ExternalLink, Download, Pencil, Check,
  GripVertical, ArrowRight, RotateCcw,
} from 'lucide-react'
import ProviderLayout from '../../components/layout/ProviderLayout'
import requestsApi from '../../api/requests.api'
import { getAvatarColor, getInitials, timeAgo, formatDate } from '../../utils/clientHelpers'

// ── Status config ─────────────────────────────────────────────
const STATUS_ORDER = ['received', 'in_review', 'in_progress', 'delivered', 'closed']
const STATUS_CONFIG = {
  received:    { label: 'Received',    pill: 'bg-[#e6f5f0] text-[#085041]',   dot: 'bg-[#1d9e75]' },
  in_review:   { label: 'In Review',   pill: 'bg-[#fef3e2] text-[#92500a]',   dot: 'bg-[#f59e0b]' },
  in_progress: { label: 'In Progress', pill: 'bg-[#eef2ff] text-[#3730a3]',   dot: 'bg-[#6366f1]' },
  delivered:   { label: 'Delivered',   pill: 'bg-[#e6f5f0] text-[#0f6e56]',   dot: 'bg-[#0f6e56]' },
  closed:      { label: 'Closed',      pill: 'bg-[#f3f4f3] text-[#4a544a]',   dot: 'bg-[#9ea89e]' },
}

const VALID_TRANSITIONS = {
  received:    ['in_review', 'closed'],
  in_review:   ['in_progress', 'received', 'closed'],
  in_progress: ['delivered', 'in_review'],
  delivered:   ['closed', 'in_progress'],
  closed:      [],
}

// ── Helpers ───────────────────────────────────────────────────
function Avatar({ name = '', size = 'md' }) {
  const c = getAvatarColor(name)
  const sz = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-[12px]'
  return (
    <div className={`rounded-full flex items-center justify-center font-semibold shrink-0 ${sz} ${c.bg} ${c.text}`}>
      {getInitials(name)}
    </div>
  )
}

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.received
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${cfg.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function FileIcon({ ext }) {
  const isPDF = ext === 'pdf'
  const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  return (
    <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0
      ${isPDF ? 'bg-red-50 text-red-500' : isImg ? 'bg-blue-50 text-blue-500' : 'bg-[#f0f2f0] text-[#9ea89e]'}
    `}>
      {ext?.toUpperCase() || 'FILE'}
    </div>
  )
}

// ── DUE DATE EDITOR ───────────────────────────────────────────
function DueDateEditor({ dueDate, requestId, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(dueDate ? dueDate.slice(0, 10) : '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  const handleSave = async () => {
    setSaving(true)
    try {
      await requestsApi.setDueDate(requestId, value || null)
      onUpdate(value || null)
      setEditing(false)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setValue(dueDate ? dueDate.slice(0, 10) : '')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 rounded-lg border border-[#0f6e56] bg-white px-2.5 py-1 focus-within:ring-2 focus-within:ring-[#0f6e56]/20">
          <Calendar size={12} className="text-[#0f6e56] shrink-0" />
          <input
            ref={inputRef}
            type="date"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="text-[12px] text-[#141a14] outline-none bg-transparent"
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-6 w-6 flex items-center justify-center rounded-md bg-[#0f6e56] text-white hover:bg-[#085041] transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={11} />}
        </button>
        <button
          onClick={handleCancel}
          className="h-6 w-6 flex items-center justify-center rounded-md border border-[#e8eae8] text-[#9ea89e] hover:text-[#141a14] transition-colors"
        >
          <X size={11} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group">
      {dueDate ? (
        <div className="flex items-center gap-1.5 text-[#92500a] font-medium bg-[#fff7ed] px-2 py-0.5 rounded-md w-max">
          <Calendar size={12} className="text-[#f59e0b]" />
          <span className="text-[12px]">Due {formatDate(dueDate)}</span>
        </div>
      ) : (
        <span className="text-[#9ea89e] italic text-[12px]">No date set</span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="h-5 w-5 flex items-center justify-center rounded-md text-[#9ea89e] hover:text-[#0f6e56] hover:bg-[#f0faf6] transition-all opacity-0 group-hover:opacity-100"
        title="Edit due date"
      >
        <Pencil size={10} />
      </button>
    </div>
  )
}

// ── DELIVER MODAL ─────────────────────────────────────────────
function DeliverModal({ request, onClose, onSuccess }) {
  const [mode, setMode] = useState('files')
  const [message, setMessage] = useState('')
  const [links, setLinks] = useState([{ url: '', label: '' }])
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInput = useRef(null)

  const handleFiles = useCallback((newFiles) => {
    const entries = Array.from(newFiles).map(f => ({
      file: f,
      status: 'pending',
      fileId: null
    }))
    setFiles(prev => [...prev, ...entries])
  }, [])

  const uploadAll = async () => {
    const updated = [...files]

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'done') continue

      updated[i].status = 'uploading'
      setFiles([...updated])

      try {
        const result = await requestsApi.uploadFile(request.id, updated[i].file)

        updated[i].status = 'done'
        updated[i].fileId = result.id
        setFiles([...updated])
      } catch {
        updated[i].status = 'error'
        setFiles([...updated])
      }
    }

    return updated
      .filter(f => f.status === 'done')
      .map(f => f.fileId)
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      let fileIds = []

      if (mode !== 'link') {
        fileIds = await uploadAll()
      }

      const validLinks = links
        .filter(l => l.url.trim())
        .map(l => ({
          url: l.url,
          label: l.label || l.url,
        }))

      await requestsApi.createDelivery(request.id, {
        message: message || null,
        links: mode !== 'files' ? validLinks : [],
        file_ids: fileIds,
      })

      await requestsApi.updateStatus(request.id, 'delivered')

      onSuccess()
    } catch {
      setSubmitting(false)
    }
  }

  const clientName = request.client_name || 'Client'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="
          w-full max-w-[1100px]
          overflow-hidden
          border border-[#e8eae8]
          bg-white
          shadow-[0px_24px_60px_rgba(10,46,36,0.16)]
          rounded-none sm:rounded-[24px] lg:rounded-[28px]
          max-h-[95vh]
        "
      >
        <div className="flex flex-col lg:grid lg:grid-cols-[360px_1fr]">

          {/* LEFT PANEL */}
          <div className="relative overflow-hidden border-b border-[#eef0ee] bg-[#f7f8f7] p-6 lg:border-b-0 lg:border-r lg:p-8">

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,110,86,0.08),transparent_45%)]" />

            <div className="relative z-10 flex h-full flex-col">

              <div className="flex items-start justify-between">
                <div>

                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dbe7e1] bg-white px-3 py-1 text-[11px] font-medium text-[#0f6e56]">
                    <div className="h-2 w-2 rounded-full bg-[#0f6e56]" />
                    DELIVERY PORTAL
                  </div>

                  <h2 className="text-[30px] font-semibold leading-tight text-[#0a2e24]">
                    Deliver your work
                  </h2>

                  <p className="mt-3 max-w-[260px] text-[14px] leading-6 text-[#6b756d]">
                    Share files, links, and updates with your client in one clean delivery.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 backdrop-blur hover:bg-white transition-colors"
                >
                  <X size={16} className="text-[#7c867d]" />
                </button>
              </div>

              {/* Preview Card */}
              <div className="mt-10 rounded-2xl border border-[#e3e7e3] bg-white p-5 shadow-sm">

                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f5f0]">
                    <Send size={18} className="text-[#0f6e56]" />
                  </div>

                  <div>
                    <p className="text-[14px] font-medium text-[#141a14]">
                      Delivering to {clientName}
                    </p>

                    <p className="mt-1 text-[12px] leading-5 text-[#7c867d]">
                      Your client will instantly receive access to this delivery.
                    </p>
                  </div>
                </div>

                <div className="my-5 h-px bg-[#eef0ee]" />

                <div className="rounded-xl bg-[#f7f8f7] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-[#9ea89e]">
                    Delivery Type
                  </p>

                  <p className="mt-1 text-[13px] font-medium text-[#0f6e56] capitalize">
                    {mode === 'both'
                      ? 'Files + Links'
                      : mode}
                  </p>
                </div>

                {(files.length > 0 || links.some(l => l.url)) && (
                  <div className="mt-4 flex flex-wrap gap-2">

                    {files.length > 0 && (
                      <span className="rounded-full bg-[#e6f5f0] px-3 py-1 text-[11px] font-medium text-[#085041]">
                        {files.length} File{files.length > 1 ? 's' : ''}
                      </span>
                    )}

                    {links.filter(l => l.url).length > 0 && (
                      <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[11px] font-medium text-[#3730A3]">
                        {links.filter(l => l.url).length} Link{links.filter(l => l.url).length > 1 ? 's' : ''}
                      </span>
                    )}

                  </div>
                )}
              </div>

              <div className="mt-auto pt-8">
                <div className="rounded-2xl border border-[#bfdbfe] bg-[#f0f9ff] p-4">

                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={16}
                      className="mt-0.5 shrink-0 text-[#2563eb]"
                    />

                    <div>
                      <p className="text-[13px] font-medium text-[#1e3a8a]">
                        Status changes to Delivered
                      </p>

                      <p className="mt-1 text-[12px] leading-5 text-[#3b82f6]">
                        Clients can review and request revisions before approval.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="overflow-y-auto p-6 lg:p-10 max-h-[calc(95vh-260px)]">

            <div className="grid gap-7">

              {/* MODE SELECT */}
              <div>

                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#141a14]">
                      What are you delivering?
                    </h3>

                    <p className="mt-1 text-[13px] text-[#9ea89e]">
                      Choose how you want to send the delivery.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">

                  {[
                    { key: 'files', label: 'Files', icon: Upload },
                    { key: 'link', label: 'Links', icon: Link2 },
                    { key: 'both', label: 'Both', icon: FileText },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setMode(key)}
                      className={`
                        group relative overflow-hidden rounded-2xl border-2 p-5 transition-all
                        ${mode === key
                          ? 'border-[#0f6e56] bg-[#f0faf6]'
                          : 'border-[#e8eae8] hover:border-[#0f6e56]/30 hover:bg-[#fafcfb]'
                        }
                      `}
                    >

                      <div className="flex flex-col items-center text-center">

                        <div className={`
                          flex h-12 w-12 items-center justify-center rounded-2xl transition-all
                          ${mode === key
                            ? 'bg-[#0f6e56] text-white'
                            : 'bg-[#f7f8f7] text-[#4a544a] group-hover:bg-[#e6f5f0] group-hover:text-[#0f6e56]'
                          }
                        `}>
                          <Icon size={20} />
                        </div>

                        <p className={`
                          mt-3 text-[14px] font-semibold transition-colors
                          ${mode === key
                            ? 'text-[#0f6e56]'
                            : 'text-[#141a14]'
                          }
                        `}>
                          {label}
                        </p>

                      </div>
                    </button>
                  ))}

                </div>
              </div>

              {/* FILES */}
              {(mode === 'files' || mode === 'both') && (
                <div>

                  <div className="mb-3">
                    <h3 className="text-[15px] font-semibold text-[#141a14]">
                      Upload files
                    </h3>

                    <p className="mt-1 text-[13px] text-[#9ea89e]">
                      Drag and drop your delivery files here.
                    </p>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOver(false)
                      handleFiles(e.dataTransfer.files)
                    }}
                    onClick={() => fileInput.current?.click()}
                    className={`
                      relative overflow-hidden rounded-[24px] border-2 border-dashed p-10 text-center transition-all cursor-pointer
                      ${dragOver
                        ? 'border-[#0f6e56] bg-[#f0faf6]'
                        : 'border-[#dbe7e1] bg-[#fafcfb] hover:border-[#0f6e56]/40 hover:bg-[#f7fbf9]'
                      }
                    `}
                  >

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e6f5f0]">
                      <Upload size={28} className="text-[#0f6e56]" />
                    </div>

                    <h4 className="mt-5 text-[16px] font-semibold text-[#141a14]">
                      Drop files here
                    </h4>

                    <p className="mt-2 text-[13px] text-[#7c867d]">
                      or click to browse from your device
                    </p>

                    <input
                      ref={fileInput}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4 space-y-3">

                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 rounded-2xl border border-[#e8eae8] bg-white px-4 py-3"
                        >

                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f7f8f7]">
                            <FileIcon ext={f.file.name.split('.').pop()} />
                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="truncate text-[14px] font-medium text-[#141a14]">
                              {f.file.name}
                            </p>

                            <p className="mt-1 text-[12px] text-[#9ea89e]">
                              {(f.file.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>

                          {f.status === 'done' && (
                            <div className="flex items-center gap-1.5 rounded-full bg-[#e6f5f0] px-3 py-1 text-[12px] font-medium text-[#0f6e56]">
                              <CheckCircle2 size={13} />
                              Uploaded
                            </div>
                          )}

                          {f.status === 'uploading' && (
                            <Loader2
                              size={16}
                              className="animate-spin text-[#0f6e56]"
                            />
                          )}

                          {f.status === 'pending' && (
                            <button
                              onClick={() => setFiles(files.filter((_, j) => j !== i))}
                              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[#f7f8f7]"
                            >
                              <X size={15} className="text-[#9ea89e]" />
                            </button>
                          )}
                        </div>
                      ))}

                    </div>
                  )}

                </div>
              )}

              {/* LINKS */}
              {(mode === 'link' || mode === 'both') && (
                <div>

                  <div className="mb-3">
                    <h3 className="text-[15px] font-semibold text-[#141a14]">
                      Delivery links
                    </h3>

                    <p className="mt-1 text-[13px] text-[#9ea89e]">
                      Share Figma, Drive, staging URLs, or anything accessible online.
                    </p>
                  </div>

                  <div className="space-y-3">

                    {links.map((link, i) => (
                      <div key={i}>

                        <div className="flex items-center gap-3 rounded-2xl border border-[#e8eae8] bg-white px-4 py-3 transition-all focus-within:border-[#0f6e56] focus-within:ring-4 focus-within:ring-[#0f6e56]/10">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f8f7]">
                            <Link2 size={16} className="text-[#0f6e56]" />
                          </div>

                          <input
                            value={link.url}
                            onChange={(e) =>
                              setLinks(
                                links.map((l, j) =>
                                  j === i
                                    ? { ...l, url: e.target.value }
                                    : l
                                )
                              )
                            }
                            placeholder="https://figma.com/file/..."
                            className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9ea89e]"
                          />

                          {link.url && (
                            <button
                              onClick={() =>
                                setLinks(links.filter((_, j) => j !== i))
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[#f7f8f7]"
                            >
                              <X size={14} className="text-[#9ea89e]" />
                            </button>
                          )}
                        </div>

                      </div>
                    ))}

                  </div>

                  <button
                    onClick={() =>
                      setLinks([...links, { url: '', label: '' }])
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#dbe7e1] bg-[#f7fbf9] px-4 py-2.5 text-[13px] font-medium text-[#0f6e56] hover:bg-[#eef7f3] transition-colors"
                  >
                    <Plus size={14} />
                    Add another link
                  </button>

                </div>
              )}

              {/* MESSAGE */}
              <div>

                <div className="mb-3">
                  <h3 className="text-[15px] font-semibold text-[#141a14]">
                    Message to {clientName}
                  </h3>

                  <p className="mt-1 text-[13px] text-[#9ea89e]">
                    Add context or explain what was delivered.
                  </p>
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Hey! I've attached the final delivery files and latest revisions..."
                  className="
                    w-full resize-none rounded-[24px]
                    border border-[#e8eae8]
                    bg-white
                    px-5 py-4
                    text-[14px]
                    outline-none
                    transition-all
                    placeholder:text-[#9ea89e]
                    focus:border-[#0f6e56]
                    focus:ring-4
                    focus:ring-[#0f6e56]/10
                  "
                />

              </div>

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-[#eef0ee] pt-6 sm:flex-row sm:items-center sm:justify-end">

                <button
                  onClick={onClose}
                  className="h-12 rounded-2xl px-5 text-[14px] font-medium text-[#6b756d] hover:bg-[#f7f8f7] transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="
                    flex h-12 items-center justify-center gap-2
                    rounded-2xl bg-[#0f6e56] px-6
                    text-[14px] font-medium text-white
                    transition-all hover:bg-[#085041]
                    disabled:cursor-not-allowed disabled:opacity-60
                  "
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Send delivery
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── CHAT PANEL ────────────────────────────────────────────────
function ChatPanel({ clientName, requestId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState([])
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  // Fetch messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await requestsApi.getMessages(requestId)
        setMessages(res.data.data || [])
      } catch {
        // silent — chat may not be implemented yet
      }
    }
    loadMessages()
  }, [requestId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [input])

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return
    const content = input.trim()
    setInput('')
    setAttachments([])
    setSending(true)

    // Optimistic update
    const optimistic = {
      id: `opt-${Date.now()}`,
      content,
      sender_type: 'provider',
      sender_name: 'You',
      created_at: new Date().toISOString(),
      optimistic: true,
    }
    setMessages(prev => [...prev, optimistic])

    try {
      await requestsApi.sendMessage(requestId, { content })
      const res = await requestsApi.getMessages(requestId)
      setMessages(res.data.data || [])
    } catch {
      // Remove optimistic on error
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.created_at).toDateString()
    if (!acc.length || acc[acc.length - 1].date !== date) {
      acc.push({ date, msgs: [msg] })
    } else {
      acc[acc.length - 1].msgs.push(msg)
    }
    return acc
  }, [])

  const formatMsgTime = (iso) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatGroupDate = (dateStr) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <>
      {/* Messages area — scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#fafafa] px-4 py-4 space-y-4 min-h-0 no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
            <div className="h-12 w-12 rounded-full bg-white border border-[#e8eae8] flex items-center justify-center shadow-xs">
              <Send size={18} className="text-[#9ea89e]" />
            </div>
            <div className="space-y-1">
              <p className="text-[14px] font-medium text-[#141a14]">No messages yet</p>
              <p className="text-[12px] text-[#9ea89e] leading-normal max-w-[200px]">
                Start a conversation with {clientName} about this request.
              </p>
            </div>
          </div>
        ) : (
          groupedMessages.map(group => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-[#e8eae8]" />
                <span className="text-[11px] text-[#9ea89e] font-medium px-1">{formatGroupDate(group.date)}</span>
                <div className="flex-1 h-px bg-[#e8eae8]" />
              </div>
              <div className="space-y-2">
                {group.msgs.map((msg, idx) => {
                  const isProvider = msg.sender_type === 'provider'
                  const prevMsg = group.msgs[idx - 1]
                  const showAvatar = !prevMsg || prevMsg.sender_type !== msg.sender_type
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isProvider ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar spacer — only show on first in group */}
                      <div className="w-6 shrink-0">
                        {showAvatar && !isProvider && (
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold ${getAvatarColor(clientName).bg} ${getAvatarColor(clientName).text}`}>
                            {getInitials(clientName)}
                          </div>
                        )}
                      </div>
                      <div className={`max-w-[80%] space-y-0.5 ${isProvider ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showAvatar && (
                          <span className={`text-[11px] text-[#9ea89e] font-medium ${isProvider ? 'text-right' : 'text-left'} px-1`}>
                            {isProvider ? 'You' : clientName}
                          </span>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words
                            ${isProvider
                              ? 'bg-[#0f6e56] text-white rounded-br-sm'
                              : 'bg-white text-[#141a14] border border-[#e8eae8] rounded-bl-sm shadow-xs'
                            }
                            ${msg.optimistic ? 'opacity-70' : ''}
                          `}
                        >
                          {msg.content}
                        </div>
                        <span className={`text-[10px] text-[#9ea89e] px-1 ${isProvider ? 'text-right' : 'text-left'}`}>
                          {formatMsgTime(msg.created_at)}
                          {msg.optimistic && ' · Sending...'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar — fixed at bottom of panel */}
      <div className="border-t border-[#e8eae8] p-3 bg-white shrink-0 sticky bottom-0">
        <div className="rounded-xl border border-[#e8eae8] bg-[#f7f8f7] focus-within:bg-white focus-within:border-[#0f6e56] focus-within:ring-4 focus-within:ring-[#0f6e56]/8 transition-all overflow-hidden">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${clientName}...`}
            rows={1}
            className="w-full bg-transparent px-3 pt-2.5 pb-1 text-[13px] text-[#141a14] outline-none placeholder:text-[#9ea89e] resize-none leading-relaxed"
            style={{ minHeight: '36px', maxHeight: '120px' }}
          />
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-[#9ea89e] hover:text-[#0f6e56] hover:bg-[#f0faf6] transition-all"
              title="Attach file"
            >
              <Paperclip size={14} />
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#9ea89e]">⏎ send</span>
              <button
                onClick={handleSend}
                disabled={sending || (!input.trim() && attachments.length === 0)}
                className={`h-7 w-7 flex items-center justify-center rounded-lg transition-all
                  ${(input.trim() || attachments.length > 0) && !sending
                    ? 'bg-[#0f6e56] text-white hover:bg-[#085041] shadow-xs'
                    : 'bg-[#e8eae8] text-[#9ea89e] cursor-not-allowed'
                  }
                `}
              >
                {sending
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Send size={13} />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── DRAG HANDLE ───────────────────────────────────────────────
function usePanelResize({ initialWidth = 360, minWidth = 240, maxWidth = 600 }) {
  const [chatWidth, setChatWidth] = useState(initialWidth)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(initialWidth)

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startWidth.current = chatWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [chatWidth])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return
      // Dragging left = growing chat panel (chat is on the right)
      const delta = startX.current - e.clientX
      const next = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta))
      setChatWidth(next)
    }
    const onMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [minWidth, maxWidth])

  return { chatWidth, onMouseDown }
}

// ── ACTIVITY LOG MODAL ────────────────────────────────────────
const EVENT_META = {
  status_change:       { icon: CheckCircle2, color: 'text-[#0f6e56]',  bg: 'bg-[#e6f5f0]',  label: 'Status changed'   },
  message_sent:        { icon: Send,         color: 'text-[#3730a3]',  bg: 'bg-[#eef2ff]',  label: 'Message sent'     },
  file_uploaded:       { icon: Upload,       color: 'text-[#92500a]',  bg: 'bg-[#fef3e2]',  label: 'File uploaded'    },
  note_added:          { icon: Lock,         color: 'text-[#4a544a]',  bg: 'bg-[#f3f4f3]',  label: 'Note added'       },
  request_created:     { icon: Plus,         color: 'text-[#0f6e56]',  bg: 'bg-[#e6f5f0]',  label: 'Request created'  },
  delivery_created:    { icon: Download,     color: 'text-[#0f6e56]',  bg: 'bg-[#e6f5f0]',  label: 'Delivery created' },
  ai_summary_generated:{ icon: FileText,     color: 'text-[#6366f1]',  bg: 'bg-[#eef2ff]',  label: 'AI summary'       },
}

function ActivityLogModal({ requestId, onClose }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    requestsApi.getActivity(requestId)
      .then(res => setActivities(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [requestId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8eae8] shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-[#141a14]">Activity log</h2>
            <p className="text-[12px] text-[#9ea89e] mt-0.5">{activities.length} entries · full history</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-[#9ea89e] hover:text-[#141a14] hover:bg-[#f7f8f7] transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-[#0f6e56]" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock size={28} className="text-[#9ea89e] mb-2" />
              <p className="text-[14px] font-medium text-[#141a14]">No activity yet</p>
              <p className="text-[12px] text-[#9ea89e] mt-1">Events will appear here as the request progresses.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[#e8eae8]" />
              <div className="space-y-1">
                {[...activities].reverse().map((act, i) => {
                  const meta = EVENT_META[act.event_type] || EVENT_META.note_added
                  const Icon = meta.icon
                  const isStatusChange = act.event_type === 'status_change'
                  return (
                    <div key={act.id} className="flex gap-4 relative group">
                      {/* Icon dot */}
                      <div className={`h-[30px] w-[30px] rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white ${meta.bg}`}>
                        <Icon size={13} className={meta.color} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 py-1 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#141a14] leading-snug">
                              {act.description || meta.label}
                            </p>
                            {isStatusChange && act.metadata && (
                              <div className="mt-1 space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <StatusPill status={act.metadata.from} />
                                  <ChevronRight size={11} className="text-[#9ea89e] shrink-0" />
                                  <StatusPill status={act.metadata.to} />
                                </div>
                                {act.metadata.action === 'rework' && act.metadata.rework_message && (
                                  <div className="flex items-start gap-2 rounded-lg bg-[#fff8e6] border border-[#f59e0b]/20 px-3 py-2">
                                    <RotateCcw size={11} className="text-[#92500a] shrink-0 mt-0.5" />
                                    <p className="text-[12px] text-[#92500a] leading-relaxed">
                                      {act.metadata.rework_message}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                            {act.actor_name && (
                              <p className="text-[11px] text-[#9ea89e] mt-1">
                                {act.actor_source === 'ai' ? '🤖 Grove AI' : `by ${act.actor_name}`}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] text-[#9ea89e] shrink-0 whitespace-nowrap pt-0.5">
                            {timeAgo(act.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// ── MAIN PAGE ─────────────────────────────────────────────────
export default function RequestDetailPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [req, setReq] = useState(null)
  const [activities, setActivities] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [noteContent, setNoteContent] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [showDeliver, setShowDeliver] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [urgentLoading, setUrgentLoading] = useState(false)
  const [showActivityLog, setShowActivityLog] = useState(false)

  const { chatWidth, onMouseDown } = usePanelResize({ initialWidth: 360, minWidth: 240, maxWidth: 600 })

  const fetchAll = useCallback(async () => {
    try {
      const [reqRes, actRes, noteRes] = await Promise.all([
        requestsApi.get(requestId),
        requestsApi.getActivity(requestId),
        requestsApi.getNotes(requestId),
      ])
      setReq(reqRes.data.data)
      setActivities(actRes.data.data || [])
      setNotes(noteRes.data.data || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [requestId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'delivered') { setShowDeliver(true); return }
    setStatusLoading(true)
    try {
      await requestsApi.updateStatus(requestId, newStatus)
      await fetchAll()
    } finally {
      setStatusLoading(false)
    }
  }

  const handleUrgentToggle = async () => {
    setUrgentLoading(true)
    try {
      await requestsApi.setUrgent(requestId, !req.is_urgent)
      await fetchAll()
    } finally {
      setUrgentLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) return
    setAddingNote(true)
    try {
      await requestsApi.addNote(requestId, noteContent)
      setNoteContent('')
      await fetchAll()
    } finally {
      setAddingNote(false)
    }
  }

  const handleDueDateUpdate = (newDate) => {
    setReq(prev => ({ ...prev, due_date: newDate }))
  }

  if (loading) return (
    <ProviderLayout badges={{}}>
      <div className="flex items-center justify-center h-full bg-[#fafafa]">
        <Loader2 size={24} className="animate-spin text-[#0f6e56]" />
      </div>
    </ProviderLayout>
  )

  if (!req) return (
    <ProviderLayout badges={{}}>
      <div className="flex flex-col items-center justify-center h-full text-center bg-[#fafafa]">
        <AlertCircle size={32} className="text-[#9ea89e] mb-3" />
        <p className="text-[15px] font-medium text-[#141a14]">Request not found</p>
        <button onClick={() => navigate('/requests')} className="mt-4 text-[13px] text-[#0f6e56] hover:underline">
          Back to requests
        </button>
      </div>
    </ProviderLayout>
  )

  const cfg = STATUS_CONFIG[req.status]
  const allowedNext = VALID_TRANSITIONS[req.status] || []
  const clientName = req.client_name || 'Client'

  return (
    <ProviderLayout badges={{ requests: 0 }}>
      {/* Scrollbar hiding styles injected into layout container via string literal */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/*
        Full-height flex column — NOTHING overflows the viewport.
        Three fixed-height rows:
          1. Top control bar (h-14, shrink-0)
          2. Optional urgent banner (shrink-0)
          3. Content split (flex-1, min-h-0)
      */}
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#fafafa]">

        {/* ── 1. FIXED TOP CONTROL BAR ── */}
        <div className="sticky top-0 border-b border-[#e8eae8] bg-white px-6 py-2.5 flex items-center justify-between shrink-0 h-14 z-30 shadow-[0_1px_0_0_#e8eae8]">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] text-[#9ea89e] min-w-0">
            <button onClick={() => navigate('/requests')} className="hover:text-[#141a14] transition-colors whitespace-nowrap">Requests</button>
            <ChevronRight size={13} className="text-[#d1d5d1] shrink-0" />
            <span className="text-[#9ea89e] truncate">{clientName}</span>
            <ChevronRight size={13} className="text-[#d1d5d1] shrink-0" />
            <span className="text-[#141a14] font-medium truncate">{req.title}</span>
            <span className="text-[#9ea89e] text-[11px] ml-1 bg-[#f3f4f3] px-1.5 py-0.5 rounded shrink-0 font-mono">
              #REQ-{req.id.slice(0, 4).toUpperCase()}
            </span>
          </div>

          {/* Inline status pipeline */}
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <div className="flex items-center bg-[#f7f8f7] p-0.5 rounded-lg border border-[#e8eae8]">
              {STATUS_ORDER.filter(s => s !== 'closed').map((s, i) => {
                const scfg = STATUS_CONFIG[s]
                const isCurrent = req.status === s
                const isDone = STATUS_ORDER.indexOf(req.status) > i
                const canClick = allowedNext.includes(s) || s === req.status
                return (
                  <button
                    key={s}
                    disabled={!canClick || statusLoading || s === req.status}
                    onClick={() => canClick && s !== req.status && handleStatusChange(s)}
                    className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all duration-150
                      ${isCurrent
                        ? 'bg-white text-[#141a14] shadow-xs font-semibold'
                        : isDone
                          ? 'text-[#9ea89e] line-through opacity-70'
                          : canClick
                            ? 'text-[#4a544a] hover:text-[#141a14]'
                            : 'text-[#d1d5d1] cursor-not-allowed'
                      }
                    `}
                  >
                    {scfg.label}
                  </button>
                )
              })}
            </div>

            <div className="w-px h-5 bg-[#e8eae8] mx-1" />

            {['in_progress', 'delivered'].includes(req.status) && (
              <button
                onClick={() => setShowDeliver(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f6e56] text-white text-[12px] font-semibold hover:bg-[#085041] transition-colors shadow-xs"
              >
                Deliver files
              </button>
            )}

            {req.status === 'delivered' && (
              <button
                onClick={() => handleStatusChange('closed')}
                disabled={statusLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e8eae8] text-[#4a544a] text-[12px] font-semibold hover:border-[#141a14] hover:text-[#141a14] transition-colors"
              >
                {statusLoading ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                Close request
              </button>
            )}
            <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e8eae8] text-[#9ea89e] hover:bg-[#f7f8f7] transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* ── 2. OPTIONAL URGENT BANNER ── */}
        {req.is_urgent && (
          <div className="bg-[#fff1f2] border-b border-[#fecdd3] px-6 py-2 flex items-center gap-2 shrink-0">
            <AlertCircle size={14} className="text-[#e11d48]" />
            <span className="text-[12px] font-medium text-[#9f1239]">
              High Priority Track Active: Ensure critical attention constraints are managed immediately.
            </span>
          </div>
        )}

        {/* ── 3. MAIN CONTENT SPLIT (fills remaining height) ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden h-full">

          {/* LEFT — scrollable detail panel */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 min-w-0 h-full no-scrollbar">

            {/* Header card */}
            <div className={`rounded-xl border bg-white p-4 transition-all duration-200
              ${req.is_urgent ? 'border-[#fecdd3] bg-gradient-to-r from-[#fff1f2]/30 to-white shadow-xs' : 'border-[#e8eae8]'}
            `}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill status={req.status} />
                    <span className="text-[12px] text-[#9ea89e]">Submitted {formatDate(req.created_at)}</span>
                  </div>
                  <h1 className="text-[20px] font-semibold text-[#141a14] leading-snug truncate">{req.title}</h1>
                </div>
                <button
                  onClick={handleUrgentToggle}
                  disabled={urgentLoading}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold border transition-all shrink-0
                    ${req.is_urgent
                      ? 'bg-[#e11d48] border-[#e11d48] text-white shadow-xs hover:bg-[#be123c]'
                      : 'bg-white border-[#e8eae8] text-[#9ea89e] hover:border-[#4a544a] hover:text-[#141a14]'
                    }
                  `}
                >
                  {urgentLoading ? <Loader2 size={12} className="animate-spin" /> : <Flag size={12} className={req.is_urgent ? 'fill-white' : ''} />}
                  <span>{req.is_urgent ? 'Urgent Priority' : 'Mark Urgent'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-[#e8eae8] mt-4 pt-3 text-[13px]">
                <div>
                  <span className="text-[#9ea89e] block text-[11px] font-medium uppercase tracking-wider mb-1">Requester</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${getAvatarColor(clientName).bg} ${getAvatarColor(clientName).text}`}>
                      {getInitials(clientName)}
                    </div>
                    <span className="font-medium text-[#4a544a] truncate">{clientName}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[#9ea89e] block text-[11px] font-medium uppercase tracking-wider mb-1">Due Date</span>
                  <DueDateEditor dueDate={req.due_date} requestId={requestId} onUpdate={handleDueDateUpdate} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[#9ea89e] block text-[11px] font-medium uppercase tracking-wider mb-1">Inclusions</span>
                  <span className="text-[#4a544a] font-medium">
                    {req.files?.length || 0} manifest attachment{req.files?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Details + history */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-xl border border-[#e8eae8] bg-white p-5 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ea89e] mb-2">Request Details</p>
                  <p className="text-[14px] text-[#4a544a] leading-relaxed whitespace-pre-wrap bg-[#f7f8f7]/40 p-4 rounded-xl border border-[#e8eae8]/50">
                    {req.description}
                  </p>
                </div>
                {req.files && req.files.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ea89e] mb-2">Attached by Client</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {req.files.map(f => (
                        <div key={f.id} className="flex items-center gap-3 rounded-xl border border-[#e8eae8] px-3 py-2 bg-white hover:border-[#0f6e56]/30 transition-colors group">
                          <FileIcon ext={f.file_extension} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[#141a14] truncate">{f.file_name}</p>
                            <p className="text-[11px] text-[#9ea89e]">{(f.file_size_bytes / 1024).toFixed(0)} KB</p>
                          </div>
                          <a href={f.download_url} target="_blank" rel="noreferrer" download className="text-[#9ea89e] hover:text-[#0f6e56] p-1 rounded-md hover:bg-[#f7f8f7] transition-all">
                            <Download size={15} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status history */}
              <div className="rounded-xl border border-[#e8eae8] bg-white p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[14px] font-semibold text-[#141a14]">Status history</p>
                    <span className="text-[11px] bg-[#f3f4f3] text-[#4a544a] px-2 py-0.5 rounded-full font-medium">{activities.length} entries</span>
                  </div>
                  <div className="space-y-0 relative before:absolute before:top-2 before:bottom-2 before:left-[9px] before:w-0.5 before:bg-[#e8eae8]">
                    {STATUS_ORDER.map((s, i) => {
                      const scfg = STATUS_CONFIG[s]
                      const currentIdx = STATUS_ORDER.indexOf(req.status)
                      const isDone = i < currentIdx
                      const isCurrent = i === currentIdx
                      const act = [...activities]
                        .reverse()
                        .find(
                          a =>
                            a.event_type === 'status_change' &&
                            a.metadata?.to === s
                        )
                      return (
                        <div key={s} className="flex gap-3 relative pb-4 last:pb-0">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 z-10 transition-all shrink-0
                            ${isCurrent ? 'border-[#0f6e56] bg-[#0f6e56]' : isDone ? 'border-[#0f6e56] bg-[#0f6e56]' : 'border-[#e8eae8] bg-white'}
                          `}>
                            {(isDone || isCurrent) && <CheckCircle2 size={10} className="text-white" />}
                          </div>
                          <div className="min-w-0 leading-tight pt-0.5">
                            <div className="flex items-center gap-2">
                              <p className={`text-[13px] font-medium ${i > currentIdx ? 'text-[#9ea89e]' : 'text-[#141a14]'}`}>
                                {scfg.label}
                              </p>
                              {isCurrent && (
                                <span className="rounded-full bg-[#e6f5f0] px-1.5 py-0.1 text-[10px] font-semibold text-[#085041]">Active</span>
                              )}
                            </div>
                            {act && (
                              <div className="mt-1 space-y-1">
                                <p className="text-[11px] text-[#9ea89e] truncate">
                                  by {act.actor_name} · {timeAgo(act.created_at)}
                                </p>
                                {act.metadata?.action === 'rework' && act.metadata?.rework_message && (
                                  <div className="flex items-start gap-1.5 rounded-md bg-[#fff8e6] border border-[#f59e0b]/20 px-2 py-1.5">
                                    <RotateCcw size={10} className="text-[#92500a] shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-[#92500a] leading-relaxed line-clamp-2">
                                      {act.metadata.rework_message}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                            {s === 'received' && !act && (
                              <p className="text-[11px] text-[#9ea89e] mt-1">Inception point</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <button
                  onClick={() => setShowActivityLog(true)}
                  className="mt-4 pt-3 border-t border-[#e8eae8]/60 text-[12px] text-[#0f6e56] font-medium hover:underline text-left block w-full"
                >
                  Expose detailed execution logs
                </button>
              </div>
            </div>

            {/* Internal notes */}
            <div className="rounded-xl border border-[#e8eae8] bg-white p-5">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#e8eae8]/60">
                <Lock size={14} className="text-[#9ea89e]" />
                <p className="text-[14px] font-semibold text-[#141a14]">Internal notes</p>
                <span className="ml-auto text-[11px] bg-[#fef3e2] text-[#92500a] px-2 py-0.5 rounded-md font-medium">Private Notes</span>
              </div>
              {notes.length > 0 && (
                <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto pr-1 no-scrollbar">
                  {notes.map(note => (
                    <div key={note.id} className={`rounded-xl p-3 border ${note.is_ai_generated ? 'border-[#d1fae5] bg-[#f0faf6]' : 'bg-[#f7f8f7] border-[#e8eae8]/40'}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        {note.is_ai_generated ? (
                          <span className="text-[11px] font-semibold text-[#0f6e56]">Grove AI</span>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#141a14]"> {note.author_name}</span>
                        )}
                        <span className="text-[11px] text-[#9ea89e]">{timeAgo(note.created_at)}</span>
                        {note.is_ai_generated && (
                          <span className="ml-auto text-[10px] text-[#9ea89e] bg-white px-1.5 py-0.5 rounded-md border border-[#d1fae5]">Synthetic telemetry</span>
                        )}
                      </div>
                      <p className="text-[13px] text-[#4a544a] leading-relaxed whitespace-pre-wrap font-sans">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-xl border border-[#e8eae8] bg-[#f7f8f7] p-1.5 focus-within:bg-white focus-within:border-[#0f6e56] focus-within:ring-4 focus-within:ring-[#0f6e56]/5 transition-all">
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value.slice(0, 500))}
                  placeholder="Record task context details..."
                  rows={2}
                  className="w-full bg-transparent px-2 py-1.5 text-[13px] text-[#141a14] outline-none placeholder:text-[#9ea89e] resize-none"
                />
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-[#e8eae8]/40 px-2">
                  <span className="text-[11px] text-[#9ea89e] font-mono">{noteContent.length} / 500</span>
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !noteContent.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-[#0f6e56] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#085041] transition-colors disabled:opacity-50"
                  >
                    {addingNote && <Loader2 size={12} className="animate-spin" />}
                    Save note
                  </button>
                </div>
              </div>
            </div>

            <div className="h-4 shrink-0" />
          </div>

          {/* ── DRAG HANDLE ── */}
          <div
            onMouseDown={onMouseDown}
            className="w-[5px] shrink-0 relative cursor-col-resize group flex items-center justify-center bg-transparent hover:bg-[#0f6e56]/10 transition-colors z-10"
            title="Drag to resize"
          >
            {/* Visible divider line */}
            <div className="absolute inset-y-0 left-[2px] w-px bg-[#e8eae8] group-hover:bg-[#0f6e56]/30 transition-colors" />
            {/* Grip dots */}
            <div className="relative z-10 flex flex-col gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#0f6e56]/50" />
              ))}
            </div>
          </div>

          {/* ── RIGHT CHAT PANEL — fixed width, flex column ── */}
          <div
            className="shrink-0 bg-white flex flex-col overflow-hidden h-full border-l border-[#e8eae8]"
            style={{ width: chatWidth }}
          >
            {/* Chat header — fixed */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 border-b border-[#e8eae8] shrink-0 bg-white">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#141a14] truncate">
                  Conversation with {clientName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#1d9e75]" />
                  <p className="text-[12px] text-[#9ea89e]">Active</p>
                </div>
              </div>
            </div>

            {/* Chat messages + input — ChatPanel handles its own scroll */}
            <ChatPanel clientName={clientName} requestId={requestId} />
          </div>

        </div>
      </div>

      {showActivityLog && (
        <ActivityLogModal
          requestId={requestId}
          onClose={() => setShowActivityLog(false)}
        />
      )}

      {showDeliver && (
        <DeliverModal
          request={req}
          onClose={() => setShowDeliver(false)}
          onSuccess={() => { setShowDeliver(false); fetchAll() }}
        />
      )}
    </ProviderLayout>
  )
}