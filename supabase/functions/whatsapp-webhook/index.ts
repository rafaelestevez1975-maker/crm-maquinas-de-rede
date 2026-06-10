import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// ── Z-API config ────────────────────────────────────────────
const ZAPI_INSTANCE   = Deno.env.get('ZAPI_INSTANCE') ?? ''
const ZAPI_TOKEN      = Deno.env.get('ZAPI_TOKEN') ?? ''
const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN') ?? ''

async function sendMsg(phone: string, msg: string) {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN) return
  await fetch(
    `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': ZAPI_CLIENT_TOKEN,
      },
      body: JSON.stringify({ phone, message: msg }),
    }
  )
}

// ── Bot messages ────────────────────────────────────────────
const MSG = {
  welcome: `Olá! 👋 Seja bem-vindo à *Laser&Co*! ✨

Somos especialistas em tratamentos estéticos a laser e ultrassom de alta tecnologia.

Como posso te ajudar hoje?

*1️⃣* Quero conhecer a *Franquia Laser&Co*
*2️⃣* Tenho interesse na *Quanta Qplus EVO*
*3️⃣* Tenho interesse no *UltraCel Q+*
*4️⃣* Sou cliente — preciso de *suporte*

Responda com o número da opção 😊`,

  invalid: `Não entendi sua resposta 😅\nPor favor, responda com *1*, *2*, *3* ou *4*:

*1️⃣* Franquia Laser&Co
*2️⃣* Quanta Qplus EVO
*3️⃣* UltraCel Q+
*4️⃣* Suporte`,

  // ── FRANQUIA ───────────────────────────────────────────────
  franquia_intro: `🚀 *Excelente escolha!*

A *Laser&Co* é a *1ª rede de estética a laser do Brasil* com mais de *50 tipos de tratamentos*!

📊 *Por que investir?*
✅ +70 unidades em 18 estados
✅ Meta: 500 unidades até 2029
✅ Parceria com Anitta e equipamentos exclusivos
✅ Ticket médio: R$ 600 a R$ 3.000/hora

💰 *Modelo de negócio:*
• Investimento total: R$ 290.000 a R$ 360.000
• Retorno do investimento: 12 a 18 meses
• Margem de lucro: +30%
• Faturamento estimado: R$ 1,5M a R$ 3M/ano

🏆 *Serviços exclusivos:*
Laser para manchas, tatuagens, rejuvenescimento, remoção de micropigmentação, ultrassom HIFU, body contouring e muito mais!

Para personalizar sua proposta, me diz: *em qual cidade você pretende abrir sua unidade?* 🗺️`,

  franquia_nome: (city: string) =>
    `Ótimo! *${city}* tem um potencial enorme para a Laser&Co! 🎯\n\nMe diz: *qual é o seu nome completo?* 📝`,

  franquia_converted: (name: string, city: string) =>
    `Perfeito, *${name}*! 🎉\n\nVocê foi registrado como interessado em abrir uma unidade em *${city}*.\n\n✅ Nosso consultor de expansão vai entrar em contato em até *24 horas úteis*!\n\nEnquanto isso, conheça mais em:\n👉 franquias.lasercompany.com\n\nFicou com alguma dúvida? Pode me perguntar! 😊`,

  // ── QUANTA ────────────────────────────────────────────────
  quanta_info: `⚡ *Quanta Q-Plus EVO* — o laser mais completo do mercado!

🔬 *Especificações Técnicas:*
• 3 comprimentos de onda reais (único no mercado!)
  → 1064nm (remoção de tatuagem preta/azul)
  → 532nm (lesões vasculares e pigmentadas)
  → 694nm Ruby (tatuagens coloridas)
• Taxa de repetição: até 10Hz (uma das mais rápidas)
• 7 configurações disponíveis para máxima versatilidade
• Tecnologia OptiPulse® exclusiva

🎯 *Tratamentos:*
✅ Remoção de tatuagens multicoloridas
✅ Manchas, melasma e hiperpigmentação
✅ Rejuvenescimento facial
✅ Lesões vasculares
✅ Remoção de pelos permanente
✅ Cicatrizes de acne
✅ Tonificação não-ablativa (lunchtime laser)

💡 *Diferencial exclusivo:* OptiPulse® aumenta energia em 50% e reduz púrpura em 20%, acelerando os resultados!

Para agendar uma *demonstração gratuita*, me diz: *qual é o seu nome?* 👇`,

  quanta_email: (name: string) =>
    `Obrigado, *${name}*! 😊\n\nPara agendar sua demonstração, me informa seu *e-mail* ou *cidade*:`,

  quanta_converted: (name: string) =>
    `Perfeito, *${name}*! ✅\n\nSua solicitação de demonstração da *Quanta Q-Plus EVO* foi registrada!\n\nNosso especialista vai entrar em contato em até *24 horas úteis* para agendar a demonstração.\n\nAté logo! 🚀`,

  // ── ULTRACEL ──────────────────────────────────────────────
  ultracel_info: `✨ *UltraCel Q+* — HIFU de nova geração!

🔬 *Especificações Técnicas:*
• Tecnologia *HIFULL™* (Linear Length)
• Único com transdutor *linear* do mercado
• 300 disparos em apenas *3 minutos* (3x mais rápido)
• 3x mais confortável para o paciente
• Efeito até 2,5x superior a alternativas

🎯 *Tratamentos:*
✅ Flacidez facial (papada, contorno, pescoço)
✅ Flacidez corporal (abdômen, braços, flancos)
✅ Rugas e linhas de expressão
✅ Estimulação de colágeno profundo
✅ Gordura localizada
✅ Rejuvenescimento íntimo
✅ Lifting não-cirúrgico

💡 *Diferencial exclusivo:* O transdutor linear aquece de forma homogênea toda a área tratada, sem pontos frios — resultado mais eficaz e seguro!

Para agendar uma *demonstração gratuita*, me diz: *qual é o seu nome?* 👇`,

  ultracel_email: (name: string) =>
    `Obrigado, *${name}*! 😊\n\nPara agendar sua demonstração do *UltraCel Q+*, me informa seu *e-mail* ou *cidade*:`,

  ultracel_converted: (name: string) =>
    `Perfeito, *${name}*! ✅\n\nSua solicitação de demonstração do *UltraCel Q+* foi registrada!\n\nNosso especialista entra em contato em até *24 horas úteis*.\n\nAté logo! 🚀`,

  // ── SUPORTE ───────────────────────────────────────────────
  suporte: `Entendido! 👍\n\nVou conectar você a um de nossos atendentes agora mesmo.\n\n⏳ *Aguarde um momento* — em breve alguém irá te atender!\n\nSe preferir, ligue diretamente: 📞 (11) 3456-7890`,
}

// ── Bot step machine ────────────────────────────────────────
async function runBot(conv: Record<string, unknown>, userMsg: string): Promise<void> {
  const phone = conv.phone as string
  const step  = (conv.bot_step as string) || 'welcome'
  const data  = (conv.bot_data as Record<string, string>) || {}
  const txt   = userMsg.trim()

  let nextStep = step
  let nextData = { ...data }
  let reply    = ''
  let newStatus: string | null = null

  switch (step) {
    case 'welcome': {
      const choice = txt.replace(/[^1-4]/g, '')
      if (choice === '1') { reply = MSG.franquia_intro; nextStep = 'franquia_cidade' }
      else if (choice === '2') { reply = MSG.quanta_info; nextStep = 'quanta_nome' }
      else if (choice === '3') { reply = MSG.ultracel_info; nextStep = 'ultracel_nome' }
      else if (choice === '4') { reply = MSG.suporte; nextStep = 'suporte_wait'; newStatus = 'aguardando' }
      else { reply = MSG.invalid }
      break
    }
    case 'franquia_cidade': {
      nextData.city = txt
      reply = MSG.franquia_nome(txt)
      nextStep = 'franquia_nome'
      break
    }
    case 'franquia_nome': {
      nextData.name = txt
      reply = MSG.franquia_converted(txt, nextData.city || '')
      nextStep = 'done'
      newStatus = 'aguardando'
      // Cria lead no banco
      await sb.from('leads').upsert({
        id: crypto.randomUUID(),
        name: txt,
        phone,
        note: `Interesse em franquia — cidade: ${nextData.city || '?'}`,
        equip: null,
        status: 'novo',
        source: 'whatsapp_franquia',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      break
    }
    case 'quanta_nome': {
      nextData.name = txt
      reply = MSG.quanta_email(txt)
      nextStep = 'quanta_email'
      break
    }
    case 'quanta_email': {
      nextData.email = txt
      reply = MSG.quanta_converted(nextData.name || txt)
      nextStep = 'done'
      newStatus = 'aguardando'
      await sb.from('leads').upsert({
        id: crypto.randomUUID(),
        name: nextData.name || phone,
        phone,
        email: txt.includes('@') ? txt : '',
        note: `Interesse em Quanta Qplus EVO — contato: ${txt}`,
        equip: null,
        status: 'novo',
        source: 'whatsapp_quanta',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      break
    }
    case 'ultracel_nome': {
      nextData.name = txt
      reply = MSG.ultracel_email(txt)
      nextStep = 'ultracel_email'
      break
    }
    case 'ultracel_email': {
      nextData.email = txt
      reply = MSG.ultracel_converted(nextData.name || txt)
      nextStep = 'done'
      newStatus = 'aguardando'
      await sb.from('leads').upsert({
        id: crypto.randomUUID(),
        name: nextData.name || phone,
        phone,
        email: txt.includes('@') ? txt : '',
        note: `Interesse em UltraCel Q+ — contato: ${txt}`,
        equip: null,
        status: 'novo',
        source: 'whatsapp_ultracel',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      break
    }
    case 'done':
    case 'suporte_wait': {
      // Conversa já está com humano — não responde pelo bot
      return
    }
    default:
      reply = MSG.welcome
      nextStep = 'welcome'
  }

  // Atualiza conversa
  const update: Record<string, unknown> = {
    bot_step: nextStep,
    bot_data: nextData,
    last_msg: userMsg.substring(0, 120),
    last_msg_at: new Date().toISOString(),
  }
  if (newStatus) update.status = newStatus

  await sb.from('wapp_conversations').update(update).eq('id', conv.id)

  // Salva resposta do bot
  if (reply) {
    await sb.from('wapp_messages').insert({
      conv_id: conv.id,
      direction: 'out',
      body: reply,
      sent_by: 'bot',
    })
    // Envia via Z-API
    await sendMsg(phone, reply)
  }
}

// ── Main handler ────────────────────────────────────────────
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
    return new Response(JSON.stringify({ ok: true, msg: 'Webhook ativo' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await req.json()

    // Suporte a Z-API e Evolution API
    const phone =
      (payload.phone ?? payload.data?.key?.remoteJid ?? '').replace(/\D/g, '')
    const fromMe =
      payload.fromMe ?? payload.data?.key?.fromMe ?? false
    const msgText =
      payload.text?.message ??
      payload.data?.message?.conversation ??
      payload.data?.message?.extendedTextMessage?.text ??
      ''
    const pushName =
      payload.pushName ?? payload.data?.pushName ?? ''
    const isGroup =
      payload.isGroupMsg ?? payload.data?.key?.remoteJid?.includes('@g.us') ?? false

    // Ignora grupos e mensagens enviadas pelo próprio número
    if (!phone || !msgText || fromMe || isGroup) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Busca ou cria conversa
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
          bot_step: 'welcome',
          last_msg: msgText.substring(0, 120),
          last_msg_at: new Date().toISOString(),
        })
        .select()
        .single()
      conv = created
    } else {
      await sb.from('wapp_conversations').update({
        unread: (conv.unread ?? 0) + 1,
        last_msg: msgText.substring(0, 120),
        last_msg_at: new Date().toISOString(),
        ...(pushName && !conv.name ? { name: pushName } : {}),
      }).eq('id', conv.id)
    }

    // Salva mensagem recebida
    await sb.from('wapp_messages').insert({
      conv_id: conv.id,
      direction: 'in',
      body: msgText,
      sent_by: 'user',
    })

    // Roda bot se status ainda for 'bot'
    const currentStatus = isNew ? 'bot' : conv.status
    if (currentStatus === 'bot') {
      // Se for nova conversa, envia welcome primeiro, depois processa escolha
      if (isNew) {
        await sb.from('wapp_messages').insert({
          conv_id: conv.id,
          direction: 'out',
          body: MSG.welcome,
          sent_by: 'bot',
        })
        await sendMsg(phone, MSG.welcome)
      } else {
        await runBot(conv, msgText)
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
