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
    const acoes = await dataStore.getAcoes()
    return NextResponse.json({ success: true, data: acoes })
  } catch (error) {
    console.error('Erro ao buscar ações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar ações' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createSchema.parse(await request.json())
    const acoes = await dataStore.getAcoes()
    
    const novaAcao = {
      ...body,
      id: body.id || `acao_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
    
    acoes.push(novaAcao)
    await dataStore.saveAcoes(acoes)
    
    return NextResponse.json({ success: true, data: novaAcao })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao criar ação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar ação' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = updateSchema.parse(await request.json())
    const { id, ...dados } = body
    
    const acoes = await dataStore.getAcoes()
    const index = acoes.findIndex((a: any) => a.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Ação não encontrada' },
        { status: 404 }
      )
    }
    
    acoes[index] = { ...acoes[index], ...dados }
    await dataStore.saveAcoes(acoes)
    
    return NextResponse.json({ success: true, data: acoes[index] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao atualizar ação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar ação' },
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
    
    const acoes = await dataStore.getAcoes()
    const filtradas = acoes.filter((a: any) => a.id !== id)
    await dataStore.saveAcoes(filtradas)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar ação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar ação' },
      { status: 500 }
    )
  }
}
