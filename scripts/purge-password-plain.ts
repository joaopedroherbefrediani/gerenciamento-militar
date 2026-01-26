import { getUsers, saveUsers } from '@/lib/json-db'

async function main() {
  const users = (await getUsers()) as any[]
  const cleaned = users.map((u) => {
    if (!u || typeof u !== 'object') return u
    // remove a chave passwordPlain caso exista
    const copy = { ...(u as Record<string, unknown>) }
    delete (copy as any).passwordPlain
    return copy
  })

  await saveUsers(cleaned as any)
  const removedCount = users.filter((u) => u && typeof u === 'object' && 'passwordPlain' in u).length
  console.log(`✅ Limpeza concluída. Usuários processados: ${users.length}. Removidos passwordPlain: ${removedCount}.`)
}

main().catch((err) => {
  console.error('❌ Erro ao remover passwordPlain:', err)
  process.exit(1)
})

