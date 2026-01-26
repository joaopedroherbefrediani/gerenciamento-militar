'use client'

import { useEffect, useRef } from 'react'
import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Configurar volume do vídeo quando estiver disponível
    if (videoRef.current) {
      videoRef.current.volume = 0.3 // Volume reduzido (30%)
    }
  }, [])

  const handleWhatsAppClick = () => {
    window.open(
      'https://wa.me/5513996360302?text=Ol%C3%A1%2C%20gostaria%20de%20conversar%20sobre%20um%20futuro%20projeto%20para%20desenvolver.%20Qual%20seu%20melhor%20hor%C3%A1rio%20para%20termos%20essa%20conversa%3F',
      '_blank',
      'noopener,noreferrer'
    )
  }


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-black">
      {/* Vídeo de Fundo */}
      <video
        ref={videoRef}
        autoPlay
        loop
        playsInline
        className="blur-sm"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 0,
          transform: 'scale(1.1)',
          minWidth: '100vw',
          minHeight: '100vh'
        }}
      >
        <source src="/midia/video-musica-fundo.mp4" type="video/mp4" />
      </video>

      {/* Overlay escuro para melhorar contraste */}
      <div className="absolute inset-0 bg-black/30" style={{ zIndex: 1 }} />

      {/* Conteúdo */}
      <div 
        className="w-full max-w-md relative" 
        style={{ zIndex: 2 }}
      >
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Gerenciamento Militar
          </h1>
          <p className="text-gray-100 text-sm drop-shadow-md">
            Sistema de gerenciamento militar para GTA RP
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
            Acesso ao Sistema
          </h2>

          <LoginForm />
        </div>

        {/* Texto de crédito */}
        <p className="text-gray-100 text-sm text-center mt-6 drop-shadow-md">
          Feito por Fredi Baixada ❤️
        </p>
      </div>

      {/* Botão Flutuante WhatsApp */}
      <button
        onClick={handleWhatsAppClick}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        style={{ zIndex: 50 }}
        aria-label="Fale conosco no WhatsApp"
        title="Fale conosco no WhatsApp"
      >
        <svg
          className="w-8 h-8 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </button>
    </div>
  )
}
