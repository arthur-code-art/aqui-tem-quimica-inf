const fs = require('fs');
const path = require('path');
const https = require('https');

function normalizar(txt) {
  return String(txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function reqHttpsJson(urlStr, method, bodyObj, timeoutMs) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const payload = bodyObj ? JSON.stringify(bodyObj) : null;
    const headers = { 'User-Agent': 'AquiTemQuimicaBot/2.0' };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, json: null }); }
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

async function chamarGemini(apiKey, mensagem, historico, dados, codigoAtual) {
  const resumo = dados.map((s) => {
    const locs = (s.ocorrencias || []).map((o) => `${o.codigo} (${o.zona})`).join(', ');
    return `- ${s.nomeIupac} [${s.formula}] (${s.classe}): ${locs}. ${s.porQueEstaAqui}`;
  }).join('\n');

  const systemText = `Você é o QuímicoBot IA do projeto "AQUI TEM QUÍMICA!" (1º Ano de Informática - UFCIMG). Responda em português de forma clara, simpática e objetiva. Domine as 38 plaquinhas abaixo e também responda qualquer pergunta geral de outras matérias.${codigoAtual ? `\nO usuário está vendo agora a plaquinha ${codigoAtual}.` : ''}\n\nPLAQUINHAS:\n${resumo}`;

  const contents = [];
  if (Array.isArray(historico)) {
    for (const h of historico.slice(-6)) {
      if (!h || !h.texto) continue;
      const role = h.autor === 'bot' ? 'model' : 'user';
      if (contents.length === 0 && role === 'model') continue;
      if (contents.length > 0 && contents[contents.length - 1].role === role) continue;
      contents.push({ role, parts: [{ text: String(h.texto).slice(0, 1000) }] });
    }
  }
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') contents.pop();
  contents.push({ role: 'user', parts: [{ text: String(mensagem).slice(0, 1500) }] });

  const body = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 700 }
  };

  for (const modelo of ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const r = await reqHttpsJson(url, 'POST', body, 18000);
      const txt = r.json && r.json.candidates && r.json.candidates[0] &&
        r.json.candidates[0].content && r.json.candidates[0].content.parts &&
        r.json.candidates[0].content.parts.map((p) => p.text || '').join('').trim();
      if (r.status === 200 && txt) return { resposta: txt, fonte: 'IA Gemini' };
    } catch {}
  }
  return null;
}

async function buscarWiki(pergunta) {
  const termo = String(pergunta || '')
    .replace(/^(o que e|o que são|o que sao|quem foi|quem e|como funciona|me explique|explique|fale sobre|qual e|quais sao)\s+/i, '')
    .replace(/[?!.,;:]+$/g, '')
    .trim();
  if (termo.length < 2) return null;
  try {
    const s = await reqHttpsJson(`https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&utf8=&format=json&srlimit=1`, 'GET', null, 8000);
    const hit = s.json && s.json.query && s.json.query.search && s.json.query.search[0];
    if (!hit || !hit.title) return null;
    const sum = await reqHttpsJson(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`, 'GET', null, 8000);
    if (sum.status === 200 && sum.json && sum.json.extract) {
      return { resposta: `**${sum.json.title}**\n\n${sum.json.extract.slice(0, 680)}`, fonte: 'Wikipédia PT' };
    }
  } catch {}
  return null;
}

async function fallbackLocal(mensagem, dados, codigoAtual) {
  const q = normalizar(mensagem);
  if (/^(oi|ola|e ai|bom dia|boa tarde|boa noite|hey|opa)\b/.test(q) && q.length < 30) {
    return { resposta: 'Olá! 👋 Sou o **QuímicoBot IA**. Posso responder sobre as **38 plaquinhas** da escola, Química e perguntas gerais!', fonte: 'Modo Inteligente' };
  }
  const codMatch = mensagem.match(/INF-G\d{2}-P\d+/i);
  const alvoCod = codMatch ? codMatch[0].toUpperCase() : (codigoAtual && /(essa|esta|aqui|atual|plaquinha|resuma)/.test(q) ? codigoAtual.toUpperCase() : '');
  if (alvoCod) {
    for (const s of dados) {
      const oc = (s.ocorrencias || []).find((o) => String(o.codigo).toUpperCase() === alvoCod);
      if (oc) {
        return { resposta: `🧪 **${oc.codigo} — ${s.nomeIupac} (${s.formula})**\n\n• **Classe:** ${s.classe}\n• **Local:** ${oc.zona} — ${oc.localExato}\n• **Uso:** ${s.porQueEstaAqui}`, fonte: 'Base do Projeto' };
      }
    }
  }
  for (const s of dados) {
    const termos = [s.nomeIupac, s.formula, ...(s.nomesPopulares || [])].map(normalizar).filter((t) => t.length >= 3);
    if (termos.some((t) => q.includes(t))) {
      const locs = (s.ocorrencias || []).map((o) => `${o.codigo} (${o.zona})`).join(', ');
      return { resposta: `🧪 **${s.nomeIupac} (${s.formula})** (${s.classe})\n\n• **Onde está:** ${locs}\n• **Por que está aqui:** ${s.porQueEstaAqui}`, fonte: 'Base do Projeto' };
    }
  }
  const wiki = await buscarWiki(mensagem);
  if (wiki) return wiki;
  return { resposta: 'Posso ajudar com as **38 plaquinhas**, **Química** ou temas gerais (ex.: *"O que é fotossíntese?"* ou *"Fale sobre H2SO4"*).', fonte: 'Modo Inteligente' };
}

module.exports = function registrarQuimicoBotIA(app) {
  const express = require('express');
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/quimicobot-ia/status', (req, res) => {
    const temChave = Boolean((process.env.GEMINI_API_KEY || '').trim());
    res.json({ ok: true, iaAvancada: temChave, modo: temChave ? 'IA Gemini Online' : 'Modo Inteligente + Wikipédia' });
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
      return res.json(await fallbackLocal(mensagem, dados, codigoAtual));
    } catch {
      return res.json({ resposta: 'Tive uma falha rápida ao responder. Tente novamente!', fonte: 'Modo Inteligente' });
    }
  });
};