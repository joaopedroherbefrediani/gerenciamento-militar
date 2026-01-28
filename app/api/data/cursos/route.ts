import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CursoImportanciaSchema = z.enum(['Basico', 'Adicional'])

const createCursoSchema = z.object({
  id: z.string().min(1).optional(),
  nome: z.string().min(1),
  importancia: CursoImportanciaSchema,
})

const updateCursoSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  importancia: CursoImportanciaSchema,
})

const PUBLIC_MATERIAIS_DIR = path.join(process.cwd(), 'public', 'cursos-materials')

function safeUnlink(filePath: string) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch (e) {
    console.error('[cursos] erro ao deletar arquivo:', filePath, e)
  }
}

export async function GET() {
  try {
    const cursos = await dataStore.getCursos()
    return NextResponse.json({ success: true, data: cursos })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro ao buscar cursos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createCursoSchema.parse(body)

    const cursos = await dataStore.getCursos()
    const novoCurso = {
      ...parsed,
      id: parsed.id || `curso_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }

    cursos.push(novoCurso)
    await dataStore.saveCursos(cursos)
    return NextResponse.json({ success: true, data: novoCurso })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Erro ao criar curso' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updateCursoSchema.parse(body)
    const { id, ...data } = parsed

    const cursos = await dataStore.getCursos()
    const index = cursos.findIndex((c: any) => c.id === id)
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Curso não encontrado' }, { status: 404 })
    }

    cursos[index] = { ...cursos[index], ...data }
    await dataStore.saveCursos(cursos)
    return NextResponse.json({ success: true, data: cursos[index] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Erro ao atualizar curso' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 })
    }

    const cursos = await dataStore.getCursos()
    const curso = cursos.find((c: any) => c.id === id)
    if (!curso) {
      return NextResponse.json({ success: false, error: 'Curso não encontrado' }, { status: 404 })
    }

    // Remover materiais vinculados e apagar arquivos
    const materiais = await dataStore.getCursosMateriais()
    const materiaisDoCurso = materiais.filter((m: any) => m.courseId === id)
    for (const m of materiaisDoCurso) {
      if (m?.fileName) {
        safeUnlink(path.join(PUBLIC_MATERIAIS_DIR, String(m.fileName)))
      }
    }
    const materiaisAtualizados = materiais.filter((m: any) => m.courseId !== id)
    await dataStore.saveCursosMateriais(materiaisAtualizados)

    const cursosAtualizados = cursos.filter((c: any) => c.id !== id)
    await dataStore.saveCursos(cursosAtualizados)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro ao excluir curso' }, { status: 500 })
  }
}

