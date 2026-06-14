(function () {
  'use strict';

  /* ── SVG icons for each event type ───────────────────────── */
  var ICONS = {
    ENTREGUE: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    SAIU_ENTREGA: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
    TRANSFERENCIA: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3 5 6.99h3V14h2V6.99h3L9 3z"/></svg>',
    POSTADO: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5v-3h3.56c.69 1.19 1.97 2 3.45 2s2.75-.81 3.45-2H19v3zm0-5h-4.99c0 1.1-.9 2-2 2s-2-.9-2-2H5V5h14v9z"/></svg>',
    ETIQUETA: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z"/></svg>'
  };
  ICONS.OUTRO = ICONS.POSTADO;

  var DOT_CLS = {
    ENTREGUE:     'd-green',
    SAIU_ENTREGA: 'd-orange',
    TRANSFERENCIA:'d-blue',
    POSTADO:      'd-blue',
    ETIQUETA:     'd-gray'
  };

  var BADGE_CLS = {
    ENTREGUE:     'b-green',
    SAIU_ENTREGA: 'b-orange',
    TRANSFERENCIA:'b-blue',
    POSTADO:      'b-blue',
    ETIQUETA:     'b-gray'
  };

  var STATUS_LABEL = {
    ENTREGUE:     'Entregue',
    SAIU_ENTREGA: 'Saiu para entrega',
    TRANSFERENCIA:'Em trânsito',
    POSTADO:      'Postado',
    ETIQUETA:     'Etiqueta emitida'
  };

  function getCodigoFromURL() {
    var p = new URLSearchParams(window.location.search);
    return (p.get('codigo') || '').trim().toUpperCase() || null;
  }

  function esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function setState(id) {
    ['state-idle', 'state-loading', 'state-error', 'state-result'].forEach(function (s) {
      var el = document.getElementById(s);
      if (el) el.classList.toggle('hidden', s !== id);
    });
  }

  function renderBadge(tipo) {
    var cls = BADGE_CLS[tipo] || 'b-gray';
    var lbl = STATUS_LABEL[tipo] || 'Em processamento';
    var ico = ICONS[tipo] || ICONS.OUTRO;
    return '<span class="badge ' + cls + '">' + ico + esc(lbl) + '</span>';
  }

  function criarEvento(ev) {
    var li = document.createElement('li');
    li.className = 'ev';

    var dotCls = DOT_CLS[ev.tipo] || 'd-gray';
    var ico    = ICONS[ev.tipo] || ICONS.OUTRO;

    var detalheHtml = ev.detalhe
      ? '<p class="ev-detail">' + esc(ev.detalhe) + '</p>'
      : '';

    li.innerHTML =
      '<div class="ev-dot-col">' +
        '<div class="ev-dot ' + dotCls + '">' + ico + '</div>' +
        '<div class="ev-line"></div>' +
      '</div>' +
      '<div class="ev-body">' +
        '<p class="ev-title">' + esc(ev.descricao) + '</p>' +
        '<p class="ev-local">' + esc(ev.local) + '</p>' +
        detalheHtml +
        '<p class="ev-date">' + esc(ev.dataHora) + '</p>' +
      '</div>';

    return li;
  }

  function preencherResultado(dados) {
    var elCodigo  = document.getElementById('rastreio-codigo');
    var elServico = document.getElementById('rastreio-servico');
    var elStatus  = document.getElementById('pkg-status');
    var ul        = document.getElementById('ship-steps');

    if (elCodigo)  elCodigo.textContent = dados.codigo;
    if (elServico) elServico.textContent = dados.servico;

    var ultimo = dados.eventos && dados.eventos[0];
    if (elStatus && ultimo) elStatus.innerHTML = renderBadge(ultimo.tipo);

    document.title = 'RastroFácil — ' + dados.codigo;

    if (ul) {
      ul.innerHTML = '';
      (dados.eventos || []).forEach(function (ev) {
        ul.appendChild(criarEvento(ev));
      });
    }

    setState('state-result');
  }

  function buscar(codigo) {
    setState('state-loading');
    fetch('/api/rastreio/' + encodeURIComponent(codigo))
      .then(function (r) {
        if (!r.ok) return r.json().then(function (b) { throw new Error(b.erro || 'Erro ' + r.status); });
        return r.json();
      })
      .then(preencherResultado)
      .catch(function (err) {
        var el = document.getElementById('error-msg-text');
        if (el) el.textContent = err.message;
        setState('state-error');
      });
    }

  function init() {
    var form  = document.getElementById('search-form');
    var input = document.getElementById('objeto');

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var val = input ? input.value.trim().toUpperCase() : '';
        if (!val) return;
        var url = new URL(window.location.href);
        url.searchParams.set('codigo', val);
        window.history.pushState({}, '', url);
        buscar(val);
      });
    }

    var codigo = getCodigoFromURL();
    if (codigo) {
      if (input) input.value = codigo;
      buscar(codigo);
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
