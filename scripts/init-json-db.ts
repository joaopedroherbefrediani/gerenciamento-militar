import { initializeAdmin } from '@/lib/json-db'

async function main() {
  console.log('🚀 Inicializando banco de dados JSON...')
  await initializeAdmin()
  console.log('✅ Banco de dados JSON inicializado com sucesso!')
  console.log('📝 Credenciais padrão:')
  console.log('   Login: administrador')
  console.log('   Senha: Fr3di@d3v')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao inicializar:', error)
    process.exit(1)
  })
