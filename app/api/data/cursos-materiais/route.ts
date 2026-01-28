import { NextRequest, NextResponse } from 'next/server'
import { dataStore } from '@/lib/data-store'
import { getRedis } from '@/lib/redis'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const PUBLIC_MATERIAIS_DIR = path.join(process.cwd(), 'public', 'cursos-materials')
const REDIS_FILE_KEY_PREFIX = 'curso-material:'

function ensureDir() {
  try {
    if (!fs.existsSync(PUBLIC_MATERIAIS_DIR)) fs.mkdirSync(PUBLIC_MATERIAIS_DIR, { recursive: true })
  } catch (e) {
    console.error('[cursos-materiais] erro ao criar pasta:', e)
  }
}

function safeUnlink(filePath: string) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch (e) {
    console.error('[cursos-materiais] erro ao deletar arquivo:', filePath, e)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Download (suporta storage em Redis quando estiver em ambiente readonly, ex: Vercel)
    // /api/data/cursos-materiais?id=...&download=1
    // Mantemos o GET sem query para listar materiais.
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const download = searchParams.get('download')
    if (id && download) {
      const materiais = await dataStore.getCursosMateriais()
      const material = materiais.find((m: any) => m.id === id)
      if (!material) {
        return NextResponse.json({ success: false, error: 'Material não encontrado' }, { status: 404 })
      }

      // Se o arquivo está em public, redirecionar para a rota estática
      if (material.storage === 'public' && material.fileName) {
        return NextResponse.redirect(new URL(`/cursos-materials/${material.fileName}`, request.url))
      }

      // Caso contrário, buscar do Redis e servir como PDF
      const redis = await getRedis()
      if (!redis) {
        return NextResponse.json({ success: false, error: 'Storage indisponível para download' }, { status: 500 })
      }
      const base64 = await redis.get(REDIS_FILE_KEY_PREFIX + id)
      if (!base64) {
        return NextResponse.json({ success: false, error: 'Arquivo não encontrado no storage' }, { status: 404 })
      }
      const buf = Buffer.from(base64, 'base64')
      const filename = String(material.originalName || 'material.pdf')
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    const materiais = await dataStore.getCursosMateriais()
    return NextResponse.json({ success: true, data: materiais })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro ao buscar materiais' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const courseId = form.get('courseId')
    const file = form.get('file')

    const courseIdParsed = z.string().min(1).parse(courseId)
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Arquivo é obrigatório' }, { status: 400 })
    }

    const originalName = file.name || 'material.pdf'
    const isPdf =
      (file.type && file.type.toLowerCase() === 'application/pdf') ||
      originalName.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      return NextResponse.json({ success: false, error: 'Apenas arquivos .pdf são permitidos' }, { status: 400 })
    }

    const materiais = await dataStore.getCursosMateriais()
    const id = `mat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const novoMaterial: any = {
      id,
      courseId: courseIdParsed,
      originalName,
      uploadedAt: Date.now(),
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Tentar salvar em public (funciona localmente). Em Vercel, public é readonly -> fallback Redis.
    let savedToPublic = false
    try {
      ensureDir()
      const uniqueName = `material_${Date.now()}_${Math.random().toString(36).slice(2, 9)}.pdf`
      const filePath = path.join(PUBLIC_MATERIAIS_DIR, uniqueName)
      fs.writeFileSync(filePath, buffer)
      novoMaterial.fileName = uniqueName
      novoMaterial.storage = 'public'
      savedToPublic = true
    } catch (e) {
      console.error('[cursos-materiais] falha ao salvar em public, tentando Redis:', e)
    }

    if (!savedToPublic) {
      const redis = await getRedis()
      if (!redis) {
        return NextResponse.json({ success: false, error: 'Storage indisponível para anexar material' }, { status: 500 })
      }
      await redis.set(REDIS_FILE_KEY_PREFIX + id, buffer.toString('base64'))
      novoMaterial.storage = 'redis'
      // fileName opcional; download será via API
      novoMaterial.fileName = ''
    }

    materiais.push(novoMaterial)
    await dataStore.saveCursosMateriais(materiais)

    return NextResponse.json({ success: true, data: novoMaterial })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('[cursos-materiais] erro no upload:', error)
    return NextResponse.json({ success: false, error: 'Erro ao anexar material' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 })
    }

    const materiais = await dataStore.getCursosMateriais()
    const material = materiais.find((m: any) => m.id === id)
    if (!material) {
      return NextResponse.json({ success: false, error: 'Material não encontrado' }, { status: 404 })
    }

    if (material.storage === 'public' && material?.fileName) {
      safeUnlink(path.join(PUBLIC_MATERIAIS_DIR, String(material.fileName)))
    }
    if (material.storage === 'redis') {
      const redis = await getRedis()
      if (redis) {
        try {
          await redis.del(REDIS_FILE_KEY_PREFIX + id)
        } catch (e) {
          console.error('[cursos-materiais] erro ao deletar do Redis:', e)
        }
      }
    }

    const materiaisAtualizados = materiais.filter((m: any) => m.id !== id)
    await dataStore.saveCursosMateriais(materiaisAtualizados)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro ao deletar material' }, { status: 500 })
  }
}

