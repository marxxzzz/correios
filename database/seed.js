'use strict';

const _mem = new Map();

async function storageSet(key, value) {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const { Redis } = require('@upstash/redis');
    const redis = Redis.fromEnv();
    await redis.set(key, value);
  } else {
    _mem.set(key, value);
  }
}

function subDias(n, hora) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hora}`;
}

const CODIGOS = [
  {
    codigo: 'AD509984359BR', servico: 'SEDEX', cpf: '12345678909',
    etiqueta_em: subDias(10, '14:25'),
    config: [
      { dia:  0, hora: '14:25', tipo: 'ETIQUETA',     descricao: 'Etiqueta emitida.',                             local: 'BR',                                             detalhe: 'Aguardando postagem pelo remetente' },
      { dia:  1, hora: '15:38', tipo: 'POSTADO',       descricao: 'Objeto postado.',                              local: 'BELO HORIZONTE - MG' },
      { dia:  2, hora: '16:34', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Agência dos Correios, BELO HORIZONTE - MG para Unidade de Tratamento, Belo Horizonte - MG' },
      { dia:  4, hora: '22:08', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, BELO HORIZONTE - MG para Unidade de Tratamento, Aparecida de Goiania - GO' },
      { dia:  7, hora: '04:03', tipo: 'TRANSFERENCIA', descricao: 'Objeto em transferência - por favor aguarde.', local: 'de Unidade de Tratamento, APARECIDA DE GOIANIA - GO para Unidade de Distribuição, Aparecida de Goiania - GO' },
      { dia:  9, hora: '10:41', tipo: 'SAIU_ENTREGA',  descricao: 'Objeto saiu para entrega ao destinatário.',   local: 'APARECIDA DE GOIANIA - GO',                      detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
      { dia: 10, hora: '15:29', tipo: 'ENTREGUE',      descricao: 'Objeto entregue ao destinatário.',            local: 'Pela Unidade de Distribuição, APARECIDA DE GOIANIA - GO' },
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

(async () => {
  const cpfMap = {};
  for (const obj of CODIGOS) {
    await storageSet(`rastreio:${obj.codigo}`, obj);
    if (obj.cpf) {
      if (!cpfMap[obj.cpf]) cpfMap[obj.cpf] = [];
      cpfMap[obj.cpf].push(obj.codigo);
    }
    console.log(`Inserido: ${obj.codigo}  cpf=${obj.cpf}  etiqueta_em=${obj.etiqueta_em || '(ativa na 1ª consulta)'}`);
  }
  for (const [cpf, codigos] of Object.entries(cpfMap)) {
    await storageSet(`cpf:${cpf}`, codigos);
    console.log(`Índice CPF: ${cpf} → [${codigos.join(', ')}]`);
  }
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.log('\nAVISO: UPSTASH_REDIS_REST_URL não configurado. Dados em memória apenas.');
  } else {
    console.log('\nDados inseridos no Upstash com sucesso.');
  }
})().catch(err => { console.error(err); process.exit(1); });
