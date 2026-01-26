'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CriarTemplateModal from '@/components/CriarTemplateModal'
import ConfirmarExclusaoModal from '@/components/ConfirmarExclusaoModal'
import { logActivity } from '@/lib/activity-log'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import { migrateLocalStorageToAPI } from '@/lib/migrate-data'

type Template = {
  id: string
  nome: string
  webhookId: string
  webhookNome?: string
  webhookUrl?: string
  mensagemTexto?: string
  embedAutorNome?: string
  embedAutorIconUrl?: string
  embedTitulo?: string
  embedDescricao?: string
  embedCor?: string
  embedThumbnailUrl?: string
  embedImagens?: string[]
  embedFooterTexto?: string
  embedFooterIconUrl?: string
  dataCriacao: string
  horaCriacao: string
}

type Webhook = {
  id: string
  nome: string
  url: string
  status: 'Ativo' | 'Inativo'
}

export default function TemplatesPage() {
  const router = useRouter()
  const { isAdmin, temPermissao, user } = usePermissions()
  const podeVer = isAdmin || temPermissao('view_templates')
  const podeEditar = isAdmin || temPermissao('edit_templates')
  const [isClient, setIsClient] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [templateParaEditar, setTemplateParaEditar] = useState<Template | null>(null)
  const [templateParaDeletar, setTemplateParaDeletar] = useState<Template | null>(null)

  // Sincronização via API
  const { data: templates, refresh: refreshTemplates } = useDataSync<Template>({ 
    entity: 'templates',
    pollingInterval: 2000
  })
  const { data: webhooks } = useDataSync<Webhook>({ 
    entity: 'webhooks',
    pollingInterval: 2000
  })
  const { create: createTemplate, update: updateTemplate, remove: removeTemplate } = useDataMutation<Template>('templates')

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      migrateLocalStorageToAPI()
    }
  }, [])

  const handleCreateTemplate = async (dados: any) => {
    const agora = new Date()
    const dataCriacao = agora.toLocaleDateString('pt-BR')
    const horaCriacao = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const webhook = (webhooks || []).find(w => w.id === dados.webhookId)

    const novoTemplate: Template = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nome: dados.nome,
      webhookId: dados.webhookId,
      webhookNome: webhook?.nome,
      webhookUrl: dados.webhookUrl,
      mensagemTexto: dados.mensagemTexto,
      embedAutorNome: dados.embedAutorNome,
      embedAutorIconUrl: dados.embedAutorIconUrl,
      embedTitulo: dados.embedTitulo,
      embedDescricao: dados.embedDescricao,
      embedCor: dados.embedCor,
      embedThumbnailUrl: dados.embedThumbnailUrl,
      embedImagens: dados.embedImagens,
      embedFooterTexto: dados.embedFooterTexto,
      embedFooterIconUrl: dados.embedFooterIconUrl,
      dataCriacao,
      horaCriacao,
    }

    const resultado = await createTemplate(novoTemplate)
    if (resultado) {
      logActivity('created', 'template', novoTemplate.id, novoTemplate.nome, user?.login)
      refreshTemplates()
      setIsModalOpen(false)
    }
  }

  const handleUpdateTemplate = async (dados: any) => {
    if (!templateParaEditar) return

    const webhook = (webhooks || []).find(w => w.id === dados.webhookId)

    const dadosAtualizados = {
      nome: dados.nome,
      webhookId: dados.webhookId,
      webhookNome: webhook?.nome,
      webhookUrl: dados.webhookUrl,
      mensagemTexto: dados.mensagemTexto,
      embedAutorNome: dados.embedAutorNome,
      embedAutorIconUrl: dados.embedAutorIconUrl,
      embedTitulo: dados.embedTitulo,
      embedDescricao: dados.embedDescricao,
      embedCor: dados.embedCor,
      embedThumbnailUrl: dados.embedThumbnailUrl,
      embedImagens: dados.embedImagens,
      embedFooterTexto: dados.embedFooterTexto,
      embedFooterIconUrl: dados.embedFooterIconUrl,
    }

    const resultado = await updateTemplate(templateParaEditar.id, dadosAtualizados)
    if (resultado) {
      logActivity('updated', 'template', templateParaEditar.id, dados.nome, user?.login)
      refreshTemplates()
      setIsModalOpen(false)
      setTemplateParaEditar(null)
    }
  }

  const handleDelete = async () => {
    if (!templateParaDeletar) return

    const nomeTemplate = templateParaDeletar.nome
    const idTemplate = templateParaDeletar.id

    const resultado = await removeTemplate(idTemplate)
    if (resultado.ok) {
      logActivity('deleted', 'template', idTemplate, nomeTemplate, user?.login)
      refreshTemplates()
    }
  }

  const handleEditClick = (template: Template) => {
    setTemplateParaEditar(template)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (template: Template) => {
    setTemplateParaDeletar(template)
    setIsDeleteModalOpen(true)
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Templates</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gerenciar templates de mensagens Discord</p>
          </div>
          {podeEditar && (
            <button
              onClick={() => {
                setTemplateParaEditar(null)
                setIsModalOpen(true)
              }}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-md text-sm sm:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Template
            </button>
          )}
        </div>

        {/* Tabela de Templates */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Lista de Templates</h2>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link do Webhook</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título do Embed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(!templates || templates.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <div className="space-y-2">
                        <p>Nenhum template criado</p>
                        <p className="text-sm">Clique em &quot;Novo Template&quot; para começar</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  templates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {template.nome}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                        <div className="truncate" title={template.webhookUrl || ''}>
                          {template.webhookUrl || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                        <div className="truncate" title={template.embedTitulo || ''}>
                          {template.embedTitulo || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(template)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar template"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(template)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir template"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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

      {/* Modal Criar/Editar Template */}
      {isModalOpen && (
        <CriarTemplateModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setTemplateParaEditar(null)
          }}
          onCreate={handleCreateTemplate}
          onUpdate={handleUpdateTemplate}
          templateEditando={templateParaEditar}
          webhooks={(webhooks || []).filter(w => w.status === 'Ativo')}
        />
      )}

      {/* Modal Confirmar Exclusão */}
      {isDeleteModalOpen && templateParaDeletar && (
        <ConfirmarExclusaoModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setTemplateParaDeletar(null)
          }}
          onConfirm={() => {
            handleDelete()
            setIsDeleteModalOpen(false)
            setTemplateParaDeletar(null)
          }}
          itemNome={templateParaDeletar.nome}
          tipoItem="template"
        />
      )}
    </>
  )
}
