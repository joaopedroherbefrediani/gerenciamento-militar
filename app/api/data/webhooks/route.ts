import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const createSchema = z
  .object({
    id: z.string().min(1).optional(),
  })
  .passthrough()

const updateSchema = z
  .object({
    id: z.string().min(1),
  })
  .passthrough()

export async function GET() {
  try {
    const webhooks = await dataStore.getWebhooks()
    return NextResponse.json({ success: true, data: webhooks })
  } catch (error) {
    console.error('Erro ao buscar webhooks:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar webhooks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createSchema.parse(await request.json())
    const webhooks = await dataStore.getWebhooks()
    
    const novoWebhook = {
      ...body,
      id: body.id || `webhook_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
    
    webhooks.push(novoWebhook)
    await dataStore.saveWebhooks(webhooks)
    
    return NextResponse.json({ success: true, data: novoWebhook })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao criar webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar webhook' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = updateSchema.parse(await request.json())
    const { id, ...dados } = body
    
    const webhooks = await dataStore.getWebhooks()
    const index = webhooks.findIndex((w: any) => w.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Webhook não encontrado' },
        { status: 404 }
      )
    }
    
    webhooks[index] = { ...webhooks[index], ...dados }
    await dataStore.saveWebhooks(webhooks)
    
    return NextResponse.json({ success: true, data: webhooks[index] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao atualizar webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar webhook' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }
    
    const webhooks = await dataStore.getWebhooks()
    const filtrados = webhooks.filter((w: any) => w.id !== id)
    await dataStore.saveWebhooks(filtrados)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar webhook' },
      { status: 500 }
    )
  }
}
