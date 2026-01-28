import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getRedirectUrl = (req: Request) => {
  const explicit =
    Deno.env.get('INVITE_REDIRECT_URL') ??
    Deno.env.get('SITE_URL') ??
    Deno.env.get('APP_URL')
  if (explicit) return explicit

  const origin = req.headers.get('origin')
  if (origin) return origin

  const referer = req.headers.get('referer')
  if (referer) {
    try {
      const url = new URL(referer)
      return `${url.protocol}//${url.host}`
    } catch {
      return null
    }
  }

  return null
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
      email?: string
      nome?: string | null
      telefone?: string | null
      papel?: 'admin' | 'lider' | 'membro'
      funcoes?: string[] | null
      igreja_id?: string
    } | null

    if (!body?.email) {
      return new Response(JSON.stringify({ error: 'Email obrigatorio.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!body?.igreja_id) {
      return new Response(JSON.stringify({ error: 'Igreja obrigatoria.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const papel = body.papel ?? 'membro'
    const funcoes = Array.isArray(body.funcoes) && body.funcoes.length > 0 ? body.funcoes : null
    const telefone = body.telefone && body.telefone.trim() ? body.telefone.trim() : null
    const igreja_id = body.igreja_id

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

    if (!SUPABASE_URL) {
      return new Response(JSON.stringify({ error: 'SUPABASE_URL nao configurado nas variaveis de ambiente.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          error:
            'SERVICE_ROLE_KEY nao configurado. Configure em Supabase > Project Settings > Functions > Secrets e faca redeploy da funcao.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const criarOuAtualizarUsuario = async (userId: string) => {
      const { error: insertError } = await supabaseAdmin.from('usuarios').insert({
        id: userId,
        email: body.email,
        nome: body.nome ?? null,
        telefone,
        papel,
        funcoes,
        igreja_id,
        status: 'aguardando_verificacao',
      })

      if (insertError) {
        if (insertError.code === '23505') {
          const { data: statusData } = await supabaseAdmin
            .from('usuarios')
            .select('status')
            .eq('email', body.email)
            .maybeSingle()

          const nextStatus = statusData?.status === 'ativo' ? undefined : 'aguardando_verificacao'
          const updatePayload: Record<string, unknown> = {
            papel,
            funcoes,
            telefone,
            nome: body.nome ?? null,
          }
          if (nextStatus) {
            updatePayload.status = nextStatus
          }

          const { error: updateError } = await supabaseAdmin
            .from('usuarios')
            .update(updatePayload)
            .eq('email', body.email)

          if (updateError) {
            console.error('Erro ao atualizar usuario existente:', updateError)
            return new Response(
              JSON.stringify({
                error: 'Erro ao atualizar usuario existente na tabela usuarios.',
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
              error: insertError.message,
              warning: 'Convite enviado, mas houve erro ao criar registro em usuarios.',
              details: insertError.message,
              code: (insertError as unknown as { code?: string }).code ?? null,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
      }

      return null
    }

    if (telefone) {
      const redirectTo = getRedirectUrl(req)
      let linkData = null as null | {
        action_link?: string
        user?: { id?: string }
      }

      const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: body.email,
        options: {
          redirectTo: redirectTo ?? undefined,
          data: {
            nome: body.nome ?? null,
            papel,
            funcoes: funcoes ?? [],
            igreja_id,
          },
        },
      })

      if (linkError?.message?.includes('already been registered')) {
        const { data: magicData, error: magicError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: body.email,
          options: {
            redirectTo: redirectTo ?? undefined,
          },
        })

        if (magicError) {
          console.error('Erro generateLink magiclink:', magicError)
          return new Response(
            JSON.stringify({
              error: magicError.message || 'Erro ao gerar link de acesso.',
              details: (magicError as unknown as { code?: string }).code ?? null,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }

        linkData = magicData as typeof linkData
      } else if (linkError) {
        console.error('Erro generateLink invite:', linkError)
        return new Response(
          JSON.stringify({
            error: linkError.message || 'Erro ao gerar link de convite.',
            details: (linkError as unknown as { code?: string }).code ?? null,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      } else {
        linkData = data as typeof linkData
      }

      const actionLink =
        (linkData as { action_link?: string } | null)?.action_link ??
        (linkData as { properties?: { action_link?: string } } | null)?.properties?.action_link
      let userId = linkData?.user?.id

      if (!userId) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = listData?.users?.find((u: { email?: string }) => u.email === body.email)
        userId = existingUser?.id
      }

      if (!actionLink || !userId) {
        return new Response(
          JSON.stringify({
            error: 'Nao foi possivel gerar o link de ativacao.',
            details: redirectTo ? `redirectTo=${redirectTo}` : 'redirectTo nao definido',
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const upsertResponse = await criarOuAtualizarUsuario(userId)
      if (upsertResponse) return upsertResponse

      const mensagem = [
        `Ola ${body.nome ?? 'tudo bem'}!`,
        '',
        'Voce foi convidado para o LouvorApp.',
        `Ative sua conta acessando: ${actionLink}`,
        '',
        'Se voce nao solicitou, ignore.',
      ].join('\n')

      const whatsappResponse = await fetch(`${SUPABASE_URL}/functions/v1/send_whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          phone: telefone,
          message: mensagem,
          igreja_id,
        }),
      })

      if (!whatsappResponse.ok) {
        const errorText = await whatsappResponse.text()
        console.error('Erro ao enviar WhatsApp convite:', errorText)
        return new Response(
          JSON.stringify({
            error: 'Erro ao enviar convite por WhatsApp.',
            details: errorText,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      return new Response(JSON.stringify({ success: true, channel: 'whatsapp' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: userData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(body.email, {
        data: {
          nome: body.nome ?? null,
          papel,
          funcoes: funcoes ?? [],
          igreja_id,
        },
      })

    if (inviteError?.message?.includes('already been registered')) {
      const { data: existingUsuario } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', body.email)
        .maybeSingle()

      if (existingUsuario) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Este usuario ja esta cadastrado no sistema.',
            alreadyExists: true,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = listData?.users?.find((u: { email?: string }) => u.email === body.email)

      if (existingUser) {
        const upsertResponse = await criarOuAtualizarUsuario(existingUser.id)
        if (upsertResponse) return upsertResponse

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Usuario ja tinha conta. Registro completado na igreja.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    if (inviteError || !userData?.user) {
      console.error('Erro inviteUserByEmail:', inviteError)
      return new Response(
        JSON.stringify({
          error: inviteError?.message || 'Erro ao convidar usuario.',
          details: (inviteError as unknown as { code?: string }).code ?? null,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const user = userData.user

    const upsertResponse = await criarOuAtualizarUsuario(user.id)
    if (upsertResponse) return upsertResponse

    return new Response(JSON.stringify({ success: true, channel: 'email' }), {
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
