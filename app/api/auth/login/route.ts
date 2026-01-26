import { NextRequest, NextResponse } from 'next/server'
import { getUserByLogin, verifyPassword, initializeAdmin } from '@/lib/json-db'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    // Garantir que o admin existe
    await initializeAdmin()

    const body = await request.json()
    const { login, password } = loginSchema.parse(body)

    // Buscar usuário
    const user = await getUserByLogin(login)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verificar senha
    const isValidPassword = await verifyPassword(user, password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Gerar token JWT
    const secret =
      process.env.JWT_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      'default-secret-change-in-production'
    const token = jwt.sign(
      { 
        userId: user.id, 
        login: user.login, 
        permissoes: user.permissoes,
        sessionVersion: user.sessionVersion || 1
      },
      secret,
      { expiresIn: '1d' }
    )

    const response = NextResponse.json({ success: true, message: 'Login bem-sucedido' })
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 dia
    })
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
