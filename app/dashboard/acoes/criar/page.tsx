'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import 'react-datepicker/dist/react-datepicker.css'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import { logActivity } from '@/lib/activity-log'
import { usePermissions } from '@/hooks/usePermissions'

type DatePickerComponent = React.ComponentType<any>

type Militar = {
  id: string
  nomeCompleto: string
}

type Acao = {
  id: string
  militarId: string
  tipo: 'Prisão' | 'Curso' | 'Patrulha' | 'Operação'
  titulo: string
  alvoLocal: string
  data: string
  quantidadeHoras?: string
  descricao?: string
}

export default function CriarAcaoPage() {
  const router = useRouter()
  const { user } = usePermissions()
  const [isClient, setIsClient] = useState(false)
  const [DatePicker, setDatePicker] = useState<DatePickerComponent | null>(null)
  const [militarId, setMilitarId] = useState('')
  const [tipo, setTipo] = useState<'Prisão' | 'Curso' | 'Patrulha' | 'Operação'>('Prisão')
  const [titulo, setTitulo] = useState('')
  const [alvoLocal, setAlvoLocal] = useState('')
  const [data, setData] = useState('')
  const [dataDate, setDataDate] = useState<Date | null>(null)
  const [quantidadeHoras, setQuantidadeHoras] = useState('')
  const [descricao, setDescricao] = useState('')

  // Sincronização via API
  const { data: militaresData } = useDataSync<Militar>({ 
    entity: 'militares',
    pollingInterval: 2000
  })
  const { create: createAcao } = useDataMutation<Acao>('acoes')

  const militares = militaresData?.map((m: any) => ({
    id: m.id,
    nomeCompleto: m.nomeCompleto,
  })) || []

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      import('react-datepicker').then((mod) => {
        setDatePicker(() => mod.default)
      })
    }
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!militarId || !titulo || !alvoLocal || !data) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const militar = militares.find(m => m.id === militarId)
    const agora = new Date()
    const dataCriacao = agora.toLocaleDateString('pt-BR')
    const horaCriacao = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const novaAcao: Acao & { dataCriacao: string; horaCriacao: string; militarNome?: string } = {
      id: `acao_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      militarId,
      militarNome: militar?.nomeCompleto,
      tipo,
      titulo: titulo.trim(),
      alvoLocal: alvoLocal.trim(),
      data,
      quantidadeHoras: quantidadeHoras.trim() || undefined,
      descricao: descricao.trim() || undefined,
      dataCriacao,
      horaCriacao,
    }

    const acaoCriada = await createAcao(novaAcao)
    if (acaoCriada) {
      logActivity('created', 'acao', acaoCriada.id, acaoCriada.titulo, user?.login)
      router.push('/dashboard/acoes')
    }
  }

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registrar Ação</h1>
          <p className="text-gray-600 mt-1">Preencha os dados da ação operacional</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium"
            >
              Registrar Ação
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
