import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const createSchema: z.ZodType<Record<string, any>> = z
  .object({
    id: z.string().min(1).optional(),
  })
  .passthrough()

const updateSchema: z.ZodType<Record<string, any>> = z
  .object({
    id: z.string().min(1),
  })
  .passthrough()

export async function GET() {
  try {
    console.log('Buscando provas...')
    const provas = await dataStore.getProvas()
    console.log(`Provas encontradas: ${provas.length}`)
    return NextResponse.json(
      { success: true, data: provas },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  } catch (error) {
    console.error('Erro ao buscar provas:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao buscar provas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Iniciando criação de prova...')
    const body = createSchema.parse(await request.json())
    console.log('📦 Dados recebidos:', { nomeConscrito: body.nomeConscrito, questoes: body.questoes?.length })
    
    const provas = await dataStore.getProvas()
    console.log(`📚 Provas existentes: ${provas.length}`)
    
    const novaProva = {
      ...body,
      id: body.id || `prova_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
    
    provas.push(novaProva)
    console.log('💾 Salvando provas...')
    await dataStore.saveProvas(provas)
    console.log('✅ Prova criada com sucesso:', novaProva.id)
    
    return NextResponse.json({ success: true, data: novaProva })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('❌ Erro ao criar prova:', error)
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Erro ao criar prova'
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
    
    const provas = await dataStore.getProvas()
    const index = provas.findIndex((p: any) => p.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Prova não encontrada' },
        { status: 404 }
      )
    }
    
    provas[index] = { ...provas[index], ...dados }
    await dataStore.saveProvas(provas)
    
    return NextResponse.json({ success: true, data: provas[index] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao atualizar prova:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar prova' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    console.log('🗑️ Tentando deletar prova:', id)
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }
    
    const provas = await dataStore.getProvas()
    console.log(`📚 Provas antes da exclusão: ${provas.length}`)
    
    const filtradas = provas.filter((p: any) => p.id !== id)
    
    if (filtradas.length === provas.length) {
      console.log('⚠️ Prova não encontrada:', id)
      return NextResponse.json(
        { success: false, error: 'Prova não encontrada' },
        { status: 404 }
      )
    }
    
    console.log(`💾 Salvando ${filtradas.length} provas após exclusão...`)
    await dataStore.saveProvas(filtradas)
    console.log('✅ Prova deletada com sucesso:', id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao deletar prova:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar prova'
    console.error('Detalhes do erro:', errorMessage)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
