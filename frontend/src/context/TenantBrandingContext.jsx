import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/auth.api'
import { getBrandColors } from '../utils/branding'

const TenantBrandingContext = createContext(null)

/**
 * Provides the tenant's accent color + computed brand color ramp.
 * Uses getTenantInfo — same technique as ClientLoginPage (which works perfectly).
 * 
 * Applies CSS variables directly on document.documentElement so they
 * always override the compiled stylesheet defaults, just like how
 * ClientLoginPage applies colors via inline style={{ color: accent }}.
 */
export function TenantBrandingProvider({ children }) {
  const [tenantInfo, setTenantInfo] = useState(null)

  useEffect(() => {
    authApi.getTenantInfo()
      .then(res => setTenantInfo(res.data))
      .catch(() => {/* fail silently, fallback colors will be used */})
  }, [])

  const colors = getBrandColors(tenantInfo?.accent_color)
  const { accent, accentDark, accentSoft, bg1, bg3 } = colors

  // Apply directly to document root — same as how CSS custom properties work
  // when set via JS. This always beats the compiled stylesheet.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary', accent)
    root.style.setProperty('--primary-dark', accentDark)
    root.style.setProperty('--primary-light', accentSoft)
    root.style.setProperty('--sidebar', bg1)
    root.style.setProperty('--grove-50', accentSoft)
    root.style.setProperty('--grove-100', accent)
    root.style.setProperty('--grove-200', accent)
    root.style.setProperty('--grove-300', accent)
    root.style.setProperty('--grove-500', accent)
    root.style.setProperty('--grove-700', accentDark)
    root.style.setProperty('--grove-900', bg1)
    root.style.setProperty('--grove-950', bg3)
  }, [accent, accentDark, accentSoft, bg1, bg3])

  return (
    <TenantBrandingContext.Provider value={{ tenantInfo, colors }}>
      {children}
    </TenantBrandingContext.Provider>
  )
}

export function useTenantBranding() {
  const ctx = useContext(TenantBrandingContext)
  if (!ctx) throw new Error('useTenantBranding must be used inside TenantBrandingProvider')
  return ctx
}
