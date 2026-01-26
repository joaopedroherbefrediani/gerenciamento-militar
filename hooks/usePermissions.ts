'use client'

// Hook de compatibilidade - redireciona para o Context
import { usePermissionsContext } from '@/contexts/PermissionsContext'

export function usePermissions() {
  const context = usePermissionsContext()
  
  const temAlgumaPermissao = (permissoesList: string[]): boolean => {
    if (context.isAdmin) return true
    if (!context.permissoes) return false
    return permissoesList.some((p) => context.permissoes?.includes(p))
  }

  return {
    permissoes: context.permissoes,
    user: context.user,
    isAdmin: context.isAdmin,
    loading: context.loading,
    temPermissao: context.temPermissao,
    temAlgumaPermissao,
  }
}
