'use strict';

const express   = require('express');
const initSqlJs = require('sql.js');
const path      = require('path');
const fs        = require('fs');

const PORT    = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database', 'rastreio.db');

// ---- Helpers de data ----

function agoraMinusDois() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - 2);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  const hh   = String(d.getHours()).padStart(2, '0');
  const mi   = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function hojeISO() {
  return agoraMinusDois().substring(0, 10);
}

function diasEntre(dtInicio, isoFim) {
  const d1 = new Date(dtInicio.substring(0, 10) + 'T12:00:00');
  const d2 = new Date(isoFim.substring(0, 10)   + 'T12:00:00');
  return Math.round((d2 - d1) / 86400000);
}

function formatarDataEvento(dtBase, diasOffset, hora) {
  const d = new Date(dtBase.substring(0, 10) + 'T12:00:00');
  d.setDate(d.getDate() + diasOffset);
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy} ${hora}`;
}

// ---- Geração de código no formato Correios ----

// Prefixo real por serviço: SEDEX=AD, PAC=PM, SEDEX10=AR, SEDEX12=AK
const PREFIXO_SERVICO = { SEDEX: 'AD', PAC: 'PM', SEDEX10: 'AR', SEDEX12: 'AK' };

function gerarCodigoCorreios(servico) {
  const pref = PREFIXO_SERVICO[servico.toUpperCase()] || 'AD';
  // 8 dígitos aleatórios + dígito verificador simples (mod 10 da soma)
  const nums = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
  const check = nums.reduce((a, b) => a + b, 0) % 10;
  return `${pref}${nums.join('')}${check}BR`;
}

// ---- Montagem automática do cronograma de eventos ----

function montarConfig(servico, origem, destino, dias) {
  const O = origem.toUpperCase();
  const D = destino.toUpperCase();

  // Identifica estado de destino para nomear centros de triagem
  const ufDestino = D.includes(' - ') ? D.split(' - ').pop().trim() : '';
  const cidDest   = D.includes(' - ') ? D.split(' - ')[0].trim() : D;

  // Horários fixos realistas por tipo de evento
  const H = {
    etiqueta:    '14:30',
    postado:     '09:45',
    transf1:     '17:20',
    transf2:     '02:15',
    transf3:     '05:50',
    saiu:        '08:30',
    entregue:    '15:10',
  };

  const base = [
    { dia: 0, hora: H.etiqueta, tipo: 'ETIQUETA',
      descricao: 'Etiqueta emitida.',
      local: 'BR',
      detalhe: 'Aguardando postagem pelo remetente' },
    { dia: 1, hora: H.postado, tipo: 'POSTADO',
      descricao: 'Objeto postado.',
      local: origem },
  ];

  if (dias <= 4) {
    // Rota curta: 1 transferência direta
    base.push(
      { dia: 2, hora: H.transf1, tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: `de Agência dos Correios, ${O} para Unidade de Distribuição, ${D}` },
      { dia: dias - 1, hora: H.saiu, tipo: 'SAIU_ENTREGA',
        descricao: 'Objeto saiu para entrega ao destinatário.',
        local: destino,
        detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
      { dia: dias, hora: H.entregue, tipo: 'ENTREGUE',
        descricao: 'Objeto entregue ao destinatário.',
        local: `Pela Unidade de Distribuição, ${D}` }
    );
  } else if (dias <= 8) {
    // Rota média: 2 transferências
    const d1 = Math.round(dias * 0.30);
    const d2 = Math.round(dias * 0.60);
    base.push(
      { dia: d1, hora: H.transf1, tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: `de Agência dos Correios, ${O} para Unidade de Tratamento, ${O}` },
      { dia: d2, hora: H.transf2, tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: `de Unidade de Tratamento, ${O} para Unidade de Distribuição, ${D}` },
      { dia: dias - 1, hora: H.saiu, tipo: 'SAIU_ENTREGA',
        descricao: 'Objeto saiu para entrega ao destinatário.',
        local: destino,
        detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
      { dia: dias, hora: H.entregue, tipo: 'ENTREGUE',
        descricao: 'Objeto entregue ao destinatário.',
        local: `Pela Unidade de Distribuição, ${D}` }
    );
  } else {
    // Rota longa: 3 transferências com centro intermediário
    const d1 = Math.round(dias * 0.15);
    const d2 = Math.round(dias * 0.45);
    const d3 = Math.round(dias * 0.75);
    const ut  = ufDestino ? `Unidade de Tratamento, ${cidDest} - ${ufDestino}` : `Unidade de Tratamento, ${D}`;
    base.push(
      { dia: d1, hora: H.transf1, tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: `de Agência dos Correios, ${O} para Unidade de Tratamento, ${O}` },
      { dia: d2, hora: H.transf2, tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: `de Unidade de Tratamento, ${O} para ${ut}` },
      { dia: d3, hora: H.transf3, tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: `de ${ut} para Unidade de Distribuição, ${D}` },
      { dia: dias - 1, hora: H.saiu, tipo: 'SAIU_ENTREGA',
        descricao: 'Objeto saiu para entrega ao destinatário.',
        local: destino,
        detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
      { dia: dias, hora: H.entregue, tipo: 'ENTREGUE',
        descricao: 'Objeto entregue ao destinatário.',
        local: `Pela Unidade de Distribuição, ${D}` }
    );
  }

  return base;
}

// ---- Geração dinâmica de eventos ----

function gerarEventos(objeto) {
  const etiqueta = objeto.etiqueta_em;
  if (!etiqueta) return [];

  const elapsed      = diasEntre(etiqueta, hojeISO());
  const template     = JSON.parse(objeto.config);
  const npsUrl       = `https://survey3.medallia.com/?correios-nps-sms-sro&obj=${objeto.codigo}`;
  const npsTexto     = `Nossa entrega atendeu às suas expectativas? Conte pra gente: ${npsUrl}`;
  const horaEtiqueta = etiqueta.length > 10 ? etiqueta.substring(11, 16) : null;

  return template
    .filter(ev => ev.dia <= elapsed)
    .slice()
    .reverse()
    .map(ev => {
      const hora = (ev.tipo === 'ETIQUETA' && horaEtiqueta) ? horaEtiqueta : ev.hora;
      return {
        tipo:       ev.tipo,
        descricao:  ev.descricao,
        local:      ev.local,
        detalhe:    ev.tipo === 'ENTREGUE' ? npsTexto : (ev.detalhe || null),
        detalheUrl: ev.tipo === 'ENTREGUE' ? npsUrl   : null,
        dataHora:   formatarDataEvento(etiqueta, ev.dia, hora)
      };
    });
}

