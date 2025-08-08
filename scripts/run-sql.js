#!/usr/bin/env node
import fs from 'fs';
import { Client } from 'pg';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { file: '', url: '' };
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--file' || args[i] === '-f') && args[i + 1]) {
      options.file = args[++i];
    } else if ((args[i] === '--url' || args[i] === '-u') && args[i + 1]) {
      options.url = args[++i];
    }
  }
  if (!options.file || !options.url) {
    console.error('Usage: node run-sql.js --file <path/to.sql> --url <postgresql://...>');
    process.exit(1);
  }
  return options;
}

async function main() {
  const { file, url } = parseArgs();
  const sql = fs.readFileSync(file, 'utf8');

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query(sql);
    console.log('SQL executed successfully');
  } catch (err) {
    console.error('Error executing SQL:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();