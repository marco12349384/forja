import postgres from 'postgres';

let _sql: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    _sql = postgres(url, { ssl: 'require' });
  }
  return _sql;
}
