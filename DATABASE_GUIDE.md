# Database Connection and Management Guide

This guide covers how to connect to, manage, and work with the Supabase database for the Taylor Connect Hub project.

## Prerequisites

- Node.js (LTS version)
- Supabase CLI installed globally: `npm install -g supabase`
- Docker (for local development)
- PostgreSQL client tools (optional, for direct database access)

## Environment Setup

### 1. Environment Variables

Ensure your `.env` file contains the following variables:

```env
VITE_SUPABASE_URL=https://gzzbjifmrwvqbkwbyvhm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
DATABASE_URL=postgresql://postgres:your_password@db.gzzbjifmrwvqbkwbyvhm.supabase.co:5432/postgres
```

### 2. Supabase Project Configuration

The project configuration is stored in `supabase/config.toml`. Key settings include:

- **Project ID**: `gzzbjifmrwvqbkwbyvhm`
- **Database Port**: `5432`
- **API Port**: `54321`

## Database Connection Methods

### Method 1: Supabase CLI (Recommended)

#### Link to Remote Project
```bash
# Link your local project to the remote Supabase project
npx supabase link --project-ref gzzbjifmrwvqbkwbyvhm
```

#### Check Connection Status
```bash
# Verify connection and project status
npx supabase status
```

### Method 2: Direct PostgreSQL Connection

#### Using psql
```bash
# Connect using environment variable
source .env
psql "$DATABASE_URL"

# Or connect directly with connection string
psql "postgresql://postgres:your_password@db.gzzbjifmrwvqbkwbyvhm.supabase.co:5432/postgres"
```

#### Using pgAdmin or Other GUI Tools
- **Host**: `db.gzzbjifmrwvqbkwbyvhm.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **Username**: `postgres`
- **Password**: Your database password

## Database Migrations

### Pulling Remote Schema

```bash
# Pull the latest schema from remote database
npx supabase db pull

# Generate types for TypeScript
npx supabase gen types typescript --local > src/types/database.types.ts
```

### Applying Local Migrations

```bash
# Push local migrations to remote database
npx supabase db push

# Apply specific migration file
npx supabase migration up --file 20250130000000_add_organization_approval_flow.sql
```

### Creating New Migrations

```bash
# Create a new migration file
npx supabase migration new your_migration_name

# This creates: supabase/migrations/TIMESTAMP_your_migration_name.sql
```

### Migration Repair (When Out of Sync)

```bash
# Check migration status
npx supabase migration list

# Repair migration history if needed
npx supabase migration repair --status applied

# Or revert specific migrations
npx supabase migration repair 20250130000000_add_organization_approval_flow
```

## Database Reset and Seeding

### Local Development Reset

```bash
# Reset local database (requires Docker)
npx supabase db reset

# Start local Supabase services
npx supabase start

# Stop local services
npx supabase stop
```

### Seeding Data

```bash
# Run seed files (if configured in config.toml)
npx supabase db seed

# Or apply specific SQL files
psql "$DATABASE_URL" -f populate-fake-users.sql
```

## Edge Functions Management

### Deploying Functions

```bash
# Deploy all functions
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy send-organization-otp
npx supabase functions deploy send-admin-approval
```

### Function Development

```bash
# Serve functions locally (requires Docker)
npx supabase functions serve

# Test function locally
curl -X POST 'http://localhost:54321/functions/v1/send-organization-otp' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email": "test@example.com"}'
```

## Common Database Operations

### Viewing Tables and Schema

```sql
-- List all tables
\dt

-- Describe table structure
\d table_name

-- View table data
SELECT * FROM profiles LIMIT 10;
```

### Backup and Restore

```bash
# Create backup
pg_dump "$DATABASE_URL" > backup.sql

# Restore from backup
psql "$DATABASE_URL" < backup.sql
```

### Monitoring and Logs

```bash
# View function logs
npx supabase functions logs send-organization-otp

# View database logs (in Supabase dashboard)
# Go to: https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm/logs
```

## Troubleshooting

### Common Issues

1. **"could not translate host name" Error**
   - Check internet connection
   - Verify the database URL in `.env`
   - Try using IP address instead of hostname

2. **Migration Out of Sync**
   ```bash
   npx supabase migration repair --status applied
   npx supabase db push
   ```

3. **Docker Not Running (for local development)**
   - Start Docker Desktop
   - Run `npx supabase start`

4. **Permission Denied**
   - Check RLS policies
   - Verify user authentication
   - Review database permissions

### Database Schema Validation

```sql
-- Check if required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'organizations', 'events', 'pa_group_signups');

-- Verify column existence
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name IN ('status', 'email_confirmed', 'approval_token');
```

## Security Best Practices

1. **Never commit sensitive credentials** to version control
2. **Use environment variables** for all database connections
3. **Implement Row Level Security (RLS)** for all tables
4. **Regularly update dependencies** and audit for vulnerabilities
5. **Use service role key** only for server-side operations
6. **Monitor database access** through Supabase dashboard

## Useful Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Dashboard](https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm)
- [Database Schema Browser](https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm/editor)

## Quick Reference Commands

```bash
# Essential commands for daily development
npx supabase status                    # Check project status
npx supabase db pull                   # Pull remote schema
npx supabase db push                   # Push local migrations
npx supabase functions deploy          # Deploy all functions
npx supabase gen types typescript      # Generate TypeScript types
```

This guide should cover most database operations you'll need for the Taylor Connect Hub project. For specific issues or advanced operations, refer to the Supabase documentation or the project's existing migration files in `supabase/migrations/`.