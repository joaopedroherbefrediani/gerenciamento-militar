import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const createSchema: z.ZodType<Record<string, any>> = z
  .object({
    id: z.string().min(1).optional(),
    timestamp: z.number().optional(),
  })
  .passthrough()

export async function GET() {
  try {
    const activities = await dataStore.getActivities()
    return NextResponse.json({ success: true, data: activities })
  } catch (error) {
    console.error('Erro ao buscar atividades:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar atividades' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createSchema.parse(await request.json())
    const activities = await dataStore.getActivities()
    
    const novaActivity: any = {
      ...body,
      id: body.id || `activity_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
    
    // Verificar se já existe uma atividade idêntica recente (últimos 3 segundos)
    const agoraTimestamp = Date.now()
    const atividadeDuplicada = activities.find((a: any) => 
      a.type === novaActivity.type &&
      a.entity === novaActivity.entity &&
      a.entityId === novaActivity.entityId &&
      a.entityName === novaActivity.entityName &&
      Math.abs(agoraTimestamp - a.timestamp) < 3000
    )
    
    if (atividadeDuplicada) {
      return NextResponse.json({ success: true, data: atividadeDuplicada })
    }
    
    // Adicionar no início e manter apenas as últimas 100 atividades
    const updatedActivities = [novaActivity, ...activities].slice(0, 100)
    await dataStore.saveActivities(updatedActivities)
    
    return NextResponse.json({ success: true, data: novaActivity })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao criar atividade:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar atividade' },
      { status: 500 }
    )
  }
}
