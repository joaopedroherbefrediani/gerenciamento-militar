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
    const militares = await dataStore.getMilitares()
    return NextResponse.json({ success: true, data: militares })
  } catch (error) {
    console.error('Erro ao buscar militares:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar militares' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createSchema.parse(await request.json())
    const militares = await dataStore.getMilitares()
    
    const novoMilitar = {
      ...body,
      id: body.id || `militar_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
    
    militares.push(novoMilitar)
    await dataStore.saveMilitares(militares)
    
    return NextResponse.json({ success: true, data: novoMilitar })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao criar militar:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar militar' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = updateSchema.parse(await request.json())
    const { id, ...dados } = body
    
    const militares = await dataStore.getMilitares()
    const index = militares.findIndex((m: any) => m.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Militar não encontrado' },
        { status: 404 }
      )
    }
    
    militares[index] = { ...militares[index], ...dados }
    await dataStore.saveMilitares(militares)
    
    return NextResponse.json({ success: true, data: militares[index] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao atualizar militar:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar militar' },
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
    
    const militares = await dataStore.getMilitares()
    const filtrados = militares.filter((m: any) => m.id !== id)
    await dataStore.saveMilitares(filtrados)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar militar:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar militar' },
      { status: 500 }
    )
  }
}
