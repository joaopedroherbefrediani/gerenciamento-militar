/**
 * Utilitários para usar webhooks do Discord em outras partes do sistema
 * 
 * Exemplo de uso:
 * 
 * import { sendWebhookToActive } from '@/lib/webhook-utils'
 * 
 * // Enviar mensagem simples para todos os webhooks ativos
 * await sendWebhookToActive({
 *   content: 'Novo militar cadastrado: João Silva'
 * })
 * 
 * // Enviar embed formatado
 * await sendWebhookToActive({
 *   embeds: [{
 *     title: 'Novo Evento',
 *     description: 'Um novo evento foi criado',
 *     color: 0x10b981, // Verde
 *     fields: [
 *       { name: 'Tipo', value: 'Promoção', inline: true },
 *       { name: 'Militar', value: 'João Silva', inline: true }
 *     ]
 *   }]
 * })
 */

import { DiscordWebhookMessage, sendDiscordWebhook } from './discord-webhook'

/**
 * Obtém todos os webhooks ativos do localStorage
 */
export function getActiveWebhooks(): Array<{ id: string; url: string; nome: string }> {
  if (typeof window === 'undefined') return []

  try {
    const webhooksSalvos = localStorage.getItem('webhooks')
    if (!webhooksSalvos) return []

    const webhooks = JSON.parse(webhooksSalvos)
    return webhooks
      .filter((w: any) => w.status === 'Ativo')
      .map((w: any) => ({
        id: w.id,
        url: w.url,
        nome: w.nome,
      }))
  } catch (error) {
    console.error('Erro ao obter webhooks ativos:', error)
    return []
  }
}

/**
 * Envia uma mensagem para todos os webhooks ativos
 * @param message Mensagem a ser enviada
 * @returns Array com os resultados de cada webhook
 */
export async function sendWebhookToActive(
  message: DiscordWebhookMessage
): Promise<Array<{ webhookId: string; webhookNome: string; success: boolean; error?: string }>> {
  const activeWebhooks = getActiveWebhooks()
  const results = []

  for (const webhook of activeWebhooks) {
    try {
      const result = await sendDiscordWebhook(webhook.url, message)
      results.push({
        webhookId: webhook.id,
        webhookNome: webhook.nome,
        success: result.success,
        error: result.error,
      })
    } catch (error) {
      results.push({
        webhookId: webhook.id,
        webhookNome: webhook.nome,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    }
  }

  return results
}

/**
 * Envia uma mensagem para um webhook específico por ID
 * @param webhookId ID do webhook
 * @param message Mensagem a ser enviada
 * @returns Resultado da operação
 */
export async function sendWebhookById(
  webhookId: string,
  message: DiscordWebhookMessage
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Função disponível apenas no navegador' }
  }

  try {
    const webhooksSalvos = localStorage.getItem('webhooks')
    if (!webhooksSalvos) {
      return { success: false, error: 'Nenhum webhook encontrado' }
    }

    const webhooks = JSON.parse(webhooksSalvos)
    const webhook = webhooks.find((w: any) => w.id === webhookId)

    if (!webhook) {
      return { success: false, error: 'Webhook não encontrado' }
    }

    if (webhook.status !== 'Ativo') {
      return { success: false, error: 'Webhook está inativo' }
    }

    const result = await sendDiscordWebhook(webhook.url, message)
    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Envia mensagem via API route (para uso no servidor ou quando necessário)
 * @param webhookUrl URL do webhook
 * @param message Mensagem a ser enviada
 * @returns Resultado da operação
 */
export async function sendWebhookViaAPI(
  webhookUrl: string,
  message: DiscordWebhookMessage
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/webhooks/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhookUrl,
        message,
      }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}
