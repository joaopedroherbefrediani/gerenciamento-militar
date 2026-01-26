'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import { migrateLocalStorageToAPI } from '@/lib/migrate-data'
import BaseModal from '@/components/BaseModal'

// Importação corrigida: useDataSync e useDataMutation importados corretamente

type Questao = {
  id: string
  numero: number
  texto: string
  categoria: 'Geral' | 'Modulações' | 'Códigos Q' | 'Códigos de PTR' | 'Situações'
}

const CATEGORIAS = ['Geral', 'Modulações', 'Códigos Q', 'Códigos de PTR', 'Situações'] as const

// Questões organizadas por categoria conforme imagens
const TODAS_QUESTOES: Questao[] = [
  // Geral - 5 questões
  {
    id: 'geral-1',
    numero: 1,
    texto: 'Quantas viaturas são permitidas em um acompanhamento com efetivo mínimo?',
    categoria: 'Geral',
  },
  {
    id: 'geral-2',
    numero: 2,
    texto: 'O que é insubordinação, desacato e corrupção?',
    categoria: 'Geral',
  },
  {
    id: 'geral-3',
    numero: 3,
    texto: 'Quando a ROTA foi criada e qual o contexto do termo "ROTA"? (nome completo por extenso).',
    categoria: 'Geral',
  },
  {
    id: 'geral-4',
    numero: 4,
    texto: 'O que é considerado uma ronda ostensiva?',
    categoria: 'Geral',
  },
  {
    id: 'geral-5',
    numero: 5,
    texto: 'Você está ciente de que, ao ingressar na ROTA, terá até 5 dias para concluir os cursos básicos e apresentar o laudo médico?',
    categoria: 'Geral',
  },
  // Modulações - 4 questões
  {
    id: 'modulacoes-1',
    numero: 1,
    texto: 'Simule uma modulação de abordagem de Código 2 dentro do estacionamento vermelho.',
    categoria: 'Modulações',
  },
  {
    id: 'modulacoes-2',
    numero: 2,
    texto: 'Simule uma modulação de abordagem de Código 3 em um pinote no Banco Central',
    categoria: 'Modulações',
  },
  {
    id: 'modulacoes-3',
    numero: 3,
    texto: 'Simule uma modulação de acompanhamento de um R34 tripulado por dois indivíduos em uma QRU de drogas no píer.',
    categoria: 'Modulações',
  },
  {
    id: 'modulacoes-4',
    numero: 4,
    texto: 'Qual modulação deve ser feita em um acompanhamento a pé e como o indivíduo deve ser detido?',
    categoria: 'Modulações',
  },
  // Códigos Q - 5 questões
  {
    id: 'codigos-q-1',
    numero: 1,
    texto: 'Cite 6 códigos Q e seus respectivos significados.',
    categoria: 'Códigos Q',
  },
  {
    id: 'codigos-q-2',
    numero: 2,
    texto: 'O que significa QSJ?',
    categoria: 'Códigos Q',
  },
  {
    id: 'codigos-q-3',
    numero: 3,
    texto: 'O que significa QSM?',
    categoria: 'Códigos Q',
  },
  {
    id: 'codigos-q-4',
    numero: 4,
    texto: 'O que significa QRX?',
    categoria: 'Códigos Q',
  },
  {
    id: 'codigos-q-5',
    numero: 5,
    texto: 'O que significa QRT?',
    categoria: 'Códigos Q',
  },
  // Códigos de PTR - 3 questões
  {
    id: 'codigos-ptr-1',
    numero: 1,
    texto: 'Quando o Código 5 pode ser liberado?',
    categoria: 'Códigos de PTR',
  },
  {
    id: 'codigos-ptr-2',
    numero: 2,
    texto: 'Em quais situações é feito um QTA de um acompanhamento em rede? Cite exemplos.',
    categoria: 'Códigos de PTR',
  },
  {
    id: 'codigos-ptr-3',
    numero: 3,
    texto: 'Quais são os códigos de modulação de 0 a 6 e em quais situações são aplicados?',
    categoria: 'Códigos de PTR',
  },
  // Situações - 8 questões
  {
    id: 'situacoes-1',
    numero: 1,
    texto: 'Como deve ser realizada a revista em uma pessoa do sexo oposto?',
    categoria: 'Situações',
  },
  {
    id: 'situacoes-2',
    numero: 2,
    texto: 'Realize uma simulação de uma situação de Código 2 (Tráfico de drogas).',
    categoria: 'Situações',
  },
  {
    id: 'situacoes-3',
    numero: 3,
    texto: 'Realize uma simulação de uma situação de QRU de disparo de arma de fogo.',
    categoria: 'Situações',
  },
  {
    id: 'situacoes-4',
    numero: 4,
    texto: 'Qual seria sua reação e como agiria se, durante um pinote, sua viatura colidisse com um civil e este viesse a desmaiar?',
    categoria: 'Situações',
  },
  {
    id: 'situacoes-5',
    numero: 5,
    texto: 'Qual seria sua reação e como agiria se um superior hierárquico lhe desse uma ordem controversa?',
    categoria: 'Situações',
  },
  {
    id: 'situacoes-6',
    numero: 6,
    texto: 'Na capital, o que ocorre quando um indivíduo em um pinote lança o veículo em direção ao mar permanecendo dentro dele?',
    categoria: 'Situações',
  },
  {
    id: 'situacoes-7',
    numero: 7,
    texto: 'Qual seria seu comportamento e sua ação ao presenciar um indivíduo proferindo palavras de baixo calão enquanto seu radar acusa QRUs de drogas e disparos de arma de fogo?',
    categoria: 'Situações',
  },
  {
    id: 'situacoes-8',
    numero: 8,
    texto: 'Qual seria sua reação ao ser abordado por um veículo blindado com quatro indivíduos fortemente armados, estando você acompanhado apenas de um parceiro de farda?',
    categoria: 'Situações',
  },
]

