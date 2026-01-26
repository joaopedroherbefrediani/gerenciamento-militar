import { NextRequest, NextResponse } from 'next/server'
import { getUserById } from '@/lib/json-db'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const tokenFromCookie = request.cookies.get('token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

    const token = tokenFromCookie || tokenFromHeader
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const secret =
      process.env.JWT_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      'default-secret-change-in-production'
    
    try {
      const decoded = jwt.verify(token, secret) as any
      const user = await getUserById(decoded.userId)
      
      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 })
      }

      // Se o usuário estiver inativo, força logout
      if (user.status === 'Inativo') {
        return NextResponse.json({ error: 'Usuário inativo' }, { status: 401 })
      }

      // Se a versão da sessão mudou, força logout (token antigo)
      if (
        decoded?.userId &&
        decoded?.sessionVersion !== undefined &&
        user.sessionVersion !== undefined &&
        decoded.userId !== 'admin_001' &&
        decoded.sessionVersion !== user.sessionVersion
      ) {
        return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })
      }

      return NextResponse.json({
        id: user.id,
        login: user.login,
        permissoes: user.permissoes,
        sessionVersion: user.sessionVersion,
        status: user.status
      })
    } catch (err) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
