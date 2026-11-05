// Constantes e funções compartilhadas entre as páginas
export const API_BASE = 'http://localhost:3001/api';
export const API = `${API_BASE}/tecidos`;
export const API_MOV = `${API_BASE}/movimentacoes`;

export const ROTULO = {
  CADASTRO: 'Cadastro',
  USO: 'Uso',
  REPOSICAO: 'Reposição',
  AJUSTE: 'Ajuste',
  EXCLUSAO: 'Exclusão',
};

export const dataHora = (d) =>
  new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export const brl = (n) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const metros = (n) =>
  `${Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m`;

export async function api(url = API, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const corpo = await res.json().catch(() => ({}));
    throw new Error(corpo.error || 'Falha na requisição');
  }
  return res.status === 204 ? null : res.json();
}

// Servidor fora do ar vira TypeError no fetch
export const textoDoErro = (err, padrao) =>
  err instanceof TypeError
    ? 'Sem conexão com o servidor. Verifique se a API está rodando.'
    : err.message || padrao;

export const minimo = (t) => Number(t.nr_metragem_minima) || 0;
export const acabando = (t) => minimo(t) > 0 && Number(t.nr_metragem_atual) <= minimo(t);
export const pct = (t) =>
  Number(t.nr_metragem_inicial) > 0
    ? Math.max(0, Math.min(100, (t.nr_metragem_atual / t.nr_metragem_inicial) * 100))
    : 0;
