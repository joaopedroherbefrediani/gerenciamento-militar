import fs from 'fs'
import path from 'path'
import { getRedis } from '@/lib/redis'

const DATA_DIR = path.join(process.cwd(), 'data')

if (typeof fs !== 'undefined' && fs.existsSync && !fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  } catch {}
}

const PREFIX = 'data:'

export async function readDataFile<T>(filename: string): Promise<T[]> {
  const redis = await getRedis()
  if (redis) {
    try {
      const raw = await redis.get(PREFIX + filename)
      if (!raw) return []
      const data = JSON.parse(raw)
      return Array.isArray(data) ? data : []
    } catch (e) {
      console.error(`[readDataFile] ${filename}:`, e)
      return []
    }
  }

  // Fallback: arquivo local (quando REDIS_URL não está definido)
  if (typeof fs === 'undefined' || !fs.existsSync) return []
  const filePath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filePath)) return []
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filename}:`, error)
    return []
  }
}

export async function writeDataFile<T>(filename: string, data: T[]): Promise<void> {
  const redis = await getRedis()
  if (redis) {
    try {
      await redis.set(PREFIX + filename, JSON.stringify(data, null, 2))
      return
    } catch (e: unknown) {
      const msg = (e as Error)?.message || String(e)
      console.error(`[writeDataFile] ${filename}:`, e)
      throw new Error(`Erro ao salvar no Redis: ${msg}`)
    }
  }

  // Fallback: arquivo local
  if (typeof fs === 'undefined' || !fs.writeFileSync) {
    throw new Error('Não é possível salvar: REDIS_URL não definido e fs indisponível.')
  }
  const filePath = path.join(DATA_DIR, filename)
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error(`Erro ao salvar arquivo ${filename}:`, error)
    throw error
  }
}

export const dataStore = {
  getMilitares: () => readDataFile<any>('militares.json'),
  saveMilitares: (data: any[]) => writeDataFile('militares.json', data),

  getCargos: () => readDataFile<any>('cargos.json'),
  saveCargos: (data: any[]) => writeDataFile('cargos.json', data),

  getAcoes: () => readDataFile<any>('acoes.json'),
  saveAcoes: (data: any[]) => writeDataFile('acoes.json', data),

  getInfracoes: () => readDataFile<any>('infracoes.json'),
  saveInfracoes: (data: any[]) => writeDataFile('infracoes.json', data),

  getPunicoes: () => readDataFile<any>('punicoes.json'),
  savePunicoes: (data: any[]) => writeDataFile('punicoes.json', data),

  getWebhooks: () => readDataFile<any>('webhooks.json'),
  saveWebhooks: (data: any[]) => writeDataFile('webhooks.json', data),

  getTemplates: () => readDataFile<any>('templates.json'),
  saveTemplates: (data: any[]) => writeDataFile('templates.json', data),

  getProvas: () => readDataFile<any>('provas.json'),
  saveProvas: (data: any[]) => writeDataFile('provas.json', data),

  getEventos: () => readDataFile<any>('eventos.json'),
  saveEventos: (data: any[]) => writeDataFile('eventos.json', data),

  getActivities: () => readDataFile<any>('activities.json'),
  saveActivities: (data: any[]) => writeDataFile('activities.json', data),

  getKanban: () => readDataFile<any>('kanban.json'),
  saveKanban: (data: any[]) => writeDataFile('kanban.json', data),
}
