// Constantes e funções compartilhadas entre as páginas
export const API_BASE = 'http://localhost:3001/api';
export const API = `${API_BASE}/tecidos`;
export const API_MOV = `${API_BASE}/movimentacoes`;
export const API_BACKUP = `${API_BASE}/backup`;
export const API_IMPORTAR = `${API_BASE}/importar`;
export const API_SAIR = `${API_BASE}/sair`;

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
//Backup servidor
export async function baixarBackup() {
  const res = await fetch(API_BACKUP);
  if (!res.ok) throw new Error('Falha ao gerar o backup.');
  const blob = await res.blob();
  const agora = new Date();
  const data = agora.toLocaleDateString('sv-SE'); // AAAA-MM-DD
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-meus-tecidos-${data}-${hora}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
