#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_DB_URL = 'postgresql://postgres.gzzbjifmrwvqbkwbyvhm:Idonotunderstandwhatido!@aws-0-us-east-2.pooler.supabase.com:6543/postgres';
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || DEFAULT_DB_URL;

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

const rows = [
  { page: 'homepage', section: 'impact', key: 'active_volunteers', value: '100', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'hours_contributed', value: '100', language_code: 'en' },
  { page: 'homepage', section: 'impact', key: 'partner_organizations', value: '100', language_code: 'en' },
];

const upsertSQL = `
INSERT INTO public.content (page, section, key, value, language_code)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (page, section, key, language_code)
DO UPDATE SET value = EXCLUDED.value;
`;

async function run() {
  console.log('Seeding stats (100,100,100) into public.content ...');
  try {
    await client.connect();
    for (const r of rows) {
      await client.query(upsertSQL, [r.page, r.section, r.key, r.value, r.language_code]);
    }
    console.log('✅ Done.');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();