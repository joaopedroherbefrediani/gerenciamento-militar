'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import CriarAlteracaoModal from '@/components/CriarAlteracaoModal'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'

type Militar = {
  id: string
  nomeCompleto: string
  cargo: string
  cargoNome?: string
  matricula?: string
  discordId?: string
  dataAdmissao: string
  status: 'Ativo' | 'Suspenso' | 'Exonerado'
  observacoes?: string
}

type Evento = {
  id: string
  militarId: string
  tipoEvento: string
  classificacao: string
  cargoAnterior?: string
  cargoAnteriorNome?: string
  novoCargo?: string
  novoCargoNome?: string
  titulo: string
  descricao?: string
  realizadoPor?: string
  dataCriacao: string
  horaCriacao: string
  dataInicial?: string // Para Suspensão (YYYY-MM-DD)
  dataFinal?: string // Para Suspensão (YYYY-MM-DD)
  dataTreinamento?: string // Para Treinamento (YYYY-MM-DD)
  tipoTreinamento?: string // Para Treinamento: "Curso" ou "Recrutamento"
  dataOcorrencia?: string // Para Ocorrência (YYYY-MM-DD)
  oficiaisEnvolvidos?: string[] // Para Ocorrência: IDs dos militares envolvidos
  infracoes?: string[] // Para Ocorrência: IDs das infrações (futuro)
  punicoes?: string[] // Para Ocorrência: IDs das punições (futuro)
  anexos?: string[] // Para Ocorrência: URLs/base64 das imagens (até 3)
}

