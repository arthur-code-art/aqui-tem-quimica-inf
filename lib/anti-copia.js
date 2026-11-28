const BOTS_BLOQUEADOS = [
  'claudebot', 'claude-web', 'claude-user', 'anthropic-ai',
  'gptbot', 'chatgpt-user', 'oai-searchbot', 'ccbot',
  'google-extended', 'perplexitybot', 'bytespider', 'amazonbot',
  'meta-externalagent', 'cohere-ai', 'diffbot', 'omgili',
  'httrack', 'webcopier', 'sitesucker', 'cyotek', 'offline explorer',
  'wget', 'curl', 'python-requests', 'scrapy', 'aiohttp', 'libwww-perl'
];

module.exports = function registrarAntiCopia(app) {
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send([
      'User-agent: ClaudeBot',
      'Disallow: /',
      'User-agent: Claude-Web',
      'Disallow: /',
      'User-agent: Claude-User',
      'Disallow: /',
      'User-agent: anthropic-ai',
      'Disallow: /',
      'User-agent: GPTBot',
      'Disallow: /',
      'User-agent: ChatGPT-User',
      'Disallow: /',
      'User-agent: OAI-SearchBot',
      'Disallow: /',
      'User-agent: PerplexityBot',
      'Disallow: /',
      'User-agent: CCBot',
      'Disallow: /',
      'User-agent: Bytespider',
      'Disallow: /',
      'User-agent: HTTrack',
      'Disallow: /',
      'User-agent: *',
      'Disallow: /api/',
      'Disallow: /data/',
      'Disallow: /js/'
    ].join('\n'));
  });

  app.use((req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noai, noimageai');
    if (req.method === 'HEAD') return next();

    const ua = String(req.headers['user-agent'] || '').toLowerCase();
    if (ua.includes('render')) return next();

    const bloqueado = BOTS_BLOQUEADOS.some((bot) => ua.includes(bot));
    if (bloqueado) {
      res.status(403).type('text/plain').send(
        'Acesso bloqueado (403): copia automatizada e leitura por bots/IAs nao autorizadas neste dominio.'
      );
      return;
    }
    next();
  });
};