import { createClient, type RedisClientType } from 'redis'

let client: RedisClientType | null = null

/**
 * Retorna o cliente Redis conectado (singleton).
 * Se REDIS_URL não estiver definido, retorna null (fallback para fs em data-store e json-db).
 */
export async function getRedis(): Promise<RedisClientType | null> {
  if (client) return client
  const url = process.env.REDIS_URL
  if (!url) return null
  try {
    client = createClient({ url })
    await client.connect()
    return client
  } catch (e) {
    console.error('[redis] Erro ao conectar:', e)
    return null
  }
}
