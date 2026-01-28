export type ActivityType = 'created' | 'updated' | 'deleted'
export type ActivityEntity =
  | 'militar'
  | 'cargo'
  | 'acao'
  | 'infracao'
  | 'punicao'
  | 'evento'
  | 'webhook'
  | 'template'
  | 'convidado'
  | 'kanban'
  | 'curso'
  | 'curso_material'

export interface Activity {
  id: string
  type: ActivityType
  entity: ActivityEntity
  entityId: string
  entityName: string
  timestamp: number
  date: string
  time: string
  userId?: string
  userName?: string
  details?: string
}

export async function logActivity(
  type: ActivityType,
  entity: ActivityEntity,
  entityId: string,
  entityName: string,
  userName?: string,
  details?: string
): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const agora = new Date()
    const activity: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      entity,
      entityId,
      entityName,
      userName,
      details,
      timestamp: agora.getTime(),
      date: agora.toLocaleDateString('pt-BR'),
      time: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }

    // Enviar para a API
    await fetch('/api/data/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    }).catch(err => {
      console.error('Erro ao registrar atividade na API:', err)
      // Fallback para localStorage se a API falhar
      const activitiesSaved = localStorage.getItem('activities')
      const activities: Activity[] = activitiesSaved ? JSON.parse(activitiesSaved) : []
      const updatedActivities = [activity, ...activities].slice(0, 100)
      localStorage.setItem('activities', JSON.stringify(updatedActivities))
    })
    
    // Disparar evento customizado para atualizar o dashboard na mesma aba
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('custom-storage-change'))
    }
  } catch (error) {
    console.error('Erro ao registrar atividade:', error)
  }
}

export async function getActivities(limit: number = 10): Promise<Activity[]> {
  if (typeof window === 'undefined') return []

  try {
    // Tentar buscar da API primeiro
    const response = await fetch('/api/data/activities')
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        return result.data.slice(0, limit)
      }
    }
    
    // Fallback para localStorage se a API falhar
    const activitiesSaved = localStorage.getItem('activities')
    if (!activitiesSaved) return []
    
    const activities: Activity[] = JSON.parse(activitiesSaved)
    return activities.slice(0, limit)
  } catch (error) {
    console.error('Erro ao obter atividades:', error)
    // Fallback para localStorage
    try {
      const activitiesSaved = localStorage.getItem('activities')
      if (!activitiesSaved) return []
      const activities: Activity[] = JSON.parse(activitiesSaved)
      return activities.slice(0, limit)
    } catch {
      return []
    }
  }
}
