import express from 'express';
import cors from 'cors';
import { spawn } from 'node:child_process';
import pool from './db.js';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Forçar codificação UTF-8 em todas as respostas HTTP
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// ---- Encerramento automático quando o navegador fecha ----
// Só ativa quando iniciado pelo iniciar.vbs (AUTO_ENCERRAR=1).
// Em desenvolvimento normal (npm run dev) nada disso acontece.
const AUTO_ENCERRAR = process.env.AUTO_ENCERRAR === '1';
const abas = new Map(); // id da aba -> última vez que avisou
let jaConectou = false; // não desliga antes de alguém abrir o site
let timerDesligar = null;

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PARAR = path.join(RAIZ, 'Inicializar', 'parar.vbs');
const FLAG_SPLASH = path.join(os.tmpdir(), 'meustecidos_fechar.flag');

function dispararParar() {
  spawn('wscript', ['//B', '//Nologo', PARAR], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  }).unref();
}

function encerrar() {
  timerDesligar = null;
  if (abas.size > 0) return;
  console.log('Navegador fechado. Encerrando...');
  dispararParar();
  setTimeout(() => process.exit(0), 5000);
}

function verificarAbas() {
  const agora = Date.now();
  for (const [id, visto] of abas) {
    if (agora - visto > 180000) abas.delete(id); // sumiu há 3 min
  }
  if (jaConectou && abas.size === 0 && !timerDesligar) {
    timerDesligar = setTimeout(encerrar, 10000);
  }
}

app.post('/api/ping', (req, res) => {
  const id = String(req.query.id);
  if (!abas.has(id)) {
    console.log(`Aba conectada: ${id}`);
    // Avisa a telinha de abertura: o app já está na tela
    try { fs.writeFileSync(FLAG_SPLASH, ''); } catch { /* sem problema */ }
  }
  abas.set(id, Date.now());
  if (AUTO_ENCERRAR) {
    jaConectou = true;
    if (timerDesligar) { clearTimeout(timerDesligar); timerDesligar = null; }
  }
  res.status(204).end();
});

app.post('/api/saindo', (req, res) => {
  console.log(`Aba saiu: ${String(req.query.id)}`);
  abas.delete(String(req.query.id));
  res.status(204).end();
  verificarAbas();
});

// Diagnóstico: abra http://localhost:3001/api/estado no navegador
app.get('/api/estado', (req, res) => {
  res.json({
    AUTO_ENCERRAR,
    jaConectou,
    desligamentoAgendado: timerDesligar !== null,
    abas: [...abas].map(([id, visto]) => ({ id, segundosDesdeUltimoPing: Math.round((Date.now() - visto) / 1000) })),
  });
});

