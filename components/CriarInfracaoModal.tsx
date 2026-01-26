'use client'

import { useState, useEffect, useRef } from 'react'
import BaseModal from '@/components/BaseModal'

interface CriarInfracaoModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate?: (infracao: {
    nome: string
    descricao: string
    gravidade: 'Leve' | 'Média' | 'Grave' | 'Gravíssima'
  }) => void
  onUpdate?: (infracao: {
    nome: string
    descricao: string
    gravidade: 'Leve' | 'Média' | 'Grave' | 'Gravíssima'
  }) => void
  infracaoEditando?: {
    id?: string
    nome: string
    descricao: string
    gravidade: 'Leve' | 'Média' | 'Grave' | 'Gravíssima'
  } | null
}

export default function CriarInfracaoModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  infracaoEditando = null,
}: CriarInfracaoModalProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [gravidade, setGravidade] = useState<'Leve' | 'Média' | 'Grave' | 'Gravíssima'>('Leve')
  const [isClient, setIsClient] = useState(false)

  const isEditMode = !!infracaoEditando
  const infracaoId = infracaoEditando?.id
  const ultimaInfracaoIdRef = useRef<string | null>(null)
  const modalAbertoRef = useRef(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isOpen || !isClient || typeof window === 'undefined') {
      if (!isOpen) {
        modalAbertoRef.current = false
      }
      return
    }

    const modalAcabouDeAbrir = !modalAbertoRef.current
    const infracaoMudou = infracaoEditando && (infracaoId !== ultimaInfracaoIdRef.current || !ultimaInfracaoIdRef.current)

    if (modalAcabouDeAbrir || infracaoMudou) {
      if (infracaoEditando) {
        setNome(infracaoEditando.nome || '')
        setDescricao(infracaoEditando.descricao || '')
        setGravidade(infracaoEditando.gravidade || 'Leve')
        ultimaInfracaoIdRef.current = infracaoId || 'edit-' + Date.now()
      } else {
        setNome('')
        setDescricao('')
        setGravidade('Leve')
        ultimaInfracaoIdRef.current = null
      }
      modalAbertoRef.current = true
    }
  }, [isOpen, infracaoEditando, isClient, infracaoId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome.trim() || !descricao.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const dadosInfracao = {
      nome: nome.trim(),
      descricao: descricao.trim(),
      gravidade,
    }

    if (isEditMode && onUpdate) {
      onUpdate(dadosInfracao)
    } else if (onCreate) {
      onCreate(dadosInfracao)
    }

    onClose()
  }

  if (!isClient || !isOpen) return null

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} contentClassName="max-w-2xl">
      <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Editar Infração' : 'Nova Infração'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome da infração"
              required
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Digite a descrição da infração"
              rows={4}
              required
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 resize-y"
            />
          </div>

          {/* Gravidade */}
          <div>
            <label htmlFor="gravidade" className="block text-sm font-medium text-gray-700 mb-2">
              Gravidade <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="gravidade"
                value={gravidade}
                onChange={(e) => setGravidade(e.target.value as 'Leve' | 'Média' | 'Grave' | 'Gravíssima')}
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10"
              >
                <option value="Leve">Leve</option>
                <option value="Média">Média</option>
                <option value="Grave">Grave</option>
                <option value="Gravíssima">Gravíssima</option>
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium"
            >
              {isEditMode ? 'Salvar Alterações' : 'Criar Infração'}
            </button>
          </div>
        </form>
      </div>
    </BaseModal>
  )
}
