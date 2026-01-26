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
    const eventos = await dataStore.getEventos()
    return NextResponse.json({ success: true, data: eventos })
  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar eventos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createSchema.parse(await request.json())
    const eventos = await dataStore.getEventos()
    
    const novoEvento = {
      ...body,
      id: body.id || `evento_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
    
    eventos.push(novoEvento)
    await dataStore.saveEventos(eventos)
    
    return NextResponse.json({ success: true, data: novoEvento })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao criar evento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar evento' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = updateSchema.parse(await request.json())
    const { id, ...dados } = body
    
    const eventos = await dataStore.getEventos()
    const index = eventos.findIndex((e: any) => e.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Evento não encontrado' },
        { status: 404 }
      )
    }
    
    eventos[index] = { ...eventos[index], ...dados }
    await dataStore.saveEventos(eventos)
    
    return NextResponse.json({ success: true, data: eventos[index] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao atualizar evento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar evento' },
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
    
    const eventos = await dataStore.getEventos()
    const filtrados = eventos.filter((e: any) => e.id !== id)
    await dataStore.saveEventos(filtrados)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar evento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar evento' },
      { status: 500 }
    )
  }
}
