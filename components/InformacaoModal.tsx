'use client'

import BaseModal from '@/components/BaseModal'

interface InformacaoModalProps {
  isOpen: boolean
  onClose: () => void
  titulo: string
  mensagem: string
  botaoTexto?: string
}

export default function InformacaoModal({
  isOpen,
  onClose,
  titulo,
  mensagem,
  botaoTexto = 'Entendi',
}: InformacaoModalProps) {
  if (!isOpen) return null

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} contentClassName="max-w-md">
      <div className="bg-white rounded-lg shadow-xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{titulo}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-6">{mensagem}</p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium"
            >
              {botaoTexto}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  )
}

