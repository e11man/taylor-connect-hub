#!/bin/bash

# Check if RESEND_API_KEY is provided as argument
if [ -z "$1" ]; then
    echo "Usage: ./set-resend-key.sh <RESEND_API_KEY> [SEND_EMAIL_HOOK_SECRET]"
    echo "Example: ./set-resend-key.sh re_xxxxxxxxx whsec_xxxxxxxxx"
    echo ""
    echo "Note: SEND_EMAIL_HOOK_SECRET is optional if you already set it"
    exit 1
fi

RESEND_API_KEY=$1
SEND_EMAIL_HOOK_SECRET=$2

echo "Setting RESEND_API_KEY in Supabase..."

# Set the RESEND_API_KEY
npx supabase secrets set RESEND_API_KEY=$RESEND_API_KEY

# Set the SEND_EMAIL_HOOK_SECRET if provided
if [ ! -z "$SEND_EMAIL_HOOK_SECRET" ]; then
    echo "Setting SEND_EMAIL_HOOK_SECRET in Supabase..."
    # Remove the v1,whsec_ prefix if present
    CLEAN_SECRET=${SEND_EMAIL_HOOK_SECRET#v1,whsec_}
    npx supabase secrets set SEND_EMAIL_HOOK_SECRET=$CLEAN_SECRET
fi

# List secrets to confirm
echo ""
echo "Verifying secrets were set:"
npx supabase secrets list

echo ""
echo "✅ Secrets have been set successfully!"
echo ""
echo "Next steps:"
echo "1. Configure the Send Email Hook in your Supabase dashboard"
echo "2. Deploy the edge function: npx supabase functions deploy send-email --no-verify-jwt"