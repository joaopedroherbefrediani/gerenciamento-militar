'use client'

import { useState, useEffect } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import BaseModal from '@/components/BaseModal'

// Tipo para o DatePicker
type DatePickerComponent = React.ComponentType<any>

interface CriarAlteracaoModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate?: (alteracao: {
    tipoEvento: string
    classificacao: string
    cargoAnterior?: string
    novoCargo?: string
    titulo: string
    descricao?: string
    realizadoPor?: string
    dataInicial?: string
    dataFinal?: string
    dataTreinamento?: string
    tipoTreinamento?: string
    dataOcorrencia?: string
    oficiaisEnvolvidos?: string[]
    infracoes?: string[]
    punicoes?: string[]
    anexos?: string[]
  }) => void
  onUpdate?: (alteracao: {
    tipoEvento: string
    classificacao: string
    cargoAnterior?: string
    novoCargo?: string
    titulo: string
    descricao?: string
    realizadoPor?: string
    dataInicial?: string
    dataFinal?: string
    dataTreinamento?: string
    tipoTreinamento?: string
    dataOcorrencia?: string
    oficiaisEnvolvidos?: string[]
    infracoes?: string[]
    punicoes?: string[]
    anexos?: string[]
  }) => void
  eventoEditando?: {
    id: string
    tipoEvento: string
    classificacao: string
    cargoAnterior?: string
    novoCargo?: string
    titulo: string
    descricao?: string
    realizadoPor?: string
    dataInicial?: string
    dataFinal?: string
    dataTreinamento?: string
    tipoTreinamento?: string
    dataOcorrencia?: string
    oficiaisEnvolvidos?: string[]
    infracoes?: string[]
    punicoes?: string[]
    anexos?: string[]
  } | null
  cargos: Array<{ id: string; nome: string }>
  militares?: Array<{ id: string; nomeCompleto: string }> // Para Ocorrência
}

