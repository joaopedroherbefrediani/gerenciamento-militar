'use client'

import { useEffect, useState } from 'react'
import BaseModal from '@/components/BaseModal'

export type CursoImportancia = 'Basico' | 'Adicional'

export interface Curso {
  id: string
  nome: string
  importancia: CursoImportancia
}

interface CriarCursoModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (dados: { nome: string; importancia: CursoImportancia }) => void
  onUpdate: (dados: { id: string; nome: string; importancia: CursoImportancia }) => void
  cursoEditando?: Curso | null
}

export default function CriarCursoModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  cursoEditando = null,
}: CriarCursoModalProps) {
  const [nome, setNome] = useState('')
  const [importancia, setImportancia] = useState<CursoImportancia>('Basico')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => setIsClient(true), [])

  useEffect(() => {
    if (cursoEditando) {
      setNome(cursoEditando.nome)
      setImportancia(cursoEditando.importancia)
    } else {
      setNome('')
      setImportancia('Basico')
    }
  }, [cursoEditando, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      alert('Por favor, informe o nome do curso.')
      return
    }

    if (cursoEditando) {
      onUpdate({ id: cursoEditando.id, nome: nome.trim(), importancia })
    } else {
      onCreate({ nome: nome.trim(), importancia })
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
              {cursoEditando ? 'Editar Curso' : 'Criar Curso'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Curso <span className="text-red-500">*</span>
              </label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Ex: Curso de Abordagem"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Importância</label>
              <div className="relative">
                <select
                  value={importancia}
                  onChange={(e) => setImportancia(e.target.value as CursoImportancia)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
                >
                  <option value="Basico">Básico</option>
                  <option value="Adicional">Adicional</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium"
              >
                {cursoEditando ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </BaseModal>
  )
}

