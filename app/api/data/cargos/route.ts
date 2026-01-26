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
    const cargos = await dataStore.getCargos()
    return NextResponse.json({ success: true, data: cargos })
  } catch (error) {
    console.error('Erro ao buscar cargos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar cargos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createSchema.parse(await request.json())
    const cargos = await dataStore.getCargos()
    
    const novoCargo = {
      ...body,
      id: body.id || `cargo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
    
    cargos.push(novoCargo)
    await dataStore.saveCargos(cargos)
    
    return NextResponse.json({ success: true, data: novoCargo })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao criar cargo:', error)
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Erro ao criar cargo'
    console.error('Detalhes do erro:', errorMessage)
    console.error('Stack trace:', error?.stack)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = updateSchema.parse(await request.json())
    const { id, ...dados } = body
    
    const cargos = await dataStore.getCargos()
    const index = cargos.findIndex((c: any) => c.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Cargo não encontrado' },
        { status: 404 }
      )
    }
    
    cargos[index] = { ...cargos[index], ...dados }
    await dataStore.saveCargos(cargos)
    
    return NextResponse.json({ success: true, data: cargos[index] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao atualizar cargo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar cargo' },
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
    
    const cargos = await dataStore.getCargos()
    const filtrados = cargos.filter((c: any) => c.id !== id)
    await dataStore.saveCargos(filtrados)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar cargo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar cargo' },
      { status: 500 }
    )
  }
}
