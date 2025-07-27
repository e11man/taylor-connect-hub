#!/bin/bash

# Deploy the send-signup-confirmation edge function
echo "Deploying send-signup-confirmation edge function..."

# Make sure you have your Supabase project ID and access token set
# You can get these from your Supabase dashboard
# Set them as environment variables or replace them here:
# export SUPABASE_PROJECT_ID=your-project-id
# export SUPABASE_ACCESS_TOKEN=your-access-token

supabase functions deploy send-signup-confirmation

echo "Edge function deployment complete!"