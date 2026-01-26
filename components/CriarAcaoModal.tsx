'use client'

import { useState, useEffect, useRef } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import BaseModal from '@/components/BaseModal'

type DatePickerComponent = React.ComponentType<any>

type Militar = {
  id: string
  nomeCompleto: string
}

interface CriarAcaoModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate?: (acao: {
    militarId: string
    tipo: 'Prisão' | 'Curso' | 'Patrulha' | 'Operação'
    titulo: string
    alvoLocal: string
    data: string
    quantidadeHoras?: string
    descricao?: string
  }) => void
  onUpdate?: (acao: {
    militarId: string
    tipo: 'Prisão' | 'Curso' | 'Patrulha' | 'Operação'
    titulo: string
    alvoLocal: string
    data: string
    quantidadeHoras?: string
    descricao?: string
  }) => void
  acaoEditando?: {
    id?: string
    militarId: string
    tipo: 'Prisão' | 'Curso' | 'Patrulha' | 'Operação'
    titulo: string
    alvoLocal: string
    data: string
    quantidadeHoras?: string
    descricao?: string
  } | null
  militares?: Militar[]
}

export default function CriarAcaoModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  acaoEditando = null,
  militares = [],
}: CriarAcaoModalProps) {
  const [militarId, setMilitarId] = useState('')
  const [tipo, setTipo] = useState<'Prisão' | 'Curso' | 'Patrulha' | 'Operação'>('Prisão')
  const [titulo, setTitulo] = useState('')
  const [alvoLocal, setAlvoLocal] = useState('')
  const [data, setData] = useState('')
  const [dataDate, setDataDate] = useState<Date | null>(null)
  const [quantidadeHoras, setQuantidadeHoras] = useState('')
  const [descricao, setDescricao] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [DatePicker, setDatePicker] = useState<DatePickerComponent | null>(null)

  const isEditMode = !!acaoEditando
  const acaoId = acaoEditando?.id
  const ultimaAcaoIdRef = useRef<string | null>(null)
  const modalAbertoRef = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true)
      import('react-datepicker').then((mod) => {
        setDatePicker(() => mod.default)
      })
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !isClient || typeof window === 'undefined') {
      if (!isOpen) {
        modalAbertoRef.current = false
      }
      return
    }

    const modalAcabouDeAbrir = !modalAbertoRef.current
    const acaoMudou = acaoEditando && (acaoId !== ultimaAcaoIdRef.current || !ultimaAcaoIdRef.current)

    if (modalAcabouDeAbrir || acaoMudou) {
      if (acaoEditando) {
        setMilitarId(acaoEditando.militarId || '')
        setTipo(acaoEditando.tipo || 'Prisão')
        setTitulo(acaoEditando.titulo || '')
        setAlvoLocal(acaoEditando.alvoLocal || '')
        setData(acaoEditando.data || '')
        setQuantidadeHoras(acaoEditando.quantidadeHoras || '')
        setDescricao(acaoEditando.descricao || '')
        try {
          if (acaoEditando.data) {
            setDataDate(new Date(acaoEditando.data))
          } else {
            setDataDate(new Date())
          }
        } catch (error) {
          console.error('Erro ao criar data:', error)
          setDataDate(new Date())
        }
        ultimaAcaoIdRef.current = acaoId || 'edit-' + Date.now()
      } else {
        setMilitarId('')
        setTipo('Prisão')
        setTitulo('')
        setAlvoLocal('')
        const hoje = new Date()
        const yyyy = hoje.getFullYear()
        const mm = String(hoje.getMonth() + 1).padStart(2, '0')
        const dd = String(hoje.getDate()).padStart(2, '0')
        setData(`${yyyy}-${mm}-${dd}`)
        setDataDate(hoje)
        setQuantidadeHoras('')
        setDescricao('')
        ultimaAcaoIdRef.current = null
      }
      modalAbertoRef.current = true
    }
  }, [isOpen, acaoEditando, isClient, acaoId])

  useEffect(() => {
    if (dataDate) {
      const yyyy = dataDate.getFullYear()
      const mm = String(dataDate.getMonth() + 1).padStart(2, '0')
      const dd = String(dataDate.getDate()).padStart(2, '0')
      setData(`${yyyy}-${mm}-${dd}`)
    } else {
      setData('')
    }
  }, [dataDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!militarId || !titulo || !alvoLocal || !data) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const dadosAcao = {
      militarId,
      tipo,
      titulo: titulo.trim(),
      alvoLocal: alvoLocal.trim(),
      data,
      quantidadeHoras: quantidadeHoras.trim() || undefined,
      descricao: descricao.trim() || undefined,
    }

    if (isEditMode && onUpdate) {
      onUpdate(dadosAcao)
    } else if (onCreate) {
      onCreate(dadosAcao)
    }

    onClose()
  }

  if (!isClient || !isOpen) return null

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} contentClassName="max-w-2xl">
      <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Editar Ação' : 'Registrar Ação'}
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
          {/* Militar e Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="militar" className="block text-sm font-medium text-gray-700 mb-2">
                Militar <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="militar"
                  value={militarId}
                  onChange={(e) => setMilitarId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10"
                >
                  <option value="">Selecione um militar</option>
                  {militares.map((militar) => (
                    <option key={militar.id} value={militar.id}>
                      {militar.nomeCompleto}
                    </option>
                  ))}
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

            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'Prisão' | 'Curso' | 'Patrulha' | 'Operação')}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10"
                >
                  <option value="Prisão">Prisão</option>
                  <option value="Curso">Curso</option>
                  <option value="Patrulha">Patrulha</option>
                  <option value="Operação">Operação</option>
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
          </div>

          {/* Título */}
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o título da ação"
              required
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>

          {/* Alvo/Local */}
          <div>
            <label htmlFor="alvoLocal" className="block text-sm font-medium text-gray-700 mb-2">
              Alvo/Local <span className="text-red-500">*</span>
            </label>
            <input
              id="alvoLocal"
              type="text"
              value={alvoLocal}
              onChange={(e) => setAlvoLocal(e.target.value)}
              placeholder="Digite o alvo ou local"
              required
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>

          {/* Data */}
          <div>
            <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-2">
              Data <span className="text-red-500">*</span>
            </label>
            <div className="relative [&_.react-datepicker__input-container]:w-full">
              {DatePicker ? (
                <DatePicker
                  selected={dataDate}
                  onChange={(date: Date | null) => setDataDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full"
                  placeholderText="Selecione a data"
                  showPopperArrow={false}
                  popperClassName="react-datepicker-popper-custom"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={data || ''}
                  readOnly
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Carregando..."
                />
              )}
            </div>
          </div>

          {/* Quantidade/Horas */}
          <div>
            <label htmlFor="quantidadeHoras" className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade/Horas
            </label>
            <input
              id="quantidadeHoras"
              type="text"
              value={quantidadeHoras}
              onChange={(e) => setQuantidadeHoras(e.target.value)}
              placeholder="Ex: 2 horas, 5 unidades, etc."
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Digite a descrição da ação"
              rows={4}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 resize-y"
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
              {isEditMode ? 'Salvar Alterações' : 'Registrar Ação'}
            </button>
          </div>
        </form>
      </div>
    </BaseModal>
  )
}
