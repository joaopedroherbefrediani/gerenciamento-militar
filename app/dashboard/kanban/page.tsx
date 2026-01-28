'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import confetti from 'canvas-confetti'
import { usePermissions } from '@/hooks/usePermissions'
import { logActivity } from '@/lib/activity-log'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import CriarCardModal from '@/components/CriarCardModal'
import ConfirmarExclusaoModal from '@/components/ConfirmarExclusaoModal'
import { migrateLocalStorageToAPI } from '@/lib/migrate-data'
import { KANBAN_TIPOS, KanbanCardTipo, getKanbanTipoBadgeClassName, getKanbanTipoLabel, normalizeKanbanTipo } from '@/lib/kanban-tipos'

interface Card {
  id: string
  titulo: string
  descricao: string
  status: 'fazer' | 'fazendo' | 'feito'
  tipo?: KanbanCardTipo
  ordem?: number
}

const COLUNAS = [
  { id: 'fazer', title: 'Fazer', color: 'bg-blue-500' },
  { id: 'fazendo', title: 'Fazendo', color: 'bg-yellow-500' },
  { id: 'feito', title: 'Feito', color: 'bg-green-500' },
]

export default function KanbanPage() {
  const { isAdmin, temPermissao, user } = usePermissions()
  const podeVer = isAdmin || temPermissao('view_kanban')
  const podeEditar = isAdmin || temPermissao('edit_kanban')

  const [isClient, setIsClient] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [cardEditando, setCardEditando] = useState<Card | null>(null)
  const [cardParaDeletar, setCardParaDeletar] = useState<Card | null>(null)
  const [visualizarApenas, setVisualizarApenas] = useState(false)

  const { data: cards, refresh: refreshCards } = useDataSync<Card>({ 
    entity: 'kanban',
    pollingInterval: 2000
  })
  const { create: createCard, update: updateCard, remove: removeCard } = useDataMutation<Card>('kanban')

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      migrateLocalStorageToAPI()
    }
  }, [])

  const orderIndexById = new Map((cards || []).map((c, idx) => [c.id, idx] as const))
  const getOrderKey = (c: Card) => (typeof c.ordem === 'number' ? c.ordem : (orderIndexById.get(c.id) ?? 0))
  const getCardsOrdenados = (status: Card['status']) =>
    (cards || []).filter((c) => c.status === status).slice().sort((a, b) => getOrderKey(a) - getOrderKey(b))
  const getProximaOrdem = (status: Card['status']) => getCardsOrdenados(status).length + 1

  const handleDragEnd = async (result: DropResult) => {
    if (!podeEditar) return
    if (!result.destination) return

    const { source, destination, draggableId } = result
    const statusOrigem = source.droppableId as Card['status']
    const statusDestino = destination.droppableId as Card['status']

    // Se não mudou nada, não faz nada
    if (statusOrigem === statusDestino && source.index === destination.index) return

    const origemOrdenada = getCardsOrdenados(statusOrigem)
    const destinoOrdenada = statusOrigem === statusDestino ? origemOrdenada : getCardsOrdenados(statusDestino)

    const cardMovido = origemOrdenada[source.index]
    if (!cardMovido || cardMovido.id !== draggableId) {
      // fallback: procurar pelo id, caso índices estejam divergentes
      const fallback = (cards || []).find((c) => c.id === draggableId)
      if (!fallback) return
      origemOrdenada.splice(source.index, 0, fallback)
    }

    // Remove da origem e insere no destino no índice correto
    const origemSemMovido = origemOrdenada.filter((c) => c.id !== draggableId)
    const destinoComInsercao = (statusOrigem === statusDestino ? origemSemMovido : destinoOrdenada.filter((c) => c.id !== draggableId)).slice()
    const cardInserido = { ...(cards || []).find((c) => c.id === draggableId)!, status: statusDestino }
    destinoComInsercao.splice(destination.index, 0, cardInserido)

    // Recalcular ordens (sequencial para evitar corrida de escrita no storage)
    if (statusOrigem === statusDestino) {
      for (let i = 0; i < destinoComInsercao.length; i++) {
        const c = destinoComInsercao[i]
        await updateCard(c.id, { ordem: i + 1 })
      }
    } else {
      for (let i = 0; i < origemSemMovido.length; i++) {
        const c = origemSemMovido[i]
        await updateCard(c.id, { ordem: i + 1, status: statusOrigem })
      }
      for (let i = 0; i < destinoComInsercao.length; i++) {
        const c = destinoComInsercao[i]
        await updateCard(c.id, { ordem: i + 1, status: statusDestino })
      }
    }
    
    // Nomes amigáveis das colunas para a log
    const nomesColunas: Record<string, string> = {
      fazer: 'Fazer',
      fazendo: 'Fazendo',
      feito: 'Feito'
    }

    // Log apenas quando mudou de coluna
    if (statusOrigem !== statusDestino) {
      const titulo = cardInserido?.titulo || (cards || []).find((c) => c.id === draggableId)?.titulo || 'Card'
      await logActivity(
        'updated',
        'kanban',
        draggableId,
        titulo,
        user?.login,
        `Usuário ${user?.login || 'Sistema'} moveu o card '${titulo}' da coluna '${nomesColunas[statusOrigem]}' para '${nomesColunas[statusDestino]}'.`
      )
    }

    // Se moveu para "Feito", soltar confetes
    if (statusOrigem !== statusDestino && statusDestino === 'feito') {
      dispararConfete()
    }

    refreshCards()
  }

  const dispararConfete = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#34D399', '#6EE7B7']
    })
  }

  const handleCreate = async (dados: any) => {
    const novoCard = {
      ...dados,
      tipo: normalizeKanbanTipo(dados?.tipo),
      ordem: getProximaOrdem(dados?.status || 'fazer'),
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
    const resultado = await createCard(novoCard)
    if (resultado) {
      await logActivity(
        'created', 
        'kanban', 
        resultado.id, 
        novoCard.titulo, 
        user?.login,
        `Usuário ${user?.login || 'Sistema'} criou o card '${novoCard.titulo}' na coluna '${dados.status === 'feito' ? 'Feito' : dados.status === 'fazendo' ? 'Fazendo' : 'Fazer'}'.`
      )

      if (dados.status === 'feito') {
        dispararConfete()
      }

      refreshCards()
    }
  }

  const handleUpdate = async (dados: any) => {
    const resultado = await updateCard(dados.id, { ...dados, tipo: normalizeKanbanTipo(dados?.tipo) })
    if (resultado) {
      await logActivity(
        'updated', 
        'kanban', 
        dados.id, 
        dados.titulo, 
        user?.login,
        `Usuário ${user?.login || 'Sistema'} editou o card '${dados.titulo}'.`
      )

      if (dados.status === 'feito') {
        const cardOriginal = cards?.find(c => c.id === dados.id)
        if (cardOriginal && cardOriginal.status !== 'feito') {
          dispararConfete()
        }
      }

      refreshCards()
    }
  }

  const handleDelete = async () => {
    if (!cardParaDeletar) return
    const r = await removeCard(cardParaDeletar.id)
    if (r.ok) {
      await logActivity(
        'deleted', 
        'kanban', 
        cardParaDeletar.id, 
        cardParaDeletar.titulo, 
        user?.login,
        `Usuário ${user?.login || 'Sistema'} deletou o card '${cardParaDeletar.titulo}'.`
      )
      refreshCards()
      setIsDeleteModalOpen(false)
      setCardParaDeletar(null)
    }
  }

  if (!isClient) return null

  if (!podeVer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar o Kanban.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-6 min-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quadro de Tarefas</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Organize e acompanhe o progresso das atividades</p>
        </div>
        {podeEditar && (
          <button
            onClick={() => {
              setCardEditando(null)
              setVisualizarApenas(false)
              setIsModalOpen(true)
            }}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Criar Novo Card
          </button>
        )}
      </div>

      {/* Legenda dos Tipos */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="font-bold text-gray-900 mb-3">Legenda de Tipos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {KANBAN_TIPOS.map((t) => (
            <div key={t.value} className="flex items-start gap-3">
              <span className={`mt-0.5 inline-flex items-center px-2 py-1 text-xs font-bold rounded-full border ${t.badgeClassName}`}>
                {t.label}
              </span>
              <p className="text-sm text-gray-600 leading-snug">{t.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-8">
          {COLUNAS.map((coluna) => (
            <div key={coluna.id} className="flex flex-col bg-gray-100 rounded-xl p-4 min-h-[500px] border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${coluna.color}`}></div>
                <h2 className="font-bold text-gray-700 uppercase tracking-wider text-sm">
                  {coluna.title}
                </h2>
                <span className="ml-auto bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                  {(cards || []).filter(c => c.status === coluna.id).length}
                </span>
              </div>

              <Droppable droppableId={coluna.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 space-y-3 transition-colors rounded-lg ${snapshot.isDraggingOver ? 'bg-gray-200/50' : ''}`}
                  >
                    {getCardsOrdenados(coluna.id as Card['status']).map((card, index) => (
                        <Draggable 
                          key={card.id} 
                          draggableId={card.id} 
                          index={index}
                          isDragDisabled={!podeEditar}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 group transition-all duration-200 ${
                                snapshot.isDragging ? 'shadow-xl scale-105 ring-2 ring-green-500 border-transparent z-50' : 'hover:shadow-md'
                              }`}
                            >
                              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                                {card.titulo}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                {card.descricao}
                              </p>

                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full border ${getKanbanTipoBadgeClassName(card.tipo)}`}
                                  title={getKanbanTipoLabel(card.tipo)}
                                >
                                  {getKanbanTipoLabel(card.tipo)}
                                </span>

                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {podeEditar && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setCardEditando(card)
                                        setVisualizarApenas(true)
                                        setIsModalOpen(true)
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Visualizar"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCardEditando(card)
                                        setVisualizarApenas(false)
                                        setIsModalOpen(true)
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                      title="Editar"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCardParaDeletar(card)
                                        setIsDeleteModalOpen(true)
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Excluir"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Modais */}
      {isModalOpen && (
        <CriarCardModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setCardEditando(null)
          }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          cardEditando={cardEditando}
          visualizarApenas={visualizarApenas}
        />
      )}

      {isDeleteModalOpen && cardParaDeletar && (
        <ConfirmarExclusaoModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setCardParaDeletar(null)
          }}
          onConfirm={handleDelete}
          itemNome={cardParaDeletar.titulo}
          tipoItem="card"
        />
      )}
    </div>
  )
}
