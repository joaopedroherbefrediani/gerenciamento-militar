'use client'

import { useState, useEffect } from 'react'
import BaseModal from '@/components/BaseModal'
import { KANBAN_TIPOS, KanbanCardTipo, normalizeKanbanTipo } from '@/lib/kanban-tipos'

interface Card {
  id: string
  titulo: string
  descricao: string
  status: 'fazer' | 'fazendo' | 'feito'
  tipo?: KanbanCardTipo
}

interface CriarCardModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (dados: { titulo: string; descricao: string; status: 'fazer' | 'fazendo' | 'feito'; tipo: KanbanCardTipo }) => void
  onUpdate: (dados: { id: string; titulo: string; descricao: string; status: 'fazer' | 'fazendo' | 'feito'; tipo: KanbanCardTipo }) => void
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
  const [tipo, setTipo] = useState<KanbanCardTipo>('TAREFA')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (cardEditando) {
      setTitulo(cardEditando.titulo)
      setDescricao(cardEditando.descricao)
      setStatus(cardEditando.status)
      setTipo(normalizeKanbanTipo(cardEditando.tipo))
    } else {
      setTitulo('')
      setDescricao('')
      setStatus('fazer')
      setTipo('TAREFA')
    }
  }, [cardEditando, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!titulo.trim() || !descricao.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (cardEditando) {
      onUpdate({ id: cardEditando.id, titulo: titulo.trim(), descricao: descricao.trim(), status, tipo })
    } else {
      onCreate({ titulo: titulo.trim(), descricao: descricao.trim(), status, tipo })
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

            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <div className="relative">
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as KanbanCardTipo)}
                  disabled={visualizarApenas}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-50 appearance-none bg-white"
                >
                  {KANBAN_TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {!visualizarApenas && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'fazer' | 'fazendo' | 'feito')}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
                  >
                    <option value="fazer">Fazer</option>
                    <option value="fazendo">Fazendo</option>
                    <option value="feito">Feito</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
