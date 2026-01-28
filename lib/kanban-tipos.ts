export type KanbanCardTipo = 'TAREFA' | 'SISTEMA' | 'CORRECAO' | 'OUTROS'

export const KANBAN_TIPOS: Array<{
  value: KanbanCardTipo
  label: string
  badgeClassName: string
  description: string
}> = [
  {
    value: 'TAREFA',
    label: 'Tarefa',
    badgeClassName: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Tarefas in-game ou do cotidiano.',
  },
  {
    value: 'SISTEMA',
    label: 'Sistema',
    badgeClassName: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Implementação de novas funcionalidades no sistema.',
  },
  {
    value: 'CORRECAO',
    label: 'Correção',
    badgeClassName: 'bg-green-100 text-green-800 border-green-200',
    description: 'Correção para bugs no sistema ou edição.',
  },
  {
    value: 'OUTROS',
    label: 'Outros',
    badgeClassName: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'Tipos genéricos e outros.',
  },
]

export function normalizeKanbanTipo(tipo: unknown): KanbanCardTipo {
  const t = String(tipo || '').toUpperCase()
  if (t === 'TAREFA') return 'TAREFA'
  if (t === 'SISTEMA') return 'SISTEMA'
  if (t === 'CORRECAO' || t === 'CORREÇÃO') return 'CORRECAO'
  return 'OUTROS'
}

export function getKanbanTipoLabel(tipo: unknown): string {
  return KANBAN_TIPOS.find((t) => t.value === normalizeKanbanTipo(tipo))?.label ?? 'OUTROS'
}

export function getKanbanTipoBadgeClassName(tipo: unknown): string {
  return (
    KANBAN_TIPOS.find((t) => t.value === normalizeKanbanTipo(tipo))?.badgeClassName ??
    'bg-gray-100 text-gray-700 border-gray-200'
  )
}
