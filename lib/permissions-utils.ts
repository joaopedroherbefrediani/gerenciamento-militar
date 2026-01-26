// Utilitários para normalizar e comparar permissões

/**
 * Normaliza uma permissão removendo espaços extras e padronizando o case
 */
export function normalizarPermissao(permissao: string): string {
  if (!permissao || typeof permissao !== 'string') {
    return ''
  }
  return permissao.trim().replace(/\s+/g, ' ')
}

/**
 * Compara duas permissões de forma case-insensitive e ignorando espaços extras
 */
export function compararPermissoes(permissao1: string, permissao2: string): boolean {
  const p1 = normalizarPermissao(permissao1).toLowerCase()
  const p2 = normalizarPermissao(permissao2).toLowerCase()
  return p1 === p2
}

/**
 * Verifica se um array de permissões contém uma permissão específica
 * (comparação case-insensitive e ignorando espaços)
 */
export function temPermissao(permissoes: string[] | null | undefined, permissao: string): boolean {
  if (!permissoes || !Array.isArray(permissoes) || permissoes.length === 0) {
    return false
  }
  
  if (!permissao || typeof permissao !== 'string') {
    return false
  }
  
  const permissaoNormalizada = normalizarPermissao(permissao).toLowerCase()
  
  return permissoes.some((p) => {
    if (!p || typeof p !== 'string') return false
    const pNormalizada = normalizarPermissao(p).toLowerCase()
    return pNormalizada === permissaoNormalizada
  })
}

/**
 * Normaliza um array de permissões
 */
export function normalizarArrayPermissoes(permissoes: string[] | null | undefined): string[] {
  if (!permissoes || !Array.isArray(permissoes)) {
    return []
  }
  
  return permissoes
    .filter((p) => p && typeof p === 'string')
    .map((p) => normalizarPermissao(p))
}
