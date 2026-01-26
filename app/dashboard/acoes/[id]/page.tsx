'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDataSync } from '@/hooks/useDataSync'

type Acao = {
  id: string
  militarId: string
  militarNome?: string
  tipo: 'Prisão' | 'Curso' | 'Patrulha' | 'Operação'
  titulo: string
  alvoLocal: string
  data: string
  quantidadeHoras?: string
  descricao?: string
  dataCriacao: string
  horaCriacao: string
}

function formatarData(dataIso: string): string {
  if (!dataIso) return '-'
  try {
    const [yyyy, mm, dd] = dataIso.split('-')
    if (!yyyy || !mm || !dd) return dataIso
    return `${dd}/${mm}/${yyyy}`
  } catch {
    return dataIso
  }
}

export default function VisualizarAcaoPage() {
  const router = useRouter()
  const params = useParams()
  const [acao, setAcao] = useState<Acao | null>(null)
  const [loading, setLoading] = useState(true)

  // Sincronização via API
  const { data: acoesData } = useDataSync<Acao>({ 
    entity: 'acoes',
    pollingInterval: 2000
  })

  // Carregar ação da API
  useEffect(() => {
    if (acoesData && params.id) {
      const acaoEncontrada = acoesData.find((a: Acao) => a.id === params.id)
      if (acaoEncontrada) {
        setAcao(acaoEncontrada)
      } else {
        setAcao(null)
      }
      setLoading(false)
    }
  }, [acoesData, params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!acao) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Ação não encontrada</p>
          <button
            onClick={() => router.push('/dashboard/acoes')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/acoes')}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{acao.titulo}</h1>
          <p className="text-gray-600 mt-1">Detalhes da ação operacional</p>
        </div>
      </div>

      {/* Card de Informações */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Militar</label>
            <p className="text-lg text-gray-900">{acao.militarNome || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Tipo</label>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              acao.tipo === 'Prisão' ? 'bg-red-100 text-red-800' :
              acao.tipo === 'Curso' ? 'bg-blue-100 text-blue-800' :
              acao.tipo === 'Patrulha' ? 'bg-purple-100 text-purple-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {acao.tipo}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Alvo/Local</label>
            <p className="text-lg text-gray-900">{acao.alvoLocal}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Data</label>
            <p className="text-lg text-gray-900">{formatarData(acao.data)}</p>
          </div>
          {acao.quantidadeHoras && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Quantidade/Horas</label>
              <p className="text-lg text-gray-900">{acao.quantidadeHoras}</p>
            </div>
          )}
          {acao.descricao && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Descrição</label>
              <p className="text-gray-900 whitespace-pre-wrap">{acao.descricao}</p>
            </div>
          )}
          <div className="col-span-2 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Registrado em {acao.dataCriacao} às {acao.horaCriacao}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
