import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

// Forçar codificação UTF-8 em todas as respostas HTTP
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

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

  try {
    const result = await pool.query(
      `INSERT INTO tecido
         (nm_tecido, ds_cor, vl_metro, nr_metragem_inicial, nr_metragem_atual, nr_metragem_minima)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUNAS};`,
      [
        dados.nm_tecido,
        dados.ds_cor,
        dados.vl_metro,
        dados.nr_metragem_inicial,
        dados.nr_metragem_atual,
        dados.nr_metragem_minima,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Atualizar tecido (edição, registrar uso e repor estoque)
app.put('/api/tecidos/:id', async (req, res) => {
  const { erro, dados } = lerCorpo(req.body);
  if (erro) return res.status(400).json({ error: erro });

  try {
    const result = await pool.query(
      `UPDATE tecido
          SET nm_tecido = $1,
              ds_cor = $2,
              vl_metro = $3,
              nr_metragem_inicial = $4,
              nr_metragem_atual = $5,
              nr_metragem_minima = $6
        WHERE cd_tecido = $7
        RETURNING ${COLUNAS};`,
      [
        dados.nm_tecido,
        dados.ds_cor,
        dados.vl_metro,
        dados.nr_metragem_inicial,
        dados.nr_metragem_atual,
        dados.nr_metragem_minima,
        req.params.id,
      ]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tecido não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Excluir tecido
app.delete('/api/tecidos/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tecido WHERE cd_tecido = $1;', [
      req.params.id,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tecido não encontrado' });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend rodando na porta ${PORT}`);
});