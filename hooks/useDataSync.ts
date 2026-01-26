import { useState, useEffect, useCallback } from 'react'

type EntityType = 'militares' | 'cargos' | 'acoes' | 'infracoes' | 'punicoes' | 'webhooks' | 'templates' | 'provas' | 'eventos' | 'activities' | 'kanban'

interface UseDataSyncOptions {
  entity: EntityType
  pollingInterval?: number // em milissegundos, padrão 2000ms (2 segundos)
  enabled?: boolean // se deve fazer polling, padrão true
}

export function useDataSync<T = any>({ entity, pollingInterval = 2000, enabled = true }: UseDataSyncOptions) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/data/${entity}`, { cache: 'no-store' })
      const text = await response.text()
      if (!response.ok) {
        setData([])
        setError(`Erro ${response.status}: ${response.statusText}`)
        try {
          const j = JSON.parse(text)
          if (j?.error) setError(j.error)
        } catch { /* body não é JSON */ }
        return
      }
      const result = JSON.parse(text || '{}')
      if (result.success) {
        setData(result.data || [])
        setError(null)
        setLastSync(new Date())
      } else {
        setError(result.error || 'Erro ao buscar dados')
      }
    } catch (err) {
      console.error(`Erro ao buscar ${entity}:`, err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [entity])

  // Carregar dados iniciais
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [fetchData, enabled])

  // Polling para sincronização automática
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      fetchData()
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [fetchData, pollingInterval, enabled])

  // Função para forçar atualização
  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    lastSync,
    refresh,
  }
}

// Hook para criar/atualizar/deletar dados
export function useDataMutation<T = any>(entity: EntityType) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (data: Partial<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/data/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      
      if (result.success) {
        return result.data
      } else {
        setError(result.error || 'Erro ao criar')
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error(`Erro ao criar ${entity}:`, err)
      return null
    } finally {
      setLoading(false)
    }
  }, [entity])

  const update = useCallback(async (id: string, data: Partial<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/data/${entity}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      })
      const result = await response.json()
      
      if (result.success) {
        return result.data
      } else {
        setError(result.error || 'Erro ao atualizar')
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error(`Erro ao atualizar ${entity}:`, err)
      return null
    } finally {
      setLoading(false)
    }
  }, [entity])

  const remove = useCallback(async (id: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/data/${entity}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        cache: 'no-store',
      })
      let result: { success?: boolean; error?: string }
      try {
        result = await response.json()
      } catch {
        result = { success: false, error: `Erro ${response.status}: resposta inválida` }
      }
      if (result.success) {
        return { ok: true }
      }
      const errMsg = result.error || 'Erro ao deletar'
      setError(errMsg)
      return { ok: false, error: errMsg }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error(`Erro ao deletar ${entity}:`, err)
      return { ok: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [entity])

  return {
    create,
    update,
    remove,
    loading,
    error,
  }
}
