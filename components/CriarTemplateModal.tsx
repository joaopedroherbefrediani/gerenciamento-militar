'use client'

import { useState, useEffect } from 'react'

interface Template {
  id: string
  nome: string
  webhookId: string
  webhookUrl?: string
  mensagemTexto?: string
  embedAutorNome?: string
  embedAutorIconUrl?: string
  embedTitulo?: string
  embedDescricao?: string
  embedCor?: string
  embedThumbnailUrl?: string
  embedImagens?: string[]
  embedFooterTexto?: string
  embedFooterIconUrl?: string
}

interface Webhook {
  id: string
  nome: string
  url: string
  status: 'Ativo' | 'Inativo'
}

interface CriarTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (dados: any) => void
  onUpdate: (dados: any) => void
  templateEditando?: Template | null
  webhooks: Webhook[]
}

export default function CriarTemplateModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  templateEditando = null,
  webhooks = [],
}: CriarTemplateModalProps) {
  const [nome, setNome] = useState('')
  const [webhookId, setWebhookId] = useState('')
  const [mensagemTexto, setMensagemTexto] = useState('')
  const [embedAutorNome, setEmbedAutorNome] = useState('')
  const [embedAutorIconUrl, setEmbedAutorIconUrl] = useState('')
  const [embedTitulo, setEmbedTitulo] = useState('')
  const [embedDescricao, setEmbedDescricao] = useState('')
  const [embedCor, setEmbedCor] = useState('#5865F2')
  const [embedThumbnailUrl, setEmbedThumbnailUrl] = useState('')
  const [embedImagemUrl, setEmbedImagemUrl] = useState('')
  const [embedFooterTexto, setEmbedFooterTexto] = useState('')
  const [embedFooterIconUrl, setEmbedFooterIconUrl] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [mostrarModalSucesso, setMostrarModalSucesso] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    
    if (templateEditando) {
      setNome(templateEditando.nome || '')
      setWebhookId(templateEditando.webhookId || '')
      setMensagemTexto(templateEditando.mensagemTexto || '')
      setEmbedAutorNome(templateEditando.embedAutorNome || '')
      setEmbedAutorIconUrl(templateEditando.embedAutorIconUrl || '')
      setEmbedTitulo(templateEditando.embedTitulo || '')
      setEmbedDescricao(templateEditando.embedDescricao || '')
      setEmbedCor(templateEditando.embedCor || '#5865F2')
      setEmbedThumbnailUrl(templateEditando.embedThumbnailUrl || '')
      // Se tiver array de imagens, pegar a primeira (Discord só permite uma)
      const primeiraImagem = templateEditando.embedImagens && templateEditando.embedImagens.length > 0 
        ? templateEditando.embedImagens[0] 
        : ''
      setEmbedImagemUrl(primeiraImagem)
      setEmbedFooterTexto(templateEditando.embedFooterTexto || '')
      setEmbedFooterIconUrl(templateEditando.embedFooterIconUrl || '')
    } else {
      setNome('')
      setWebhookId('')
      setMensagemTexto('')
      setEmbedAutorNome('')
      setEmbedAutorIconUrl('')
      setEmbedTitulo('')
      setEmbedDescricao('')
      setEmbedCor('#5865F2')
      setEmbedThumbnailUrl('')
      setEmbedImagemUrl('')
      setEmbedFooterTexto('')
      setEmbedFooterIconUrl('')
    }
  }, [templateEditando?.id, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome.trim() || !webhookId) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const webhook = webhooks.find(w => w.id === webhookId)

    const dados = {
      nome: nome.trim(),
      webhookId,
      webhookUrl: webhook?.url,
      mensagemTexto: mensagemTexto.trim() || undefined,
      embedAutorNome: embedAutorNome.trim() || undefined,
      embedAutorIconUrl: embedAutorIconUrl.trim() || undefined,
      embedTitulo: embedTitulo.trim() || undefined,
      embedDescricao: embedDescricao.trim() || undefined,
      embedCor: embedCor || undefined,
      embedThumbnailUrl: embedThumbnailUrl.trim() || undefined,
      embedImagens: embedImagemUrl.trim() ? [embedImagemUrl.trim()] : undefined,
      embedFooterTexto: embedFooterTexto.trim() || undefined,
      embedFooterIconUrl: embedFooterIconUrl.trim() || undefined,
    }

    if (templateEditando) {
      onUpdate(dados)
    } else {
      onCreate(dados)
    }

    onClose()
  }

  const handleSend = async () => {
    if (!nome.trim() || !webhookId) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const webhook = webhooks.find(w => w.id === webhookId)
    if (!webhook) {
      alert('Webhook não encontrado.')
      return
    }

    // Validar que há conteúdo para enviar
    if (!mensagemTexto.trim() && !embedTitulo.trim()) {
      alert('Por favor, preencha pelo menos a mensagem de texto ou o título do embed.')
      return
    }

    try {
      // Construir mensagem
      const message: any = {}
      
      // Adicionar conteúdo de texto se houver
      if (mensagemTexto && mensagemTexto.trim()) {
        message.content = mensagemTexto.trim()
      }

      // Construir embed apenas se houver título OU descrição (Discord requer pelo menos um)
      if ((embedTitulo && embedTitulo.trim()) || (embedDescricao && embedDescricao.trim())) {
        const embed: any = {}
        
        // Título (obrigatório se não houver descrição)
        if (embedTitulo && embedTitulo.trim()) {
          embed.title = embedTitulo.trim().substring(0, 256) // Discord limita a 256 caracteres
        }
        
        // Descrição (obrigatória se não houver título)
        if (embedDescricao && embedDescricao.trim()) {
          embed.description = embedDescricao.trim().substring(0, 4096) // Discord limita a 4096 caracteres
        }
        
        // Garantir que tem pelo menos título ou descrição
        if (!embed.title && !embed.description) {
          alert('O embed deve ter pelo menos um título ou uma descrição.')
          return
        }


        // Cor
        if (embedCor && embedCor.trim()) {
          const hexColor = embedCor.replace('#', '')
          if (hexColor.length === 6) {
            const colorNum = parseInt(hexColor, 16)
            if (!isNaN(colorNum) && colorNum >= 0 && colorNum <= 0xFFFFFF) {
              embed.color = colorNum
            }
          }
        }

        // Autor (só adicionar se tiver nome)
        if (embedAutorNome && embedAutorNome.trim()) {
          const author: any = {
            name: embedAutorNome.trim().substring(0, 256),
          }
          if (embedAutorIconUrl && embedAutorIconUrl.trim()) {
            author.icon_url = embedAutorIconUrl.trim()
          }
          embed.author = author
        }


        // Thumbnail
        if (embedThumbnailUrl && embedThumbnailUrl.trim()) {
          embed.thumbnail = {
            url: embedThumbnailUrl.trim(),
          }
        }

        // Imagem (Discord só permite uma imagem por embed)
        if (embedImagemUrl && embedImagemUrl.trim()) {
          embed.image = {
            url: embedImagemUrl.trim(),
          }
        }

        // Footer (só adicionar se tiver texto)
        if (embedFooterTexto && embedFooterTexto.trim()) {
          const footer: any = {
            text: embedFooterTexto.trim().substring(0, 2048),
          }
          if (embedFooterIconUrl && embedFooterIconUrl.trim()) {
            footer.icon_url = embedFooterIconUrl.trim()
          }
          embed.footer = footer
        }

        // Timestamp
        embed.timestamp = new Date().toISOString()

        // Adicionar embed à mensagem
        message.embeds = [embed]
      }

      // Validar que há algo para enviar
      if (!message.content && (!message.embeds || message.embeds.length === 0)) {
        alert('Por favor, preencha pelo menos a mensagem de texto ou o título/descrição do embed.')
        return
      }
      
      // Validar que cada embed tem título ou descrição
      if (message.embeds && Array.isArray(message.embeds)) {
        for (const embed of message.embeds) {
          if (!embed.title && !embed.description) {
            alert('Cada embed deve ter pelo menos um título ou uma descrição.')
            return
          }
        }
      }

      // Limpar objetos vazios do embed antes de enviar
      if (message.embeds && Array.isArray(message.embeds)) {
        message.embeds = message.embeds.map((embed: any) => {
          const cleaned: any = {}
          
          if (embed.title) cleaned.title = embed.title
          if (embed.description) cleaned.description = embed.description
          if (embed.color !== undefined && embed.color !== null) cleaned.color = embed.color
          if (embed.timestamp) cleaned.timestamp = embed.timestamp
          
          if (embed.author && embed.author.name) {
            cleaned.author = { name: embed.author.name }
            if (embed.author.icon_url) cleaned.author.icon_url = embed.author.icon_url
          }
          
          if (embed.thumbnail && embed.thumbnail.url) {
            cleaned.thumbnail = { url: embed.thumbnail.url }
          }
          
          if (embed.image && embed.image.url) {
            cleaned.image = { url: embed.image.url }
          }
          
          if (embed.footer && embed.footer.text) {
            cleaned.footer = { text: embed.footer.text }
            if (embed.footer.icon_url) cleaned.footer.icon_url = embed.footer.icon_url
          }
          
          return cleaned
        })
      }

      // Log para debug

      const response = await fetch('/api/webhooks/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl: webhook.url,
          message: message,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setMostrarModalSucesso(true)
      } else {
        alert(`Erro ao enviar: ${data.error}`)
      }
    } catch (error) {
      alert(`Erro ao enviar mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  if (!isOpen || !isClient) return null

  return (
    <div className="modal-overlay-fix overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center w-full">
        <div className="max-w-7xl w-full bg-white rounded-lg shadow-xl relative">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {templateEditando ? 'Editar Template' : 'Novo Template'}
              </h2>
              <p className="text-gray-600 mt-1">Editor de mensagens Discord</p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar
            </button>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Formulário - Lado Esquerdo */}
            <div className="flex-1 p-4 sm:p-6 lg:border-r border-gray-200 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Seção: Formulário */}
                <div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Template
                      </label>
                      <input
                        type="text"
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="Ex: Anúncio de Promoção"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="webhookId" className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook
                      </label>
                      <div className="relative">
                        <select
                          id="webhookId"
                          value={webhookId}
                          onChange={(e) => setWebhookId(e.target.value)}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
                          required
                        >
                          <option value="">Selecione um webhook</option>
                          {webhooks.map((webhook) => (
                            <option key={webhook.id} value={webhook.id}>
                              {webhook.nome}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="mensagemTexto" className="block text-sm font-medium text-gray-700 mb-1">
                        Mensagem de Texto
                      </label>
                      <textarea
                        id="mensagemTexto"
                        value={mensagemTexto}
                        onChange={(e) => setMensagemTexto(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                        placeholder="@everyone Novo anúncio!"
                      />
                      <p className="text-xs text-gray-500 mt-1">Suporte @everyone, @here e menções</p>
                    </div>
                  </div>
                </div>

                {/* Seção: Embed */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Embed</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="embedAutorNome" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Autor
                      </label>
                      <input
                        type="text"
                        id="embedAutorNome"
                        value={embedAutorNome}
                        onChange={(e) => setEmbedAutorNome(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="Nome do autor"
                      />
                    </div>

                    <div>
                      <label htmlFor="embedAutorIconUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        URL do Ícone do Autor
                      </label>
                      <input
                        type="url"
                        id="embedAutorIconUrl"
                        value={embedAutorIconUrl}
                        onChange={(e) => setEmbedAutorIconUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label htmlFor="embedTitulo" className="block text-sm font-medium text-gray-700 mb-1">
                        Título
                      </label>
                      <input
                        type="text"
                        id="embedTitulo"
                        value={embedTitulo}
                        onChange={(e) => setEmbedTitulo(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="Título do embed"
                      />
                    </div>

                    <div>
                      <label htmlFor="embedDescricao" className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <textarea
                        id="embedDescricao"
                        value={embedDescricao}
                        onChange={(e) => setEmbedDescricao(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                        placeholder="Descrição detalhada..."
                      />
                    </div>

                    <div>
                      <label htmlFor="embedCor" className="block text-sm font-medium text-gray-700 mb-1">
                        Cor
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          id="embedCor"
                          value={embedCor}
                          onChange={(e) => setEmbedCor(e.target.value)}
                          className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={embedCor}
                          onChange={(e) => setEmbedCor(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                          placeholder="#5865F2"
                        />
                      </div>
                    </div>


                    <div>
                      <label htmlFor="embedThumbnailUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        URL da Miniatura
                      </label>
                      <input
                        type="url"
                        id="embedThumbnailUrl"
                        value={embedThumbnailUrl}
                        onChange={(e) => setEmbedThumbnailUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label htmlFor="embedImagemUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        URL da Imagem Grande
                      </label>
                      <input
                        type="url"
                        id="embedImagemUrl"
                        value={embedImagemUrl}
                        onChange={(e) => setEmbedImagemUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="https://..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Discord permite apenas uma imagem grande por embed</p>
                    </div>

                    <div>
                      <label htmlFor="embedFooterTexto" className="block text-sm font-medium text-gray-700 mb-1">
                        Texto do Rodapé
                      </label>
                      <input
                        type="text"
                        id="embedFooterTexto"
                        value={embedFooterTexto}
                        onChange={(e) => setEmbedFooterTexto(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="Rodapé"
                      />
                    </div>

                    <div>
                      <label htmlFor="embedFooterIconUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        URL do Ícone do Rodapé
                      </label>
                      <input
                        type="url"
                        id="embedFooterIconUrl"
                        value={embedFooterIconUrl}
                        onChange={(e) => setEmbedFooterIconUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Enviar
                  </button>
                </div>
              </form>
            </div>

            {/* Preview - Lado Direito / Embaixo no Mobile */}
            <div className="w-full lg:w-96 p-4 sm:p-6 bg-gray-50 lg:border-l border-t lg:border-t-0 border-gray-200 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              
              <div className="bg-[#36393f] rounded-lg p-4 text-white">
                {/* Header do Bot */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold">
                    W
                  </div>
                  <div>
                    <div className="font-semibold">Webhook BOT</div>
                    <div className="text-xs text-gray-400">
                      {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Mensagem de Texto */}
                {mensagemTexto && (
                  <div className="mb-3 whitespace-pre-wrap break-words">{mensagemTexto}</div>
                )}

                {/* Embed */}
                {embedTitulo && (
                  <div
                    className="rounded border-l-4 p-3 mb-3"
                    style={{
                      borderLeftColor: embedCor,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {/* Autor */}
                    {embedAutorNome && (
                      <div className="flex items-center gap-2 mb-2">
                        {embedAutorIconUrl && (
                          <img src={embedAutorIconUrl} alt="" className="w-5 h-5 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        )}
                        <span className="font-semibold text-sm">{embedAutorNome}</span>
                      </div>
                    )}

                    {/* Título */}
                    {embedTitulo && (
                      <div className="font-semibold text-lg mb-2">{embedTitulo}</div>
                    )}

                    {/* Descrição */}
                    {embedDescricao && (
                      <div className="text-sm text-gray-300 mb-2 whitespace-pre-wrap">{embedDescricao}</div>
                    )}


                    {/* Thumbnail */}
                    {embedThumbnailUrl && (
                      <div className="mb-2">
                        <img src={embedThumbnailUrl} alt="" className="max-w-[80px] max-h-[80px] rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      </div>
                    )}

                    {/* Imagem */}
                    {embedImagemUrl && (
                      <div className="mb-2">
                        <img src={embedImagemUrl} alt="" className="max-w-full rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      </div>
                    )}

                    {/* Footer */}
                    {embedFooterTexto && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-600">
                        {embedFooterIconUrl && (
                          <img src={embedFooterIconUrl} alt="" className="w-4 h-4 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        )}
                        <span className="text-xs text-gray-400">{embedFooterTexto}</span>
                      </div>
                    )}
                  </div>
                )}

                {!mensagemTexto && !embedTitulo && (
                  <div className="text-gray-500 text-sm">Nenhum conteúdo para exibir</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Sucesso */}
      {mostrarModalSucesso && (
        <div className="modal-overlay-fix !z-[10000]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
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
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Mensagem Enviada!
            </h3>
            <p className="text-gray-600 text-center mb-6">
              A mensagem do template foi enviada com sucesso para o Discord.
            </p>
            <button
              onClick={() => setMostrarModalSucesso(false)}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
