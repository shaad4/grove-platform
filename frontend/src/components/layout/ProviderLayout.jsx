import ProviderSidebar from './ProviderSidebar'
import { useBadges } from '../../hooks/useBadges'



export default function ProviderLayout({
  children,
  topbar,
}) {
  const { badges } = useBadges()
  
  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8f7]">
      <ProviderSidebar badges={badges} />

      {/* Right column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Sticky Topbar */}
        <div className="sticky top-0 z-50 border-b border-[#e8eae8] bg-[#f7f8f7]/80 backdrop-blur-xl">
          {topbar}
        </div>

        {/* Scrollable Content */}
        <main
          className="
            flex-1
            overflow-y-auto
            pb-[88px]
            lg:pb-0
          "
        >
          {children}
        </main>

      </div>
    </div>
  )
}