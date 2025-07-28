# Database Setup Instructions

## Quick Setup

To ensure the admin console displays users properly, follow these steps:

### 1. Execute the SQL Script

1. **Open Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/gzzbjifmrwvqbkwbyvhm/sql/new
   ```

2. **Copy the entire contents of `setup-database.sql`** and paste it into the SQL editor

3. **Click "RUN"** to execute the script

### 2. Verify the Setup

After running the script, you should see:
- A list of 5 test users with their details
- A summary showing the total number of users
- A success message: "✅ Database setup completed!"

### 3. Test the Admin Console

1. **Visit the admin dashboard**:
   - If deployed: Visit your deployed URL + `/admin`
   - If local: Start the dev server with `npm run dev` and visit `http://localhost:5173/admin`

2. **The dashboard should now show**:
   - 5 total users (4 active, 1 pending)
   - 1 admin user (admin@taylor.edu)
   - 1 PA user (jane.smith@taylor.edu)
   - 3 regular users

### 4. User Details

The following test users have been created:

| Email | Role | Dorm | Wing | Status |
|-------|------|------|------|--------|
| admin@taylor.edu | Admin | Admin Building | Administration | Active |
| john.doe@taylor.edu | User | Wengatz Hall | Third West | Active |
| jane.smith@taylor.edu | PA | Olson Hall | Second East | Active |
| mike.johnson@taylor.edu | User | Morris Hall | First North | Pending |
| sara.williams@taylor.edu | User | English Hall | Third Center | Active |

## Troubleshooting

If users don't appear:

1. **Check browser console** for any errors
2. **Refresh the page** - sometimes the data needs a moment to propagate
3. **Check the SQL execution results** - ensure there were no errors
4. **Verify RLS policies** - the script sets up public read access

## Database Connection Details

Your Supabase connection:
- **URL**: https://gzzbjifmrwvqbkwbyvhm.supabase.co
- **Direct PostgreSQL**: postgresql://postgres:Idonotunderstandwhatido!@db.gzzbjifmrwvqbkwbyvhm.supabase.co:5432/postgres

The application is already configured to use these credentials via environment variables.