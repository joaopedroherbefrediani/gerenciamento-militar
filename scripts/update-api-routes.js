// Script para atualizar todas as rotas de API para usar async/await
const fs = require('fs')
const path = require('path')

const apiDir = path.join(__dirname, '../app/api/data')

const entities = [
  'cargos',
  'acoes',
  'infracoes',
  'punicoes',
  'webhooks',
  'templates',
  'provas',
  'eventos',
  'activities'
]

entities.forEach(entity => {
  const routeFile = path.join(apiDir, entity, 'route.ts')
  
  if (!fs.existsSync(routeFile)) {
    console.log(`⚠️  Arquivo não encontrado: ${routeFile}`)
    return
  }
  
  let content = fs.readFileSync(routeFile, 'utf-8')
  
  // Atualizar GET
  content = content.replace(
    /const \w+ = dataStore\.get\w+\(\)/g,
    (match) => `const ${match.split('=')[0].trim()} = await dataStore.${match.split('dataStore.')[1]}`
  )
  
  // Atualizar save
  content = content.replace(
    /dataStore\.save\w+\(/g,
    (match) => `await ${match}`
  )
  
  fs.writeFileSync(routeFile, content, 'utf-8')
  console.log(`✅ Atualizado: ${entity}`)
})

console.log('✅ Todas as rotas foram atualizadas!')
