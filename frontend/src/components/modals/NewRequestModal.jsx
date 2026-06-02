import { useState, useRef } from 'react'
import { Plus, Upload, X, Loader2, CheckCircle2, FileText } from 'lucide-react'
import requestsApi from '../../api/requests.api'

export default function NewRequestModal({ providerName, onClose, onSuccess }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [created, setCreated] = useState(null)
  const fileInput = useRef(null)

  const handleFiles = (newFiles) => {
    setFiles(prev => [...prev, ...Array.from(newFiles)])
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return
    setSubmitting(true)
    try {
      const res = await requestsApi.create({ title: title.trim(), description: description.trim() })
      const newReq = res.data.data
      for (const file of files) {
        try {
          await requestsApi.uploadFile(newReq.id, file)
        } catch {
          // fall siliently
        }
      }
      setCreated(newReq)
    } catch {
      setSubmitting(false)
    }
  }

  // ── Success screen ─────────────────────────────────────────
  if (created) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl text-center">
          <div className="h-16 w-16 rounded-full bg-[#e6f5f0] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-[#0f6e56]" />
          </div>
          <h2 className="text-[18px] font-semibold text-[#141a14] mb-1">Request sent!</h2>
          <p className="text-[13px] text-[#9ea89e] mb-6">
            We got it. {providerName} will review shortly.
          </p>
          <button
            onClick={() => { onSuccess(created); onClose() }}
            className="w-full rounded-xl bg-[#0f6e56] py-3 text-[14px] font-semibold text-white hover:bg-[#085041] transition-colors"
          >
            View my request
          </button>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="p-6">

          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-[20px] font-semibold text-[#141a14]">New request</h2>
            <button onClick={onClose} className="text-[#9ea89e] hover:text-[#141a14] transition-colors">
              <X size={18} />
            </button>
          </div>
          <p className="text-[13px] text-[#9ea89e] mb-5">
            Tell us what you need — we'll take care of the rest.
          </p>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#141a14] mb-2">
              What do you need help with?
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. I need a new banner for my homepage"
              className="w-full rounded-xl border border-[#e8eae8] px-3 py-2.5 text-[13px] outline-none placeholder:text-[#9ea89e] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10 transition-all"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-[#141a14]">Tell us more</label>
              <span className="text-[12px] text-[#9ea89e]">The more detail you share, the faster we can help.</span>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add any details, links, or reference images..."
              rows={4}
              className="w-full rounded-xl border border-[#e8eae8] px-3 py-2.5 text-[13px] outline-none placeholder:text-[#9ea89e] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10 resize-none transition-all"
            />
          </div>

          {/* File upload */}
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-[#141a14] mb-2">
              Attach files (optional)
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
              onClick={() => fileInput.current?.click()}
              className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors
                ${dragOver ? 'border-[#0f6e56] bg-[#f0faf6]' : 'border-[#d1e8df] bg-[#f7fbf9] hover:border-[#0f6e56]/50'}
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-[#e6f5f0] flex items-center justify-center">
                  <Upload size={18} className="text-[#0f6e56]" />
                </div>
                <p className="text-[13px] font-medium text-[#141a14]">
                  Drag files here <span className="text-[#0f6e56] underline">or browse to upload</span>
                </p>
                <p className="text-[12px] text-[#9ea89e]">Images and PDFs · Max 10MB per file</p>
              </div>
              <input
                ref={fileInput}
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-[#f7f8f7] px-3 py-2">
                    <FileText size={13} className="text-[#9ea89e]" />
                    <span className="text-[12px] text-[#141a14] flex-1 truncate">{f.name}</span>
                    <button onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                      <X size={13} className="text-[#9ea89e] hover:text-[#141a14]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !description.trim()}
            className="w-full rounded-xl bg-[#0f6e56] py-3.5 text-[14px] font-semibold text-white hover:bg-[#085041] transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Send request'}
          </button>

          <p className="mt-3 text-center text-[12px] text-[#9ea89e]">
            🔒 Only {providerName} can see your request
          </p>

        </div>
      </div>
    </div>
  )
}