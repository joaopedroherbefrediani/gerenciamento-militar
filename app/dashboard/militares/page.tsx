'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CriarMilitarModal from '@/components/CriarMilitarModal'
import ConfirmarExclusaoModal from '@/components/ConfirmarExclusaoModal'
import { logActivity } from '@/lib/activity-log'
import { usePermissions } from '@/hooks/usePermissions'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import { migrateLocalStorageToAPI } from '@/lib/migrate-data'

function formatIsoToBr(iso?: string): string {
  if (!iso) return '-'
  const [yyyy, mm, dd] = iso.split('-')
  if (!yyyy || !mm || !dd) return iso
  return `${dd}/${mm}/${yyyy}`
}

type Militar = {
  id: string
  nomeCompleto: string
  cargo: string
  cargoNome?: string
  matricula?: string
  discordId?: string
  dataAdmissao: string
  status: 'Ativo' | 'Suspenso' | 'Exonerado'
  observacoes?: string
}

type Cargo = {
  id: string
  nome: string
  nivel?: number
}

export default function MilitaresPage() {
  const router = useRouter()
  const { isAdmin, temPermissao, user } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [militarParaDeletar, setMilitarParaDeletar] = useState<Militar | null>(null)
  const [militarParaEditar, setMilitarParaEditar] = useState<Militar | null>(null)
  const [militares, setMilitares] = useState<Militar[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [isClient, setIsClient] = useState(false)
  
  const podeVer = isAdmin || temPermissao('view_militares')
  const podeEditar = isAdmin || temPermissao('edit_militares')

  // Sincronização de dados via API
  const { data: militaresData, refresh: refreshMilitares } = useDataSync<Militar>({ 
    entity: 'militares',
    pollingInterval: 2000
  })
  const { data: cargosData, refresh: refreshCargos } = useDataSync<any>({ 
    entity: 'cargos',
    pollingInterval: 2000
  })
  const { data: eventosData } = useDataSync<any>({ entity: 'eventos' })
  const { create: createMilitar, update: updateMilitar, remove: removeMilitar } = useDataMutation<Militar>('militares')

  // Verificar se está no cliente e migrar dados
  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      migrateLocalStorageToAPI()
    }
  }, [])

  // Atualizar estados quando dados da API mudarem
  useEffect(() => {
    if (militaresData) {
      setMilitares(militaresData)
    }
  }, [militaresData])

  useEffect(() => {
    if (cargosData) {
      setCargos(cargosData.map((c: any) => ({ id: c.id, nome: c.nome, nivel: c.nivel })))
    }
  }, [cargosData])

  // Verificar suspensões expiradas
  useEffect(() => {
    if (!eventosData || !militaresData || militaresData.length === 0) return

    const verificarSuspensoesExpiradas = async () => {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      let precisaAtualizar = false
      const militaresAtualizados = militaresData.map((militar: Militar) => {
        if (militar.status === 'Suspenso') {
          const suspensoes = eventosData
            .filter((e: any) => 
              e.militarId === militar.id && 
              e.tipoEvento === 'Suspensão' && 
              e.dataFinal
            )
            .sort((a: any, b: any) => {
              const dataA = new Date(a.dataFinal)
              const dataB = new Date(b.dataFinal)
              return dataB.getTime() - dataA.getTime()
            })
          
          if (suspensoes.length > 0) {
            const suspensaoMaisRecente = suspensoes[0]
            if (suspensaoMaisRecente.dataFinal) {
              try {
                const dataFinal = new Date(suspensaoMaisRecente.dataFinal)
                if (!isNaN(dataFinal.getTime())) {
                  dataFinal.setHours(0, 0, 0, 0)
                  
                  if (dataFinal < hoje) {
                    precisaAtualizar = true
                    return {
                      ...militar,
                      status: 'Ativo' as const,
                    }
                  }
                }
              } catch (error) {
                console.error('Erro ao processar data final da suspensão:', error)
              }
            }
          }
        }
        return militar
      })
      
      if (precisaAtualizar) {
        // Atualizar via API
        for (const militar of militaresAtualizados) {
          if (militar.status === 'Ativo' && militaresData.find((m: Militar) => m.id === militar.id)?.status === 'Suspenso') {
            await updateMilitar(militar.id, { status: 'Ativo' })
          }
        }
        refreshMilitares()
      }
    }

    const interval = setInterval(verificarSuspensoesExpiradas, 60000)
    verificarSuspensoesExpiradas() // Executar imediatamente

    return () => clearInterval(interval)
  }, [eventosData, militaresData, updateMilitar, refreshMilitares])
  
  // Estados para filtros
  const [busca, setBusca] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState(true)
  const [filtroSuspenso, setFiltroSuspenso] = useState(true)
  const [filtroExonerado, setFiltroExonerado] = useState(true)
  const [ordenacao, setOrdenacao] = useState<'nome' | 'matricula' | 'hierarquia' | 'dataAdmissao'>('nome')

  // Função para filtrar militares
  const militaresFiltrados = militares.filter((militar) => {
    // Filtro por busca (nome ou matrícula)
    const matchBusca = busca.trim() === '' || 
      militar.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
      (militar.matricula && militar.matricula.toLowerCase().includes(busca.toLowerCase()))

    // Se houver busca ativa, ignora os filtros de status
    if (busca.trim() !== '') {
      return matchBusca
    }

    // Se não houver busca, aplica os filtros de status
    let matchStatus = false
    if (militar.status === 'Ativo' && filtroAtivo) matchStatus = true
    if (militar.status === 'Suspenso' && filtroSuspenso) matchStatus = true
    if (militar.status === 'Exonerado' && filtroExonerado) matchStatus = true

    return matchBusca && matchStatus
  })

  // Função para ordenar
  const militaresOrdenados = [...militaresFiltrados].sort((a, b) => {
    if (ordenacao === 'nome') return a.nomeCompleto.localeCompare(b.nomeCompleto)
    if (ordenacao === 'matricula') {
      const matA = a.matricula || ''
      const matB = b.matricula || ''
      return matA.localeCompare(matB)
    }
    if (ordenacao === 'hierarquia') {
      const nivelA = cargos.find((c) => c.id === a.cargo)?.nivel ?? 0
      const nivelB = cargos.find((c) => c.id === b.cargo)?.nivel ?? 0
      if (nivelA !== nivelB) return nivelB - nivelA // maior hierarquia primeiro
      return a.nomeCompleto.localeCompare(b.nomeCompleto)
    }
    // dataAdmissao (ISO): mais recente primeiro
    const da = a.dataAdmissao || ''
    const db = b.dataAdmissao || ''
    if (da !== db) return db.localeCompare(da)
    return a.nomeCompleto.localeCompare(b.nomeCompleto)
  })

  const handleCreateMilitar = async (data: {
    nomeCompleto: string
    cargo: string
    matricula?: string
    discordId?: string
    dataAdmissao: string // ISO (YYYY-MM-DD)
    status: 'Ativo' | 'Suspenso' | 'Exonerado'
    observacoes?: string
  }) => {
    const cargoSelecionado = cargos.find(c => c.id === data.cargo)
    const novoMilitar = {
      nomeCompleto: data.nomeCompleto,
      cargo: data.cargo,
      cargoNome: cargoSelecionado?.nome,
      matricula: data.matricula,
      discordId: data.discordId,
      dataAdmissao: data.dataAdmissao,
      status: data.status as 'Ativo' | 'Suspenso' | 'Exonerado',
      observacoes: data.observacoes,
    }
    
    const resultado = await createMilitar(novoMilitar)
    if (resultado) {
      await logActivity('created', 'militar', resultado.id, resultado.nomeCompleto, user?.login)
      // Forçar refresh de militares e cargos após criar
      refreshMilitares()
      refreshCargos()
    }
  }

  const handleUpdateMilitar = async (data: {
    nomeCompleto: string
    cargo: string
    matricula?: string
    discordId?: string
    dataAdmissao: string // ISO (YYYY-MM-DD)
    status: 'Ativo' | 'Suspenso' | 'Exonerado'
    observacoes?: string
  }) => {
    if (!militarParaEditar) return
    const cargoSelecionado = cargos.find(c => c.id === data.cargo)
    
    const dadosAtualizados = {
      nomeCompleto: data.nomeCompleto,
      cargo: data.cargo,
      cargoNome: cargoSelecionado?.nome,
      matricula: data.matricula,
      discordId: data.discordId,
      dataAdmissao: data.dataAdmissao,
      status: data.status,
      observacoes: data.observacoes,
    }
    
    const resultado = await updateMilitar(militarParaEditar.id, dadosAtualizados)
    if (resultado) {
      await logActivity('updated', 'militar', militarParaEditar.id, data.nomeCompleto, user?.login)
      refreshMilitares()
      setMilitarParaEditar(null)
    }
  }

  const handleDeleteMilitar = async () => {
    if (!militarParaDeletar) return
    const nomeMilitar = militarParaDeletar.nomeCompleto
    const idMilitar = militarParaDeletar.id
    const r = await removeMilitar(idMilitar)
    if (r.ok) {
      await logActivity('deleted', 'militar', idMilitar, nomeMilitar, user?.login)
      refreshMilitares()
      setMilitarParaDeletar(null)
    } else {
      alert('error' in r ? r.error : 'Erro ao excluir militar. Tente novamente.')
    }
  }

  const handleDeleteClick = (militar: Militar) => {
    setMilitarParaDeletar(militar)
    setIsDeleteModalOpen(true)
  }

  const handleEditClick = (militar: Militar) => {
    setMilitarParaEditar(militar)
    refreshCargos()
    setIsModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-100 text-green-800'
      case 'Suspenso':
        return 'bg-yellow-100 text-yellow-800'
      case 'Exonerado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <>
      <div className="space-y-6 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Militares
            </h1>
            <p className="text-gray-600 text-sm">
              Gerenciar membros da organização
            </p>
          </div>
          {podeEditar && (
            <button
              onClick={() => {
                setMilitarParaEditar(null)
                refreshCargos()
                setIsModalOpen(true)
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium px-4 py-2.5 rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Militar
            </button>
          )}
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="space-y-4">
            {/* Título e controles superiores */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Lista de Militares
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                {/* Busca */}
                <div className="relative flex-1 sm:flex-initial">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por nome ou matrícula..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 text-sm"
                  />
                </div>

                {/* Ordenação */}
                <div className="relative flex-1 sm:flex-initial">
                  <select
                    value={ordenacao}
                    onChange={(e) =>
                      setOrdenacao(
                        e.target.value as 'nome' | 'matricula' | 'hierarquia' | 'dataAdmissao'
                      )
                    }
                    className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-8 text-sm"
                  >
                    <option value="nome">Nome</option>
                    <option value="matricula">Matrícula</option>
                    <option value="hierarquia">Hierarquia</option>
                    <option value="dataAdmissao">Data de Admissão</option>
                  </select>
                  <svg
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtros de Status */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Status:</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtroAtivo}
                  onChange={(e) => setFiltroAtivo(e.target.checked)}
                  className="w-4 h-4 focus:ring-green-500 focus:ring-2 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">Ativo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtroSuspenso}
                  onChange={(e) => setFiltroSuspenso(e.target.checked)}
                  className="w-4 h-4 focus:ring-green-500 focus:ring-2 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">Suspenso</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtroExonerado}
                  onChange={(e) => setFiltroExonerado(e.target.checked)}
                  className="w-4 h-4 focus:ring-green-500 focus:ring-2 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">Exonerado</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tabela de Militares */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          {militares.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-lg">
                Nenhum militar cadastrado
              </p>
            </div>
          ) : militaresOrdenados.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-lg mb-2">
                {busca.trim() === '' && !filtroAtivo && !filtroSuspenso && !filtroExonerado
                  ? 'Existem militares cadastrados, mas nenhum filtro está habilitado'
                  : busca.trim() !== ''
                    ? 'Nenhum militar encontrado com esse termo'
                    : 'Nenhum militar encontrado'}
              </p>
              <p className="text-gray-400 text-sm">
                {busca.trim() === '' && !filtroAtivo && !filtroSuspenso && !filtroExonerado
                  ? 'Habilite pelo menos um filtro de status para visualizar os militares'
                  : busca.trim() !== ''
                    ? 'Tente buscar com outro termo'
                    : 'Tente ajustar os filtros ou a busca'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar-horizontal">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Matrícula</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Cargo</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Data Admissão</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {militaresOrdenados.map((militar) => (
                    <tr key={militar.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-900">{militar.nomeCompleto}</td>
                      <td className="py-3 px-4 text-gray-600 text-center">{militar.matricula || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{militar.cargoNome || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(militar.status)}`}>
                          {militar.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-center">{formatIsoToBr(militar.dataAdmissao)}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/militares/${militar.id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {podeEditar && (
                            <>
                              <button
                                onClick={() => handleEditClick(militar)}
                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Editar militar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(militar)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir militar"
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar Militar */}
      {isModalOpen && podeEditar && (
        <CriarMilitarModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setMilitarParaEditar(null)
          }}
          onCreate={handleCreateMilitar}
          onUpdate={handleUpdateMilitar}
          militarEditando={
            militarParaEditar
              ? {
                  id: militarParaEditar.id,
                  nomeCompleto: militarParaEditar.nomeCompleto,
                  cargo: militarParaEditar.cargo,
                  matricula: militarParaEditar.matricula,
                  discordId: militarParaEditar.discordId,
                  dataAdmissao: militarParaEditar.dataAdmissao,
                  status: militarParaEditar.status,
                  observacoes: militarParaEditar.observacoes,
                }
              : null
          }
          cargos={cargos}
        />
      )}

      {/* Modal Confirmar Exclusão */}
      {isDeleteModalOpen && militarParaDeletar && (
        <ConfirmarExclusaoModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setMilitarParaDeletar(null)
          }}
          onConfirm={handleDeleteMilitar}
          cargoNome={militarParaDeletar.nomeCompleto}
        />
      )}
    </>
  )
}
