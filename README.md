# Taylor Connect Hub

A community service platform for Taylor University students to connect with volunteer opportunities and manage group signups.

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd taylor-connect-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 📚 Documentation

All documentation is organized in the [`md/`](./md/) folder:

- **[Complete Setup Guide](./md/COMPLETE_SETUP_INSTRUCTIONS.md)** - Full setup instructions
- **[Deployment Guide](./md/DEPLOYMENT_GUIDE.md)** - How to deploy the application
- **[PA Group Management](./md/PA_GROUP_MANAGEMENT_FEATURE.md)** - PA group signup feature
- **[Admin Fixes](./md/ADMIN_LOGIN_FIX_README.md)** - Admin authentication fixes

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Email**: Resend (for notifications)
- **Deployment**: Vercel

## 🎯 Features

- **User Authentication**: Student and organization signup/login
- **Event Management**: Create and manage volunteer opportunities
- **PA Group Signups**: Program Assistants can sign up multiple students
- **Email Notifications**: Automated confirmations for event signups
- **Admin Dashboard**: Manage users, events, and system settings
- **Real-time Chat**: Event-specific communication

## 📁 Project Structure

```
taylor-connect-hub/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utility functions
│   └── integrations/  # External integrations
├── supabase/
│   ├── migrations/    # Database migrations
│   └── functions/     # Edge functions
├── md/               # Documentation
└── public/           # Static assets
```

## 🔧 Development

### Database Migrations
```bash
# Apply migrations
supabase db push

# Create new migration
supabase migration new migration_name
```

### Edge Functions
```bash
# Deploy functions
supabase functions deploy function-name
```

### Environment Variables
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (for email notifications)

## 🚀 Deployment

The application is deployed on Vercel and automatically updates on push to main branch.

## 📞 Support

For issues and questions:
1. Check the [documentation](./md/) first
2. Look for existing solutions in [SOLUTION_SUMMARY.md](./md/SOLUTION_SUMMARY.md)
3. Create an issue with detailed information

---

**Built for Taylor University Community Service** 