type Prova = {
  id: string
  nomeConscrito: string
  nomeInstrutor: string
  questoes: Questao[]
  dataCriacao: string
  horaCriacao: string
  pontuacaoMinima: number
  avaliacoes?: Record<string, 'correto' | 'incorreto' | null>
}

export default function RecrutamentoPage() {
  const { isAdmin, temPermissao } = usePermissions()
  const podeVer = isAdmin || temPermissao('view_recrutamento')
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [nomeConscrito, setNomeConscrito] = useState('')
  const [nomeInstrutor, setNomeInstrutor] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState<typeof CATEGORIAS[number]>('Geral')
  const [questoesSelecionadas, setQuestoesSelecionadas] = useState<string[]>([])
  const [isModalAberto, setIsModalAberto] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const questoesFiltradas = TODAS_QUESTOES.filter(q => q.categoria === categoriaAtiva)

  const lastToggleRef = useRef<{ id: string; t: number } | null>(null)
  const toggleQuestao = (questaoId: string) => {
    const now = Date.now()
    if (lastToggleRef.current?.id === questaoId && now - lastToggleRef.current.t < 80) {
      lastToggleRef.current = null
      return
    }
    lastToggleRef.current = { id: questaoId, t: now }
    setQuestoesSelecionadas(prev => {
      if (prev.includes(questaoId)) return prev.filter(id => id !== questaoId)
      return [...prev, questaoId]
    })
  }

  const limparSelecao = () => {
    setQuestoesSelecionadas([])
  }

  const gerarPerguntasAleatorias = () => {
    // Selecionar 10 questões aleatórias de todas as categorias
    const questoesDisponiveis = [...TODAS_QUESTOES]
    const questoesAleatorias: string[] = []
    
    // Embaralhar e pegar 10 primeiras
    const embaralhadas = questoesDisponiveis.sort(() => Math.random() - 0.5)
    const selecionadas = embaralhadas.slice(0, 10)
    
    setQuestoesSelecionadas(selecionadas.map(q => q.id))
  }

  const { create: createProva } = useDataMutation<Prova>('provas')
  const { refresh: refreshProvas } = useDataSync<Prova>({ entity: 'provas' })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      migrateLocalStorageToAPI()
    }
  }, [])

  const gerarProva = async () => {
    if (questoesSelecionadas.length === 0) {
      alert('Por favor, selecione pelo menos uma questão ou gere perguntas aleatórias.')
      return
    }
    
    if (!nomeConscrito.trim() || !nomeInstrutor.trim()) {
      setIsModalAberto(true)
      return
    }

    const agora = new Date()
    const dataCriacao = agora.toLocaleDateString('pt-BR')
    const horaCriacao = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    const questoesSelecionadasObjetos = TODAS_QUESTOES
      .filter(q => questoesSelecionadas.includes(q.id))
      .map((q, index) => ({ ...q, numero: index + 1 }))

    const novaProva = {
      nomeConscrito: nomeConscrito.trim(),
      nomeInstrutor: nomeInstrutor.trim(),
      questoes: questoesSelecionadasObjetos,
      dataCriacao,
      horaCriacao,
      pontuacaoMinima: 8,
      avaliacoes: {},
    }

    // Salvar prova via API
    try {
      const resultado = await createProva(novaProva)
      if (resultado?.id) {
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('prova_nova_' + resultado.id, JSON.stringify(resultado))
          } catch (_) {}
        }
        refreshProvas()
        await new Promise((r) => setTimeout(r, 1200))
        router.push(`/dashboard/recrutamento/${resultado.id}`)
      } else {
        alert('Erro ao criar prova. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao criar prova:', error)
      alert('Erro ao criar prova. Verifique o console para mais detalhes.')
    }
  }

  const questoesSelecionadasObjetos = TODAS_QUESTOES.filter(q => questoesSelecionadas.includes(q.id))

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Recrutamento</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Sistema de provas teóricas militares</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/recrutamento/provas')}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Provas
        </button>
      </div>

      {/* Campos de Nome */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Conscrito:
          </label>
          <input
            type="text"
            value={nomeConscrito}
            onChange={(e) => setNomeConscrito(e.target.value)}
            placeholder="Digite o nome do conscrito"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Instrutor:
          </label>
          <input
            type="text"
            value={nomeInstrutor}
            onChange={(e) => setNomeInstrutor(e.target.value)}
            placeholder="Digite o nome do instrutor"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Seções Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Seção Esquerda: Questões Selecionadas */}
        <div className="flex flex-col">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 flex-1 min-h-[400px] sm:min-h-[500px]">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Questões Selecionadas</h2>
            <div className="h-full flex items-center justify-center">
              {questoesSelecionadasObjetos.length === 0 ? (
                <p className="text-gray-400 text-center">Nenhuma pergunta selecionada</p>
              ) : (
                <div className="w-full space-y-3 overflow-y-auto custom-scrollbar max-h-[400px]">
                  {questoesSelecionadasObjetos.map((questao) => (
                    <div
                      key={questao.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-semibold text-gray-700">{questao.numero}:</span>
                        <span className="text-gray-700 flex-1">{questao.texto}</span>
                        <button
                          onClick={() => toggleQuestao(questao.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Remover"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={gerarPerguntasAleatorias}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              GERAR PERGUNTAS ALEATÓRIAS
            </button>
            <button
              onClick={gerarProva}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium"
            >
              GERAR PROVA
            </button>
          </div>
        </div>

        {/* Seção Direita: Seleção Manual */}
        <div className="flex flex-col">
          <div className="bg-white rounded-lg shadow-sm p-6 flex-1 min-h-[500px] flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecione perguntas manualmente</h2>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200 overflow-x-auto custom-scrollbar-horizontal pb-2">
              {CATEGORIAS.map((categoria) => (
                <button
                  key={categoria}
                  onClick={() => setCategoriaAtiva(categoria)}
                  className={`flex-shrink-0 px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    categoriaAtiva === categoria
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {categoria}
                </button>
              ))}
            </div>

            {/* Lista de Questões */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                {questoesFiltradas.map((questao) => (
                  <div
                    key={questao.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleQuestao(questao.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleQuestao(questao.id) } }}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={questoesSelecionadas.includes(questao.id)}
                      readOnly
                      tabIndex={-1}
                      className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 pointer-events-none"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-700">{questao.numero}:</span>
                      <span className="text-gray-700 ml-2">{questao.texto}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão Limpar Seleção */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={limparSelecao}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                LIMPAR SELEÇÃO
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Nome do Conscrito e Instrutor */}
      {isModalAberto && (
        <BaseModal isOpen={isModalAberto} onClose={() => setIsModalAberto(false)} contentClassName="max-w-md">
          <div className="bg-white rounded-lg shadow-xl w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Campos Obrigatórios
              </h2>
              <button
                onClick={() => setIsModalAberto(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">
                    Por favor, preencha o <strong>Nome do Conscrito</strong> e o <strong>Nome do Instrutor</strong> antes de gerar a prova.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setIsModalAberto(false)}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium"
              >
                Entendi
              </button>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  )
}
