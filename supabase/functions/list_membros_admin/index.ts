import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    const body = (await req.json().catch(() => null)) as {
      igreja_id?: string
    } | null

    if (!body?.igreja_id) {
      return new Response(JSON.stringify({ error: 'Igreja obrigatoria.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Configuracao do Supabase incompleta.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) {
      return new Response(JSON.stringify({ error: 'Nao autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !authData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Sessao invalida.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: usuarioAtual, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('papel, igreja_id')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (usuarioError || !usuarioAtual) {
      return new Response(JSON.stringify({ error: 'Usuario nao encontrado.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (usuarioAtual.papel !== 'admin' || usuarioAtual.igreja_id !== body.igreja_id) {
      return new Response(JSON.stringify({ error: 'Sem permissao.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: membros, error: membrosError } = await supabaseAdmin
      .from('usuarios')
      .select('id, nome, email, telefone, papel, funcoes, status')
      .eq('igreja_id', body.igreja_id)
      .order('nome', { ascending: true })

    if (membrosError) {
      console.error('Erro ao carregar membros:', membrosError)
      return new Response(JSON.stringify({ error: 'Erro ao carregar membros.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authUsers = []
    const perPage = 1000
    let page = 1
    while (true) {
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      })

      if (listError) {
        console.error('Erro ao listar usuarios auth:', listError)
        return new Response(JSON.stringify({ error: 'Erro ao listar usuarios.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const users = listData?.users ?? []
      authUsers.push(...users)
      if (users.length < perPage) break
      page += 1
    }

    const authMap = new Map<string, { last_sign_in_at: string | null; confirmed_at: string | null }>()
    for (const user of authUsers) {
      if (user?.id) {
        authMap.set(user.id, {
          last_sign_in_at: user.last_sign_in_at ?? null,
          confirmed_at: user.confirmed_at ?? user.email_confirmed_at ?? null,
        })
      }
    }

    const membrosComAuth = (membros ?? []).map((m) => ({
      ...m,
      last_sign_in_at: authMap.get(String(m.id))?.last_sign_in_at ?? null,
      confirmed_at: authMap.get(String(m.id))?.confirmed_at ?? null,
    }))

    return new Response(JSON.stringify({ membros: membrosComAuth }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('list_membros_admin error:', e)
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
