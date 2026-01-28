'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CriarWebhookModal from '@/components/CriarWebhookModal'
import ConfirmarExclusaoModal from '@/components/ConfirmarExclusaoModal'
import { logActivity } from '@/lib/activity-log'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import { migrateLocalStorageToAPI } from '@/lib/migrate-data'

type Webhook = {
  id: string
  nome: string
  url: string
  status: 'Ativo' | 'Inativo'
  dataCriacao: string
  horaCriacao: string
}

export default function WebhooksPage() {
  const router = useRouter()
  const { isAdmin, temPermissao, user } = usePermissions()
  const podeVer = isAdmin || temPermissao('view_webhooks')
  const podeEditar = isAdmin || temPermissao('edit_webhooks')
  const [isClient, setIsClient] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [webhookParaEditar, setWebhookParaEditar] = useState<Webhook | null>(null)
  const [webhookParaDeletar, setWebhookParaDeletar] = useState<Webhook | null>(null)
  const [webhookTestando, setWebhookTestando] = useState<string | null>(null)
  const [testeResultado, setTesteResultado] = useState<{ success: boolean; message: string } | null>(null)

  // Sincronização via API
  const { data: webhooks, refresh: refreshWebhooks } = useDataSync<Webhook>({ 
    entity: 'webhooks',
    pollingInterval: 2000
  })
  const { create: createWebhook, update: updateWebhook, remove: removeWebhook } = useDataMutation<Webhook>('webhooks')

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      migrateLocalStorageToAPI()
    }
  }, [])

  const handleCreateWebhook = async (dados: {
    nome: string
    url: string
    status: 'Ativo' | 'Inativo'
  }) => {
    const agora = new Date()
    const dataCriacao = agora.toLocaleDateString('pt-BR')
    const horaCriacao = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const novoWebhook: Webhook = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      nome: dados.nome,
      url: dados.url,
      status: dados.status,
      dataCriacao,
      horaCriacao,
    }

    const resultado = await createWebhook(novoWebhook)
    if (resultado) {
      await logActivity('created', 'webhook', resultado.id, resultado.nome, user?.login)
      refreshWebhooks()
    }
  }

  const handleUpdateWebhook = async (dados: {
    nome: string
    url: string
    status: 'Ativo' | 'Inativo'
  }) => {
    if (!webhookParaEditar) return

    const resultado = await updateWebhook(webhookParaEditar.id, dados)
    if (resultado) {
      await logActivity('updated', 'webhook', webhookParaEditar.id, dados.nome, user?.login)
      refreshWebhooks()
    }
  }

  const handleDelete = async () => {
    if (!webhookParaDeletar) return

    const nomeWebhook = webhookParaDeletar.nome
    const idWebhook = webhookParaDeletar.id

    const resultado = await removeWebhook(idWebhook)
    if (resultado.ok) {
      await logActivity('deleted', 'webhook', idWebhook, nomeWebhook, user?.login)
      refreshWebhooks()
    }
  }

  const handleEditClick = (webhook: Webhook) => {
    setWebhookParaEditar(webhook)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (webhook: Webhook) => {
    setWebhookParaDeletar(webhook)
    setIsDeleteModalOpen(true)
  }

  const handleTestWebhook = async (webhook: Webhook) => {
    if (webhook.status !== 'Ativo') {
      alert('Apenas webhooks ativos podem ser testados.')
      return
    }

    setWebhookTestando(webhook.id)
    setTesteResultado(null)

    try {
      const response = await fetch('/api/webhooks/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl: webhook.url,
          message: {
            content: '🧪 Teste de webhook - Sistema de Gerenciamento Militar',
            username: 'Sistema de Gestão',
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTesteResultado({ success: true, message: 'Webhook testado com sucesso! Verifique o Discord.' })
        setTimeout(() => setTesteResultado(null), 5000)
      } else {
        setTesteResultado({ success: false, message: data.error || 'Erro ao testar webhook' })
        setTimeout(() => setTesteResultado(null), 5000)
      }
    } catch (error) {
      setTesteResultado({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao testar webhook',
      })
      setTimeout(() => setTesteResultado(null), 5000)
    } finally {
      setWebhookTestando(null)
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
        {/* Mensagem de Resultado do Teste */}
        {testeResultado && (
          <div
            className={`px-4 py-3 rounded-lg flex items-center justify-between ${
              testeResultado.success
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {testeResultado.success ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{testeResultado.message}</span>
            </div>
            <button
              onClick={() => setTesteResultado(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Webhooks</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Gerenciar webhooks do Discord</p>
        </div>
        {podeEditar && (
          <button
            onClick={() => {
              setWebhookParaEditar(null)
              setIsModalOpen(true)
            }}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-md text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Webhook
          </button>
        )}
      </div>

        {/* Tabela de Webhooks */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-6 h-6 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Webhooks Configurados</h2>
          </div>

          <div className="overflow-x-auto custom-scrollbar-horizontal">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(!webhooks || webhooks.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Nenhum webhook configurado
                    </td>
                  </tr>
                ) : (
                  webhooks.map((webhook) => (
                    <tr key={webhook.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {webhook.nome}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                        <div className="truncate" title={webhook.url}>
                          {webhook.url}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            webhook.status === 'Ativo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {webhook.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex items-center justify-center gap-2">
                          {webhook.status === 'Ativo' && podeEditar && (
                            <button
                              onClick={() => handleTestWebhook(webhook)}
                              disabled={webhookTestando === webhook.id}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Testar webhook"
                            >
                              {webhookTestando === webhook.id ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          )}
                          {podeEditar && (
                            <>
                              <button
                                onClick={() => handleEditClick(webhook)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar webhook"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(webhook)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir webhook"
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
      </div>

      {/* Modal Criar/Editar Webhook */}
      {isModalOpen && (
        <CriarWebhookModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setWebhookParaEditar(null)
          }}
          onCreate={handleCreateWebhook}
          onUpdate={handleUpdateWebhook}
          webhookEditando={webhookParaEditar}
        />
      )}

      {/* Modal Confirmar Exclusão */}
      {isDeleteModalOpen && webhookParaDeletar && (
        <ConfirmarExclusaoModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setWebhookParaDeletar(null)
          }}
          onConfirm={() => {
            handleDelete()
            setIsDeleteModalOpen(false)
            setWebhookParaDeletar(null)
          }}
          itemNome={webhookParaDeletar.nome}
          tipoItem="webhook"
        />
      )}
    </>
  )
}
