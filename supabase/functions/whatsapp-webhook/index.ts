import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const ZAPI_INSTANCE     = Deno.env.get('ZAPI_INSTANCE') ?? ''
const ZAPI_TOKEN        = Deno.env.get('ZAPI_TOKEN') ?? ''
const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN') ?? ''
const MANAGER_PHONE     = Deno.env.get('MANAGER_PHONE') ?? ''
const MANAGER_EMAIL     = Deno.env.get('MANAGER_EMAIL') ?? 'rafael@lasercompany.com'
const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY') ?? ''

// ── Envio via Z-API ──────────────────────────────────────────
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

// ── Alerta gestor ─────────────────────────────────────────────
async function alertManager(conv: Record<string, unknown>, userMsg: string) {
  const name     = (conv.name as string) || (conv.phone as string)
  const phone    = conv.phone as string
  const interest = (conv.interest as string) || ''
  const city     = (conv.city as string) || ''
  const step     = (conv.bot_step as string) || ''

  const interestLabel: Record<string, string> = {
    franquia: 'Franquia Laser&Co',
    quanta:   'Quanta Q-Plus EVO',
    ultracel: 'UltraCel Q+',
  }
  const label = interestLabel[interest] || 'Não informado'

  if (MANAGER_PHONE) {
    const wappMsg =
      `🔔 *LEAD RESPONDEU!*\n\n` +
      `👤 *Nome:* ${name}\n` +
      `📱 *Telefone:* ${phone}\n` +
      `🎯 *Interesse:* ${label}` +
      (city ? `\n📍 *Cidade:* ${city}` : '') +
      `\n💬 *Mensagem:* _"${userMsg.substring(0, 200)}"_\n\n` +
      `Etapa atual: *${step}*\n\n` +
      `Acesse o CRM para assumir o atendimento 👉`
    await sendMsg(MANAGER_PHONE, wappMsg)
  }

  if (RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CRM Laser&Co <no-reply@lasercompany.com>',
        to: [MANAGER_EMAIL],
        subject: `🔔 Lead respondeu: ${name} — ${label}`,
        html: `<div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#1d4ed8">🔔 Lead respondeu!</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;font-weight:bold">Nome</td><td style="padding:8px">${name}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:8px;font-weight:bold">Telefone</td><td style="padding:8px">${phone}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Interesse</td><td style="padding:8px">${label}</td></tr>
            ${city ? `<tr style="background:#f8fafc"><td style="padding:8px;font-weight:bold">Cidade</td><td style="padding:8px">${city}</td></tr>` : ''}
            <tr><td style="padding:8px;font-weight:bold">Mensagem</td><td style="padding:8px;color:#6b7280;font-style:italic">"${userMsg.substring(0, 500)}"</td></tr>
            <tr style="background:#f8fafc"><td style="padding:8px;font-weight:bold">Etapa</td><td style="padding:8px">${step}</td></tr>
          </table>
          <p style="margin-top:24px">
            <a href="https://crm-franquias-e-maquinas.vercel.app"
               style="background:#1d4ed8;color:white;padding:12px 24px;border-radius:6px;text-decoration:none">
              Abrir CRM →
            </a>
          </p>
        </div>`,
      }),
    }).catch(() => {})
  }
}

