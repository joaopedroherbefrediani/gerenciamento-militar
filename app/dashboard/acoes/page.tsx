'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmarExclusaoModal from '@/components/ConfirmarExclusaoModal'
import CriarAcaoModal from '@/components/CriarAcaoModal'
import { logActivity } from '@/lib/activity-log'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'

type Militar = {
  id: string
  nomeCompleto: string
  cargo?: string
  cargoNome?: string
}

type Acao = {
  id: string
  militarId: string
  militarNome?: string
  tipo: 'Prisão' | 'Curso' | 'Patrulha' | 'Operação'
  titulo: string
  alvoLocal: string
  data: string // YYYY-MM-DD
  quantidadeHoras?: string
  descricao?: string
  dataCriacao: string
  horaCriacao: string
}

function formatarData(dataIso: string): string {
  if (!dataIso) return '-'
  try {
    const [yyyy, mm, dd] = dataIso.split('-')
    if (!yyyy || !mm || !dd) return dataIso
    return `${dd}/${mm}/${yyyy}`
  } catch {
    return dataIso
  }
}

export default function AcoesPage() {
  const router = useRouter()
  const { isAdmin, temPermissao, user } = usePermissions()
  const [isClient, setIsClient] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [acaoParaDeletar, setAcaoParaDeletar] = useState<Acao | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [acaoParaEditar, setAcaoParaEditar] = useState<Acao | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('Todas')
  
  const podeVer = isAdmin || temPermissao('view_acoes')
  const podeEditar = isAdmin || temPermissao('edit_acoes')
  const [filtroMilitar, setFiltroMilitar] = useState<string>('Todos')
  const [ordenacao, setOrdenacao] = useState<'data' | 'titulo' | 'militar'>('data')

  // Sincronização via API
  const { data: acoes, refresh: refreshAcoes } = useDataSync<Acao>({ 
    entity: 'acoes',
    pollingInterval: 2000
  })
  const { data: militaresData } = useDataSync<Militar>({ 
    entity: 'militares',
    pollingInterval: 2000
  })
  const { create: createAcao, update: updateAcao, remove: removeAcao } = useDataMutation<Acao>('acoes')

  const militares = militaresData?.map((m: any) => ({
    id: m.id,
    nomeCompleto: m.nomeCompleto,
    cargo: m.cargo,
    cargoNome: m.cargoNome,
  })) || []

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Filtrar e ordenar ações
  const acoesFiltradas = (acoes || [])
    .filter(acao => {
      if (filtroTipo !== 'Todas' && acao.tipo !== filtroTipo) return false
      if (filtroMilitar !== 'Todos' && acao.militarId !== filtroMilitar) return false
      return true
    })
    .sort((a, b) => {
      switch (ordenacao) {
        case 'data':
          return new Date(b.data).getTime() - new Date(a.data).getTime()
        case 'titulo':
          return a.titulo.localeCompare(b.titulo)
        case 'militar':
          return (a.militarNome || '').localeCompare(b.militarNome || '')
        default:
          return 0
      }
    })

  // Contadores por tipo
  const contadores = {
    Prisões: (acoes || []).filter(a => a.tipo === 'Prisão').length,
    Cursos: (acoes || []).filter(a => a.tipo === 'Curso').length,
    Patrulhas: (acoes || []).filter(a => a.tipo === 'Patrulha').length,
    Operações: (acoes || []).filter(a => a.tipo === 'Operação').length,
  }

  const handleDelete = async () => {
    if (!acaoParaDeletar) return

    const tituloAcao = acaoParaDeletar.titulo
    const idAcao = acaoParaDeletar.id

    const resultado = await removeAcao(idAcao)
    if (resultado.ok) {
      logActivity('deleted', 'acao', idAcao, tituloAcao, user?.login)
      refreshAcoes()
    }
  }

  const handleCreateAcao = async (dados: {
    militarId: string
    tipo: 'Prisão' | 'Curso' | 'Patrulha' | 'Operação'
    titulo: string
    alvoLocal: string
    data: string
    quantidadeHoras?: string
    descricao?: string
  }) => {
    const militar = militares.find(m => m.id === dados.militarId)
    const agora = new Date()
    const dataCriacao = agora.toLocaleDateString('pt-BR')
    const horaCriacao = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const novaAcao: Acao = {
      id: `acao_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      militarId: dados.militarId,
      militarNome: militar?.nomeCompleto,
      tipo: dados.tipo,
      titulo: dados.titulo,
      alvoLocal: dados.alvoLocal,
      data: dados.data,
      quantidadeHoras: dados.quantidadeHoras,
      descricao: dados.descricao,
      dataCriacao,
      horaCriacao,
    }

    const acaoCriada = await createAcao(novaAcao)
    if (acaoCriada) {
      logActivity('created', 'acao', acaoCriada.id, acaoCriada.titulo, user?.login)
      refreshAcoes()
    }
  }

  const handleUpdateAcao = async (dados: {
    militarId: string
    tipo: 'Prisão' | 'Curso' | 'Patrulha' | 'Operação'
    titulo: string
    alvoLocal: string
    data: string
    quantidadeHoras?: string
    descricao?: string
  }) => {
    if (!acaoParaEditar) return

    const militar = militares.find(m => m.id === dados.militarId)

    const acaoAtualizada = await updateAcao(acaoParaEditar.id, {
      militarId: dados.militarId,
      militarNome: militar?.nomeCompleto,
      tipo: dados.tipo,
      titulo: dados.titulo,
      alvoLocal: dados.alvoLocal,
      data: dados.data,
      quantidadeHoras: dados.quantidadeHoras,
      descricao: dados.descricao,
    })

    if (acaoAtualizada) {
      logActivity('updated', 'acao', acaoParaEditar.id, dados.titulo, user?.login)
      refreshAcoes()
    }
  }

  const handleEditClick = (acao: Acao) => {
    setAcaoParaEditar(acao)
    setIsModalOpen(true)
  }

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ações Operacionais</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Registro de atividades operacionais</p>
        </div>
        {podeEditar && (
          <button
            onClick={() => {
              setAcaoParaEditar(null)
              setIsModalOpen(true)
            }}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registrar Ação
          </button>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Prisões */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm font-medium text-gray-600">Prisões</h3>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{contadores.Prisões}</p>
        </div>

        {/* Cursos */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm font-medium text-gray-600">Cursos</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{contadores.Cursos}</p>
        </div>

        {/* Patrulhas */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm font-medium text-gray-600">Patrulhas</h3>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{contadores.Patrulhas}</p>
        </div>

        {/* Operações */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm font-medium text-gray-600">Operações</h3>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{contadores.Operações}</p>
        </div>
      </div>

      {/* Histórico de Ações */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Histórico de Ações</h2>
        </div>

        {/* Filtros e Ordenação */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-wrap">
            {/* Filtro Tipo */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10 bg-white text-sm"
                >
                  <option value="Todas">Todas as Ações</option>
                  <option value="Prisão">Prisões</option>
                  <option value="Curso">Cursos</option>
                  <option value="Patrulha">Patrulhas</option>
                  <option value="Operação">Operações</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Filtro Militar */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={filtroMilitar}
                  onChange={(e) => setFiltroMilitar(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10 bg-white text-sm"
                >
                  <option value="Todos">Todos os militares</option>
                  {militares.map((militar) => (
                    <option key={militar.id} value={militar.id}>
                      {militar.nomeCompleto}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Ordenação - Centralizado no mobile */}
            <div className="flex items-center gap-2 sm:ml-auto justify-center sm:justify-start flex-1 sm:flex-initial">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value as 'data' | 'titulo' | 'militar')}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10 bg-white text-sm"
                >
                  <option value="data">Data</option>
                  <option value="titulo">Título</option>
                  <option value="militar">Militar</option>
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto custom-scrollbar-horizontal">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Militar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alvo/Local</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {acoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhuma ação registrada
                  </td>
                </tr>
              ) : (
                acoesFiltradas.map((acao) => (
                  <tr key={acao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {acao.militarNome || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        acao.tipo === 'Prisão' ? 'bg-red-100 text-red-800' :
                        acao.tipo === 'Curso' ? 'bg-blue-100 text-blue-800' :
                        acao.tipo === 'Patrulha' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {acao.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{acao.titulo}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{acao.alvoLocal}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatarData(acao.data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/acoes/${acao.id}`)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {podeEditar && (
                          <>
                            <button
                              onClick={() => handleEditClick(acao)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setAcaoParaDeletar(acao)
                                setIsDeleteModalOpen(true)
                              }}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmarExclusaoModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setAcaoParaDeletar(null)
        }}
        onConfirm={handleDelete}
        itemNome={acaoParaDeletar?.titulo || ''}
        tipoItem="ação"
      />

      {/* Modal de Criar/Editar Ação */}
      {podeEditar && (
        <CriarAcaoModal
          isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setAcaoParaEditar(null)
        }}
        onCreate={handleCreateAcao}
        onUpdate={handleUpdateAcao}
        acaoEditando={acaoParaEditar}
        militares={militares}
        />
      )}
    </div>
  )
}
