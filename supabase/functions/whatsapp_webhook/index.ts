import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'



const corsHeaders = {

  'Access-Control-Allow-Origin': '*',

  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',

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



  const secret = Deno.env.get('EVOLUTION_WEBHOOK_SECRET')

  const url = new URL(req.url)

  const token = url.searchParams.get('token')

  const headerSecret = req.headers.get('x-webhook-secret')



  if (secret && secret !== token && secret !== headerSecret) {

    return new Response(JSON.stringify({ error: 'Unauthorized' }), {

      status: 401,

      headers: { ...corsHeaders, 'Content-Type': 'application/json' },

    })



  }

  const payload = await req.json().catch(() => null)

  if (!payload) {

    return new Response(JSON.stringify({ error: 'Invalid payload' }), {

      status: 400,

      headers: { ...corsHeaders, 'Content-Type': 'application/json' },

    })

  }



  const eventType = payload?.event ?? payload?.eventType ?? payload?.type ?? 'unknown'

  console.log('Evolution webhook received:', eventType)



  return new Response(JSON.stringify({ ok: true }), {

    status: 200,

    headers: { ...corsHeaders, 'Content-Type': 'application/json' },

  })

})