// ── Mensagens do bot ──────────────────────────────────────────
const MSG = {
  welcome_franquia: (name: string, city: string) =>
    `Olá, *${name}*! 👋\n\n` +
    `Identificamos seu interesse em abrir uma unidade *Laser&Co*${city ? ` em *${city}*` : ''}! 🚀\n\n` +
    `A Laser&Co é a *1ª rede de estética a laser do Brasil*, com mais de *70 unidades* em 18 estados e parceria exclusiva com *Anitta*! ✨\n\n` +
    `Posso confirmar que ainda tem interesse em conhecer nossa proposta de franquia?\n\n` +
    `*1️⃣* Sim, quero saber mais!\n*2️⃣* Não, obrigado.`,

  welcome_quanta: (name: string) =>
    `Olá, *${name}*! 👋\n\n` +
    `Recebemos seu interesse na *Quanta Q-Plus EVO* ⚡ — o laser Q-Switched mais completo do mercado!\n\n` +
    `Com tecnologia *OptiPulse®* exclusiva e *3 comprimentos de onda reais*, é o único capaz de remover qualquer cor de tatuagem com resultados superiores.\n\n` +
    `Posso confirmar que ainda tem interesse em receber mais informações?\n\n` +
    `*1️⃣* Sim, quero saber mais!\n*2️⃣* Não, obrigado.`,

  welcome_ultracel: (name: string) =>
    `Olá, *${name}*! 👋\n\n` +
    `Recebemos seu interesse no *UltraCel Q+* ✨ — o HIFU de nova geração com tecnologia *HIFULL™* exclusiva!\n\n` +
    `É o único com transdutor *linear* do mercado: *300 disparos em 3 minutos*, 3x mais confortável e efeitos 2,5x superiores.\n\n` +
    `Posso confirmar que ainda tem interesse em receber mais informações?\n\n` +
    `*1️⃣* Sim, quero saber mais!\n*2️⃣* Não, obrigado.`,

  welcome_generico: (name: string) =>
    `Olá, *${name}*! 👋 Seja bem-vindo à *Laser&Co*! ✨\n\n` +
    `Como posso te ajudar hoje?\n\n` +
    `*1️⃣* Quero conhecer a Franquia Laser&Co\n` +
    `*2️⃣* Tenho interesse na Quanta Q-Plus EVO\n` +
    `*3️⃣* Tenho interesse no UltraCel Q+\n` +
    `*4️⃣* Sou cliente — preciso de suporte`,

  nao_interesse: (name: string) =>
    `Tudo bem, *${name}*! 😊\n\nSe mudar de ideia, estamos por aqui. Tenha um ótimo dia! 🌟`,

  // FRANQUIA
  franquia_modelo: (name: string) =>
    `Ótimo, *${name}*! Vou te apresentar nossa proposta. 🎉\n\n` +
    `Antes, me conta: você *já conhece o modelo de negócio Laser&Co*?\n\n` +
    `*1️⃣* Conheço e já tive/tenho franquia\n` +
    `*2️⃣* Conheço mas nunca tive franquia\n` +
    `*3️⃣* Ainda não conheço bem o modelo`,

  franquia_modelo_resp: (choice: string) => {
    const intro: Record<string, string> = {
      '1': `Ótimo! Sua experiência com franchising é um diferencial enorme! 💼\n\n`,
      '2': `Perfeito! Franquias são um modelo muito seguro para empreender! 🏆\n\n`,
      '3': `Sem problema! A Laser&Co tem um modelo único no Brasil. 🚀\n\n`,
    }
    return (intro[choice] || intro['3']) +
      `📊 *Nosso modelo de negócio:*\n` +
      `✅ +70 unidades em 18 estados\n` +
      `✅ Meta: 500 unidades até 2029\n` +
      `✅ Ticket médio: R$ 600 a R$ 3.000/hora\n` +
      `✅ +50 tipos de tratamento\n` +
      `✅ Parceria exclusiva com Anitta\n\n` +
      `*Investimento:* R$ 290.000 a R$ 360.000\n` +
      `*Retorno estimado:* 12 a 18 meses\n` +
      `*Margem de lucro:* acima de 30%\n` +
      `*Royalties:* 8% sobre o faturamento\n\n` +
      `Para personalizar sua proposta, me conta: *qual é o capital disponível* para investimento?\n\n` +
      `*1️⃣* Até R$ 200.000\n` +
      `*2️⃣* Entre R$ 200.000 e R$ 300.000\n` +
      `*3️⃣* Acima de R$ 300.000`
  },

  franquia_capital: (choice: string, name: string) => {
    const labels: Record<string, string> = {
      '1': 'até R$ 200.000',
      '2': 'entre R$ 200.000 e R$ 300.000',
      '3': 'acima de R$ 300.000',
    }
    return `Entendido, *${name}*! Capital disponível de *${labels[choice] || 'não informado'}*.\n\n` +
      `Você *já atua no setor de estética ou saúde*?\n\n` +
      `*1️⃣* Já atuo no setor\n` +
      `*2️⃣* Tenho empresa em outro segmento\n` +
      `*3️⃣* Será meu primeiro negócio`
  },

  franquia_ponto: (name: string) =>
    `Perfeito, *${name}*! 🎯\n\n` +
    `Última pergunta: qual o *tipo de ponto comercial* que você tem em mente?\n` +
    `(Ex.: Shopping, rua de alto fluxo, clínica médica, galeria comercial)`,

  franquia_done: (name: string, city: string) =>
    `Perfeito, *${name}*! 🎉\n\n` +
    `Registrei seu perfil completo.\n\n` +
    `📋 *Cidade de interesse:* ${city || 'a confirmar'}\n\n` +
    `✅ Nosso *Consultor de Expansão* entrará em contato em até *24 horas úteis* com a proposta completa!\n\n` +
    `Conheça mais em: 🌐 *franquias.lasercompany.com*\n\n` +
    `Alguma dúvida enquanto isso? 😊`,

  // QUANTA
  quanta_conhece: (name: string) =>
    `Ótimo, *${name}*! Vamos lá! ⚡\n\n` +
    `Você *já conhece* ou já teve contato com a *Quanta Q-Plus EVO*?\n\n` +
    `*1️⃣* Já conheço / já usei\n` +
    `*2️⃣* Vi em congressos/feiras\n` +
    `*3️⃣* Ainda não conheço`,

  quanta_specs: () =>
    `⚡ *QUANTA Q-PLUS EVO — Especificações Técnicas*\n\n` +
    `🔬 *Tecnologia:*\n` +
    `• Q-Switched Nd:YAG com OptiPulse® (exclusivo Quanta)\n` +
    `• *3 comprimentos de onda reais* (único no mercado!)\n` +
    `  → 1064nm — tatuagem preta/azul e rejuvenescimento\n` +
    `  → 532nm — lesões vasculares e tatuagens vermelhas\n` +
    `  → 694nm Ruby — tatuagens coloridas (verde/azul)\n\n` +
    `⚙️ *Parâmetros:*\n` +
    `• Energia: até 1.200 mJ\n` +
    `• Pulso: 5–8 ns | Taxa: até 10 Hz | Spot: 2–10 mm\n\n` +
    `🎯 *Tratamentos:*\n` +
    `✅ Remoção de tatuagens (todas as cores)\n` +
    `✅ Manchas, melasma e hiperpigmentação\n` +
    `✅ Rejuvenescimento facial não-ablativo\n` +
    `✅ Lesões vasculares faciais\n` +
    `✅ Cicatrizes de acne\n` +
    `✅ Remoção de micropigmentação\n\n` +
    `💡 *OptiPulse®:* +50% energia, -20% púrpura, resultados acelerados!\n\n` +
    `O que mais te chama atenção nesta tecnologia? 🤔`,

  quanta_atual: (name: string) =>
    `Legal, *${name}*! 😊\n\n` +
    `Você *já tem uma clínica ou studio*? Se sim, quais equipamentos utiliza atualmente?`,

  quanta_done: (name: string) =>
    `Excelente, *${name}*! 🚀\n\n` +
    `Suas informações foram registradas!\n\n` +
    `📅 Nosso especialista entrará em contato em até *24h úteis* para:\n` +
    `✅ Demonstração ao vivo da Quanta Q-Plus EVO\n` +
    `✅ Detalhar o retorno sobre investimento\n` +
    `✅ Apresentar condições e financiamento\n\n` +
    `Até logo! 🎯`,

  // ULTRACEL
  ultracel_conhece: (name: string) =>
    `Ótimo, *${name}*! Vamos lá! ✨\n\n` +
    `Você *já conhece* ou já teve contato com o *UltraCel Q+*?\n\n` +
    `*1️⃣* Já conheço / já usei\n` +
    `*2️⃣* Vi em congressos/feiras\n` +
    `*3️⃣* Ainda não conheço`,

  ultracel_specs: () =>
    `✨ *ULTRACEL Q+ — Especificações Técnicas*\n\n` +
    `🔬 *Tecnologia HIFULL™:*\n` +
    `• Único com transdutor *linear* do mercado\n` +
    `• *300 disparos em 3 minutos* (3x mais rápido)\n` +
    `• 3x mais confortável | Efeito 2,5x superior\n` +
    `• Profundidades: 1,5mm / 3mm / 4,5mm\n\n` +
    `🎯 *Tratamentos:*\n` +
    `✅ Flacidez facial (papada, contorno, pescoço, fronte)\n` +
    `✅ Flacidez corporal (abdômen, braços, flancos, coxas)\n` +
    `✅ Rugas e linhas de expressão\n` +
    `✅ Estimulação profunda de colágeno e elastina\n` +
    `✅ Gordura localizada\n` +
    `✅ Rejuvenescimento íntimo\n` +
    `✅ Lifting não-cirúrgico\n\n` +
    `💡 Aquecimento homogêneo — sem pontos frios! Resultado mais eficaz e seguro.\n\n` +
    `Qual é o foco principal que você tem em mente? 🤔\n\n` +
    `*1️⃣* Principalmente facial\n` +
    `*2️⃣* Principalmente corporal\n` +
    `*3️⃣* Ambos (facial + corporal)`,

  ultracel_atual: (name: string) =>
    `Perfeito, *${name}*! 😊\n\n` +
    `Você *já tem uma clínica ou studio*? Já realiza tratamentos de HIFU ou ultrassom atualmente?`,

  ultracel_done: (name: string) =>
    `Excelente, *${name}*! 🚀\n\n` +
    `Suas informações foram registradas!\n\n` +
    `📅 Nosso especialista entrará em contato em até *24h úteis* para:\n` +
    `✅ Demonstração ao vivo do UltraCel Q+\n` +
    `✅ Casos clínicos reais e resultados\n` +
    `✅ Retorno sobre investimento\n` +
    `✅ Condições especiais\n\n` +
    `Até logo! 🎯`,

  suporte: (name: string) =>
    `Entendido, *${name}*! 👍\n\nVou conectar você com nossa equipe. ⏳ Aguarde um momento!`,

  invalido_binario: `Não entendi 😅 Por favor, responda com *1* (Sim) ou *2* (Não).`,
  invalido_123:     `Não entendi 😅 Por favor, responda com *1*, *2* ou *3*.`,
  invalido_1234:    `Não entendi 😅 Por favor, responda com *1*, *2*, *3* ou *4*.`,
}

