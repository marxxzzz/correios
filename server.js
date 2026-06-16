'use strict';

const express = require('express');
const path    = require('path');

const PORT = process.env.PORT || 3000;

// ---- Armazenamento ----

const _mem = new Map();
let _redis = null;

function getRedis() {
  if (!_redis) {
    const { Redis } = require('@upstash/redis');
    _redis = new Redis({
      url:   process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

function temRedis() {
  return !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
}

async function storageGet(key) {
  if (temRedis()) return getRedis().get(key);
  return _mem.get(key) ?? null;
}

async function storageSet(key, value) {
  if (temRedis()) await getRedis().set(key, value);
  else _mem.set(key, value);
}

// ---- Helpers de data ----

function agoraMinusDois() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - 2);
  const brt = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const yyyy = brt.getFullYear();
  const mm   = String(brt.getMonth() + 1).padStart(2, '0');
  const dd   = String(brt.getDate()).padStart(2, '0');
  const hh   = String(brt.getHours()).padStart(2, '0');
  const mi   = String(brt.getMinutes()).padStart(2, '0');
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

// ---- Validação de CPF (Receita Federal) ----

function validarCPF(cpf) {
  cpf = String(cpf).replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let r = soma % 11;
  if ((r < 2 ? 0 : 11 - r) !== parseInt(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  r = soma % 11;
  return (r < 2 ? 0 : 11 - r) === parseInt(cpf[10]);
}

// ---- Geração de código ----

const PREFIXO_SERVICO = { SEDEX: 'AD', PAC: 'PM', SEDEX10: 'AR', SEDEX12: 'AK' };

function gerarCodigoCorreios(servico) {
  const pref = PREFIXO_SERVICO[servico.toUpperCase()] || 'AD';
  const nums = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
  const check = nums.reduce((a, b) => a + b, 0) % 10;
  return `${pref}${nums.join('')}${check}BR`;
}

// ---- Montagem do cronograma ----

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
    const d1 = Math.round(dias * 0.30), d2 = Math.round(dias * 0.60);
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
    const d1 = Math.round(dias * 0.15), d2 = Math.round(dias * 0.45), d3 = Math.round(dias * 0.75);
    const ut = ufDestino
      ? `Unidade de Tratamento, ${cidDest} - ${ufDestino}`
      : `Unidade de Tratamento, ${D}`;
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

// ---- Geração de eventos ----

function gerarEventos(objeto) {
  const etiqueta = objeto.etiqueta_em;
  if (!etiqueta) return [];
  const elapsed      = diasEntre(etiqueta, hojeISO());
  const template     = Array.isArray(objeto.config) ? objeto.config : JSON.parse(objeto.config);
  const horaEtiqueta = etiqueta.length > 10 ? etiqueta.substring(11, 16) : null;
  return template
    .filter(ev => ev.dia <= elapsed)
    .slice().reverse()
    .map(ev => ({
      tipo:     ev.tipo,
      descricao: ev.descricao,
      local:    ev.local,
      detalhe:  ev.detalhe || null,
      dataHora: formatarDataEvento(etiqueta, ev.dia, (ev.tipo === 'ETIQUETA' && horaEtiqueta) ? horaEtiqueta : ev.hora)
    }));
}

// ---- Descobre cidade pelo 9º dígito do CPF (código de região fiscal) ----

const REGIOES_CPF = {
  '0': 'PORTO ALEGRE - RS',
  '1': 'BRASILIA - DF',
  '2': 'MANAUS - AM',
  '3': 'FORTALEZA - CE',
  '4': 'RECIFE - PE',
  '5': 'SALVADOR - BA',
  '6': 'BELO HORIZONTE - MG',
  '7': 'RIO DE JANEIRO - RJ',
  '8': 'SAO PAULO - SP',
  '9': 'CURITIBA - PR',
};

async function descobrirCidade(cpf) {
  if (process.env.CPF_API_KEY) {
    try {
      // Substitua pelo endpoint real quando tiver a chave:
      // const r = await fetch(`https://api.cpfservico.com.br/v1/${cpf}`, {
      //   headers: { Authorization: `Bearer ${process.env.CPF_API_KEY}` }
      // });
      // if (r.ok) { const d = await r.json(); return `${d.municipio} - ${d.uf}`; }
    } catch (_) {}
  }
  return REGIOES_CPF[cpf[8]] || 'SAO PAULO - SP';
}

const SERVICO_PADRAO = process.env.SERVICO_PADRAO || 'SEDEX';
const CIDADE_ORIGEM  = process.env.CIDADE_ORIGEM  || 'SAO PAULO - SP';
const DIAS_PADRAO    = parseInt(process.env.DIAS_PADRAO  || '7');

// ---- Índice global de todos os códigos ----

async function adicionarAoIndice(codigo) {
  const todos = await storageGet('todos_codigos') || [];
  if (!todos.includes(codigo)) {
    await storageSet('todos_codigos', [...todos, codigo]);
  }
}

// ---- Dados de exemplo ----

function dadosSeed() {
  function subDias(n, hora) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${hora}`;
  }
  return [
    {
      codigo: 'AD509984359BR', servico: 'SEDEX', cpf: '12345678909',
      origem: 'SAO PAULO - SP', destino: 'APARECIDA DE GOIANIA - GO',
      etiqueta_em: subDias(10, '14:25'),
      config: [
        { dia:  0, hora: '14:25', tipo: 'ETIQUETA',     descricao: 'Etiqueta emitida.',                             local: 'BR',                                             detalhe: 'Aguardando postagem pelo remetente' },
        { dia:  1, hora: '15:38', tipo: 'POSTADO',       descricao: 'Objeto postado.',                              local: 'SAO PAULO - SP' },
        { dia:  2, hora: '16:34', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Agência dos Correios, SAO PAULO - SP para Unidade de Tratamento, São Paulo - SP' },
        { dia:  4, hora: '22:08', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, SAO PAULO - SP para Unidade de Tratamento, Aparecida de Goiania - GO' },
        { dia:  7, hora: '04:03', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, APARECIDA DE GOIANIA - GO para Unidade de Distribuição, Aparecida de Goiania - GO' },
        { dia:  9, hora: '10:41', tipo: 'SAIU_ENTREGA',  descricao: 'Objeto saiu para entrega ao destinatário.',   local: 'APARECIDA DE GOIANIA - GO',                      detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
        { dia: 10, hora: '15:29', tipo: 'ENTREGUE',      descricao: 'Objeto entregue ao destinatário.',            local: 'Pela Unidade de Distribuição, APARECIDA DE GOIANIA - GO' },
      ]
    },
    {
      codigo: 'PM123456785BR', servico: 'PAC', cpf: '98765432100',
      origem: 'SAO PAULO - SP', destino: 'RECIFE - PE',
      etiqueta_em: subDias(6, '09:12'),
      config: [
        { dia:  0, hora: '09:12', tipo: 'ETIQUETA',     descricao: 'Etiqueta emitida.',                             local: 'BR',                                             detalhe: 'Aguardando postagem pelo remetente' },
        { dia:  1, hora: '10:45', tipo: 'POSTADO',       descricao: 'Objeto postado.',                              local: 'SAO PAULO - SP' },
        { dia:  3, hora: '20:15', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Agência dos Correios, SAO PAULO - SP para Unidade de Tratamento, São Paulo - SP' },
        { dia:  5, hora: '23:40', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, SÃO PAULO - SP para Unidade de Tratamento, Recife - PE' },
        { dia:  9, hora: '05:18', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, RECIFE - PE para Unidade de Distribuição, Recife - PE' },
        { dia: 13, hora: '08:30', tipo: 'SAIU_ENTREGA',  descricao: 'Objeto saiu para entrega ao destinatário.',   local: 'RECIFE - PE',                                    detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
        { dia: 14, hora: '13:55', tipo: 'ENTREGUE',      descricao: 'Objeto entregue ao destinatário.',            local: 'Pela Unidade de Distribuição, RECIFE - PE' },
      ]
    },
    {
      codigo: 'DC987654321BR', servico: 'SEDEX', cpf: '11144477735',
      origem: 'SAO PAULO - SP', destino: 'PORTO ALEGRE - RS', etiqueta_em: null,
      config: [
        { dia: 0, hora: '11:30', tipo: 'ETIQUETA',     descricao: 'Etiqueta emitida.',                             local: 'BR',                                             detalhe: 'Aguardando postagem pelo remetente' },
        { dia: 1, hora: '08:55', tipo: 'POSTADO',       descricao: 'Objeto postado.',                              local: 'SAO PAULO - SP' },
        { dia: 2, hora: '18:20', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Agência dos Correios, SAO PAULO - SP para Unidade de Distribuição, Porto Alegre - RS' },
        { dia: 3, hora: '08:15', tipo: 'SAIU_ENTREGA',  descricao: 'Objeto saiu para entrega ao destinatário.',   local: 'PORTO ALEGRE - RS',                              detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
        { dia: 4, hora: '14:22', tipo: 'ENTREGUE',      descricao: 'Objeto entregue ao destinatário.',            local: 'Pela Unidade de Distribuição, PORTO ALEGRE - RS' },
      ]
    },
    {
      codigo: 'RX555444333BR', servico: 'PAC', cpf: '55566677720',
      origem: 'SAO PAULO - SP', destino: 'BELEM - PA', etiqueta_em: null,
      config: [
        { dia:  0, hora: '16:40', tipo: 'ETIQUETA',     descricao: 'Etiqueta emitida.',                             local: 'BR',                                            detalhe: 'Aguardando postagem pelo remetente' },
        { dia:  1, hora: '09:30', tipo: 'POSTADO',       descricao: 'Objeto postado.',                              local: 'SAO PAULO - SP' },
        { dia:  3, hora: '21:55', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Agência dos Correios, SAO PAULO - SP para Unidade de Tratamento, São Paulo - SP' },
        { dia:  7, hora: '02:30', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, SAO PAULO - SP para Unidade de Tratamento, Belém - PA' },
        { dia: 12, hora: '05:45', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, BELÉM - PA para Unidade de Distribuição, Belém - PA' },
        { dia: 14, hora: '09:00', tipo: 'SAIU_ENTREGA',  descricao: 'Objeto saiu para entrega ao destinatário.',   local: 'BELEM - PA',                                    detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
        { dia: 15, hora: '11:35', tipo: 'ENTREGUE',      descricao: 'Objeto entregue ao destinatário.',            local: 'Pela Unidade de Distribuição, BELEM - PA' },
      ]
    },
    {
      codigo: 'OB246810121BR', servico: 'SEDEX', cpf: '12345678909',
      origem: 'SAO PAULO - SP', destino: 'CURITIBA - PR', etiqueta_em: null,
      config: [
        { dia: 0, hora: '13:55', tipo: 'ETIQUETA',     descricao: 'Etiqueta emitida.',                             local: 'BR',                                             detalhe: 'Aguardando postagem pelo remetente' },
        { dia: 1, hora: '10:20', tipo: 'POSTADO',       descricao: 'Objeto postado.',                              local: 'SAO PAULO - SP' },
        { dia: 3, hora: '19:10', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Agência dos Correios, SAO PAULO - SP para Unidade de Tratamento, São Paulo - SP' },
        { dia: 5, hora: '03:20', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, SAO PAULO - SP para Unidade de Distribuição, Rio de Janeiro - RJ' },
        { dia: 6, hora: '09:45', tipo: 'SAIU_ENTREGA',  descricao: 'Objeto saiu para entrega ao destinatário.',   local: 'CURITIBA - PR',                                  detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
        { dia: 7, hora: '16:08', tipo: 'ENTREGUE',      descricao: 'Objeto entregue ao destinatário.',            local: 'Pela Unidade de Distribuição, CURITIBA - PR' },
      ]
    },
  ];
}

// ---- Seed ----

let _seedPromise = null;

async function garantirSeed() {
  if (_seedPromise) return _seedPromise;
  _seedPromise = (async () => {
    const [existeObj, existeTodos] = await Promise.all([
      storageGet('rastreio:AD509984359BR'),
      storageGet('todos_codigos')
    ]);
    if (!existeObj || !existeTodos) {
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
      await storageSet('todos_codigos', lista.map(o => o.codigo));
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
  return { codigo: objeto.codigo, servico: objeto.servico, destino: objeto.destino, eventos: gerarEventos(objeto) };
}

// ---- Express ----

const app = express();
app.use(express.json());

app.use(async (_req, _res, next) => { await garantirSeed(); next(); });

const ADMIN_SENHA      = process.env.ADMIN_SENHA      || 'Rastr0@2026#!';
const WHATSAPP_NUMERO  = process.env.WHATSAPP_NUMERO  || '5585998260289';

function autenticarAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Basic ')) {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString();
    const senha   = decoded.split(':').slice(1).join(':');
    if (senha === ADMIN_SENHA) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Rastreio Admin"');
  res.status(401).json({ erro: 'Acesso negado' });
}

app.use(express.static(path.join(__dirname, 'public')));

// ── GET: consulta por CPF — cria código automaticamente no 1º acesso ─────────
app.get('/api/rastreio/cpf/:cpf', async (req, res) => {
  const cpf = req.params.cpf.replace(/\D/g, '');
  if (!validarCPF(cpf)) {
    return res.status(400).json({ erro: 'CPF inválido. Verifique os dígitos e tente novamente.' });
  }
  try {
    // Já tem código → retorna existente (não gera novo)
    const codigos = await storageGet(`cpf:${cpf}`);
    if (codigos && codigos.length) {
      const encomendas = (await Promise.all(
        codigos.map(async (codigo) => {
          const obj = await storageGet(`rastreio:${codigo}`);
          return obj ? preencherRastreio(obj) : null;
        })
      )).filter(Boolean);
      return res.json({ cpf, encomendas });
    }

    // Primeiro acesso: descobrir cidade e gerar código
    const destino = await descobrirCidade(cpf);
    const dias    = 5 + Math.floor(Math.random() * 3); // 5, 6 ou 7
    const cfg     = montarConfig(SERVICO_PADRAO, CIDADE_ORIGEM, destino, dias);

    let codigo;
    for (let i = 0; i < 10; i++) {
      const candidato = gerarCodigoCorreios(SERVICO_PADRAO);
      if (!await storageGet(`rastreio:${candidato}`)) { codigo = candidato; break; }
    }
    if (!codigo) return res.status(500).json({ erro: 'Não foi possível gerar código único.' });

    const novoObj = {
      codigo, servico: SERVICO_PADRAO, cpf,
      origem: CIDADE_ORIGEM, destino,
      config: cfg, etiqueta_em: null
    };

    await storageSet(`rastreio:${codigo}`, novoObj);
    await storageSet(`cpf:${cpf}`, [codigo]);
    await adicionarAoIndice(codigo);

    res.json({ cpf, encomendas: [await preencherRastreio(novoObj)] });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET: consulta por código (uso interno) ────────────────────────────────────
app.get('/api/rastreio/:codigo', async (req, res) => {
  const codigo = req.params.codigo.trim().toUpperCase();
  try {
    const objeto = await storageGet(`rastreio:${codigo}`);
    if (!objeto) return res.status(404).json({ erro: 'Objeto não encontrado.' });
    res.json(await preencherRastreio(objeto));
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── GET: gerenciador de envios (admin) ────────────────────────────────────────
app.get('/api/admin/envios', autenticarAdmin, async (req, res) => {
  try {
    const codigos = await storageGet('todos_codigos') || [];
    const envios = (await Promise.all(
      codigos.map(async (codigo) => {
        const obj = await storageGet(`rastreio:${codigo}`);
        if (!obj) return null;
        const eventos = obj.etiqueta_em ? gerarEventos(obj) : [];
        const ultimo  = eventos[0];
        return {
          codigo:     obj.codigo,
          cpf:        obj.cpf    || null,
          servico:    obj.servico,
          origem:     obj.origem  || CIDADE_ORIGEM,
          destino:    obj.destino || null,
          status:     ultimo ? ultimo.tipo : 'ETIQUETA',
          dataStatus: ultimo ? ultimo.dataHora : null,
        };
      })
    )).filter(Boolean).reverse();

    res.json({ total: envios.length, envios });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── Config pública (variáveis não-sensíveis para o frontend) ─────────────────
app.get('/api/config', (_req, res) => {
  res.json({ whatsappNumero: WHATSAPP_NUMERO });
});

// ── Status / health check ─────────────────────────────────────────────────────
app.get('/api/status', async (_req, res) => {
  const redis = temRedis();
  let redisOk = false;
  if (redis) {
    try { await getRedis().set('_ping', '1'); redisOk = true; } catch (_) {}
  }
  const todos = await storageGet('todos_codigos') || [];
  res.json({
    storage: redis ? (redisOk ? 'redis:ok' : 'redis:erro') : 'memoria',
    codigos_salvos: todos.length,
  });
});

// ── Rota amigável ─────────────────────────────────────────────────────────────
app.get('/rastreio/:codigo', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rastreio.html'));
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
}
