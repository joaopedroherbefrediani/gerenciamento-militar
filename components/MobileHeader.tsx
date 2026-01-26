'use client'

interface MobileHeaderProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export default function MobileHeader({ isMobileMenuOpen, setIsMobileMenuOpen }: MobileHeaderProps) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-[40] bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo e Nome do Projeto */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div className="font-bold text-gray-900">Gerenciamento Militar</div>
        </div>
        
        {/* Menu Hambúrguer */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex-shrink-0 p-2 text-gray-700 hover:bg-gray-50 transition-colors rounded"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
    </div>
  )
}
