import { Router } from 'express';
import { nomeBackup } from './nomeBackup.js';

export function criarRotasDrive({ drive, gerarBackup, urlFront }) {
  const r = Router();

  r.get('/status', (req, res) => res.json(drive.status()));

  r.get('/conectar', (req, res) => {
    if (!drive.configurado()) {
      return res.status(400).json({ error: 'Credenciais do Google não configuradas no .env.' });
    }
    res.json({ url: drive.urlLogin() });
  });

  // O Google redireciona para cá depois do login
  r.get('/callback', async (req, res) => {
    try {
      await drive.trocarCodigo(String(req.query.code || ''), String(req.query.state || ''));
      res.redirect(`${urlFront}/?drive=ok`);
    } catch (err) {
      console.error(err.message);
      res.redirect(`${urlFront}/?drive=erro`);
    }
  });

  r.post('/desconectar', async (req, res) => {
    await drive.desconectar();
    res.status(204).end();
  });

  r.post('/backup', async (req, res) => {
    const tipo = req.body?.tipo === 'seguranca' ? 'seguranca' : 'manual';
    if (!drive.status().conectado) {
      return res.status(400).json({ error: 'Google Drive não conectado. Conecte em Configurações.' });
    }
    try {
      const backup = await gerarBackup();
      const arquivo = await drive.enviar(nomeBackup(tipo), JSON.stringify(backup));
      res.status(201).json(arquivo);
    } catch (err) {
      console.error(err.message);
      res.status(502).json({ error: 'Não foi possível enviar o backup ao Google Drive.' });
    }
  });

  return r;
}