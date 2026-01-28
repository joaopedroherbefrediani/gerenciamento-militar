'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import { logActivity } from '@/lib/activity-log'
import CriarCursoModal, { Curso, CursoImportancia } from '@/components/CriarCursoModal'
import ConfirmarExclusaoCursoModal from '@/components/ConfirmarExclusaoCursoModal'
import AnexarMaterialCursoModal from '@/components/AnexarMaterialCursoModal'

type CursoMaterial = {
  id: string
  courseId: string
  fileName: string
  originalName: string
  uploadedAt?: number
}

export default function CursosPage() {
  const { isAdmin, temPermissao, user } = usePermissions()
  const podeVer = isAdmin || temPermissao('view_cursos')
  const podeEditar = isAdmin || temPermissao('edit_cursos')

  const [isClient, setIsClient] = useState(false)
  const [isCriarModalOpen, setIsCriarModalOpen] = useState(false)
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false)
  const [isAnexarModalOpen, setIsAnexarModalOpen] = useState(false)
  const [cursoEditando, setCursoEditando] = useState<Curso | null>(null)
  const [cursoParaExcluir, setCursoParaExcluir] = useState<Curso | null>(null)

  const { data: cursosRaw, refresh: refreshCursos } = useDataSync<Curso>({ entity: 'cursos', pollingInterval: 2000 })
  const { data: materiaisRaw, refresh: refreshMateriais } = useDataSync<CursoMaterial>({
    entity: 'cursos-materiais',
    pollingInterval: 2000,
  })
  const { create: createCurso, update: updateCurso, remove: removeCurso } = useDataMutation<Curso>('cursos')

  useEffect(() => setIsClient(true), [])

  const cursos = useMemo(() => (cursosRaw || []).slice().sort((a, b) => a.nome.localeCompare(b.nome)), [cursosRaw])

  const cursoNomeById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of cursos) map.set(c.id, c.nome)
    return map
  }, [cursos])

  const materiais = useMemo(() => {
    const list = (materiaisRaw || []).slice()
    list.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0))
    return list
  }, [materiaisRaw])

  const importanciaLabel = (v: CursoImportancia) => (v === 'Basico' ? 'Básico' : 'Adicional')

  const handleCreateCurso = async (dados: { nome: string; importancia: CursoImportancia }) => {
    const novo = await createCurso(dados)
    if (!novo) return
    await logActivity(
      'created',
      'curso',
      novo.id,
      novo.nome,
      user?.login,
      `Usuário ${user?.login || 'Sistema'} criou o curso '${novo.nome}'.`
    )
    refreshCursos()
  }

  const handleUpdateCurso = async (dados: { id: string; nome: string; importancia: CursoImportancia }) => {
    const atualizado = await updateCurso(dados.id, dados as any)
    if (!atualizado) return
    await logActivity(
      'updated',
      'curso',
      dados.id,
      dados.nome,
      user?.login,
      `Usuário ${user?.login || 'Sistema'} editou o curso '${dados.nome}'.`
    )
    refreshCursos()
  }

  const handleDeleteCurso = async () => {
    if (!cursoParaExcluir) return
    const r = await removeCurso(cursoParaExcluir.id)
    if (r.ok) {
      await logActivity(
        'deleted',
        'curso',
        cursoParaExcluir.id,
        cursoParaExcluir.nome,
        user?.login,
        `Usuário ${user?.login || 'Sistema'} excluiu o curso '${cursoParaExcluir.nome}'.`
      )
      refreshCursos()
      refreshMateriais()
      setIsExcluirModalOpen(false)
      setCursoParaExcluir(null)
    }
  }

  const handleUploadMaterial = async (courseId: string, file: File) => {
    const form = new FormData()
    form.append('courseId', courseId)
    form.append('file', file)

    const res = await fetch('/api/data/cursos-materiais', {
      method: 'POST',
      body: form,
    })
    const j = await res.json().catch(() => null)
    if (!res.ok || !j?.success) {
      alert(j?.error || 'Erro ao anexar material.')
      return
    }

    const cursoNome = cursoNomeById.get(courseId) || 'Curso'
    await logActivity(
      'created',
      'curso_material',
      j.data?.id || `mat_${Date.now()}`,
      file.name,
      user?.login,
      `Usuário ${user?.login || 'Sistema'} anexou o material '${file.name}' ao curso '${cursoNome}'.`
    )
    refreshMateriais()
  }

  const handleDeleteMaterial = async (material: CursoMaterial) => {
    const ok = confirm('Tem certeza que deseja deletar este material?')
    if (!ok) return
    const res = await fetch(`/api/data/cursos-materiais?id=${encodeURIComponent(material.id)}`, { method: 'DELETE' })
    const j = await res.json().catch(() => null)
    if (!res.ok || !j?.success) {
      alert(j?.error || 'Erro ao deletar material.')
      return
    }
    const cursoNome = cursoNomeById.get(material.courseId) || 'Curso'
    await logActivity(
      'deleted',
      'curso_material',
      material.id,
      material.originalName,
      user?.login,
      `Usuário ${user?.login || 'Sistema'} deletou o material '${material.originalName}' do curso '${cursoNome}'.`
    )
    refreshMateriais()
  }

  if (!isClient) return null

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciamento de Cursos</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Crie, edite e organize cursos, além de anexar materiais em PDF para download.
          </p>
        </div>

        {podeEditar && (
          <button
            onClick={() => {
              setCursoEditando(null)
              setIsCriarModalOpen(true)
            }}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Criar Curso
          </button>
        )}
      </div>

      {/* Botão Anexar Material (abaixo do cabeçalho) */}
      {podeEditar && (
        <div>
          <button
            onClick={() => setIsAnexarModalOpen(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
            </svg>
            Anexar Material
          </button>
        </div>
      )}

      {/* Lista de Cursos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Cursos</h2>
          <p className="text-sm text-gray-600 mt-1">Lista de cursos cadastrados e sua importância.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nome do Curso
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Importância
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cursos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-center text-gray-500">
                    Nenhum curso cadastrado.
                  </td>
                </tr>
              ) : (
                cursos.map((curso) => (
                  <tr key={curso.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{curso.nome}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">{importanciaLabel(curso.importancia)}</td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        {podeEditar ? (
                          <>
                            <button
                              onClick={() => {
                                setCursoEditando(curso)
                                setIsCriarModalOpen(true)
                              }}
                              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setCursoParaExcluir(curso)
                                setIsExcluirModalOpen(true)
                              }}
                              className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
                            >
                              Excluir
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
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

      {/* Materiais */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Materiais para Download</h2>
          <p className="text-sm text-gray-600 mt-1">Arquivos PDF anexados aos cursos.</p>
        </div>

        <div className="p-4 sm:p-6">
          {materiais.length === 0 ? (
            <div className="text-gray-500 text-sm">Nenhum material anexado.</div>
          ) : (
            <div className="space-y-3">
              {materiais.map((m) => {
                const cursoNome = cursoNomeById.get(m.courseId) || 'Curso removido'
                const href = `/cursos-materials/${m.fileName}`
                return (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="shrink-0">
                        <svg className="w-9 h-9 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm1 7V3.5L19.5 9H15z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{m.originalName}</div>
                        <div className="text-xs text-gray-600 truncate">Curso: {cursoNome}</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                      <a
                        href={href}
                        download
                        className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                      >
                        Baixar
                      </a>
                      {podeEditar && (
                        <button
                          onClick={() => handleDeleteMaterial(m)}
                          className="inline-flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                        >
                          Deletar Material
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      {isCriarModalOpen && podeEditar && (
        <CriarCursoModal
          isOpen={isCriarModalOpen}
          onClose={() => setIsCriarModalOpen(false)}
          onCreate={handleCreateCurso}
          onUpdate={handleUpdateCurso}
          cursoEditando={cursoEditando}
        />
      )}

      {isExcluirModalOpen && cursoParaExcluir && podeEditar && (
        <ConfirmarExclusaoCursoModal
          isOpen={isExcluirModalOpen}
          onClose={() => {
            setIsExcluirModalOpen(false)
            setCursoParaExcluir(null)
          }}
          onConfirm={handleDeleteCurso}
          cursoNome={cursoParaExcluir.nome}
        />
      )}

      {isAnexarModalOpen && podeEditar && (
        <AnexarMaterialCursoModal
          isOpen={isAnexarModalOpen}
          onClose={() => setIsAnexarModalOpen(false)}
          cursos={cursos}
          onUpload={handleUploadMaterial}
        />
      )}
    </div>
  )
}

