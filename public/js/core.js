/* ==========================================================================
   AQUI TEM QUÍMICA! — 1º Ano de Informática (CEFET-MG — Divinópolis)
   ETAPA 3 (Parte 1): Núcleo Global, Partículas, Tema, Dados e QuímicoBot INF
   ========================================================================== */

(() => {
  'use strict';

  const ZONES = [
    { name: 'Restaurante', group: 'G01', type: 'Exclusiva', croqui: { x: 26, y: 18 }, lat: -20.14515, lng: -44.89175 },
    { name: 'Banheiros do prédio 3', group: 'G02', type: 'Exclusiva', croqui: { x: 38, y: 51 }, lat: -20.14552, lng: -44.89132 },
    { name: 'Corredores do prédio 1', group: 'G03', type: 'Exclusiva', croqui: { x: 14, y: 51 }, lat: -20.14562, lng: -44.89185 },
    { name: 'Corredores do prédio 6', group: 'G04', type: 'Exclusiva', croqui: { x: 61, y: 51 }, lat: -20.14548, lng: -44.89082 },
    { name: 'Portaria', group: 'G05', type: 'Exclusiva', croqui: { x: 12, y: 83 }, lat: -20.14612, lng: -44.89192 },
    { name: 'Laboratório de informática', group: 'G06', type: 'Exclusiva', croqui: { x: 74, y: 18 }, lat: -20.14508, lng: -44.89075 },
    { name: 'Jardim', group: 'G07', type: 'Compartilhada', croqui: { x: 60, y: 83 }, lat: -20.14602, lng: -44.89105 },
    { name: 'Estacionamentos', group: 'G08', type: 'Compartilhada', croqui: { x: 35, y: 83 }, lat: -20.14615, lng: -44.89145 },
    { name: 'Quadra', group: 'G09', type: 'Compartilhada', croqui: { x: 85, y: 76 }, lat: -20.14578, lng: -44.89028 }
  ];

  const CLASSES = ['Ácido', 'Base', 'Sal', 'Óxido'];

  // Dados de segurança caso o front-end seja aberto sem o servidor Node.js rodando
  const FALLBACK_SUBSTANCES = [
    {
      slug: 'acido-acetico',
      nomeIupac: 'Ácido etanoico (Ácido acético)',
      formula: 'CH3COOH',
      formulaHtml: 'CH<sub>3</sub>COOH',
      nomesPopulares: ['Vinagre de álcool', 'Ácido acético diluído (4% a 6%)'],
      classe: 'Ácido',
      subtipo: 'Ácido carboxílico fraco (monoácido orgânico)',
      phEstimado: 2.8,
      fotoPlaquinha: '/assets/img/classe-acidos.jpg',
      fotoLegenda: 'Plaquinha fixada no balcão de temperos do Restaurante',
      justificativa: 'Segundo a teoria de Arrhenius, o ácido acético é uma substância molecular que sofre ionização parcial em meio aquoso, liberando como único cátion o íon hidrogênio (H⁺ / H₃O⁺).',
      classificacaoTags: ['Ácido de Arrhenius', 'Ácido Fraco (α ≈ 1%)', 'Monoácido', 'Oxiácido orgânico'],
      equacaoTipo: 'Equação de Ionização em Meio Aquoso',
      equacaoHtml: 'CH<sub>3</sub>COOH<sub>(aq)</sub> + H<sub>2</sub>O<sub>(l)</sub> ⇌ H<sub>3</sub>O<sup>+</sup><sub>(aq)</sub> + CH<sub>3</sub>COO<sup>−</sup><sub>(aq)</sub>',
      equacaoExplicacao: 'A dupla seta (⇌) indica equilíbrio químico: apenas uma pequena fração das moléculas se ioniza em água, caracterizando um ácido fraco.',
      propriedadesFisicas: {
        'Estado físico (25 °C)': 'Líquido límpido',
        'Cor e odor': 'Incolor, com odor pungente característico',
        'Solubilidade em água': 'Totalmente miscível em qualquer proporção'
      },
      propriedadesQuimicas: {
        'Comportamento em água': 'Ionização parcial gerando íons H₃O⁺ e acetato (CH₃COO⁻)',
        'Caráter': 'Ácido (pH entre 2,4 e 3,0 no vinagre comercial)',
        'Condutividade elétrica': 'Conduz fracamente em solução aquosa (eletrólito fraco)',
        'Reações características': 'Neutraliza bases e reage com bicarbonato liberando CO₂'
      },
      porQueEstaAqui: 'No Restaurante da escola, a acidez moderada do ácido acético realça o sabor dos alimentos, ajuda na conservação contra microrganismos e atua na higienização culinária de hortaliças.',
      ondeMaisAparece: [
        'Indústria alimentícia: conservante natural (INS 260) em picles, molhos e maioneses.',
        'Indústria química: produção de acetato de vinila (usado em colas PVA e tintas) e solventes.'
      ],
      segurancaRiscos: 'No vinagre doméstico (4% a 6%), o risco é baixo, podendo causar ardência nos olhos ou pele sensível. Em concentração industrial (ácido acético glacial), é corrosivo e inflamável.',
      segurancaCuidados: [
        'Evite contato direto com os olhos; em caso de respingo, lave com água corrente.',
        'Nunca misture vinagre com água sanitária (NaClO), pois a reação libera gás cloro tóxico (Cl₂).'
      ],
      curiosidade: 'A palavra "vinagre" vem do francês antigo "vin aigre" (vinho azedo), porque bactérias do gênero Acetobacter oxidam o etanol do vinho em ácido acético na presença de oxigênio.',
      referencias: [
        'ATKINS, P.; JONES, L.; LAVERMAN, L. Princípios de química: questionando a vida moderna e o meio ambiente. 7. ed. Porto Alegre: Bookman, 2018.',
        'NATIONAL CENTER FOR BIOTECHNOLOGY INFORMATION (NCBI). PubChem Compound Summary for CID 176, Acetic Acid. Disponível em: https://pubchem.ncbi.nlm.nih.gov/compound/Acetic-Acid. Acesso em: 20 nov. 2026.'
      ],
      grupo: 'G01',
      autores: ['[Integrante 1 — G01]', '[Integrante 2 — G01]', '[Integrante 3 — G01]'],
      ocorrencias: [
        {
          codigo: 'INF-G01-P1',
          zona: 'Restaurante',
          localExato: 'Balcão de temperos e saladas, ao lado dos galheteiros',
          grupo: 'G01',
          lat: -20.14515,
          lng: -44.89175,
          autorizacao: { responsavel: 'Responsável pelo Restaurante', data: '2026-11-20', aprovada: true }
        }
      ]
    },
    {
      slug: 'hidroxido-de-sodio',
      nomeIupac: 'Hidróxido de sódio',
      formula: 'NaOH',
      formulaHtml: 'NaOH',
      nomesPopulares: ['Soda cáustica', 'Base da saponificação de sabonetes'],
      classe: 'Base',
      subtipo: 'Base forte e solúvel (monobase)',
      phEstimado: 13.5,
      fotoPlaquinha: '/assets/img/classe-bases.jpg',
      fotoLegenda: 'Plaquinha fixada próxima à pia e dispenser de sabonete nos Banheiros do prédio 3',
      justificativa: 'Segundo Arrhenius, o hidróxido de sódio é uma base porque, ao se dissolver em água, sofre dissociação iônica liberando como único ânion a hidroxila (OH⁻).',
      classificacaoTags: ['Base de Arrhenius', 'Base Forte', 'Monobase', 'Altamente Solúvel'],
      equacaoTipo: 'Equação de Dissociação Iônica',
      equacaoHtml: 'NaOH<sub>(s)</sub> —<sup>H<sub>2</sub>O</sup>→ Na<sup>+</sup><sub>(aq)</sub> + OH<sup>−</sup><sub>(aq)</sub>',
      equacaoExplicacao: 'Por ser um composto iônico de metal alcalino, dissocia-se praticamente 100% em água, liberando grande quantidade de íons OH⁻.',
      propriedadesFisicas: {
        'Estado físico (25 °C)': 'Sólido cristalino (escamas ou lentilhas) higroscópico',
        'Cor': 'Branco',
        'Solubilidade em água': 'Altamente solúvel, com liberação intensa de calor (exotérmica)'
      },
      propriedadesQuimicas: {
        'Comportamento em água': 'Dissociação total formando solução fortemente alcalina',
        'Caráter': 'Básico forte (pH próximo de 13–14 em soluções concentradas)',
        'Condutividade elétrica': 'Excelente condutor em meio aquoso (eletrólito forte)',
        'Reações características': 'Reage com gorduras (saponificação) formando sabão e glicerol'
      },
      porQueEstaAqui: 'Nos Banheiros do prédio 3, o NaOH é a matéria-prima química essencial na fabricação dos sabonetes e desengordurantes que removem óleos e sujeira das mãos (no sabonete pronto, ele já foi consumido e neutralizado).',
      ondeMaisAparece: [
        'Indústria de papel e celulose: separação da lignina das fibras de madeira.',
        'Tratamento de água e efluentes: ajuste de pH para coagulação de impurezas.'
      ],
      segurancaRiscos: 'Na forma pura (soda cáustica), é extremamente corrosivo, causando queimaduras químicas graves na pele, olhos e mucosas.',
      segurancaCuidados: [
        'Manter produtos com soda cáustica totalmente fora do alcance e nunca manusear sem EPIs.',
        'Jamais misturar produtos alcalinos com ácidos ou desinfetantes clorados.'
      ],
      curiosidade: 'O NaOH é tão higroscópico que, se deixado aberto sobre uma superfície, absorve umidade do ar até formar uma poça líquida — fenômeno chamado de deliquescência.',
      referencias: [
        'FELTRE, R. Química geral. 6. ed. São Paulo: Moderna, 2004. v. 1.',
        'NATIONAL CENTER FOR BIOTECHNOLOGY INFORMATION (NCBI). PubChem Compound Summary for CID 14798, Sodium Hydroxide. Disponível em: https://pubchem.ncbi.nlm.nih.gov/compound/Sodium-Hydroxide. Acesso em: 20 nov. 2026.'
      ],
      grupo: 'G02',
      autores: ['[Integrante 1 — G02]', '[Integrante 2 — G02]', '[Integrante 3 — G02]'],
      ocorrencias: [
        {
          codigo: 'INF-G02-P1',
          zona: 'Banheiros do prédio 3',
          localExato: 'Parede ao lado do dispenser de sabonete líquido na pia principal',
          grupo: 'G02',
          lat: -20.14552,
          lng: -44.89132,
          autorizacao: { responsavel: 'Coordenação do Prédio 3', data: '2026-11-20', aprovada: true }
        }
      ]
    },
    {
      slug: 'cloreto-de-sodio',
      nomeIupac: 'Cloreto de sódio',
      formula: 'NaCl',
      formulaHtml: 'NaCl',
      nomesPopulares: ['Sal de cozinha', 'Sal refinado', 'Eletrólito de isotônicos e suor'],
      classe: 'Sal',
      subtipo: 'Sal neutro e haleto iônico',
      phEstimado: 7.0,
      fotoPlaquinha: '/assets/img/classe-sais.jpg',
      fotoLegenda: 'Plaquinha fixada na área de hidratação da Quadra e no Restaurante',
      justificativa: 'É um sal porque é um composto iônico que, dissolvido em água, sofre dissociação liberando um cátion diferente de H⁺ (Na⁺) e um ânion diferente de OH⁻ (Cl⁻).',
      classificacaoTags: ['Sal Neutro', 'Composto Iônico', 'Eletrólito Forte', 'Solúvel em Água'],
      equacaoTipo: 'Equação de Neutralização e Dissociação',
      equacaoHtml: 'HCl<sub>(aq)</sub> + NaOH<sub>(aq)</sub> → NaCl<sub>(aq)</sub> + H<sub>2</sub>O<sub>(l)</sub>',
      equacaoExplicacao: 'Resulta da neutralização total entre um ácido forte (HCl) e uma base forte (NaOH); em água, dissocia-se totalmente em Na⁺ e Cl⁻.',
      propriedadesFisicas: {
        'Estado físico (25 °C)': 'Sólido cristalino cúbico (PF = 801 °C)',
        'Cor': 'Branco / translúcido',
        'Solubilidade em água': 'Solúvel (cerca de 360 g/L a 25 °C)'
      },
      propriedadesQuimicas: {
        'Comportamento em água': 'Dissociação completa sem hidrólise (solução neutra)',
        'Caráter': 'Neutro (pH ≈ 7,0)',
        'Condutividade elétrica': 'Isolante quando sólido; excelente condutor em solução aquosa ou fundido',
        'Reações características': 'Participa da eletrólise ígnea e aquosa na indústria de cloro-soda'
      },
      porQueEstaAqui: 'Na Quadra, os íons Na⁺ e Cl⁻ perdidos no suor durante os jogos precisam ser repostos pela alimentação e por bebidas isotônicas para manter o equilíbrio osmótico e os impulsos nervosos.',
      ondeMaisAparece: [
        'Área médica: solução fisiológica a 0,9% de NaCl para hidratação venosa e lavagem nasal.',
        'Indústria química: matéria-prima para produção de soda cáustica (NaOH), gás cloro (Cl₂) e bicarbonato de sódio.'
      ],
      segurancaRiscos: 'Substância segura em quantidades alimentares, porém o consumo excessivo crônico está associado à hipertensão arterial e sobrecarga renal.',
      segurancaCuidados: [
        'Consuma com moderação conforme orientação de saúde (OMS recomenda até 5 g/dia).',
        'Evite contato direto com ferimentos abertos, pois causa ardência por diferença osmótica.'
      ],
      curiosidade: 'A palavra "salário" tem origem no latim "salarium", pois na Roma Antiga o sal era tão valioso na conservação de alimentos que chegava a servir como forma de pagamento ou ração para soldados.',
      referencias: [
        'USBERCO, J.; SALVADOR, E. Química: volume único. 5. ed. São Paulo: Saraiva, 2002.',
        'NATIONAL CENTER FOR BIOTECHNOLOGY INFORMATION (NCBI). PubChem Compound Summary for CID 5234, Sodium Chloride. Disponível em: https://pubchem.ncbi.nlm.nih.gov/compound/Sodium-Chloride. Acesso em: 20 nov. 2026.'
      ],
      grupo: 'G09',
      autores: ['[Integrante 1 — G09]', '[Integrante 2 — G09]', '[Integrante 3 — G09]'],
      ocorrencias: [
        {
          codigo: 'INF-G09-P1',
          zona: 'Quadra',
          localExato: 'Pilastra próxima ao bebedouro lateral da Quadra poliesportiva',
          grupo: 'G09',
          lat: -20.14578,
          lng: -44.89028,
          autorizacao: { responsavel: 'Professor(a) de Educação Física', data: '2026-11-20', aprovada: true }
        }
      ]
    },
    {
      slug: 'oxido-de-zinco',
      nomeIupac: 'Óxido de zinco',
      formula: 'ZnO',
      formulaHtml: 'ZnO',
      nomesPopulares: ['Branco de zinco', 'Composto cerâmico de pasta térmica'],
      classe: 'Óxido',
      subtipo: 'Óxido anfótero',
      phEstimado: 7.2,
      fotoPlaquinha: '/assets/img/classe-oxidos.jpg',
      fotoLegenda: 'Plaquinha fixada na bancada técnica do Laboratório de Informática',
      justificativa: 'É um óxido porque é um composto binário formado por dois elementos químicos (zinco e oxigênio) no qual o oxigênio é o elemento mais eletronegativo.',
      classificacaoTags: ['Óxido Anfótero', 'Composto Binário', 'Condutor Térmico', 'Isolante Elétrico'],
      equacaoTipo: 'Comportamento Anfótero (reage com ácido e com base)',
      equacaoHtml: 'ZnO<sub>(s)</sub> + 2 HCl<sub>(aq)</sub> → ZnCl<sub>2(aq)</sub> + H<sub>2</sub>O<sub>(l)</sub><br>ZnO<sub>(s)</sub> + 2 NaOH<sub>(aq)</sub> → Na<sub>2</sub>ZnO<sub>2(aq)</sub> + H<sub>2</sub>O<sub>(l)</sub>',
      equacaoExplicacao: 'Atua como base diante de ácido forte (HCl) e como ácido diante de base forte (NaOH), formando sal e água em ambos os casos.',
      propriedadesFisicas: {
        'Estado físico (25 °C)': 'Sólido pulverulento cristalino',
        'Cor': 'Branco (fica amarelado quando fortemente aquecido)',
        'Solubilidade em água': 'Praticamente insolúvel em água pura'
      },
      propriedadesQuimicas: {
        'Comportamento em água': 'Insolúvel e estável em água neutra',
        'Caráter': 'Anfótero (reage com ácidos fortes e bases fortes)',
        'Condutividade elétrica': 'Isolante elétrico / semicondutor de banda larga',
        'Reações características': 'Alta condutividade térmica sem fechar curto-circuito em placas'
      },
      porQueEstaAqui: 'No Laboratório de Informática, o óxido de zinco é utilizado na formulação de pastas térmicas entre o processador (CPU) e o dissipador: ele preenche microfissuras para transferir calor com eficiência sem conduzir eletricidade.',
      ondeMaisAparece: [
        'Cosméticos e saúde: filtro solar físico (bloqueia radiação UV) e pomadas dermatológicas.',
        'Indústria da borracha: ativador no processo de vulcanização de pneus.'
      ],
      segurancaRiscos: 'O pó seco pode irritar vias respiratórias se inalado em grandes quantidades; em pastas térmicas, evitar ingestão e contato com os olhos.',
      segurancaCuidados: [
        'Lavar as mãos com água e sabão após manutenção de computadores com pasta térmica.',
        'Não abrir equipamentos energizados e não aquecer o produto.'
      ],
      curiosidade: 'O ZnO apresenta termocromismo reversível: quando aquecido acima de 300 °C, perde traços de oxigênio na rede cristalina e muda da cor branca para amarela, voltando a ficar branco ao esfriar.',
      referencias: [
        'LEE, J. D. Química inorgânica não tão concisa. 5. ed. São Paulo: Blucher, 1999.',
        'NATIONAL CENTER FOR BIOTECHNOLOGY INFORMATION (NCBI). PubChem Compound Summary for CID 14806, Zinc Oxide. Disponível em: https://pubchem.ncbi.nlm.nih.gov/compound/Zinc-Oxide. Acesso em: 20 nov. 2026.'
      ],
      grupo: 'G06',
      autores: ['[Integrante 1 — G06]', '[Integrante 2 — G06]', '[Integrante 3 — G06]'],
      ocorrencias: [
        {
          codigo: 'INF-G06-P1',
          zona: 'Laboratório de informática',
          localExato: 'Bancada de hardware, ao lado do gabinete demonstrativo de CPU',
          grupo: 'G06',
          lat: -20.14508,
          lng: -44.89075,
          autorizacao: { responsavel: 'Responsável pelo Laboratório de Informática', data: '2026-11-20', aprovada: true }
        }
      ]
    }
  ];

  let cachedSubstances = null;

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeText(str) {
    return String(str ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function getClassSlug(classe) {
    const norm = normalizeText(classe);
    if (norm.startsWith('acido')) return 'acido';
    if (norm.startsWith('base')) return 'base';
    if (norm.startsWith('sal')) return 'sal';
    return 'oxido';
  }

  function getDisplayClasse(sub) {
    if (normalizeText(sub.classe) === 'oxido' && sub.subtipo) {
      return sub.subtipo;
    }
    return sub.classe;
  }

  async function loadData() {
    if (cachedSubstances) return cachedSubstances;

    try {
      const res = await fetch('/api/substancias', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      cachedSubstances = Array.isArray(payload) ? payload : (payload.substancias || FALLBACK_SUBSTANCES);
    } catch (_err) {
      try {
        const resLocal = await fetch('/data/substancias.json');
        if (!resLocal.ok) throw new Error('local fallback');
        const payload = await resLocal.json();
        cachedSubstances = Array.isArray(payload) ? payload : (payload.substancias || FALLBACK_SUBSTANCES);
      } catch (_err2) {
        cachedSubstances = FALLBACK_SUBSTANCES;
      }
    }

    return cachedSubstances;
  }

  function flattenPlaquinhas(substancias) {
    const list = [];
    substancias.forEach((sub) => {
      const ocorrencias = Array.isArray(sub.ocorrencias) && sub.ocorrencias.length
        ? sub.ocorrencias
        : [{ codigo: sub.codigo || 'INF-G01-P1', zona: sub.zona || 'Restaurante', localExato: sub.localExato || 'A definir', grupo: sub.grupo || 'G01' }];

      ocorrencias.forEach((oc) => {
        list.push({
          codigo: oc.codigo,
          zona: oc.zona,
          localExato: oc.localExato,
          grupo: oc.grupo || sub.grupo,
          lat: oc.lat,
          lng: oc.lng,
          autorizacao: oc.autorizacao || null,
          slug: sub.slug,
          nomeIupac: sub.nomeIupac,
          formula: sub.formula,
          formulaHtml: sub.formulaHtml || escapeHtml(sub.formula),
          classe: sub.classe,
          subtipo: sub.subtipo || '',
          classeTabela: getDisplayClasse(sub),
          nomesPopulares: sub.nomesPopulares || [],
          sub
        });
      });
    });

    const zoneIndex = new Map(ZONES.map((z, idx) => [normalizeText(z.name), idx]));
    list.sort((a, b) => {
      const za = zoneIndex.has(normalizeText(a.zona)) ? zoneIndex.get(normalizeText(a.zona)) : 99;
      const zb = zoneIndex.has(normalizeText(b.zona)) ? zoneIndex.get(normalizeText(b.zona)) : 99;
      if (za !== zb) return za - zb;
      return String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric: true });
    });

    return list;
  }

  // XP Gamificado compartilhado
  function getXP() {
    return parseInt(localStorage.getItem('atq_user_xp') || '0', 10) || 0;
  }

  function addXP(amount) {
    const next = Math.max(0, getXP() + amount);
    localStorage.setItem('atq_user_xp', String(next));
    updateXPBadges(next);
    return next;
  }

  function updateXPBadges(value = getXP()) {
    const headerXp = document.getElementById('user-xp-display');
    const quizXp = document.getElementById('quiz-xp');
    if (headerXp) headerXp.textContent = String(value);
    if (quizXp) quizXp.textContent = String(value);
  }

  // =========================================================================
  // 1. TEMA DARK / LIGHT MODE
  // =========================================================================
  function initTheme() {
    const saved = localStorage.getItem('atq_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('atq_theme', next);

      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', next === 'dark' ? '#0B0F19' : '#F8FAFC');
      }
    });
  }

  // =========================================================================
  // 2. MENU MOBILE
  // =========================================================================
  function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-toggle');
    const nav = document.getElementById('main-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // =========================================================================
  // 3. FUNDO ANIMADO DE PARTÍCULAS MOLECULARES (LEVE E ECONÔMICO)
  // =========================================================================
  function initBackgroundMolecules() {
    const canvas = document.getElementById('bg-molecules-canvas');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#FF4D4D', '#00D2FF', '#10B981', '#A855F7'];
    let particles = [];
    let animId = null;
    let isPaused = false;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const targetCount = window.innerWidth < 768 ? 22 : 44;
      particles = Array.from({ length: targetCount }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 2.2 + 1.4,
        color: colors[i % colors.length]
      }));
    }

    function tick() {
      if (isPaused) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const maxDist = window.innerWidth < 768 ? 110 : 145;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(148, 163, 184, ${(1 - dist / maxDist) * 0.22})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(tick);
    }

    resize();
    tick();

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isPaused = true;
        if (animId) cancelAnimationFrame(animId);
      } else {
        isPaused = false;
        tick();
      }
    });
  }

  // =========================================================================
  // 4. SCROLL REVEAL & TILT 3D NOS CARDS
  // =========================================================================
  function initScrollReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    items.forEach((el) => observer.observe(el));
  }

  function initTiltCards() {
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.tilt-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-3px)`;
    });

    document.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.tilt-card');
      if (card && !card.contains(e.relatedTarget)) {
        card.style.transform = '';
      }
    });
  }

  // =========================================================================
  // 5. CHATBOT FLUTUANTE — QUÍMICOBOT INF
  // =========================================================================
  function localSafetyAndFallbackReply(promptText, substancias) {
    const q = normalizeText(promptText);

    // Trava de segurança inviolável no cliente também
    const dangerKeywords = [
      'misturar agua sanitaria', 'mistura caseira', 'fazer bomba', 'fazer gas cloro',
      'como misturar', 'experimento caseiro', 'receita de limpeza', 'misturar vinagre com'
    ];
    if (dangerKeywords.some((k) => q.includes(k)) || (q.includes('mistur') && (q.includes('sanitaria') || q.includes('amonia') || q.includes('acido')))) {
      return '🚫 Por segurança do projeto AQUI TEM QUÍMICA!, não posso sugerir misturas de produtos químicos ou testes caseiros. Misturar água sanitária (NaClO) com ácidos (como vinagre) ou amônia libera gás cloro (Cl₂) e cloraminas, que são altamente tóxicos. Se quiser, posso explicar teoricamente por que essa reação é perigosa!';
    }

    if (q.includes('pergunta') && (q.includes('as') || q.includes('surpresa') || q.includes('revisao'))) {
      return '🎯 Pergunta rápida para a AS (30/11): Segundo Arrhenius, qual é o único cátion liberado por um ácido em água e qual é o único ânion liberado por uma base? (Dica: pense em H⁺ e OH⁻!)';
    }

    if (q.includes('arrhenius')) {
      return '📘 Pela Teoria de Arrhenius (em meio aquoso): Ácidos sofrem ionização liberando exclusivamente o cátion H⁺ (ou H₃O⁺); Bases sofrem dissociação liberando exclusivamente o ânion OH⁻.';
    }

    if (q.includes('anfotero')) {
      return '🟣 Óxidos anfóteros (como ZnO da pasta térmica no Lab de Informática e Al₂O₃) comportam-se como base diante de um ácido forte e como ácido diante de uma base forte, formando sal e água nos dois casos.';
    }

    if (q.includes('ionizacao') && q.includes('dissociacao')) {
      return '⚡ Ionização ocorre em compostos moleculares (como ácidos, ex.: HCl), onde os íons são formados ao reagir com a água. Dissociação ocorre em compostos iônicos (como bases e sais, ex.: NaOH e NaCl), onde os íons já existem e apenas se separam na água.';
    }

    // Busca na base local de substâncias e zonas
    const plaquinhas = flattenPlaquinhas(substancias);
    const matches = plaquinhas.filter((p) => {
      const hay = normalizeText(`${p.codigo} ${p.zona} ${p.localExato} ${p.nomeIupac} ${p.formula} ${p.classe} ${p.subtipo}`);
      return q.split(/\s+/).filter((w) => w.length > 2).some((word) => hay.includes(word));
    });

    if (matches.length) {
      const top = matches.slice(0, 3)
        .map((m) => `• ${m.codigo}: ${m.nomeIupac} (${m.formula}) — ${m.classeTabela} em ${m.zona}`)
        .join('\n');
      return `🔎 Encontrei na base do 1º INF:\n${top}\nVocê pode abrir qualquer uma delas pelo Mapa ou Catálogo!`;
    }

    return '🧪 Posso te ajudar com ácidos, bases, sais, óxidos (Arrhenius, pH, balanceamento) ou localizar plaquinhas nas 9 zonas do 1º INF. Tente perguntar: "Onde encontro óxidos no Laboratório de informática?"';
  }

  function initChatbot() {
    const fab = document.getElementById('chatbot-fab');
    const win = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close');
    const form = document.getElementById('chatbot-form');
    const input = document.getElementById('chatbot-input');
    const messagesEl = document.getElementById('chatbot-messages');
    const chips = document.querySelectorAll('.chat-chip');

    if (!fab || !win || !form || !input || !messagesEl) return;

    function toggleWindow(forceOpen) {
      const willOpen = typeof forceOpen === 'boolean' ? forceOpen : win.hidden;
      win.hidden = !willOpen;
      fab.setAttribute('aria-expanded', String(willOpen));
      if (willOpen) input.focus();
    }

    function appendMessage(text, role) {
      const div = document.createElement('div');
      div.className = `chat-msg ${role}`;
      const p = document.createElement('p');
      p.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
      div.appendChild(p);
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return div;
    }

    async function sendPrompt(text) {
      const clean = text.trim();
      if (!clean) return;

      appendMessage(clean, 'user');
      input.value = '';
      const typingEl = appendMessage('Analisando base química do 1º INF...', 'bot');

      try {
        const currentSlug = window.AquiTemQuimica.currentSubstanceSlug || null;
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: clean, contextSlug: currentSlug })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        typingEl.querySelector('p').innerHTML = escapeHtml(data.reply || 'Sem resposta no momento.').replace(/\n/g, '<br>');
      } catch (_err) {
        const subs = await loadData();
        const fallback = localSafetyAndFallbackReply(clean, subs);
        typingEl.querySelector('p').innerHTML = escapeHtml(fallback).replace(/\n/g, '<br>');
      }

      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    fab.addEventListener('click', () => toggleWindow());
    if (closeBtn) closeBtn.addEventListener('click', () => toggleWindow(false));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      sendPrompt(input.value);
    });

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt') || chip.textContent;
        sendPrompt(prompt);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !win.hidden) toggleWindow(false);
    });
  }

  // Exposição global controlada
  window.AquiTemQuimica = {
    ZONES,
    CLASSES,
    escapeHtml,
    normalizeText,
    getClassSlug,
    getDisplayClasse,
    loadData,
    flattenPlaquinhas,
    getXP,
    addXP,
    updateXPBadges,
    currentSubstanceSlug: null
  };

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    initBackgroundMolecules();
    initScrollReveal();
    initTiltCards();
    initChatbot();
    updateXPBadges();
  });
})();