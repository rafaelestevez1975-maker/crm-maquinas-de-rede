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

// Mensagem inicial personalizada por interesse
function buildWelcome(name: string, interest: string, city: string): string {
  const firstName = (name || '').split(' ')[0] || 'Olá'

  if (interest === 'franquia') {
    return (
      `Olá, *${firstName}*! 👋\n\n` +
      `Identificamos seu interesse em abrir uma unidade *Laser&Co*` +
      (city ? ` em *${city}*` : '') + `! 🚀\n\n` +
      `A Laser&Co é a *1ª rede de estética a laser do Brasil*, com mais de *70 unidades* em 18 estados e parceria exclusiva com *Anitta*! ✨\n\n` +
      `Você confirma interesse em conhecer nossa proposta de franquia?\n\n` +
      `*1️⃣* Sim, quero saber mais!\n*2️⃣* Não, obrigado.`
    )
  }

  if (interest === 'quanta') {
    return (
      `Olá, *${firstName}*! 👋\n\n` +
      `Recebemos seu interesse na *Quanta Q-Plus EVO* ⚡\n\n` +
      `É o laser Q-Switched mais completo do mercado, com tecnologia *OptiPulse®* exclusiva e *3 comprimentos de onda reais* — o único capaz de remover qualquer cor de tatuagem!\n\n` +
      `Você confirma interesse em receber mais informações?\n\n` +
      `*1️⃣* Sim, quero saber mais!\n*2️⃣* Não, obrigado.`
    )
  }

  if (interest === 'ultracel') {
    return (
      `Olá, *${firstName}*! 👋\n\n` +
      `Recebemos seu interesse no *UltraCel Q+* ✨\n\n` +
      `É o HIFU de nova geração com tecnologia *HIFULL™* exclusiva — o único com transdutor linear do mercado: *300 disparos em 3 minutos*, 3x mais confortável e resultados 2,5x superiores!\n\n` +
      `Você confirma interesse em receber mais informações?\n\n` +
      `*1️⃣* Sim, quero saber mais!\n*2️⃣* Não, obrigado.`
    )
  }

  // Genérico
  return (
    `Olá, *${firstName}*! 👋 Seja bem-vindo à *Laser&Co*! ✨\n\n` +
    `Recebemos seu cadastro e gostaríamos de saber mais sobre o que você procura.\n\n` +
    `Como posso te ajudar?\n\n` +
    `*1️⃣* Quero conhecer a Franquia Laser&Co\n` +
    `*2️⃣* Tenho interesse na Quanta Q-Plus EVO\n` +
    `*3️⃣* Tenho interesse no UltraCel Q+\n` +
    `*4️⃣* Outro assunto`
  )
}

// ── Handler principal ─────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: true, msg: 'lead-capture endpoint' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()

    // Campos esperados da LP / site
    const name     = (body.name     ?? '').trim()
    const phone    = (body.phone    ?? '').replace(/\D/g, '')
    const email    = (body.email    ?? '').trim()
    const city     = (body.city     ?? '').trim()
    const state_br = (body.state    ?? body.state_br ?? '').trim()
    const interest = (body.interest ?? '').toLowerCase().trim() // franquia | quanta | ultracel
    const source   = (body.source   ?? 'landing_page').trim()

    if (!phone) {
      return new Response(JSON.stringify({ ok: false, error: 'phone is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const now = new Date().toISOString()

    // Cria/atualiza lead
    const { data: existingLead } = await sb.from('leads').select('id').eq('phone', phone).maybeSingle()
    const leadId = existingLead?.id || crypto.randomUUID()

    const { data: lead } = await sb.from('leads').upsert({
      id: leadId,
      name: name || phone,
      phone,
      email: email || undefined,
      city: city || undefined,
      status: 'novo_lead',
      temperature: 'morno',
      source,
      updated_at: now,
      ...(existingLead ? {} : { created_at: now }),
    }, { onConflict: 'id' }).select().single()

    // Cria/atualiza conversa WhatsApp
    const { data: existingConv } = await sb.from('wapp_conversations').select('id, status').eq('phone', phone).maybeSingle()

    let convId: string

    if (existingConv) {
      convId = existingConv.id as string
      // Só reinicia bot se a conversa estava fechada/inativa
      if (['fechado', 'done'].includes(existingConv.status as string)) {
        await sb.from('wapp_conversations').update({
          status: 'bot',
          bot_step: 'welcome',
          bot_data: {},
          interest: interest || undefined,
          city: city || undefined,
          state_br: state_br || undefined,
          lead_id: lead?.id || leadId,
          followup_count: 0,
          next_followup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          last_msg_at: now,
        }).eq('id', convId)
      }
    } else {
      const { data: newConv } = await sb.from('wapp_conversations').insert({
        phone,
        name: name || phone,
        status: 'bot',
        bot_step: 'welcome',
        bot_data: {},
        interest: interest || undefined,
        city: city || undefined,
        state_br: state_br || undefined,
        lead_id: lead?.id || leadId,
        followup_count: 0,
        next_followup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        last_msg_at: now,
      }).select().single()
      convId = newConv!.id as string
    }

    // Envia mensagem inicial personalizada
    const welcome = buildWelcome(name, interest, city)
    await sb.from('wapp_messages').insert({
      conv_id: convId,
      direction: 'out',
      body: welcome,
      sent_by: 'bot',
    })
    await sendMsg(phone, welcome)

    // Avança status do lead para msg1 (1ª mensagem enviada)
    await sb.from('leads').update({ status: 'msg1', updated_at: now }).eq('id', leadId)

    return new Response(JSON.stringify({ ok: true, lead_id: leadId, conv_id: convId }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('lead-capture error:', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
