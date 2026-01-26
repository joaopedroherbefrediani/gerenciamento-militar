'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPage() {
  const router = useRouter()
  const [resetado, setResetado] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Limpar todos os dados do localStorage
      localStorage.clear()
      setResetado(true)
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.replace('/login')
      }, 2000)
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {resetado ? 'Dados Limpos!' : 'Limpando dados...'}
        </h2>
        <p className="text-gray-600 mb-4">
          {resetado 
            ? 'Redirecionando para a página de login...' 
            : 'Aguarde enquanto limpamos os dados...'}
        </p>
        {!resetado && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}
      </div>
    </div>
  )
}
