// Removendo import - vamos usar comparação direta

// Mapeamento de rotas para permissões necessárias
export const PERMISSOES_ROTAS: Record<string, string[]> = {
  '/': ['view_dashboard'],
  '/militares': ['view_militares'],
  '/cargos': ['view_cargos'],
  '/acoes': ['view_acoes'],
  '/infracoes': ['view_infracoes'],
  '/punicoes': ['view_punicoes'],
  '/relatorios': ['view_relatorios'],
  '/convidados': ['view_convidados'],
  '/webhooks': ['view_webhooks'],
  '/templates': ['view_templates'],
  '/logs': ['view_logs'],
  '/recrutamento': ['view_recrutamento'],
  '/recrutamento/taf': ['view_recrutamento'],
  '/cursos': ['view_cursos'],
  '/instrutores': ['view_instrutores'],
  '/kanban': ['view_kanban'],
}

// Mapeamento de ações para permissões
export const PERMISSOES_ACOES: Record<string, string> = {
  'criar-militar': 'edit_militares',
  'editar-militar': 'edit_militares',
  'excluir-militar': 'edit_militares',
  'criar-cargo': 'edit_cargos',
  'editar-cargo': 'edit_cargos',
  'excluir-cargo': 'edit_cargos',
  'criar-acao': 'edit_acoes',
  'editar-acao': 'edit_acoes',
  'excluir-acao': 'edit_acoes',
  'criar-infracao': 'edit_infracoes',
  'editar-infracao': 'edit_infracoes',
  'excluir-infracao': 'edit_infracoes',
  'criar-punicao': 'edit_punicoes',
  'editar-punicao': 'edit_punicoes',
  'excluir-punicao': 'edit_punicoes',
  'criar-webhook': 'edit_webhooks',
  'editar-webhook': 'edit_webhooks',
  'excluir-webhook': 'edit_webhooks',
  'criar-template': 'edit_templates',
  'editar-template': 'edit_templates',
  'excluir-template': 'edit_templates',
  'criar-kanban': 'edit_kanban',
  'editar-kanban': 'edit_kanban',
  'excluir-kanban': 'edit_kanban',
  'mover-kanban': 'edit_kanban',

  'criar-instrutor': 'edit_instrutores',
  'editar-instrutor': 'edit_instrutores',
  'excluir-instrutor': 'edit_instrutores',
}

// Verificar se o usuário tem permissão para acessar uma rota
export function temPermissaoRota(permissoes: string[] | null, rota: string): boolean {
  try {
    // Admin (usuário normal) tem acesso total
    if (!permissoes || permissoes.length === 0) {
      return true
    }

    // Garantir que permissoes é um array
    if (!Array.isArray(permissoes)) {
      return false
    }

    const permissoesNecessarias = PERMISSOES_ROTAS[rota]
    if (!permissoesNecessarias) {
      return true // Rota não mapeada, permitir acesso
    }

    // Verificar cada permissão necessária usando comparação normalizada
    const temAcesso = permissoesNecessarias.some((permissaoNecessaria) => {
      // Usar comparação direta normalizada (case-insensitive, trim)
      const permissaoNecessariaNorm = permissaoNecessaria.trim().toLowerCase()
      
      return permissoes.some((p) => {
        if (!p || typeof p !== 'string') return false
        const pNorm = p.trim().toLowerCase()
        return pNorm === permissaoNecessariaNorm
      })
    })

    return temAcesso
  } catch (error) {
    console.error('Erro em temPermissaoRota:', error)
    return false
  }
}

// Verificar se o usuário tem permissão para uma ação
export function temPermissaoAcao(permissoes: string[], acao: string): boolean {
  // Admin (usuário normal) tem acesso total
  if (!permissoes || permissoes.length === 0) {
    return true
  }

  const permissaoNecessaria = PERMISSOES_ACOES[acao]
  if (!permissaoNecessaria) {
    return true // Ação não mapeada, permitir
  }

  return permissoes.includes(permissaoNecessaria)
}

// Verificar se é admin (usuário normal sem permissões)
export function isAdmin(permissoes: string[] | null | undefined): boolean {
  return !permissoes || permissoes.length === 0
}
