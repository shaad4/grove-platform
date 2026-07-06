import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowRight, Check, Eye, EyeOff,
  Lock, MessageCircle, TrendingUp, Upload, AlertTriangle,
} from 'lucide-react'
import groveLogo from '../../assets/Grove_transparent_logo(White).png'
import { authApi as clientApi } from '../../api/auth.api'
import { useAuth } from '../../context/AuthContext'
import { useTenantBranding } from '../../context/TenantBrandingContext'
import { appUrl } from '../../utils/urls'

// ─── HELPERS ──────────────────────────────────────────────────

function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' }
  let s = 0
  if (pw.length >= 8)            s++
  if (/[A-Z]/.test(pw))         s++
  if (/[0-9]/.test(pw))         s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  const levels = [
    { label: '',       color: 'bg-border' },
    { label: 'Weak',   color: 'bg-red-400' },
    { label: 'Fair',   color: 'bg-yellow-400' },
    { label: 'Good',   color: 'bg-primary' },
    { label: 'Strong', color: 'bg-primary' },
  ]
  return { score: s, ...levels[s] }
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function AcceptInvitePage() {
  const [searchParams]  = useSearchParams()
  const token           = searchParams.get('token')
  const { saveSession } = useAuth()
  const { colors }      = useTenantBranding()
  const { accent, accentDark, accentSoft, bg1, bg2, bg3 } = colors

  // Token validation
  const [validating,  setValidating]  = useState(true)
  const [tokenError,  setTokenError]  = useState('')
  const [inviteData,  setInviteData]  = useState(null)

  // Form
  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [showPw,       setShowPw]       = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState('')
  const [done,         setDone]         = useState(false)

  const strength = getStrength(password)
  const pwMatch  = confirm && password === confirm

  // ── Validate token on mount ──────────────────────────────
  useEffect(() => {
    if (!token) {
      setTokenError('No invite token found. Check your email link.')
      setValidating(false)
      return
    }

    clientApi.validateInviteToken(token)
      .then(res => setInviteData(res.data.data))
      .catch(err => setTokenError(
        err?.response?.data?.message ||
        'This invite link is invalid or has expired.'
      ))
      .finally(() => setValidating(false))
  }, [token])

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError('')

    if (!inviteData?.already_has_account) {
      if (password.length < 8) {
        setSubmitError('Password must be at least 8 characters.')
        return
      }
      if (password !== confirm) {
        setSubmitError('Passwords do not match.')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = inviteData?.already_has_account
        ? { token }
        : { token, password }

      const res = await clientApi.acceptInvite(payload)
      const { access, user, tenant } = res.data.data

      saveSession({ accessToken: access, user, tenant })
      setDone(true)

      setTimeout(() => {
        window.location.replace(appUrl(tenant.slug, '/portal'))
      }, 1500)

    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ||
        'Something went wrong. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const providerInitials = inviteData?.provider_name
    ? inviteData.provider_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  const isExistingUser = inviteData?.already_has_account

  // ── LOADING ──────────────────────────────────────────────
  if (validating) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6]">
      <div className="flex flex-col items-center gap-4">
        <svg className="h-8 w-8 animate-spin" style={{ color: accent }} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <p className="text-[14px] text-text-dim">Validating your invite…</p>
      </div>
    </div>
  )

  // ── TOKEN ERROR ──────────────────────────────────────────
  if (tokenError) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6] px-4">
      <div className="w-full max-w-[420px] rounded-[24px] border border-[#e8eae8] bg-white p-10 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#f5dfb0] bg-[#fef3e2] mx-auto">
          <AlertTriangle size={28} className="text-[#92500a]" />
        </div>
        <h1 className="mt-6 text-[22px] font-semibold text-text-main">Invalid invite link</h1>
        <p className="mt-3 text-[14px] leading-7 text-text-dim">{tokenError}</p>
        <p className="mt-6 text-[13px] text-text-dim">
          Contact your provider to resend the invite.
        </p>
      </div>
    </div>
  )

  // ── SUCCESS ──────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6] px-4">
      <div className="w-full max-w-[420px] rounded-[24px] bg-white p-10 text-center shadow-sm"
           style={{ borderColor: `${accent}40`, borderWidth: 1, borderStyle: 'solid' }}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto"
             style={{ background: accentSoft, border: `1px solid ${accent}40` }}>
          <Check size={30} style={{ color: accent }} />
        </div>
        <h1 className="mt-6 text-[22px] font-semibold text-text-main">You're all set!</h1>
        <p className="mt-3 text-[14px] leading-7 text-text-dim">
          Taking you to your portal…
        </p>
      </div>
    </div>
  )

  // ── MAIN FORM ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">

      {/* LEFT PANEL */}
      <div
        className="relative hidden lg:flex w-[44%] overflow-hidden"
        style={{ background: bg3 }}
      >
        {/* Background gradient using brand colors */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at top, ${accent}48 0%, ${accent}28 28%, ${bg3} 72%)`
          }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.015), transparent)' }} />

        {/* Glow blobs */}
        <div className="absolute left-[-120px] top-[120px] h-[320px] w-[320px] rounded-full blur-[120px]"
             style={{ background: `${accent}33` }} />
        <div className="absolute bottom-[-100px] right-[-80px] h-[260px] w-[260px] rounded-full blur-[100px]"
             style={{ background: `${accentDark}33` }} />

        {/* Content */}
        <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-12 py-10">

          {/* Top */}
          <div className="flex w-full items-center justify-start">
            <img src={groveLogo} alt="Grove" className="h-8 w-auto object-contain opacity-95" />
          </div>

          {/* Center */}
          <div className="mx-auto flex w-full max-w-[460px] flex-col items-center">

            {/* Provider identity */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: `${accent}4D` }} />
              <div
                className="relative flex h-[88px] w-[88px] items-center justify-center rounded-[28px] border border-white/10 text-[32px] font-semibold tracking-wide text-white shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accentDark})` }}
              >
                {providerInitials}
              </div>
            </div>

            {/* Heading */}
            <div className="mt-8 text-center">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em]"
                 style={{ color: `${accent}CC` }}>
                You've been invited
              </p>

              <h2 className="mt-4 text-[42px] font-semibold tracking-[-1.6px] leading-[1.05] text-white">
                {inviteData?.workspace_name}
              </h2>

              <p className="mt-5 text-[17px] leading-8 text-white/60">
                Collaborate, submit requests, track progress,
                and communicate with your provider —
                all in one focused workspace.
              </p>
            </div>

            {/* Features */}
            <div className="mt-14 w-full rounded-[28px] border border-white/10 bg-white/[0.045] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">

              {[
                { icon: <Upload size={17} />, title: 'Submit requests', desc: 'Organize all project requests in one secure place.' },
                { icon: <TrendingUp size={17} />, title: 'Track progress', desc: 'Follow updates, delivery stages, and approvals in real time.' },
                { icon: <MessageCircle size={17} />, title: 'Communicate clearly', desc: `Stay aligned with ${inviteData?.provider_name} without scattered emails.` },
              ].map((f, i) => (
                <div key={f.title}>
                  {i > 0 && <div className="my-6 h-px w-full bg-white/10" />}
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-white/80"
                      style={{ background: `${accent}33` }}
                    >
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-medium text-white">{f.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-6 text-white/60">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-2 text-[12px] text-white/40">
            <Lock size={12} />
            <span>Private workspace · Secure access · Powered by Grove</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-1 items-center justify-center bg-[#f8f8f6] px-6 py-12 lg:px-10">
        <div className="w-full max-w-[450px]">

          <div>
            <h1 className="text-[36px] font-bold tracking-[-1px] text-text-main">
              {isExistingUser
                ? `Welcome back, ${inviteData?.client_name?.split(' ')[0]}!`
                : `You're invited, ${inviteData?.client_name?.split(' ')[0]}!`}
            </h1>
            <p className="mt-2 text-[16px] leading-7 text-text-sub">
              {isExistingUser
                ? 'Your existing Grove account will be connected to this portal.'
                : 'Set a password to access your private project portal.'}
            </p>
          </div>

          <div className="mt-10 space-y-6">

            {/* Email (always read-only) */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-text-main">Email address</label>
              <div className="relative">
                <input
                  disabled
                  type="email"
                  value={inviteData?.client_email || ''}
                  className="h-[52px] w-full rounded-[12px] border border-border bg-surface px-4 pr-11 text-[14px] text-text-dim outline-none"
                />
                <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim" />
              </div>
              <p className="mt-2 text-[12px] text-text-dim">
                {isExistingUser ? 'This is your existing Grove account.' : 'This cannot be changed.'}
              </p>
            </div>

            {/* Password fields — only for new users */}
            {!isExistingUser && (
              <>
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-text-main">Create a password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Choose a secure password"
                      className="h-[54px] w-full rounded-[12px] border border-border bg-white px-4 pr-12 text-[14px] outline-none transition-all"
                      style={{ '--tw-ring-color': accentSoft }}
                      onFocus={e => e.target.style.borderColor = accent}
                      onBlur={e => e.target.style.borderColor = ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim"
                    >
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  {password && (
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className={`h-[4px] flex-1 rounded-full transition-all ${
                              i <= strength.score ? strength.color : 'bg-border'
                            }`}
                          />
                        ))}
                        {strength.label && (
                          <span
                            className="ml-2 text-[11px] font-semibold"
                            style={{ color: strength.score >= 3 ? accent : '#92500a' }}
                          >
                            {strength.label}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-[12px] text-text-dim">Minimum 8 characters.</p>
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-medium text-text-main">Confirm password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      className="h-[54px] w-full rounded-[12px] border bg-white px-4 pr-12 text-[14px] outline-none transition-all"
                      style={
                        confirm
                          ? pwMatch
                            ? { borderColor: accent, boxShadow: `0 0 0 4px ${accentSoft}` }
                            : { borderColor: '#f87171', boxShadow: '0 0 0 4px #fee2e2' }
                          : {}
                      }
                      onFocus={e => { if (!confirm) e.target.style.borderColor = accent }}
                      onBlur={e => { if (!confirm) e.target.style.borderColor = '' }}
                    />
                    {confirm && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2">
                        {pwMatch
                          ? <Check size={16} style={{ color: accent }} />
                          : <span className="text-[11px] text-red-400 font-medium">✗</span>}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Existing user — info card */}
            {isExistingUser && (
              <div
                className="rounded-[12px] px-5 py-4"
                style={{ background: accentSoft, border: `1px solid ${accent}40` }}
              >
                <p className="text-[13px] leading-6" style={{ color: accentDark }}>
                  You already have a Grove account. Clicking below will add{' '}
                  <span className="font-semibold">{inviteData?.workspace_name}</span> to
                  your portals — no new password needed.
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {submitError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
              {submitError}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={submitting || (!isExistingUser && (!password || !confirm))}
            className="mt-8 flex h-[56px] w-full items-center justify-center gap-3 rounded-[12px] text-[15px] font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accentDark})` }}
          >
            {submitting ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <>
                <ArrowRight size={16} />
                {isExistingUser ? 'Accept invite & enter portal' : 'Create account & enter portal'}
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-7 flex items-center justify-center gap-2">
            <span className="text-[12px] text-text-dim">Powered by Grove</span>
          </div>
          <p className="mt-4 text-center text-[12px] text-text-dim">
            Wrong invite?{' '}
            <a href="mailto:support@grove.co" className="underline" style={{ color: accent }}>
              Contact support@grove.co
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}