'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import ConfirmarExclusaoModal from '@/components/ConfirmarExclusaoModal'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import { migrateLocalStorageToAPI } from '@/lib/migrate-data'

type Questao = {
  id: string
  numero: number
  texto: string
  categoria: string
}

type Prova = {
  id: string
  nomeConscrito: string
  nomeInstrutor: string
  questoes: Questao[]
  dataCriacao: string
  horaCriacao: string
  pontuacaoMinima: number
  avaliacoes?: Record<string, 'correto' | 'incorreto' | null>
  finalizada?: boolean
  dataFinalizacao?: string
  horaFinalizacao?: string
}

export default function ProvasPage() {
  const { isAdmin, temPermissao, loading: permissionsLoading } = usePermissions()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [provas, setProvas] = useState<Prova[]>([])
  const [provaParaExcluir, setProvaParaExcluir] = useState<Prova | null>(null)

  const podeVer = isAdmin || temPermissao('view_recrutamento')

  // Sincronização de dados via API
  const { data: provasData, refresh: refreshProvas } = useDataSync<Prova>({
    entity: 'provas',
    pollingInterval: 3000,
  })
  const { remove: removeProva } = useDataMutation<Prova>('provas')

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      migrateLocalStorageToAPI()
    }
  }, [])

  // Forçar refresh ao entrar na página (evita lista desatualizada)
  useEffect(() => {
    refreshProvas()
  }, [refreshProvas])

  useEffect(() => {
    if (!provasData) return
    const provasOrdenadas = [...provasData].sort((a, b) => {
      try {
        const da = a.dataCriacao?.split('/').reverse().join('-') || ''
        const db = b.dataCriacao?.split('/').reverse().join('-') || ''
        const tA = da ? new Date(da).getTime() : 0
        const tB = db ? new Date(db).getTime() : 0
        return tB - tA
      } catch {
        return 0
      }
    })
    setProvas(provasOrdenadas)
  }, [provasData])

  const handleDeleteProva = async () => {
    if (!provaParaExcluir) return

    const id = provaParaExcluir.id
    const r = await removeProva(id)
    if (r.ok) {
      setProvaParaExcluir(null)
      refreshProvas()
      setTimeout(() => refreshProvas(), 500)
    } else {
      alert('error' in r ? r.error : 'Erro ao excluir prova. Tente novamente.')
    }
  }

  const getStatusProva = (prova: Prova) => {
    if (!prova.finalizada) {
      return { tipo: 'pendente', texto: 'Pendente', cor: 'bg-yellow-100 text-yellow-700', icono: 'clock' }
    }

    const totalCorretas = Object.values(prova.avaliacoes || {}).filter(a => a === 'correto').length
    const totalQuestoes = prova.questoes.length

    if (totalCorretas >= prova.pontuacaoMinima) {
      return { tipo: 'aprovado', texto: `${totalCorretas}/${totalQuestoes} - APROVADO`, cor: 'bg-green-100 text-green-700', icono: 'check' }
    } else {
      return { tipo: 'reprovado', texto: `${totalCorretas}/${totalQuestoes} - REPROVADO`, cor: 'bg-red-100 text-red-700', icono: 'x' }
    }
  }

  const estatisticas = {
    total: provas.length,
    avaliadas: provas.filter(p => p.finalizada).length,
    pendentes: provas.filter(p => !p.finalizada).length,
    aprovados: provas.filter(p => {
      if (!p.finalizada) return false
      const totalCorretas = Object.values(p.avaliacoes || {}).filter(a => a === 'correto').length
      return totalCorretas >= p.pontuacaoMinima
    }).length,
    reprovados: provas.filter(p => {
      if (!p.finalizada) return false
      const totalCorretas = Object.values(p.avaliacoes || {}).filter(a => a === 'correto').length
      return totalCorretas < p.pontuacaoMinima
    }).length,
  }

  if (!isClient || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!podeVer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">PROVAS GERADAS ({estatisticas.total})</h1>
        </div>
        <button
          onClick={() => router.push('/dashboard/recrutamento')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-gray-900">{estatisticas.total}</div>
          <div className="text-sm text-gray-600 mt-1">TOTAL</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-gray-900">{estatisticas.avaliadas}</div>
          <div className="text-sm text-gray-600 mt-1">AVALIADAS</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-sm p-6 text-center border border-yellow-200">
          <div className="text-3xl font-bold text-yellow-700">{estatisticas.pendentes}</div>
          <div className="text-sm text-yellow-600 mt-1">PENDENTES</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow-sm p-6 text-center border border-green-200">
          <div className="text-3xl font-bold text-green-700">{estatisticas.aprovados}</div>
          <div className="text-sm text-green-600 mt-1">APROVADOS</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow-sm p-6 text-center border border-red-200">
          <div className="text-3xl font-bold text-red-700">{estatisticas.reprovados}</div>
          <div className="text-sm text-red-600 mt-1">REPROVADOS</div>
        </div>
      </div>

      {/* Lista de Provas */}
      <div className="space-y-4">
        {provas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">Nenhuma prova gerada ainda</p>
          </div>
        ) : (
          provas.map((prova) => {
            const status = getStatusProva(prova)
            return (
              <div key={prova.id} className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-600 mb-3">
                      Prova de Recrutamento - {prova.nomeConscrito}
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <span className="text-gray-600">Questões: </span>
                        <span className="font-medium text-gray-900">{prova.questoes.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Data: </span>
                        <span className="font-medium text-gray-900">{prova.dataCriacao}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Hora: </span>
                        <span className="font-medium text-gray-900">{prova.horaCriacao}</span>
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${status.cor}`}>
                      {status.icono === 'clock' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {status.icono === 'check' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {status.icono === 'x' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className="text-sm font-medium">{status.texto}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4">
                    <button
                      onClick={() => router.push(`/dashboard/recrutamento/${prova.id}`)}
                      className="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="Visualizar Prova"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setProvaParaExcluir(prova)}
                      className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Excluir Prova"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {provaParaExcluir && (
        <ConfirmarExclusaoModal
          isOpen={!!provaParaExcluir}
          onClose={() => setProvaParaExcluir(null)}
          onConfirm={handleDeleteProva}
          tipoItem="prova"
          itemNome={`Prova de ${provaParaExcluir.nomeConscrito}`}
        />
      )}
    </div>
  )
}
