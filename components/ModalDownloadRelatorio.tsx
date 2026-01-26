'use client'

import BaseModal from '@/components/BaseModal'

interface ModalDownloadRelatorioProps {
  isOpen: boolean
  onClose: () => void
  onDownloadSimples: () => void
  onDownloadDetalhado: () => void
}

export default function ModalDownloadRelatorio({
  isOpen,
  onClose,
  onDownloadSimples,
  onDownloadDetalhado,
}: ModalDownloadRelatorioProps) {
  if (!isOpen) return null

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} contentClassName="max-w-md">
      <div className="bg-white rounded-lg shadow-xl w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Baixar Relatório</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Escolha o tipo de relatório que deseja baixar:
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                onDownloadSimples()
                onClose()
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium text-left flex items-center justify-between"
            >
              <div>
                <div className="font-semibold">Relatório Simples</div>
                <div className="text-sm text-green-100">Apenas a aba atual</div>
              </div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            <button
              onClick={() => {
                onDownloadDetalhado()
                onClose()
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors font-medium text-left flex items-center justify-between"
            >
              <div>
                <div className="font-semibold">Relatório Detalhado</div>
                <div className="text-sm text-blue-100">Todas as abas do relatório</div>
              </div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </BaseModal>
  )
}
