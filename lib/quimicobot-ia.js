const fs = require('fs');
const path = require('path');
const https = require('https');

function normalizar(txt) {
  return String(txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function httpsJson(urlStr, method, headers, bodyObj, timeoutMs) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const payload = bodyObj ? JSON.stringify(bodyObj) : null;
    const reqHeaders = Object.assign({ 'User-Agent': 'AquiTemQuimicaBot/1.2' }, headers || {});
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: method || 'GET',
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(data), raw: data }); }
        catch { resolve({ status: res.statusCode, json: null, raw: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs || 15000, () => { req.destroy(); reject(new Error('timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

function carregarDados() {
  const p = path.join(process.cwd(), 'data', 'substancias.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function montarContextoProjeto(dados, codigoAtual) {
  const resumoSubs = dados.map((s) => {
    const locs = (s.ocorrencias || []).map((o) => `${o.codigo} (${o.zona}: ${o.localExato})`).join('; ');
    return `- ${s.nomeIupac} [${s.formula}] | Classe: ${s.classe} (${s.subtipo || ''}) | pH~${s.phEstimado ?? 7} | Locais: ${locs} | Uso: ${s.porQueEstaAqui}`;
  }).join('\n');

  let destaque = '';
  if (codigoAtual) {
    for (const s of dados) {
      const oc = (s.ocorrencias || []).find((o) => String(o.codigo).toUpperCase() === codigoAtual.toUpperCase());
      if (oc) {
        destaque = `\nCONTEXTO ATUAL: O usuario esta na plaquinha ${oc.codigo} em "${oc.zona}" (${oc.localExato}) sobre ${s.nomeIupac} (${s.formula}, ${s.classe}).`;
        break;
      }
    }
  }

  return `Você é o QuímicoBot IA, assistente inteligente do projeto escolar "AQUI TEM QUÍMICA!" do 1º Ano de Informática.
Responda sempre em português do Brasil, de forma clara, simpática e objetiva.
Você domina as 38 plaquinhas (25 substâncias) do projeto e também responde perguntas de química geral, outras matérias e temas gerais.
Em misturas perigosas (água sanitária com vinagre, ácidos ou amônia), alerte sempre sobre gases tóxicos.
${destaque}

DADOS DO PROJETO:
${resumoSubs}`;
}

async function chamarGemini(apiKey, mensagem, historico, dados, codigoAtual) {
  const systemText = montarContextoProjeto(dados, codigoAtual);
  const contents = [];

  if (Array.isArray(historico)) {
    for (const item of historico.slice(-8)) {
      if (!item || !item.texto) continue;
      const role = item.autor === 'bot' ? 'model' : 'user';
      if (contents.length === 0 && role === 'model') continue;
      if (contents.length > 0 && contents[contents.length - 1].role === role) continue;
      contents.push({ role, parts: [{ text: String(item.texto).slice(0, 1200) }] });
    }
  }
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents.pop();
  }
  contents.push({ role: 'user', parts: [{ text: String(mensagem).slice(0, 1500) }] });

  const body = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 700 }
  };

  for (const modelo of ['gemini-2.5-flash', 'gemini-2.0-flash']) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const r = await httpsJson(url, 'POST', {}, body, 18000);
      const txt = r.json && r.json.candidates && r.json.candidates[0] &&
        r.json.candidates[0].content && r.json.candidates[0].content.parts &&
        r.json.candidates[0].content.parts.map((p) => p.text || '').join('').trim();
      if (r.status === 200 && txt) {
        return { resposta: txt, fonte: 'IA Gemini' };
      }
    } catch {}
  }
  return null;
}

async function buscarWikipediaPt(pergunta) {
  const limpo = String(pergunta || '')
    .replace(/^(o que e|o que são|o que sao|quem foi|quem e|como funciona|me explique|explique|fale sobre|me diga sobre|qual e|quais sao|defina|significado de)\s+/i, '')
    .replace(/[?!.,;:]+$/g, '')
    .trim();
  if (limpo.length < 2) return null;

  try {
    const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(limpo)}&utf8=&format=json&srlimit=1`;
    const sRes = await httpsJson(searchUrl, 'GET', {}, null, 8000);
    const hit = sRes.json && sRes.json.query && sRes.json.query.search && sRes.json.query.search[0];
    if (!hit || !hit.title) return null;

    const sumUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`;
    const sumRes = await httpsJson(sumUrl, 'GET', {}, null, 8000);
    if (sumRes.status === 200 && sumRes.json && sumRes.json.extract) {
      return {
        resposta: `**${sumRes.json.title}**\n\n${sumRes.json.extract.slice(0, 680)}`,
        fonte: 'Wikipédia PT'
      };
    }
  } catch {}
  return null;
}

async function respostaInteligenteLocal(mensagem, dados, codigoAtual) {
  const q = normalizar(mensagem);

  if (/^(oi|ola|e ai|bom dia|boa tarde|boa noite|hey|opa)\b/.test(q) && q.length < 30) {
    return {
      resposta: 'Olá! 👋 Eu sou o **QuímicoBot IA**. Posso ajudar com as **38 plaquinhas** do campus, conceitos de Química e perguntas gerais de outras matérias. O que você manda?',
      fonte: 'Modo Inteligente'
    };
  }

  const calcMatch = mensagem.match(/(?:quanto\s+[eé]\s+|calcule\s+)?(-?\d+(?:[.,]\d+)?)\s*([+\-*/x×^])\s*(-?\d+(?:[.,]\d+)?)/i);
  if (calcMatch && q.length < 45) {
    const a = parseFloat(calcMatch[1].replace(',', '.'));
    const op = calcMatch[2].toLowerCase();
    const b = parseFloat(calcMatch[3].replace(',', '.'));
    let res = null;
    if (op === '+') res = a + b;
    else if (op === '-') res = a - b;
    else if (op === '*' || op === 'x' || op === '×') res = a * b;
    else if (op === '/' && b !== 0) res = a / b;
    else if (op === '^') res = Math.pow(a, b);
    if (res !== null && Number.isFinite(res)) {
      return { resposta: `🧮 **${calcMatch[1]} ${calcMatch[2]} ${calcMatch[3]} = ${Number(res.toFixed(6))}**`, fonte: 'Calculadora' };
    }
  }

  if ((q.includes('agua sanitaria') || q.includes('hipoclorito') || q.includes('naclo')) && (q.includes('vinagre') || q.includes('amonia') || q.includes('acido') || q.includes('misturar'))) {
    return {
      resposta: '⚠️ **Nunca misture água sanitária (NaClO) com outros produtos!**\n\n• Com **vinagre ou ácidos**: libera **gás cloro (Cl₂)**, tóxico e irritante.\n• Com **amônia / limpa-vidros (NH₄OH)**: libera **cloraminas**, prejudiciais aos olhos e pulmões.',
      fonte: 'Segurança Química'
    };
  }

  if (codigoAtual && /(essa|esta|aqui|atual|plaquinha|resuma|explique essa)/.test(q)) {
    for (const s of dados) {
      const oc = (s.ocorrencias || []).find((o) => String(o.codigo).toUpperCase() === codigoAtual.toUpperCase());
      if (oc) {
        return {
          resposta: `🧪 **${oc.codigo} — ${s.nomeIupac} (${s.formula})**\n\n• **Classe:** ${s.classe}\n• **Local:** ${oc.zona} — ${oc.localExato}\n• **Por que está aqui:** ${s.porQueEstaAqui}\n• **Curiosidade:** ${s.curiosidade}`,
          fonte: 'Ficha do Campus'
        };
      }
    }
  }

  const codMatch = mensagem.match(/INF-G\d{2}-P\d+/i);
  if (codMatch) {
    const cod = codMatch[0].toUpperCase();
    for (const s of dados) {
      const oc = (s.ocorrencias || []).find((o) => String(o.codigo).toUpperCase() === cod);
      if (oc) {
        return {
          resposta: `📍 **${oc.codigo}** fica em **${oc.zona}** (${oc.localExato}) — **${s.nomeIupac} (${s.formula})**, classe **${s.classe}**. ${s.porQueEstaAqui}`,
          fonte: 'Base do Projeto'
        };
      }
    }
  }

  for (const s of dados) {
    const termos = [s.nomeIupac, s.formula, ...(s.nomesPopulares || [])].map(normalizar).filter((t) => t.length >= 3);
    if (termos.some((t) => q.includes(t))) {
      const locs = (s.ocorrencias || []).map((o) => `${o.codigo} (${o.zona})`).join(', ');
      return {
        resposta: `🧪 **${s.nomeIupac} (${s.formula})** — **${s.classe}**\n\n• **Classificação:** ${s.justificativa}\n• **Onde está:** ${locs}\n• **Uso:** ${s.porQueEstaAqui}`,
        fonte: 'Base do Projeto'
      };
    }
  }

  const zonas = [...new Set(dados.flatMap((s) => (s.ocorrencias || []).map((o) => o.zona)))];
  for (const z of zonas) {
    if (q.includes(normalizar(z))) {
      const itens = [];
      dados.forEach((s) => (s.ocorrencias || []).forEach((o) => {
        if (o.zona === z) itens.push(`• **${o.codigo}**: ${s.nomeIupac} (${s.formula}) — ${o.localExato}`);
      }));
      return { resposta: `📍 **Plaquinhas em ${z}:**\n\n${itens.join('\n')}`, fonte: 'Mapa do Campus' };
    }
  }

  const wiki = await buscarWikipediaPt(mensagem);
  if (wiki) return wiki;

  return {
    resposta: 'Posso te ajudar com dúvidas sobre as **38 plaquinhas**, **Química** ou qualquer tema geral (ex.: *"O que é osmose?"*, *"Explique H2SO4"* ou *"Plaquinhas da Portaria"*).',
    fonte: 'Modo Inteligente'
  };
}

function registrarQuimicoBotIA(app) {
  const express = require('express');
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/quimicobot-ia/status', (req, res) => {
    const temChave = Boolean((process.env.GEMINI_API_KEY || '').trim());
    res.json({
      ok: true,
      iaAvancada: temChave,
      modo: temChave ? 'IA Gemini Online' : 'Modo Inteligente + Wikipédia'
    });
  });

  app.post('/api/quimicobot-ia', async (req, res) => {
    try {
      const mensagem = String((req.body && req.body.mensagem) || '').trim();
      const historico = (req.body && req.body.historico) || [];
      const codigoAtual = String((req.body && req.body.codigoAtual) || '').trim();
      if (!mensagem) return res.status(400).json({ erro: 'Digite uma pergunta.' });

      const dados = carregarDados();
      const apiKey = (process.env.GEMINI_API_KEY || '').trim();

      if (apiKey) {
        const ia = await chamarGemini(apiKey, mensagem, historico, dados, codigoAtual);
        if (ia) return res.json(ia);
      }

      const local = await respostaInteligenteLocal(mensagem, dados, codigoAtual);
      return res.json(local);
    } catch {
      return res.json({
        resposta: 'Tive um soluço temporário ao responder. Tente perguntar novamente!',
        fonte: 'Modo Inteligente'
      });
    }
  });
}

module.exports = registrarQuimicoBotIA;

if (require.main === module) {
  (async () => {
    const dados = carregarDados();
    console.log('Substancias carregadas:', dados.length);
    const teste = await respostaInteligenteLocal('O que e fotossintese?', dados, '');
    console.log('Teste de resposta:', teste.fonte, '->', teste.resposta.slice(0, 100).replace(/\n/g, ' ') + '...');
  })();
}