export default function DetalhesMilitarPage() {
  const router = useRouter()
  const params = useParams()
  const { isAdmin, temPermissao } = usePermissions()
  const [militar, setMilitar] = useState<Militar | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAlteracaoModalOpen, setIsAlteracaoModalOpen] = useState(false)
  const [cargos, setCargos] = useState<Array<{ id: string; nome: string }>>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventoParaEditar, setEventoParaEditar] = useState<Evento | null>(null)
  const [isDeleteEventoModalOpen, setIsDeleteEventoModalOpen] = useState(false)
  
  const podeVer = isAdmin || temPermissao('view_militares')
  const podeEditar = isAdmin || temPermissao('edit_militares')
  const [eventoParaDeletar, setEventoParaDeletar] = useState<Evento | null>(null)
  const [todosMilitares, setTodosMilitares] = useState<Array<{ id: string; nomeCompleto: string }>>([])
  const [todasInfracoes, setTodasInfracoes] = useState<Array<{ id: string; nome: string; gravidade: string }>>([])
  const [todasPunicoes, setTodasPunicoes] = useState<Array<{ id: string; nome: string; pontos: number }>>([])

  // Sincronização via API
  const { data: militaresData, refresh: refreshMilitares } = useDataSync<Militar>({ 
    entity: 'militares',
    pollingInterval: 2000
  })
  const { data: cargosData } = useDataSync<any>({ 
    entity: 'cargos',
    pollingInterval: 2000
  })
  const { data: eventosData, refresh: refreshEventos } = useDataSync<Evento>({ 
    entity: 'eventos',
    pollingInterval: 2000
  })
  const { data: infracoesData } = useDataSync<any>({ 
    entity: 'infracoes',
    pollingInterval: 2000
  })
  const { data: punicoesData } = useDataSync<any>({ 
    entity: 'punicoes',
    pollingInterval: 2000
  })

  // Mutations para criar/atualizar/deletar
  const { create: createEvento, update: updateEvento, remove: removeEvento } = useDataMutation<Evento>('eventos')
  const { update: updateMilitar } = useDataMutation<Militar>('militares')

  // Carregar militar da API
  useEffect(() => {
    if (!params.id) {
      setLoading(false)
      return
    }

    // Aguardar até que os dados sejam carregados
    if (militaresData === undefined) {
      // Ainda está carregando, mantém loading como true
      return
    }

    // Dados foram carregados (pode ser array vazio ou com dados)
    const militarEncontrado = (militaresData || []).find((m: Militar) => m.id === params.id)
    if (militarEncontrado) {
      setMilitar(militarEncontrado)
    } else {
      setMilitar(null)
    }
    setLoading(false)
  }, [militaresData, params.id])

  // Carregar cargos
  useEffect(() => {
    if (cargosData) {
      setCargos(cargosData.map((c: any) => ({ id: c.id, nome: c.nome })))
    }
  }, [cargosData])

  // Carregar todos os militares
  useEffect(() => {
    if (militaresData) {
      setTodosMilitares(militaresData.map((m: Militar) => ({ id: m.id, nomeCompleto: m.nomeCompleto })))
    }
  }, [militaresData])

  // Carregar infrações
  useEffect(() => {
    if (infracoesData) {
      setTodasInfracoes(infracoesData.map((i: any) => ({ id: i.id, nome: i.nome, gravidade: i.gravidade })))
    }
  }, [infracoesData])

  // Carregar punições
  useEffect(() => {
    if (punicoesData) {
      setTodasPunicoes(punicoesData.map((p: any) => ({ id: p.id, nome: p.nome, pontos: p.pontos })))
    }
  }, [punicoesData])

  // Carregar eventos do militar
  useEffect(() => {
    if (eventosData && params.id) {
      const eventosDoMilitar = eventosData
        .filter((e: Evento) => e.militarId === params.id)
        .sort((a: Evento, b: Evento) => {
          // Ordenar por data e hora mais recente primeiro
          const dataA = new Date(`${a.dataCriacao} ${a.horaCriacao}`)
          const dataB = new Date(`${b.dataCriacao} ${b.horaCriacao}`)
          return dataB.getTime() - dataA.getTime()
        })
      setEventos(eventosDoMilitar)
    } else {
      setEventos([])
    }
  }, [eventosData, params.id])

  const eventosPositivos = eventos.filter((e: Evento) => e.classificacao === 'Positivo')
  const eventosNegativos = eventos.filter((e: Evento) => e.classificacao === 'Negativo')

  // Verificar suspensões expiradas usando dados da API
  useEffect(() => {
    if (!militaresData || !eventosData) return

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const militaresParaAtualizar: Array<{ id: string; status: 'Ativo' }> = []

    militaresData.forEach((m: Militar) => {
      if (m.status === 'Suspenso') {
        const suspensoes = eventosData
          .filter((e: Evento) => 
            e.militarId === m.id && 
            e.tipoEvento === 'Suspensão' && 
            e.dataFinal
          )
          .sort((a: Evento, b: Evento) => {
            const dataA = new Date(a.dataFinal!)
            const dataB = new Date(b.dataFinal!)
            return dataB.getTime() - dataA.getTime()
          })

        if (suspensoes.length > 0) {
          const suspensaoMaisRecente = suspensoes[0]
          if (suspensaoMaisRecente.dataFinal) {
            try {
              const dataFinal = new Date(suspensaoMaisRecente.dataFinal)
              if (!isNaN(dataFinal.getTime())) {
                dataFinal.setHours(0, 0, 0, 0)
                
                if (dataFinal < hoje) {
                  militaresParaAtualizar.push({ id: m.id, status: 'Ativo' })
                }
              }
            } catch (error) {
              console.error('Erro ao processar data final da suspensão:', error)
            }
          }
        }
      }
    })

    // Atualizar militares com suspensões expiradas
    if (militaresParaAtualizar.length > 0) {
      militaresParaAtualizar.forEach(async ({ id, status }) => {
        await updateMilitar(id, { status })
      })
      refreshMilitares()
    }
  }, [militaresData, eventosData, updateMilitar, refreshMilitares])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-100 text-green-800'
      case 'Suspenso':
        return 'bg-yellow-100 text-yellow-800'
      case 'Exonerado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'ATIVO'
      case 'Suspenso':
        return 'SUSPENSO'
      case 'Exonerado':
        return 'EXONERADO'
      default:
        return status.toUpperCase()
    }
  }

  const getEventoIcon = (classificacao?: string) => {
    const classificacaoLower = classificacao?.toLowerCase() || ''
    
    if (classificacaoLower === 'positivo') {
      return {
        bgColor: 'bg-green-500',
        icon: (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      }
    } else if (classificacaoLower === 'negativo') {
      return {
        bgColor: 'bg-red-500',
        icon: (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        )
      }
    } else {
      // Neutro, Sem classificação ou qualquer outro valor
      return {
        bgColor: 'bg-yellow-100',
        icon: (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      }
    }
  }

  const formatarData = (dataIso: string) => {
    if (!dataIso) return '-'
    try {
      const [ano, mes, dia] = dataIso.split('-')
      return `${dia}/${mes}/${ano}`
    } catch {
      return dataIso
    }
  }

  const getInicialNome = (nome: string) => {
    if (!nome) return '?'
    return nome.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!militar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Militar não encontrado</p>
          <button
            onClick={() => router.push('/dashboard/militares')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Voltar
          </button>
        </div>
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
      {/* Botão Voltar */}
      <button
        onClick={() => router.push('/dashboard/militares')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </button>

      {/* Card de Informações do Militar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {getInicialNome(militar.nomeCompleto)}
          </div>

          {/* Informações */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {militar.nomeCompleto}
            </h1>
            <p className="text-gray-600 mb-4">
              {militar.cargoNome || 'Sem cargo'}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Matrícula:</span> {militar.matricula || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Status:</span>{' '}
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(militar.status)}`}>
                    {getStatusText(militar.status)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Admissão:</span> {formatarData(militar.dataAdmissao)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Eventos */}
      <div className="grid grid-cols-2 gap-6">
        {/* Fatos Observados Positivos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Fatos Observados Positivos</h2>
            <div className="w-10 h-10 bg-green-500 rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900">{eventosPositivos.length}</p>
        </div>

        {/* Fatos Observados Negativos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Fatos Observados Negativos</h2>
            <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900">{eventosNegativos.length}</p>
        </div>
      </div>

      {/* Histórico de Eventos */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Histórico de Eventos</h2>
          {podeEditar && (
            <button
              onClick={() => setIsAlteracaoModalOpen(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Alterações
            </button>
          )}
        </div>
        {eventos.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">Nenhum evento registrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {eventos.map((evento: Evento) => {
              if (!evento) return null
              const eventoIcon = getEventoIcon(evento.classificacao)
              return (
              <div key={evento.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 flex-1">
                  {/* Ícone baseado na classificação */}
                  <div className={`w-10 h-10 ${eventoIcon?.bgColor || 'bg-yellow-100'} rounded flex items-center justify-center flex-shrink-0`}>
                    {eventoIcon?.icon || (
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Informações do evento */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{evento.titulo}</h3>
                    {evento.descricao && (
                      <p className="text-gray-700 mb-2">{evento.descricao}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {evento.realizadoPor && (
                        <span>Por: {evento.realizadoPor}</span>
                      )}
                      {evento.tipoEvento === 'Suspensão' && evento.dataInicial && evento.dataFinal && (
                        <span className="font-medium text-orange-600">
                          Período: {evento.dataInicial} até {evento.dataFinal}
                        </span>
                      )}
                      {evento.tipoEvento === 'Treinamento' && evento.dataTreinamento && (
                        <span className="font-medium text-blue-600">
                          Data: {formatarData(evento.dataTreinamento)} - {evento.tipoTreinamento || 'N/A'}
                        </span>
                      )}
                      {evento.tipoEvento === 'Ocorrência' && evento.dataOcorrencia && (
                        <span className="font-medium text-purple-600">
                          Data: {formatarData(evento.dataOcorrencia)}
                        </span>
                      )}
                      <span>{evento.dataCriacao} às {evento.horaCriacao}</span>
                    </div>
                    {evento.tipoEvento === 'Ocorrência' && evento.infracoes && evento.infracoes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Infrações:</p>
                        <div className="flex flex-wrap gap-2">
                          {evento.infracoes
                            .map((infracaoId: string) => {
                              return todasInfracoes.find((i: { id: string; nome: string; gravidade: string }) => i.id === infracaoId)
                            })
                            .filter((infracao): infracao is { id: string; nome: string; gravidade: string } => infracao !== undefined)
                            .map((infracao) => {
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
                                <span
                                  key={infracao.id}
                                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getGravidadeColor(infracao.gravidade)}`}
                                  title={infracao.nome}
                                >
                                  {infracao.nome}
                                </span>
                              )
                            })}
                        </div>
                      </div>
                    )}
                    {evento.tipoEvento === 'Ocorrência' && evento.punicoes && evento.punicoes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Punições Aplicadas:</p>
                        <div className="flex flex-wrap gap-2">
                          {evento.punicoes
                            .map((punicaoId: string) => {
                              return todasPunicoes.find((p: { id: string; nome: string; pontos: number }) => p.id === punicaoId)
                            })
                            .filter((punicao): punicao is { id: string; nome: string; pontos: number } => punicao !== undefined)
                            .map((punicao) => {
                              return (
                                <span
                                  key={punicao.id}
                                  className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  title={`${punicao.nome} - ${punicao.pontos} ponto(s)`}
                                >
                                  {punicao.nome} ({punicao.pontos} pts)
                                </span>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge e ações */}
                <div className="flex items-center gap-2 ml-4">
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                    {evento.tipoEvento}
                  </span>
                  {podeEditar && (
                    <>
                      <button
                        onClick={() => {
                          setEventoParaEditar(evento)
                          setIsAlteracaoModalOpen(true)
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar evento"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setEventoParaDeletar(evento)
                          setIsDeleteEventoModalOpen(true)
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir evento"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Criar/Editar Alteração */}
      {isAlteracaoModalOpen && podeEditar && (
        <CriarAlteracaoModal
          isOpen={isAlteracaoModalOpen}
          onClose={() => {
            setIsAlteracaoModalOpen(false)
            setEventoParaEditar(null)
          }}
          eventoEditando={eventoParaEditar}
          militares={todosMilitares}
          onCreate={async (alteracao) => {
            // Criar evento
            const agora = new Date()
            const dataCriacao = agora.toLocaleDateString('pt-BR')
            const horaCriacao = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            
            const cargoAnteriorObj = cargos.find((c: { id: string; nome: string }) => c.id === alteracao.cargoAnterior)
            const novoCargoObj = cargos.find((c: { id: string; nome: string }) => c.id === alteracao.novoCargo)
            
            const novoEvento: Evento = {
              id: `evento_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
              militarId: params.id as string,
              tipoEvento: alteracao.tipoEvento,
              classificacao: alteracao.classificacao,
              cargoAnterior: alteracao.cargoAnterior,
              cargoAnteriorNome: cargoAnteriorObj?.nome,
              novoCargo: alteracao.novoCargo,
              novoCargoNome: novoCargoObj?.nome,
              titulo: alteracao.titulo,
              descricao: alteracao.descricao,
              realizadoPor: alteracao.realizadoPor,
              dataCriacao,
              horaCriacao,
              dataInicial: alteracao.dataInicial,
              dataFinal: alteracao.dataFinal,
              dataTreinamento: alteracao.dataTreinamento,
              tipoTreinamento: alteracao.tipoTreinamento,
              dataOcorrencia: alteracao.dataOcorrencia,
              oficiaisEnvolvidos: alteracao.oficiaisEnvolvidos,
              infracoes: alteracao.infracoes,
              punicoes: alteracao.punicoes,
              anexos: alteracao.anexos,
            }

            // Salvar evento via API
            const eventoCriado = await createEvento(novoEvento)
            if (eventoCriado) {
              refreshEventos()
              
              // Se for promoção ou rebaixamento e tiver novo cargo, atualizar o cargo do militar
              if ((alteracao.tipoEvento === 'Promoção' || alteracao.tipoEvento === 'Rebaixamento') && alteracao.novoCargo && novoCargoObj) {
                await updateMilitar(params.id as string, {
                  cargo: alteracao.novoCargo,
                  cargoNome: novoCargoObj.nome,
                })
                refreshMilitares()
              }
              
              // Se for exoneração, atualizar status do militar para Exonerado
              if (alteracao.tipoEvento === 'Exoneração') {
                await updateMilitar(params.id as string, { status: 'Exonerado' })
                refreshMilitares()
              }
              
              // Se for suspensão, atualizar status do militar para Suspenso
              if (alteracao.tipoEvento === 'Suspensão') {
                await updateMilitar(params.id as string, { status: 'Suspenso' })
                refreshMilitares()
              }
            }
            
            setIsAlteracaoModalOpen(false)
          }}
          onUpdate={async (alteracao) => {
            if (!eventoParaEditar) return
            
            const cargoAnteriorObj = cargos.find((c: { id: string; nome: string }) => c.id === alteracao.cargoAnterior)
            const novoCargoObj = cargos.find((c: { id: string; nome: string }) => c.id === alteracao.novoCargo)
            
            // Atualizar evento via API
            const eventoAtualizado = await updateEvento(eventoParaEditar.id, {
              tipoEvento: alteracao.tipoEvento,
              classificacao: alteracao.classificacao,
              cargoAnterior: alteracao.cargoAnterior,
              cargoAnteriorNome: cargoAnteriorObj?.nome,
              novoCargo: alteracao.novoCargo,
              novoCargoNome: novoCargoObj?.nome,
              titulo: alteracao.titulo,
              descricao: alteracao.descricao,
              realizadoPor: alteracao.realizadoPor,
              dataInicial: alteracao.dataInicial,
              dataFinal: alteracao.dataFinal,
              dataTreinamento: alteracao.dataTreinamento,
              tipoTreinamento: alteracao.tipoTreinamento,
              dataOcorrencia: alteracao.dataOcorrencia,
              oficiaisEnvolvidos: alteracao.oficiaisEnvolvidos,
              infracoes: alteracao.infracoes,
              punicoes: alteracao.punicoes,
              anexos: alteracao.anexos,
            })

            if (eventoAtualizado) {
              refreshEventos()
              
              // Se for promoção ou rebaixamento e tiver novo cargo, atualizar o cargo do militar
              if ((alteracao.tipoEvento === 'Promoção' || alteracao.tipoEvento === 'Rebaixamento') && alteracao.novoCargo && novoCargoObj) {
                await updateMilitar(params.id as string, {
                  cargo: alteracao.novoCargo,
                  cargoNome: novoCargoObj.nome,
                })
                refreshMilitares()
              }
              
              // Se for exoneração, atualizar status do militar para Exonerado
              if (alteracao.tipoEvento === 'Exoneração') {
                await updateMilitar(params.id as string, { status: 'Exonerado' })
                refreshMilitares()
              }
              
              // Se for suspensão, atualizar status do militar para Suspenso
              if (alteracao.tipoEvento === 'Suspensão') {
                await updateMilitar(params.id as string, { status: 'Suspenso' })
                refreshMilitares()
              }
            }
            
            setEventoParaEditar(null)
            setIsAlteracaoModalOpen(false)
          }}
          cargos={cargos}
        />
      )}

      {/* Modal Confirmar Exclusão de Evento */}
      {isDeleteEventoModalOpen && eventoParaDeletar && (
        <div className="modal-overlay-fix">
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Confirmar Exclusão
              </h2>
              <button
                onClick={() => {
                  setIsDeleteEventoModalOpen(false)
                  setEventoParaDeletar(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Tem certeza que deseja excluir a alteração <span className="font-semibold">&quot;{eventoParaDeletar.titulo}&quot;</span>?
                Esta ação não pode ser desfeita.
              </p>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteEventoModalOpen(false)
                    setEventoParaDeletar(null)
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (eventoParaDeletar) {
                      const resultado = await removeEvento(eventoParaDeletar.id)
                      if (resultado.ok) {
                        refreshEventos()
                      }
                    }
                    setIsDeleteEventoModalOpen(false)
                    setEventoParaDeletar(null)
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
