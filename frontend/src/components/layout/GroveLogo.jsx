import groveLogo from '../../assets/Grove_transparent_logo(Green).png'
import { appUrl } from '../../utils/urls'

export default function GroveLogo({ size = 'md', variant = 'full', dark = false }) {
  const heights = { sm: 'h-5', md: 'h-7', lg: 'h-9' }

  if (variant === 'icon') {
    return (
      <a href={appUrl(null, '/')} className="cursor-pointer shrink-0 outline-none">
        <img
          src={groveLogo}
          alt="Groven"
          className={`${heights[size]} w-auto object-contain`}
        />
      </a>
    )
  }

  if (variant === 'wordmark') {
    return (
      <a href={appUrl(null, '/')} className="cursor-pointer shrink-0 outline-none">
        <span
          className={`font-semibold tracking-tight ${
            size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-[22px]' : 'text-[18px]'
          } ${dark ? 'text-white' : 'text-[#0a2e24]'}`}
        >
          Groven
        </span>
      </a>
    )
  }

  return (
    <a href={appUrl(null, '/')} className="flex items-center gap-2.5 cursor-pointer outline-none">
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
    </a>
  )
}