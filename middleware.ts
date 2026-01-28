import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'

function getIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || '127.0.0.1'
  return request.ip ?? '127.0.0.1'
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const ratelimit =
  redisUrl && redisToken
    ? new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(5, '15 m'),
        analytics: true,
        prefix: 'ratelimit',
      })
    : null

export async function middleware(request: NextRequest) {
  // Rate limit apenas no login
  if (request.nextUrl.pathname === '/api/auth/login' && ratelimit) {
    const ip = getIp(request)
    const { success } = await ratelimit.limit(`login:${ip}`)
    if (!success) {
      return new NextResponse('Muitas tentativas de login. Tente novamente mais tarde.', { status: 429 })
    }
  }

  const response = NextResponse.next()

  // Security headers (aplicado globalmente)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // CSP compatível com Next.js sem nonce (mais permissiva para evitar quebra)
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      // Permitir iframe do YouTube (TAF)
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Necessário para libs que usam Web Worker via blob: (ex.: confetti)
      "worker-src 'self' blob:",
      // Fallback para navegadores antigos
      "child-src 'self' blob:",
      "connect-src 'self' https:",
    ].join('; ')
  )

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

