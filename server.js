'use strict';

const express = require('express');
const path    = require('path');

const PORT = process.env.PORT || 3000;

// ---- Armazenamento: Upstash Redis em produção, Map em memória localmente ----

const _mem = new Map();
let _redis = null;

function getRedis() {
  if (!_redis) {
    const { Redis } = require('@upstash/redis');
    _redis = Redis.fromEnv();
  }
  return _redis;
}

async function storageGet(key) {
  if (process.env.UPSTASH_REDIS_REST_URL) return getRedis().get(key);
  return _mem.get(key) ?? null;
}

async function storageSet(key, value) {
  if (process.env.UPSTASH_REDIS_REST_URL) await getRedis().set(key, value);
  else _mem.set(key, value);
}

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

const PREFIXO_SERVICO = { SEDEX: 'AD', PAC: 'PM', SEDEX10: 'AR', SEDEX12: 'AK' };

function gerarCodigoCorreios(servico) {
  const pref = PREFIXO_SERVICO[servico.toUpperCase()] || 'AD';
  const nums = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
  const check = nums.reduce((a, b) => a + b, 0) % 10;
  return `${pref}${nums.join('')}${check}BR`;
}

// ---- Montagem automática do cronograma ----

function montarConfig(servico, origem, destino, dias) {
  const O = origem.toUpperCase();
  const D = destino.toUpperCase();
  const ufDestino = D.includes(' - ') ? D.split(' - ').pop().trim() : '';
  const cidDest   = D.includes(' - ') ? D.split(' - ')[0].trim() : D;

  const H = {
    etiqueta: '14:30', postado: '09:45', transf1: '17:20',
    transf2:  '02:15', transf3: '05:50', saiu:    '08:30', entregue: '15:10',
  };

  const base = [
    { dia: 0, hora: H.etiqueta, tipo: 'ETIQUETA',
      descricao: 'Etiqueta emitida.', local: 'BR',
      detalhe: 'Aguardando postagem pelo remetente' },
    { dia: 1, hora: H.postado, tipo: 'POSTADO',
      descricao: 'Objeto postado.', local: origem },
  ];

  if (dias <= 4) {
    base.push(
      { dia: 2, hora: H.transf1, tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: `de Agência dos Correios, ${O} para Unidade de Distribuição, ${D}` },
      { dia: dias - 1, hora: H.saiu, tipo: 'SAIU_ENTREGA',
        descricao: 'Objeto saiu para entrega ao destinatário.', local: destino,
        detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
      { dia: dias, hora: H.entregue, tipo: 'ENTREGUE',
        descricao: 'Objeto entregue ao destinatário.',
        local: `Pela Unidade de Distribuição, ${D}` }
    );
  } else if (dias <= 8) {
    const d1 = Math.round(dias * 0.30); const d2 = Math.round(dias * 0.60);
    base.push(
      { dia: d1, hora: H.transf1, tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: `de Agência dos Correios, ${O} para Unidade de Tratamento, ${O}` },
      { dia: d2, hora: H.transf2, tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: `de Unidade de Tratamento, ${O} para Unidade de Distribuição, ${D}` },
      { dia: dias - 1, hora: H.saiu, tipo: 'SAIU_ENTREGA',
        descricao: 'Objeto saiu para entrega ao destinatário.', local: destino,
        detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
      { dia: dias, hora: H.entregue, tipo: 'ENTREGUE',
        descricao: 'Objeto entregue ao destinatário.',
        local: `Pela Unidade de Distribuição, ${D}` }
    );
  } else {
    const d1 = Math.round(dias * 0.15); const d2 = Math.round(dias * 0.45);
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
        descricao: 'Objeto saiu para entrega ao destinatário.', local: destino,
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
  const template     = Array.isArray(objeto.config) ? objeto.config : JSON.parse(objeto.config);
  const horaEtiqueta = etiqueta.length > 10 ? etiqueta.substring(11, 16) : null;

  return template
    .filter(ev => ev.dia <= elapsed)
    .slice()
    .reverse()
    .map(ev => {
      const hora = (ev.tipo === 'ETIQUETA' && horaEtiqueta) ? horaEtiqueta : ev.hora;
      return {
        tipo:     ev.tipo,
        descricao: ev.descricao,
        local:    ev.local,
        detalhe:  ev.detalhe || null,
        dataHora: formatarDataEvento(etiqueta, ev.dia, hora)
      };
    });
}

// ---- Dados de exemplo ----

function dadosSeed() {
  function subDias(n, hora) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hora}`;
  }

  return [
    {
      codigo: 'AD509984359BR', servico: 'SEDEX', cpf: '12345678909',
      etiqueta_em: subDias(10, '14:25'),
      config: [
        { dia:  0, hora: '14:25', tipo: 'ETIQUETA',     descricao: 'Etiqueta emitida.',                              local: 'BR',                                             detalhe: 'Aguardando postagem pelo remetente' },
        { dia:  1, hora: '15:38', tipo: 'POSTADO',       descricao: 'Objeto postado.',                               local: 'BELO HORIZONTE - MG' },
        { dia:  2, hora: '16:34', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.',  local: 'de Agência dos Correios, BELO HORIZONTE - MG para Unidade de Tratamento, Belo Horizonte - MG' },
        { dia:  4, hora: '22:08', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.',  local: 'de Unidade de Tratamento, BELO HORIZONTE - MG para Unidade de Tratamento, Aparecida de Goiania - GO' },
        { dia:  7, hora: '04:03', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.',  local: 'de Unidade de Tratamento, APARECIDA DE GOIANIA - GO para Unidade de Distribuição, Aparecida de Goiania - GO' },
        { dia:  9, hora: '10:41', tipo: 'SAIU_ENTREGA',  descricao: 'Objeto saiu para entrega ao destinatário.',    local: 'APARECIDA DE GOIANIA - GO',                      detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
        { dia: 10, hora: '15:29', tipo: 'ENTREGUE',      descricao: 'Objeto entregue ao destinatário.',             local: 'Pela Unidade de Distribuição, APARECIDA DE GOIANIA - GO' },
      ]
    },
    {
      codigo: 'PM123456785BR', servico: 'PAC', cpf: '98765432100',
      etiqueta_em: subDias(6, '09:12'),
      config: [
        { dia:  0, hora: '09:12', tipo: 'ETIQUETA',     descricao: 'Etiqueta emitida.',                             local: 'BR',                                             detalhe: 'Aguardando postagem pelo remetente' },
        { dia:  1, hora: '10:45', tipo: 'POSTADO',       descricao: 'Objeto postado.',                              local: 'CAMPINAS - SP' },
        { dia:  3, hora: '20:15', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Agência dos Correios, CAMPINAS - SP para Unidade de Tratamento, São Paulo - SP' },
        { dia:  5, hora: '23:40', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, SÃO PAULO - SP para Unidade de Tratamento, Recife - PE' },
        { dia:  9, hora: '05:18', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, RECIFE - PE para Unidade de Distribuição, Recife - PE' },
        { dia: 13, hora: '08:30', tipo: 'SAIU_ENTREGA',  descricao: 'Objeto saiu para entrega ao destinatário.',   local: 'RECIFE - PE',                                    detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
        { dia: 14, hora: '13:55', tipo: 'ENTREGUE',      descricao: 'Objeto entregue ao destinatário.',            local: 'Pela Unidade de Distribuição, RECIFE - PE' },
      ]
    },
    {
      codigo: 'DC987654321BR', servico: 'SEDEX', cpf: '11144477735', etiqueta_em: null,
      config: [
        { dia: 0, hora: '11:30', tipo: 'ETIQUETA',     descricao: 'Etiqueta emitida.',                             local: 'BR',                                             detalhe: 'Aguardando postagem pelo remetente' },
        { dia: 1, hora: '08:55', tipo: 'POSTADO',       descricao: 'Objeto postado.',                              local: 'CURITIBA - PR' },
        { dia: 2, hora: '18:20', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Agência dos Correios, CURITIBA - PR para Unidade de Distribuição, Porto Alegre - RS' },
        { dia: 3, hora: '08:15', tipo: 'SAIU_ENTREGA',  descricao: 'Objeto saiu para entrega ao destinatário.',   local: 'PORTO ALEGRE - RS',                              detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
        { dia: 4, hora: '14:22', tipo: 'ENTREGUE',      descricao: 'Objeto entregue ao destinatário.',            local: 'Pela Unidade de Distribuição, PORTO ALEGRE - RS' },
      ]
    },
    {
      codigo: 'RX555444333BR', servico: 'PAC', cpf: '55566677783', etiqueta_em: null,
      config: [
        { dia:  0, hora: '16:40', tipo: 'ETIQUETA',     descricao: 'Etiqueta emitida.',                             local: 'BR',                                            detalhe: 'Aguardando postagem pelo remetente' },
        { dia:  1, hora: '09:30', tipo: 'POSTADO',       descricao: 'Objeto postado.',                              local: 'FORTALEZA - CE' },
        { dia:  3, hora: '21:55', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Agência dos Correios, FORTALEZA - CE para Unidade de Tratamento, Fortaleza - CE' },
        { dia:  7, hora: '02:30', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, FORTALEZA - CE para Unidade de Tratamento, Belém - PA' },
        { dia: 12, hora: '05:45', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, BELÉM - PA para Unidade de Distribuição, Belém - PA' },
        { dia: 14, hora: '09:00', tipo: 'SAIU_ENTREGA',  descricao: 'Objeto saiu para entrega ao destinatário.',   local: 'BELÉM - PA',                                    detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
        { dia: 15, hora: '11:35', tipo: 'ENTREGUE',      descricao: 'Objeto entregue ao destinatário.',            local: 'Pela Unidade de Distribuição, BELÉM - PA' },
      ]
    },
    {
      codigo: 'OB246810121BR', servico: 'SEDEX', cpf: '12345678909', etiqueta_em: null,
      config: [
        { dia: 0, hora: '13:55', tipo: 'ETIQUETA',     descricao: 'Etiqueta emitida.',                             local: 'BR',                                             detalhe: 'Aguardando postagem pelo remetente' },
        { dia: 1, hora: '10:20', tipo: 'POSTADO',       descricao: 'Objeto postado.',                              local: 'CAMPINAS - SP' },
        { dia: 3, hora: '19:10', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Agência dos Correios, CAMPINAS - SP para Unidade de Tratamento, São Paulo - SP' },
        { dia: 5, hora: '03:20', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, SÃO PAULO - SP para Unidade de Distribuição, Rio de Janeiro - RJ' },
        { dia: 6, hora: '09:45', tipo: 'SAIU_ENTREGA',  descricao: 'Objeto saiu para entrega ao destinatário.',   local: 'RIO DE JANEIRO - RJ',                            detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
        { dia: 7, hora: '16:08', tipo: 'ENTREGUE',      descricao: 'Objeto entregue ao destinatário.',            local: 'Pela Unidade de Distribuição, RIO DE JANEIRO - RJ' },
      ]
    },
  ];
}

// ---- Inicialização: popula dados de exemplo se o banco estiver vazio ----

let _seedPromise = null;

async function garantirSeed() {
  if (_seedPromise) return _seedPromise;
  _seedPromise = (async () => {
    const [existeObj, existeCpf] = await Promise.all([
      storageGet('rastreio:AD509984359BR'),
      storageGet('cpf:12345678909')
    ]);
    if (!existeObj || !existeCpf) {
      const lista  = dadosSeed();
      const cpfMap = {};
      for (const obj of lista) {
        await storageSet(`rastreio:${obj.codigo}`, obj);
        if (obj.cpf) {
          if (!cpfMap[obj.cpf]) cpfMap[obj.cpf] = [];
          cpfMap[obj.cpf].push(obj.codigo);
        }
      }
      for (const [cpf, codigos] of Object.entries(cpfMap)) {
        await storageSet(`cpf:${cpf}`, codigos);
      }
      console.log('Dados de exemplo carregados.');
    }
  })().catch(err => console.error('Erro ao carregar seed:', err.message));
  return _seedPromise;
}

garantirSeed();

// ---- Prepara objeto para resposta da API ----

async function preencherRastreio(objeto) {
  if (!objeto.etiqueta_em) {
    objeto.etiqueta_em = agoraMinusDois();
    await storageSet(`rastreio:${objeto.codigo}`, objeto);
  }
  return { codigo: objeto.codigo, servico: objeto.servico, eventos: gerarEventos(objeto) };
}

// ---- Express app ----

const app = express();
app.use(express.json());

app.use(async (_req, _res, next) => {
  await garantirSeed();
  next();
});

const ADMIN_SENHA = process.env.ADMIN_SENHA || 'Rastr0@2026#!';

function autenticarAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Basic ')) {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString();
    const senha   = decoded.split(':').slice(1).join(':');
    if (senha === ADMIN_SENHA) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Rastreio Admin"');
  res.status(401).send('Acesso negado');
}

app.use(express.static(path.join(__dirname, 'public')));

// ── GET: consulta por CPF (rota antes de :codigo para evitar conflito) ───────
app.get('/api/rastreio/cpf/:cpf', async (req, res) => {
  const cpf = req.params.cpf.replace(/\D/g, '');
  if (!/^\d{11}$/.test(cpf)) {
    return res.status(400).json({ erro: 'CPF inválido. Informe os 11 dígitos.' });
  }
  try {
    const codigos = await storageGet(`cpf:${cpf}`);
    if (!codigos || !codigos.length) {
      return res.status(404).json({ erro: 'Nenhuma encomenda encontrada para este CPF.' });
    }
    const encomendas = (await Promise.all(
      codigos.map(async (codigo) => {
        const obj = await storageGet(`rastreio:${codigo}`);
        return obj ? preencherRastreio(obj) : null;
      })
    )).filter(Boolean);
    res.json({ cpf, encomendas });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET: consulta por código (uso interno/admin) ─────────────────────────────
app.get('/api/rastreio/:codigo', async (req, res) => {
  const codigo = req.params.codigo.trim().toUpperCase();
  try {
    const objeto = await storageGet(`rastreio:${codigo}`);
    if (!objeto) {
      return res.status(404).json({ erro: 'Objeto não encontrado. Verifique o código informado.' });
    }
    res.json(await preencherRastreio(objeto));
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── POST: geração de código por venda ────────────────────────────────────────
app.post('/api/rastreio', autenticarAdmin, async (req, res) => {
  const { servico, origem, destino, dias, cpf, config } = req.body || {};
  if (!servico || !origem || !destino || !dias || !cpf) {
    return res.status(400).json({ erro: 'Campos obrigatórios: servico, origem, destino, dias, cpf' });
  }
  const cpfNorm = String(cpf).replace(/\D/g, '');
  if (!/^\d{11}$/.test(cpfNorm)) {
    return res.status(400).json({ erro: 'CPF inválido. Informe os 11 dígitos.' });
  }
  if (!Number.isInteger(Number(dias)) || Number(dias) < 1) {
    return res.status(400).json({ erro: '"dias" deve ser um inteiro positivo' });
  }

  let codigo;
  for (let i = 0; i < 10; i++) {
    const candidato = gerarCodigoCorreios(servico);
    const existe = await storageGet(`rastreio:${candidato}`);
    if (!existe) { codigo = candidato; break; }
  }
  if (!codigo) return res.status(500).json({ erro: 'Não foi possível gerar código único' });

  const cfg = config || montarConfig(servico, origem, destino, Number(dias));
  await storageSet(`rastreio:${codigo}`, {
    codigo,
    servico: servico.toUpperCase(),
    cpf: cpfNorm,
    config: cfg,
    etiqueta_em: null
  });

  const existentes = await storageGet(`cpf:${cpfNorm}`) || [];
  await storageSet(`cpf:${cpfNorm}`, [...existentes, codigo]);

  res.status(201).json({ codigo, cpf: cpfNorm, url: `/rastreio.html?cpf=${cpfNorm}` });
});

// ── Rota amigável ─────────────────────────────────────────────────────────────
app.get('/rastreio/:codigo', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rastreio.html'));
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}
