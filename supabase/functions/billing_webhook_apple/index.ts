import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Status = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' | 'suspended'

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

  const payload = await req.json().catch(() => null)
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Payload invalido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const allowUnverified = Deno.env.get('BILLING_ALLOW_UNVERIFIED') === 'true'
  if (!allowUnverified) {
    return new Response(JSON.stringify({ error: 'VALIDACAO_NAO_IMPLEMENTADA' }), {
      status: 501,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = getSupabaseClient()
    const now = new Date().toISOString()

    const igrejaId = payload?.igreja_id as string | undefined
    const sku = payload?.sku as string | undefined
    const status = (payload?.status as Status | undefined) ?? 'active'
    const originalTransactionId = payload?.original_transaction_id as string | undefined
    const currentPeriodEnd = payload?.current_period_end as string | undefined

    if (!igrejaId || !sku) {
      return new Response(JSON.stringify({ error: 'Campos obrigatorios ausentes' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: assinatura, error: upsertError } = await supabase
      .from('igreja_assinatura')
      .upsert(
        {
          igreja_id: igrejaId,
          plataforma: 'ios',
          sku,
          status,
          current_period_end: currentPeriodEnd ?? null,
          original_transaction_id: originalTransactionId ?? null,
          last_event_at: now,
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

    const { error: entError } = await supabase.rpc('entitlement_recalculate', {
      p_igreja_id: igrejaId,
    })

    if (entError) {
      return new Response(JSON.stringify({ error: entError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, assinatura }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
