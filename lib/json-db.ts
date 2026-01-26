import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { getRedis } from '@/lib/redis'

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

if (typeof fs !== 'undefined' && fs.existsSync && !fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  } catch {}
}

export interface User {
  id: string
  nome?: string
  login: string
  password: string
  permissoes: string[] | null
  status: 'Ativo' | 'Inativo'
  sessionVersion: number // Para forçar logout em edições
  createdAt: string
  updatedAt: string
}

let _fallbackAdmin: User | null = null

/** Lista de usuários. Redis: key "users". Fallback: fs. */
export async function getUsers(): Promise<User[]> {
  const redis = await getRedis()
  if (redis) {
    try {
      const raw = await redis.get('users')
      if (!raw) return []
      const data = JSON.parse(raw)
      return Array.isArray(data) ? data : []
    } catch (e) {
      console.error('[getUsers]', e)
      return []
    }
  }
  if (!fs.existsSync(USERS_FILE)) return []
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Erro ao ler usuários:', error)
    return []
  }
}

/** Salvar usuários. Redis: key "users". Fallback: fs. */
export async function saveUsers(users: User[]): Promise<void> {
  const redis = await getRedis()
  if (redis) {
    try {
      await redis.set('users', JSON.stringify(users, null, 2))
      return
    } catch (e: unknown) {
      const msg = (e as Error)?.message || String(e)
      console.error('[saveUsers]', e)
      throw new Error(`Erro ao salvar usuários no Redis: ${msg}`)
    }
  }
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
  } catch (error) {
    console.error('Erro ao salvar usuários:', error)
    throw error
  }
}

export async function getUserByLogin(login: string): Promise<User | null> {
  const users = await getUsers()
  const u = users.find((x) => x.login === login)
  if (u) return u
  if (_fallbackAdmin && _fallbackAdmin.login === login) return _fallbackAdmin
  return null
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await getUsers()
  return users.find((u) => u.id === id) || null
}

export async function createUser(login: string, password: string, nome?: string, permissoes: string[] | null = null): Promise<User> {
  const users = await getUsers()
  if (users.some((u) => u.login === login)) throw new Error('Usuário já existe')
  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nome,
    login,
    password: hashedPassword,
    permissoes,
    status: 'Ativo',
    sessionVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  users.push(newUser)
  await saveUsers(users)
  return newUser
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const users = await getUsers()
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) throw new Error('Usuário não encontrado')
  
  if (data.password) {
    const plain = data.password
    data.password = await bcrypt.hash(plain, 10)
  }
  
  // Incrementar sessionVersion em qualquer edição para forçar logout
  const currentVersion = users[index].sessionVersion || 1
  
  users[index] = {
    ...users[index],
    ...data,
    sessionVersion: currentVersion + 1,
    updatedAt: new Date().toISOString(),
  }
  
  await saveUsers(users)
  return users[index]
}

export async function deleteUser(id: string): Promise<void> {
  const users = await getUsers()
  const filteredUsers = users.filter((u) => u.id !== id)
  if (users.length === filteredUsers.length) throw new Error('Usuário não encontrado')
  await saveUsers(filteredUsers)
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return await bcrypt.compare(password, user.password)
}

export async function initializeAdmin(): Promise<void> {
  const users = await getUsers()
  const adminIndex = users.findIndex((u) => u.login === 'administrador')
  const hashedPassword = await bcrypt.hash('Fr3di@d3v', 10)

  if (adminIndex !== -1) {
    // Se já existe, atualiza para a nova senha definitiva
    const admin = users[adminIndex]
    // Só atualiza se for necessário (podemos forçar para garantir)
    users[adminIndex] = {
      ...admin,
      password: hashedPassword,
      updatedAt: new Date().toISOString(),
    }
    await saveUsers(users)
    console.log('✅ Senha do administrador atualizada para a nova senha definitiva!')
    return
  }

  const adminUser: User = {
    id: 'admin_001',
    login: 'administrador',
    password: hashedPassword,
    permissoes: null,
    status: 'Ativo',
    sessionVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  users.push(adminUser)
  try {
    await saveUsers(users)
    console.log('✅ Usuário administrador criado com sucesso!')
  } catch (e) {
    console.error('Não foi possível persistir o admin (ex.: Redis indisponível e fs read-only).', e)
    _fallbackAdmin = adminUser
  }
}
