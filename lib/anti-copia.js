const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SECRET = process.env.ATQ_SHIELD_SECRET || crypto.randomBytes(32).toString('hex');
const DEV_PASS = 'cefet2026';

const BOTS_BLOQUEADOS = [
  'claudebot', 'claude-web', 'claude-user', 'anthropic-ai',
  'gptbot', 'chatgpt-user', 'oai-searchbot', 'ccbot',
  'google-extended', 'perplexitybot', 'bytespider', 'amazonbot',
  'meta-externalagent', 'cohere-ai', 'diffbot', 'omgili',
  'headlesschrome', 'phantomjs', 'selenium', 'playwright', 'puppeteer',
  'httrack', 'webcopier', 'sitesucker', 'cyotek', 'offline explorer',
  'wget', 'curl', 'python-requests', 'python-urllib', 'scrapy',
  'aiohttp', 'go-http-client', 'axios/', 'node-fetch', 'libwww-perl', 'postmanruntime'
];

const rateMap = new Map();

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > 0) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  });
  return out;
}

function assinarToken(ts) {
  return crypto.createHmac('sha256', SECRET).update(String(ts)).digest('hex').slice(0, 24);
}

function emitirToken() {
  const ts = Date.now();
  return `${ts}.${assinarToken(ts)}`;
}

function validarToken(tok) {
  if (!tok || typeof tok !== 'string') return false;
  const partes = tok.split('.');
  if (partes.length !== 2) return false;
  const ts = Number(partes[0]);
  if (!Number.isFinite(ts) || Date.now() - ts > 4 * 60 * 60 * 1000) return false;
  const esperado = assinarToken(ts);
  return partes[1] === esperado;
}

