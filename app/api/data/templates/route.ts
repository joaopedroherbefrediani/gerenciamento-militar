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
    const templates = await dataStore.getTemplates()
    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createSchema.parse(await request.json())
    const templates = await dataStore.getTemplates()
    
    const novoTemplate = {
      ...body,
      id: body.id || `template_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }
    
    templates.push(novoTemplate)
    await dataStore.saveTemplates(templates)
    
    return NextResponse.json({ success: true, data: novoTemplate })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao criar template:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar template' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = updateSchema.parse(await request.json())
    const { id, ...dados } = body
    
    const templates = await dataStore.getTemplates()
    const index = templates.findIndex((t: any) => t.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Template não encontrado' },
        { status: 404 }
      )
    }
    
    templates[index] = { ...templates[index], ...dados }
    await dataStore.saveTemplates(templates)
    
    return NextResponse.json({ success: true, data: templates[index] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao atualizar template:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar template' },
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
    
    const templates = await dataStore.getTemplates()
    const filtrados = templates.filter((t: any) => t.id !== id)
    await dataStore.saveTemplates(filtrados)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar template:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar template' },
      { status: 500 }
    )
  }
}