// Usada pelo iniciar.vbs: só responde 200 quando o servidor E o banco estão ok
app.get('/api/pronto', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

setInterval(verificarAbas, 30000);

// Colunas devolvidas ao front. O ::float8 garante que o pg devolva número
// (por padrão ele devolve NUMERIC como texto).
const COLUNAS = `
  cd_tecido,
  nm_tecido,
  ds_cor,
  vl_metro::float8            AS vl_metro,
  nr_metragem_inicial::float8 AS nr_metragem_inicial,
  nr_metragem_atual::float8   AS nr_metragem_atual,
  nr_metragem_minima::float8  AS nr_metragem_minima
`;

const TIPOS = ['USO', 'REPOSICAO', 'AJUSTE'];
const arred = (n) => Math.round(n * 100) / 100;

// Valida e normaliza o corpo enviado pelo front (POST e PUT)
function lerCorpo(body) {
  const nm_tecido = String(body.nm_tecido || '').trim();
  const ds_cor = /^#[0-9a-fA-F]{6}$/.test(body.ds_cor) ? body.ds_cor : '#23224a';
  const vl_metro = Number(body.vl_metro);
  const nr_metragem_atual = Number(body.nr_metragem_atual);
  const nr_metragem_inicial = Number(body.nr_metragem_inicial);
  const nr_metragem_minima = Number(body.nr_metragem_minima ?? 0);

  if (!nm_tecido) return { erro: 'Informe o nome do tecido.' };
  if (!(vl_metro >= 0)) return { erro: 'Preço por metro inválido.' };
  if (!(nr_metragem_atual >= 0)) return { erro: 'Metragem restante inválida.' };
  if (!(nr_metragem_inicial >= nr_metragem_atual)) {
    return { erro: 'A metragem inicial não pode ser menor que a restante.' };
  }
  if (!(nr_metragem_minima >= 0)) return { erro: 'Estoque mínimo inválido.' };
  return {
    dados: { nm_tecido, ds_cor, vl_metro, nr_metragem_atual, nr_metragem_inicial, nr_metragem_minima },
  };
}

function registrarMov(client, t, tp, anterior) {
  return client.query(
    `INSERT INTO movimentacao
       (cd_tecido, nm_tecido, tp_movimentacao, nr_metros,
        nr_metragem_anterior, nr_metragem_posterior, vl_metro)
     VALUES ($1, $2, $3, $4, $5, $6, $7);`,
    [t.cd_tecido, t.nm_tecido, tp, arred(t.nr_metragem_atual - anterior),
     anterior, t.nr_metragem_atual, t.vl_metro]
  );
}

// Listar tecidos
app.get('/api/tecidos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${COLUNAS} FROM tecido ORDER BY nm_tecido ASC;`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Criar tecido
app.post('/api/tecidos', async (req, res) => {
  const { erro, dados } = lerCorpo(req.body);
  if (erro) return res.status(400).json({ error: erro });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO tecido
         (nm_tecido, ds_cor, vl_metro, nr_metragem_inicial, nr_metragem_atual, nr_metragem_minima)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUNAS};`,
      [dados.nm_tecido, dados.ds_cor, dados.vl_metro, dados.nr_metragem_inicial,
       dados.nr_metragem_atual, dados.nr_metragem_minima]
    );
    const t = result.rows[0];
    await registrarMov(client, t, 'CADASTRO', 0);
    await client.query('COMMIT');
    res.status(201).json(t);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  } finally {
    client.release();
  }
});

// Atualizar tecido (edição, registrar uso e repor estoque)
app.put('/api/tecidos/:id', async (req, res) => {
  const { erro, dados } = lerCorpo(req.body);
  if (erro) return res.status(400).json({ error: erro });
  const tipo = TIPOS.includes(req.body.tp_movimentacao) ? req.body.tp_movimentacao : 'AJUSTE';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const antes = await client.query(
      'SELECT nr_metragem_atual::float8 AS atual FROM tecido WHERE cd_tecido = $1 FOR UPDATE;',
      [req.params.id]
    );
    if (antes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Tecido não encontrado' });
    }
    const result = await client.query(
      `UPDATE tecido
          SET nm_tecido = $1, ds_cor = $2, vl_metro = $3,
              nr_metragem_inicial = $4, nr_metragem_atual = $5, nr_metragem_minima = $6
        WHERE cd_tecido = $7
        RETURNING ${COLUNAS};`,
      [dados.nm_tecido, dados.ds_cor, dados.vl_metro, dados.nr_metragem_inicial,
       dados.nr_metragem_atual, dados.nr_metragem_minima, req.params.id]
    );
    const t = result.rows[0];
    // Só registra quando a metragem realmente mudou (editar nome/cor/preço não gera movimentação)
    if (arred(t.nr_metragem_atual - antes.rows[0].atual) !== 0) {
      await registrarMov(client, t, tipo, antes.rows[0].atual);
    }
    await client.query('COMMIT');
    res.json(t);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  } finally {
    client.release();
  }
});

// Excluir tecido (o histórico permanece, só perde o vínculo)
app.delete('/api/tecidos/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `SELECT ${COLUNAS} FROM tecido WHERE cd_tecido = $1 FOR UPDATE;`, [req.params.id]
    );
    if (r.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Tecido não encontrado' });
    }
    const t = r.rows[0];
    await registrarMov(client, { ...t, nr_metragem_atual: 0 }, 'EXCLUSAO', t.nr_metragem_atual);
    await client.query('DELETE FROM tecido WHERE cd_tecido = $1;', [req.params.id]);
    await client.query('COMMIT');
    res.status(204).end();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  } finally {
    client.release();
  }
});

// Histórico de movimentações (opcional: ?cd_tecido=ID)
app.get('/api/movimentacoes', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cd_movimentacao, cd_tecido, nm_tecido, tp_movimentacao,
              nr_metros::float8 AS nr_metros,
              nr_metragem_anterior::float8 AS nr_metragem_anterior,
              nr_metragem_posterior::float8 AS nr_metragem_posterior,
              vl_metro::float8 AS vl_metro,
              dt_movimentacao
         FROM movimentacao
        WHERE ($1::int IS NULL OR cd_tecido = $1::int)
        ORDER BY dt_movimentacao DESC, cd_movimentacao DESC
        LIMIT 300;`,
      [req.query.cd_tecido || null]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ---- Backup e importação ----
const COLS_TECIDO = ['cd_tecido', 'nm_tecido', 'ds_cor', 'vl_metro',
  'nr_metragem_inicial', 'nr_metragem_atual', 'nr_metragem_minima'];
const COLS_MOV = ['cd_movimentacao', 'cd_tecido', 'nm_tecido', 'tp_movimentacao', 'nr_metros',
  'nr_metragem_anterior', 'nr_metragem_posterior', 'vl_metro', 'dt_movimentacao'];

async function inserirLinhas(client, tabela, colunas, linhas) {
  const marcas = colunas.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO ${tabela} (${colunas.join(', ')}) OVERRIDING SYSTEM VALUE VALUES (${marcas});`;
  for (const l of linhas) {
    await client.query(sql, colunas.map((c) => l[c] ?? null));
  }
}

// Exporta todas as tabelas
app.get('/api/backup', async (req, res) => {
  try {
    const tecidos = await pool.query(`SELECT ${COLS_TECIDO.join(', ')} FROM tecido ORDER BY cd_tecido;`);
    const movs = await pool.query(`SELECT ${COLS_MOV.join(', ')} FROM movimentacao ORDER BY cd_movimentacao;`);
    res.json({
      app: 'meus-tecidos',
      versao: 1,
      geradoEm: new Date().toISOString(),
      tabelas: { tecido: tecidos.rows, movimentacao: movs.rows },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao gerar o backup' });
  }
});

// Importa um backup: SUBSTITUI todo o conteúdo atual (tudo ou nada)
app.post('/api/importar', async (req, res) => {
  const t = req.body?.tabelas;
  const valido = req.body?.app === 'meus-tecidos'
    && Array.isArray(t?.tecido) && Array.isArray(t?.movimentacao)
    && [...t.tecido, ...t.movimentacao].every((l) => l && typeof l === 'object');
  if (!valido) return res.status(400).json({ error: 'Arquivo de backup inválido.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE movimentacao, tecido RESTART IDENTITY;');
    await inserirLinhas(client, 'tecido', COLS_TECIDO, t.tecido);
    await inserirLinhas(client, 'movimentacao', COLS_MOV, t.movimentacao);
    // Reajusta os contadores de ID para continuar depois do maior importado
    await client.query(`SELECT setval(pg_get_serial_sequence('tecido','cd_tecido'),
      COALESCE((SELECT MAX(cd_tecido) FROM tecido), 0) + 1, false);`);
    await client.query(`SELECT setval(pg_get_serial_sequence('movimentacao','cd_movimentacao'),
      COALESCE((SELECT MAX(cd_movimentacao) FROM movimentacao), 0) + 1, false);`);
    await client.query('COMMIT');
    res.json({ tecidos: t.tecido.length, movimentacoes: t.movimentacao.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Falha ao importar. Nada foi alterado no banco.' });
  } finally {
    client.release();
  }
});

// Botão "Sair do sistema": responde primeiro e desliga logo depois
app.post('/api/sair', (req, res) => {
  res.status(204).end();
  console.log('Encerramento pedido pelo usuário.');
  setTimeout(() => {
    dispararParar();
    setTimeout(() => process.exit(0), 3000);
  }, 300);
});
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend rodando na porta ${PORT}`);
});