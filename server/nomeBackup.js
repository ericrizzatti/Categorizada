// tipo: 'manual' ou 'seguranca'. O 'agora' é parâmetro para facilitar o teste.
export function nomeBackup(tipo = 'manual', agora = new Date()) {
  const data = agora.toLocaleDateString('sv-SE'); // AAAA-MM-DD
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
  const prefixo = tipo === 'seguranca' ? 'backup-seguranca-automatico' : 'backup-meus-tecidos';
  return `${prefixo}-${data}-${hora}.json`;
}