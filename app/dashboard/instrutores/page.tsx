'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import { logActivity } from '@/lib/activity-log'
import CriarInstrutorModal, { Instrutor } from '@/components/CriarInstrutorModal'
import ConfirmarExclusaoModal from '@/components/ConfirmarExclusaoModal'

type Militar = {
  id: string
  nomeCompleto: string
  matricula?: string
  status?: 'Ativo' | 'Suspenso' | 'Exonerado'
}

type Curso = {
  id: string
  nome: string
}

function preferenciaTipoLabel(i: Instrutor): string {
  const c = !!i?.preferenciaTipo?.curso
  const r = !!i?.preferenciaTipo?.recrutamento
  if (c && r) return 'Curso e Recrutamento'
  if (c) return 'Curso'
  if (r) return 'Recrutamento'
  return '—'
}

export default function InstrutoresPage() {
  const { isAdmin, temPermissao, user } = usePermissions()
  const podeVer = isAdmin || temPermissao('view_instrutores')
  const podeEditar = isAdmin || temPermissao('edit_instrutores')

  const [isClient, setIsClient] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [instrutorEditando, setInstrutorEditando] = useState<Instrutor | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [instrutorParaExcluir, setInstrutorParaExcluir] = useState<Instrutor | null>(null)

  const { data: instrutoresData, refresh: refreshInstrutores } = useDataSync<Instrutor>({
    entity: 'instrutores',
    pollingInterval: 2000,
  })
  const { data: militaresData } = useDataSync<Militar>({ entity: 'militares', pollingInterval: 2000 })
  const { data: cursosData } = useDataSync<Curso>({ entity: 'cursos', pollingInterval: 2000 })

  const { create: createInstrutor, update: updateInstrutor, remove: removeInstrutor } =
    useDataMutation<Instrutor>('instrutores')

  useEffect(() => setIsClient(true), [])

  const militaresById = useMemo(() => {
    const map = new Map<string, Militar>()
    for (const m of militaresData || []) map.set(m.id, m)
    return map
  }, [militaresData])

  const cursosById = useMemo(() => {
    const map = new Map<string, Curso>()
    for (const c of cursosData || []) map.set(c.id, c)
    return map
  }, [cursosData])

  const instrutoresOrdenados = useMemo(() => {
    const list = (instrutoresData || []).slice()
    list.sort((a, b) => {
      const na = militaresById.get(a.militarId)?.nomeCompleto || ''
      const nb = militaresById.get(b.militarId)?.nomeCompleto || ''
      return na.localeCompare(nb)
    })
    return list
  }, [instrutoresData, militaresById])

  const totalInstrutores = instrutoresOrdenados.length
  const totalCursosPassados = instrutoresOrdenados.reduce((acc, i) => acc + (i.cursosPassados || 0), 0)
  const totalRecrutamentosFeitos = instrutoresOrdenados.reduce((acc, i) => acc + (i.recrutamentosFeitos || 0), 0)

  const handleCreate = async (dados: Omit<Instrutor, 'id'>) => {
    const novo = await createInstrutor(dados as any)
    if (!novo) return
    const nome = militaresById.get(novo.militarId)?.nomeCompleto || 'Instrutor'
    await logActivity(
      'created',
      'instrutor',
      novo.id,
      nome,
      user?.login,
      `Usuário ${user?.login || 'Sistema'} adicionou o instrutor '${nome}'.`
    )
    refreshInstrutores()
  }

  const handleUpdate = async (dados: Instrutor) => {
    const atualizado = await updateInstrutor(dados.id, dados as any)
    if (!atualizado) return
    const nome = militaresById.get(dados.militarId)?.nomeCompleto || 'Instrutor'
    await logActivity(
      'updated',
      'instrutor',
      dados.id,
      nome,
      user?.login,
      `Usuário ${user?.login || 'Sistema'} editou o instrutor '${nome}'.`
    )
    refreshInstrutores()
  }

  const handleDelete = async () => {
    if (!instrutorParaExcluir) return
    const nome = militaresById.get(instrutorParaExcluir.militarId)?.nomeCompleto || 'Instrutor'
    const r = await removeInstrutor(instrutorParaExcluir.id)
    if (r.ok) {
      await logActivity(
        'deleted',
        'instrutor',
        instrutorParaExcluir.id,
        nome,
        user?.login,
        `Usuário ${user?.login || 'Sistema'} excluiu o instrutor '${nome}'.`
      )
      refreshInstrutores()
      setInstrutorParaExcluir(null)
    } else {
      alert('error' in r ? r.error : 'Erro ao excluir instrutor. Tente novamente.')
    }
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
    <>
      <div className="space-y-6 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Instrutores</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Cadastre e gerencie instrutores a partir da lista de militares, com preferências de curso/recrutamento.
            </p>
          </div>
          {podeEditar && (
            <button
              onClick={() => {
                setInstrutorEditando(null)
                setIsModalOpen(true)
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium px-4 py-2.5 rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Instrutor
            </button>
          )}
        </div>

        {/* Cards estilo dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Instrutores Ativos</p>
                <p className="text-3xl font-bold text-gray-900">{totalInstrutores}</p>
              </div>
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cursos Passados</p>
                <p className="text-3xl font-bold text-gray-900">{totalCursosPassados}</p>
              </div>
              <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422A12.083 12.083 0 0119 15.156c0 1.657-.224 3.266-.64 4.788L12 17l-6.36 3.366A12.083 12.083 0 015 15.156c0-1.6.268-3.143.76-4.578L12 14z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Recrutamentos Feitos</p>
                <p className="text-3xl font-bold text-gray-900">{totalRecrutamentosFeitos}</p>
              </div>
              <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Instrutores</h2>
            <span className="text-sm text-gray-600">{instrutoresOrdenados.length} registros</span>
          </div>

          {instrutoresOrdenados.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-lg">Nenhum instrutor cadastrado</p>
              <p className="text-gray-400 text-sm mt-2">Use “Adicionar Instrutor” para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar-horizontal pb-2">
              <table className="w-full min-w-[950px]">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Preferência</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Cursos Preferidos</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Cursos Passados</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Recrutamentos Feitos</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Horário</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {instrutoresOrdenados.map((i) => {
                    const militar = militaresById.get(i.militarId)
                    const nome = militar?.nomeCompleto || 'Militar removido'
                    const cursosLabel = i.todosCursos
                      ? 'Todos'
                      : (i.cursosPreferidos || [])
                          .map((cid) => cursosById.get(cid)?.nome)
                          .filter(Boolean)
                          .join(', ') || '—'

                    return (
                      <tr key={i.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-900 font-medium">{nome}</td>
                        <td className="py-3 px-4 text-gray-700 text-center">{preferenciaTipoLabel(i)}</td>
                        <td className="py-3 px-4 text-gray-600 max-w-[320px] truncate" title={cursosLabel}>
                          {cursosLabel}
                        </td>
                        <td className="py-3 px-4 text-gray-900 text-center">{i.cursosPassados || 0}</td>
                        <td className="py-3 px-4 text-gray-900 text-center">{i.recrutamentosFeitos || 0}</td>
                        <td className="py-3 px-4 text-gray-600 max-w-[220px] truncate" title={i.horariosPreferidos || ''}>
                          {i.horariosPreferidos?.trim() ? i.horariosPreferidos : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {podeEditar ? (
                              <>
                                <button
                                  onClick={() => {
                                    setInstrutorEditando(i)
                                    setIsModalOpen(true)
                                  }}
                                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Editar instrutor"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    setInstrutorParaExcluir(i)
                                    setIsDeleteModalOpen(true)
                                  }}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir instrutor"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar/Editar */}
      {isModalOpen && podeEditar && (
        <CriarInstrutorModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setInstrutorEditando(null)
          }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          instrutorEditando={instrutorEditando}
          militares={(militaresData || []).map((m) => ({
            id: m.id,
            nomeCompleto: m.nomeCompleto,
            matricula: m.matricula,
            status: m.status,
          }))}
          cursos={(cursosData || []).map((c) => ({ id: c.id, nome: c.nome }))}
        />
      )}

      {/* Modal Confirmar Exclusão */}
      {isDeleteModalOpen && instrutorParaExcluir && (
        <ConfirmarExclusaoModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setInstrutorParaExcluir(null)
          }}
          onConfirm={handleDelete}
          itemNome={militaresById.get(instrutorParaExcluir.militarId)?.nomeCompleto || 'Instrutor'}
          tipoItem="instrutor"
        />
      )}
    </>
  )
}

