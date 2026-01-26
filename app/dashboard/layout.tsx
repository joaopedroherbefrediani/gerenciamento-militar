'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import { PermissionsProvider } from '@/contexts/PermissionsContext'
import { migrateLocalStorageToAPI } from '@/lib/migrate-data'


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      migrateLocalStorageToAPI()
    }
  }, [])

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') {
      return
    }

    let mounted = true

    const checkAuth = async () => {
      if (!mounted) return
      
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
        if (!response.ok) {
          if (mounted) {
            router.replace('/login')
            setLoading(false)
          }
          return
        }

        const userData = await response.json()
        if (mounted) {
          setUser(userData)
          setLoading(false)
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void checkAuth()

    return () => {
      mounted = false
    }
  }, [isClient, router])

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Redirecionando...</div>
      </div>
    )
  }

  return (
    <PermissionsProvider>
      <div className="flex h-full bg-gray-50 overflow-hidden">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Header fixo para mobile */}
          <MobileHeader isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 mb-16 lg:mb-0 pt-20 lg:pt-0">
            {children}
          </main>
        </div>
      </div>
    </PermissionsProvider>
  )
}
