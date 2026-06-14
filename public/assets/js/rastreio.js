(function () {
  'use strict';

  /* ── SVG icons ───────────────────────────────────────────── */
  var ICONS = {
    ENTREGUE:     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    SAIU_ENTREGA: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
    TRANSFERENCIA:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3 5 6.99h3V14h2V6.99h3L9 3z"/></svg>',
    POSTADO:      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5v-3h3.56c.69 1.19 1.97 2 3.45 2s2.75-.81 3.45-2H19v3zm0-5h-4.99c0 1.1-.9 2-2 2s-2-.9-2-2H5V5h14v9z"/></svg>',
    ETIQUETA:     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z"/></svg>'
  };
  ICONS.OUTRO = ICONS.POSTADO;

  var DOT_CLS = {
    ENTREGUE:'d-green', SAIU_ENTREGA:'d-orange', TRANSFERENCIA:'d-blue',
    POSTADO:'d-blue', ETIQUETA:'d-gray'
  };
  var BADGE_CLS = {
    ENTREGUE:'b-green', SAIU_ENTREGA:'b-orange', TRANSFERENCIA:'b-blue',
    POSTADO:'b-blue', ETIQUETA:'b-gray'
  };
  var STATUS_LABEL = {
    ENTREGUE:'Entregue', SAIU_ENTREGA:'Saiu para entrega',
    TRANSFERENCIA:'Em trânsito', POSTADO:'Postado', ETIQUETA:'Etiqueta emitida'
  };

  /* ── CPF helpers ─────────────────────────────────────────── */
  function mascaraCpf(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    return v;
  }

  function normalizarCpf(v) {
    return v.replace(/\D/g, '');
  }

  function validarCPF(cpf) {
    cpf = String(cpf).replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    var soma = 0;
    for (var i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
    var r = soma % 11;
    if ((r < 2 ? 0 : 11 - r) !== parseInt(cpf[9])) return false;
    soma = 0;
    for (var j = 0; j < 10; j++) soma += parseInt(cpf[j]) * (11 - j);
    r = soma % 11;
    return (r < 2 ? 0 : 11 - r) === parseInt(cpf[10]);
  }

  function setCpfError(msg) {
    var el = document.getElementById('cpf-error');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('hidden', !msg);
  }

  function getCpfFromURL() {
    var p = new URLSearchParams(window.location.search);
    return normalizarCpf(p.get('cpf') || '');
  }

  /* ── Escaping ────────────────────────────────────────────── */
  function esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── State machine ───────────────────────────────────────── */
  function setState(id) {
    ['state-idle','state-loading','state-error','state-result'].forEach(function(s) {
      var el = document.getElementById(s);
      if (el) el.classList.toggle('hidden', s !== id);
    });
  }

  /* ── Render helpers ──────────────────────────────────────── */
  function renderBadge(tipo) {
    var cls = BADGE_CLS[tipo] || 'b-gray';
    var lbl = STATUS_LABEL[tipo] || 'Em processamento';
    var ico = ICONS[tipo] || ICONS.OUTRO;
    return '<span class="badge ' + cls + '">' + ico + esc(lbl) + '</span>';
  }

  function renderEvento(ev) {
    var dotCls = DOT_CLS[ev.tipo] || 'd-gray';
    var ico    = ICONS[ev.tipo] || ICONS.OUTRO;
    var det    = ev.detalhe ? '<p class="ev-detail">' + esc(ev.detalhe) + '</p>' : '';
    return '<li class="ev">' +
      '<div class="ev-dot-col">' +
        '<div class="ev-dot ' + dotCls + '">' + ico + '</div>' +
        '<div class="ev-line"></div>' +
      '</div>' +
      '<div class="ev-body">' +
        '<p class="ev-title">' + esc(ev.descricao) + '</p>' +
        '<p class="ev-local">' + esc(ev.local) + '</p>' +
        det +
        '<p class="ev-date">' + esc(ev.dataHora) + '</p>' +
      '</div>' +
    '</li>';
  }

  function renderEncomenda(dados) {
    var ultimo   = dados.eventos && dados.eventos[0];
    var badge    = ultimo ? renderBadge(ultimo.tipo) : '';
    var eventos  = (dados.eventos || []).map(renderEvento).join('');

    return '<div class="encomenda-wrap">' +
      '<div class="pkg-card">' +
        '<div class="pkg-grid">' +
          '<div class="pkg-meta">' +
            '<div class="pkg-field"><label>Código de rastreio</label>' +
              '<span class="pkg-code-val">' + esc(dados.codigo) + '</span></div>' +
            '<div class="pkg-field"><label>Serviço</label>' +
              '<span class="pkg-service-val">' + esc(dados.servico) + '</span></div>' +
          '</div>' +
          '<div><p class="pkg-status-label">Status</p>' + badge + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="timeline-card">' +
        '<p class="timeline-heading">Histórico de movimentações</p>' +
        '<ul class="timeline-list">' + eventos + '</ul>' +
      '</div>' +
    '</div>';
  }

  /* ── Result rendering ────────────────────────────────────── */
  function preencherResultado(data) {
    var encomendas = data.encomendas || [];
    var container  = document.getElementById('encomendas-container');
    var html = '';

    if (encomendas.length > 1) {
      html += '<p class="orders-label">' + encomendas.length + ' encomendas encontradas</p>';
    }
    encomendas.forEach(function(d) { html += renderEncomenda(d); });

    container.innerHTML = html;
    document.title = encomendas.length > 1
      ? 'RastroFácil — ' + encomendas.length + ' encomendas'
      : 'RastroFácil — ' + (encomendas[0] ? encomendas[0].codigo : 'Resultado');

    setState('state-result');
  }

  /* ── API call ────────────────────────────────────────────── */
  function buscar(cpf) {
    setState('state-loading');
    fetch('/api/rastreio/cpf/' + encodeURIComponent(cpf))
      .then(function(r) {
        if (!r.ok) return r.json().then(function(b) { throw new Error(b.erro || 'Erro ' + r.status); });
        return r.json();
      })
      .then(preencherResultado)
      .catch(function(err) {
        var el = document.getElementById('error-msg-text');
        if (el) el.textContent = err.message;
        setState('state-error');
      });
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    var form  = document.getElementById('search-form');
    var input = document.getElementById('cpf-input');

    if (input) {
      input.addEventListener('input', function() {
        var sel = this.selectionStart;
        var prev = this.value.length;
        this.value = mascaraCpf(this.value);
        var diff = this.value.length - prev;
        this.setSelectionRange(sel + diff, sel + diff);
        setCpfError('');
      });
    }

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var cpf = input ? normalizarCpf(input.value) : '';
        if (!validarCPF(cpf)) {
          setCpfError('CPF inválido. Verifique os dígitos e tente novamente.');
          return;
        }
        setCpfError('');
        var url = new URL(window.location.href);
        url.searchParams.set('cpf', cpf);
        window.history.pushState({}, '', url);
        buscar(cpf);
      });
    }

    var cpf = getCpfFromURL();
    if (validarCPF(cpf)) {
      if (input) input.value = mascaraCpf(cpf);
      buscar(cpf);
    } else {
      setState('state-idle');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
