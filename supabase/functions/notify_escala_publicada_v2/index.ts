import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EscaladoInfo {
  id: string              // UUID do usuário
  nome: string
  email: string
  telefone?: string       // Telefone do usuário
  funcao?: string
  canal_notificacao: 'email' | 'whatsapp' | 'ambos'  // Preferência
}

interface NotifyPayload {
  evento: {
    id: string
    tipo: string
    data: string
    hora?: string
  }
  escalados: EscaladoInfo[]
  igreja_id: string       // ID da igreja
  igreja_nome?: string
}

async function enviarEmail(
  escalado: EscaladoInfo,
  tipoEvento: string,
  dataFormatada: string,
  evento: NotifyPayload['evento'],
  igreja_nome?: string,
  musicasTexto?: string
): Promise<{ email: string; success: boolean; error?: string }> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

  if (!RESEND_API_KEY) {
    console.log(`Email desabilitado (RESEND_API_KEY não configurada) para ${escalado.email}`)
    return { email: escalado.email, success: false, error: 'RESEND_API_KEY não configurada' }
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981;">📋 Você foi escalado!</h2>

      <p>Olá <strong>${escalado.nome}</strong>,</p>

      <p>Você foi escalado para o seguinte evento${igreja_nome ? ` na ${igreja_nome}` : ''}:</p>

      <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>📅 ${tipoEvento}</strong></p>
        <p style="margin: 0 0 8px 0; color: #64748b;">${dataFormatada}</p>
        ${evento.hora ? `<p style="margin: 0; color: #64748b;">🕐 ${evento.hora}</p>` : ''}
        ${escalado.funcao ? `<p style="margin: 8px 0 0 0; color: #10b981;">🎶 Função: ${escalado.funcao}</p>` : ''}
      </div>

      ${musicasTexto ? `
      <div style="background: #f1f5f9; border-left: 4px solid #0ea5e9; padding: 12px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-weight: 600;">🎵 Musicas</p>
        <pre style="margin: 0; white-space: pre-wrap; font-family: Arial, sans-serif; color: #334155;">${musicasTexto}</pre>
      </div>
      ` : ''}

      <p style="color: #64748b; font-size: 14px;">
        Para detalhes da escalação, consulte o aplicativo Louvor APP.
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
}

