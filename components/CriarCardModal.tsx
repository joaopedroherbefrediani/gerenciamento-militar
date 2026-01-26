'use client'

import { useState, useEffect } from 'react'
import BaseModal from '@/components/BaseModal'

interface Card {
  id: string
  titulo: string
  descricao: string
  status: 'fazer' | 'fazendo' | 'feito'
}

interface CriarCardModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (dados: { titulo: string; descricao: string; status: 'fazer' | 'fazendo' | 'feito' }) => void
  onUpdate: (dados: { id: string; titulo: string; descricao: string; status: 'fazer' | 'fazendo' | 'feito' }) => void
  cardEditando?: Card | null
  visualizarApenas?: boolean
}

export default function CriarCardModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  cardEditando = null,
  visualizarApenas = false,
}: CriarCardModalProps) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [status, setStatus] = useState<'fazer' | 'fazendo' | 'feito'>('fazer')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (cardEditando) {
      setTitulo(cardEditando.titulo)
      setDescricao(cardEditando.descricao)
      setStatus(cardEditando.status)
    } else {
      setTitulo('')
      setDescricao('')
      setStatus('fazer')
    }
  }, [cardEditando, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!titulo.trim() || !descricao.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (cardEditando) {
      onUpdate({ id: cardEditando.id, titulo: titulo.trim(), descricao: descricao.trim(), status })
    } else {
      onCreate({ titulo: titulo.trim(), descricao: descricao.trim(), status })
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
              {visualizarApenas ? 'Detalhes do Card' : cardEditando ? 'Editar Card' : 'Novo Card'}
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
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-50"
                placeholder="Título da tarefa"
                required
                disabled={visualizarApenas}
              />
            </div>

            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none disabled:bg-gray-50"
                placeholder="Descreva a tarefa..."
                required
                disabled={visualizarApenas}
              />
            </div>

            {!visualizarApenas && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'fazer' | 'fazendo' | 'feito')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="fazer">Fazer</option>
                  <option value="fazendo">Fazendo</option>
                  <option value="feito">Feito</option>
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium ${visualizarApenas ? 'bg-green-500 text-white hover:bg-green-600' : ''}`}
              >
                {visualizarApenas ? 'Fechar' : 'Cancelar'}
              </button>
              {!visualizarApenas && (
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium"
                >
                  {cardEditando ? 'Salvar Alterações' : 'Criar Card'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </BaseModal>
  )
}
