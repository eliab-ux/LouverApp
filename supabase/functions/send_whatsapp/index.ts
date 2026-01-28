import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendWhatsAppRequest {
  phone: string
  message: string
  igreja_id: string
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

    const body = (await req.json().catch(() => null)) as SendWhatsAppRequest | null

    if (!body?.phone || !body?.message || !body?.igreja_id) {
      return new Response(
        JSON.stringify({ error: 'phone, message e igreja_id são obrigatórios.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Configuração do Supabase incompleta.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Buscar configuração do WhatsApp da igreja
    const { data: igreja, error: igrejaError } = await supabase
      .from('igrejas')
      .select('whatsapp_habilitado, whatsapp_instance_id, whatsapp_api_key')
      .eq('id', body.igreja_id)
      .single()

    if (igrejaError || !igreja) {
      return new Response(JSON.stringify({ error: 'Igreja não encontrada.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!igreja.whatsapp_habilitado) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp não está habilitado para esta igreja.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!igreja.whatsapp_instance_id || !igreja.whatsapp_api_key) {
      return new Response(
        JSON.stringify({ error: 'Configuração do WhatsApp incompleta na igreja.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Obter URL da Evolution API do env
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')

    if (!EVOLUTION_API_URL) {
      return new Response(JSON.stringify({ error: 'EVOLUTION_API_URL não configurado.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Formatar número de telefone (remover caracteres não numéricos e adicionar DDI do Brasil se necessário)
    let phoneNumber = body.phone.replace(/\D/g, '')
    if (!phoneNumber.startsWith('55') && phoneNumber.length === 11) {
      phoneNumber = '55' + phoneNumber
    }

    // Enviar mensagem via Evolution API
    const evolutionResponse = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${igreja.whatsapp_instance_id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': igreja.whatsapp_api_key,
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: body.message,
        }),
      },
    )

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text()
      console.error('Erro Evolution API:', errorText)
      return new Response(
        JSON.stringify({
          error: 'Erro ao enviar mensagem via WhatsApp.',
          details: errorText,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const result = await evolutionResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mensagem enviada com sucesso!',
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (e) {
    console.error('send_whatsapp error:', e)
    return new Response(
      JSON.stringify({
        error: 'Erro interno.',
        details: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
