import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import { criarDrive, armazemMemoria } from '../drive.js';
import { criarRotasDrive } from '../rotasDrive.js';
import { nomeBackup } from '../nomeBackup.js';

// ---- Google falso: registra o que o servidor tentou enviar ----
function googleFalso() {
  const criados = [];
  class OAuth2 {
    generateAuthUrl(o) { return `https://login.falso/auth?state=${o.state}`; }
    async getToken() { return { tokens: { refresh_token: 'rt-123', access_token: 'at' } }; }
    setCredentials() {}
    async revokeToken() {}
  }
  const api = {
    auth: { OAuth2 },
    oauth2: () => ({ userinfo: { get: async () => ({ data: { email: 'aluna@teste.com' } }) } }),
    drive: () => ({
      files: {
        create: async (req) => {
          criados.push(req);
          return { data: { id: `id-${criados.length}`, name: req.requestBody.name } };
        },
      },
    }),
  };
  return { api, criados };
}

const novoDrive = (armazem = armazemMemoria()) => {
  const g = googleFalso();
  const drive = criarDrive({
    clientId: 'x', clientSecret: 'y', redirectUri: 'http://cb', armazem, api: g.api,
  });
  return { drive, armazem, criados: g.criados };
};

const stateDa = (url) => new URL(url).searchParams.get('state');

// ---- Sobe as rotas reais numa porta aleatória ----
async function subirServidor(drive, gerarBackup = async () => ({ app: 'meus-tecidos', tabelas: { tecido: [], movimentacao: [] } })) {
  const app = express();
  app.use(express.json());
  app.use('/api/drive', criarRotasDrive({ drive, gerarBackup, urlFront: 'http://front.teste' }));
  const server = app.listen(0);
  await once(server, 'listening');
  return {
    base: `http://localhost:${server.address().port}/api/drive`,
    fechar: () => { server.close(); server.closeAllConnections(); },
  };
}

async function conectar(drive) {
  await drive.trocarCodigo('codigo', stateDa(drive.urlLogin()));
}

// ---- Unitário: nome do arquivo ----
test('nomeBackup: manual e segurança têm prefixos diferentes', () => {
  const quando = new Date(2026, 10, 16, 14, 30);
  assert.equal(nomeBackup('manual', quando), 'backup-meus-tecidos-2026-11-16-14h30.json');
  assert.equal(nomeBackup('seguranca', quando), 'backup-seguranca-automatico-2026-11-16-14h30.json');
});

// ---- Serviço com Google falso ----
test('drive: começa desconectado', () => {
  const { drive } = novoDrive();
  assert.deepEqual(drive.status(), { configurado: true, conectado: false, email: null });
});

test('drive: login válido guarda token e e-mail', async () => {
  const { drive, armazem } = novoDrive();
  await conectar(drive);
  assert.equal(armazem.ler().refresh_token, 'rt-123');
  assert.equal(drive.status().email, 'aluna@teste.com');
});

test('drive: rejeita retorno de login com state errado', async () => {
  const { drive } = novoDrive();
  drive.urlLogin();
  await assert.rejects(() => drive.trocarCodigo('codigo', 'state-forjado'), /inválido/);
  assert.equal(drive.status().conectado, false);
});

test('drive: cria a pasta só uma vez e reaproveita nos envios seguintes', async () => {
  const { drive, criados } = novoDrive();
  await conectar(drive);
  await drive.enviar('a.json', '{}');
  await drive.enviar('b.json', '{}');
  const pastas = criados.filter((c) => c.requestBody.mimeType === 'application/vnd.google-apps.folder');
  assert.equal(pastas.length, 1);
  assert.equal(criados.length, 3); // 1 pasta + 2 arquivos
});

test('drive: desconectar limpa tudo', async () => {
  const { drive } = novoDrive();
  await conectar(drive);
  await drive.desconectar();
  assert.equal(drive.status().conectado, false);
});

// ---- Rotas HTTP ----
test('POST /backup sem conexão devolve 400', async () => {
  const { drive } = novoDrive();
  const s = await subirServidor(drive);
  try {
    const r = await fetch(`${s.base}/backup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    assert.equal(r.status, 400);
  } finally { s.fechar(); }
});

test('POST /backup envia ao Drive com o nome certo para cada tipo', async () => {
  const { drive, criados } = novoDrive();
  await conectar(drive);
  const s = await subirServidor(drive);
  try {
    const enviar = (tipo) => fetch(`${s.base}/backup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo }),
    });

    const manual = await enviar('manual');
    assert.equal(manual.status, 201);
    assert.match((await manual.json()).nome, /^backup-meus-tecidos-/);

    const seg = await enviar('seguranca');
    assert.match((await seg.json()).nome, /^backup-seguranca-automatico-/);

    const arquivos = criados.filter((c) => c.requestBody.mimeType !== 'application/vnd.google-apps.folder');
    assert.equal(arquivos.length, 2);
  } finally { s.fechar(); }
});

test('POST /backup devolve 502 se o Google falhar', async () => {
  const { drive } = novoDrive();
  await conectar(drive);
  drive.enviar = async () => { throw new Error('Google fora do ar'); };
  const s = await subirServidor(drive);
  try {
    const r = await fetch(`${s.base}/backup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    assert.equal(r.status, 502);
  } finally { s.fechar(); }
});

test('GET /callback redireciona com ok ou erro para o front', async () => {
  const { drive } = novoDrive();
  const s = await subirServidor(drive);
  try {
    const { url } = await (await fetch(`${s.base}/conectar`)).json();
    const ok = await fetch(`${s.base}/callback?code=abc&state=${stateDa(url)}`, { redirect: 'manual' });
    assert.equal(ok.status, 302);
    assert.equal(ok.headers.get('location'), 'http://front.teste/?drive=ok');

    const erro = await fetch(`${s.base}/callback?code=abc&state=errado`, { redirect: 'manual' });
    assert.equal(erro.headers.get('location'), 'http://front.teste/?drive=erro');
  } finally { s.fechar(); }
});