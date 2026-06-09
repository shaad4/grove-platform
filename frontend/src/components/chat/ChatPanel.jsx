import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send, Paperclip, Loader2, CheckCircle2,
  AlertCircle, X, Lock,
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { selectAccessToken } from '../../features/auth/authSlice'
import { useWebSocket } from '../../hooks/useWebSocket'
import requestsApi from '../../api/requests.api'
import { getAvatarColor, getInitials } from '../../utils/clientHelpers'

export default function ChatPanel({
  clientName,
  requestId,
  requestStatus,
  activities = [],
}) {
  const [messages,    setMessages]    = useState([])
  const [input,       setInput]       = useState('')
  const [sending,     setSending]     = useState(false)
  const [attachments, setAttachments] = useState([])
  const messagesEndRef = useRef(null)
  const fileInputRef   = useRef(null)
  const textareaRef    = useRef(null)
  const accessToken    = useSelector(selectAccessToken)
  const currentUser    = useSelector(s => s.auth.user)
  const isClosed       = requestStatus === 'closed'

  // ── Initial load ────────────────────────────────────────────
  useEffect(() => {
    requestsApi.getMessages(requestId)
      .then(res => setMessages(res.data.results || []))
      .catch(() => {})
    requestsApi.markRead(requestId).catch(() => {})
  }, [requestId])

  // ── Auto scroll ─────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Auto resize textarea ────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [input])

  // ── WebSocket ───────────────────────────────────────────────
  const wsHost = window.location.hostname
  const tenant = wsHost.split('.')[0]
  const wsUrl  = accessToken
    ? `ws://${wsHost}:8000/ws/chat/${requestId}/?token=${accessToken}&tenant=${tenant}`
    : null

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'message') {
      setMessages(prev => {
        const optIdx = prev.findIndex(
          m => m.optimistic && m.content === msg.content && m.sender === msg.sender_id
        )
        if (optIdx !== -1) {
          const next = [...prev]
          next[optIdx] = { ...msg, sender: msg.sender_id }
          return next
        }
        if (prev.some(m => m.id === msg.id)) return prev
        if (msg.sender_id !== currentUser?.id) {
          requestsApi.markRead(requestId).catch(() => {})
        }
        return [...prev, { ...msg, sender: msg.sender_id }]
      })
    }
    if (msg.type === 'read_receipt') {
      setMessages(prev =>
        prev.map(m => m.sender !== currentUser?.id ? { ...m, is_read: true } : m)
      )
    }
  }, [currentUser?.id, requestId])

  useWebSocket(wsUrl, handleWsMessage, `chat-${requestId}`)

  // ── File attachments ────────────────────────────────────────
  const handleAttachFiles = useCallback(async (fileList) => {
    const incoming = Array.from(fileList).map(f => ({
      file: f, status: 'pending', fileId: null,
    }))
    setAttachments(prev => [...prev, ...incoming])

    for (const entry of incoming) {
      setAttachments(prev =>
        prev.map(a => a.file === entry.file ? { ...a, status: 'uploading' } : a)
      )
      try {
        const result = await requestsApi.uploadFile(requestId, entry.file)
        setAttachments(prev =>
          prev.map(a => a.file === entry.file
            ? { ...a, status: 'done', fileId: result.id }
            : a
          )
        )
      } catch {
        setAttachments(prev =>
          prev.map(a => a.file === entry.file ? { ...a, status: 'error' } : a)
        )
      }
    }
  }, [requestId])

  // ── Send ────────────────────────────────────────────────────
  const handleSend = async () => {
    const content       = input.trim()
    const doneAttachments = attachments.filter(a => a.status === 'done')
    if (!content && doneAttachments.length === 0) return
    if (attachments.some(a => a.status === 'uploading')) return

    setInput('')
    setAttachments([])
    setSending(true)

    const optimistic = {
      id:          `opt-${Date.now()}`,
      content,
      sender:      currentUser?.id,
      sender_name: currentUser?.display_name || 'You',
      created_at:  new Date().toISOString(),
      is_read:     false,
      optimistic:  true,
    }
    setMessages(prev => [...prev, optimistic])

    try {
      await requestsApi.sendMessage(requestId, {
        content,
        attachment_ids: doneAttachments.map(a => a.fileId),
      })
    } catch {
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

  // ── Merge messages + activities ─────────────────────────────
  const timeline = useMemo(() => {
    const msgs = messages.map(m => ({ ...m, _type: 'message' }))
    const acts = activities.map(a => ({ ...a, _type: 'activity' }))
    return [...msgs, ...acts].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    )
  }, [messages, activities])

  const groupedTimeline = useMemo(() => {
    return timeline.reduce((acc, item) => {
      const date = new Date(item.created_at).toDateString()
      if (!acc.length || acc[acc.length - 1].date !== date) {
        acc.push({ date, items: [item] })
      } else {
        acc[acc.length - 1].items.push(item)
      }
      return acc
    }, [])
  }, [timeline])

  const formatMsgTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const formatGroupDate = (dateStr) => {
    const d         = new Date(dateStr)
    const today     = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString())     return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const hasUploading = attachments.some(a => a.status === 'uploading')
  const canSend      = (input.trim() || attachments.some(a => a.status === 'done')) && !hasUploading

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#fafafa] px-4 py-4 space-y-4 min-h-0 no-scrollbar">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
            <div className="h-12 w-12 rounded-full bg-white border border-[#e8eae8] flex items-center justify-center">
              <Send size={18} className="text-[#9ea89e]" />
            </div>
            <div className="space-y-1">
              <p className="text-[14px] font-medium text-[#141a14]">No messages yet</p>
              <p className="text-[12px] text-[#9ea89e] leading-normal max-w-[200px]">
                Start a conversation about this request.
              </p>
            </div>
          </div>
        ) : (
          groupedTimeline.map(group => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-[#e8eae8]" />
                <span className="text-[11px] text-[#9ea89e] font-medium px-1">
                  {formatGroupDate(group.date)}
                </span>
                <div className="flex-1 h-px bg-[#e8eae8]" />
              </div>

              <div className="space-y-2">
                {group.items.map((item, idx) => {

                  // Activity pill
                  if (item._type === 'activity') {
                    return (
                      <div key={item.id} className="flex items-center gap-2 py-1">
                        <div className="flex-1 h-px bg-[#f1f3f1]" />
                        <span className="text-[10px] text-[#9ea89e] bg-[#f7f8f7] border border-[#e8eae8] rounded-full px-2.5 py-0.5 shrink-0">
                          {item.description}
                        </span>
                        <div className="flex-1 h-px bg-[#f1f3f1]" />
                      </div>
                    )
                  }

                  // Message bubble
                  const isMe       = item.sender === currentUser?.id
                  const prevItem   = group.items[idx - 1]
                  const showAvatar = !prevItem
                    || prevItem._type === 'activity'
                    || prevItem.sender !== item.sender

                  return (
                    <div
                      key={item.id}
                      className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className="w-6 shrink-0">
                        {showAvatar && !isMe && (
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold ${getAvatarColor(clientName).bg} ${getAvatarColor(clientName).text}`}>
                            {getInitials(clientName)}
                          </div>
                        )}
                      </div>
                      <div className={`max-w-[80%] space-y-0.5 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {showAvatar && (
                          <span className={`text-[11px] text-[#9ea89e] font-medium px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                            {isMe ? 'You' : clientName}
                          </span>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words
                          ${isMe
                            ? 'bg-[#0f6e56] text-white rounded-br-sm'
                            : 'bg-white text-[#141a14] border border-[#e8eae8] rounded-bl-sm'
                          }
                          ${item.optimistic ? 'opacity-70' : ''}
                        `}>
                          {item.content}
                        </div>
                        <div className={`flex items-center gap-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-[10px] text-[#9ea89e]">
                            {formatMsgTime(item.created_at)}
                            {item.optimistic && ' · Sending...'}
                          </span>
                          {isMe && !item.optimistic && (
                            <span className={`text-[10px] ${item.is_read ? 'text-[#0f6e56]' : 'text-[#9ea89e]'}`}>
                              {item.is_read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
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

      {/* Locked state */}
      {isClosed ? (
        <div className="border-t border-[#e8eae8] px-4 py-3 bg-[#f7f8f7] shrink-0">
          <div className="flex items-center gap-2 justify-center">
            <Lock size={13} className="text-[#9ea89e]" />
            <p className="text-[12px] text-[#9ea89e]">
              This request is closed. Conversation is read-only.
            </p>
          </div>
        </div>
      ) : (
        /* Input bar */
        <div className="border-t border-[#e8eae8] p-3 bg-white shrink-0">

          {/* Attachment chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium
                    ${a.status === 'error'
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : a.status === 'done'
                        ? 'border-[#b3e0d1] bg-[#e6f5f0] text-[#085041]'
                        : 'border-[#e8eae8] bg-[#f7f8f7] text-[#4a544a]'
                    }
                  `}
                >
                  {a.status === 'uploading' && <Loader2 size={10} className="animate-spin" />}
                  {a.status === 'done'      && <CheckCircle2 size={10} />}
                  {a.status === 'error'     && <AlertCircle size={10} />}
                  <span className="max-w-[100px] truncate">{a.file.name}</span>
                  {a.status !== 'uploading' && (
                    <button
                      onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                      className="ml-0.5 hover:opacity-70"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

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
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => handleAttachFiles(e.target.files)}
              />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#9ea89e]">⏎ send · ⇧⏎ newline</span>
                <button
                  onClick={handleSend}
                  disabled={!canSend || sending}
                  className={`h-7 w-7 flex items-center justify-center rounded-lg transition-all
                    ${canSend && !sending
                      ? 'bg-[#0f6e56] text-white hover:bg-[#085041]'
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
      )}
    </>
  )
}