'use client'

import { useState, useEffect } from 'react'
import ConfirmarExclusaoModal from '@/components/ConfirmarExclusaoModal'
import CriarPunicaoModal from '@/components/CriarPunicaoModal'
import { logActivity } from '@/lib/activity-log'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import { migrateLocalStorageToAPI } from '@/lib/migrate-data'

type Punicao = {
  id: string
  nome: string
  descricao: string
  pontos: number
  dataCriacao: string
  horaCriacao: string
}

export default function PunicoesPage() {
  const { isAdmin, temPermissao, user } = usePermissions()
  const [isClient, setIsClient] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [punicaoParaDeletar, setPunicaoParaDeletar] = useState<Punicao | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [punicaoParaEditar, setPunicaoParaEditar] = useState<Punicao | null>(null)
  const [busca, setBusca] = useState('')
  
  const podeVer = isAdmin || temPermissao('view_punicoes')
  const podeEditar = isAdmin || temPermissao('edit_punicoes')

  // Sincronização via API
  const { data: punicoes, refresh: refreshPunicoes } = useDataSync<Punicao>({ 
    entity: 'punicoes',
    pollingInterval: 2000
  })
  const { create: createPunicao, update: updatePunicao, remove: removePunicao } = useDataMutation<Punicao>('punicoes')

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      migrateLocalStorageToAPI()
    }
  }, [])

  // Filtrar e ordenar punições (menor para maior por pontos)
  const punicoesFiltradas = (punicoes || [])
    .filter(punicao => {
      // Filtro por busca
      if (busca.trim()) {
        const buscaLower = busca.toLowerCase()
        return (
          punicao.nome.toLowerCase().includes(buscaLower) ||
          punicao.descricao.toLowerCase().includes(buscaLower)
        )
      }

      return true
    })
    .sort((a, b) => a.pontos - b.pontos)

  const handleDelete = async () => {
    if (!punicaoParaDeletar) return

    const nomePunicao = punicaoParaDeletar.nome
    const idPunicao = punicaoParaDeletar.id

    const resultado = await removePunicao(idPunicao)
    if (resultado.ok) {
      await logActivity('deleted', 'punicao', idPunicao, nomePunicao, user?.login)
      refreshPunicoes()
    }
  }

  const handleCreatePunicao = async (dados: {
    nome: string
    descricao: string
    pontos: number
  }) => {
    const { nome, descricao, pontos } = dados
    if (pontos < 1 || pontos > 100) {
      alert('A pontuação deve estar entre 1 e 100.')
      return
    }

    const agora = new Date()
    const dataCriacao = agora.toLocaleDateString('pt-BR')
    const horaCriacao = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const novaPunicao: Punicao = {
      id: `punicao_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      nome: nome,
      descricao: descricao,
      pontos: pontos,
      dataCriacao,
      horaCriacao,
    }

    const punicaoCriada = await createPunicao(novaPunicao)
    if (punicaoCriada) {
      await logActivity('created', 'punicao', punicaoCriada.id, punicaoCriada.nome, user?.login)
      refreshPunicoes()
    }
  }

  const handleUpdatePunicao = async (dados: {
    nome: string
    descricao: string
    pontos: number
  }) => {
    if (!punicaoParaEditar) return

    if (dados.pontos < 1 || dados.pontos > 100) {
      alert('A pontuação deve estar entre 1 e 100.')
      return
    }

    const punicaoAtualizada = await updatePunicao(punicaoParaEditar.id, {
      nome: dados.nome,
      descricao: dados.descricao,
      pontos: dados.pontos,
    })

    if (punicaoAtualizada) {
      await logActivity('updated', 'punicao', punicaoParaEditar.id, dados.nome, user?.login)
      refreshPunicoes()
    }
  }

  const handleEditClick = (punicao: Punicao) => {
    setPunicaoParaEditar(punicao)
    setIsModalOpen(true)
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Punições</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Gerenciar punições/advertências do sistema</p>
        </div>
        {podeEditar && (
          <button
            onClick={() => {
              setPunicaoParaEditar(null)
              setIsModalOpen(true)
            }}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Punição
          </button>
        )}
      </div>

      {/* Card Principal */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Lista de Punições</h2>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
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
              placeholder="Buscar punição..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 text-sm"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto custom-scrollbar-horizontal">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pontos</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {punicoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Nenhuma punição cadastrada
                  </td>
                </tr>
              ) : (
                punicoesFiltradas.map((punicao) => (
                  <tr key={punicao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {punicao.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="truncate" title={punicao.descricao}>
                        {punicao.descricao}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {punicao.pontos}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        {podeEditar && (
                          <>
                            <button
                              onClick={() => handleEditClick(punicao)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setPunicaoParaDeletar(punicao)
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
          setPunicaoParaDeletar(null)
        }}
        onConfirm={handleDelete}
        itemNome={punicaoParaDeletar?.nome || ''}
        tipoItem="punição"
      />

      {/* Modal de Criar/Editar Punição */}
      {podeEditar && (
        <CriarPunicaoModal
          isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setPunicaoParaEditar(null)
        }}
        onCreate={handleCreatePunicao}
        onUpdate={handleUpdatePunicao}
        punicaoEditando={punicaoParaEditar}
        />
      )}
    </div>
  )
}
