'use client'

import { useState, useEffect, useLayoutEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import { useDataSync, useDataMutation } from '@/hooks/useDataSync'
import { migrateLocalStorageToAPI } from '@/lib/migrate-data'
import BaseModal from '@/components/BaseModal'

const STORAGE_KEY = 'prova_nova_'
function getProvaId(params: { id?: string | string[] }): string {
  const id = params?.id
  return typeof id === 'string' ? id : Array.isArray(id) ? id[0] || '' : String(id || '')
}

type Questao = {
  id: string
  numero: number
  texto: string
  categoria: string
}

type Prova = {
  id: string
  nomeConscrito: string
  nomeInstrutor: string
  questoes: Questao[]
  dataCriacao: string
  horaCriacao: string
  pontuacaoMinima: number
  avaliacoes?: Record<string, 'correto' | 'incorreto' | null>
  finalizada?: boolean
  dataFinalizacao?: string
  horaFinalizacao?: string
}

export default function ProvaPage() {
  const { isAdmin, temPermissao, loading: permissionsLoading } = usePermissions()
  const router = useRouter()
  const params = useParams()
  const [isClient, setIsClient] = useState(false)
  const [prova, setProva] = useState<Prova | null>(null)
  const [avaliacoes, setAvaliacoes] = useState<Record<string, 'correto' | 'incorreto' | null>>({})
  const [provaFinalizada, setProvaFinalizada] = useState(false)
  const [isModalAberto, setIsModalAberto] = useState(false)
  const [isModalSucessoAberto, setIsModalSucessoAberto] = useState(false)

  const podeVer = isAdmin || temPermissao('view_recrutamento')

  // Sincronização de dados via API
  const { data: provasData, refresh: refreshProvas, loading: provasLoading } = useDataSync<Prova>({ 
    entity: 'provas',
    pollingInterval: 2000 // Atualizar a cada 2 segundos
  })
  const { update: updateProva } = useDataMutation<Prova>('provas')

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      migrateLocalStorageToAPI()
    }
  }, [])

  const provaId = getProvaId(params)

  // Ler sessionStorage ANTES da pintura (prova recém-criada)
  useLayoutEffect(() => {
    if (!provaId || typeof window === 'undefined') return
    const raw = sessionStorage.getItem(STORAGE_KEY + provaId)
    if (!raw) return
    try {
      const p = JSON.parse(raw) as Prova
      if (p && p.id && p.questoes) {
        setProva(p)
        setAvaliacoes(p.avaliacoes || {})
        setProvaFinalizada(!!p.finalizada)
      }
    } catch (_) {}
  }, [provaId])

  useEffect(() => {
    if (params.id) refreshProvas()
  }, [params.id, refreshProvas])

  useEffect(() => {
    if (!provaId) return

    // 1) Se a API já tem a prova, usar e limpar sessionStorage
    const provaEncontrada = provasData?.find((p) => p.id === provaId)
    if (provaEncontrada) {
      setProva(provaEncontrada)
      setAvaliacoes(provaEncontrada.avaliacoes || {})
      setProvaFinalizada(!!provaEncontrada.finalizada)
      if (typeof window !== 'undefined') sessionStorage.removeItem(STORAGE_KEY + provaId)
      return
    }

    // 2) Fallback: sessionStorage (prova recém-criada, API ainda não propagou)
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY + provaId) : null
    if (raw) {
      try {
        const p = JSON.parse(raw) as Prova
        if (p && p.id && p.questoes) {
          setProva(p)
          setAvaliacoes(p.avaliacoes || {})
          setProvaFinalizada(!!p.finalizada)
        }
      } catch (_) {}
      return
    }

    if (!provasLoading && provasData && provasData.length > 0) {
      console.log('Prova não encontrada. ID:', provaId, 'Provas disponíveis:', provasData.map((p) => p.id))
    }
  }, [provasData, provaId, provasLoading])

  const avaliarQuestao = async (questaoId: string, resultado: 'correto' | 'incorreto') => {
    if (provaFinalizada || !prova) return // Não permitir alterar avaliações se a prova estiver finalizada

    const novasAvaliacoes = {
      ...avaliacoes,
      [questaoId]: resultado,
    }
    setAvaliacoes(novasAvaliacoes)

    // Atualizar via API
    const resultadoUpdate = await updateProva(prova.id, {
      avaliacoes: novasAvaliacoes,
    })
    
    if (resultadoUpdate) {
      setProva(resultadoUpdate)
      refreshProvas()
    }
  }

  const finalizarProva = async () => {
    if (!prova) return

    const totalAvaliadas = Object.values(avaliacoes).filter(a => a !== null).length
    if (totalAvaliadas < prova.questoes.length) {
      setIsModalAberto(true)
      return
    }

    const agora = new Date()
    const dataFinalizacao = agora.toLocaleDateString('pt-BR')
    const horaFinalizacao = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    // Atualizar via API
    const resultadoUpdate = await updateProva(prova.id, {
      finalizada: true,
      dataFinalizacao,
      horaFinalizacao,
    })
    
    if (resultadoUpdate) {
      setProva(resultadoUpdate)
      setProvaFinalizada(true)
      setIsModalSucessoAberto(true)
      refreshProvas()
    }
  }

  if (!isClient || permissionsLoading) {
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

  if (!prova) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Prova não encontrada</h2>
          <button
            onClick={() => router.push('/dashboard/recrutamento')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  const dataFormatada = prova.dataCriacao
  const totalCorretas = Object.values(avaliacoes).filter(a => a === 'correto').length
  const totalIncorretas = Object.values(avaliacoes).filter(a => a === 'incorreto').length
  const totalAvaliadas = totalCorretas + totalIncorretas

  return (
    <div className="space-y-6 pt-6">
      {/* Header: em mobile o botão Voltar fica abaixo do título */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Prova de Recrutamento - {prova.nomeConscrito}
        </h1>
        <button
          onClick={() => router.push('/dashboard/recrutamento')}
          className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
      </div>

      {/* Card Principal */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Informações da Prova */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <span className="font-semibold text-gray-900">Nome do Conscrito: </span>
            <span className="text-gray-700">{prova.nomeConscrito}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Nome do Instrutor: </span>
            <span className="text-gray-700">{prova.nomeInstrutor}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Total de questões: </span>
            <span className="text-gray-700">{prova.questoes.length}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Data de criação: </span>
            <span className="text-gray-700">{prova.dataCriacao} às {prova.horaCriacao}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Pontuação necessária para aprovação: </span>
            <span className="text-gray-700">{prova.pontuacaoMinima} pontos (mínimo)</span>
          </div>
          {prova.finalizada && prova.dataFinalizacao && (
            <div className="col-span-2">
              <span className="font-semibold text-gray-900">Data de finalização: </span>
              <span className="text-gray-700">{prova.dataFinalizacao} às {prova.horaFinalizacao}</span>
            </div>
          )}
        </div>

        {/* Questões */}
        <div className="space-y-6">
          {prova.questoes.map((questao) => {
            const avaliacaoAtual = avaliacoes[questao.id]
            return (
              <div key={questao.id} className="border-l-4 border-blue-500 pl-4">
                <div className="mb-3">
                  <span className="font-bold text-blue-600">Questão {questao.numero}:</span>
                  <p className="text-gray-700 mt-1">{questao.texto}</p>
                </div>
                
                <div className="mt-4">
                  <span className="font-semibold text-gray-900 mb-2 block">Avaliação:</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => avaliarQuestao(questao.id, 'correto')}
                      disabled={provaFinalizada}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        avaliacaoAtual === 'correto'
                          ? 'bg-green-600 text-white'
                          : provaFinalizada
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Correto
                    </button>
                    <button
                      onClick={() => avaliarQuestao(questao.id, 'incorreto')}
                      disabled={provaFinalizada}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        avaliacaoAtual === 'incorreto'
                          ? 'bg-red-600 text-white'
                          : provaFinalizada
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Incorreto
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Resumo */}
        {totalAvaliadas > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Resumo da Avaliação:</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">Total avaliadas: </span>
                  <span className="font-semibold text-gray-900">{totalAvaliadas}/{prova.questoes.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Corretas: </span>
                  <span className="font-semibold text-green-600">{totalCorretas}</span>
                </div>
                <div>
                  <span className="text-gray-600">Incorretas: </span>
                  <span className="font-semibold text-red-600">{totalIncorretas}</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-gray-600">Status: </span>
                <span className={`font-semibold ${totalCorretas >= prova.pontuacaoMinima ? 'text-green-600' : 'text-red-600'}`}>
                  {totalCorretas >= prova.pontuacaoMinima ? 'APROVADO' : 'REPROVADO'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botão Finalizar */}
        {!provaFinalizada && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={finalizarProva}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Finalizar Prova
            </button>
          </div>
        )}

        {/* Mensagem de Prova Finalizada */}
        {provaFinalizada && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-lg">Prova Finalizada</span>
              </div>
              {prova.dataFinalizacao && (
                <p className="text-green-600 mt-2">
                  Finalizada em {prova.dataFinalizacao} às {prova.horaFinalizacao}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Aviso */}
      {isModalAberto && (
        <BaseModal isOpen={isModalAberto} onClose={() => setIsModalAberto(false)} contentClassName="max-w-md">
          <div className="bg-white rounded-lg shadow-xl w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Questões Não Avaliadas
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
                    {prova && (
                      <>
                        Você precisa avaliar todas as <strong>{prova.questoes.length} questões</strong> antes de finalizar a prova.
                        <br />
                        <br />
                        Ainda existem <strong>{prova.questoes.length - Object.values(avaliacoes).filter(a => a !== null).length} questão(ões)</strong> não avaliada(s).
                      </>
                    )}
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

      {/* Modal de Sucesso */}
      {isModalSucessoAberto && (
        <BaseModal isOpen={isModalSucessoAberto} onClose={() => setIsModalSucessoAberto(false)} contentClassName="max-w-md">
          <div className="bg-white rounded-lg shadow-xl w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Prova Finalizada
              </h2>
              <button
                onClick={() => setIsModalSucessoAberto(false)}
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
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">
                    A prova foi finalizada com sucesso!
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setIsModalSucessoAberto(false)}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  )
}
