export interface DiscordWebhookMessage {
  content?: string
  username?: string
  avatar_url?: string
  embeds?: DiscordEmbed[]
}

export interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  author?: {
    name: string
    icon_url?: string
    url?: string
  }
  fields?: DiscordEmbedField[]
  footer?: {
    text: string
    icon_url?: string
  }
  timestamp?: string
  thumbnail?: {
    url: string
  }
  image?: {
    url: string
  }
}

export interface DiscordEmbedField {
  name: string
  value: string
  inline?: boolean
}

export interface WebhookResult {
  success: boolean
  message?: string
  error?: string
}

/**
 * Envia uma mensagem para um webhook do Discord
 * @param webhookUrl URL do webhook do Discord
 * @param message Mensagem a ser enviada
 * @returns Resultado da operação
 */
export async function sendDiscordWebhook(
  webhookUrl: string,
  message: DiscordWebhookMessage
): Promise<WebhookResult> {
  try {
    // Validar URL
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return {
        success: false,
        error: 'URL do webhook inválida. Deve começar com https://discord.com/api/webhooks/',
      }
    }

    // Validar que há conteúdo para enviar
    if (!message.content && (!message.embeds || message.embeds.length === 0)) {
      return {
        success: false,
        error: 'A mensagem deve ter conteúdo ou pelo menos um embed',
      }
    }

    // Limpar mensagem antes de enviar - remover campos undefined
    const cleanMessage = JSON.parse(JSON.stringify(message))
    
    // Validar e limpar embeds
    if (cleanMessage.embeds && Array.isArray(cleanMessage.embeds)) {
      cleanMessage.embeds = cleanMessage.embeds
        .filter((embed: any) => {
          // Embed deve ter título OU descrição
          const hasTitle = embed && embed.title && typeof embed.title === 'string' && embed.title.trim().length > 0
          const hasDescription = embed && embed.description && typeof embed.description === 'string' && embed.description.trim().length > 0
          return hasTitle || hasDescription
        })
        .map((embed: any) => {
          // Limpar objetos vazios dentro do embed
          const cleanedEmbed: any = {}
          
          if (embed.title && typeof embed.title === 'string' && embed.title.trim()) {
            cleanedEmbed.title = embed.title.trim()
          }
          
          if (embed.description && typeof embed.description === 'string' && embed.description.trim()) {
            cleanedEmbed.description = embed.description.trim()
          }
          
          if (embed.color !== undefined && embed.color !== null && typeof embed.color === 'number') {
            cleanedEmbed.color = embed.color
          }
          
          if (embed.author && typeof embed.author === 'object' && embed.author.name && typeof embed.author.name === 'string' && embed.author.name.trim()) {
            cleanedEmbed.author = {
              name: embed.author.name.trim(),
            }
            if (embed.author.icon_url && typeof embed.author.icon_url === 'string' && embed.author.icon_url.trim()) {
              cleanedEmbed.author.icon_url = embed.author.icon_url.trim()
            }
          }
          
          if (embed.thumbnail && typeof embed.thumbnail === 'object' && embed.thumbnail.url && typeof embed.thumbnail.url === 'string' && embed.thumbnail.url.trim()) {
            cleanedEmbed.thumbnail = {
              url: embed.thumbnail.url.trim(),
            }
          }
          
          if (embed.image && typeof embed.image === 'object' && embed.image.url && typeof embed.image.url === 'string' && embed.image.url.trim()) {
            cleanedEmbed.image = {
              url: embed.image.url.trim(),
            }
          }
          
          if (embed.footer && typeof embed.footer === 'object' && embed.footer.text && typeof embed.footer.text === 'string' && embed.footer.text.trim()) {
            cleanedEmbed.footer = {
              text: embed.footer.text.trim(),
            }
            if (embed.footer.icon_url && typeof embed.footer.icon_url === 'string' && embed.footer.icon_url.trim()) {
              cleanedEmbed.footer.icon_url = embed.footer.icon_url.trim()
            }
          }
          
          if (embed.timestamp && typeof embed.timestamp === 'string' && embed.timestamp.trim()) {
            cleanedEmbed.timestamp = embed.timestamp.trim()
          }
          
          return cleanedEmbed
        })
      
      // Se não há embeds válidos, remover
      if (cleanMessage.embeds.length === 0) {
        delete cleanMessage.embeds
      }
    }
    
    // Validar que há conteúdo
    if (!cleanMessage.content && (!cleanMessage.embeds || cleanMessage.embeds.length === 0)) {
      return {
        success: false,
        error: 'A mensagem deve ter conteúdo ou pelo menos um embed válido',
      }
    }

    // Enviar requisição para o Discord
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanMessage),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Erro ao enviar webhook: ${response.status} ${response.statusText}. ${errorText}`,
      }
    }

    return {
      success: true,
      message: 'Mensagem enviada com sucesso para o Discord',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar webhook',
    }
  }
}

/**
 * Envia uma mensagem simples para um webhook do Discord
 * @param webhookUrl URL do webhook do Discord
 * @param content Conteúdo da mensagem
 * @param username Nome do usuário (opcional)
 * @returns Resultado da operação
 */
export async function sendSimpleDiscordWebhook(
  webhookUrl: string,
  content: string,
  username?: string
): Promise<WebhookResult> {
  return sendDiscordWebhook(webhookUrl, {
    content,
    username,
  })
}

/**
 * Envia um embed formatado para um webhook do Discord
 * @param webhookUrl URL do webhook do Discord
 * @param embed Embed a ser enviado
 * @param username Nome do usuário (opcional)
 * @returns Resultado da operação
 */
export async function sendDiscordEmbed(
  webhookUrl: string,
  embed: DiscordEmbed,
  username?: string
): Promise<WebhookResult> {
  return sendDiscordWebhook(webhookUrl, {
    embeds: [embed],
    username,
  })
}

/**
 * Testa se um webhook está funcionando
 * @param webhookUrl URL do webhook do Discord
 * @returns Resultado do teste
 */
export async function testDiscordWebhook(webhookUrl: string): Promise<WebhookResult> {
  return sendSimpleDiscordWebhook(
    webhookUrl,
    '🧪 Teste de webhook - Sistema de Gerenciamento Militar',
    'Sistema de Gestão'
  )
}
