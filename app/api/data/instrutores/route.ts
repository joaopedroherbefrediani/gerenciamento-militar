import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const PreferenciaTipoSchema = z.object({
  curso: z.boolean().optional().default(false),
  recrutamento: z.boolean().optional().default(false),
})

const createSchema = z.object({
  id: z.string().min(1).optional(),
  militarId: z.string().min(1),
  preferenciaTipo: PreferenciaTipoSchema.optional().default({ curso: false, recrutamento: false }),
  todosCursos: z.boolean().optional().default(false),
  cursosPreferidos: z.array(z.string().min(1)).optional().default([]),
  cursosPassados: z.number().int().min(0).optional().default(0),
  recrutamentosFeitos: z.number().int().min(0).optional().default(0),
  horariosPreferidos: z.string().optional().default(''),
})

const updateSchema = createSchema.extend({
  id: z.string().min(1),
})

export async function GET() {
  try {
    const instrutores = await dataStore.getInstrutores()
    return NextResponse.json({ success: true, data: instrutores })
  } catch (error) {
    console.error('Erro ao buscar instrutores:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar instrutores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createSchema.parse(await request.json())
    const instrutores = await dataStore.getInstrutores()

    // Garantir 1 instrutor por militar
    const jaExiste = instrutores.some((i: any) => i?.militarId === body.militarId)
    if (jaExiste) {
      return NextResponse.json(
        { success: false, error: 'Este militar já está cadastrado como instrutor.' },
        { status: 409 }
      )
    }

    const novo = {
      ...body,
      id: body.id || `instrutor_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    instrutores.push(novo)
    await dataStore.saveInstrutores(instrutores)

    return NextResponse.json({ success: true, data: novo })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao criar instrutor:', error)
    return NextResponse.json({ success: false, error: 'Erro ao criar instrutor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = updateSchema.parse(await request.json())
    const { id, ...dados } = body

    const instrutores = await dataStore.getInstrutores()
    const index = instrutores.findIndex((i: any) => i.id === id)
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Instrutor não encontrado' }, { status: 404 })
    }

    // Se trocar militarId, validar unicidade
    if (dados.militarId && dados.militarId !== instrutores[index]?.militarId) {
      const jaExiste = instrutores.some((i: any) => i?.militarId === dados.militarId && i?.id !== id)
      if (jaExiste) {
        return NextResponse.json(
          { success: false, error: 'Este militar já está cadastrado como instrutor.' },
          { status: 409 }
        )
      }
    }

    instrutores[index] = { ...instrutores[index], ...dados, updatedAt: Date.now() }
    await dataStore.saveInstrutores(instrutores)
    return NextResponse.json({ success: true, data: instrutores[index] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao atualizar instrutor:', error)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar instrutor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 })
    }

    const instrutores = await dataStore.getInstrutores()
    const filtrados = instrutores.filter((i: any) => i.id !== id)
    await dataStore.saveInstrutores(filtrados)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar instrutor:', error)
    return NextResponse.json({ success: false, error: 'Erro ao deletar instrutor' }, { status: 500 })
  }
}

