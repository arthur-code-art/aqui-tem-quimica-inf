/* ==========================================================================
   AQUI TEM QUÍMICA! — 1º Ano de Informática (CEFET-MG — Divinópolis)
   ETAPA 3 (Parte 2): Controladores das 5 Páginas, Mapa Digital + Croqui,
   Auditoria de Mínimos, 4 Simulações do Laboratório Virtual e Desafio AS
   ========================================================================== */

(() => {
  'use strict';

  const App = window.AquiTemQuimica;
  if (!App) return;

  // Coordenadas centrais do campus em Divinópolis-MG (ajustáveis facilmente com o Modo Coordenadas)
  const CAMPUS_CENTER = [-20.172485881270976, -44.91011990598546];
  const CAMPUS_ZOOM = 18;

  // =========================================================================
  // PÁGINA 1: HOME (BUSCA INSTANTÂNEA, CATÁLOGO E PAINEL DE AUDITORIA)
  // =========================================================================
  async function initHomePage() {
    const substancias = await App.loadData();
    const plaquinhas = App.flattenPlaquinhas(substancias);

    // Estatística do Hero
    const heroStat = document.getElementById('hero-stat-plaquinhas');
    if (heroStat) heroStat.textContent = String(plaquinhas.length);

    // Contagem por classe nos 4 cards
    App.CLASSES.forEach((classe) => {
      const count = plaquinhas.filter((p) => App.normalizeText(p.classe) === App.normalizeText(classe)).length;
      const el = document.querySelector(`[data-count-classe="${classe}"]`);
      if (el) el.textContent = `${count} plaquinha${count === 1 ? '' : 's'}`;
    });

    initGlobalSearch(plaquinhas);
    initCatalog(plaquinhas);
    renderAuditPanel(substancias, plaquinhas);
  }

  function initGlobalSearch(plaquinhas) {
    const input = document.getElementById('global-search-input');
    const clearBtn = document.getElementById('clear-global-search');
    const dropdown = document.getElementById('global-search-results');
    const quickChips = document.querySelectorAll('.quick-chip');
    const form = document.getElementById('global-search-form');

    if (!input || !dropdown) return;

    function runSearch(query) {
      const term = App.normalizeText(query);
      if (clearBtn) clearBtn.hidden = !query.length;

      if (!term) {
        dropdown.hidden = true;
        dropdown.innerHTML = '';
        return;
      }

      const matches = plaquinhas.filter((item) => {
        const text = App.normalizeText(
          `${item.codigo} ${item.nomeIupac} ${item.formula} ${item.classe} ${item.subtipo} ${item.zona} ${item.localExato} ${item.nomesPopulares.join(' ')}`
        );
        return text.includes(term);
      });

      if (!matches.length) {
        dropdown.innerHTML = `<div class="search-result-item"><span>Nenhuma plaquinha encontrada para "<strong>${App.escapeHtml(query)}</strong>".</span></div>`;
        dropdown.hidden = false;
        return;
      }

      dropdown.innerHTML = matches.slice(0, 8).map((item) => {
        const slugClass = App.getClassSlug(item.classe);
        return `
          <a href="/plaquinha/${encodeURIComponent(item.codigo)}" class="search-result-item" role="option">
            <div>
              <strong>${App.escapeHtml(item.nomeIupac)}</strong> <span class="formula-tag">${item.formulaHtml}</span>
              <div class="substance-card-meta">${App.escapeHtml(item.codigo)} • ${App.escapeHtml(item.zona)}</div>
            </div>
            <span class="badge badge-${slugClass}">${App.escapeHtml(item.classe)}</span>
          </a>
        `;
      }).join('');
      dropdown.hidden = false;
    }

    input.addEventListener('input', (e) => runSearch(e.target.value));
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); runSearch(input.value); });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        runSearch('');
        input.focus();
      });
    }

    quickChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        input.value = chip.getAttribute('data-search') || '';
        runSearch(input.value);
        input.focus();
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.hero-search')) dropdown.hidden = true;
    });
  }

  function initCatalog(plaquinhas) {
    const grid = document.getElementById('catalog-grid');
    const emptyState = document.getElementById('catalog-empty-state');
    const classBtns = document.querySelectorAll('#catalog-class-filters .filter-chip');
    const zoneSelect = document.getElementById('catalog-zone-select');
    const searchInput = document.getElementById('catalog-search-input');
    const visibleCountEl = document.getElementById('catalog-visible-count');
    const totalCountEl = document.getElementById('catalog-total-count');
    const resetBtn = document.getElementById('reset-catalog-filters');

    if (!grid) return;

    let selectedClasse = 'todas';
    if (totalCountEl) totalCountEl.textContent = String(plaquinhas.length);

    function render() {
      const selectedZone = zoneSelect ? zoneSelect.value : 'todas';
      const searchTerm = App.normalizeText(searchInput ? searchInput.value : '');

      const filtered = plaquinhas.filter((item) => {
        const matchClasse = selectedClasse === 'todas' || App.normalizeText(item.classe) === App.normalizeText(selectedClasse);
        const matchZone = selectedZone === 'todas' || App.normalizeText(item.zona) === App.normalizeText(selectedZone);
        const hay = App.normalizeText(`${item.codigo} ${item.nomeIupac} ${item.formula} ${item.zona} ${item.localExato} ${item.nomesPopulares.join(' ')}`);
        const matchSearch = !searchTerm || hay.includes(searchTerm);
        return matchClasse && matchZone && matchSearch;
      });

      if (visibleCountEl) visibleCountEl.textContent = String(filtered.length);

      if (!filtered.length) {
        grid.innerHTML = '';
        if (emptyState) emptyState.hidden = false;
        return;
      }

      if (emptyState) emptyState.hidden = true;

      grid.innerHTML = filtered.map((item) => {
        const slugClass = App.getClassSlug(item.classe);
        return `
          <article class="substance-card glass-card tilt-card" data-classe="${App.escapeHtml(item.classe)}">
            <div class="substance-card-top">
              <span class="code-pill">${App.escapeHtml(item.codigo)}</span>
              <span class="badge badge-${slugClass}">${App.escapeHtml(item.classeTabela)}</span>
            </div>
            <div>
              <h3>${App.escapeHtml(item.nomeIupac)}</h3>
              <div class="substance-card-formula">${item.formulaHtml}</div>
            </div>
            <p class="substance-card-meta">
              <strong>Zona:</strong> ${App.escapeHtml(item.zona)} (${App.escapeHtml(item.grupo)})<br>
              <strong>Local:</strong> ${App.escapeHtml(item.localExato)}
            </p>
            <a href="/plaquinha/${encodeURIComponent(item.codigo)}" class="btn btn-glass btn-sm btn-block">
              Abrir Ficha Completa (11 Blocos) →
            </a>
          </article>
        `;
      }).join('');
    }

    classBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        classBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedClasse = btn.getAttribute('data-filter-classe') || 'todas';
        render();
      });
    });

    if (zoneSelect) zoneSelect.addEventListener('change', render);
    if (searchInput) searchInput.addEventListener('input', render);

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        selectedClasse = 'todas';
        classBtns.forEach((b, idx) => b.classList.toggle('active', idx === 0));
        if (zoneSelect) zoneSelect.value = 'todas';
        if (searchInput) searchInput.value = '';
        render();
      });
    }

    render();
  }

  function renderAuditPanel(substancias, plaquinhas) {
    const widget = document.getElementById('audit-widget');
    if (!widget) return;

    // Considera autorizadas para contagem oficial de avaliação (edital item 9)
    const validPlaquinhas = plaquinhas.filter((p) => !p.autorizacao || p.autorizacao.aprovada !== false);
    const totalPlaquinhas = validPlaquinhas.length;

    const classStats = App.CLASSES.map((classe) => {
      const items = validPlaquinhas.filter((p) => App.normalizeText(p.classe) === App.normalizeText(classe));
      const uniqueSlugs = new Set(items.map((i) => i.slug));
      return {
        classe,
        slug: App.getClassSlug(classe),
        total: items.length,
        unique: uniqueSlugs.size,
        minTotalOk: items.length >= 6,
        minUniqueOk: uniqueSlugs.size >= 4
      };
    });

    const zoneStats = App.ZONES.map((z) => {
      const count = validPlaquinhas.filter((p) => App.normalizeText(p.zona) === App.normalizeText(z.name)).length;
      return { ...z, count, ok: count >= 3 };
    });

    const classesTotalOkCount = classStats.filter((c) => c.minTotalOk).length;
    const classesUniqueOkCount = classStats.filter((c) => c.minUniqueOk).length;
    const zonesOkCount = zoneStats.filter((z) => z.ok).length;
    const allMet = totalPlaquinhas >= 30 && classesTotalOkCount === 4 && classesUniqueOkCount === 4 && zonesOkCount === 9;

    const setKpi = (key, value, pct, note) => {
      const valEl = widget.querySelector(`[data-audit="${key}"]`);
      const barEl = widget.querySelector(`[data-bar="${key}"]`);
      const noteEl = widget.querySelector(`[data-status="${key}"]`);
      if (valEl) valEl.textContent = String(value);
      if (barEl) barEl.style.width = `${Math.min(100, Math.round(pct))}%`;
      if (noteEl) noteEl.textContent = note;
    };

    setKpi(
      'total-plaquinhas',
      totalPlaquinhas,
      (totalPlaquinhas / 30) * 100,
      totalPlaquinhas >= 30 ? 'Meta atingida! ✓' : `Faltam ${30 - totalPlaquinhas} plaquinhas para o mínimo`
    );
    setKpi(
      'classes-ok',
      classesTotalOkCount,
      (classesTotalOkCount / 4) * 100,
      classesTotalOkCount === 4 ? 'Todas com ≥ 6 plaquinhas ✓' : 'Aguardando ≥ 6 em cada função'
    );
    setKpi(
      'unicas-ok',
      classesUniqueOkCount,
      (classesUniqueOkCount / 4) * 100,
      classesUniqueOkCount === 4 ? 'Todas com ≥ 4 substâncias únicas ✓' : 'Aguardando ≥ 4 únicas por função'
    );
    setKpi(
      'zonas-ok',
      zonesOkCount,
      (zonesOkCount / 9) * 100,
      zonesOkCount === 9 ? 'Todas as 9 zonas completas ✓' : `${9 - zonesOkCount} zonas ainda abaixo de 3 plaquinhas`
    );

    const overallBadge = document.getElementById('audit-overall-badge');
    const overallSub = document.getElementById('audit-overall-subtitle');
    if (overallBadge) {
      overallBadge.textContent = allMet ? '✓ 100% Conforme o Edital' : 'Em Progresso — Cadastro Ativo';
      overallBadge.className = `audit-status-pill ${allMet ? 'status-ok' : 'status-pending'}`;
    }
    if (overallSub) {
      overallSub.textContent = allMet
        ? 'Parabéns, 1º INF! Todos os mínimos obrigatórios de plaquinhas, classes e zonas foram cumpridos.'
        : `${totalPlaquinhas} plaquinhas autorizadas registradas em ${substancias.length} substâncias únicas. Complete as metas pendentes até 30/11.`;
    }

    const classesList = document.getElementById('audit-classes-list');
    if (classesList) {
      classesList.innerHTML = classStats.map((c) => `
        <div class="audit-bar-item">
          <div class="audit-bar-meta">
            <strong>${c.classe}s</strong>
            <span>${c.total}/6 plaquinhas • ${c.unique}/4 únicas ${c.minTotalOk && c.minUniqueOk ? '✓' : ''}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill fill-${c.slug}" style="width: ${Math.min(100, Math.round((c.total / 6) * 100))}%"></div>
          </div>
        </div>
      `).join('');
    }

    const zonesList = document.getElementById('audit-zones-list');
    if (zonesList) {
      zonesList.innerHTML = zoneStats.map((z) => `
        <div class="audit-zone-pill ${z.ok ? 'met' : ''}">
          <strong>${z.group} • ${App.escapeHtml(z.name)}</strong>
          <span>${z.count}/3 plaquinhas ${z.ok ? '✓' : ''}</span>
        </div>
      `).join('');
    }
  }

  // =========================================================================
  // PÁGINA 2: AS 4 CLASSES (LISTA DE PLAQUINHAS + 4 MINI-EXPERIÊNCIAS)
  // =========================================================================
  async function initClassesPage() {
    const substancias = await App.loadData();

    // Lista de links por classe
    document.querySelectorAll('[data-class-list]').forEach((container) => {
      const targetClass = container.getAttribute('data-class-list');
      const items = substancias.filter((s) => App.normalizeText(s.classe) === App.normalizeText(targetClass));

      if (!items.length) {
        container.innerHTML = '<span class="substance-card-meta">Nenhuma plaquinha cadastrada nesta classe ainda.</span>';
        return;
      }

      container.innerHTML = items.map((s) => `
        <a href="/substancia/${encodeURIComponent(s.slug)}" class="quick-chip">
          ${App.escapeHtml(s.nomeIupac)} (${s.formulaHtml || App.escapeHtml(s.formula)})
        </a>
      `).join('');
    });

    // Destaque da aba âncora ativa
    const anchorTabs = document.querySelectorAll('.anchor-tab');
    anchorTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        anchorTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

    // Mini-lab 1: Ácidos (Forte vs Fraco)
    const acidIons = document.getElementById('minilab-acido-ions');
    const acidText = document.getElementById('minilab-acido-text');
    document.querySelectorAll('[data-acid-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-acid-mode');
        if (!acidIons || !acidText) return;
        if (mode === 'forte') {
          acidIons.innerHTML = Array.from({ length: 6 }, () => '<span class="ion-dot badge-acido">H⁺</span><span class="ion-dot badge-base">Cl⁻</span>').join('');
          acidText.textContent = 'HCl (Ácido Forte): praticamente todas as moléculas ionizam-se em água, liberando muitos íons H⁺ e gerando forte condutividade.';
        } else {
          acidIons.innerHTML = '<span class="ion-dot badge-acido">H⁺</span><span class="ion-dot badge-base">CH₃COO⁻</span>' +
            Array.from({ length: 5 }, () => '<span class="ion-dot pill-school">CH₃COOH</span>').join('');
          acidText.textContent = 'CH₃COOH (Vinagre — Ácido Fraco): a grande maioria das moléculas permanece neutra (não ionizada); apenas cerca de 1% libera H⁺.';
        }
      });
    });

    // Mini-lab 2: Bases (Fenolftaleína)
    const baseLiquid = document.getElementById('minilab-base-liquid');
    const baseText = document.getElementById('minilab-base-text');
    document.querySelectorAll('[data-base-ph]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ph = btn.getAttribute('data-base-ph');
        if (!baseLiquid || !baseText) return;
        if (ph === '12') {
          baseLiquid.style.backgroundColor = '#ec4899';
          baseLiquid.style.boxShadow = '0 0 24px rgba(236, 72, 153, 0.65)';
          baseText.textContent = 'Em meio básico (pH > 8,2), o excesso de íons OH⁻ altera a estrutura da fenolftaleína, deixando a solução rosa-magenta intensa!';
        } else {
          baseLiquid.style.backgroundColor = 'rgba(226, 232, 240, 0.25)';
          baseLiquid.style.boxShadow = 'none';
          baseText.textContent = 'Em meio neutro (pH 7) ou ácido (pH < 7), a fenolftaleína permanece totalmente incolor.';
        }
      });
    });

    // Mini-lab 3: Sais (Sólido vs Aquoso)
    const saltBulb = document.getElementById('minilab-sal-bulb');
    const saltText = document.getElementById('minilab-sal-text');
    document.querySelectorAll('[data-salt-state]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const state = btn.getAttribute('data-salt-state');
        if (!saltBulb || !saltText) return;
        if (state === 'aquoso') {
          saltBulb.classList.add('lit');
          saltText.textContent = 'NaCl(aq): a água rompe o retículo cristalino e libera íons Na⁺ e Cl⁻ móveis, fechando o circuito e acendendo a lâmpada!';
        } else {
          saltBulb.classList.remove('lit');
          saltText.textContent = 'NaCl(s): no estado sólido, os íons Na⁺ e Cl⁻ estão presos em posições fixas no cristal — sem mobilidade iônica, a lâmpada fica apagada.';
        }
      });
    });

    // Mini-lab 4: Óxidos
    const oxideEq = document.getElementById('minilab-oxido-eq');
    const oxideText = document.getElementById('minilab-oxido-text');
    const oxideData = {
      CO2: {
        eq: 'CO₂(g) + H₂O(l) ⇌ H₂CO₃(aq)',
        text: 'Óxido Ácido: reage com água formando ácido carbônico (explica a acidez de bebidas gaseificadas e da chuva natural).'
      },
      CaO: {
        eq: 'CaO(s) + H₂O(l) → Ca(OH)₂(aq)',
        text: 'Óxido Básico (cal virgem): reage com água formando hidróxido de cálcio (cal hidratada), usado em argamassa e pintura de guias.'
      },
      ZnO: {
        eq: 'ZnO + 2 HCl → ZnCl₂ + H₂O  |  ZnO + 2 NaOH → Na₂ZnO₂ + H₂O',
        text: 'Óxido Anfótero (pasta térmica): reage tanto com ácidos fortes quanto com bases fortes, formando sal e água em ambos os casos.'
      }
    };
    document.querySelectorAll('[data-oxide-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-oxide-key');
        const info = oxideData[key];
        if (!info || !oxideEq || !oxideText) return;
        oxideEq.textContent = info.eq;
        oxideText.textContent = info.text;
      });
    });
  }

  // =========================================================================
  // PÁGINA 3: FICHA DE SUBSTÂNCIA — ROTA DIRETA DE QR CODE (11 BLOCOS)
  // =========================================================================
  async function initSubstanciaPage() {
    const substancias = await App.loadData();
    const path = decodeURIComponent(window.location.pathname);
    const params = new URLSearchParams(window.location.search);

    let targetSlug = params.get('slug') || '';
    let targetCodigo = params.get('codigo') || '';

    const slugMatch = path.match(/^\/substancia\/([^/]+)/i);
    const codeMatch = path.match(/^\/plaquinha\/([^/]+)/i);
    if (slugMatch) targetSlug = slugMatch[1];
    if (codeMatch) targetCodigo = codeMatch[1];

    let found = null;
    let highlightedCode = null;

    if (targetCodigo) {
      const codeNorm = App.normalizeText(targetCodigo);
      found = substancias.find((s) =>
        (s.ocorrencias || []).some((oc) => App.normalizeText(oc.codigo) === codeNorm)
      );
      if (found) highlightedCode = targetCodigo.toUpperCase();
    }

    if (!found && targetSlug) {
      const slugNorm = App.normalizeText(targetSlug);
      found = substancias.find((s) => App.normalizeText(s.slug) === slugNorm);
    }

    const article = document.getElementById('substance-article');
    const notFound = document.getElementById('substance-not-found');

    if (!found) {
      if (article) article.hidden = true;
      if (notFound) notFound.hidden = false;
      return;
    }

    App.currentSubstanceSlug = found.slug;
    document.title = `${found.nomeIupac} (${found.formula}) — AQUI TEM QUÍMICA! | 1º INF`;

    const slugClass = App.getClassSlug(found.classe);
    const ocorrencias = found.ocorrencias || [];
    const primaryCode = highlightedCode || (ocorrencias[0] ? ocorrencias[0].codigo : 'INF-G01-P1');

    if (article) article.setAttribute('data-classe-tema', found.classe);
    setText('sub-breadcrumb-current', `${primaryCode} • ${found.nomeIupac}`);

    const classeBadge = document.getElementById('sub-classe-badge');
    if (classeBadge) {
      classeBadge.textContent = App.getDisplayClasse(found);
      classeBadge.className = `badge badge-${slugClass}`;
    }

    setText('sub-codigo-principal', primaryCode);

    // Bloco 2: Substância
    setText('sub-nome-iupac', found.nomeIupac);
    setHtml('sub-formula-html', found.formulaHtml || App.escapeHtml(found.formula));
    setText('sub-nomes-populares', (found.nomesPopulares || []).join(' • ') || 'Uso técnico direto');

    // Escala visual de pH
    const phVal = typeof found.phEstimado === 'number' ? found.phEstimado : 7.0;
    const phPercent = Math.max(2, Math.min(98, (phVal / 14) * 100));
    setText('sub-ph-label', `pH estimado: ${phVal.toFixed(1)}`);
    const phMarker = document.getElementById('sub-ph-marker');
    if (phMarker) phMarker.style.left = `${phPercent}%`;

    // Bloco 1: Identificação + Foto Real da Plaquinha
    const fotoEl = document.getElementById('sub-foto-plaquinha');
    if (fotoEl) {
      fotoEl.src = found.fotoPlaquinha || `/assets/img/classe-${slugClass}s.jpg`;
      fotoEl.alt = `Foto real da plaquinha ${primaryCode} — ${found.nomeIupac}`;
    }
    setText('sub-foto-legenda', found.fotoLegenda || `Plaquinha ${primaryCode} fixada na escola`);

    const occList = document.getElementById('sub-ocorrencias-list');
    if (occList) {
      occList.innerHTML = ocorrencias.map((oc) => {
        const isCurrent = App.normalizeText(oc.codigo) === App.normalizeText(primaryCode);
        return `
          <li>
            <strong><code>${App.escapeHtml(oc.codigo)}</code>${isCurrent ? ' (QR atual)' : ''}</strong> — ${App.escapeHtml(oc.zona)}<br>
            <span>${App.escapeHtml(oc.localExato)}</span>
          </li>
        `;
      }).join('');
    }

    // Bloco 3: Classe e Justificativa
    setText('sub-classe-nome', App.getDisplayClasse(found));
    setText('sub-justificativa', found.justificativa);

    // Bloco 4: Classificação Complementar + Equação Química
    setText('sub-equacao-tipo', found.equacaoTipo || 'Equação Química Balanceada');
    setText('sub-equacao-titulo', found.equacaoTipo || 'Equação Balanceada');
    setHtml('sub-equacao-html', found.equacaoHtml || '—');
    setText('sub-equacao-explicacao', found.equacaoExplicacao || '');

    const tagsEl = document.getElementById('sub-classificacao-tags');
    if (tagsEl) {
      tagsEl.innerHTML = (found.classificacaoTags || []).map((t) => `<span class="pill pill-tech">${App.escapeHtml(t)}</span>`).join('');
    }

    // Bloco 5: Propriedades Físicas e Químicas
    renderDefinitionList('sub-props-fisicas', found.propriedadesFisicas);
    renderDefinitionList('sub-props-quimicas', found.propriedadesQuimicas);

    const propTabs = document.querySelectorAll('.prop-tab');
    const propsContainer = document.getElementById('sub-props-container');
    propTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        propTabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        if (propsContainer) propsContainer.setAttribute('data-view', tab.getAttribute('data-prop-tab') || 'ambas');
      });
    });

    // Bloco 6: Por que está aqui?
    setText('sub-por-que-esta-aqui', found.porQueEstaAqui);

    // Bloco 7: Onde mais aparece?
    renderSimpleList('sub-onde-mais-list', found.ondeMaisAparece);

    // Bloco 8: Segurança
    setText('sub-seguranca-riscos', found.segurancaRiscos);
    renderSimpleList('sub-seguranca-cuidados', found.segurancaCuidados);

    // Bloco 9: Curiosidade
    setText('sub-curiosidade', found.curiosidade);

    // Bloco 10: Referências ABNT
    renderSimpleList('sub-referencias-list', found.referencias);

    // Bloco 11: Autores
    setText('sub-autores-grupo', `Grupo ${found.grupo || 'INF'} — 1º Ano de Informática`);
    renderSimpleList('sub-autores-lista', found.autores || ['Integrantes do grupo — 1º INF']);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '';
  }

  function setHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value ?? '';
  }

  function renderDefinitionList(id, obj) {
    const dl = document.getElementById(id);
    if (!dl || !obj) return;
    dl.innerHTML = Object.entries(obj)
      .map(([k, v]) => `<div><dt>${App.escapeHtml(k)}</dt><dd>${App.escapeHtml(v)}</dd></div>`)
      .join('');
  }

  function renderSimpleList(id, arr) {
    const list = document.getElementById(id);
    if (!list) return;
    list.innerHTML = (arr || []).map((item) => `<li>${App.escapeHtml(item)}</li>`).join('');
  }

  // =========================================================================
  // PÁGINA 4: MAPA DIGITAL REAL (LEAFLET + GPS) + CROQUI SVG + TABELA OFICIAL
  // =========================================================================
  async function initMapaPage() {
    const substancias = await App.loadData();
    const plaquinhas = App.flattenPlaquinhas(substancias);

    let activeMapClass = 'todas';
    let leafletMap = null;
    let markerGroup = null;
    let userGpsLayer = null;
    let coordPickerActive = false;

    // Botões de impressão (Mapa + Tabela para entrega à professora)
    ['print-map-btn', 'print-map-btn-inline'].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => window.print());
    });

    // Alternância entre Modo Digital Real e Modo Croqui das 9 Zonas
    const modeBtns = document.querySelectorAll('[data-map-mode]');
    const panelDigital = document.getElementById('map-panel-digital');
    const panelCroqui = document.getElementById('map-panel-croqui');

    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-map-mode');
        modeBtns.forEach((b) => {
          const isActive = b === btn;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-selected', String(isActive));
        });

        if (panelDigital) panelDigital.hidden = mode !== 'digital';
        if (panelCroqui) panelCroqui.hidden = mode !== 'croqui';

        if (mode === 'digital' && leafletMap) {
          setTimeout(() => leafletMap.invalidateSize(), 120);
        }
      });
    });

    // Inicializa Mapa Digital Leaflet
    if (typeof window.L !== 'undefined' && document.getElementById('leaflet-campus-map')) {
      leafletMap = window.L.map('leaflet-campus-map', {
        center: CAMPUS_CENTER,
        zoom: CAMPUS_ZOOM,
        maxZoom: 20,
        zoomControl: true
      });

      const layers = {
        satelite: window.L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { attribution: 'Tiles © Esri', maxZoom: 20 }
        ),
        dark: window.L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          { attribution: '© OpenStreetMap © CARTO', maxZoom: 20 }
        ),
        ruas: window.L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { attribution: '© OpenStreetMap', maxZoom: 20 }
        )
      };

      let currentLayer = layers.satelite.addTo(leafletMap);
      markerGroup = window.L.layerGroup().addTo(leafletMap);

      // Troca de estilo de mapa (Satélite / Tech Dark / Claro)
      const tileBtns = document.querySelectorAll('[data-tile-layer]');
      tileBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-tile-layer');
          if (!layers[key]) return;
          tileBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          leafletMap.removeLayer(currentLayer);
          currentLayer = layers[key].addTo(leafletMap);
        });
      });

      // Centralizar no Campus
      const recenterBtn = document.getElementById('btn-recenter-campus');
      if (recenterBtn) {
        recenterBtn.addEventListener('click', () => {
          leafletMap.flyTo(CAMPUS_CENTER, CAMPUS_ZOOM, { duration: 0.8 });
        });
      }

      // Botão GPS: "Onde estou?"
      const locateBtn = document.getElementById('btn-locate-me');
      if (locateBtn) {
        locateBtn.addEventListener('click', () => {
          if (!navigator.geolocation) {
            alert('Seu navegador não suporta geolocalização GPS.');
            return;
          }
          locateBtn.textContent = '📡 Localizando...';
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude, accuracy } = pos.coords;
              if (userGpsLayer) leafletMap.removeLayer(userGpsLayer);
              userGpsLayer = window.L.layerGroup([
                window.L.circle([latitude, longitude], {
                  radius: Math.min(accuracy, 45),
                  color: '#00D2FF',
                  fillColor: '#00D2FF',
                  fillOpacity: 0.2
                }),
                window.L.circleMarker([latitude, longitude], {
                  radius: 8,
                  color: '#ffffff',
                  weight: 2,
                  fillColor: '#2563EB',
                  fillOpacity: 1
                }).bindPopup('<strong>Você está aqui!</strong><br>Explore as plaquinhas do 1º INF ao redor.')
              ]).addTo(leafletMap);

              leafletMap.flyTo([latitude, longitude], 19, { duration: 0.9 });
              locateBtn.textContent = '📍 Onde estou?';
            },
            () => {
              alert('Não foi possível acessar o GPS. Verifique as permissões de localização do navegador.');
              locateBtn.textContent = '📍 Onde estou?';
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      }

      // Modo Coordenadas para a equipe do site copiar lat/lng clicando no mapa
      const pickerBtn = document.getElementById('btn-coord-picker');
      const pickerBanner = document.getElementById('coord-helper-banner');
      const coordOutput = document.getElementById('coord-output');

      if (pickerBtn && pickerBanner) {
        pickerBtn.addEventListener('click', () => {
          coordPickerActive = !coordPickerActive;
          pickerBtn.setAttribute('aria-pressed', String(coordPickerActive));
          pickerBtn.classList.toggle('btn-primary', coordPickerActive);
          pickerBtn.classList.toggle('btn-outline', !coordPickerActive);
          pickerBanner.hidden = !coordPickerActive;
        });

        leafletMap.on('click', (ev) => {
          if (!coordPickerActive) return;
          const lat = Number(ev.latlng.lat.toFixed(6));
          const lng = Number(ev.latlng.lng.toFixed(6));
          const snippet = `"lat": ${lat}, "lng": ${lng}`;
          if (coordOutput) coordOutput.textContent = `${snippet} (copiado!)`;
          if (navigator.clipboard) navigator.clipboard.writeText(snippet).catch(() => {});
        });
      }
    }

    function getPlaqueLatLng(item, indexInZone) {
      if (typeof item.lat === 'number' && typeof item.lng === 'number') {
        return [item.lat, item.lng];
      }
      const zoneInfo = App.ZONES.find((z) => App.normalizeText(z.name) === App.normalizeText(item.zona)) || App.ZONES[0];
      const angle = (indexInZone * 72) * (Math.PI / 180);
      const offset = indexInZone === 0 ? 0 : 0.00007;
      return [zoneInfo.lat + Math.sin(angle) * offset, zoneInfo.lng + Math.cos(angle) * offset];
    }

    function renderLeafletMarkers() {
      if (!leafletMap || !markerGroup) return;
      markerGroup.clearLayers();

      const perZoneCounter = {};
      const visible = plaquinhas.filter((p) => activeMapClass === 'todas' || App.normalizeText(p.classe) === App.normalizeText(activeMapClass));

      visible.forEach((item) => {
        const zKey = App.normalizeText(item.zona);
        const idx = perZoneCounter[zKey] || 0;
        perZoneCounter[zKey] = idx + 1;

        const [lat, lng] = getPlaqueLatLng(item, idx);
        const slugClass = App.getClassSlug(item.classe);

        const icon = window.L.divIcon({
          className: 'leaflet-chem-pin',
          html: `<div class="chem-pin-badge pin-${slugClass}">${App.escapeHtml(item.codigo)}</div>`,
          iconSize: [0, 0]
        });

        const popupHtml = `
          <div class="map-popup-card">
            <div class="popover-badges">
              <span class="code-pill">${App.escapeHtml(item.codigo)}</span>
              <span class="badge badge-${slugClass}">${App.escapeHtml(item.classeTabela)}</span>
            </div>
            <h4>${App.escapeHtml(item.nomeIupac)}</h4>
            <p class="popover-formula">${item.formulaHtml}</p>
            <p><strong>${App.escapeHtml(item.zona)}</strong> — ${App.escapeHtml(item.localExato)}</p>
            <a href="/plaquinha/${encodeURIComponent(item.codigo)}" class="btn btn-primary btn-sm btn-block">Abrir Página →</a>
          </div>
        `;

        window.L.marker([lat, lng], { icon }).bindPopup(popupHtml).addTo(markerGroup);
      });
    }

    // Renderiza Pins no Croqui SVG das 9 Zonas
    const pinsLayer = document.getElementById('map-pins-layer');
    const popover = document.getElementById('map-pin-popover');
    const closePop = document.getElementById('close-pin-popover');

    if (closePop && popover) {
      closePop.addEventListener('click', () => { popover.hidden = true; });
    }

    function openCroquiPopover(item) {
      if (!popover) return;
      const slugClass = App.getClassSlug(item.classe);
      setText('pop-codigo', item.codigo);
      const clsEl = document.getElementById('pop-classe');
      if (clsEl) {
        clsEl.textContent = item.classeTabela;
        clsEl.className = `badge badge-${slugClass}`;
      }
      setText('pop-substancia', item.nomeIupac);
      setHtml('pop-formula', item.formulaHtml);
      setText('pop-local', `${item.zona} • ${item.localExato}`);
      const link = document.getElementById('pop-link');
      if (link) link.href = `/plaquinha/${encodeURIComponent(item.codigo)}`;
      popover.hidden = false;
    }

    function renderCroquiPins() {
      if (!pinsLayer) return;
      pinsLayer.innerHTML = '';

      const perZoneCounter = {};
      const visible = plaquinhas.filter((p) => activeMapClass === 'todas' || App.normalizeText(p.classe) === App.normalizeText(activeMapClass));

      visible.forEach((item) => {
        const zInfo = App.ZONES.find((z) => App.normalizeText(z.name) === App.normalizeText(item.zona)) || App.ZONES[0];
        const zKey = App.normalizeText(item.zona);
        const idx = perZoneCounter[zKey] || 0;
        perZoneCounter[zKey] = idx + 1;

        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const leftPct = zInfo.croqui.x + (col - 1) * 4.8;
        const topPct = zInfo.croqui.y + (row * 6.5) - 2;
        const slugClass = App.getClassSlug(item.classe);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `croqui-pin pin-${slugClass}`;
        btn.style.left = `${leftPct}%`;
        btn.style.top = `${topPct}%`;
        btn.textContent = item.codigo;
        btn.setAttribute('aria-label', `${item.codigo}: ${item.nomeIupac} em ${item.zona}`);
        btn.addEventListener('click', () => openCroquiPopover(item));
        pinsLayer.appendChild(btn);
      });
    }

    // Filtros de classe compartilhados entre Mapa Digital e Croqui
    const mapFilterBtns = document.querySelectorAll('[data-map-classe]');
    mapFilterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        mapFilterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeMapClass = btn.getAttribute('data-map-classe') || 'todas';
        if (popover) popover.hidden = true;
        renderLeafletMarkers();
        renderCroquiPins();
      });
    });

    renderLeafletMarkers();
    renderCroquiPins();
    initOfficialTable(plaquinhas);
  }

  function initOfficialTable(plaquinhas) {
    const tbody = document.getElementById('plaquinhas-table-body');
    const zoneFilter = document.getElementById('table-zone-filter');
    const classFilter = document.getElementById('table-class-filter');
    const searchInput = document.getElementById('table-search-input');

    if (!tbody) return;

    function renderTable() {
      const zVal = zoneFilter ? zoneFilter.value : 'todas';
      const cVal = classFilter ? classFilter.value : 'todas';
      const term = App.normalizeText(searchInput ? searchInput.value : '');

      const filtered = plaquinhas.filter((item) => {
        const matchZ = zVal === 'todas' || App.normalizeText(item.zona) === App.normalizeText(zVal);
        const matchC = cVal === 'todas' || App.normalizeText(item.classe) === App.normalizeText(cVal);
        const hay = App.normalizeText(`${item.codigo} ${item.zona} ${item.localExato} ${item.nomeIupac} ${item.formula} ${item.classeTabela} ${item.grupo}`);
        return matchZ && matchC && (!term || hay.includes(term));
      });

      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="table-loading">Nenhuma plaquinha corresponde aos filtros selecionados.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map((item) => {
        const slugClass = App.getClassSlug(item.classe);
        return `
          <tr>
            <td><a href="/plaquinha/${encodeURIComponent(item.codigo)}"><code>${App.escapeHtml(item.codigo)}</code></a></td>
            <td>${App.escapeHtml(item.zona)}</td>
            <td>${App.escapeHtml(item.localExato)}</td>
            <td><a href="/plaquinha/${encodeURIComponent(item.codigo)}">${App.escapeHtml(item.nomeIupac)}</a></td>
            <td><code>${item.formulaHtml}</code></td>
            <td><span class="badge badge-${slugClass}">${App.escapeHtml(item.classeTabela)}</span></td>
            <td><code>${App.escapeHtml(item.grupo)}</code></td>
          </tr>
        `;
      }).join('');
    }

    if (zoneFilter) zoneFilter.addEventListener('change', renderTable);
    if (classFilter) classFilter.addEventListener('change', renderTable);
    if (searchInput) searchInput.addEventListener('input', renderTable);

    renderTable();

    // Resumo Quantitativo Oficial
    setText('summary-total-geral', String(plaquinhas.length));
    const mapIds = [
      { classe: 'Ácido', totalId: 'summary-acido-total', uniqueId: 'summary-acido-unicas' },
      { classe: 'Base', totalId: 'summary-base-total', uniqueId: 'summary-base-unicas' },
      { classe: 'Sal', totalId: 'summary-sal-total', uniqueId: 'summary-sal-unicas' },
      { classe: 'Óxido', totalId: 'summary-oxido-total', uniqueId: 'summary-oxido-unicas' }
    ];

    mapIds.forEach(({ classe, totalId, uniqueId }) => {
      const subset = plaquinhas.filter((p) => App.normalizeText(p.classe) === App.normalizeText(classe));
      const uniques = new Set(subset.map((p) => p.slug)).size;
      setText(totalId, String(subset.length));
      setText(uniqueId, String(uniques));
    });
  }

  // =========================================================================
  // PÁGINA 5: LABORATÓRIO VIRTUAL (4 SIMULAÇÕES) + MODO DESAFIO AS
  // =========================================================================
  async function initLaboratorioPage() {
    const substancias = await App.loadData();

    // Controle das 4 abas do Laboratório
    const tabs = document.querySelectorAll('.lab-tab');
    const panels = document.querySelectorAll('.lab-panel');

    function activateTab(targetId) {
      tabs.forEach((t) => {
        const active = t.getAttribute('data-lab-target') === targetId;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      panels.forEach((p) => {
        const active = p.id === targetId;
        p.hidden = !active;
        p.classList.toggle('active', active);
      });
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-lab-target');
        activateTab(target);
        if (history.replaceState) history.replaceState(null, '', `#${target}`);
      });
    });

    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById(initialHash)) {
      activateTab(initialHash);
    }

    initPhSimulator();
    initConductivitySimulator();
    initOxideReactor();
    initDesafioAS(substancias);
  }

  // --- SIMULAÇÃO 1: MEDIDOR DE pH INTERATIVO DA ESCOLA ---
  function initPhSimulator() {
    const samples = {
      limao: { ph: 2.3, nature: 'Ácido', badge: 'badge-acido', hPct: 86, ohPct: 14, desc: 'Suco de limão (Restaurante): rico em ácido cítrico, libera alta concentração de íons H⁺ em solução aquosa.' },
      vinagre: { ph: 2.8, nature: 'Ácido', badge: 'badge-acido', hPct: 80, ohPct: 20, desc: 'Vinagre (Restaurante): solução aquosa de ácido acético (CH₃COOH), ácido fraco de Arrhenius com pH ácido.' },
      isotonico: { ph: 4.5, nature: 'Ácido leve', badge: 'badge-acido', hPct: 64, ohPct: 36, desc: 'Isotônico / Suor (Quadra): contém sais eletrólitos (Na⁺, K⁺, Cl⁻) e ácidos orgânicos suaves que deixam o meio levemente ácido.' },
      agua: { ph: 7.0, nature: 'Neutro', badge: 'badge-sal', hPct: 50, ohPct: 50, desc: 'Água do Bebedouro (Corredores P1/P6): equilíbrio exato entre [H⁺] e [OH⁻] (10⁻⁷ mol/L cada a 25 °C).' },
      bicarbonato: { ph: 8.4, nature: 'Básico suave', badge: 'badge-base', hPct: 34, ohPct: 66, desc: 'Fermento / Bicarbonato de Sódio (Restaurante): sal (NaHCO₃) que sofre hidrólise básica liberando OH⁻ em água.' },
      sabonete: { ph: 9.2, nature: 'Básico', badge: 'badge-base', hPct: 24, ohPct: 76, desc: 'Sabonete Líquido (Banheiros P3): caráter alcalino suave que auxilia na remoção de gorduras da pele.' },
      agua_sanitaria: { ph: 11.8, nature: 'Básico forte', badge: 'badge-base', hPct: 10, ohPct: 90, desc: 'Água Sanitária — NaClO (Banheiros P3): sal de caráter fortemente básico por hidrólise. Nunca misturar com ácidos!' },
      bateria: { ph: 0.8, nature: 'Ácido forte', badge: 'badge-acido', hPct: 96, ohPct: 4, desc: 'Eletrólito de Bateria Automotiva — H₂SO₄ (Estacionamentos): ácido forte altamente ionizado e corrosivo.' }
    };

    let currentSample = 'limao';
    let currentIndicator = 'universal';

    const liquid = document.getElementById('beaker-liquid');
    const litmusStrip = document.getElementById('litmus-strip');
    const litmusTip = document.getElementById('litmus-tip');
    const readout = document.getElementById('ph-digital-value');
    const natureBadge = document.getElementById('ph-nature-badge');
    const pointer = document.getElementById('sim-ph-pointer');
    const barH = document.getElementById('bar-h-plus');
    const barOH = document.getElementById('bar-oh-minus');
    const descEl = document.getElementById('ph-explanation-text');

    function getIndicatorColor(ph, indicator) {
      if (indicator === 'fenolftaleina') {
        return ph >= 8.3 ? '#ec4899' : 'rgba(203, 213, 225, 0.35)';
      }
      if (indicator === 'bromotimol') {
        if (ph < 6.0) return '#facc15';
        if (ph <= 7.6) return '#10b981';
        return '#2563eb';
      }
      if (indicator === 'tornassol') {
        return 'rgba(148, 163, 184, 0.35)';
      }
      // Indicador Universal
      if (ph < 2.5) return '#ef4444';
      if (ph < 4.5) return '#f97316';
      if (ph < 6.5) return '#eab308';
      if (ph <= 7.5) return '#10b981';
      if (ph < 9.5) return '#06b6d4';
      if (ph < 11.5) return '#2563eb';
      return '#7c3aed';
    }

    function updatePhView() {
      const s = samples[currentSample];
      if (!s) return;

      if (readout) readout.textContent = s.ph.toFixed(1);
      if (natureBadge) {
        natureBadge.textContent = s.nature;
        natureBadge.className = `badge ${s.badge}`;
      }
      if (pointer) pointer.style.left = `${Math.max(2, Math.min(98, (s.ph / 14) * 100))}%`;
      if (barH) barH.style.width = `${s.hPct}%`;
      if (barOH) barOH.style.width = `${s.ohPct}%`;
      if (liquid) liquid.style.backgroundColor = getIndicatorColor(s.ph, currentIndicator);

      if (litmusStrip && litmusTip) {
        const showLitmus = currentIndicator === 'tornassol';
        litmusStrip.hidden = !showLitmus;
        if (showLitmus) {
          litmusTip.style.backgroundColor = s.ph < 6.8 ? '#ef4444' : s.ph > 7.2 ? '#2563eb' : '#a855f7';
        }
      }

      if (descEl) {
        const extra =
          currentIndicator === 'fenolftaleina'
            ? (s.ph >= 8.3 ? ' Com fenolftaleína, o meio alcalino fica rosa-magenta!' : ' Com fenolftaleína, a solução permanece incolor.')
            : currentIndicator === 'bromotimol'
              ? (s.ph < 6 ? ' Azul de bromotimol vira amarelo em meio ácido.' : s.ph > 7.6 ? ' Azul de bromotimol fica azul intenso em meio básico.' : ' Azul de bromotimol fica verde próximo da neutralidade.')
              : currentIndicator === 'tornassol'
                ? (s.ph < 6.8 ? ' Papel tornassol fica vermelho em meio ácido.' : s.ph > 7.2 ? ' Papel tornassol fica azul em meio básico.' : ' Papel tornassol permanece arroxeado em meio neutro.')
                : '';
        descEl.textContent = s.desc + extra;
      }
    }

    document.querySelectorAll('[data-ph-sample]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-ph-sample]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentSample = btn.getAttribute('data-ph-sample');
        updatePhView();
      });
    });

    document.querySelectorAll('[data-indicator]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-indicator]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentIndicator = btn.getAttribute('data-indicator');
        updatePhView();
      });
    });

    updatePhView();
  }

  // --- SIMULAÇÃO 2: CONDUTIVIDADE ELÉTRICA E DISSOCIAÇÃO (ARRHENIUS) ---
  function initConductivitySimulator() {
    const canvas = document.getElementById('condutividade-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const solutes = {
      hcl: {
        eq: 'HCl<sub>(g)</sub> —<sup>H<sub>2</sub>O</sup>→ H<sup>+</sup><sub>(aq)</sub> + Cl<sup>−</sup><sub>(aq)</sub>',
        explain: 'Eletrólito Forte: ionização quase total gera abundância de cátions H⁺ e ânions Cl⁻ livres, acendendo a lâmpada com brilho máximo.',
        bulbClass: 'bulb-strong',
        bulbText: 'Brilho Intenso (Eletrólito Forte)',
        cation: 'H⁺', anion: 'Cl⁻', neutral: 'HCl',
        ionPairs: 10, neutrals: 1
      },
      ch3cooh: {
        eq: 'CH<sub>3</sub>COOH<sub>(aq)</sub> + H<sub>2</sub>O<sub>(l)</sub> ⇌ H<sub>3</sub>O<sup>+</sup><sub>(aq)</sub> + CH<sub>3</sub>COO<sup>−</sup><sub>(aq)</sub>',
        explain: 'Eletrólito Fraco (Vinagre): poucas moléculas sofrem ionização. A baixa quantidade de íons livres faz a lâmpada acender fracamente.',
        bulbClass: 'bulb-weak',
        bulbText: 'Brilho Fraco (Eletrólito Fraco)',
        cation: 'H⁺', anion: 'Ac⁻', neutral: 'HAc',
        ionPairs: 2, neutrals: 12
      },
      naoh: {
        eq: 'NaOH<sub>(s)</sub> —<sup>H<sub>2</sub>O</sup>→ Na<sup>+</sup><sub>(aq)</sub> + OH<sup>−</sup><sub>(aq)</sub>',
        explain: 'Base Forte de Arrhenius: dissociação iônica total libera muitos íons Na⁺ e OH⁻, conduzindo eletricidade com alta eficiência.',
        bulbClass: 'bulb-strong',
        bulbText: 'Brilho Intenso (Base Forte)',
        cation: 'Na⁺', anion: 'OH⁻', neutral: 'NaOH',
        ionPairs: 10, neutrals: 0
      },
      nacl: {
        eq: 'NaCl<sub>(s)</sub> —<sup>H<sub>2</sub>O</sup>→ Na<sup>+</sup><sub>(aq)</sub> + Cl<sup>−</sup><sub>(aq)</sub>',
        explain: 'Sal Solúvel: em água, os íons Na⁺ e Cl⁻ se separam do cristal e migram para os eletrodos opostos, fechando o circuito.',
        bulbClass: 'bulb-strong',
        bulbText: 'Brilho Intenso (Sal Dissociado)',
        cation: 'Na⁺', anion: 'Cl⁻', neutral: 'NaCl',
        ionPairs: 10, neutrals: 0
      },
      agua_pura: {
        eq: '2 H<sub>2</sub>O<sub>(l)</sub> ⇌ H<sub>3</sub>O<sup>+</sup><sub>(aq)</sub> + OH<sup>−</sup><sub>(aq)</sub> (autoionização mínima)',
        explain: 'Água destilada pura possui concentração ínfima de íons livres (10⁻⁷ mol/L), não conduzindo corrente suficiente para acender a lâmpada.',
        bulbClass: 'bulb-off',
        bulbText: 'Lâmpada Apagada (Sem Íons Livres)',
        cation: 'H⁺', anion: 'OH⁻', neutral: 'H₂O',
        ionPairs: 0, neutrals: 14
      }
    };

    let particles = [];
    let currentKey = 'hcl';

    function buildParticles(key) {
      const cfg = solutes[key];
      particles = [];
      for (let i = 0; i < cfg.ionPairs; i++) {
        particles.push({
          type: 'cation', label: cfg.cation,
          x: 90 + Math.random() * 340, y: 80 + Math.random() * 170,
          vx: -0.65 - Math.random() * 0.45, vy: (Math.random() - 0.5) * 0.6
        });
        particles.push({
          type: 'anion', label: cfg.anion,
          x: 90 + Math.random() * 340, y: 80 + Math.random() * 170,
          vx: 0.65 + Math.random() * 0.45, vy: (Math.random() - 0.5) * 0.6
        });
      }
      for (let i = 0; i < cfg.neutrals; i++) {
        particles.push({
          type: 'neutral', label: cfg.neutral,
          x: 75 + Math.random() * 370, y: 80 + Math.random() * 170,
          vx: (Math.random() - 0.5) * 0.55, vy: (Math.random() - 0.5) * 0.55
        });
      }
    }

    function selectSolute(key) {
      currentKey = key;
      const cfg = solutes[key];
      setHtml('cond-equation', cfg.eq);
      setText('cond-explanation', cfg.explain);
      setText('bulb-status-text', cfg.bulbText);
      const bulb = document.getElementById('virtual-bulb');
      if (bulb) bulb.className = `virtual-bulb ${cfg.bulbClass}`;
      buildParticles(key);
    }

    function drawFrame() {
      const panel = document.getElementById('sim-condutividade');
      if (!document.hidden && panel && !panel.hidden) {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Água do béquer
        ctx.fillStyle = 'rgba(0, 210, 255, 0.12)';
        ctx.fillRect(28, 56, w - 56, h - 76);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(28, 56, w - 56, h - 76);

        // Eletrodo negativo (Cátodo à esquerda)
        ctx.fillStyle = '#334155';
        ctx.fillRect(52, 18, 22, 195);
        ctx.fillStyle = '#00D2FF';
        ctx.font = 'bold 14px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('−', 63, 36);

        // Eletrodo positivo (Ânodo à direita)
        ctx.fillStyle = '#334155';
        ctx.fillRect(w - 74, 18, 22, 195);
        ctx.fillStyle = '#FF4D4D';
        ctx.fillText('+', w - 63, 36);

        // Atualiza e desenha partículas
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.y < 76 || p.y > h - 38) p.vy *= -1;
          if (p.type === 'cation' && p.x < 88) p.x = w - 95;
          else if (p.type === 'anion' && p.x > w - 88) p.x = 95;
          else if (p.type === 'neutral' && (p.x < 84 || p.x > w - 84)) p.vx *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.type === 'neutral' ? 14 : 15, 0, Math.PI * 2);
          ctx.fillStyle = p.type === 'cation' ? '#FF4D4D' : p.type === 'anion' ? '#00D2FF' : 'rgba(148, 163, 184, 0.35)';
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.label, p.x, p.y);
        });
      }
      requestAnimationFrame(drawFrame);
    }

    document.querySelectorAll('[data-solute]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-solute]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectSolute(btn.getAttribute('data-solute'));
      });
    });

    selectSolute(currentKey);
    requestAnimationFrame(drawFrame);
  }

  // --- SIMULAÇÃO 3: REATOR INTERATIVO DE ÓXIDOS E NEUTRALIZAÇÃO ---
  function initOxideReactor() {
    const oxideSelect = document.getElementById('oxide-select');
    const reagentSelect = document.getElementById('reagent-select');
    const runBtn = document.getElementById('run-reactor-btn');
    if (!oxideSelect || !reagentSelect || !runBtn) return;

    const matrix = {
      CO2: {
        type: 'Óxido Ácido (Anidrido)',
        H2O: {
          status: '✓ Reação de Formação de Ácido',
          eq: 'CO<sub>2(g)</sub> + H<sub>2</sub>O<sub>(l)</sub> ⇌ H<sub>2</sub>CO<sub>3(aq)</sub>',
          steps: [
            'CO₂ é um óxido ácido formado pelo ametal carbono.',
            'Ao reagir com água, origina o ácido carbônico (H₂CO₃), presente em águas gaseificadas e na chuva naturalmente ácida.',
            'Equação já balanceada: 1 C, 2 H e 3 O nos reagentes e nos produtos.'
          ]
        },
        HCl: {
          status: '✕ Não Ocorre Reação',
          eq: 'CO<sub>2(g)</sub> + HCl<sub>(aq)</sub> → Sem reação química',
          steps: [
            'CO₂ possui caráter ácido (anidrido).',
            'Óxidos ácidos não reagem com outros ácidos (como o HCl).'
          ]
        },
        NaOH: {
          status: '✓ Neutralização (Sal + Água)',
          eq: 'CO<sub>2(g)</sub> + 2 NaOH<sub>(aq)</sub> → Na<sub>2</sub>CO<sub>3(aq)</sub> + H<sub>2</sub>O<sub>(l)</sub>',
          steps: [
            'O óxido ácido (CO₂) reage diretamente com a base forte (NaOH).',
            'O produto formado é o sal carbonato de sódio (Na₂CO₃) mais água.',
            'Balanceamento: são necessários 2 mols de NaOH para fornecer 2 Na⁺ e 1 H₂O.'
          ]
        }
      },
      CaO: {
        type: 'Óxido Básico',
        H2O: {
          status: '✓ Formação de Base (Cal Hidratada)',
          eq: 'CaO<sub>(s)</sub> + H<sub>2</sub>O<sub>(l)</sub> → Ca(OH)<sub>2(aq)</sub>',
          steps: [
            'CaO (cal virgem) é um óxido básico típico de metal alcalinoterroso.',
            'Em contato com água, forma a base hidróxido de cálcio — Ca(OH)₂ — com liberação de calor.',
            'É a reação clássica utilizada na construção civil (argamassa e pintura de guias).'
          ]
        },
        HCl: {
          status: '✓ Neutralização (Sal + Água)',
          eq: 'CaO<sub>(s)</sub> + 2 HCl<sub>(aq)</sub> → CaCl<sub>2(aq)</sub> + H<sub>2</sub>O<sub>(l)</sub>',
          steps: [
            'Por ter caráter básico, o CaO neutraliza o ácido clorídrico (HCl).',
            'Forma-se o sal cloreto de cálcio (CaCl₂) e água.',
            'Balanceamento: 2 mols de HCl equilibram a carga +2 do íon Ca²⁺.'
          ]
        },
        NaOH: {
          status: '✕ Não Ocorre Reação',
          eq: 'CaO<sub>(s)</sub> + NaOH<sub>(aq)</sub> → Sem reação química',
          steps: [
            'CaO é um óxido básico e NaOH já é uma base.',
            'Óxidos básicos não reagem com bases.'
          ]
        }
      },
      CO: {
        type: 'Óxido Neutro (Indiferente)',
        H2O: {
          status: '✕ Não Reage com Água',
          eq: 'CO<sub>(g)</sub> + H<sub>2</sub>O<sub>(l)</sub> → Sem reação química',
          steps: [
            'O monóxido de carbono (CO, presente em escapamentos nos Estacionamentos) é um óxido neutro.',
            'Óxidos neutros (CO, NO, N₂O) não reagem com água, ácidos nem bases.'
          ]
        },
        HCl: {
          status: '✕ Não Reage com Ácidos',
          eq: 'CO<sub>(g)</sub> + HCl<sub>(aq)</sub> → Sem reação química',
          steps: ['Como óxido indiferente, o CO não apresenta caráter básico para neutralizar o HCl.']
        },
        NaOH: {
          status: '✕ Não Reage com Bases',
          eq: 'CO<sub>(g)</sub> + NaOH<sub>(aq)</sub> → Sem reação química',
          steps: ['Como óxido indiferente, o CO não apresenta caráter ácido para neutralizar o NaOH em condições comuns.']
        }
      },
      ZnO: {
        type: 'Óxido Anfótero',
        H2O: {
          status: '⚠️ Insolúvel em Água Pura',
          eq: 'ZnO<sub>(s)</sub> + H<sub>2</sub>O<sub>(l)</sub> → Não reage (insolúvel)',
          steps: [
            'ZnO (pasta térmica do Lab de Informática) é um óxido anfótero praticamente insolúvel em água.',
            'Seu comportamento duplo só se manifesta frente a ácidos fortes ou bases fortes!'
          ]
        },
        HCl: {
          status: '✓ Age como Base diante de Ácido',
          eq: 'ZnO<sub>(s)</sub> + 2 HCl<sub>(aq)</sub> → ZnCl<sub>2(aq)</sub> + H<sub>2</sub>O<sub>(l)</sub>',
          steps: [
            'Frente ao ácido forte HCl, o óxido anfótero ZnO assume papel básico.',
            'Produz o sal cloreto de zinco (ZnCl₂) e água.'
          ]
        },
        NaOH: {
          status: '✓ Age como Ácido diante de Base',
          eq: 'ZnO<sub>(s)</sub> + 2 NaOH<sub>(aq)</sub> → Na<sub>2</sub>ZnO<sub>2(aq)</sub> + H<sub>2</sub>O<sub>(l)</sub>',
          steps: [
            'Frente à base forte NaOH, o mesmo ZnO assume papel ácido!',
            'Produz o sal zincato de sódio (Na₂ZnO₂) e água, comprovando sua natureza anfótera.'
          ]
        }
      }
    };

    function executeReaction() {
      const ox = oxideSelect.value;
      const rg = reagentSelect.value;
      const data = matrix[ox] && matrix[ox][rg];
      if (!data) return;

      setText('reactor-oxide-type', matrix[ox].type);
      setText('reactor-reaction-badge', data.status);
      setHtml('reactor-equation', data.eq);
      renderSimpleList('reactor-steps', data.steps);
    }

    runBtn.addEventListener('click', executeReaction);
    oxideSelect.addEventListener('change', executeReaction);
    reagentSelect.addEventListener('change', executeReaction);
    executeReaction();
  }

  // --- SIMULAÇÃO 4: MODO DESAFIO AS (QUIZ CRONOMETRADO + FLASHCARDS 3D) ---
  function initDesafioAS(substancias) {
    // Alternar entre Quiz e Flashcards
    const viewBtns = document.querySelectorAll('[data-study-view]');
    const quizView = document.getElementById('study-quiz-view');
    const fcView = document.getElementById('study-flashcards-view');

    viewBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-study-view');
        viewBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (quizView) quizView.hidden = view !== 'quiz';
        if (fcView) fcView.hidden = view !== 'flashcards';
      });
    });

    // Banco base de questões + questões dinâmicas geradas das substâncias reais do 1º INF
    const baseQuestions = [
      {
        topic: 'Teoria de Arrhenius',
        q: 'Segundo Arrhenius, o que caracteriza uma BASE em solução aquosa?',
        options: [
          'Libera como único ânion o íon hidróxido (OH⁻)',
          'Libera como único cátion o íon hidrogênio (H⁺)',
          'É sempre um composto binário com oxigênio',
          'Não conduz corrente elétrica em hipótese alguma'
        ],
        correct: 0,
        explain: 'Bases de Arrhenius sofrem dissociação iônica em água liberando exclusivamente o ânion OH⁻.'
      },
      {
        topic: 'Segurança Química',
        q: 'Por que o projeto AQUI TEM QUÍMICA! proíbe misturar água sanitária (NaClO) com vinagre ou limpa-pedras?',
        options: [
          'Porque apenas neutraliza o cheiro sem efeito algum',
          'Porque a reação libera gás cloro (Cl₂), altamente tóxico às vias respiratórias',
          'Porque transforma o líquido em cloreto de sódio sólido imediato',
          'Porque a mistura congela instantaneamente'
        ],
        correct: 1,
        explain: 'O meio ácido desloca o equilíbrio do hipoclorito (ClO⁻) formando gás cloro (Cl₂), gás sufocante e perigoso.'
      },
      {
        topic: 'Óxidos na Escola',
        q: 'O óxido de zinco (ZnO), presente na pasta térmica do Laboratório de Informática, reage tanto com HCl quanto com NaOH. Como ele é classificado?',
        options: ['Óxido neutro', 'Óxido ácido', 'Óxido anfótero', 'Peróxido'],
        correct: 2,
        explain: 'Óxidos anfóteros (como ZnO e Al₂O₃) reagem tanto com ácidos fortes quanto com bases fortes, formando sal e água.'
      },
      {
        topic: 'Condutividade de Sais',
        q: 'Por que o cloreto de sódio (NaCl) conduz corrente elétrica dissolvido em água, mas não no estado sólido?',
        options: [
          'Porque a água cria elétrons livres no metal sódio',
          'Porque no sólido os íons estão presos no retículo cristalino; em água ficam livres para migrar',
          'Porque o NaCl é um composto molecular covalente',
          'Porque o sal evapora ao encostar nos eletrodos'
        ],
        correct: 1,
        explain: 'Condução eletrolítica exige cargas livres em movimento — o que só acontece com o sal dissolvido em água ou fundido.'
      },
      {
        topic: 'Indicadores Ácido-Base',
        q: 'Ao gotejar fenolftaleína em uma solução de hidróxido de sódio (pH > 10), qual cor aparece?',
        options: ['Amarelo vivo', 'Incolor', 'Rosa-magenta intenso', 'Verde-esmeralda'],
        correct: 2,
        explain: 'A fenolftaleína é incolor em meios ácidos/neutros e torna-se rosa-magenta em meios básicos (pH > 8,2).'
      },
      {
        topic: 'Neutralização',
        q: 'Qual é o produto da reação de neutralização total entre HCl(aq) e NaOH(aq)?',
        options: ['NaCl(aq) + H₂O(l)', 'NaH(s) + ClOH(aq)', 'Na₂O(s) + H₂(g)', 'Cl₂(g) + NaOH(aq)'],
        correct: 0,
        explain: 'Ácido + Base → Sal + Água: o cátion da base (Na⁺) une-se ao ânion do ácido (Cl⁻) e H⁺ + OH⁻ formam H₂O.'
      }
    ];

    const dynamicQuestions = substancias.slice(0, 2).map((s) => ({
      topic: `Plaquinha 1º INF (${s.grupo})`,
      q: `A substância ${s.nomeIupac} (${s.formula}), mapeada pela turma do 1º INF, pertence a qual função inorgânica?`,
      options: ['Ácido', 'Base', 'Sal', 'Óxido'],
      correct: ['Ácido', 'Base', 'Sal', 'Óxido'].indexOf(s.classe),
      explain: `${s.nomeIupac} (${s.formula}) é um(a) ${App.getDisplayClasse(s)}: ${s.justificativa}`
    })).filter((q) => q.correct >= 0);

    const questions = [...baseQuestions, ...dynamicQuestions];
    let qIndex = 0;
    let streak = 0;
    let score = 0;
    let timerId = null;
    let secondsLeft = 25;
    let answered = false;

    const progressEl = document.getElementById('quiz-progress');
    const progressBar = document.getElementById('quiz-progress-bar');
    const timerEl = document.getElementById('quiz-timer');
    const topicBadge = document.getElementById('quiz-topic-badge');
    const questionText = document.getElementById('quiz-question-text');
    const optionsWrap = document.getElementById('quiz-options');
    const feedbackEl = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');
    const restartBtn = document.getElementById('quiz-restart-btn');
    const streakEl = document.getElementById('quiz-streak');

    function stopTimer() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    function renderQuestion() {
      stopTimer();
      answered = false;
      secondsLeft = 25;

      const item = questions[qIndex];
      if (!item) return;

      if (progressEl) progressEl.textContent = `Questão ${qIndex + 1} de ${questions.length}`;
      if (progressBar) progressBar.style.width = `${((qIndex + 1) / questions.length) * 100}%`;
      if (topicBadge) {
        topicBadge.textContent = item.topic;
        topicBadge.className = 'badge badge-base';
      }
      if (questionText) questionText.textContent = item.q;
      if (feedbackEl) feedbackEl.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      if (restartBtn) restartBtn.hidden = true;
      if (timerEl) timerEl.textContent = `⏱️ ${secondsLeft}s`;

      if (optionsWrap) {
        optionsWrap.innerHTML = item.options.map((opt, idx) => `
          <button type="button" class="quiz-option-btn" data-opt-idx="${idx}">${App.escapeHtml(opt)}</button>
        `).join('');

        optionsWrap.querySelectorAll('.quiz-option-btn').forEach((btn) => {
          btn.addEventListener('click', () => handleAnswer(Number(btn.getAttribute('data-opt-idx'))));
        });
      }

      timerId = setInterval(() => {
        const panel = document.getElementById('desafio-as');
        if (!panel || panel.hidden || (quizView && quizView.hidden)) return;
        secondsLeft -= 1;
        if (timerEl) timerEl.textContent = `⏱️ ${secondsLeft}s`;
        if (secondsLeft <= 0) {
          handleAnswer(-1);
        }
      }, 1000);
    }

    function handleAnswer(selectedIdx) {
      if (answered) return;
      answered = true;
      stopTimer();

      const item = questions[qIndex];
      const btns = optionsWrap ? optionsWrap.querySelectorAll('.quiz-option-btn') : [];
      btns.forEach((b, idx) => {
        b.disabled = true;
        if (idx === item.correct) b.classList.add('correct');
        else if (idx === selectedIdx) b.classList.add('wrong');
      });

      const isRight = selectedIdx === item.correct;
      if (isRight) {
        score += 1;
        streak += 1;
        const gained = 25 + Math.min(20, secondsLeft);
        App.addXP(gained);
        if (feedbackEl) {
          feedbackEl.innerHTML = `<strong>✓ Acertou! (+${gained} XP)</strong> ${App.escapeHtml(item.explain)}`;
        }
      } else {
        streak = 0;
        if (feedbackEl) {
          const prefix = selectedIdx === -1 ? '⏱️ Tempo esgotado!' : '✕ Quase lá!';
          feedbackEl.innerHTML = `<strong>${prefix}</strong> ${App.escapeHtml(item.explain)}`;
        }
      }

      if (streakEl) streakEl.textContent = `${streak} 🔥`;
      if (feedbackEl) feedbackEl.hidden = false;

      if (qIndex < questions.length - 1) {
        if (nextBtn) nextBtn.hidden = false;
      } else {
        if (questionText) questionText.textContent = `Desafio AS concluído! Você acertou ${score} de ${questions.length} questões.`;
        if (restartBtn) restartBtn.hidden = false;
      }
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        qIndex += 1;
        renderQuestion();
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        qIndex = 0;
        score = 0;
        streak = 0;
        if (streakEl) streakEl.textContent = '0 🔥';
        renderQuestion();
      });
    }

    renderQuestion();

    // Flashcards 3D
    const flashcards = [
      { badge: 'Ácido', cls: 'badge-acido', front: 'O que é um Ácido segundo Arrhenius?', back: 'Substância molecular que, em solução aquosa, sofre ionização liberando exclusivamente o cátion H⁺ (ou H₃O⁺).' },
      { badge: 'Base', cls: 'badge-base', front: 'O que é uma Base segundo Arrhenius?', back: 'Substância que, dissolvida em água, sofre dissociação iônica liberando como único ânion a hidroxila (OH⁻).' },
      { badge: 'Sal', cls: 'badge-sal', front: 'Como identificar um Sal em solução aquosa?', back: 'Composto iônico que libera ao menos um cátion diferente de H⁺ e um ânion diferente de OH⁻ (ex.: NaCl → Na⁺ + Cl⁻).' },
      { badge: 'Óxido', cls: 'badge-oxido', front: 'Por que OF₂ NÃO é um óxido, mas CO₂ e Fe₂O₃ são?', back: 'Óxidos são compostos binários onde o oxigênio é o elemento MAIS eletronegativo. O flúor é mais eletronegativo que o oxigênio.' },
      { badge: 'Óxido Anfótero', cls: 'badge-oxido', front: 'Como se comporta um Óxido Anfótero (ex.: ZnO, Al₂O₃)?', back: 'Age como base diante de um ácido forte e como ácido diante de uma base forte, formando sal e água em ambos os casos.' },
      { badge: 'Segurança', cls: 'badge-acido', front: 'Por que nunca misturar Água Sanitária (NaClO) com Vinagre?', back: 'O ácido reage com o hipoclorito liberando gás cloro (Cl₂), altamente tóxico e corrosivo para as vias aéreas.' },
      ...substancias.map((s) => ({
        badge: App.getDisplayClasse(s),
        cls: `badge-${App.getClassSlug(s.classe)}`,
        front: `${s.nomeIupac} (${s.formula}) — Por que está presente na nossa escola?`,
        back: s.porQueEstaAqui
      }))
    ];

    let fcIndex = 0;
    const fcCard = document.getElementById('flashcard-card');
    const fcBadge = document.getElementById('fc-badge');
    const fcFront = document.getElementById('fc-front-text');
    const fcBack = document.getElementById('fc-back-text');
    const fcCounter = document.getElementById('fc-counter');
    const fcPrev = document.getElementById('fc-prev');
    const fcNext = document.getElementById('fc-next');

    function renderFlashcard() {
      const card = flashcards[fcIndex];
      if (!card) return;
      if (fcCard) fcCard.classList.remove('is-flipped');
      if (fcBadge) {
        fcBadge.textContent = card.badge;
        fcBadge.className = `badge ${card.cls}`;
      }
      if (fcFront) fcFront.textContent = card.front;
      if (fcBack) fcBack.textContent = card.back;
      if (fcCounter) fcCounter.textContent = `${fcIndex + 1} / ${flashcards.length}`;
    }

    if (fcCard) {
      fcCard.addEventListener('click', () => fcCard.classList.toggle('is-flipped'));
    }
    if (fcPrev) {
      fcPrev.addEventListener('click', () => {
        fcIndex = (fcIndex - 1 + flashcards.length) % flashcards.length;
        renderFlashcard();
      });
    }
    if (fcNext) {
      fcNext.addEventListener('click', () => {
        fcIndex = (fcIndex + 1) % flashcards.length;
        renderFlashcard();
      });
    }

    renderFlashcard();
  }

  // =========================================================================
  // ROTEADOR DE INICIALIZAÇÃO POR PÁGINA
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page');
    switch (page) {
      case 'home':
        initHomePage();
        break;
      case 'classes':
        initClassesPage();
        break;
      case 'substancia':
        initSubstanciaPage();
        break;
      case 'mapa':
        initMapaPage();
        break;
      case 'laboratorio':
        initLaboratorioPage();
        break;
      default:
        break;
    }
  });
})();