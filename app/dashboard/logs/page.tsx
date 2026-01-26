'use client'

import { useState, useEffect } from 'react'
import { getActivities, Activity, ActivityType, ActivityEntity } from '@/lib/activity-log'
import { usePermissions } from '@/hooks/usePermissions'

export default function LogsPage() {
  const { isAdmin, temPermissao } = usePermissions()
  const podeVer = isAdmin || temPermissao('view_logs')
  const [isClient, setIsClient] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [busca, setBusca] = useState('')
  const [filtroAcao, setFiltroAcao] = useState<ActivityType | 'all'>('all')
  const [filtroEntidade, setFiltroEntidade] = useState<ActivityEntity | 'all'>('all')

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const carregarAtividades = async () => {
      try {
        const todasAtividades = await getActivities(1000) // Buscar todas as atividades
        setActivities(todasAtividades)
      } catch (error) {
        console.error('Erro ao carregar atividades:', error)
      }
    }

    carregarAtividades()

    // Ouvir eventos de mudança no localStorage
    const handleStorageChange = () => {
      carregarAtividades()
    }

    window.addEventListener('custom-storage-change', handleStorageChange)
    return () => {
      window.removeEventListener('custom-storage-change', handleStorageChange)
    }
  }, [isClient])

  // Funções de tradução
  const traduzirAcao = (type: ActivityType): string => {
    const traducoes: Record<ActivityType, string> = {
      created: 'Criação',
      updated: 'Atualização',
      deleted: 'Exclusão',
    }
    return traducoes[type]
  }

  const traduzirEntidade = (entity: ActivityEntity): string => {
    const traducoes: Record<ActivityEntity, string> = {
      militar: 'Militar',
      cargo: 'Cargo',
      acao: 'Ação',
      infracao: 'Infração',
      punicao: 'Punição',
      evento: 'Evento',
      webhook: 'Webhook',
      template: 'Template',
      convidado: 'Convidado',
      kanban: 'Kanban',
    }
    return traducoes[entity] || entity
  }

  const getCorAcao = (type: ActivityType): string => {
    const cores: Record<ActivityType, string> = {
      created: 'bg-green-100 text-green-700',
      updated: 'bg-blue-100 text-blue-700',
      deleted: 'bg-red-100 text-red-700',
    }
    return cores[type]
  }

  const getDetalhes = (activity: Activity): string => {
    const { type, entity, entityName, details } = activity
    
    if (details) return details

    if (type === 'created') {
      if (entity === 'cargo') {
        return `Cargo criado: ${entityName}`
      } else if (entity === 'webhook') {
        return `Webhook criado: ${entityName}`
      } else if (entity === 'template') {
        return `Template criado: ${entityName}`
      } else if (entity === 'convidado') {
        return `Convidado criado: ${entityName}`
      } else {
        return `${traduzirEntidade(entity)} criado: ${entityName}`
      }
    } else if (type === 'updated') {
      if (entity === 'cargo') {
        return `Cargo atualizado: ${entityName}`
      } else if (entity === 'convidado') {
        return `Dados do convidado atualizados: ${entityName}`
      } else {
        return `${traduzirEntidade(entity)} atualizado: ${entityName}`
      }
    } else if (type === 'deleted') {
      if (entity === 'cargo') {
        return `Cargo removido do sistema`
      } else if (entity === 'convidado') {
        return `Convidado removido: ${entityName}`
      } else {
        return `${traduzirEntidade(entity)} removido: ${entityName}`
      }
    }
    
    return `${traduzirAcao(type)} de ${traduzirEntidade(entity)}: ${entityName}`
  }

  // Filtrar atividades
  const atividadesFiltradas = activities.filter((activity) => {
    // Filtro por busca
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase()
      const matchNome = activity.entityName.toLowerCase().includes(buscaLower)
      const matchEntidade = traduzirEntidade(activity.entity).toLowerCase().includes(buscaLower)
      const matchAcao = traduzirAcao(activity.type).toLowerCase().includes(buscaLower)
      const matchDetalhes = getDetalhes(activity).toLowerCase().includes(buscaLower)
      const matchUser = activity.userName?.toLowerCase().includes(buscaLower)
      
      if (!matchNome && !matchEntidade && !matchAcao && !matchDetalhes && !matchUser) {
        return false
      }
    }

    // Filtro por ação
    if (filtroAcao !== 'all' && activity.type !== filtroAcao) {
      return false
    }

    // Filtro por entidade
    if (filtroEntidade !== 'all' && activity.entity !== filtroEntidade) {
      return false
    }

    return true
  })

  // Formatar data/hora completa
  const formatarDataHora = (activity: Activity): string => {
    const data = new Date(activity.timestamp)
    const dia = String(data.getDate()).padStart(2, '0')
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const ano = data.getFullYear()
    const horas = String(data.getHours()).padStart(2, '0')
    const minutos = String(data.getMinutes()).padStart(2, '0')
    const segundos = String(data.getSeconds()).padStart(2, '0')
    
    return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`
  }

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Logs de Auditoria</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Histórico de todas as ações realizadas no sistema</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:items-end">
          {/* Busca */}
          <div className="flex-1 min-w-0 sm:min-w-[200px]">
            <label htmlFor="busca" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar nos logs...
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="busca"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Buscar por nome, entidade, ação..."
              />
            </div>
          </div>

          {/* Filtro Ação */}
          <div className="w-full sm:w-auto sm:min-w-[180px]">
            <label htmlFor="filtroAcao" className="block text-sm font-medium text-gray-700 mb-1">
              Todas as Ações
            </label>
            <div className="relative">
              <select
                id="filtroAcao"
                value={filtroAcao}
                onChange={(e) => setFiltroAcao(e.target.value as ActivityType | 'all')}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white text-sm"
              >
                <option value="all">Todas as Ações</option>
                <option value="created">Criação</option>
                <option value="updated">Atualização</option>
                <option value="deleted">Exclusão</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filtro Entidade */}
          <div className="w-full sm:w-auto sm:min-w-[180px]">
            <label htmlFor="filtroEntidade" className="block text-sm font-medium text-gray-700 mb-1">
              Todas as Entidades
            </label>
            <div className="relative">
              <select
                id="filtroEntidade"
                value={filtroEntidade}
                onChange={(e) => setFiltroEntidade(e.target.value as ActivityEntity | 'all')}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white text-sm"
              >
                <option value="all">Todas as Entidades</option>
                <option value="militar">Militar</option>
                <option value="cargo">Cargo</option>
                <option value="acao">Ação</option>
                <option value="infracao">Infração</option>
                <option value="punicao">Punição</option>
                <option value="evento">Evento</option>
                <option value="webhook">Webhook</option>
                <option value="template">Template</option>
                <option value="convidado">Convidado</option>
                <option value="kanban">Kanban</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Logs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Registros de Auditoria</h2>
          <span className="text-sm text-gray-600">{atividadesFiltradas.length} registros</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar-horizontal pb-2">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Data/Hora
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Ação
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Entidade
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Nome
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Realizado Por
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {atividadesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                atividadesFiltradas.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="whitespace-nowrap">{formatarDataHora(activity)}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCorAcao(activity.type)}`}>
                        {traduzirAcao(activity.type)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {traduzirEntidade(activity.entity)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                      {activity.entityName}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {activity.userName || 'Sistema'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 max-w-md">
                      <div className="truncate" title={getDetalhes(activity)}>
                        {getDetalhes(activity)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