// ── Cria/atualiza lead no banco ───────────────────────────────
async function upsertLead(
  conv: Record<string, unknown>,
  extra: Record<string, unknown>
) {
  const phone = conv.phone as string
  const name  = (conv.name as string) || phone

  const { data: existing } = await sb.from('leads').select('id').eq('phone', phone).maybeSingle()
  const now = new Date().toISOString()

  const { data: lead } = await sb.from('leads').upsert({
    id: existing?.id || crypto.randomUUID(),
    name,
    phone,
    status: 'novo_lead',
    temperature: 'morno',
    updated_at: now,
    ...(existing ? {} : { created_at: now }),
    ...extra,
  }, { onConflict: 'id' }).select().single()

  if (lead) {
    await sb.from('wapp_conversations').update({ lead_id: lead.id }).eq('id', conv.id)
  }
}

// ── Máquina de estados ────────────────────────────────────────
async function runBot(conv: Record<string, unknown>, userMsg: string): Promise<void> {
  const phone    = conv.phone as string
  const step     = (conv.bot_step as string) || 'welcome'
  const data     = (conv.bot_data as Record<string, string>) || {}
  const name     = (conv.name as string) || phone
  const interest = (conv.interest as string) || ''
  const city     = (conv.city as string) || ''
  const txt      = userMsg.trim()
  const choice   = txt.replace(/[^1-4]/g, '')

  let nextStep  = step
  let nextData  = { ...data }
  let reply     = ''
  let newStatus: string | null = null
  let notifyMgr = false

  switch (step) {
    // ── Confirmação de interesse vindo de LP ────────────────
    case 'welcome': {
      if (choice === '1') {
        if (interest === 'franquia') {
          reply = MSG.franquia_modelo(name)
          nextStep = 'franquia_modelo'
        } else if (interest === 'quanta') {
          reply = MSG.quanta_conhece(name)
          nextStep = 'quanta_conhece'
        } else if (interest === 'ultracel') {
          reply = MSG.ultracel_conhece(name)
          nextStep = 'ultracel_conhece'
        } else {
          reply = MSG.welcome_generico(name)
          nextStep = 'menu_generico'
        }
      } else if (choice === '2') {
        reply = MSG.nao_interesse(name)
        nextStep = 'done'
        newStatus = 'fechado'
      } else {
        reply = MSG.invalido_binario
      }
      break
    }

    // ── Menu genérico (sem dados da LP) ─────────────────────
    case 'menu_generico': {
      if (choice === '1') {
        reply = MSG.franquia_modelo(name)
        nextStep = 'franquia_modelo'
        nextData.interest = 'franquia'
      } else if (choice === '2') {
        reply = MSG.quanta_conhece(name)
        nextStep = 'quanta_conhece'
        nextData.interest = 'quanta'
      } else if (choice === '3') {
        reply = MSG.ultracel_conhece(name)
        nextStep = 'ultracel_conhece'
        nextData.interest = 'ultracel'
      } else if (choice === '4') {
        reply = MSG.suporte(name)
        nextStep = 'suporte_wait'
        newStatus = 'aguardando'
        notifyMgr = true
      } else {
        reply = MSG.invalido_1234
      }
      break
    }

    // ── FRANQUIA ────────────────────────────────────────────
    case 'franquia_modelo': {
      nextData.franquia_experiencia = choice || '3'
      reply = MSG.franquia_modelo_resp(nextData.franquia_experiencia)
      nextStep = 'franquia_capital'
      break
    }
    case 'franquia_capital': {
      nextData.franquia_capital = choice || '2'
      reply = MSG.franquia_capital(nextData.franquia_capital, name)
      nextStep = 'franquia_negocio'
      break
    }
    case 'franquia_negocio': {
      nextData.franquia_negocio_tipo = choice || '3'
      reply = MSG.franquia_ponto(name)
      nextStep = 'franquia_ponto'
      break
    }
    case 'franquia_ponto': {
      nextData.franquia_ponto = txt.substring(0, 200)
      reply = MSG.franquia_done(name, city)
      nextStep = 'done'
      newStatus = 'aguardando'
      notifyMgr = true
      await upsertLead(conv, {
        city: city || undefined,
        source: 'whatsapp_franquia',
        note: [
          `Franquia: exp=${nextData.franquia_experiencia}`,
          `capital=${nextData.franquia_capital}`,
          `negocio=${nextData.franquia_negocio_tipo}`,
          `ponto="${nextData.franquia_ponto}"`,
        ].join(' | '),
      })
      break
    }

    // ── QUANTA ──────────────────────────────────────────────
    case 'quanta_conhece': {
      nextData.quanta_conhece = choice || '3'
      reply = MSG.quanta_specs()
      nextStep = 'quanta_specs'
      break
    }
    case 'quanta_specs': {
      nextData.quanta_interesse = txt.substring(0, 200)
      reply = MSG.quanta_atual(name)
      nextStep = 'quanta_atual'
      break
    }
    case 'quanta_atual': {
      nextData.quanta_clinica = txt.substring(0, 200)
      reply = MSG.quanta_done(name)
      nextStep = 'done'
      newStatus = 'aguardando'
      notifyMgr = true
      await upsertLead(conv, {
        source: 'whatsapp_quanta',
        note: [
          `Quanta EVO: conhece=${nextData.quanta_conhece}`,
          `interesse="${nextData.quanta_interesse}"`,
          `clínica="${nextData.quanta_clinica}"`,
        ].join(' | '),
      })
      break
    }

    // ── ULTRACEL ────────────────────────────────────────────
    case 'ultracel_conhece': {
      nextData.ultracel_conhece = choice || '3'
      reply = MSG.ultracel_specs()
      nextStep = 'ultracel_specs'
      break
    }
    case 'ultracel_specs': {
      nextData.ultracel_foco = choice || '3'
      reply = MSG.ultracel_atual(name)
      nextStep = 'ultracel_atual'
      break
    }
    case 'ultracel_atual': {
      nextData.ultracel_clinica = txt.substring(0, 200)
      reply = MSG.ultracel_done(name)
      nextStep = 'done'
      newStatus = 'aguardando'
      notifyMgr = true
      await upsertLead(conv, {
        source: 'whatsapp_ultracel',
        note: [
          `UltraCel Q+: conhece=${nextData.ultracel_conhece}`,
          `foco=${nextData.ultracel_foco}`,
          `clínica="${nextData.ultracel_clinica}"`,
        ].join(' | '),
      })
      break
    }

    case 'done':
    case 'suporte_wait':
      return

    default:
      reply = MSG.welcome_generico(name)
      nextStep = 'menu_generico'
  }

  const isTerminal = ['done', 'suporte_wait', 'fechado'].includes(nextStep)
  const nextFollowup = isTerminal
    ? null
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const update: Record<string, unknown> = {
    bot_step: nextStep,
    bot_data: nextData,
    last_msg: userMsg.substring(0, 120),
    last_msg_at: new Date().toISOString(),
    next_followup: nextFollowup,
  }
  if (newStatus) update.status = newStatus
  await sb.from('wapp_conversations').update(update).eq('id', conv.id)

  if (reply) {
    await sb.from('wapp_messages').insert({ conv_id: conv.id, direction: 'out', body: reply, sent_by: 'bot' })
    await sendMsg(phone, reply)
  }

  if (notifyMgr) await alertManager({ ...conv, bot_step: nextStep }, userMsg)
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
    return new Response(JSON.stringify({ ok: true, msg: 'Webhook ativo — Laser&Co CRM' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await req.json()

    const phone    = (payload.phone ?? payload.data?.key?.remoteJid ?? '').replace(/\D/g, '')
    const fromMe   = payload.fromMe ?? payload.data?.key?.fromMe ?? false
    const msgText  =
      payload.text?.message ??
      payload.data?.message?.conversation ??
      payload.data?.message?.extendedTextMessage?.text ??
      ''
    const pushName = payload.pushName ?? payload.data?.pushName ?? ''
    const isGroup  = payload.isGroupMsg ?? payload.data?.key?.remoteJid?.includes('@g.us') ?? false

    if (!phone || !msgText || fromMe || isGroup) {
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    let { data: conv } = await sb
      .from('wapp_conversations')
      .select('*')
      .eq('phone', phone)
      .maybeSingle()

    const isNew = !conv
    if (isNew) {
      const { data: created } = await sb
        .from('wapp_conversations')
        .insert({
          phone,
          name: pushName || phone,
          status: 'bot',
          bot_step: 'menu_generico',
          last_msg: msgText.substring(0, 120),
          last_msg_at: new Date().toISOString(),
          followup_count: 0,
        })
        .select()
        .single()
      conv = created
    } else {
      await sb.from('wapp_conversations').update({
        unread: ((conv?.unread ?? 0) + 1),
        last_msg: msgText.substring(0, 120),
        last_msg_at: new Date().toISOString(),
        ...(pushName && !conv?.name ? { name: pushName } : {}),
      }).eq('id', conv!.id)
    }

    await sb.from('wapp_messages').insert({
      conv_id: conv!.id,
      direction: 'in',
      body: msgText,
      sent_by: 'user',
    })

    const currentStatus = isNew ? 'bot' : conv!.status

    if (currentStatus === 'bot') {
      if (isNew) {
        const welcome = MSG.welcome_generico(pushName || 'Olá')
        await sb.from('wapp_messages').insert({ conv_id: conv!.id, direction: 'out', body: welcome, sent_by: 'bot' })
        await sendMsg(phone, welcome)
        await sb.from('wapp_conversations').update({
          bot_step: 'menu_generico',
          next_followup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }).eq('id', conv!.id)
      } else {
        await runBot(conv!, msgText)
      }
    } else if (currentStatus === 'aguardando') {
      // Lead aguardando humano e mandou nova mensagem → re-alerta o gestor
      await alertManager(conv!, msgText)
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
