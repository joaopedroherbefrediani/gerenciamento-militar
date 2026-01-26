'use client'

import { useState, useEffect, useRef } from 'react'
import 'react-datepicker/dist/react-datepicker.css'

// Tipo para o DatePicker
type DatePickerComponent = React.ComponentType<any>

type StatusMilitar = 'Ativo' | 'Suspenso' | 'Exonerado'

function getTodayIsoDate(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

interface CriarMilitarModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate?: (militar: {
    nomeCompleto: string
    cargo: string
    matricula?: string
    discordId?: string
    dataAdmissao: string // ISO (YYYY-MM-DD)
    status: StatusMilitar
    observacoes?: string
  }) => void
  onUpdate?: (militar: {
    nomeCompleto: string
    cargo: string
    matricula?: string
    discordId?: string
    dataAdmissao: string // ISO (YYYY-MM-DD)
    status: StatusMilitar
    observacoes?: string
  }) => void
  militarEditando?: {
    id?: string
    nomeCompleto: string
    cargo: string
    matricula?: string
    discordId?: string
    dataAdmissao: string // ISO (YYYY-MM-DD)
    status: StatusMilitar
    observacoes?: string
  } | null
  cargos: Array<{ id: string; nome: string }>
}

export default function CriarMilitarModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  militarEditando = null,
  cargos = [],
}: CriarMilitarModalProps) {
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [cargo, setCargo] = useState('')
  const [matricula, setMatricula] = useState('')
  const [discordId, setDiscordId] = useState('')
  const [dataAdmissao, setDataAdmissao] = useState('')
  const [dataAdmissaoDate, setDataAdmissaoDate] = useState<Date | null>(null)
  const [status, setStatus] = useState<StatusMilitar>('Ativo')
  const [observacoes, setObservacoes] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [DatePicker, setDatePicker] = useState<DatePickerComponent | null>(null)

  const isEditMode = !!militarEditando
  const militarId = militarEditando?.id
  const ultimoMilitarIdRef = useRef<string | null>(null)
  const modalAbertoRef = useRef(false)

  // Carregar DatePicker dinamicamente apenas no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true)
      import('react-datepicker').then((mod) => {
        setDatePicker(() => mod.default)
      })
      setDataAdmissaoDate(new Date())
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !isClient || typeof window === 'undefined') {
      if (!isOpen) {
        modalAbertoRef.current = false
      }
      return
    }

    // Só inicializar campos quando o modal abrir ou quando mudar o militar sendo editado
    const modalAcabouDeAbrir = !modalAbertoRef.current
    const militarMudou = militarEditando && (militarId !== ultimoMilitarIdRef.current || !ultimoMilitarIdRef.current)

    if (modalAcabouDeAbrir || militarMudou) {
      if (militarEditando) {
        // Atualizar campos com dados do militar
        setNomeCompleto(militarEditando.nomeCompleto || '')
        setCargo(militarEditando.cargo || '')
        setMatricula(militarEditando.matricula || '')
        setDiscordId(militarEditando.discordId || '')
        const dataIso = militarEditando.dataAdmissao || getTodayIsoDate()
        setDataAdmissao(dataIso)
        try {
          setDataAdmissaoDate(new Date(dataIso))
        } catch (error) {
          console.error('Erro ao criar data:', error)
          setDataAdmissaoDate(new Date())
        }
        setStatus(militarEditando.status || 'Ativo')
        setObservacoes(militarEditando.observacoes || '')
        ultimoMilitarIdRef.current = militarId || 'edit-' + Date.now()
      } else {
        // Resetar campos quando abrir o modal (criação)
        setNomeCompleto('')
        setCargo('')
        setMatricula('')
        setDiscordId('')
        // Definir data padrão como hoje (ISO)
        const hoje = getTodayIsoDate()
        setDataAdmissao(hoje)
        setDataAdmissaoDate(new Date())
        setStatus('Ativo')
        setObservacoes('')
        ultimoMilitarIdRef.current = null
      }
      modalAbertoRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, militarEditando, isClient])

  // Sincronizar dataAdmissao quando dataAdmissaoDate mudar
  useEffect(() => {
    if (dataAdmissaoDate) {
      const yyyy = dataAdmissaoDate.getFullYear()
      const mm = String(dataAdmissaoDate.getMonth() + 1).padStart(2, '0')
      const dd = String(dataAdmissaoDate.getDate()).padStart(2, '0')
      setDataAdmissao(`${yyyy}-${mm}-${dd}`)
    }
  }, [dataAdmissaoDate])

  useEffect(() => {
    if (typeof window === 'undefined') return
    
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

    const militarData = {
      nomeCompleto: nomeCompleto.trim(),
      cargo: cargo,
      matricula: matricula.trim() || undefined,
      discordId: discordId.trim() || undefined,
      dataAdmissao: dataAdmissao,
      status: status,
      observacoes: observacoes.trim() || undefined,
    }

    if (isEditMode && onUpdate) {
      onUpdate(militarData)
    } else if (onCreate) {
      onCreate(militarData)
    }

    onClose()
  }

  if (!isOpen || !isClient) return null

  return (
    <div className="modal-overlay-fix">
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Editar Militar' : 'Adicionar Militar'}
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
          {/* Nome Completo */}
          <div>
            <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              id="nomeCompleto"
              type="text"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Digite o nome completo"
              required
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>

          {/* Cargo */}
          <div>
            <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-2">
              Cargo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10"
              >
                <option value="">Selecione um cargo</option>
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
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

          {/* Matrícula e Discord ID - lado a lado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="matricula" className="block text-sm font-medium text-gray-700 mb-2">
                Matrícula
              </label>
              <input
                id="matricula"
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Digite a matrícula"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="discordId" className="block text-sm font-medium text-gray-700 mb-2">
                Discord ID
              </label>
              <input
                id="discordId"
                type="text"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                placeholder="Digite o Discord ID"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
          </div>

          {/* Data de Admissão e Status - lado a lado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dataAdmissao" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Admissão
              </label>
              <div className="relative [&_.react-datepicker__input-container]:w-full">
                {isClient && DatePicker ? (
                  <DatePicker
                    selected={dataAdmissaoDate}
                    onChange={(date: Date | null) => setDataAdmissaoDate(date || new Date())}
                    dateFormat="dd/MM/yyyy"
                    className="w-full"
                    placeholderText="Selecione a data"
                    showPopperArrow={false}
                    popperClassName="react-datepicker-popper-custom"
                  />
                ) : (
                  <input
                    type="text"
                    value={dataAdmissao || ''}
                    readOnly
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Carregando..."
                  />
                )}
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="relative">
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusMilitar)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Suspenso">Suspenso</option>
                  <option value="Exonerado">Exonerado</option>
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

          {/* Observações */}
          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite observações sobre o militar"
              rows={4}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 resize-y"
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
