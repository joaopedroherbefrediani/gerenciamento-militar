import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

// Garantir que o diretório existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Lista de arquivos de dados a serem inicializados
const dataFiles = [
  'militares.json',
  'cargos.json',
  'acoes.json',
  'infracoes.json',
  'punicoes.json',
  'webhooks.json',
  'templates.json',
  'provas.json',
  'eventos.json',
  'activities.json',
]

// Inicializar arquivos vazios se não existirem
dataFiles.forEach((filename) => {
  const filePath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8')
    console.log(`✅ Arquivo ${filename} criado`)
  }
})

console.log('✅ Todos os arquivos de dados foram inicializados!')
