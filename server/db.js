import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
const { Pool } = pg;

// Lê o .env da raiz do projeto, não importa de onde o Node foi iniciado
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env'),
});

const faltando = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT']
  .filter((v) => !process.env[v]);
if (faltando.length > 0) {
  throw new Error(`Variáveis faltando no arquivo .env: ${faltando.join(', ')}`);
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  client_encoding: 'UTF8',
});

export default pool;