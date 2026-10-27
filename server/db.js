import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Catalogorizada',
  password: 'vivencias',
  port: 5432,
  client_encoding: 'UTF8' 
});

export default pool;