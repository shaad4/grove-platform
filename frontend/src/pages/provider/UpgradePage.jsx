import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react'

import { createCheckoutSession } from '../../api/billing.api'

const PRO_FEATURES = [
  'Unlimited clients',
  'Unlimited active requests',
  'AI request summaries & categorisation',
  'AI reply & delivery message suggestions',
  'Priority support',
]

const FREE_FEATURES = [
  'Up to 3 clients',
  'Up to 10 active requests',
  'Core request pipeline',
  'Live notifications & chat',
]

function PlanCard({ name, price, period, features, highlighted, cta, onCta, loading }) {
  return (
    <div
      className={`flex-1 rounded-2xl border p-7 flex flex-col ${
        highlighted
          ? 'border-[#0F6E56] bg-[#F0FAF5] shadow-sm'
          : 'border-[#E8EAE8] bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[15px] font-semibold text-[#141A14]">{name}</p>
        {highlighted && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F6E56] bg-white px-2.5 py-1 rounded-full border border-[#B3DDD1]">
            <Sparkles size={11} /> Recommended
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-5">
        <p className="text-[32px] font-semibold text-[#141A14]">{price}</p>
        {period && <p className="text-[13px] text-[#9EA89E]">{period}</p>}
      </div>
      <ul className="space-y-3 mb-7 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[13px] text-[#4A544A]">
            <Check size={15} className="text-[#0F6E56] mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      {cta && (
        <button
          type="button"
          onClick={onCta}
          disabled={loading}
          className={`w-full h-10 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 ${
            highlighted
              ? 'bg-[#0F6E56] text-white hover:bg-[#0A5A44]'
              : 'bg-transparent text-[#4A544A] border border-[#E0E4E0] hover:bg-[#F2F4F2]'
          }`}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : cta}
        </button>
      )}
    </div>
  )
}

export default function UpgradePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await createCheckoutSession({
        successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        cancelUrl: window.location.href,
      })
      window.location.href = res.data.data.checkoutUrl
    } catch {
      setError('Could not start checkout. Try again in a moment.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8F7]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#4A544A] hover:text-[#141A14] transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="text-center mb-10">
          <h1 className="text-[24px] font-semibold text-[#141A14] mb-2">
            Upgrade to Grove Pro
          </h1>
          <p className="text-[14px] text-[#9EA89E] max-w-md mx-auto">
            Unlock unlimited clients, unlimited requests, and AI-powered workflows.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 mb-8">
          <PlanCard name="Free" price="$0" period="/mo" features={FREE_FEATURES} />
          <PlanCard
            name="Pro"
            price="$19"
            period="/mo"
            features={PRO_FEATURES}
            highlighted
            cta="Upgrade to Pro"
            onCta={handleUpgrade}
            loading={loading}
          />
        </div>

        {error && (
          <p className="text-center text-[13px] text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}