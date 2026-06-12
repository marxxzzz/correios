'use strict';

const initSqlJs = require('sql.js');
const path      = require('path');
const fs        = require('fs');

const DB_PATH = path.join(__dirname, 'rastreio.db');

function formatISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
// Para códigos pré-gerados: etiqueta_em inclui hora no formato "YYYY-MM-DD HH:MM"
function subDias(n, hora) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${formatISO(d)} ${hora}`;
}

// Configuração de eventos por código.
// "dia" é relativo a etiqueta_em (dia 0 = etiqueta, dia N = N dias depois).
// Armazenados em ordem cronológica crescente; a API inverte ao retornar.
const CODIGOS = [

  // ── Entregue (BH-MG → Aparecida de Goiânia-GO, SEDEX, 10 dias) ──────────
  {
    codigo: 'AD509984359BR',
    servico: 'SEDEX',
    etiqueta_em: subDias(10, '14:25'),
    config: JSON.stringify([
      { dia:  0, hora: '14:25', tipo: 'ETIQUETA',
        descricao: 'Etiqueta emitida.',
        local: 'BR',
        detalhe: 'Aguardando postagem pelo remetente' },
      { dia:  1, hora: '15:38', tipo: 'POSTADO',
        descricao: 'Objeto postado.',
        local: 'BELO HORIZONTE - MG' },
      { dia:  2, hora: '16:34', tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: 'de Agência dos Correios, BELO HORIZONTE - MG para Unidade de Tratamento, Belo Horizonte - MG' },
      { dia:  4, hora: '22:08', tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: 'de Unidade de Tratamento, BELO HORIZONTE - MG para Unidade de Tratamento, Aparecida de Goiania - GO' },
      { dia:  7, hora: '04:03', tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: 'de Unidade de Tratamento, APARECIDA DE GOIANIA - GO para Unidade de Distribuição, Aparecida de Goiania - GO' },
      { dia:  9, hora: '10:41', tipo: 'SAIU_ENTREGA',
        descricao: 'Objeto saiu para entrega ao destinatário.',
        local: 'APARECIDA DE GOIANIA - GO',
        detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
      { dia: 10, hora: '15:29', tipo: 'ENTREGUE',
        descricao: 'Objeto entregue ao destinatário.',
        local: 'Pela Unidade de Distribuição, APARECIDA DE GOIANIA - GO' },
    ])
  },

  // ── Em trânsito (Campinas-SP → Recife-PE, PAC, 14 dias, 6 dias decorridos) ─
  {
    codigo: 'PM123456785BR',
    servico: 'PAC',
    etiqueta_em: subDias(6, '09:12'),
    config: JSON.stringify([
      { dia:  0, hora: '09:12', tipo: 'ETIQUETA',
        descricao: 'Etiqueta emitida.',
        local: 'BR',
        detalhe: 'Aguardando postagem pelo remetente' },
      { dia:  1, hora: '10:45', tipo: 'POSTADO',
        descricao: 'Objeto postado.',
        local: 'CAMPINAS - SP' },
      { dia:  3, hora: '20:15', tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: 'de Agência dos Correios, CAMPINAS - SP para Unidade de Tratamento, São Paulo - SP' },
      { dia:  5, hora: '23:40', tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: 'de Unidade de Tratamento, SÃO PAULO - SP para Unidade de Tratamento, Recife - PE' },
      { dia:  9, hora: '05:18', tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: 'de Unidade de Tratamento, RECIFE - PE para Unidade de Distribuição, Recife - PE' },
      { dia: 13, hora: '08:30', tipo: 'SAIU_ENTREGA',
        descricao: 'Objeto saiu para entrega ao destinatário.',
        local: 'RECIFE - PE',
        detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
      { dia: 14, hora: '13:55', tipo: 'ENTREGUE',
        descricao: 'Objeto entregue ao destinatário.',
        local: 'Pela Unidade de Distribuição, RECIFE - PE' },
    ])
  },

  // ── Novo – aguarda primeira consulta (Curitiba-PR → Porto Alegre-RS, SEDEX, 4 dias) ─
  {
    codigo: 'DC987654321BR',
    servico: 'SEDEX',
    etiqueta_em: null,
    config: JSON.stringify([
      { dia: 0, hora: '11:30', tipo: 'ETIQUETA',
        descricao: 'Etiqueta emitida.',
        local: 'BR',
        detalhe: 'Aguardando postagem pelo remetente' },
      { dia: 1, hora: '08:55', tipo: 'POSTADO',
        descricao: 'Objeto postado.',
        local: 'CURITIBA - PR' },
      { dia: 2, hora: '18:20', tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: 'de Agência dos Correios, CURITIBA - PR para Unidade de Distribuição, Porto Alegre - RS' },
      { dia: 3, hora: '08:15', tipo: 'SAIU_ENTREGA',
        descricao: 'Objeto saiu para entrega ao destinatário.',
        local: 'PORTO ALEGRE - RS',
        detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
      { dia: 4, hora: '14:22', tipo: 'ENTREGUE',
        descricao: 'Objeto entregue ao destinatário.',
        local: 'Pela Unidade de Distribuição, PORTO ALEGRE - RS' },
    ])
  },

  // ── Novo – aguarda primeira consulta (Fortaleza-CE → Belém-PA, PAC, 15 dias) ─
  {
    codigo: 'RX555444333BR',
    servico: 'PAC',
    etiqueta_em: null,
    config: JSON.stringify([
      { dia:  0, hora: '16:40', tipo: 'ETIQUETA',
        descricao: 'Etiqueta emitida.',
        local: 'BR',
        detalhe: 'Aguardando postagem pelo remetente' },
      { dia:  1, hora: '09:30', tipo: 'POSTADO',
        descricao: 'Objeto postado.',
        local: 'FORTALEZA - CE' },
      { dia:  3, hora: '21:55', tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: 'de Agência dos Correios, FORTALEZA - CE para Unidade de Tratamento, Fortaleza - CE' },
      { dia:  7, hora: '02:30', tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: 'de Unidade de Tratamento, FORTALEZA - CE para Unidade de Tratamento, Belém - PA' },
      { dia: 12, hora: '05:45', tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: 'de Unidade de Tratamento, BELÉM - PA para Unidade de Distribuição, Belém - PA' },
      { dia: 14, hora: '09:00', tipo: 'SAIU_ENTREGA',
        descricao: 'Objeto saiu para entrega ao destinatário.',
        local: 'BELÉM - PA',
        detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
      { dia: 15, hora: '11:35', tipo: 'ENTREGUE',
        descricao: 'Objeto entregue ao destinatário.',
        local: 'Pela Unidade de Distribuição, BELÉM - PA' },
    ])
  },

  // ── Novo – aguarda primeira consulta (Campinas-SP → Rio de Janeiro-RJ, SEDEX, 7 dias) ─
  {
    codigo: 'OB246810121BR',
    servico: 'SEDEX',
    etiqueta_em: null,
    config: JSON.stringify([
      { dia: 0, hora: '13:55', tipo: 'ETIQUETA',
        descricao: 'Etiqueta emitida.',
        local: 'BR',
        detalhe: 'Aguardando postagem pelo remetente' },
      { dia: 1, hora: '10:20', tipo: 'POSTADO',
        descricao: 'Objeto postado.',
        local: 'CAMPINAS - SP' },
      { dia: 3, hora: '19:10', tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: 'de Agência dos Correios, CAMPINAS - SP para Unidade de Tratamento, São Paulo - SP' },
      { dia: 5, hora: '03:20', tipo: 'TRANSFERENCIA',
        descricao: 'Objeto em transferência - por favor aguarde.',
        local: 'de Unidade de Tratamento, SÃO PAULO - SP para Unidade de Distribuição, Rio de Janeiro - RJ' },
      { dia: 6, hora: '09:45', tipo: 'SAIU_ENTREGA',
        descricao: 'Objeto saiu para entrega ao destinatário.',
        local: 'RIO DE JANEIRO - RJ',
        detalhe: 'É preciso ter alguém no endereço para receber o carteiro' },
      { dia: 7, hora: '16:08', tipo: 'ENTREGUE',
        descricao: 'Objeto entregue ao destinatário.',
        local: 'Pela Unidade de Distribuição, RIO DE JANEIRO - RJ' },
    ])
  },

];

initSqlJs().then(SQL => {
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE objetos (
      codigo      TEXT PRIMARY KEY,
      servico     TEXT NOT NULL,
      config      TEXT NOT NULL,
      etiqueta_em TEXT
    );
  `);

  CODIGOS.forEach(({ codigo, servico, config, etiqueta_em }) => {
    db.run(
      'INSERT INTO objetos (codigo, servico, config, etiqueta_em) VALUES (?, ?, ?, ?)',
      [codigo, servico, config, etiqueta_em]
    );
  });

  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log(`Banco criado: ${DB_PATH}`);
  console.log('Códigos disponíveis:');
  CODIGOS.forEach(c => console.log(`  ${c.codigo}  etiqueta_em=${c.etiqueta_em || '(ativa na 1ª consulta)'}`));
}).catch(err => { console.error(err); process.exit(1); });
