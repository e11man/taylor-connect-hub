import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function splitPostgresStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inDollar = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next2 = sql.slice(i, i + 2);

    // Handle dollar-quoted strings $$ ... $$
    if (!inSingle && !inDouble && next2 === '$$') {
      inDollar = !inDollar; // toggle
      current += next2;
      i++; // skip next char as well
      continue;
    }

    if (!inDollar) {
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      if (ch === '"' && !inSingle) inDouble = !inDouble;
    }

    if (ch === ';' && !inSingle && !inDouble && !inDollar) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed + ';');
      current = '';
      continue;
    }

    current += ch;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function main() {
  const sqlFileArg = process.argv[2];
  if (!sqlFileArg) {
    console.error('Usage: node scripts/apply_sql_file.js <path-to-sql-file>');
    process.exit(1);
  }

  const sqlFilePath = path.isAbsolute(sqlFileArg)
    ? sqlFileArg
    : path.join(__dirname, '..', sqlFileArg);

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`SQL file not found: ${sqlFilePath}`);
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL env var is required');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  const chunks = splitPostgresStatements(sqlContent);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 120000,
    query_timeout: 120000,
    connectionTimeoutMillis: 10000,
  });

  console.log(`Connecting to database...`);
  try {
    await client.connect();
  } catch (connectErr) {
    console.error('❌ Failed to connect to database:', connectErr.message);
    process.exit(1);
  }

  try {
    console.log(`Applying ${chunks.length} statement(s) from: ${sqlFilePath}`);
    await client.query('BEGIN');
    for (let i = 0; i < chunks.length; i++) {
      const stmt = chunks[i];
      console.log(`Executing ${i + 1}/${chunks.length}:`, stmt.split('\n')[0].slice(0, 100));
      await client.query(stmt);
    }
    await client.query('COMMIT');
    console.log('✅ Migration applied successfully');

    const verifyColumn = await client.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'requested_role'`
    );
    const verifyEnum = await client.query(
      `SELECT enumlabel FROM pg_enum e 
         JOIN pg_type t ON e.enumtypid = t.oid 
       WHERE t.typname = 'user_role' ORDER BY e.enumsortorder`
    );

    console.log('Column requested_role present:', verifyColumn.rowCount > 0);
    console.log('user_role enum values:', verifyEnum.rows.map(r => r.enumlabel));
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('❌ Error applying SQL:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err.message);
  process.exit(1);
});