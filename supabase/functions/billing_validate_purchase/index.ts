import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Plataforma = 'ios' | 'android'

interface ValidatePayload {
  plataforma: Plataforma
  receipt_or_token: string
  sku: string
  igreja_id: string
}

const getPeriodDays = (sku: string) => {
  const s = sku.toLowerCase()
  if (s.includes('anual') || s.includes('year') || s.includes('annual')) return 365
  return 30
}

const getSupabaseClient = () => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL ou SERVICE_ROLE_KEY nao configurado')
  }

  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const payload = (await req.json().catch(() => null)) as ValidatePayload | null
  if (!payload?.plataforma || !payload?.receipt_or_token || !payload?.sku || !payload?.igreja_id) {
    return new Response(JSON.stringify({ error: 'Payload invalido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const allowUnverified = Deno.env.get('BILLING_ALLOW_UNVERIFIED') === 'true'
  if (!allowUnverified) {
    return new Response(
      JSON.stringify({
        error: 'VALIDACAO_NAO_IMPLEMENTADA',
        message: 'Configure validacao Apple/Google ou habilite BILLING_ALLOW_UNVERIFIED para dev.',
      }),
      { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const supabase = getSupabaseClient()
    const now = new Date()
    const periodDays = getPeriodDays(payload.sku)
    const start = now.toISOString()
    const end = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000).toISOString()

    const { data: assinatura, error: upsertError } = await supabase
      .from('igreja_assinatura')
      .upsert(
        {
          igreja_id: payload.igreja_id,
          plataforma: payload.plataforma,
          sku: payload.sku,
          status: 'active',
          current_period_start: start,
          current_period_end: end,
          auto_renew: true,
          purchase_token: payload.plataforma === 'android' ? payload.receipt_or_token : null,
          original_transaction_id: payload.plataforma === 'ios' ? payload.receipt_or_token : null,
          last_event_at: now.toISOString(),
        },
        { onConflict: 'igreja_id,plataforma' },
      )
      .select('*')
      .single()

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: entitlement, error: entError } = await supabase.rpc('entitlement_recalculate', {
      p_igreja_id: payload.igreja_id,
    })

    if (entError) {
      return new Response(JSON.stringify({ error: entError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        assinatura,
        entitlement,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
