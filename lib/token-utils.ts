// Utilitários para gerenciar tokens JWT

/**
 * Decodifica um token JWT e retorna o payload
 */
export function decodificarToken(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    return JSON.parse(atob(parts[1]))
  } catch (error) {
    console.error('Erro ao decodificar token:', error)
    return null
  }
}

/**
 * Obtém o login do usuário do token atual
 */
export function obterLoginDoToken(): string | null {
  if (typeof window === 'undefined') return null
  
  const token = localStorage.getItem('token')
  if (!token) return null
  
  const payload = decodificarToken(token)
  return payload?.login || null
}

