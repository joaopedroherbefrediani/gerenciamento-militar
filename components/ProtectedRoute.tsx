'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissionsContext } from '@/contexts/PermissionsContext'
import { PERMISSOES_ROTAS } from '@/lib/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  route?: string
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  route,
}: ProtectedRouteProps) {
  const router = useRouter()
  const { permissoes, isAdmin, loading, temPermissao } = usePermissionsContext()

  useEffect(() => {
    if (loading) return

    // Se é admin, sempre permitir
    if (isAdmin) return

    // Se tem permissão específica, verificar
    if (requiredPermission) {
      if (!temPermissao(requiredPermission)) {
        router.replace('/')
        return
      }
    }

    // Se tem rota, verificar permissão da rota
    if (route) {
      const permissoesNecessarias = PERMISSOES_ROTAS[route]
      if (permissoesNecessarias && permissoesNecessarias.length > 0) {
        const temAcesso = permissoesNecessarias.some((permissao) => temPermissao(permissao))
        if (!temAcesso) {
          router.replace('/')
          return
        }
      }
    }
  }, [loading, isAdmin, permissoes, requiredPermission, route, router, temPermissao])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  // Se é admin, sempre mostrar
  if (isAdmin) {
    return <>{children}</>
  }

  // Verificar permissão específica
  if (requiredPermission) {
    if (!temPermissao(requiredPermission)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      )
    }
  }

  // Verificar permissão da rota
  if (route) {
    const permissoesNecessarias = PERMISSOES_ROTAS[route]
    if (permissoesNecessarias && permissoesNecessarias.length > 0) {
      const temAcesso = permissoesNecessarias.some((permissao) => temPermissao(permissao))
      if (!temAcesso) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
              <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
            </div>
          </div>
        )
      }
    }
  }

  return <>{children}</>
}
