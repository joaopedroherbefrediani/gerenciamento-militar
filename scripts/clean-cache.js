const fs = require('fs')
const path = require('path')

const dirsToClean = ['.next', 'node_modules/.cache']

console.log('🧹 Limpando cache...')

dirsToClean.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir)
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true })
    console.log(`✅ Removido: ${dir}`)
  } else {
    console.log(`ℹ️  Não encontrado: ${dir}`)
  }
})

console.log('✨ Limpeza concluída!')
