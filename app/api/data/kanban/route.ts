import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const createCardSchema = z.object({
  id: z.string().min(1).optional(),
}).passthrough()

const updateCardSchema = z.object({
  id: z.string().min(1),
}).passthrough()

export async function GET() {
  try {
    const cards = await dataStore.getKanban()
    return NextResponse.json({ success: true, data: cards })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro ao buscar cards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const card = createCardSchema.parse(body)
    const cards = await dataStore.getKanban()
    cards.push(card)
    await dataStore.saveKanban(cards)
    return NextResponse.json({ success: true, data: card })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Erro ao criar card' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updateCardSchema.parse(body)
    const { id, ...data } = parsed
    let cards = await dataStore.getKanban()
    const index = cards.findIndex((c: any) => c.id === id)
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Card não encontrado' }, { status: 404 })
    }
    cards[index] = { ...cards[index], ...data }
    await dataStore.saveKanban(cards)
    return NextResponse.json({ success: true, data: cards[index] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Erro ao atualizar card' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 })
    }
    let cards = await dataStore.getKanban()
    cards = cards.filter((c: any) => c.id !== id)
    await dataStore.saveKanban(cards)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro ao excluir card' }, { status: 500 })
  }
}
