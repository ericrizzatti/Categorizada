import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Catalogorizada',
  password: 'vivencias', // A tua senha do PostgreSQL
  port: 5432,
  client_encoding: 'UTF8' // 💡 FORÇA A CONEXÃO EM UTF-8
});

export default pool;