import { NextRequest, NextResponse } from 'next/server'
import { sendDiscordWebhook, DiscordWebhookMessage } from '@/lib/discord-webhook'
import { z } from 'zod'

const sendWebhookSchema = z.object({
  webhookUrl: z.string().url(),
  message: z.any(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhookUrl, message } = sendWebhookSchema.parse(body)

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Mensagem é obrigatória' },
        { status: 400 }
      )
    }

    // Validar estrutura da mensagem
    if (!message.content && (!message.embeds || !Array.isArray(message.embeds) || message.embeds.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'A mensagem deve ter conteúdo ou pelo menos um embed válido' },
        { status: 400 }
      )
    }

    // Validar embeds se existirem
    if (message.embeds && Array.isArray(message.embeds)) {
      for (let i = 0; i < message.embeds.length; i++) {
        const embed = message.embeds[i]
        if (!embed || typeof embed !== 'object') {
          return NextResponse.json(
            { success: false, error: `Embed no índice ${i} é inválido` },
            { status: 400 }
          )
        }
        if (!embed.title || typeof embed.title !== 'string' || embed.title.trim().length === 0) {
          return NextResponse.json(
            { success: false, error: `Embed no índice ${i} deve ter um título válido` },
            { status: 400 }
          )
        }
      }
    }

    const result = await sendDiscordWebhook(webhookUrl, message as DiscordWebhookMessage)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
    }
    console.error('Erro ao enviar webhook:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
