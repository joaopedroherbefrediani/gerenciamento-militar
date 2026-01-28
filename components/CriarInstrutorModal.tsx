'use client'

import { useEffect, useMemo, useState } from 'react'
import BaseModal from '@/components/BaseModal'

type MilitarOption = {
  id: string
  nomeCompleto: string
  matricula?: string
  status?: string
}

type CursoOption = {
  id: string
  nome: string
}

export type InstrutorPreferenciaTipo = {
  curso: boolean
  recrutamento: boolean
}

export type Instrutor = {
  id: string
  militarId: string
  preferenciaTipo: InstrutorPreferenciaTipo
  todosCursos: boolean
  cursosPreferidos: string[]
  cursosPassados: number
  recrutamentosFeitos: number
  horariosPreferidos: string
}

interface CriarInstrutorModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (dados: Omit<Instrutor, 'id'>) => void | Promise<void>
  onUpdate: (dados: Instrutor) => void | Promise<void>
  instrutorEditando?: Instrutor | null
  militares: MilitarOption[]
  cursos: CursoOption[]
}

function clampInt(v: string): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

export default function CriarInstrutorModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  instrutorEditando = null,
  militares,
  cursos,
}: CriarInstrutorModalProps) {
  const [isClient, setIsClient] = useState(false)
  const [militarId, setMilitarId] = useState('')
  const [prefCurso, setPrefCurso] = useState(false)
  const [prefRecrut, setPrefRecrut] = useState(false)
  const [todosCursos, setTodosCursos] = useState(false)
  const [cursosPreferidos, setCursosPreferidos] = useState<string[]>([])
  const [cursosPassados, setCursosPassados] = useState(0)
  const [recrutamentosFeitos, setRecrutamentosFeitos] = useState(0)
  const [horariosPreferidos, setHorariosPreferidos] = useState('')

  useEffect(() => setIsClient(true), [])

  const militaresOrdenados = useMemo(() => {
    const list = (militares || []).slice()
    list.sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto))
    return list
  }, [militares])

  const cursosOrdenados = useMemo(() => {
    const list = (cursos || []).slice()
    list.sort((a, b) => a.nome.localeCompare(b.nome))
    return list
  }, [cursos])

  useEffect(() => {
    if (!isOpen) return

    if (instrutorEditando) {
      setMilitarId(instrutorEditando.militarId)
      setPrefCurso(!!instrutorEditando.preferenciaTipo?.curso)
      setPrefRecrut(!!instrutorEditando.preferenciaTipo?.recrutamento)
      setTodosCursos(!!instrutorEditando.todosCursos)
      setCursosPreferidos(Array.isArray(instrutorEditando.cursosPreferidos) ? instrutorEditando.cursosPreferidos : [])
      setCursosPassados(instrutorEditando.cursosPassados || 0)
      setRecrutamentosFeitos(instrutorEditando.recrutamentosFeitos || 0)
      setHorariosPreferidos(instrutorEditando.horariosPreferidos || '')
    } else {
      setMilitarId('')
      setPrefCurso(false)
      setPrefRecrut(false)
      setTodosCursos(false)
      setCursosPreferidos([])
      setCursosPassados(0)
      setRecrutamentosFeitos(0)
      setHorariosPreferidos('')
    }
  }, [instrutorEditando, isOpen])

  const toggleCursoPreferido = (cursoId: string) => {
    setCursosPreferidos((prev) => {
      if (prev.includes(cursoId)) return prev.filter((x) => x !== cursoId)
      return [...prev, cursoId]
    })
  }

  const handleToggleTodosCursos = (checked: boolean) => {
    setTodosCursos(checked)
    if (checked) {
      setCursosPreferidos([])
    }
  }

  const handleToggleOsDois = (checked: boolean) => {
    setPrefCurso(checked)
    setPrefRecrut(checked)
  }

  const preferenciaTipoLabel = () => {
    if (prefCurso && prefRecrut) return 'Curso e Recrutamento'
    if (prefCurso) return 'Curso'
    if (prefRecrut) return 'Recrutamento'
    return '—'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!militarId) {
      alert('Selecione um militar para cadastrar como instrutor.')
      return
    }
    if (!prefCurso && !prefRecrut) {
      alert('Selecione pelo menos uma preferência de instrução (Curso e/ou Recrutamento).')
      return
    }

    const payloadBase = {
      militarId,
      preferenciaTipo: { curso: prefCurso, recrutamento: prefRecrut },
      todosCursos,
      cursosPreferidos: todosCursos ? [] : cursosPreferidos,
      cursosPassados,
      recrutamentosFeitos,
      horariosPreferidos: horariosPreferidos.trim(),
    }

    if (instrutorEditando) {
      await onUpdate({ ...payloadBase, id: instrutorEditando.id })
    } else {
      await onCreate(payloadBase)
    }
    onClose()
  }

  if (!isOpen || !isClient) return null

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} contentClassName="max-w-xl lg:max-w-2xl">
      <div className="bg-white rounded-lg shadow-xl w-full max-h-[85dvh] sm:max-h-[90dvh] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{instrutorEditando ? 'Editar Instrutor' : 'Adicionar Instrutor'}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Preferência atual: <span className="font-medium text-gray-800">{preferenciaTipoLabel()}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar pr-2 space-y-5">
            {/* Militar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Militar <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={militarId}
                  onChange={(e) => setMilitarId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                  required
                >
                  <option value="">Selecione um militar...</option>
                  {militaresOrdenados.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nomeCompleto}
                      {m.matricula ? ` • ${m.matricula}` : ''}
                      {m.status ? ` • ${m.status}` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Apenas militares já cadastrados podem virar instrutores.</p>
            </div>

            {/* Preferência de instrução */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700">Preferência de instrução</label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefCurso && prefRecrut}
                    onChange={(e) => handleToggleOsDois(e.target.checked)}
                    className="w-4 h-4 focus:ring-green-500 focus:ring-2"
                  />
                  Os dois
                </label>
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefCurso}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setPrefCurso(checked)
                    }}
                    className="w-4 h-4 focus:ring-green-500 focus:ring-2"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">Curso</div>
                    <div className="text-xs text-gray-500">Prefere instruir cursos.</div>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefRecrut}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setPrefRecrut(checked)
                    }}
                    className="w-4 h-4 focus:ring-green-500 focus:ring-2"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">Recrutamento</div>
                    <div className="text-xs text-gray-500">Prefere instruir recrutamentos.</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Cursos */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700">Cursos de preferência (opcional)</label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={todosCursos}
                    onChange={(e) => handleToggleTodosCursos(e.target.checked)}
                    className="w-4 h-4 focus:ring-green-500 focus:ring-2"
                  />
                  Todos
                </label>
              </div>

              <div className={`mt-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar border border-gray-200 rounded-lg p-3 ${todosCursos ? 'opacity-60' : ''}`}>
                {cursosOrdenados.length === 0 ? (
                  <div className="text-sm text-gray-500">Nenhum curso cadastrado.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cursosOrdenados.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={todosCursos}
                          checked={!todosCursos && cursosPreferidos.includes(c.id)}
                          onChange={() => toggleCursoPreferido(c.id)}
                          className="w-4 h-4 focus:ring-green-500 focus:ring-2 disabled:opacity-60"
                        />
                        <span className="text-sm text-gray-700">{c.nome}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Se “Todos” estiver marcado, os cursos individuais são ignorados.</p>
            </div>

            {/* Contadores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantos cursos já passou</label>
                <input
                  type="number"
                  min={0}
                  value={cursosPassados}
                  onChange={(e) => setCursosPassados(clampInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantos recrutamentos já fez</label>
                <input
                  type="number"
                  min={0}
                  value={recrutamentosFeitos}
                  onChange={(e) => setRecrutamentosFeitos(clampInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Horários */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Melhores horários</label>
              <input
                value={horariosPreferidos}
                onChange={(e) => setHorariosPreferidos(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Ex: 19:00–23:00 (seg–sex) / finais de semana à tarde"
              />
            </div>
          </div>

          {/* Footer fixo */}
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-white shrink-0">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium"
              >
                {instrutorEditando ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </BaseModal>
  )
}

