const fs = require('fs');
const path = require('path');
const https = require('https');

function normalizar(txt) {
  return String(txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function httpsJson(urlStr, method, headers, bodyObj, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const payload = bodyObj ? JSON.stringify(bodyObj) : null;
    const reqHeaders = Object.assign({ 'User-Agent': 'AquiTemQuimicaBot/1.0 (Projeto Escolar UFCIMG)' }, headers || {});
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
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, json: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

function carregarDados() {
  const p = path.join(process.cwd(), 'data', 'substancias.json');
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
        destaque = `\nCONTEXTO DA PAGINA ATUAL DO USUARIO: Ele esta vendo a plaquinha ${oc.codigo} em "${oc.zona}" (${oc.localExato}) sobre ${s.nomeIupac} (${s.formula}, ${s.classe}).`;
        break;
      }
    }
  }

  return `Você é o QuímicoBot IA, assistente inteligente do projeto escolar "AQUI TEM QUÍMICA!" do 1º Ano de Informática (UFCIMG).
Regras de comportamento:
1. Responda em português do Brasil, de forma clara, simpática, didática e objetiva (use negrito e tópicos curtos quando ajudar).
2. Você domina completamente as 38 plaquinhas (25 substâncias diferentes) do projeto abaixo e TAMBÉM pode responder perguntas sobre qualquer outro assunto (química geral, física, matemática, biologia, programação, história, curiosidades, dicas de estudo etc.).
3. Em dúvidas sobre segurança (como misturar água sanitária com vinagre ou amônia), sempre alerte claramente sobre o risco.
4. Site desenvolvido pelos líderes Arthur Santos Pereira e Augusto Maciel Tomaz; Coordenação/Mapa: Davi Silva Vilaça e Otavio Graciano Veiga de Morais; Revisão técnica: Miria Emanuela Marques Ferreira e Lara Salvador Alves da Silva; Identidade visual: Marcos Túlio Lopes Costa e Tiago Resende Araújo.
${destaque}

DADOS OFICIAIS DAS 25 SUBSTÂNCIAS / 38 PLAQUINHAS DO CAMPUS:
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

  const modelos = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  for (const modelo of modelos) {
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
      const texto = sumRes.json.extract.slice(0, 680);
      return {
        resposta: `**${sumRes.json.title}**\n\n${texto}\n\n💡 _Se quiser uma explicação mais aprofundada sobre esse tema ou relacioná-lo às plaquinhas da escola, pode perguntar!_`,
        fonte: 'Wikipédia PT'
      };
    }
  } catch {}
  return null;
}

async function respostaInteligenteLocal(mensagem, dados, codigoAtual) {
  const q = normalizar(mensagem);

  // 1. Cumprimentos
  if (/^(oi|ola|e ai|bom dia|boa tarde|boa noite|hey|opa)\b/.test(q) && q.length < 30) {
    return {
      resposta: 'Olá! 👋 Eu sou o **QuímicoBot IA**. Posso tirar dúvidas sobre qualquer uma das **38 plaquinhas** do campus, explicar conceitos de Química (ácidos, bases, sais, óxidos, pH) e pesquisar perguntas gerais de outras matérias. O que você quer saber?',
      fonte: 'QuímicoBot'
    };
  }

  // 2. Calculadora simples (ex: "quanto e 12 * 8" ou "25 + 17")
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
      return { resposta: `🧮 O resultado de **${calcMatch[1]} ${calcMatch[2]} ${calcMatch[3]}** é **${Number(res.toFixed(6))}**.`, fonte: 'Calculadora' };
    }
  }

  // 3. Misturas perigosas / seguranca
  if ((q.includes('agua sanitaria') || q.includes('hipoclorito') || q.includes('naclo')) && (q.includes('vinagre') || q.includes('amonia') || q.includes('acido') || q.includes('misturar'))) {
    return {
      resposta: '⚠️ **Atenção — Nunca misture água sanitária (NaClO) com outros produtos!**\n\n• Com **vinagre ou ácidos**: libera **gás cloro (Cl₂)**, altamente tóxico e corrosivo.\n• Com **amônia / limpa-vidros (NH₄OH)**: forma **cloraminas**, gases que atacam olhos e pulmões.\n\nUse sempre diluída apenas em água limpa e em local ventilado.',
      fonte: 'Segurança Química'
    };
  }

  // 4. Pergunta sobre a plaquinha atual
  if (codigoAtual && /(essa|esta|aqui|atual|plaquinha|resuma|explique essa)/.test(q)) {
    for (const s of dados) {
      const oc = (s.ocorrencias || []).find((o) => String(o.codigo).toUpperCase() === codigoAtual.toUpperCase());
      if (oc) {
        return {
          resposta: `🧪 **${oc.codigo} — ${s.nomeIupac} (${s.formula})**\n\n• **Classe:** ${s.classe} (${s.subtipo || ''})\n• **Local:** ${oc.zona} — ${oc.localExato}\n• **Por que está aqui:** ${s.porQueEstaAqui}\n• **Curiosidade:** ${s.curiosidade}`,
          fonte: 'Ficha do Campus'
        };
      }
    }
  }

  // 5. Busca por codigo especifico (INF-G01-P1)
  const codMatch = mensagem.match(/INF-G\d{2}-P\d+/i);
  if (codMatch) {
    const cod = codMatch[0].toUpperCase();
    for (const s of dados) {
      const oc = (s.ocorrencias || []).find((o) => String(o.codigo).toUpperCase() === cod);
      if (oc) {
        return {
          resposta: `📍 **${oc.codigo}** fica em **${oc.zona}** (${oc.localExato}).\n\n• **Substância:** ${s.nomeIupac} (**${s.formula}**)\n• **Classe:** ${s.classe}\n• **Em ação:** ${s.porQueEstaAqui}\n• **Grupo responsável:** ${oc.grupo}`,
          fonte: 'Base do Projeto'
        };
      }
    }
  }

  // 6. Busca por substancia ou formula cadastrada
  for (const s of dados) {
    const termos = [s.nomeIupac, s.formula, ...(s.nomesPopulares || [])].map(normalizar).filter((t) => t.length >= 3);
    if (termos.some((t) => q.includes(t))) {
      const locs = (s.ocorrencias || []).map((o) => `${o.codigo} (${o.zona})`).join(', ');
      return {
        resposta: `🧪 **${s.nomeIupac} (${s.formula})** — **${s.classe}**\n\n• **Classificação:** ${s.justificativa}\n• **Onde está na escola:** ${locs}\n• **Aplicação:** ${s.porQueEstaAqui}\n• **Curiosidade:** ${s.curiosidade}`,
        fonte: 'Base do Projeto'
      };
    }
  }

  // 7. Busca por zona da escola
  const zonas = [...new Set(dados.flatMap((s) => (s.ocorrencias || []).map((o) => o.zona)))];
  for (const z of zonas) {
    const zn = normalizar(z);
    if (q.includes(zn) || (zn.includes('informatica') && q.includes('laboratorio')) || (zn.includes('banheiro') && q.includes('banheiro'))) {
      const itens = [];
      dados.forEach((s) => (s.ocorrencias || []).forEach((o) => {
        if (o.zona === z) itens.push(`• **${o.codigo}**: ${s.nomeIupac} (${s.formula}) — ${o.localExato}`);
      }));
      return {
        resposta: `📍 **Plaquinhas em ${z} (${itens.length}):**\n\n${itens.join('\n')}`,
        fonte: 'Mapa do Campus'
      };
    }
  }

  // 8. Conceitos fundamentais de Quimica
  if (q.includes('diferenca') && (q.includes('acido') || q.includes('base') || q.includes('sal') || q.includes('oxido'))) {
    return {
      resposta: '📚 **Resumo das 4 Funções Inorgânicas (Arrhenius):**\n\n• **Ácidos:** liberam **H⁺ (H₃O⁺)** como único cátion em água (pH < 7). Ex: H₂SO₄, ácido cítrico.\n• **Bases:** liberam **OH⁻** como único ânion em água (pH > 7). Ex: NaOH, Ca(OH)₂.\n• **Sais:** compostos iônicos com cátion ≠ H⁺ e ânion ≠ OH⁻. Ex: NaCl, NaHCO₃.\n• **Óxidos:** compostos binários (2 elementos) onde o **oxigênio** é o mais eletronegativo. Ex: H₂O, CO₂, TiO₂, Fe₂O₃.',
      fonte: 'Conceitos de Química'
    };
  }
  if (q.includes('ph') && (q.includes('o que') || q.includes('escala') || q.includes('como'))) {
    return {
      resposta: '🌈 **Escala de pH (0 a 14):** mede o grau de acidez ou basicidade de uma solução aquosa.\n\n• **pH < 7:** meio ácido (quanto menor, mais ácido — ex.: H₂SO₄ ≈ 0,5).\n• **pH = 7:** meio neutro (ex.: água pura H₂O e NaCl).\n• **pH > 7:** meio básico/alcalino (quanto maior, mais básico — ex.: NaOH ≈ 13,5).',
      fonte: 'Conceitos de Química'
    };
  }
  if (q.includes('quem fez') || q.includes('criadores') || q.includes('lideres') || q.includes('turma')) {
    return {
      resposta: '👥 O projeto **AQUI TEM QUÍMICA!** foi desenvolvido pelo **1º Ano de Informática (UFCIMG)** com 9 grupos e 4 duplas de líderes:\n\n• **Site:** Arthur Santos Pereira e Augusto Maciel Tomaz\n• **Coordenação e Mapa:** Davi Silva Vilaça e Otavio Graciano Veiga de Morais\n• **Revisão Técnica:** Miria Emanuela Marques Ferreira e Lara Salvador Alves da Silva\n• **Identidade Visual:** Marcos Túlio Lopes Costa e Tiago Resende Araújo',
      fonte: 'Créditos do Projeto'
    };
  }

  // 9. Pesquisa livre na Wikipedia em Portugues para qualquer outro tema
  const wiki = await buscarWikipediaPt(mensagem);
  if (wiki) return wiki;

  return {
    resposta: 'Não encontrei um resumo exato para essa frase, mas posso ajudar se você reformular com o nome do tema (ex.: *"O que é fotossíntese?"*, *"Como funciona o pH?"*, *"Fale sobre NaCl"* ou *"Plaquinhas do Restaurante"*).',
    fonte: 'QuímicoBot'
  };
}

module.exports = function registrarQuimicoBotIA(app) {
  const express = require('express');

  app.get('/api/quimicobot-ia/status', (req, res) => {
    res.json({
      ok: true,
      iaAvancada: Boolean(process.env.GEMINI_API_KEY),
      modo: process.env.GEMINI_API_KEY ? 'IA Gemini Online' : 'Modo Inteligente + Wikipédia'
    });
  });

  app.post('/api/quimicobot-ia', express.json({ limit: '200kb' }), async (req, res) => {
    try {
      const mensagem = String((req.body && req.body.mensagem) || '').trim();
      const historico = (req.body && req.body.historico) || [];
      const codigoAtual = String((req.body && req.body.codigoAtual) || '').trim();

      if (!mensagem) {
        return res.status(400).json({ erro: 'Digite uma pergunta.' });
      }

      const dados = carregarDados();
      const apiKey = (process.env.GEMINI_API_KEY || '').trim();

      if (apiKey) {
        const ia = await chamarGemini(apiKey, mensagem, historico, dados, codigoAtual);
        if (ia) return res.json(ia);
      }

      const local = await respostaInteligenteLocal(mensagem, dados, codigoAtual);
      return res.json(local);
    } catch (err) {
      return res.status(500).json({
        resposta: 'Tive uma instabilidade rápida ao processar sua pergunta. Tente novamente em alguns segundos.',
        fonte: 'Sistema'
      });
    }
  });
};