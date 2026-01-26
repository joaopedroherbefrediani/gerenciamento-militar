'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type BaseModalProps = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  /** Fecha ao clicar no overlay (fora do conteúdo). Default: true */
  closeOnOverlayClick?: boolean
  /** Fecha ao apertar ESC. Default: true */
  closeOnEsc?: boolean
  /** Classe extra no container do conteúdo */
  contentClassName?: string
  /** Classe extra no overlay */
  overlayClassName?: string
  /** Z-index do modal. Default: 10000 */
  zIndex?: number
}

export default function BaseModal({
  isOpen,
  onClose,
  children,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  contentClassName = '',
  overlayClassName = '',
  zIndex = 10000,
}: BaseModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !isOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (!closeOnEsc) return
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [mounted, isOpen, onClose, closeOnEsc])

  if (!mounted || !isOpen) return null

  const overlay = (
    <div
      className={`fixed inset-0 w-screen h-[100dvh] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 ${overlayClassName}`}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        role="presentation"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      <div className={`relative z-10 w-full ${contentClassName}`}>{children}</div>
    </div>
  )

  return createPortal(overlay, document.body)
}

