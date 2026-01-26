'use client'

import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import ConfirmarExclusaoModal from '@/components/ConfirmarExclusaoModal'
import { logActivity } from '@/lib/activity-log'
import BaseModal from '@/components/BaseModal'

interface User {
  id: string
  nome?: string
  login: string
  permissoes: string[] | null
  status: 'Ativo' | 'Inativo'
}

const TODAS_PERMISSOES = [
  { group: 'Dashboard', permissions: [{ id: 'view_dashboard', label: 'Ver Dashboard' }, { id: 'edit_dashboard', label: 'Editar Dashboard' }] },
  { group: 'Militares', permissions: [{ id: 'view_militares', label: 'Ver Militares' }, { id: 'edit_militares', label: 'Editar Militares' }] },
  { group: 'Cargos', permissions: [{ id: 'view_cargos', label: 'Ver Cargos' }, { id: 'edit_cargos', label: 'Editar Cargos' }] },
  { group: 'Ações', permissions: [{ id: 'view_acoes', label: 'Ver Ações' }, { id: 'edit_acoes', label: 'Editar Ações' }] },
  { group: 'Infrações', permissions: [{ id: 'view_infracoes', label: 'Ver Infrações' }, { id: 'edit_infracoes', label: 'Editar Infrações' }] },
  { group: 'Punições', permissions: [{ id: 'view_punicoes', label: 'Ver Punições' }, { id: 'edit_punicoes', label: 'Editar Punições' }] },
  { group: 'Relatórios', permissions: [{ id: 'view_relatorios', label: 'Ver Relatórios' }, { id: 'edit_relatorios', label: 'Editar Relatórios' }] },
  { group: 'Webhooks', permissions: [{ id: 'view_webhooks', label: 'Ver Webhooks' }, { id: 'edit_webhooks', label: 'Editar Webhooks' }] },
  { group: 'Templates', permissions: [{ id: 'view_templates', label: 'Ver Templates' }, { id: 'edit_templates', label: 'Editar Templates' }] },
  { group: 'Kanban', permissions: [{ id: 'view_kanban', label: 'Ver Kanban' }, { id: 'edit_kanban', label: 'Editar Kanban' }] },
  { group: 'Logs', permissions: [{ id: 'view_logs', label: 'Ver Logs' }] },
  { group: 'Recrutamento', permissions: [{ id: 'view_recrutamento', label: 'Ver Recrutamento' }] },
  { group: 'Convidados', permissions: [{ id: 'view_convidados', label: 'Ver Convidados' }, { id: 'edit_convidados', label: 'Editar Convidados' }] },
]

