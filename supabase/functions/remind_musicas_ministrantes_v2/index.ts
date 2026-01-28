import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type IgrejaConfig = {
  igreja_id: string
  dias_antes: number
  alertas_por_dia: number
}

type EscalaAlvo = {
  escala_id: string
  igreja_id: string
  evento_id: string
  data: string
  hora: string
  tipo: string
}

type MinistranteInfo = {
  id: string
  nome: string
  email: string
  telefone?: string
  canal_notificacao: 'email' | 'whatsapp' | 'ambos'
}

async function enviarEmailLembrete(
  ministrante: MinistranteInfo,
  tipoFmt: string,
  dataFmt: string,
  hora: string
): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

  if (!RESEND_API_KEY) {
    console.log(`Email desabilitado (RESEND_API_KEY não configurada) para ${ministrante.email}`)
    return false
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #f59e0b;">🎶 Lembrete: escolha as músicas</h2>
      <p>Olá <strong>${ministrante.nome}</strong>,</p>
      <p>Você está escalado como ministrante e ainda não escolheu as músicas.</p>
      <div style="background: #0b1220; color: #e2e8f0; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>📅 ${tipoFmt}</strong></p>
        <p style="margin: 0 0 8px 0;">📆 ${dataFmt}</p>
        <p style="margin: 0;">🕐 ${hora}</p>
      </div>
      <p>Por favor, acesse o sistema e escolha as músicas o quanto antes.</p>
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
        to: [ministrante.email],
        subject: `🎶 Lembrete: escolha as músicas - ${tipoFmt} ${dataFmt}`,
        html,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`Erro ao enviar email para ${ministrante.email}:`, errorText)
      return false
    }

    return true
  } catch (err) {
    console.error(`Erro ao enviar email para ${ministrante.email}:`, err)
    return false
  }
}

