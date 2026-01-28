'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getActivities, Activity } from '@/lib/activity-log'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync } from '@/hooks/useDataSync'
import { migrateLocalStorageToAPI } from '@/lib/migrate-data'

export default function DashboardPage() {
  const router = useRouter()
  const { isAdmin, temPermissao } = usePermissions()
  const podeVer = isAdmin || temPermissao('view_dashboard')
  const podeEditar = isAdmin || temPermissao('edit_dashboard')
  const [isClient, setIsClient] = useState(false)
  const [atividades, setAtividades] = useState<Activity[]>([])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Sincronização de dados via API
  const { data: militaresData } = useDataSync<any>({ entity: 'militares' })
  const { data: cargosData } = useDataSync<any>({ entity: 'cargos' })
  const { data: eventosData } = useDataSync<any>({ entity: 'eventos' })
  const { data: webhooksData } = useDataSync<any>({ entity: 'webhooks' })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      migrateLocalStorageToAPI()
    }
  }, [])

  // Carregar atividades
  useEffect(() => {
    const loadActivities = async () => {
      const activities = await getActivities(10)
      setAtividades(activities)
    }
    loadActivities()

    const handleCustomStorageChange = async () => {
      const activities = await getActivities(10)
      setAtividades(activities)
    }

    window.addEventListener('custom-storage-change', handleCustomStorageChange)
    return () => {
      window.removeEventListener('custom-storage-change', handleCustomStorageChange)
    }
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  const militaresAtivos = (militaresData || []).filter((m: any) => m.status === 'Ativo').length
  const webhooksAtivos = (webhooksData || []).filter((w: any) => w.status === 'Ativo').length
  const totalCargos = (cargosData || []).length
  const totalEventosPositivos = (eventosData || []).filter((e: any) => e.classificacao === 'Positivo').length

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )
      case 'updated':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      case 'deleted':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )
      default:
        return null
    }
  }

  const getActivityText = (activity: Activity) => {
    const entityNames: Record<string, string> = {
      militar: 'Militar',
      cargo: 'Cargo',
      acao: 'Ação',
      infracao: 'Infração',
      punicao: 'Punição',
      evento: 'Evento',
      webhook: 'Webhook',
      instrutor: 'Instrutor',
    }

    const actionNames: Record<string, string> = {
      created: 'criado',
      updated: 'editado',
      deleted: 'excluído',
    }

    const entityName = entityNames[activity.entity] || activity.entity
    const actionName = actionNames[activity.type] || activity.type

    return `${entityName} "${activity.entityName}" foi ${actionName}`
  }

  const getEntityRoute = (entity: string, entityId: string) => {
    switch (entity) {
      case 'militar':
        return `/dashboard/militares/${entityId}`
      case 'cargo':
        return `/dashboard/cargos`
      case 'acao':
        return `/dashboard/acoes/${entityId}`
      case 'infracao':
        return `/dashboard/infracoes`
      case 'punicao':
        return `/dashboard/punicoes`
      case 'evento':
        return `/dashboard/militares/${entityId}`
      case 'webhook':
        return `/dashboard/webhooks`
      case 'instrutor':
        return `/dashboard/instrutores`
      default:
        return '/dashboard'
    }
  }

  if (!podeVer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral e estatísticas da organização</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Militares Ativos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Militares Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{militaresAtivos}</p>
            </div>
            <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Cargos Criados */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cargos Criados</p>
              <p className="text-3xl font-bold text-gray-900">{totalCargos}</p>
            </div>
            <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Eventos Positivos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Eventos Positivos</p>
              <p className="text-3xl font-bold text-gray-900">{totalEventosPositivos}</p>
            </div>
            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Webhooks Ativos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Webhooks Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{webhooksAtivos}</p>
            </div>
            <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Painéis Inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Atividade Recente */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Atividade Recente</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {atividades.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Nenhuma atividade recente
              </div>
            ) : (
              atividades.map((activity) => (
                <div
                  key={activity.id}
                  onClick={() => {
                    if (activity.type !== 'deleted') {
                      router.push(getEntityRoute(activity.entity, activity.entityId))
                    }
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                    activity.type === 'deleted' ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{getActivityText(activity)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.date} às {activity.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="space-y-3">
            {(isAdmin || podeEditar || temPermissao('edit_militares')) && (
              <button
                onClick={() => router.push('/dashboard/militares')}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Adicionar Militar
              </button>
            )}

            {(isAdmin || podeEditar || temPermissao('edit_cargos')) && (
              <button
                onClick={() => router.push('/dashboard/cargos')}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Criar Cargo
              </button>
            )}

            {(isAdmin || podeEditar || temPermissao('view_relatorios')) && (
              <button
                onClick={() => router.push('/dashboard/relatorios')}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Ver Relatórios
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