export default function ConvidadosPage() {
  const { isAdmin, temPermissao, user } = usePermissions()
  const podeVer = isAdmin || temPermissao('view_convidados')
  const podeEditar = isAdmin || temPermissao('edit_convidados')

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userParaEditar, setUserParaEditar] = useState<User | null>(null)
  const [userParaDeletar, setUserParaDeletar] = useState<User | null>(null)

  // Form state
  const [nome, setNome] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    try {
      const response = await fetch(`/api/users?t=${Date.now()}`, { cache: 'no-store' })
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (user?: User) => {
    if (user) {
      setUserParaEditar(user)
      setNome(user.nome || '')
      setLogin(user.login)
      setPermissoesSelecionadas(user.permissoes || [])
    } else {
      setUserParaEditar(null)
      setNome('')
      setLogin('')
      setPermissoesSelecionadas([])
    }
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (permissoesSelecionadas.length === 0) {
      setError('Erro: É obrigatório atribuir pelo menos uma permissão ao convidado.')
      return
    }

    if (!userParaEditar && (!password || password !== confirmPassword)) {
      setError('As senhas não coincidem ou estão vazias.')
      return
    }

    try {
      const method = userParaEditar ? 'PUT' : 'POST'
      const body: any = { 
        nome, 
        login, 
        permissoes: permissoesSelecionadas 
      }

      if (userParaEditar) {
        body.id = userParaEditar.id
        if (password) {
          if (password !== confirmPassword) {
            setError('As senhas não coincidem.')
            return
          }
          body.password = password
        }
      } else {
        if (!password || password !== confirmPassword) {
          setError('As senhas não coincidem ou estão vazias.')
          return
        }
        body.password = password
      }

      const response = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar usuário')
      }

      const userSalvo = await response.json()

      // Limpar campos de senha após sucesso
      setPassword('')
      setConfirmPassword('')
      
      await logActivity(userParaEditar ? 'updated' : 'created', 'convidado', userSalvo.id, nome || login, user?.login)
      setIsModalOpen(false)
      carregarUsuarios()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async () => {
    if (!userParaDeletar) return
    try {
      const response = await fetch(`/api/users?id=${userParaDeletar.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir usuário')
      
      await logActivity('deleted', 'convidado', userParaDeletar.id, userParaDeletar.nome || userParaDeletar.login, user?.login)
      setIsDeleteModalOpen(false)
      carregarUsuarios()
    } catch (err) {
      console.error(err)
    }
  }

  const togglePermission = (permId: string) => {
    setPermissoesSelecionadas(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    )
  }

  if (loading) return <div className="flex justify-center p-10 font-medium text-gray-600">Carregando...</div>
  
  if (!podeVer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  const convidados = users.filter(user => user.id !== 'admin_001')

  const getPermissionLabel = (id: string) => {
    for (const group of TODAS_PERMISSOES) {
      const perm = group.permissions.find(p => p.id === id)
      if (perm) return perm.label
    }
    return id
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários Convidados</h1>
          <p className="text-gray-600">Gerenciar acesso de convidados ao sistema</p>
        </div>
        {podeEditar && (
          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-md hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Convidado
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Nome</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Login</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Permissões</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {convidados.length > 0 ? convidados.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{user.nome || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.login}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.permissoes && (
                        <>
                          {user.permissoes.slice(0, 2).map(p => (
                            <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium border border-gray-200">
                              {getPermissionLabel(p)}
                            </span>
                          ))}
                          {user.permissoes.length > 2 && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold border border-blue-100">
                              +{user.permissoes.length - 2}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {podeEditar && (
                        <>
                          <button onClick={() => handleOpenModal(user)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => { setUserParaDeletar(user); setIsDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-lg font-medium">Nenhum convidado criado</p>
                      <p className="text-sm">Clique em &quot;Adicionar Convidado&quot; para começar.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar/Editar */}
      {isModalOpen && (
        <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} contentClassName="max-w-2xl" overlayClassName="overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{userParaEditar ? 'Editar Convidado' : 'Adicionar Convidado'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Login *</label>
                  <input type="text" value={login} onChange={e => setLogin(e.target.value)} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha {userParaEditar ? '(deixe vazio para manter)' : '*'}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required={!userParaEditar}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none pr-10" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Senha {userParaEditar ? '(deixe vazio para manter)' : '*'}
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      required={!userParaEditar && password !== ''}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none pr-10" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {error && (error.includes('senha') || error.includes('coincidem')) && (
                  <p className="md:col-span-2 text-sm text-red-600 font-medium">{error}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Permissões *</label>
                <div className="border border-gray-100 rounded-xl p-4 max-h-64 overflow-y-auto space-y-4">
                  {TODAS_PERMISSOES.map(group => (
                    <div key={group.group} className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{group.group}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.permissions.map(perm => (
                          <label key={perm.id} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={permissoesSelecionadas.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-600 group-hover:text-gray-900">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {error && !error.includes('senha') && !error.includes('coincidem') && <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">Cancelar</button>
                <button
                  type="submit"
                  disabled={permissoesSelecionadas.length === 0}
                  className="px-8 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </BaseModal>
      )}

      {/* Modal Confirmar Exclusão */}
      <ConfirmarExclusaoModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemNome={userParaDeletar?.nome || userParaDeletar?.login || ''}
        tipoItem="convidado"
      />
    </div>
  )
}