async function enviarWhatsAppLembrete(
  ministrante: MinistranteInfo,
  tipoFmt: string,
  dataFmt: string,
  hora: string,
  igreja_id: string
): Promise<boolean> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL ou SERVICE_ROLE_KEY nao configurado')
    return false
  }

  // Formatar mensagem de texto (sem HTML)
  const mensagem = `
🎵 *Lembrete: Escolha as músicas*

Olá ${ministrante.nome},

Você está escalado como ministrante e ainda não escolheu as músicas.

📅 ${tipoFmt}
📆 ${dataFmt}
🕐 ${hora}

Por favor, acesse o sistema e escolha as músicas o quanto antes.

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
        phone: ministrante.telefone,
        message: mensagem,
        igreja_id: igreja_id,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro ao enviar WhatsApp para ${ministrante.telefone}:`, errorText)
      return false
    }

    return true
  } catch (err) {
    console.error(`Erro ao enviar WhatsApp para ${ministrante.telefone}:`, err)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const CRON_SECRET = Deno.env.get('CRON_SECRET')
    if (CRON_SECRET) {
      const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null
      if (token !== CRON_SECRET) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'SUPABASE_URL ou SERVICE_ROLE_KEY nao configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0]

    const minutesNow = hoje.getHours() * 60 + hoje.getMinutes()

    const { data: configsData, error: configsErr } = await supabase
      .from('configuracao_notificacao')
      .select('igreja_id, dias_antes, alertas_por_dia')

    if (configsErr) {
      return new Response(JSON.stringify({ error: configsErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const configs = (configsData ?? []) as IgrejaConfig[]

    const processed: Array<{
      igreja_id: string
      escalas: number
      emails_enviados: number
      whatsapp_enviados: number
      skipped: number
    }> = []

    for (const cfg of configs) {
      const diasAntes = Math.max(0, Number(cfg.dias_antes) || 0)
      const alertasPorDia = Math.max(0, Number(cfg.alertas_por_dia) || 0)

      const slot = alertasPorDia > 0 ? Math.min(alertasPorDia, Math.floor((minutesNow / 1440) * alertasPorDia) + 1) : 1

      const limite = new Date(hoje)
      limite.setDate(limite.getDate() + diasAntes)
      const limiteStr = limite.toISOString().split('T')[0]

      const { data: escalasData, error: escalasErr } = await supabase
        .from('escalas')
        .select(
          `
          id,
          igreja_id,
          evento:evento_id (
            id,
            data,
            hora,
            tipo
          )
        `,
        )
        .eq('igreja_id', cfg.igreja_id)
        .eq('publicada', true)
        .gte('evento.data', hojeStr)
        .lte('evento.data', limiteStr)

      if (escalasErr) {
        processed.push({ igreja_id: cfg.igreja_id, escalas: 0, emails_enviados: 0, whatsapp_enviados: 0, skipped: 0 })
        continue
      }

      const escalaIds = (escalasData ?? [])
        .map((row) => (row && typeof row === 'object' ? (row as { id?: unknown }).id : null))
        .filter((id): id is string => typeof id === 'string' && id.length > 0)

      if (escalaIds.length === 0) {
        processed.push({ igreja_id: cfg.igreja_id, escalas: 0, emails_enviados: 0, whatsapp_enviados: 0, skipped: 0 })
        continue
      }

      const { data: musicasData, error: musicasErr } = await supabase
        .from('escala_musicas')
        .select('escala_id')
        .in('escala_id', escalaIds)

      if (musicasErr) {
        processed.push({ igreja_id: cfg.igreja_id, escalas: 0, emails_enviados: 0, whatsapp_enviados: 0, skipped: 0 })
        continue
      }

      const escalasComMusicas = new Set((musicasData ?? []).map((m) => String((m as { escala_id?: unknown }).escala_id)))

      const alvos: EscalaAlvo[] = (escalasData ?? [])
        .map((row) => {
          if (!row || typeof row !== 'object') return null
          const escalaId = (row as { id?: unknown }).id
          const igrejaId = (row as { igreja_id?: unknown }).igreja_id
          const evento = (row as { evento?: unknown }).evento
          if (typeof escalaId !== 'string' || typeof igrejaId !== 'string') return null
          if (!evento || typeof evento !== 'object') return null
          const data = (evento as { data?: unknown }).data
          const hora = (evento as { hora?: unknown }).hora
          const tipo = (evento as { tipo?: unknown }).tipo
          const eventoId = (evento as { id?: unknown }).id
          if (typeof data !== 'string' || typeof hora !== 'string' || typeof eventoId !== 'string') {
            return null
          }
          const tipoFinal = typeof tipo === 'string' && tipo.length > 0 ? tipo : 'culto'
          if (escalasComMusicas.has(escalaId)) return null

          return {
            escala_id: escalaId,
            igreja_id: igrejaId,
            evento_id: eventoId,
            data,
            hora,
            tipo: tipoFinal,
          }
        })
        .filter((x): x is EscalaAlvo => x !== null)

      let emailsEnviados = 0
      let whatsappEnviados = 0
      let skipped = 0

      for (const alvo of alvos) {
        if (alertasPorDia === 0) {
          console.log('Skip: alertas_por_dia=0', alvo.escala_id)
          skipped++
          continue
        }

        const { data: logData, error: logErr } = await supabase
          .from('escala_notificacao_log')
          .select('id')
          .eq('escala_id', alvo.escala_id)
          .eq('tipo', 'missing_musicas')
          .eq('dia', hojeStr)
          .eq('slot', slot)
          .maybeSingle()

        if (logErr) {
          console.error('Skip: erro ao consultar escala_notificacao_log', alvo.escala_id, logErr)
          skipped++
          continue
        }

        if (logData) {
          console.log('Skip: ja notificado no slot', alvo.escala_id)
          skipped++
          continue
        }

        const { data: ministrantesData, error: ministrantesErr } = await supabase
          .from('escalados')
          .select('usuario_id')
          .eq('escala_id', alvo.escala_id)
          .eq('is_ministrante', true)

        if (ministrantesErr || !ministrantesData || ministrantesData.length === 0) {
          console.error('Skip: sem ministrantes ou erro', alvo.escala_id, ministrantesErr)
          skipped++
          continue
        }

        const usuarioIds = Array.from(new Set(ministrantesData.map((m) => String((m as { usuario_id?: unknown }).usuario_id))))

        // Buscar ministrantes com preferência de canal
        const { data: usuariosData, error: usuariosErr } = await supabase
          .from('usuarios')
          .select('id, nome, email, telefone, canal_notificacao')
          .in('id', usuarioIds)

        if (usuariosErr || !usuariosData || usuariosData.length === 0) {
          console.error('Skip: sem usuarios ou erro', alvo.escala_id, usuariosErr)
          skipped++
          continue
        }

        const ministrantes: MinistranteInfo[] = usuariosData
          .map((u) => {
            if (!u || typeof u !== 'object') return null
            const id = (u as { id?: unknown }).id
            const nome = (u as { nome?: unknown }).nome
            const email = (u as { email?: unknown }).email
            const telefone = (u as { telefone?: unknown }).telefone
            const canalNotificacao = (u as { canal_notificacao?: unknown }).canal_notificacao

            if (typeof id !== 'string' || typeof nome !== 'string' || typeof email !== 'string') return null

            return {
              id,
              nome,
              email,
              telefone: typeof telefone === 'string' ? telefone : undefined,
              canal_notificacao: (canalNotificacao === 'whatsapp' || canalNotificacao === 'ambos') ? canalNotificacao : 'email'
            }
          })
          .filter((m): m is MinistranteInfo => m !== null)

        if (ministrantes.length === 0) {
          console.log('Skip: ministrantes invalidos', alvo.escala_id)
          skipped++
          continue
        }

        const dataFmt = new Date(alvo.data + 'T00:00:00').toLocaleDateString('pt-BR')
        const tipoFmt = alvo.tipo === 'culto' ? 'Culto' : 'Ensaio'

        let sucessoEmail = 0
        let sucessoWhatsApp = 0

        // Enviar notificações para cada ministrante conforme preferência
        for (const ministrante of ministrantes) {
          const promises = []

          // Se preferência incluir email
          if (ministrante.canal_notificacao === 'email' || ministrante.canal_notificacao === 'ambos') {
            if (ministrante.email) {
              promises.push(
                enviarEmailLembrete(ministrante, tipoFmt, dataFmt, alvo.hora)
                  .then(success => {
                    if (success) sucessoEmail++
                  })
              )
            }
          }

          // Se preferência incluir WhatsApp E tem telefone
          if ((ministrante.canal_notificacao === 'whatsapp' || ministrante.canal_notificacao === 'ambos') && ministrante.telefone) {
            promises.push(
              enviarWhatsAppLembrete(ministrante, tipoFmt, dataFmt, alvo.hora, alvo.igreja_id)
                .then(success => {
                  if (success) sucessoWhatsApp++
                })
            )
          }

          // Executar envios em paralelo
          await Promise.all(promises)
        }

        // Se pelo menos uma notificação foi enviada, registrar log
        if (sucessoEmail > 0 || sucessoWhatsApp > 0) {
          const { error: insertLogErr } = await supabase
            .from('escala_notificacao_log')
            .insert({
              escala_id: alvo.escala_id,
              igreja_id: alvo.igreja_id,
              tipo: 'missing_musicas',
              dia: hojeStr,
              slot,
            })

          if (insertLogErr) {
            console.error('Erro ao inserir log:', insertLogErr)
          }

          emailsEnviados += sucessoEmail
          whatsappEnviados += sucessoWhatsApp
        } else {
          skipped++
        }
      }

      processed.push({
        igreja_id: cfg.igreja_id,
        escalas: alvos.length,
        emails_enviados: emailsEnviados,
        whatsapp_enviados: whatsappEnviados,
        skipped
      })
    }

    return new Response(JSON.stringify({ success: true, processed }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('remind_musicas_ministrantes_v2 error:', e)
    return new Response(JSON.stringify({ error: 'Erro interno.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
