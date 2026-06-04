import { useState, useRef, useMemo } from 'react'
import {
  X,
  Upload,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import requestsApi from '../../api/requests.api'

// ─── CONFIGURATION CONSTANTS ──────────────────────────────────
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_TOTAL_SIZE = 200 * 1024 * 1024 // 200MB
const MAX_FILES = 10

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]

// ─── BACKDROP ─────────────────────────────────────────────────
function Backdrop({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  )
}

// ─── FIELD WRAPPER ────────────────────────────────────────────
function Field({ label, optional, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label className="text-[13px] font-medium text-[#141a14]">{label}</label>
        {optional && <span className="text-[12px] text-[#9ea89e]">(optional)</span>}
      </div>
      {hint && <p className="mb-2 text-[12px] text-[#9ea89e]">{hint}</p>}
      {children}
    </div>
  )
}

// ─── MAIN MODAL ───────────────────────────────────────────────
export default function NewRequestModal({ providerName, onClose, onSuccess }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [created, setCreated] = useState(null)
  const [errors, setErrors] = useState({})
  const [uploadError, setUploadError] = useState('')

  const fileInput = useRef(null)

  // ───────────────── Computations ─────────────────
  const totalFileSize = useMemo(() => {
    return files.reduce((sum, file) => sum + file.size, 0)
  }, [files])

  // ───────────────── Validation ─────────────────
  const validateTitle = (value) => {
    if (!value.trim()) return 'Title is required.'
    if (value.trim().length < 3) return 'Title must be at least 3 characters.'
    if (value.trim().length > 500) return 'Title cannot exceed 500 characters.'
    return ''
  }

  const validateDescription = (value) => {
    if (!value.trim()) return 'Description is required.'
    if (value.trim().length < 10) return 'Description must be at least 10 characters.'
    return ''
  }

  const validateForm = () => {
    const nextErrors = {}
    const titleError = validateTitle(title)
    const descriptionError = validateDescription(description)

    if (titleError) nextErrors.title = titleError
    if (descriptionError) nextErrors.description = descriptionError

    if (files.length > MAX_FILES) {
      nextErrors.files = `Maximum ${MAX_FILES} files allowed.`
    }
    if (totalFileSize > MAX_TOTAL_SIZE) {
      nextErrors.files = 'Total upload size exceeds 200MB.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  // ───────────────── File Logic ─────────────────
  const handleFiles = (newFiles) => {
    const incoming = Array.from(newFiles)
    const validFiles = []
    let fileError = ''

    for (const file of incoming) {
      const duplicate = files.some(
        (f) => f.name === file.name && f.size === file.size
      )
      if (duplicate) continue

      if (!ALLOWED_TYPES.includes(file.type)) {
        fileError = `${file.name} has an unsupported file type.`
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        fileError = `${file.name} exceeds the 50MB limit.`
        continue
      }

      validFiles.push(file)
    }

    const updated = [...files, ...validFiles]

    if (updated.length > MAX_FILES) {
      fileError = `Maximum ${MAX_FILES} files allowed.`
    }

    const totalSize = updated.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > MAX_TOTAL_SIZE) {
      fileError = 'Total upload size exceeds 200MB.'
    }

    setErrors((prev) => ({
      ...prev,
      files: fileError,
    }))

    setFiles(updated.slice(0, MAX_FILES))
  }

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
    setErrors((prev) => ({ ...prev, files: '' }))
  }

  // ───────────────── Submit Pipeline ─────────────────
  const handleSubmit = async () => {
    setUploadError('')
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const res = await requestsApi.create({
        title: title.trim(),
        description: description.trim(),
      })

      const newReq = res.data.data

      for (const file of files) {
        try {
          await requestsApi.uploadFile(newReq.id, file)
        } catch (err) {
          console.error(err)
          setUploadError(`Failed to upload ${file.name}`)
        }
      }

      setCreated(newReq)
    } catch (err) {
      console.error(err)
      setUploadError('Failed to create request.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── SUCCESS SCREEN ─────────────────────────────────────────
  if (created) {
    return (
      <Backdrop onClose={onClose}>
        <div className="relative w-full max-w-[460px] rounded-[24px] bg-white p-8 shadow-[0px_24px_32px_rgba(10,46,36,0.18)]">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f8f7]"
          >
            <X size={16} className="text-[#9ea89e]" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#b3e0d1] bg-[#e6f5f0]">
              <CheckCircle2 size={28} className="text-[#0f6e56]" />
            </div>
            <h2 className="mt-5 text-[22px] font-semibold text-[#0a2e24]">
              Request sent!
            </h2>
            <p className="mt-3 max-w-[300px] text-[13px] leading-6 text-[#9ea89e]">
              We have received your project details.{' '}
              <span className="font-medium text-[#4a544a]">{providerName}</span> will
              review it shortly.
            </p>

            <div className="my-6 h-px w-full bg-[#e8eae8]" />

            <button
              onClick={() => {
                onSuccess?.(created)
                onClose()
              }}
              className="w-full rounded-xl bg-[#0f6e56] py-3.5 text-[14px] font-semibold text-white hover:bg-[#085041] transition-colors shadow-sm"
            >
              View my request
            </button>
          </div>
        </div>
      </Backdrop>
    )
  }

  // ── FORM SCREEN ───────────────────────────────────────────
  return (
    <Backdrop onClose={onClose}>
      <div className="w-full max-w-[980px] overflow-hidden border border-[#e8eae8] bg-white shadow-[0px_24px_60px_rgba(10,46,36,0.16)] max-h-[95vh] rounded-none sm:rounded-[24px] lg:rounded-[28px]">
        <div className="flex flex-col lg:grid lg:grid-cols-[360px_1fr]">
          
          {/* LEFT PANEL */}
          <div className="relative overflow-hidden border-b border-[#eef0ee] bg-[#f7f8f7] p-6 lg:border-b-0 lg:border-r lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,110,86,0.08),transparent_45%)]" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dbe7e1] bg-white px-3 py-1 text-[11px] font-medium text-[#0f6e56]">
                    <div className="h-2 w-2 rounded-full bg-[#0f6e56]" />
                    NEW SUBMISSION
                  </div>

                  <h2 className="text-[28px] font-semibold leading-tight text-[#0a2e24]">
                    New request
                  </h2>

                  <p className="mt-3 max-w-[260px] text-[14px] leading-6 text-[#6b756d]">
                    Tell us what you need — we'll take care of the rest.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 backdrop-blur hover:bg-white transition-colors"
                >
                  <X size={16} className="text-[#7c867d]" />
                </button>
              </div>

              {/* Counter/Preview Card */}
              <div className="mt-10 rounded-2xl border border-[#e3e7e3] bg-white p-5 shadow-sm">
                <div className="rounded-xl bg-[#f7f8f7] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-[#9ea89e]">
                    Queue Target
                  </p>
                  <p className="mt-1 break-all text-[13px] font-medium text-[#0f6e56]">
                    {providerName} Workspace
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[12px] text-[#6b756d]">
                    <span>Attached files:</span>
                    <span className="font-medium text-[#141a14]">
                      {files.length} / {MAX_FILES}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px] text-[#6b756d]">
                    <span>Total size:</span>
                    <span className="font-medium text-[#141a14]">
                      {(totalFileSize / 1024 / 1024).toFixed(2)} MB / 200 MB
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8">
                <p className="text-[12px] leading-5 text-[#9ea89e]">
                  🔒 Only {providerName} and your linked account managers can view these files and data.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="overflow-y-auto p-6 lg:max-h-[85vh] lg:p-10 max-h-[calc(95vh-260px)]">
            <div className="grid gap-6">
              
              {/* Request Title Input */}
              <Field label="What do you need help with?">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setErrors((prev) => ({
                      ...prev,
                      title: validateTitle(e.target.value),
                    }))
                  }}
                  placeholder="e.g. I need a new homepage banner"
                  className={`h-12 w-full rounded-2xl border bg-white px-4 text-[14px] outline-none transition-all ${
                    errors.title
                      ? 'border-red-400 ring-4 ring-red-100'
                      : 'border-[#e8eae8] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10'
                  }`}
                />
                {errors.title && (
                  <div className="flex items-center gap-1 mt-1.5 text-[12px] text-red-500">
                    <AlertCircle size={12} />
                    {errors.title}
                  </div>
                )}
              </Field>

              {/* Request Description Input */}
              <Field label="Tell us more">
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setErrors((prev) => ({
                      ...prev,
                      description: validateDescription(e.target.value),
                    }))
                  }}
                  rows={5}
                  placeholder="Add detailed parameters, criteria, references, links, or goals..."
                  className={`w-full resize-none rounded-2xl border bg-white px-4 py-3 text-[14px] outline-none transition-all placeholder:text-[#9ea89e] ${
                    errors.description
                      ? 'border-red-400 ring-4 ring-red-100'
                      : 'border-[#e8eae8] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10'
                  }`}
                />
                {errors.description && (
                  <div className="flex items-center gap-1 mt-1.5 text-[12px] text-red-500">
                    <AlertCircle size={12} />
                    {errors.description}
                  </div>
                )}
              </Field>

              {/* Drag and Drop File Attachments Container */}
              <Field label="Attach assets" optional hint="Images, videos and PDFs up to 50MB per file">
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
                  className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-[#0f6e56] bg-[#f0faf6]'
                      : 'border-[#d1e8df] bg-[#f7fbf9]'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-[#e6f5f0] flex items-center justify-center">
                      <Upload size={18} className="text-[#0f6e56]" />
                    </div>
                    <p className="text-[13px] font-medium text-[#141a14]">
                      Drag files here or <span className="text-[#0f6e56] underline">browse</span> to upload
                    </p>
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    accept="image/*,video/mp4,video/webm,video/quicktime,.pdf"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>

                {errors.files && (
                  <div className="flex items-center gap-1 mt-2 text-[12px] text-red-500">
                    <AlertCircle size={12} />
                    {errors.files}
                  </div>
                )}

                {/* File List Grid Layout */}
                {files.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2.5 rounded-xl border border-[#e8eae8] bg-[#f7f8f7] px-3.5 py-2.5"
                      >
                        <FileText size={14} className="text-[#9ea89e] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[13px] font-medium text-[#141a14]">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-[#9ea89e]">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile(index)
                          }}
                          className="p-1 rounded-md hover:bg-[#eef0ee] transition-colors"
                        >
                          <X size={14} className="text-[#9ea89e] hover:text-[#141a14]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>

              {/* Upload Contextual Alert Notice */}
              {uploadError && (
                <div className="rounded-2xl border border-red-200 bg-red-50/50 px-4 py-3 text-[13px] text-red-600 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* FOOTER ACTIONS ROW */}
              <div className="flex flex-col-reverse gap-3 border-t border-[#eef0ee] pt-6 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-12 rounded-2xl px-5 text-[14px] font-medium text-[#6b756d] hover:bg-[#f7f8f7] transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || Object.keys(errors).some((x) => errors[x])}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0f6e56] px-6 text-[14px] font-medium text-white transition-all hover:bg-[#085041] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Send request
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </Backdrop>
  )
}