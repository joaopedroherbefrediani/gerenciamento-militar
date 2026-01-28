// Utilitário para migrar dados do localStorage para a API
// Isso é executado uma vez quando o sistema é iniciado

export async function migrateLocalStorageToAPI() {
  if (typeof window === 'undefined') return

  try {
    const entities: Array<{ key: string; endpoint: string }> = [
      { key: 'militares', endpoint: 'militares' },
      { key: 'cargos', endpoint: 'cargos' },
      { key: 'acoes', endpoint: 'acoes' },
      { key: 'infracoes', endpoint: 'infracoes' },
      { key: 'punicoes', endpoint: 'punicoes' },
      { key: 'webhooks', endpoint: 'webhooks' },
      { key: 'templates', endpoint: 'templates' },
      { key: 'provas', endpoint: 'provas' },
      { key: 'eventos', endpoint: 'eventos' },
      { key: 'activities', endpoint: 'activities' },
      { key: 'kanban', endpoint: 'kanban' },
      { key: 'instrutores', endpoint: 'instrutores' },
    ]

    for (const { key, endpoint } of entities) {
      // Verificar se já migrou esta entidade específica para evitar loops e duplicações
      const entityMigratedKey = `migrated_${key}`
      if (localStorage.getItem(entityMigratedKey) === 'true') continue

      const data = localStorage.getItem(key)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Verificar se já existe na API
            const response = await fetch(`/api/data/${endpoint}`)
            const result = await response.json()
            
            // Se a API já tem dados, marcar como migrado e pular
            if (result.success && result.data && result.data.length > 0) {
              localStorage.setItem(entityMigratedKey, 'true')
              continue
            }

            // Migrar cada item
            let count = 0
            for (const item of parsed) {
              const res = await fetch(`/api/data/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
              })
              if (res.ok) count++
            }
            
            if (count > 0) {
              console.log(`✅ Migrados ${count} itens de ${key} para a API`)
              localStorage.setItem(entityMigratedKey, 'true')
            }
          } else {
            // Se não tem dados no localStorage, marcar como migrado para não checar mais
            localStorage.setItem(entityMigratedKey, 'true')
          }
        } catch (err) {
          console.error(`Erro ao processar ${key}:`, err)
        }
      }
    }

    // Compatibilidade com flag antiga
    localStorage.setItem('data_migrated', 'true')
  } catch (error) {
    console.error('Erro na migração:', error)
  }
}
