'use client'

import { useState, useEffect, useRef } from 'react'
import BaseModal from '@/components/BaseModal'

interface CriarPunicaoModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate?: (punicao: {
    nome: string
    descricao: string
    pontos: number
  }) => void
  onUpdate?: (punicao: {
    nome: string
    descricao: string
    pontos: number
  }) => void
  punicaoEditando?: {
    id?: string
    nome: string
    descricao: string
    pontos: number
  } | null
}

export default function CriarPunicaoModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  punicaoEditando = null,
}: CriarPunicaoModalProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [pontos, setPontos] = useState<number>(1)
  const [isClient, setIsClient] = useState(false)

  const isEditMode = !!punicaoEditando
  const punicaoId = punicaoEditando?.id
  const ultimaPunicaoIdRef = useRef<string | null>(null)
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
    const punicaoMudou = punicaoEditando && (punicaoId !== ultimaPunicaoIdRef.current || !ultimaPunicaoIdRef.current)

    if (modalAcabouDeAbrir || punicaoMudou) {
      if (punicaoEditando) {
        setNome(punicaoEditando.nome || '')
        setDescricao(punicaoEditando.descricao || '')
        setPontos(punicaoEditando.pontos || 1)
        ultimaPunicaoIdRef.current = punicaoId || 'edit-' + Date.now()
      } else {
        setNome('')
        setDescricao('')
        setPontos(1)
        ultimaPunicaoIdRef.current = null
      }
      modalAbertoRef.current = true
    }
  }, [isOpen, punicaoEditando, isClient, punicaoId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome.trim() || !descricao.trim() || pontos < 1 || pontos > 100) {
      alert('Por favor, preencha todos os campos corretamente. Os pontos devem ser entre 1 e 100.')
      return
    }

    const dadosPunicao = {
      nome: nome.trim(),
      descricao: descricao.trim(),
      pontos: pontos,
    }

    if (isEditMode && onUpdate) {
      onUpdate(dadosPunicao)
    } else if (onCreate) {
      onCreate(dadosPunicao)
    }

    onClose()
  }

  if (!isClient || !isOpen) return null

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} contentClassName="max-w-2xl">
      <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Editar Punição' : 'Nova Punição'}
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
              placeholder="Digite o nome da punição"
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
              placeholder="Digite a descrição da punição"
              rows={4}
              required
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 resize-y"
            />
          </div>

          {/* Pontos */}
          <div>
            <label htmlFor="pontos" className="block text-sm font-medium text-gray-700 mb-2">
              Pontos <span className="text-red-500">*</span>
            </label>
            <input
              id="pontos"
              type="number"
              min="1"
              max="100"
              value={pontos}
              onChange={(e) => setPontos(parseInt(e.target.value) || 1)}
              placeholder="Digite a quantidade de pontos (1-100)"
              required
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
            />
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
              {isEditMode ? 'Salvar Alterações' : 'Criar Punição'}
            </button>
          </div>
        </form>
      </div>
    </BaseModal>
  )
}
