'use client'

import { useState } from 'react'
import BaseModal from '@/components/BaseModal'

interface ConfirmarExclusaoModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  cargoNome?: string
  itemNome?: string
  tipoItem?: string
}

export default function ConfirmarExclusaoModal({
  isOpen,
  onClose,
  onConfirm,
  cargoNome,
  itemNome,
  tipoItem = 'item',
}: ConfirmarExclusaoModalProps) {
  const [isExcluindo, setIsExcluindo] = useState(false)
  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsExcluindo(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setIsExcluindo(false)
    }
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} contentClassName="max-w-md">
      <div className="bg-white rounded-lg shadow-xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Confirmar Exclusão
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

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Tem certeza que deseja excluir {
              tipoItem === 'cargo' ? 'o cargo' :
              tipoItem === 'prova' || tipoItem === 'a prova' ? 'a prova' :
              tipoItem === 'ação' ? 'a ação' :
              tipoItem === 'infração' ? 'a infração' :
              tipoItem === 'punição' ? 'a punição' :
              tipoItem === 'webhook' ? 'o webhook' :
              tipoItem === 'template' ? 'o template' :
              tipoItem === 'card' ? 'o card' :
              'o item'
            } <span className="font-semibold">&quot;{itemNome || cargoNome}&quot;</span>?
            Esta ação não pode ser desfeita.
          </p>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isExcluindo}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExcluindo ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  )
}
