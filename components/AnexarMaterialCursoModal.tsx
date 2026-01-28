'use client'

import { useEffect, useState } from 'react'
import BaseModal from '@/components/BaseModal'
import type { Curso } from '@/components/CriarCursoModal'

interface AnexarMaterialCursoModalProps {
  isOpen: boolean
  onClose: () => void
  cursos: Curso[]
  onUpload: (courseId: string, file: File) => Promise<void>
}

export default function AnexarMaterialCursoModal({
  isOpen,
  onClose,
  cursos,
  onUpload,
}: AnexarMaterialCursoModalProps) {
  const [courseId, setCourseId] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isEnviando, setIsEnviando] = useState(false)

  useEffect(() => setIsClient(true), [])

  useEffect(() => {
    if (isOpen) {
      setCourseId(cursos?.[0]?.id || '')
      setFile(null)
      setIsEnviando(false)
    }
  }, [isOpen, cursos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) {
      alert('Selecione um curso.')
      return
    }
    if (!file) {
      alert('Selecione um arquivo PDF.')
      return
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Apenas arquivos .pdf são permitidos.')
      return
    }

    setIsEnviando(true)
    try {
      await onUpload(courseId, file)
      onClose()
    } finally {
      setIsEnviando(false)
    }
  }

  if (!isOpen || !isClient) return null

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} contentClassName="max-w-md">
      <div className="bg-white rounded-lg shadow-xl w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Anexar Material</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar Curso</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                {cursos.length === 0 ? (
                  <option value="">Nenhum curso cadastrado</option>
                ) : (
                  cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo (PDF)</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              {file?.name && <p className="text-xs text-gray-500 mt-1">Selecionado: {file.name}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                disabled={isEnviando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isEnviando || cursos.length === 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isEnviando ? 'Anexando...' : 'Anexar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </BaseModal>
  )
}

