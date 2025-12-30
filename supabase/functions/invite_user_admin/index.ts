import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const body = (await req.json().catch(() => null)) as {
      email?: string
      nome?: string | null
      telefone?: string | null
      papel?: 'admin' | 'lider' | 'membro'
      funcoes?: string[] | null
      igreja_id?: string
    } | null

    if (!body?.email) {
      return new Response(JSON.stringify({ error: 'Email é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!body?.igreja_id) {
      return new Response(JSON.stringify({ error: 'Igreja é obrigatória.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const papel = body.papel ?? 'membro'
    const funcoes = Array.isArray(body.funcoes) && body.funcoes.length > 0 ? body.funcoes : null
    const telefone = body.telefone ?? null
    const igreja_id = body.igreja_id

    // SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente pelo Supabase
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL) {
      return new Response(JSON.stringify({ error: 'SUPABASE_URL não configurado nas variáveis de ambiente.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          error:
            'SUPABASE_SERVICE_ROLE_KEY não configurado. Configure em Supabase > Project Settings > Functions > Secrets e faça redeploy da função.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // 1) Tenta convidar usuário (envia email de convite)
    const { data: userData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(body.email, {
        data: {
          nome: body.nome ?? null,
          papel,
          funcoes: funcoes ?? [],
          igreja_id,
        },
      })

    // Se o usuário já existe, verifica se já está na tabela usuarios
    if (inviteError?.message?.includes('already been registered')) {
      // Verifica se já existe na tabela usuarios
      const { data: existingUsuario } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', body.email)
        .maybeSingle()

      if (existingUsuario) {
        // Usuário já está cadastrado completamente
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Este usuário já está cadastrado no sistema.',
            alreadyExists: true 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Usuário existe no Auth mas não na tabela usuarios - busca o ID e insere
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = listData?.users?.find((u: { email?: string }) => u.email === body.email)

      if (existingUser) {
        // Insere na tabela usuarios
        const { error: insertExistingError } = await supabaseAdmin.from('usuarios').insert({
          id: existingUser.id,
          email: body.email,
          nome: body.nome ?? null,
          telefone,
          papel,
          funcoes,
          igreja_id,
        })

        if (insertExistingError && insertExistingError.code !== '23505') {
          console.error('Erro ao inserir usuario existente:', insertExistingError)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Usuário já tinha conta. Registro completado na igreja.' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    if (inviteError || !userData?.user) {
      console.error('Erro inviteUserByEmail:', inviteError)
      return new Response(
        JSON.stringify({
          error: inviteError?.message || 'Erro ao convidar usuário.',
          details: (inviteError as unknown as { code?: string }).code ?? null,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const user = userData.user

    // 2) Cria registro na tabela `usuarios`
    const { error: insertError } = await supabaseAdmin.from('usuarios').insert({
      id: user.id,
      email: body.email,
      nome: body.nome ?? null,
      telefone,
      papel,
      funcoes,
      igreja_id,
    })

    if (insertError) {
      // Se já existe, apenas atualiza
      if (insertError.code === '23505') {
        const { error: updateError } = await supabaseAdmin
          .from('usuarios')
          .update({ papel, funcoes, telefone, nome: body.nome ?? null })
          .eq('email', body.email)

        if (updateError) {
          console.error('Erro ao atualizar usuario existente:', updateError)
          return new Response(
            JSON.stringify({
              error: 'Erro ao atualizar usuário existente na tabela usuarios.',
              details: updateError.message,
              code: (updateError as unknown as { code?: string }).code ?? null,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
      } else {
        console.error('Erro ao inserir em usuarios:', insertError)
        return new Response(
          JSON.stringify({
            warning: 'Convite enviado, mas houve erro ao criar registro em usuarios.',
            details: insertError.message,
            code: (insertError as unknown as { code?: string }).code ?? null,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('invite_user_admin error:', e)
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