// ---- Servidor ----

async function main() {
  const SQL = await initSqlJs();
  const app = express();

  app.use(express.json());

  // ── Proteção da área administrativa ──────────────────────────────────────
  const ADMIN_SENHA = process.env.ADMIN_SENHA || 'admin123';

  function autenticarAdmin(req, res, next) {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Basic ')) {
      const decoded = Buffer.from(auth.slice(6), 'base64').toString();
      const senha   = decoded.split(':').slice(1).join(':'); // tudo após o primeiro ":"
      if (senha === ADMIN_SENHA) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Rastreio Admin"');
    res.status(401).send('Acesso negado');
  }

  // Rota de admin interceptada ANTES do express.static
  app.get('/admin.html', autenticarAdmin, (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });

  app.use(express.static(path.join(__dirname, 'public')));

  function carregarDB() {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Banco não encontrado em "${DB_PATH}". Execute: npm run seed`);
    }
    return new SQL.Database(fs.readFileSync(DB_PATH));
  }

  function salvarDB(db) {
    fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  }

  // ── GET: consulta pública (cliente) ──────────────────────────────────────
  app.get('/api/rastreio/:codigo', (req, res) => {
    const codigo = req.params.codigo.trim().toUpperCase();
    let db;
    try { db = carregarDB(); } catch (err) {
      return res.status(503).json({ erro: err.message });
    }

    try {
      const stmt = db.prepare('SELECT codigo, servico, config, etiqueta_em FROM objetos WHERE codigo = ?');
      stmt.bind([codigo]);
      const objeto = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();

      if (!objeto) {
        return res.status(404).json({ erro: 'Objeto não encontrado. Verifique o código informado.' });
      }

      if (!objeto.etiqueta_em) {
        const dt = agoraMinusDois();
        db.run('UPDATE objetos SET etiqueta_em = ? WHERE codigo = ?', [dt, codigo]);
        salvarDB(db);
        objeto.etiqueta_em = dt;
      }

      res.json({
        codigo:  objeto.codigo,
        servico: objeto.servico,
        eventos: gerarEventos(objeto)
      });

    } finally {
      db.close();
    }
  });

  // ── POST: geração de código por venda (backend da loja) ──────────────────
  //
  //  Body (JSON):
  //    servico  – "SEDEX" | "PAC" | "SEDEX10" | "SEDEX12"   (obrigatório)
  //    origem   – "BELO HORIZONTE - MG"                       (obrigatório)
  //    destino  – "SÃO PAULO - SP"                            (obrigatório)
  //    dias     – número inteiro de dias de trânsito           (obrigatório)
  //    config   – array de eventos customizado                 (opcional)
  //
  //  Resposta: { codigo, url }
  app.post('/api/rastreio', autenticarAdmin, (req, res) => {
    const { servico, origem, destino, dias, config } = req.body || {};

    if (!servico || !origem || !destino || !dias) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: servico, origem, destino, dias'
      });
    }
    if (!Number.isInteger(Number(dias)) || Number(dias) < 1) {
      return res.status(400).json({ erro: '"dias" deve ser um inteiro positivo' });
    }

    let db;
    try { db = carregarDB(); } catch (err) {
      return res.status(503).json({ erro: err.message });
    }

    try {
      // Gera código único
      let codigo;
      let tentativas = 0;
      do {
        codigo = gerarCodigoCorreios(servico);
        const chk = db.prepare('SELECT 1 FROM objetos WHERE codigo = ?');
        chk.bind([codigo]);
        const existe = chk.step();
        chk.free();
        if (!existe) break;
      } while (++tentativas < 10);

      const cfg = config
        ? JSON.stringify(config)
        : JSON.stringify(montarConfig(servico, origem, destino, Number(dias)));

      db.run(
        'INSERT INTO objetos (codigo, servico, config, etiqueta_em) VALUES (?, ?, ?, NULL)',
        [codigo, servico.toUpperCase(), cfg]
      );
      salvarDB(db);

      res.status(201).json({
        codigo,
        url: `/rastreio.html?codigo=${codigo}`
      });

    } finally {
      db.close();
    }
  });

  app.get('/rastreio/:codigo', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'rastreio.html'));
  });

  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Exemplo: http://localhost:${PORT}/rastreio.html?codigo=AD509984359BR`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
