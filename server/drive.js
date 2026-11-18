import { google } from 'googleapis';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import fs from 'node:fs';

const ESCOPOS = [
  'https://www.googleapis.com/auth/drive.file', // só enxerga arquivos criados pelo próprio app
  'https://www.googleapis.com/auth/userinfo.email',
];
const NOME_PASTA = 'Meus Tecidos - Backups';

// Onde ficam o token e a pasta. Em arquivo (produção) ou em memória (testes).
export function armazemArquivo(caminho) {
  return {
    ler() { try { return JSON.parse(fs.readFileSync(caminho, 'utf8')); } catch { return {}; } },
    gravar(dados) { fs.writeFileSync(caminho, JSON.stringify(dados, null, 2)); },
  };
}
export function armazemMemoria(inicial = {}) {
  let dados = { ...inicial };
  return { ler: () => ({ ...dados }), gravar: (novo) => { dados = { ...novo }; } };
}

// `api` é o objeto `google`; nos testes passamos um falso no lugar.
export function criarDrive({ clientId, clientSecret, redirectUri, armazem, api = google }) {
  let stateAtual = null; // proteção contra CSRF no retorno do login

  const novoCliente = () => new api.auth.OAuth2(clientId, clientSecret, redirectUri);
  const clienteLogado = () => {
    const c = novoCliente();
    c.setCredentials({ refresh_token: armazem.ler().refresh_token });
    return c;
  };

  async function garantirPasta(drive, recriar = false) {
    const cfg = armazem.ler();
    if (cfg.pastaId && !recriar) return cfg.pastaId;
    const { data } = await drive.files.create({
      requestBody: { name: NOME_PASTA, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    });
    armazem.gravar({ ...armazem.ler(), pastaId: data.id });
    return data.id;
  }

  return {
    configurado: () => Boolean(clientId && clientSecret),

    urlLogin() {
      stateAtual = randomUUID();
      return novoCliente().generateAuthUrl({
        access_type: 'offline', // pede o refresh token
        prompt: 'consent',      // garante que ele venha sempre
        scope: ESCOPOS,
        state: stateAtual,
      });
    },

    async trocarCodigo(code, state) {
      if (!code || !stateAtual || state !== stateAtual) throw new Error('Retorno de login inválido.');
      stateAtual = null;
      const cliente = novoCliente();
      const { tokens } = await cliente.getToken(code);
      if (!tokens.refresh_token) throw new Error('O Google não devolveu o token de acesso.');
      cliente.setCredentials(tokens);
      const { data } = await api.oauth2({ version: 'v2', auth: cliente }).userinfo.get();
      armazem.gravar({ refresh_token: tokens.refresh_token, email: data.email });
    },

    status() {
      const cfg = armazem.ler();
      return { configurado: this.configurado(), conectado: Boolean(cfg.refresh_token), email: cfg.email || null };
    },

    async enviar(nome, conteudo) {
      if (!armazem.ler().refresh_token) throw new Error('Google Drive não conectado.');
      const drive = api.drive({ version: 'v3', auth: clienteLogado() });
      const subir = (pastaId) => drive.files.create({
        requestBody: { name: nome, parents: [pastaId] },
        media: { mimeType: 'application/json', body: Readable.from([conteudo]) },
        fields: 'id, name',
      });
      let res;
      try {
        res = await subir(await garantirPasta(drive));
      } catch (err) {
        if (err.code !== 404) throw err;           // pasta apagada no Drive: recria e tenta de novo
        res = await subir(await garantirPasta(drive, true));
      }
      return { id: res.data.id, nome: res.data.name ?? nome };
    },

    async desconectar() {
      const token = armazem.ler().refresh_token;
      if (token) { try { await clienteLogado().revokeToken(token); } catch { /* já revogado */ } }
      armazem.gravar({});
    },
  };
}