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
    const punicoes = await dataStore.getPunicoes()
    return NextResponse.json({ success: true, data: punicoes })
  } catch (error) {
    console.error('Erro ao buscar punições:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar punições' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createSchema.parse(await request.json())
    const punicoes = await dataStore.getPunicoes()
    
    const novaPunicao = {
      ...body,
      id: body.id || `punicao_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
    
    punicoes.push(novaPunicao)
    await dataStore.savePunicoes(punicoes)
    
    return NextResponse.json({ success: true, data: novaPunicao })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao criar punição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar punição' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = updateSchema.parse(await request.json())
    const { id, ...dados } = body
    
    const punicoes = await dataStore.getPunicoes()
    const index = punicoes.findIndex((p: any) => p.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Punição não encontrada' },
        { status: 404 }
      )
    }
    
    punicoes[index] = { ...punicoes[index], ...dados }
    await dataStore.savePunicoes(punicoes)
    
    return NextResponse.json({ success: true, data: punicoes[index] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao atualizar punição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar punição' },
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
    
    const punicoes = await dataStore.getPunicoes()
    const filtradas = punicoes.filter((p: any) => p.id !== id)
    await dataStore.savePunicoes(filtradas)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar punição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar punição' },
      { status: 500 }
    )
  }
}
