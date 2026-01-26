'use client'

import { useState, useEffect } from 'react'
import BaseModal from '@/components/BaseModal'

interface Webhook {
  id: string
  nome: string
  url: string
  status: 'Ativo' | 'Inativo'
}

interface CriarWebhookModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (dados: { nome: string; url: string; status: 'Ativo' | 'Inativo' }) => void
  onUpdate: (dados: { nome: string; url: string; status: 'Ativo' | 'Inativo' }) => void
  webhookEditando?: Webhook | null
}

export default function CriarWebhookModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  webhookEditando = null,
}: CriarWebhookModalProps) {
  const [nome, setNome] = useState('')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (webhookEditando) {
      setNome(webhookEditando.nome)
      setUrl(webhookEditando.url)
      setStatus(webhookEditando.status)
    } else {
      setNome('')
      setUrl('')
      setStatus('Ativo')
    }
  }, [webhookEditando, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome.trim() || !url.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    // Validar URL
    try {
      new URL(url)
    } catch {
      alert('Por favor, insira uma URL válida.')
      return
    }

    if (webhookEditando) {
      onUpdate({ nome: nome.trim(), url: url.trim(), status })
    } else {
      onCreate({ nome: nome.trim(), url: url.trim(), status })
    }

    onClose()
  }

  if (!isOpen || !isClient) return null

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} contentClassName="max-w-md">
      <div className="bg-white rounded-lg shadow-xl w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {webhookEditando ? 'Editar Webhook' : 'Adicionar Webhook'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Nome do webhook"
                required
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="https://discord.com/api/webhooks/..."
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Ativo' | 'Inativo')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium"
              >
                {webhookEditando ? 'Salvar Alterações' : 'Criar Webhook'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </BaseModal>
  )
}