function ehLocalhost(req) {
  const h = String(req.hostname || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

function ehDev(req) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies.atq_dev === DEV_PASS || (req.query && req.query.dev === DEV_PASS);
}

function mesmaOrigemReferer(req) {
  const ref = String(req.headers.referer || '');
  const host = String(req.headers.host || '');
  if (!ref || !host) return false;
  try {
    return new URL(ref).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function checarRateLimit(ip, limite, janelaMs) {
  const agora = Date.now();
  let reg = rateMap.get(ip);
  if (!reg || agora - reg.inicio > janelaMs) {
    reg = { inicio: agora, count: 0 };
  }
  reg.count++;
  rateMap.set(ip, reg);
  if (rateMap.size > 3000) {
    for (const [k, v] of rateMap.entries()) {
      if (agora - v.inicio > janelaMs) rateMap.delete(k);
    }
  }
  return reg.count <= limite;
}

function ofuscarJsDinamico(codigoUtf8) {
  const chave = crypto.randomBytes(32);
  const dados = Buffer.from(codigoUtf8, 'utf8');
  const cifrado = Buffer.allocUnsafe(dados.length);
  for (let i = 0; i < dados.length; i++) {
    cifrado[i] = dados[i] ^ chave[i & 31] ^ (i & 255);
  }
  const kB64 = chave.toString('base64');
  const dB64 = cifrado.toString('base64');
  return `(function(){if(window.__ATQ_OK__!==1){if(window.__ATQ_LOCK__)window.__ATQ_LOCK__('TAMPER');return;}var k=Uint8Array.from(atob("${kB64}"),function(c){return c.charCodeAt(0);});var d=Uint8Array.from(atob("${dB64}"),function(c){return c.charCodeAt(0);});for(var i=0;i<d.length;i++){d[i]^=k[i&31]^(i&255);}(0,eval)(new TextDecoder('utf-8').decode(d));})();`;
}

module.exports = function registrarAntiCopia(app) {
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send([
      'User-agent: ClaudeBot', 'Disallow: /',
      'User-agent: Claude-Web', 'Disallow: /',
      'User-agent: Claude-User', 'Disallow: /',
      'User-agent: anthropic-ai', 'Disallow: /',
      'User-agent: GPTBot', 'Disallow: /',
      'User-agent: ChatGPT-User', 'Disallow: /',
      'User-agent: OAI-SearchBot', 'Disallow: /',
      'User-agent: PerplexityBot', 'Disallow: /',
      'User-agent: CCBot', 'Disallow: /',
      'User-agent: Bytespider', 'Disallow: /',
      'User-agent: Google-Extended', 'Disallow: /',
      'User-agent: HTTrack', 'Disallow: /',
      'User-agent: *',
      'Disallow: /api/',
      'Disallow: /data/',
      'Disallow: /js/',
      'Disallow: /css/'
    ].join('\n'));
  });

  app.use((req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noai, noimageai');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Controle de modo desenvolvedor via cookie (?dev=cefet2026 / ?dev=off)
    if (req.query && req.query.dev === DEV_PASS) {
      res.setHeader('Set-Cookie', `atq_dev=${DEV_PASS}; Path=/; Max-Age=604800; SameSite=Lax`);
    } else if (req.query && req.query.dev === 'off') {
      res.setHeader('Set-Cookie', 'atq_dev=; Path=/; Max-Age=0; SameSite=Lax');
    }

    if (req.method === 'HEAD') return next();

    const ua = String(req.headers['user-agent'] || '').toLowerCase();
    if (ua.includes('render')) return next();

    const local = ehLocalhost(req);
    const dev = ehDev(req);

    // 1. Bloqueio de bots de IA, scrapers e navegadores headless
    if (!local && !dev) {
      const semUa = ua.length < 12;
      const ehBot = BOTS_BLOQUEADOS.some((b) => ua.includes(b));
      if (semUa || ehBot) {
        return res.status(403).type('text/plain').send('403 Forbidden - Acesso automatizado nao autorizado.');
      }

      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0').split(',')[0].trim();
      if (!checarRateLimit(ip, 140, 60000)) {
        return res.status(429).type('text/plain').send('429 Too Many Requests - Atividade suspeita bloqueada.');
      }
    }

    const p = req.path || '/';
    const cookies = parseCookies(req.headers.cookie);
    const dest = String(req.headers['sec-fetch-dest'] || '').toLowerCase();
    const site = String(req.headers['sec-fetch-site'] || '').toLowerCase();

    // 2. Emitir cookie assinado nas paginas HTML
    const ehPagina = !p.startsWith('/js/') && !p.startsWith('/css/') && !p.startsWith('/data/') && !p.startsWith('/assets/') && !p.startsWith('/api/');
    if (ehPagina && !validarToken(cookies.atq_tok)) {
      const novoTok = emitirToken();
      const prevCookie = res.getHeader('Set-Cookie');
      const tokHeader = `atq_tok=${novoTok}; Path=/; HttpOnly; SameSite=Lax; Max-Age=14400`;
      if (prevCookie) {
        res.setHeader('Set-Cookie', Array.isArray(prevCookie) ? prevCookie.concat(tokHeader) : [prevCookie, tokHeader]);
      } else {
        res.setHeader('Set-Cookie', tokHeader);
      }
    }

    // 3. Portao rigido para /js/*, /data/* e /api/extras-dados (bloqueia acesso direto / clone)
    const protegidoJs = p.startsWith('/js/') && p.endsWith('.js');
    const protegidoDados = p.startsWith('/data/') || p === '/api/extras-dados';

    if ((protegidoJs || protegidoDados) && !local && !dev) {
      const temTok = validarToken(cookies.atq_tok);
      const temRef = mesmaOrigemReferer(req);

      if (dest === 'document' || (site && site !== 'same-origin') || (!temTok && !temRef)) {
        return res.status(403).type('text/html').send(
          '<!doctype html><html lang="pt-BR"><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#090412;color:#f5d37a;font-family:system-ui,sans-serif;text-align:center;"><div><h1>⛔ Acesso Negado (403)</h1><p style="color:#d8ccf0;">Recurso protegido contra cópia direta e leitura por IAs.</p></div></body></html>'
        );
      }

      // Entrega dinamica criptografada para todos os scripts em /js/*.js
      if (protegidoJs) {
        const nomeSeguro = path.basename(p);
        const arqPath = path.join(process.cwd(), 'public', 'js', nomeSeguro);
        if (fs.existsSync(arqPath)) {
          const bruto = fs.readFileSync(arqPath, 'utf8');
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
          res.setHeader('Pragma', 'no-cache');
          return res.send(ofuscarJsDinamico(bruto));
        }
      }
    }

    next();
  });
};