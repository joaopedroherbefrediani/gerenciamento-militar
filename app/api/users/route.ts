import { NextRequest, NextResponse } from 'next/server'
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/json-db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createUserSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
  nome: z.string().min(1).optional(),
  permissoes: z.array(z.string().min(1)).nullable().optional(),
})

const updateUserSchema = z.object({
  id: z.string().min(1),
  login: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  nome: z.string().min(1).optional(),
  permissoes: z.array(z.string().min(1)).nullable().optional(),
  status: z.enum(['Ativo', 'Inativo']).optional(),
})

export async function GET() {
  try {
    const users = await getUsers()
    // Nunca retornar hash de senha
    const safeUsers = users.map(({ password, ...user }) => user)
    return NextResponse.json(safeUsers)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { login, password, nome, permissoes } = createUserSchema.parse(body)
    const newUser = await createUser(login, password, nome, permissoes)
    const { password: _, ...safeUser } = newUser
    return NextResponse.json(safeUser)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updateUserSchema.parse(body)
    const { id, ...data } = parsed
    const updatedUser = await updateUser(id, data)
    const { password: _, ...safeUser } = updatedUser
    return NextResponse.json(safeUser)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }
    await deleteUser(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
