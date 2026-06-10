import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const ZAPI_INSTANCE     = Deno.env.get('ZAPI_INSTANCE') ?? ''
const ZAPI_TOKEN        = Deno.env.get('ZAPI_TOKEN') ?? ''
const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN') ?? ''

async function sendMsg(phone: string, msg: string) {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN) return
  await fetch(
    `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT_TOKEN },
      body: JSON.stringify({ phone, message: msg }),
    }
  ).catch(() => {})
}

// ── Verifica horário comercial BRT (UTC-3) ────────────────────
// Mensagens são enviadas apenas entre 8h e 20h no horário de Brasília.
// No banco, os horários são UTC. BRT = UTC - 3.
function isBusinessHour(nowUtc: Date): boolean {
  const brtHour = (nowUtc.getUTCHours() - 3 + 24) % 24
  return brtHour >= 8 && brtHour < 20
}

// ── Mensagens de follow-up ────────────────────────────────────
function buildFollowup1(name: string, interest: string): string {
  const firstName = (name || '').split(' ')[0] || 'Olá'

  if (interest === 'franquia') {
    return (
      `Oi, *${firstName}*! 👋\n\n` +
      `Passando para ver se recebeu nossa mensagem sobre a *Franquia Laser&Co* e se ficou alguma dúvida!\n\n` +
      `A Laser&Co está em plena expansão pelo Brasil e *sua cidade pode ser a próxima* a ter uma unidade. 🗺️\n\n` +
      `Gostaria de saber mais sobre a proposta de franquia?\n\n` +
      `*1️⃣* Sim, tenho interesse!\n*2️⃣* Não, obrigado.`
    )
  }

  if (interest === 'quanta') {
    return (
      `Oi, *${firstName}*! 👋\n\n` +
      `Passando para ver se você já teve a chance de analisar as informações sobre a *Quanta Q-Plus EVO*! ⚡\n\n` +
      `Você sabia que a Quanta Q-Plus EVO é o *único laser do mercado* com 3 comprimentos de onda reais? Isso significa muito mais versatilidade e rentabilidade para sua clínica!\n\n` +
      `Posso te mandar mais detalhes ou agendar uma demonstração?\n\n` +
      `*1️⃣* Quero mais informações\n*2️⃣* Quero agendar demonstração\n*3️⃣* Não tenho interesse agora`
    )
  }

  if (interest === 'ultracel') {
    return (
      `Oi, *${firstName}*! 👋\n\n` +
      `Passando para ver se você já analisou as informações sobre o *UltraCel Q+*! ✨\n\n` +
      `Só para reforçar: o UltraCel Q+ é o *único HIFU linear do mercado*, realizando *300 disparos em 3 minutos* — isso é 3x mais rápido e o paciente sente muito menos desconforto!\n\n` +
      `Posso te enviar mais detalhes ou agendar uma demonstração?\n\n` +
      `*1️⃣* Quero mais informações\n*2️⃣* Quero agendar demonstração\n*3️⃣* Não tenho interesse agora`
    )
  }

  // Genérico
  return (
    `Oi, *${firstName}*! 👋\n\n` +
    `Passando para ver se posso te ajudar com alguma dúvida sobre a *Laser&Co*!\n\n` +
    `Qual é o seu interesse?\n\n` +
    `*1️⃣* Franquia Laser&Co\n` +
    `*2️⃣* Quanta Q-Plus EVO\n` +
    `*3️⃣* UltraCel Q+`
  )
}

function buildFollowup2(name: string, interest: string): string {
  const firstName = (name || '').split(' ')[0] || 'Olá'

  if (interest === 'franquia') {
    return (
      `*${firstName}*, última tentativa de contato! 😊\n\n` +
      `Sei que a agenda é corrida, mas abrir uma *Franquia Laser&Co* pode transformar o seu futuro! 🚀\n\n` +
      `✅ Investimento a partir de R$ 290.000\n` +
      `✅ Retorno em 12 a 18 meses\n` +
      `✅ Mais de 70 unidades em todo o Brasil\n` +
      `✅ Suporte completo desde o primeiro dia\n\n` +
      `Podemos fazer uma *chamada rápida de 15 minutos* para eu te apresentar a proposta?\n\n` +
      `*1️⃣* Sim, quero a chamada!\n*2️⃣* Prefiro receber por WhatsApp\n*3️⃣* Não tenho interesse`
    )
  }

  if (interest === 'quanta') {
    return (
      `*${firstName}*, última mensagem! 😊\n\n` +
      `A *Quanta Q-Plus EVO* está transformando clínicas de estética no Brasil inteiro. ⚡\n\n` +
      `Podemos agendar uma *demonstração gratuita e sem compromisso*? É a melhor forma de ver os resultados na prática!\n\n` +
      `*1️⃣* Sim! Quero agendar uma demonstração\n*2️⃣* Prefiro um contato por telefone\n*3️⃣* Não tenho interesse no momento`
    )
  }

  if (interest === 'ultracel') {
    return (
      `*${firstName}*, última mensagem! 😊\n\n` +
      `O *UltraCel Q+* continua sendo o HIFU mais rápido e confortável do mercado. ✨\n\n` +
      `Podemos agendar uma *demonstração gratuita e sem compromisso*? Resultados comprovados em papada, flacidez corporal e muito mais!\n\n` +
      `*1️⃣* Sim! Quero agendar uma demonstração\n*2️⃣* Prefiro um contato por telefone\n*3️⃣* Não tenho interesse no momento`
    )
  }

  return (
    `*${firstName}*, última tentativa de contato da *Laser&Co*! 😊\n\n` +
    `Se tiver interesse em qualquer momento, é só chamar!\n\n` +
    `*1️⃣* Quero retomar o contato\n*2️⃣* Não tenho interesse`
  )
}

// ── Processa um follow-up ─────────────────────────────────────
async function processFollowup(conv: Record<string, unknown>, now: Date): Promise<void> {
  const phone    = conv.phone as string
  const name     = (conv.name as string) || phone
  const interest = (conv.interest as string) || ''
  const count    = (conv.followup_count as number) || 0
  const convId   = conv.id as string

  let msg = ''
  let nextCount = count + 1
  let nextFollowup: string | null = null
  let newStatus: string | null = null

  if (count === 0) {
    // 1º follow-up: 24h após envio inicial
    msg = buildFollowup1(name, interest)
    // Agenda 2º follow-up para 24h depois
    nextFollowup = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    // Avança pipeline para msg2
    if (conv.lead_id) {
      await sb.from('leads').update({ status: 'msg2', updated_at: now.toISOString() }).eq('id', conv.lead_id)
    }
  } else if (count === 1) {
    // 2º follow-up: 48h após envio inicial (24h após 1º)
    msg = buildFollowup2(name, interest)
    // Sem próximo follow-up — encerra régua
    nextFollowup = null
    newStatus = 'sem_resposta'
    // Avança pipeline para msg3
    if (conv.lead_id) {
      await sb.from('leads').update({ status: 'msg3', updated_at: now.toISOString() }).eq('id', conv.lead_id)
    }
  } else {
    // Já enviou 2 follow-ups — encerra
    await sb.from('wapp_conversations').update({
      status: 'sem_resposta',
      next_followup: null,
    }).eq('id', convId)
    return
  }

  // Salva mensagem
  await sb.from('wapp_messages').insert({
    conv_id: convId,
    direction: 'out',
    body: msg,
    sent_by: 'bot',
  })

  // Envia via Z-API
  await sendMsg(phone, msg)

  // Atualiza conversa
  const update: Record<string, unknown> = {
    followup_count: nextCount,
    next_followup: nextFollowup,
    last_msg: msg.substring(0, 120),
    last_msg_at: now.toISOString(),
  }
  if (newStatus) update.status = newStatus
  await sb.from('wapp_conversations').update(update).eq('id', convId)
}

// ── Handler ───────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const now = new Date()

    if (!isBusinessHour(now)) {
      return new Response(
        JSON.stringify({ ok: true, msg: 'Fora do horário comercial — nenhum follow-up enviado', brt_hour: (now.getUTCHours() - 3 + 24) % 24 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Busca conversas pendentes de follow-up
    // status = 'bot' | 'sem_resposta' apenas se for reativação
    // followup_count < 2 (já enviou os 2 → não manda mais)
    // next_followup <= agora
    const { data: convs, error } = await sb
      .from('wapp_conversations')
      .select('*')
      .eq('status', 'bot')
      .lt('followup_count', 2)
      .lte('next_followup', now.toISOString())
      .not('next_followup', 'is', null)
      .order('next_followup', { ascending: true })
      .limit(50)

    if (error) throw error

    if (!convs || convs.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, msg: 'Nenhum follow-up pendente', processed: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    let processed = 0
    let errors = 0

    for (const conv of convs) {
      try {
        await processFollowup(conv as Record<string, unknown>, now)
        processed++
        // Pequeno delay para não saturar a API
        await new Promise(r => setTimeout(r, 500))
      } catch (e) {
        console.error(`Erro follow-up conv ${conv.id}:`, e)
        errors++
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed, errors, total: convs.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-followups error:', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
