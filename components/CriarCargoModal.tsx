'use client'

import { useState, useEffect } from 'react'

interface CriarCargoModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate?: (cargo: {
    nome: string
    nivel: number
    cor: string
    discordRoleId?: string
  }) => void
  onUpdate?: (cargo: {
    nome: string
    nivel: number
    cor: string
    discordRoleId?: string
  }) => void
  cargoEditando?: {
    nome: string
    nivel: number
    cor: string
    discordRoleId?: string
  } | null
}

export default function CriarCargoModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  cargoEditando = null,
}: CriarCargoModalProps) {
  const [nome, setNome] = useState('')
  const [nivel, setNivel] = useState('1')
  const [cor, setCor] = useState('#3B82F6')
  const [discordRoleId, setDiscordRoleId] = useState('')

  const isEditMode = !!cargoEditando

  useEffect(() => {
    if (isOpen) {
      if (cargoEditando) {
        setNome(cargoEditando.nome)
        setNivel(cargoEditando.nivel.toString())
        setCor(cargoEditando.cor)
        setDiscordRoleId(cargoEditando.discordRoleId || '')
      } else {
        setNome('')
        setNivel('1')
        setCor('#3B82F6')
        setDiscordRoleId('')
      }
    }
  }, [isOpen, cargoEditando])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const cargoData = {
      nome: nome.trim(),
      nivel: Number(nivel),
      cor,
      discordRoleId: discordRoleId.trim() || undefined,
    }

    if (isEditMode && onUpdate) {
      onUpdate(cargoData)
    } else if (onCreate) {
      onCreate(cargoData)
    }

    // limpar campos para próxima criação
    if (!isEditMode) {
      setNome('')
      setNivel('1')
      setCor('#3B82F6')
      setDiscordRoleId('')
    }

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay-fix">
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Editar Cargo' : 'Criar Cargo'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome do Cargo */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Cargo <span className="text-red-500">*</span>
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Comandante, Soldado..."
              required
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>

          {/* Nível Hierárquico */}
          <div>
            <label htmlFor="nivel" className="block text-sm font-medium text-gray-700 mb-2">
              Nível Hierárquico (1-100) <span className="text-red-500">*</span>
            </label>
            <input
              id="nivel"
              type="number"
              min="1"
              max="100"
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              100 = maior hierarquia, 1 = menor hierarquia
            </p>
          </div>

          {/* Cor do Cargo */}
          <div>
            <label htmlFor="cor" className="block text-sm font-medium text-gray-700 mb-2">
              Cor do Cargo
            </label>
            <div className="flex items-center gap-3">
              <input
                id="cor"
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-300 bg-white cursor-pointer"
              />
              <input
                type="text"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                placeholder="#3B82F6"
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 font-mono text-sm"
              />
            </div>
          </div>

          {/* Discord Role ID */}
          <div>
            <label htmlFor="discordRoleId" className="block text-sm font-medium text-gray-700 mb-2">
              Discord Role ID <span className="text-gray-400 text-xs">(Opcional)</span>
            </label>
            <input
              id="discordRoleId"
              type="text"
              value={discordRoleId}
              onChange={(e) => setDiscordRoleId(e.target.value)}
              placeholder="ID do cargo no Discord"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
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
              {isEditMode ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
