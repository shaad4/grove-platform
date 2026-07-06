import { useState, useEffect } from 'react'
import { authApi } from '../../api/auth.api'
import { getBrandColors } from '../../utils/branding'
import ClientSidebar from './ClientSidebar'

export default function ClientLayout({ children, fullBleed = false, badges = {} }) {
  const [tenantInfo, setTenantInfo] = useState(null)

  useEffect(() => {
    authApi.getTenantInfo()
      .then(res => setTenantInfo(res.data))
      .catch(err => console.error('[ClientLayout] Failed to load tenant info:', err))
  }, [])

  const colors = getBrandColors(tenantInfo?.accent_color)

  return (
    <div className="flex min-h-screen bg-layout-page text-text-main font-sans selection:bg-primary-light selection:text-primary-dark">
      <style>{`
        :root {
          --primary: ${colors.accent} !important;
          --primary-dark: ${colors.accentDark} !important;
          --primary-light: ${colors.accentSoft} !important;
          --sidebar: ${colors.bg1} !important;
          --grove-50: ${colors.accentSoft} !important;
          --grove-100: ${colors.accent} !important;
          --grove-200: ${colors.accent} !important;
          --grove-300: ${colors.accent} !important;
          --grove-500: ${colors.accent} !important;
          --grove-700: ${colors.accentDark} !important;
          --grove-900: ${colors.bg1} !important;
          --grove-950: ${colors.bg3} !important;
        }
      `}</style>

      <ClientSidebar badges={badges} />
      
      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300 ease-in-out">
        {fullBleed ? (
          /* Full-screen, edge-to-edge container for the detail page */
          <main className="flex-1 h-[100dvh] overflow-hidden">
            {children}
          </main>
        ) : (
          /* Standard centered container for dashboards & lists */
          <main className="flex-1 overflow-y-auto px-4 pt-6 pb-[88px] lg:px-8 lg:pt-8 lg:pb-8">
            <div className="mx-auto h-full w-full max-w-5xl">
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
  )
}