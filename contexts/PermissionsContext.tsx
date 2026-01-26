'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface PermissionsContextType {
  permissoes: string[] | null
  user: { id: string; login: string } | null
  isAdmin: boolean
  loading: boolean
  temPermissao: (permissao: string) => boolean
  atualizarPermissoes: () => void
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissoes, setPermissoes] = useState<string[] | null>(null)
  const [user, setUser] = useState<{ id: string; login: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const atualizarPermissoesAsync = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })

      if (!response.ok) {
        setPermissoes(null)
        setUser(null)
        setIsAdmin(false)
        return
      }

      const data = await response.json()
      const userPermissoes: string[] | null = Array.isArray(data.permissoes)
        ? data.permissoes
            .filter((p: unknown) => typeof p === 'string')
            .map((p: string) => p.trim())
            .filter((p: string) => p.length > 0)
        : null

      setPermissoes(userPermissoes)
      setUser({ id: data.id, login: data.login })
      setIsAdmin(!userPermissoes || userPermissoes.length === 0)
    } catch (error) {
      console.error('Erro ao obter permissões:', error)
      setPermissoes(null)
      setUser(null)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const atualizarPermissoes = () => {
    void atualizarPermissoesAsync()
  }

  useEffect(() => {
    atualizarPermissoes()

    // Verificar validade da sessão periodicamente
    const verificarSessao = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })

        if (!response.ok) {
          // Cookie inválido/expirado ou usuário inativo/sessão expirada
          window.location.href = '/login'
          return
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err)
      }
    }

    const sessionInterval = setInterval(verificarSessao, 5000) // Verifica a cada 5 segundos

    return () => {
      clearInterval(sessionInterval)
    }
  }, [])

  const temPermissao = (permissao: string): boolean => {
    if (isAdmin) return true
    if (!permissoes || !Array.isArray(permissoes)) return false
    
    // Usar comparação normalizada (case-insensitive, ignorando espaços)
    const permissaoNormalizada = permissao.trim().toLowerCase()
    return permissoes.some((p) => {
      if (!p || typeof p !== 'string') return false
      return p.trim().toLowerCase() === permissaoNormalizada
    })
  }

  return (
    <PermissionsContext.Provider
      value={{
        permissoes,
        user,
        isAdmin,
        loading,
        temPermissao,
        atualizarPermissoes,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider')
  }
  return context
}
