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
    const infracoes = await dataStore.getInfracoes()
    return NextResponse.json({ success: true, data: infracoes })
  } catch (error) {
    console.error('Erro ao buscar infrações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar infrações' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createSchema.parse(await request.json())
    const infracoes = await dataStore.getInfracoes()
    
    const novaInfracao = {
      ...body,
      id: body.id || `infracao_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
    
    infracoes.push(novaInfracao)
    await dataStore.saveInfracoes(infracoes)
    
    return NextResponse.json({ success: true, data: novaInfracao })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao criar infração:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar infração' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = updateSchema.parse(await request.json())
    const { id, ...dados } = body
    
    const infracoes = await dataStore.getInfracoes()
    const index = infracoes.findIndex((i: any) => i.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Infração não encontrada' },
        { status: 404 }
      )
    }
    
    infracoes[index] = { ...infracoes[index], ...dados }
    await dataStore.saveInfracoes(infracoes)
    
    return NextResponse.json({ success: true, data: infracoes[index] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao atualizar infração:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar infração' },
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
    
    const infracoes = await dataStore.getInfracoes()
    const filtradas = infracoes.filter((i: any) => i.id !== id)
    await dataStore.saveInfracoes(filtradas)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar infração:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar infração' },
      { status: 500 }
    )
  }
}
