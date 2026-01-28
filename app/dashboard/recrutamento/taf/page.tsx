'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'

const YOUTUBE_EMBED_URL = 'https://www.youtube-nocookie.com/embed/Gicy7Hx5ND4'

export default function RecrutamentoTAFPage() {
  const { isAdmin, temPermissao } = usePermissions()
  const podeAcessar = isAdmin || temPermissao('edit_recrutamento')
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => setIsClient(true), [])

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  if (!podeAcessar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-5">Você não tem permissão para acessar o conteúdo do TAF.</p>
          <button
            onClick={() => router.push('/dashboard/recrutamento')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Voltar para Recrutamento
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Teste de Aptidão Física (TAF)</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Orientações e critérios gerais para realização do TAF.
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard/recrutamento')}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
        >
          Voltar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Como funciona</h2>
        <div className="text-gray-700 space-y-3 leading-relaxed">
          <p>
            O TAF (Teste de Aptidão Física) avalia o preparo físico do conscrito em etapas. Os critérios podem variar
            conforme o padrão da corporação, mas geralmente incluem resistência, força e condicionamento.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Compareça com antecedência e com vestimenta adequada para atividade física.</li>
            <li>Realize aquecimento e alongamento antes do início.</li>
            <li>Siga a orientação do instrutor quanto à execução correta de cada exercício.</li>
            <li>Respeite os intervalos e os critérios mínimos de aprovação.</li>
          </ul>
          <p className="text-sm text-gray-500">
            Observação: este conteúdo é informativo. Ajuste o manual e o vídeo conforme o padrão do seu servidor.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Vídeo</h2>
        <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-black">
          <div className="aspect-video">
            <iframe
              className="w-full h-full"
              src={YOUTUBE_EMBED_URL}
              title="TAF - Vídeo informativo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>

        {(isAdmin || temPermissao('edit_recrutamento')) && (
          <a
            href="/recrutamento-taf.pdf"
            download
            className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Baixar Manual
          </a>
        )}
      </div>
    </div>
  )
}

