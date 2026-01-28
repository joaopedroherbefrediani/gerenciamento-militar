'use client'

import { useState, useEffect } from 'react'
import ConfirmarExclusaoModal from '@/components/ConfirmarExclusaoModal'
import CriarInfracaoModal from '@/components/CriarInfracaoModal'
import { logActivity } from '@/lib/activity-log'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import { migrateLocalStorageToAPI } from '@/lib/migrate-data'

type Infracao = {
  id: string
  nome: string
  descricao: string
  gravidade: 'Leve' | 'Média' | 'Grave' | 'Gravíssima'
  dataCriacao: string
  horaCriacao: string
}

export default function InfracoesPage() {
  const { isAdmin, temPermissao, user } = usePermissions()
  const [isClient, setIsClient] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [infracaoParaDeletar, setInfracaoParaDeletar] = useState<Infracao | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [infracaoParaEditar, setInfracaoParaEditar] = useState<Infracao | null>(null)
  
  const podeVer = isAdmin || temPermissao('view_infracoes')
  const podeEditar = isAdmin || temPermissao('edit_infracoes')
  const [filtrosGravidade, setFiltrosGravidade] = useState<{
    Leve: boolean
    Média: boolean
    Grave: boolean
    Gravíssima: boolean
  }>({
    Leve: true,
    Média: true,
    Grave: true,
    Gravíssima: true,
  })
  const [busca, setBusca] = useState('')

  // Sincronização via API
  const { data: infracoes, refresh: refreshInfracoes } = useDataSync<Infracao>({ 
    entity: 'infracoes',
    pollingInterval: 2000
  })
  const { create: createInfracao, update: updateInfracao, remove: removeInfracao } = useDataMutation<Infracao>('infracoes')

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      migrateLocalStorageToAPI()
    }
  }, [])

  // Verificar se algum filtro está habilitado
  const algumFiltroHabilitado = Object.values(filtrosGravidade).some(habilitado => habilitado)

  // Filtrar infrações
  const infracoesFiltradas = (infracoes || []).filter(infracao => {
    // Se houver busca ativa, ignora os filtros de gravidade
    if (busca.trim() !== '') {
      const buscaLower = busca.toLowerCase()
      return (
        infracao.nome.toLowerCase().includes(buscaLower) ||
        infracao.descricao.toLowerCase().includes(buscaLower)
      )
    }

    // Se não houver busca, aplica os filtros de gravidade
    if (!algumFiltroHabilitado) {
      return false
    }

    const gravidadesSelecionadas = Object.entries(filtrosGravidade)
      .filter(([_, selecionado]) => selecionado)
      .map(([gravidade, _]) => gravidade)

    if (gravidadesSelecionadas.length > 0 && !gravidadesSelecionadas.includes(infracao.gravidade)) {
      return false
    }

    return true
  })

  const handleDelete = async () => {
    if (!infracaoParaDeletar) return

    const nomeInfracao = infracaoParaDeletar.nome
    const idInfracao = infracaoParaDeletar.id

    const resultado = await removeInfracao(idInfracao)
    if (resultado.ok) {
      await logActivity('deleted', 'infracao', idInfracao, nomeInfracao, user?.login)
      refreshInfracoes()
    }
  }

  const handleCreateInfracao = async (dados: {
    nome: string
    descricao: string
    gravidade: 'Leve' | 'Média' | 'Grave' | 'Gravíssima'
  }) => {
    const agora = new Date()
    const dataCriacao = agora.toLocaleDateString('pt-BR')
    const horaCriacao = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const novaInfracao: Infracao = {
      id: `infracao_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      nome: dados.nome,
      descricao: dados.descricao,
      gravidade: dados.gravidade,
      dataCriacao,
      horaCriacao,
    }

    const infracaoCriada = await createInfracao(novaInfracao)
    if (infracaoCriada) {
      await logActivity('created', 'infracao', infracaoCriada.id, infracaoCriada.nome, user?.login)
      refreshInfracoes()
    }
  }

  const handleUpdateInfracao = async (dados: {
    nome: string
    descricao: string
    gravidade: 'Leve' | 'Média' | 'Grave' | 'Gravíssima'
  }) => {
    if (!infracaoParaEditar) return

    const infracaoAtualizada = await updateInfracao(infracaoParaEditar.id, {
      nome: dados.nome,
      descricao: dados.descricao,
      gravidade: dados.gravidade,
    })

    if (infracaoAtualizada) {
      await logActivity('updated', 'infracao', infracaoParaEditar.id, dados.nome, user?.login)
      refreshInfracoes()
    }
  }

  const handleEditClick = (infracao: Infracao) => {
    setInfracaoParaEditar(infracao)
    setIsModalOpen(true)
  }

  const toggleFiltroGravidade = (gravidade: 'Leve' | 'Média' | 'Grave' | 'Gravíssima') => {
    setFiltrosGravidade(prev => ({
      ...prev,
      [gravidade]: !prev[gravidade],
    }))
  }

  const getGravidadeColor = (gravidade: string) => {
    switch (gravidade) {
      case 'Leve':
        return 'bg-yellow-100 text-yellow-800'
      case 'Média':
        return 'bg-orange-100 text-orange-800'
      case 'Grave':
        return 'bg-red-100 text-red-800'
      case 'Gravíssima':
        return 'bg-purple-100 text-purple-800'
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
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Infrações</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Gerenciar infrações do sistema</p>
        </div>
        {podeEditar && (
          <button
            onClick={() => {
              setInfracaoParaEditar(null)
              setIsModalOpen(true)
            }}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Infração
          </button>
        )}
      </div>

      {/* Card Principal */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Lista de Infrações</h2>

        {/* Busca e Filtros */}
        <div className="space-y-4 mb-6">
          {/* Busca - Em cima no mobile */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-1 relative">
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
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar infração..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 text-sm"
              />
            </div>
          </div>

          {/* Filtros por Gravidade */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Gravidade:</span>
            </div>
            {(['Leve', 'Média', 'Grave', 'Gravíssima'] as const).map((gravidade) => (
              <label key={gravidade} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtrosGravidade[gravidade]}
                  onChange={() => toggleFiltroGravidade(gravidade)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">{gravidade}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto custom-scrollbar-horizontal">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Gravidade</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(infracoes || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Nenhuma infração cadastrada
                  </td>
                </tr>
              ) : infracoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-gray-500 text-lg mb-2">
                      {busca.trim() === '' && !algumFiltroHabilitado
                        ? 'Existem infrações cadastradas, mas nenhum filtro está habilitado'
                        : busca.trim() !== ''
                        ? 'Nenhuma infração encontrada com esse termo'
                        : 'Nenhuma infração encontrada com os filtros selecionados'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {busca.trim() === '' && !algumFiltroHabilitado
                        ? 'Habilite pelo menos um filtro de gravidade para visualizar as infrações'
                        : busca.trim() !== ''
                        ? 'Tente buscar com outro termo'
                        : 'Tente ajustar os filtros ou a busca'}
                    </p>
                  </td>
                </tr>
              ) : (
                infracoesFiltradas.map((infracao) => (
                  <tr key={infracao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {infracao.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="truncate" title={infracao.descricao}>
                        {infracao.descricao}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getGravidadeColor(infracao.gravidade)}`}>
                        {infracao.gravidade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        {podeEditar && (
                          <>
                            <button
                              onClick={() => handleEditClick(infracao)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setInfracaoParaDeletar(infracao)
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
          setInfracaoParaDeletar(null)
        }}
        onConfirm={handleDelete}
        itemNome={infracaoParaDeletar?.nome || ''}
        tipoItem="infração"
      />

      {/* Modal de Criar/Editar Infração */}
      {podeEditar && (
        <CriarInfracaoModal
          isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setInfracaoParaEditar(null)
        }}
        onCreate={handleCreateInfracao}
        onUpdate={handleUpdateInfracao}
        infracaoEditando={infracaoParaEditar}
        />
      )}
    </div>
  )
}
