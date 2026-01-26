'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import 'react-datepicker/dist/react-datepicker.css'

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

export default function EditarAcaoPage() {
  const router = useRouter()
  const params = useParams()
  const [isClient, setIsClient] = useState(false)
  const [DatePicker, setDatePicker] = useState<DatePickerComponent | null>(null)
  const [militares, setMilitares] = useState<Militar[]>([])
  const [militarId, setMilitarId] = useState('')
  const [tipo, setTipo] = useState<'Prisão' | 'Curso' | 'Patrulha' | 'Operação'>('Prisão')
  const [titulo, setTitulo] = useState('')
  const [alvoLocal, setAlvoLocal] = useState('')
  const [data, setData] = useState('')
  const [dataDate, setDataDate] = useState<Date | null>(null)
  const [quantidadeHoras, setQuantidadeHoras] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      import('react-datepicker').then((mod) => {
        setDatePicker(() => mod.default)
      })
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !isClient) return

    const militaresSalvos = localStorage.getItem('militares')
    if (militaresSalvos) {
      try {
        const militaresParsed = JSON.parse(militaresSalvos)
        setMilitares(militaresParsed.map((m: any) => ({
          id: m.id,
          nomeCompleto: m.nomeCompleto,
        })))
      } catch (error) {
        console.error('Erro ao carregar militares:', error)
      }
    }

    // Carregar ação para editar
    if (params.id) {
      const acoesSalvas = localStorage.getItem('acoes')
      if (acoesSalvas) {
        try {
          const acoesParsed = JSON.parse(acoesSalvas)
          const acaoEncontrada = acoesParsed.find((a: Acao & { militarNome?: string }) => a.id === params.id)
          if (acaoEncontrada) {
            setMilitarId(acaoEncontrada.militarId)
            setTipo(acaoEncontrada.tipo)
            setTitulo(acaoEncontrada.titulo)
            setAlvoLocal(acaoEncontrada.alvoLocal)
            setData(acaoEncontrada.data)
            setQuantidadeHoras(acaoEncontrada.quantidadeHoras || '')
            setDescricao(acaoEncontrada.descricao || '')
            try {
              setDataDate(new Date(acaoEncontrada.data))
            } catch (error) {
              console.error('Erro ao criar data:', error)
            }
          }
        } catch (error) {
          console.error('Erro ao carregar ação:', error)
        }
      }
    }
    setLoading(false)
  }, [params.id, isClient])

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

    const militar = militares.find(m => m.id === militarId)

    const acoesSalvas = localStorage.getItem('acoes')
    if (acoesSalvas) {
      try {
        const acoesParsed = JSON.parse(acoesSalvas)
        const acoesAtualizadas = acoesParsed.map((a: Acao & { militarNome?: string; dataCriacao?: string; horaCriacao?: string }) => {
          if (a.id === params.id) {
            return {
              ...a,
              militarId,
              militarNome: militar?.nomeCompleto,
              tipo,
              titulo: titulo.trim(),
              alvoLocal: alvoLocal.trim(),
              data,
              quantidadeHoras: quantidadeHoras.trim() || undefined,
              descricao: descricao.trim() || undefined,
            }
          }
          return a
        })
        localStorage.setItem('acoes', JSON.stringify(acoesAtualizadas))
        window.dispatchEvent(new Event('storage'))
        router.push('/dashboard/acoes')
      } catch (error) {
        console.error('Erro ao atualizar ação:', error)
      }
    }
  }

  if (!isClient || loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Editar Ação</h1>
          <p className="text-gray-600 mt-1">Atualize os dados da ação operacional</p>
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
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
