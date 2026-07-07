import groveLogo from '../../assets/Grove_transparent_logo(Green).png'

export default function GroveLogo({ size = 'md', variant = 'full', dark = false }) {
  const heights = { sm: 'h-5', md: 'h-7', lg: 'h-9' }

  if (variant === 'icon') {
    return (
      <img
        src={groveLogo}
        alt="Groven"
        className={`${heights[size]} w-auto object-contain`}
      />
    )
  }

  if (variant === 'wordmark') {
    return (
      <span
        className={`font-semibold tracking-tight ${
          size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-[22px]' : 'text-[18px]'
        } ${dark ? 'text-white' : 'text-[#0a2e24]'}`}
      >
        Groven
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <img
        src={groveLogo}
        alt="Groven"
        className={`${heights[size]} w-auto object-contain`}
      />
      <span
        className={`font-semibold tracking-tight ${
          size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-[22px]' : 'text-[17px]'
        } ${dark ? 'text-white' : 'text-[#0a2e24]'}`}
      >
        Groven
      </span>
    </div>
  )
}