'use client'

import { useState, useEffect } from 'react'
import CriarCargoModal from '@/components/CriarCargoModal'
import ConfirmarExclusaoModal from '@/components/ConfirmarExclusaoModal'
import { logActivity } from '@/lib/activity-log'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import { migrateLocalStorageToAPI } from '@/lib/migrate-data'

type Cargo = {
  id: string
  nome: string
  nivel: number
  cor: string
  discordRoleId?: string
}

export default function CargosPage() {
  const { isAdmin, temPermissao, loading, user } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [cargoParaEditar, setCargoParaEditar] = useState<Cargo | null>(null)
  const [cargoParaDeletar, setCargoParaDeletar] = useState<Cargo | null>(null)
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [isClient, setIsClient] = useState(false)
  
  const podeVer = isAdmin || temPermissao('view_cargos')
  const podeEditar = isAdmin || temPermissao('edit_cargos')

  const { data: cargosData, refresh: refreshCargos } = useDataSync<Cargo>({ entity: 'cargos', pollingInterval: 2000 })
  const { create: createCargo, update: updateCargo, remove: removeCargo } = useDataMutation<Cargo>('cargos')

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') migrateLocalStorageToAPI()
  }, [])

  useEffect(() => {
    if (cargosData) setCargos(cargosData)
  }, [cargosData])
  
  // Estados para filtros
  const [busca, setBusca] = useState('')
  const [filtroAlto, setFiltroAlto] = useState(true)
  const [filtroMedio, setFiltroMedio] = useState(true)
  const [filtroBaixo, setFiltroBaixo] = useState(true)

  // Função para filtrar cargos
  const cargosFiltrados = cargos.filter((cargo) => {
    // Filtro por busca (nome)
    const matchBusca = busca.trim() === '' || 
      cargo.nome.toLowerCase().includes(busca.toLowerCase())

    // Se houver busca ativa, ignora os filtros de nível
    if (busca.trim() !== '') {
      return matchBusca
    }

    // Se não houver busca, aplica os filtros de nível
    let matchNivel = false
    if (cargo.nivel >= 67 && cargo.nivel <= 100 && filtroAlto) {
      matchNivel = true
    } else if (cargo.nivel >= 34 && cargo.nivel <= 66 && filtroMedio) {
      matchNivel = true
    } else if (cargo.nivel >= 1 && cargo.nivel <= 33 && filtroBaixo) {
      matchNivel = true
    }

    return matchBusca && matchNivel
  })

  const handleCreateCargo = async (data: {
    nome: string
    nivel: number
    cor: string
    discordRoleId?: string
  }) => {
    const resultado = await createCargo(data)
    if (resultado) {
      await logActivity('created', 'cargo', resultado.id, resultado.nome, user?.login)
      refreshCargos()
    }
  }

  const handleUpdateCargo = async (data: {
    nome: string
    nivel: number
    cor: string
    discordRoleId?: string
  }) => {
    if (!cargoParaEditar) return
    const resultado = await updateCargo(cargoParaEditar.id, data)
    if (resultado) {
      await logActivity('updated', 'cargo', cargoParaEditar.id, data.nome, user?.login)
      refreshCargos()
      setCargoParaEditar(null)
    }
  }

  const handleDeleteCargo = async () => {
    if (!cargoParaDeletar) return
    const { nome: nomeCargo, id: idCargo } = cargoParaDeletar
    const r = await removeCargo(idCargo)
    if (r.ok) {
      await logActivity('deleted', 'cargo', idCargo, nomeCargo, user?.login)
      refreshCargos()
      setCargoParaDeletar(null)
    } else {
      alert('error' in r ? r.error : 'Erro ao excluir cargo. Tente novamente.')
    }
  }

  const handleEditClick = (cargo: Cargo) => {
    setCargoParaEditar(cargo)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (cargo: Cargo) => {
    setCargoParaDeletar(cargo)
    setIsDeleteModalOpen(true)
  }

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

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

  return (
    <>
      <div className="space-y-6 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Cargos e Patentes
            </h1>
            <p className="text-gray-600 text-sm">
              Gerenciar hierarquia da organização
            </p>
          </div>
          {podeEditar && (
            <button
              onClick={() => {
                setCargoParaEditar(null)
                setIsModalOpen(true)
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium px-4 py-2.5 rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Criar Cargo
            </button>
          )}
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="space-y-4">
            {/* Busca */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar cargo..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900 text-sm"
                />
              </div>
            </div>

            {/* Checkboxes de Hierarquia com ícone de filtro */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtroAlto}
                  onChange={(e) => setFiltroAlto(e.target.checked)}
                  className="w-4 h-4 focus:ring-green-500 focus:ring-2 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">Alto (67-100)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtroMedio}
                  onChange={(e) => setFiltroMedio(e.target.checked)}
                  className="w-4 h-4 focus:ring-green-500 focus:ring-2 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">Médio (34-66)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtroBaixo}
                  onChange={(e) => setFiltroBaixo(e.target.checked)}
                  className="w-4 h-4 focus:ring-green-500 focus:ring-2 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">Baixo (1-33)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Lista de Cargos */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          {cargos.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-lg mb-2">
                Nenhum cargo cadastrado
              </p>
              <p className="text-gray-400 text-sm">
                Clique em &quot;Criar Cargo&quot; para começar
              </p>
            </div>
          ) : cargosFiltrados.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-lg mb-2">
                {busca.trim() === '' && !filtroAlto && !filtroMedio && !filtroBaixo
                  ? 'Existem cargos cadastrados, mas nenhum filtro está habilitado'
                  : busca.trim() !== ''
                  ? 'Nenhum cargo encontrado com esse nome'
                  : 'Nenhum cargo encontrado'}
              </p>
              <p className="text-gray-400 text-sm">
                {busca.trim() === '' && !filtroAlto && !filtroMedio && !filtroBaixo
                  ? 'Habilite pelo menos um filtro de hierarquia para visualizar os cargos'
                  : busca.trim() !== ''
                  ? 'Tente buscar com outro termo'
                  : 'Tente ajustar os filtros ou a busca'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cargosFiltrados
                .slice()
                .sort((a, b) => b.nivel - a.nivel)
                .map((cargo) => (
                  <div
                    key={cargo.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cargo.cor }} />
                        <h3 className="font-medium text-gray-900 truncate">
                          {cargo.nome}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 break-words">
                        Nível hierárquico: {cargo.nivel}
                        {cargo.discordRoleId
                          ? ` • Discord Role ID: ${cargo.discordRoleId}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {podeEditar && (
                        <>
                          <button
                            onClick={() => handleEditClick(cargo)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar cargo"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(cargo)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir cargo"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar/Editar */}
      {isModalOpen && podeEditar && (
        <CriarCargoModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setCargoParaEditar(null)
          }}
          onCreate={handleCreateCargo}
          onUpdate={handleUpdateCargo}
          cargoEditando={cargoParaEditar}
        />
      )}

      {/* Modal Confirmar Exclusão */}
      {isDeleteModalOpen && cargoParaDeletar && (
        <ConfirmarExclusaoModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setCargoParaDeletar(null)
          }}
          onConfirm={handleDeleteCargo}
          tipoItem="cargo"
          cargoNome={cargoParaDeletar.nome}
        />
      )}
    </>
  )
}
