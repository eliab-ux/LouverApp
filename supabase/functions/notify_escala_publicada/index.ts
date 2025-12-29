import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EscaladoInfo {
  nome: string
  email: string
  funcao?: string
}

interface NotifyPayload {
  evento: {
    id: string
    tipo: string
    data: string
    hora?: string
  }
  escalados: EscaladoInfo[]
  igreja_nome?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json().catch(() => null)) as NotifyPayload | null

    if (!body?.evento || !body?.escalados) {
      return new Response(JSON.stringify({ error: 'Dados inválidos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { evento, escalados, igreja_nome } = body

    // Formata a data do evento
    const dataEvento = new Date(evento.data + 'T00:00:00')
    const dataFormatada = dataEvento.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    const tipoEvento = evento.tipo === 'culto' ? 'Culto' : 'Ensaio'

    // Verifica se RESEND_API_KEY está configurada
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY não configurada. Emails não serão enviados.')
      console.log('Escalados que receberiam notificação:', escalados.map(e => e.email))
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Escala publicada. Notificações por email desabilitadas (RESEND_API_KEY não configurada).',
          escalados_count: escalados.length
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Envia email para cada escalado usando Resend
    const emailPromises = escalados
      .filter(e => e.email)
      .map(async (escalado) => {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">📋 Você foi escalado!</h2>
            
            <p>Olá <strong>${escalado.nome}</strong>,</p>
            
            <p>Você foi escalado para o seguinte evento${igreja_nome ? ` na ${igreja_nome}` : ''}:</p>
            
            <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>📅 ${tipoEvento}</strong></p>
              <p style="margin: 0 0 8px 0; color: #64748b;">${dataFormatada}</p>
              ${evento.hora ? `<p style="margin: 0; color: #64748b;">🕐 ${evento.hora}</p>` : ''}
              ${escalado.funcao ? `<p style="margin: 8px 0 0 0; color: #10b981;">🎵 Função: ${escalado.funcao}</p>` : ''}
            </div>
            
            <p style="color: #64748b; font-size: 14px;">
              Por favor, confirme sua disponibilidade com o líder do louvor.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            
            <p style="color: #94a3b8; font-size: 12px;">
              Este é um email automático do sistema de escalas do Louvor App.
            </p>
          </div>
        `

        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Louvor App <noreply@resend.dev>',
              to: [escalado.email],
              subject: `📋 Você foi escalado - ${tipoEvento} ${dataFormatada}`,
              html: htmlContent,
            }),
          })

          if (!res.ok) {
            const errorText = await res.text()
            console.error(`Erro ao enviar email para ${escalado.email}:`, errorText)
            return { email: escalado.email, success: false, error: errorText }
          }

          return { email: escalado.email, success: true }
        } catch (err) {
          console.error(`Erro ao enviar email para ${escalado.email}:`, err)
          return { email: escalado.email, success: false, error: String(err) }
        }
      })

    const results = await Promise.all(emailPromises)
    const enviados = results.filter(r => r.success).length
    const falhas = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notificações enviadas: ${enviados} de ${escalados.length}`,
        enviados,
        falhas,
        details: results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (e) {
    console.error('notify_escala_publicada error:', e)
    return new Response(JSON.stringify({ error: 'Erro interno.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