async function enviarWhatsApp(
  escalado: EscaladoInfo,
  tipoEvento: string,
  dataFormatada: string,
  evento: NotifyPayload['evento'],
  igreja_id: string,
  musicasTexto?: string
): Promise<{ phone: string; success: boolean; error?: string }> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL ou SERVICE_ROLE_KEY não configurado')
    return { phone: escalado.telefone || '', success: false, error: 'Configuração do Supabase incompleta' }
  }

  // Formatar mensagem de texto (sem HTML)
  const mensagem = `
📋 *Você foi escalado!*

Olá ${escalado.nome},

Você foi escalado para:

📅 ${tipoEvento}
📆 ${dataFormatada}
${evento.hora ? `🕐 ${evento.hora}` : ''}
${escalado.funcao ? `🎶 Função: ${escalado.funcao}` : ''}${musicasTexto ? `\n🎵 Musicas:\n${musicasTexto}` : ''}

Para detalhes da escalação, consulte o aplicativo Louvor APP.

_Mensagem automática do Louvor App_
  `.trim()

  try {
    // Chamar Edge Function send_whatsapp
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send_whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        phone: escalado.telefone,
        message: mensagem,
        igreja_id: igreja_id,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro ao enviar WhatsApp para ${escalado.telefone}:`, errorText)
      return { phone: escalado.telefone || '', success: false, error: errorText }
    }

    return { phone: escalado.telefone || '', success: true }
  } catch (err) {
    console.error(`Erro ao enviar WhatsApp para ${escalado.telefone}:`, err)
    return { phone: escalado.telefone || '', success: false, error: String(err) }
  }
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

    if (!body?.evento || !body?.escalados || !body?.igreja_id) {
      return new Response(JSON.stringify({ error: 'Dados inválidos. evento, escalados e igreja_id são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { evento, escalados, igreja_id, igreja_nome } = body

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')
    let musicasTexto: string | null = null

    if (SUPABASE_URL && SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
        const { data: escala } = await supabaseAdmin
          .from('escalas')
          .select('id')
          .eq('evento_id', evento.id)
          .maybeSingle()

        if (escala?.id) {
          const { data: escalaMusicas, error: escalaMusicasError } = await supabaseAdmin
            .from('escala_musicas')
            .select('musica_ids, tom_escolhido, ordem')
            .eq('escala_id', escala.id)
            .order('ordem', { ascending: true })

          if (escalaMusicasError) {
            console.error('Erro ao buscar escala_musicas:', escalaMusicasError)
          } else if (escalaMusicas && escalaMusicas.length > 0) {
            const musicaIds = Array.from(
              new Set(
                escalaMusicas.flatMap((m) =>
                  Array.isArray(m.musica_ids) ? m.musica_ids.map((id) => String(id)) : [],
                ),
              ),
            )
            const { data: musicas, error: musicasError } = await supabaseAdmin
              .from('musicas')
              .select('id, nome')
              .in('id', musicaIds)

            if (musicasError) {
              console.error('Erro ao buscar musicas:', musicasError)
            } else {
              const musicasMap = new Map<string, string>()
              for (const musica of musicas ?? []) {
                if (musica?.id && musica?.nome) {
                  musicasMap.set(String(musica.id), String(musica.nome))
                }
              }

              const linhas = escalaMusicas
                .map((m) => {
                  const ids = Array.isArray(m.musica_ids) ? m.musica_ids : []
                  const nomes = ids
                    .map((id) => musicasMap.get(String(id)) ?? '')
                    .filter((nome) => nome)
                  if (nomes.length === 0) return null
                  const nomeTexto = nomes.join(' / ')
                  const tom = m.tom_escolhido ? ` (${m.tom_escolhido})` : ''
                  return `- ${nomeTexto}${tom}`
                })
                .filter((linha): linha is string => Boolean(linha))

              if (linhas.length > 0) {
                musicasTexto = linhas.join('\n')
              }
            }
          }
        }
      } catch (e) {
        console.error('Erro ao buscar musicas da escala:', e)
      }
    }

    // Formata a data do evento
    const dataEvento = new Date(evento.data + 'T00:00:00')
    const dataFormatada = dataEvento.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    const tipoEvento = evento.tipo === 'culto' ? 'Culto' : 'Ensaio'

    // Arrays para rastrear resultados
    const emailResults: Array<{ email: string; success: boolean; error?: string }> = []
    const whatsappResults: Array<{ phone: string; success: boolean; error?: string }> = []

    // Para cada escalado, enviar notificações conforme preferência
    for (const escalado of escalados) {
      const promises = []

      // Se preferência incluir email
      if (escalado.canal_notificacao === 'email' || escalado.canal_notificacao === 'ambos') {
        if (escalado.email) {
          promises.push(
            enviarEmail(escalado, tipoEvento, dataFormatada, evento, igreja_nome, musicasTexto ?? undefined)
              .then(result => emailResults.push(result))
          )
        } else {
          console.warn(`Escalado ${escalado.nome} tem preferência de email mas não tem email cadastrado`)
        }
      }

      // Se preferência incluir WhatsApp E tem telefone
      if ((escalado.canal_notificacao === 'whatsapp' || escalado.canal_notificacao === 'ambos') && escalado.telefone) {
        promises.push(
          enviarWhatsApp(escalado, tipoEvento, dataFormatada, evento, igreja_id, musicasTexto ?? undefined)
            .then(result => whatsappResults.push(result))
        )
      } else if (escalado.canal_notificacao === 'whatsapp' || escalado.canal_notificacao === 'ambos') {
        console.warn(`Escalado ${escalado.nome} tem preferência de WhatsApp mas não tem telefone cadastrado`)
      }

      // Executar envios em paralelo
      await Promise.all(promises)
    }

    // Calcular estatísticas
    const emailEnviados = emailResults.filter(r => r.success).length
    const emailFalhas = emailResults.filter(r => !r.success).length
    const whatsappEnviados = whatsappResults.filter(r => r.success).length
    const whatsappFalhas = whatsappResults.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notificações enviadas: ${emailEnviados + whatsappEnviados} de ${escalados.length} escalados`,
        stats: {
          email: {
            enviados: emailEnviados,
            falhas: emailFalhas,
            total: emailResults.length
          },
          whatsapp: {
            enviados: whatsappEnviados,
            falhas: whatsappFalhas,
            total: whatsappResults.length
          }
        },
        details: {
          email: emailResults,
          whatsapp: whatsappResults
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (e) {
    console.error('notify_escala_publicada_v2 error:', e)
    return new Response(JSON.stringify({ error: 'Erro interno.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