export default function CriarAlteracaoModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  eventoEditando = null,
  cargos = [],
  militares = [],
}: CriarAlteracaoModalProps) {
  const [tipoEvento, setTipoEvento] = useState('Promoção')
  const [classificacao, setClassificacao] = useState('Sem classificação')
  const [cargoAnterior, setCargoAnterior] = useState('')
  const [novoCargo, setNovoCargo] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [realizadoPor, setRealizadoPor] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [dataInicialDate, setDataInicialDate] = useState<Date | null>(null)
  const [dataFinalDate, setDataFinalDate] = useState<Date | null>(null)
  const [dataTreinamento, setDataTreinamento] = useState('')
  const [dataTreinamentoDate, setDataTreinamentoDate] = useState<Date | null>(null)
  const [tipoTreinamento, setTipoTreinamento] = useState('')
  const [dataOcorrencia, setDataOcorrencia] = useState('')
  const [dataOcorrenciaDate, setDataOcorrenciaDate] = useState<Date | null>(null)
  const [oficiaisEnvolvidos, setOficiaisEnvolvidos] = useState<string[]>([])
  const [infracoes, setInfracoes] = useState<string[]>([])
  const [todasInfracoes, setTodasInfracoes] = useState<Array<{ id: string; nome: string; gravidade: string }>>([])
  const [todasPunicoes, setTodasPunicoes] = useState<Array<{ id: string; nome: string; pontos: number }>>([])
  const [punicoes, setPunicoes] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const [DatePicker, setDatePicker] = useState<DatePickerComponent | null>(null)

  const isEditMode = !!eventoEditando

  // Carregar DatePicker dinamicamente apenas no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true)
      import('react-datepicker').then((mod) => {
        setDatePicker(() => mod.default)
      }).catch((error) => {
        console.error('Erro ao carregar DatePicker:', error)
      })
    }
  }, [])

  // Carregar infrações do localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !isClient) return

    const infracoesSalvas = localStorage.getItem('infracoes')
    if (infracoesSalvas) {
      try {
        const infracoesParsed = JSON.parse(infracoesSalvas)
        setTodasInfracoes(infracoesParsed.map((i: any) => ({
          id: i.id,
          nome: i.nome,
          gravidade: i.gravidade,
        })))
      } catch (error) {
        console.error('Erro ao carregar infrações:', error)
      }
    }
  }, [isClient, isOpen])

  // Carregar punições do localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !isClient) return

    const punicoesSalvas = localStorage.getItem('punicoes')
    if (punicoesSalvas) {
      try {
        const punicoesParsed = JSON.parse(punicoesSalvas)
        setTodasPunicoes(punicoesParsed.map((p: any) => ({
          id: p.id,
          nome: p.nome,
          pontos: p.pontos,
        })))
      } catch (error) {
        console.error('Erro ao carregar punições:', error)
      }
    }
  }, [isClient, isOpen])

  // Carregar punições do localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !isClient) return

    const punicoesSalvas = localStorage.getItem('punicoes')
    if (punicoesSalvas) {
      try {
        const punicoesParsed = JSON.parse(punicoesSalvas)
        setTodasPunicoes(punicoesParsed.map((p: any) => ({
          id: p.id,
          nome: p.nome,
          pontos: p.pontos,
        })))
      } catch (error) {
        console.error('Erro ao carregar punições:', error)
      }
    }
  }, [isClient, isOpen])

  useEffect(() => {
    if (isOpen) {
      if (eventoEditando) {
        // Preencher campos com dados do evento
        const tipo = eventoEditando.tipoEvento || 'Promoção'
        setTipoEvento(tipo)
        // Se for Exoneração ou Suspensão, classificação sempre Negativo
        setClassificacao((tipo === 'Exoneração' || tipo === 'Suspensão') ? 'Negativo' : (eventoEditando.classificacao || 'Sem classificação'))
        setCargoAnterior(eventoEditando.cargoAnterior || '')
        setNovoCargo(eventoEditando.novoCargo || '')
        setTitulo(eventoEditando.titulo || '')
        setDescricao(eventoEditando.descricao || '')
        setRealizadoPor(eventoEditando.realizadoPor || '')
        const dataInicialValue = eventoEditando.dataInicial || ''
        const dataFinalValue = eventoEditando.dataFinal || ''
        const dataTreinamentoValue = eventoEditando.dataTreinamento || ''
        setDataInicial(dataInicialValue)
        setDataFinal(dataFinalValue)
        setDataTreinamento(dataTreinamentoValue)
        setTipoTreinamento(eventoEditando.tipoTreinamento || '')
        const dataOcorrenciaValue = eventoEditando.dataOcorrencia || ''
        setDataOcorrencia(dataOcorrenciaValue)
        setOficiaisEnvolvidos(eventoEditando.oficiaisEnvolvidos || [])
        setInfracoes(eventoEditando.infracoes || [])
        setPunicoes(eventoEditando.punicoes || [])
        try {
          setDataInicialDate(dataInicialValue ? new Date(dataInicialValue) : null)
          setDataFinalDate(dataFinalValue ? new Date(dataFinalValue) : null)
          setDataTreinamentoDate(dataTreinamentoValue ? new Date(dataTreinamentoValue) : null)
          setDataOcorrenciaDate(dataOcorrenciaValue ? new Date(dataOcorrenciaValue) : null)
        } catch (error) {
          console.error('Erro ao criar datas:', error)
          setDataInicialDate(null)
          setDataFinalDate(null)
          setDataTreinamentoDate(null)
          setDataOcorrenciaDate(null)
        }
      } else {
        // Resetar campos quando abrir o modal (criação)
        setTipoEvento('Promoção')
        setClassificacao('Sem classificação')
        setCargoAnterior('')
        setNovoCargo('')
        setTitulo('')
        setDescricao('')
        setRealizadoPor('')
        setDataInicial('')
        setDataFinal('')
        setDataInicialDate(null)
        setDataFinalDate(null)
        setDataTreinamento('')
        setDataTreinamentoDate(null)
        setTipoTreinamento('')
        setDataOcorrencia('')
        setDataOcorrenciaDate(null)
        setOficiaisEnvolvidos([])
        setInfracoes([])
        setPunicoes([])
      }
    }
  }, [isOpen, eventoEditando])

  // Sincronizar dataInicial quando dataInicialDate mudar
  useEffect(() => {
    if (dataInicialDate) {
      const yyyy = dataInicialDate.getFullYear()
      const mm = String(dataInicialDate.getMonth() + 1).padStart(2, '0')
      const dd = String(dataInicialDate.getDate()).padStart(2, '0')
      setDataInicial(`${yyyy}-${mm}-${dd}`)
    } else {
      setDataInicial('')
    }
  }, [dataInicialDate])

  // Sincronizar dataFinal quando dataFinalDate mudar
  useEffect(() => {
    if (dataFinalDate) {
      const yyyy = dataFinalDate.getFullYear()
      const mm = String(dataFinalDate.getMonth() + 1).padStart(2, '0')
      const dd = String(dataFinalDate.getDate()).padStart(2, '0')
      setDataFinal(`${yyyy}-${mm}-${dd}`)
    } else {
      setDataFinal('')
    }
  }, [dataFinalDate])

  // Sincronizar dataTreinamento quando dataTreinamentoDate mudar
  useEffect(() => {
    if (dataTreinamentoDate) {
      const yyyy = dataTreinamentoDate.getFullYear()
      const mm = String(dataTreinamentoDate.getMonth() + 1).padStart(2, '0')
      const dd = String(dataTreinamentoDate.getDate()).padStart(2, '0')
      setDataTreinamento(`${yyyy}-${mm}-${dd}`)
    } else {
      setDataTreinamento('')
    }
  }, [dataTreinamentoDate])

  // Sincronizar dataOcorrencia quando dataOcorrenciaDate mudar
  useEffect(() => {
    if (dataOcorrenciaDate) {
      const yyyy = dataOcorrenciaDate.getFullYear()
      const mm = String(dataOcorrenciaDate.getMonth() + 1).padStart(2, '0')
      const dd = String(dataOcorrenciaDate.getDate()).padStart(2, '0')
      setDataOcorrencia(`${yyyy}-${mm}-${dd}`)
    } else {
      setDataOcorrencia('')
    }
  }, [dataOcorrenciaDate])

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

    // Validação: se for Suspensão, as datas são obrigatórias
    if (tipoEvento === 'Suspensão' && (!dataInicial || !dataFinal)) {
      alert('Por favor, preencha a data inicial e a data final para a suspensão.')
      return
    }

    // Validação: data final deve ser maior ou igual à data inicial
    if (tipoEvento === 'Suspensão' && dataInicial && dataFinal) {
      const dataInicialObj = new Date(dataInicial)
      const dataFinalObj = new Date(dataFinal)
      if (dataFinalObj < dataInicialObj) {
        alert('A data final deve ser maior ou igual à data inicial.')
        return
      }
    }

    // Validação: se for Treinamento, data e tipo são obrigatórios
    if (tipoEvento === 'Treinamento' && (!dataTreinamento || !tipoTreinamento)) {
      alert('Por favor, preencha a data e o tipo do treinamento.')
      return
    }

    // Validação: se for Ocorrência, data é obrigatória
    if (tipoEvento === 'Ocorrência' && !dataOcorrencia) {
      alert('Por favor, preencha a data da ocorrência.')
      return
    }

    const alteracaoData = {
      tipoEvento: tipoEvento,
      classificacao: (tipoEvento === 'Exoneração' || tipoEvento === 'Suspensão') ? 'Negativo' : classificacao,
      cargoAnterior: (tipoEvento === 'Exoneração' || tipoEvento === 'Suspensão' || tipoEvento === 'Treinamento' || tipoEvento === 'Ocorrência') ? undefined : (cargoAnterior || undefined),
      novoCargo: (tipoEvento === 'Exoneração' || tipoEvento === 'Suspensão' || tipoEvento === 'Treinamento' || tipoEvento === 'Ocorrência') ? undefined : (novoCargo || undefined),
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      realizadoPor: realizadoPor.trim() || undefined,
      dataInicial: tipoEvento === 'Suspensão' ? dataInicial.trim() : undefined,
      dataFinal: tipoEvento === 'Suspensão' ? dataFinal.trim() : undefined,
      dataTreinamento: tipoEvento === 'Treinamento' ? dataTreinamento.trim() : undefined,
      tipoTreinamento: tipoEvento === 'Treinamento' ? tipoTreinamento : undefined,
      dataOcorrencia: tipoEvento === 'Ocorrência' ? dataOcorrencia.trim() : undefined,
      oficiaisEnvolvidos: tipoEvento === 'Ocorrência' ? oficiaisEnvolvidos : undefined,
      infracoes: tipoEvento === 'Ocorrência' ? infracoes : undefined,
      punicoes: tipoEvento === 'Ocorrência' ? punicoes : undefined,
    }

    if (isEditMode && onUpdate) {
      onUpdate(alteracaoData)
    } else if (onCreate) {
      onCreate(alteracaoData)
    }

    onClose()
  }

  if (!isOpen || !isClient) return null

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} contentClassName="max-w-2xl" overlayClassName="overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Editar Alteração' : 'Adicionar Alterações'}
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
          {/* Tipo de Evento e Classificação - lado a lado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tipoEvento" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Evento <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="tipoEvento"
                  value={tipoEvento}
                  onChange={(e) => {
                    setTipoEvento(e.target.value)
                    // Se for Exoneração ou Suspensão, fixar classificação como Negativo
                    if (e.target.value === 'Exoneração' || e.target.value === 'Suspensão') {
                      setClassificacao('Negativo')
                    }
                    // Se não for Suspensão, limpar as datas de suspensão
                    if (e.target.value !== 'Suspensão') {
                      setDataInicial('')
                      setDataFinal('')
                      setDataInicialDate(null)
                      setDataFinalDate(null)
                    }
                    // Se não for Treinamento, limpar os campos de treinamento
                    if (e.target.value !== 'Treinamento') {
                      setDataTreinamento('')
                      setDataTreinamentoDate(null)
                      setTipoTreinamento('')
                    }
                  }}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10"
                >
                  <option value="Promoção">Promoção</option>
                  <option value="Rebaixamento">Rebaixamento</option>
                  <option value="Exoneração">Exoneração</option>
                  <option value="Suspensão">Suspensão</option>
                  <option value="Treinamento">Treinamento</option>
                  <option value="Ocorrência">Ocorrência</option>
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
              <label htmlFor="classificacao" className="block text-sm font-medium text-gray-700 mb-2">
                Classificação
              </label>
              <div className="relative">
                <select
                  id="classificacao"
                  value={classificacao}
                  onChange={(e) => setClassificacao(e.target.value)}
                  disabled={tipoEvento === 'Exoneração' || tipoEvento === 'Suspensão'}
                  className={`w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none pr-10 ${
                    (tipoEvento === 'Exoneração' || tipoEvento === 'Suspensão') ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <option value="Sem classificação">Sem classificação</option>
                  <option value="Neutro">Neutro</option>
                  <option value="Positivo">Positivo</option>
                  <option value="Negativo">Negativo</option>
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

          {/* Cargo Anterior e Novo Cargo - lado a lado (oculto para Exoneração, Suspensão, Treinamento e Ocorrência) */}
          {tipoEvento !== 'Exoneração' && tipoEvento !== 'Suspensão' && tipoEvento !== 'Treinamento' && tipoEvento !== 'Ocorrência' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cargoAnterior" className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo Anterior
                </label>
                <div className="relative">
                  <select
                    id="cargoAnterior"
                    value={cargoAnterior}
                    onChange={(e) => setCargoAnterior(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10"
                  >
                    <option value="">Selecione</option>
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

              <div>
                <label htmlFor="novoCargo" className="block text-sm font-medium text-gray-700 mb-2">
                  Novo Cargo
                </label>
                <div className="relative">
                  <select
                    id="novoCargo"
                    value={novoCargo}
                    onChange={(e) => setNovoCargo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10"
                  >
                    <option value="">Selecione</option>
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
            </div>
          )}

          {/* Data Inicial e Data Final - apenas para Suspensão */}
          {tipoEvento === 'Suspensão' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dataInicial" className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inicial <span className="text-red-500">*</span>
                </label>
                <div className="relative [&_.react-datepicker__input-container]:w-full">
                  {isClient && DatePicker ? (
                    <DatePicker
                      selected={dataInicialDate}
                      onChange={(date: Date | null) => setDataInicialDate(date)}
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
                      value={dataInicial || ''}
                      readOnly
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900"
                      placeholder="Carregando..."
                    />
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="dataFinal" className="block text-sm font-medium text-gray-700 mb-2">
                  Data Final <span className="text-red-500">*</span>
                </label>
                <div className="relative [&_.react-datepicker__input-container]:w-full">
                  {isClient && DatePicker ? (
                    <DatePicker
                      selected={dataFinalDate}
                      onChange={(date: Date | null) => setDataFinalDate(date)}
                      dateFormat="dd/MM/yyyy"
                      className="w-full"
                      placeholderText="Selecione a data"
                      showPopperArrow={false}
                      popperClassName="react-datepicker-popper-custom"
                      minDate={dataInicialDate || undefined}
                      required
                    />
                  ) : (
                    <input
                      type="text"
                      value={dataFinal || ''}
                      readOnly
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900"
                      placeholder="Carregando..."
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data do Treinamento e Tipo - apenas para Treinamento */}
          {tipoEvento === 'Treinamento' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dataTreinamento" className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Treinamento <span className="text-red-500">*</span>
                </label>
                <div className="relative [&_.react-datepicker__input-container]:w-full">
                  {isClient && DatePicker ? (
                    <DatePicker
                      selected={dataTreinamentoDate}
                      onChange={(date: Date | null) => setDataTreinamentoDate(date)}
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
                      value={dataTreinamento || ''}
                      readOnly
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900"
                      placeholder="Carregando..."
                    />
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="tipoTreinamento" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Treinamento <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="tipoTreinamento"
                    value={tipoTreinamento}
                    onChange={(e) => setTipoTreinamento(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 appearance-none cursor-pointer pr-10"
                  >
                    <option value="">Selecione</option>
                    <option value="Curso">Curso</option>
                    <option value="Recrutamento">Recrutamento</option>
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
          )}

          {/* Campos específicos para Ocorrência */}
          {tipoEvento === 'Ocorrência' && (
            <>
              {/* Data da Ocorrência */}
              <div>
                <label htmlFor="dataOcorrencia" className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Ocorrência <span className="text-red-500">*</span>
                </label>
                <div className="relative [&_.react-datepicker__input-container]:w-full">
                  {isClient && DatePicker ? (
                    <DatePicker
                      selected={dataOcorrenciaDate}
                      onChange={(date: Date | null) => setDataOcorrenciaDate(date)}
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
                      value={dataOcorrencia || ''}
                      readOnly
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900"
                      placeholder="Carregando..."
                    />
                  )}
                </div>
              </div>

              {/* Oficiais Envolvidos */}
              <div>
                <label htmlFor="oficiaisEnvolvidos" className="block text-sm font-medium text-gray-700 mb-2">
                  Oficiais Envolvidos
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                  {!militares || militares.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum militar cadastrado</p>
                  ) : (
                    <div className="space-y-2">
                      {militares.map((militar) => (
                        <label key={militar.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={oficiaisEnvolvidos.includes(militar.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setOficiaisEnvolvidos([...oficiaisEnvolvidos, militar.id])
                              } else {
                                setOficiaisEnvolvidos(oficiaisEnvolvidos.filter(id => id !== militar.id))
                              }
                            }}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-900">{militar.nomeCompleto}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {oficiaisEnvolvidos.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {oficiaisEnvolvidos.length} militar(es) selecionado(s)
                  </p>
                )}
              </div>

              {/* Infrações */}
              <div>
                <label htmlFor="infracoes" className="block text-sm font-medium text-gray-700 mb-2">
                  Infrações
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                  {!todasInfracoes || todasInfracoes.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma infração cadastrada</p>
                  ) : (
                    <div className="space-y-2">
                      {todasInfracoes.map((infracao) => {
                        const getGravidadeColor = (gravidade: string) => {
                          switch (gravidade) {
                            case 'Leve':
                              return 'bg-yellow-100 text-yellow-800'
                            case 'Média':
                              return 'bg-orange-100 text-orange-800'
                            case 'Grave':
                              return 'bg-red-100 text-red-800'
                            case 'Gravíssima':
                              return 'bg-purple-100 text-purple-800'
                            default:
                              return 'bg-gray-100 text-gray-800'
                          }
                        }
                        return (
                          <label key={infracao.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={infracoes.includes(infracao.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setInfracoes([...infracoes, infracao.id])
                                } else {
                                  setInfracoes(infracoes.filter(id => id !== infracao.id))
                                }
                              }}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm text-gray-900">{infracao.nome}</span>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getGravidadeColor(infracao.gravidade)}`}>
                                {infracao.gravidade}
                              </span>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
                {infracoes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {infracoes.length} infração(ões) selecionada(s)
                  </p>
                )}
              </div>

              {/* Punições Aplicadas */}
              <div>
                <label htmlFor="punicoes" className="block text-sm font-medium text-gray-700 mb-2">
                  Punições Aplicadas
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                  {!todasPunicoes || todasPunicoes.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma punição cadastrada</p>
                  ) : (
                    <div className="space-y-2">
                      {todasPunicoes.map((punicao) => (
                        <label key={punicao.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={punicoes.includes(punicao.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPunicoes([...punicoes, punicao.id])
                              } else {
                                setPunicoes(punicoes.filter(id => id !== punicao.id))
                              }
                            }}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm text-gray-900">{punicao.nome}</span>
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {punicao.pontos} ponto(s)
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {punicoes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {punicoes.length} punição(ões) selecionada(s)
                  </p>
                )}
              </div>
            </>
          )}

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
              placeholder="Digite o título"
              required
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
              placeholder="Digite a descrição"
              rows={4}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 resize-y"
            />
          </div>

          {/* Realizado por */}
          <div>
            <label htmlFor="realizadoPor" className="block text-sm font-medium text-gray-700 mb-2">
              Realizado por
            </label>
            <input
              id="realizadoPor"
              type="text"
              value={realizadoPor}
              onChange={(e) => setRealizadoPor(e.target.value)}
              placeholder="Nome de quem registrou o evento"
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
              {isEditMode ? 'Salvar Alteração' : 'Criar Alteração'}
            </button>
          </div>
        </form>
      </div>
    </BaseModal>
  )
}
