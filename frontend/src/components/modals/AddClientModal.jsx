import { useState, useRef, useEffect } from 'react'
import {
  X, Mail, ArrowRight, CheckCircle2,
  AlertTriangle, Copy, Plus, ChevronDown,
} from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

// ─── TAG COLORS ───────────────────────────────────────────────
const TAG_COLORS = [
  { bg: '#FEF3E2', dot: '#F59E0B', text: '#92500A' }, // amber
  { bg: '#EEF2FF', dot: '#6366F1', text: '#3730A3' }, // indigo
  { bg: '#E6F5F0', dot: '#0F6E56', text: '#085041' }, // green
  { bg: '#FFE4E6', dot: '#F43F5E', text: '#9F1239' }, // rose
  { bg: '#F0F9FF', dot: '#0EA5E9', text: '#0C4A6E' }, // sky
]

function getTagColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

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

// ─── TAG INPUT ────────────────────────────────────────────────
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const addTag = (val) => {
    const name = val.trim()
    if (!name) {
      setInput('')
      return
    }

    const exists = tags.some(
      (t) =>
        t.toLowerCase() ===
        name.toLowerCase()
    )

    if (exists) {
      setInput('')
      return
    }

    if (tags.length >= 10) {
      return
    }

    if (name.length > 30) {
      return
    }
    onChange([...tags, name])
    setInput('')
  }

  const removeTag = (name) => onChange(tags.filter(t => t !== name))

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input) }
    if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1])
  }

  return (
    <div
      className="flex min-h-[48px] flex-wrap items-center gap-2 rounded-xl border border-[#e8eae8] px-3 py-2 cursor-text focus-within:border-[#0f6e56] focus-within:ring-4 focus-within:ring-[#0f6e56]/10 transition-all"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(name => {
        const c = getTagColor(name)
        return (
          <span
            key={name}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
            style={{ background: c.bg, color: c.text }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.dot }} />
            {name}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(name) }}
              className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </span>
        )
      })}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => addTag(input)}
        placeholder={tags.length === 0 ? 'Type a tag and press Enter' : ''}
        className="min-w-[120px] flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#9ea89e]"
      />
    </div>
  )
}

// ─── BUSINESS TYPE DROPDOWN ───────────────────────────────────
const BUSINESS_TYPES = [
  'Agency',
  'Freelancer',
  'Startup',
  'E-commerce',
  'Personal Brand',
  'Design Studio',
  'Development Studio',
  'Marketing Agency',
  'Consultancy',
  'Content Creation',
  'Video Production',
  'Creative Studio',
  'SaaS Company',
  'Web Design',
  'UI/UX Design',
  'Software Development',
  'Digital Marketing',
  'Branding',
  'Photography',
  'Social Media Management',
  'Architecture Studio',
  'Interior Design',
  'Legal Services',
  'Accounting Firm',
  'Coaching',
  'Education',
  'Other',
]

function BusinessTypeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-[#e8eae8] px-4 text-[14px] text-[#141a14] hover:border-[#0f6e56] transition-colors focus:outline-none focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10"
      >
        <span className={value ? 'text-[#141a14]' : 'text-[#9ea89e]'}>
          {value || 'Select type'}
        </span>
        <ChevronDown size={16} className={`text-[#9ea89e] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-[#e8eae8] bg-white shadow-lg">
          {/* Clear option */}
          <button
            onClick={() => { onChange(''); setOpen(false) }}
            className="w-full px-4 py-2.5 text-left text-[13px] text-[#9ea89e] hover:bg-[#f7f8f7] transition-colors"
          >
            None
          </button>
          {BUSINESS_TYPES.map(type => (
            <button
              key={type}
              onClick={() => { onChange(type); setOpen(false) }}
              className={`w-full px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-[#f7f8f7] ${
                value === type ? 'text-[#0f6e56] font-medium bg-[#e6f5f0]' : 'text-[#141a14]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MAIN MODAL ───────────────────────────────────────────────
export default function AddClientModal({ onClose, onSuccess }) {
  const { tenant } = useAuth()

  const [step, setStep]       = useState('form')
  const [loading, setLoading] = useState(false)
  const [errorState, setError] = useState({ type: '', message: '' })
  const [successData, setSuccess] = useState(null)

  const [form, setForm] = useState({
    client_name:   '',
    client_email:  '',
    business_type: '',
    private_note:  '',
    tags:          [],
  })
  const [fieldErrors, setFieldErrors] = useState({})


// ─── VALIDATION ─────────────────────────────────────────────

const set = (k) => (e) => {
  const value = e.target.value

  setForm((f) => ({
    ...f,
    [k]: value,
  }))

  setFieldErrors((prev) => {
    const next = { ...prev }

    // ─── Name validation ─────────────────────
    if (k === 'client_name') {
      const trimmed = value.trim()

      if (!trimmed) {
        next.client_name =
          'Client name is required.'
      } else if (trimmed.length < 2) {
        next.client_name =
          'Name must be at least 2 characters.'
      } else if (trimmed.length > 120) {
        next.client_name =
          'Name cannot exceed 120 characters.'
      } else {
        delete next.client_name
      }
    }

    // ─── Email validation ────────────────────
    if (k === 'client_email') {
      const trimmed = value
        .trim()
        .toLowerCase()

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!trimmed) {
        next.client_email =
          'Email address is required.'
      } else if (
        !emailRegex.test(trimmed)
      ) {
        next.client_email =
          'Enter a valid email address.'
      } else if (
        trimmed.length > 255
      ) {
        next.client_email =
          'Email address is too long.'
      } else {
        delete next.client_email
      }
    }

    // ─── Note validation ─────────────────────
    if (k === 'private_note') {
      if (value.length > 2000) {
        next.private_note =
          'Internal note cannot exceed 2000 characters.'
      } else {
        delete next.private_note
      }
    }

    return next
  })
}

const validate = () => {
  const errs = {}

  const name =
    form.client_name.trim()

  const email = form.client_email
    .trim()
    .toLowerCase()

  const note =
    form.private_note.trim()

  // ─── Name ─────────────────────────────────

  if (!name) {
    errs.client_name =
      'Client name is required.'
  } else if (name.length < 2) {
    errs.client_name =
      'Name must be at least 2 characters.'
  } else if (name.length > 120) {
    errs.client_name =
      'Name cannot exceed 120 characters.'
  }

  // ─── Email ────────────────────────────────

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email) {
    errs.client_email =
      'Email address is required.'
  } else if (
    !emailRegex.test(email)
  ) {
    errs.client_email =
      'Enter a valid email address.'
  } else if (
    email.length > 255
  ) {
    errs.client_email =
      'Email address is too long.'
  }

  // ─── Tags ─────────────────────────────────

  if (form.tags.length > 10) {
    errs.tags =
      'Maximum 10 tags allowed.'
  }

  const duplicateTags =
    new Set(
      form.tags.map((t) =>
        t.toLowerCase()
      )
    )

  if (
    duplicateTags.size !==
    form.tags.length
  ) {
    errs.tags =
      'Duplicate tags are not allowed.'
  }

  const oversizedTag =
    form.tags.find(
      (tag) =>
        tag.length > 30
    )

  if (oversizedTag) {
    errs.tags =
      'Each tag must be under 30 characters.'
  }

  // ─── Internal note ───────────────────────

  if (note.length > 2000) {
    errs.private_note =
      'Internal note cannot exceed 2000 characters.'
  }

  setFieldErrors(errs)

  return (
    Object.keys(errs).length ===
    0
  )
}



  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await api.post('/clients/', {
        client_name:   form.client_name.trim(),
        client_email:  form.client_email.trim(),
        business_type: form.business_type || undefined,
        private_note:  form.private_note.trim() || undefined,
        tags:          form.tags.length ? form.tags : undefined,
      })
      setSuccess(res.data.data)
      setStep('success')
      onSuccess?.()
    } catch (err) {
      const error_type = err?.response?.data?.error_type || 'generic'
      const message    = err?.response?.data?.message    || 'Something went wrong. Please try again.'
      setError({ type: error_type, message })
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const resetToForm = () => {
    setStep('form')
    setForm({ client_name: '', client_email: '', business_type: '', private_note: '', tags: [] })
    setFieldErrors({})
    setError({ type: '', message: '' })
    setSuccess(null)
  }

  // ── FORM ──────────────────────────────────────────────────
  if (step === 'form') return (
    <Backdrop onClose={onClose}>
      <div className="w-full max-w-[980px] overflow-hidden border border-[#e8eae8] bg-white shadow-[0px_24px_60px_rgba(10,46,36,0.16)]
        max-h-[95vh]
        rounded-none sm:rounded-[24px] lg:rounded-[28px]">

        <div className="flex flex-col lg:grid lg:grid-cols-[360px_1fr]">

          {/* LEFT PANEL */}
          <div className="relative overflow-hidden border-b border-[#eef0ee] bg-[#f7f8f7] p-6 lg:border-b-0 lg:border-r lg:p-8">

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,110,86,0.08),transparent_45%)]" />

            <div className="relative z-10 flex h-full flex-col">

              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dbe7e1] bg-white px-3 py-1 text-[11px] font-medium text-[#0f6e56]">
                    <div className="h-2 w-2 rounded-full bg-[#0f6e56]" />
                    CLIENT PORTAL
                  </div>

                  <h2 className="text-[28px] font-semibold leading-tight text-[#0a2e24]">
                    Add a new client
                  </h2>

                  <p className="mt-3 max-w-[260px] text-[14px] leading-6 text-[#6b756d]">
                    Create a private workspace and instantly send a secure invitation.
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
                    <Mail size={18} className="text-[#0f6e56]" />
                  </div>

                  <div>
                    <p className="text-[14px] font-medium text-[#141a14]">
                      {form.client_name || 'Your client'}
                    </p>

                    <p className="mt-1 text-[12px] leading-5 text-[#7c867d]">
                      will receive an invite to access their portal workspace.
                    </p>
                  </div>
                </div>

                <div className="my-5 h-px bg-[#eef0ee]" />

                <div className="rounded-xl bg-[#f7f8f7] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-[#9ea89e]">
                    Workspace URL
                  </p>

                  <p className="mt-1 break-all text-[13px] font-medium text-[#0f6e56]">
                    {tenant?.slug}.grove.co/portal
                  </p>
                </div>

                {form.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {form.tags.map((tag) => {
                      const c = getTagColor(tag)
                      return (
                        <span
                          key={tag}
                          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            background: c.bg,
                            color: c.text,
                          }}
                        >
                          {tag}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-8">
                <p className="text-[12px] leading-5 text-[#9ea89e]">
                  Clients can securely access projects, invoices, files, and updates from their dedicated portal.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="overflow-y-auto p-6 lg:max-h-none lg:overflow-visible lg:p-10 max-h-[calc(95vh-260px)]">

            <div className="grid gap-6">

              {/* ROW 1 */}
              <div className="grid gap-5 md:grid-cols-2">

                <Field label="Client name">
                  <input
                    type="text"
                    value={form.client_name}
                    onChange={set('client_name')}
                    placeholder="Meera Enterprises"
                    className={`h-12 w-full rounded-2xl border bg-white px-4 text-[14px] outline-none transition-all ${
                      fieldErrors.client_name
                        ? 'border-red-400 ring-4 ring-red-100'
                        : 'border-[#e8eae8] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10'
                    }`}
                  />
                  {fieldErrors.client_name && (
                    <p className="mt-1.5 text-[12px] text-red-500">
                      {fieldErrors.client_name}
                    </p>
                  )}
                </Field>

                <Field label="Email address">
                  <div className="relative">
                    <input
                      type="email"
                      value={form.client_email}
                      onChange={set('client_email')}
                      placeholder="meera@example.com"
                      className={`h-12 w-full rounded-2xl border bg-white px-4 pr-10 text-[14px] outline-none transition-all ${
                        fieldErrors.client_email
                          ? 'border-red-400 ring-4 ring-red-100'
                          : 'border-[#e8eae8] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10'
                      }`}
                    />

                    {form.client_email && !fieldErrors.client_email && (
                      <CheckCircle2
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0f6e56]"
                      />
                    )}
                  </div>

                  {fieldErrors.client_email && (
                    <p className="mt-1.5 text-[12px] text-red-500">
                      {fieldErrors.client_email}
                    </p>
                  )}
                </Field>
              </div>

              {/* ROW 2 */}
              <div className="grid gap-5 md:grid-cols-2">

                <Field label="Business type" optional>
                  <BusinessTypeSelect
                    value={form.business_type}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, business_type: v }))
                    }
                  />
                </Field>

                <Field
                  label="Tags"
                  optional
                  hint="Press Enter to add tags"
                >
                  <TagInput
                    tags={form.tags}
                    onChange={(tags) =>
                      setForm((f) => ({ ...f, tags }))
                    }
                  />
                </Field>
                {fieldErrors.tags && (
                  <p className="mt-1.5 text-[12px] text-red-500">
                    {fieldErrors.tags}
                  </p>
                )}
              </div>

              {/* NOTE */}
              <Field
                label="Internal note"
                optional
                hint="Only visible to your internal team."
              >
                <textarea
                  value={form.private_note}
                  onChange={set('private_note')}
                  rows={5}
                  placeholder="Add onboarding details, budget notes, references, or anything useful for your team..."
                  className="w-full resize-none rounded-2xl border border-[#e8eae8] bg-white px-4 py-3 text-[14px] outline-none transition-all placeholder:text-[#9ea89e] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10"
                />
                {fieldErrors.private_note && (
                  <p className="mt-1.5 text-[12px] text-red-500">
                    {fieldErrors.private_note}
                  </p>
                )}
              </Field>

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
                  disabled={
                    loading ||
                    Object.keys(fieldErrors).length > 0
                  }
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0f6e56] px-6 text-[14px] font-medium text-white transition-all hover:bg-[#085041] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  ) : (
                    <>
                      Send invite
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
  // ── SUCCESS ───────────────────────────────────────────────
  if (step === 'success') return (
    <Backdrop onClose={onClose}>
      <div className="relative w-full max-w-[460px] rounded-[24px] bg-white p-8 shadow-[0px_24px_32px_rgba(10,46,36,0.18)]">
        <button onClick={onClose} className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f8f7]">
          <X size={16} className="text-[#9ea89e]" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#b3e0d1] bg-[#e6f5f0]">
            <CheckCircle2 size={28} className="text-[#0f6e56]" />
          </div>
          <h2 className="mt-5 text-[22px] font-semibold text-[#0a2e24]">Invite sent!</h2>
          <p className="mt-3 max-w-[300px] text-[13px] leading-6 text-[#9ea89e]">
            An invite has been sent to{' '}
            <span className="font-medium text-[#4a544a]">{successData?.email}</span>.
            Their portal is ready the moment they sign in.
          </p>
          <div className="mt-4 flex items-center gap-2 text-[13px]">
            <span className="text-[#9ea89e]">Portal:</span>
            <span className="font-medium text-[#0f6e56]">{tenant?.slug}.grove.co/portal</span>
            <button onClick={() => navigator.clipboard.writeText(`https://${tenant?.slug}.grove.co/portal`)}>
              <Copy size={13} className="text-[#9ea89e] hover:text-[#0f6e56] transition-colors" />
            </button>
          </div>
          <div className="my-6 h-px w-full bg-[#e8eae8]" />
          <div className="flex w-full gap-3">
            <button
              onClick={resetToForm}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#b3e0d1] bg-[#e6f5f0] py-3 text-[13px] font-medium text-[#085041] hover:bg-[#d4eddf] transition-colors"
            >
              <Plus size={15} /> Add another
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-[#0f6e56] py-3 text-[13px] font-medium text-white hover:bg-[#085041] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  )

  // ── ERROR SCREENS ─────────────────────────────────────────
  // Duplicate active client
  if (step === 'error' && errorState.type === 'duplicate_client') return (
    <Backdrop onClose={onClose}>
      <div className="relative w-full max-w-[420px] rounded-[24px] bg-white p-8 shadow-[0px_24px_32px_rgba(10,46,36,0.18)]">
        <button onClick={onClose} className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f8f7]">
          <X size={16} className="text-[#9ea89e]" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e8eae8] bg-[#f7f8f7]">
            <span className="text-2xl">👤</span>
          </div>
          <h2 className="mt-5 text-[20px] font-semibold text-[#0a2e24]">Already a client</h2>
          <p className="mt-3 max-w-[280px] text-[13px] leading-6 text-[#9ea89e]">
            <span className="font-medium text-[#4a544a]">{form.client_email}</span> already has an active portal in your workspace.
          </p>
          <div className="my-6 h-px w-full bg-[#e8eae8]" />
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#0f6e56] py-3 text-[13px] font-medium text-white hover:bg-[#085041] transition-colors"
          >
            Go to clients
          </button>
          <button onClick={resetToForm} className="mt-3 text-[13px] text-[#9ea89e] hover:text-[#4a544a] transition-colors">
            Add a different client
          </button>
        </div>
      </div>
    </Backdrop>
  )

  // Pending invite already exists
  if (step === 'error' && errorState.type === 'pending_invite') return (
    <Backdrop onClose={onClose}>
      <div className="relative w-full max-w-[420px] rounded-[24px] bg-white p-8 shadow-[0px_24px_32px_rgba(10,46,36,0.18)]">
        <button onClick={onClose} className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f8f7]">
          <X size={16} className="text-[#9ea89e]" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#FEF3E2] bg-[#FEF3E2]">
            <Mail size={24} className="text-[#92500A]" />
          </div>
          <h2 className="mt-5 text-[20px] font-semibold text-[#0a2e24]">Invite already sent</h2>
          <p className="mt-3 max-w-[280px] text-[13px] leading-6 text-[#9ea89e]">
            An invite is pending for{' '}
            <span className="font-medium text-[#4a544a]">{form.client_email}</span>.
            They haven't accepted it yet.
          </p>
          <div className="my-6 h-px w-full bg-[#e8eae8]" />
          <div className="flex w-full gap-3">
            <button
              onClick={resetToForm}
              className="flex-1 rounded-xl border border-[#e8eae8] bg-[#f7f8f7] py-3 text-[13px] font-medium text-[#4a544a] hover:bg-[#eef0ee] transition-colors"
            >
              Add different
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-[#0f6e56] py-3 text-[13px] font-medium text-white hover:bg-[#085041] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  )

  // Plan limit reached
  if (step === 'error' && errorState.type === 'limit_reached') return (
    <Backdrop onClose={onClose}>
      <div className="relative w-full max-w-[420px] rounded-[24px] bg-white p-8 shadow-[0px_24px_32px_rgba(10,46,36,0.18)]">
        <button onClick={onClose} className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f8f7]">
          <X size={16} className="text-[#9ea89e]" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e8eae8] bg-[#f7f8f7]">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="mt-5 text-[20px] font-semibold text-[#0a2e24]">Client limit reached</h2>
          <p className="mt-3 max-w-[280px] text-[13px] leading-6 text-[#9ea89e]">
            {errorState.message}
          </p>
          <div className="my-6 h-px w-full bg-[#e8eae8]" />
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[#0f6e56] py-3 text-[13px] font-medium text-white hover:bg-[#085041] transition-colors"
          >
            Upgrade to Pro
          </button>
          <button onClick={onClose} className="mt-3 text-[13px] text-[#9ea89e] hover:text-[#4a544a] transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </Backdrop>
  )

  // Generic fallback
  return (
    <Backdrop onClose={onClose}>
      <div className="relative w-full max-w-[420px] rounded-[24px] bg-white p-8 shadow-[0px_24px_32px_rgba(10,46,36,0.18)]">
        <button onClick={onClose} className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f8f7]">
          <X size={16} className="text-[#9ea89e]" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#f5dfb0] bg-[#fef3e2]">
            <AlertTriangle size={24} className="text-[#92500a]" />
          </div>
          <h2 className="mt-5 text-[20px] font-semibold text-[#0a2e24]">Something went wrong</h2>
          <p className="mt-3 max-w-[280px] text-[13px] leading-6 text-[#9ea89e]">{errorState.message}</p>
          <div className="my-6 h-px w-full bg-[#e8eae8]" />
          <div className="flex w-full gap-3">
            <button
              onClick={resetToForm}
              className="flex-1 rounded-xl bg-[#0f6e56] py-3 text-[13px] font-medium text-white hover:bg-[#085041] transition-colors"
            >
              Try again
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#e8eae8] bg-[#f7f8f7] py-3 text-[13px] font-medium text-[#4a544a] hover:bg-[#eef0ee] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  )
}