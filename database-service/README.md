# Database Service

This folder contains the database management service for Taylor Connect Hub.

## Setup

1. **Install Dependencies:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Environment Variables:**
   - Set `DATABASE_URL` environment variable with your Supabase database URL
   - Or the script will use the default connection string

## Usage

### Interactive Mode (Recommended)
```bash
cd database-service
source venv/bin/activate
python content_manager.py
```

This will start an interactive menu where you can:
- List all content
- Update content by selecting from a list
- Create new content
- Delete content

### Command Line Mode

**List all content:**
```bash
python content_manager.py list
```

**Update content:**
```bash
python content_manager.py update <content_id> <new_value>
```

**Create new content:**
```bash
python content_manager.py create <page> <section> <key> <value>
```

**Delete content:**
```bash
python content_manager.py delete <content_id>
```

## Features

- Direct database connection to Supabase
- Interactive menu for easy content management
- Command line interface for automation
- Safe database operations with proper error handling
- Clear success/error messages
- Content organized by page and section

## Database Connection

The script connects directly to your Supabase PostgreSQL database using the connection string:
```
postgresql://postgres.gzzbjifmrwvqbkwbyvhm:Idonotunderstandwhatido!@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

## Content Structure

Content is organized as:
- **Page**: The page where content appears (e.g., 'home', 'about')
- **Section**: The section within the page (e.g., 'hero', 'nav')
- **Key**: The specific content key (e.g., 'title', 'subtitle')
- **Value**: The actual content text

## Integration

This service can be used to:
- Manage all website content
- Update content without touching the frontend
- Bulk content operations
- Content migration and setup 