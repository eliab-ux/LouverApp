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

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ success: true, message: 'RESEND_API_KEY não configurada.' }), {
        status: 200,
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

    const processed: Array<{ igreja_id: string; escalas: number; emails: number; skipped: number }> = []

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
        processed.push({ igreja_id: cfg.igreja_id, escalas: 0, emails: 0, skipped: 0 })
        continue
      }

      const escalaIds = (escalasData ?? [])
        .map((row) => (row && typeof row === 'object' ? (row as { id?: unknown }).id : null))
        .filter((id): id is string => typeof id === 'string' && id.length > 0)

      if (escalaIds.length === 0) {
        processed.push({ igreja_id: cfg.igreja_id, escalas: 0, emails: 0, skipped: 0 })
        continue
      }

      const { data: musicasData, error: musicasErr } = await supabase
        .from('escala_musicas')
        .select('escala_id')
        .in('escala_id', escalaIds)

      if (musicasErr) {
        processed.push({ igreja_id: cfg.igreja_id, escalas: 0, emails: 0, skipped: 0 })
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
          if (typeof data !== 'string' || typeof hora !== 'string' || typeof tipo !== 'string' || typeof eventoId !== 'string') {
            return null
          }
          if (escalasComMusicas.has(escalaId)) return null

          return {
            escala_id: escalaId,
            igreja_id: igrejaId,
            evento_id: eventoId,
            data,
            hora,
            tipo,
          }
        })
        .filter((x): x is EscalaAlvo => x !== null)

      let emailsEnviados = 0
      let skipped = 0

      for (const alvo of alvos) {
        if (alertasPorDia === 0) {
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
          skipped++
          continue
        }

        if (logData) {
          skipped++
          continue
        }

        const { data: ministrantesData, error: ministrantesErr } = await supabase
          .from('escalados')
          .select('usuario_id')
          .eq('escala_id', alvo.escala_id)
          .eq('is_ministrante', true)

        if (ministrantesErr || !ministrantesData || ministrantesData.length === 0) {
          skipped++
          continue
        }

        const usuarioIds = Array.from(new Set(ministrantesData.map((m) => String((m as { usuario_id?: unknown }).usuario_id))))

        const { data: usuariosData, error: usuariosErr } = await supabase
          .from('usuarios')
          .select('id, nome, email')
          .in('id', usuarioIds)

        if (usuariosErr || !usuariosData) {
          skipped++
          continue
        }

        const emails = usuariosData
          .map((u) => (u && typeof u === 'object' ? (u as { email?: unknown }).email : null))
          .filter((e): e is string => typeof e === 'string' && e.length > 0)

        if (emails.length === 0) {
          skipped++
          continue
        }

        const dataFmt = new Date(alvo.data + 'T00:00:00').toLocaleDateString('pt-BR')
        const tipoFmt = alvo.tipo === 'culto' ? 'Culto' : 'Ensaio'

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f59e0b;">🎶 Lembrete: adicionar músicas</h2>
            <p>Olá! A escala abaixo ainda está <strong>sem músicas cadastradas</strong>.</p>
            <div style="background: #0b1220; color: #e2e8f0; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>${tipoFmt}</strong></p>
              <p style="margin: 0 0 8px 0;">📅 ${dataFmt}</p>
              <p style="margin: 0;">🕐 ${alvo.hora}</p>
            </div>
            <p>Entre no app e cadastre o repertório do evento.</p>
          </div>
        `

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Louvor App <noreply@resend.dev>',
            to: emails,
            subject: `🎶 Lembrete: adicionar músicas - ${tipoFmt} ${dataFmt}`,
            html,
          }),
        })

        if (!res.ok) {
          skipped++
          continue
        }

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
          skipped++
          continue
        }

        emailsEnviados += emails.length
      }

      processed.push({ igreja_id: cfg.igreja_id, escalas: alvos.length, emails: emailsEnviados, skipped })
    }

    return new Response(JSON.stringify({ success: true, processed }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('remind_musicas_ministrantes error:', e)
    return new Response(JSON.stringify({ error: 'Erro interno.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
