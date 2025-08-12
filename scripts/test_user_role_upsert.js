const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL env var is required');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const { rows } = await client.query(`
      SELECT id AS profile_id, user_id, email
      FROM public.profiles
      WHERE user_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (rows.length === 0) {
      console.log('No profiles with non-null user_id found; skipping test.');
      return;
    }

    const { user_id, email, profile_id } = rows[0];
    console.log('Testing upsert for profile:', { email, profile_id, user_id });

    const upsert = await client.query(
      `INSERT INTO public.user_roles (user_id, role)
       VALUES ($1, 'user')
       ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role
       RETURNING user_id, role, updated_at`,
      [user_id]
    );

    console.log('Upsert successful:', upsert.rows[0]);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});