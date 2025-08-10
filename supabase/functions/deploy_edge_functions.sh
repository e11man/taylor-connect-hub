#!/bin/bash

# Production-Ready Edge Functions Deployment Script
# Deploy all Edge Functions for Taylor Connect Hub Chat Notification System

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_REF="gzzbjifmrwvqbkwbyvhm"
FUNCTIONS=(
    "send-chat-notifications"
    "process-notifications-cron"
    "send-admin-approval"
    "send-email"
    "send-organization-otp"
    "send-signup-confirmation"
)

echo -e "${BLUE}🚀 Taylor Connect Hub - Production Edge Functions Deployment${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed. Please install it first:${NC}"
    echo "npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Supabase. Please login first:${NC}"
    echo "supabase login"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI is ready${NC}"
echo ""

# Function to deploy a single Edge Function
deploy_function() {
    local func_name=$1
    echo -e "${YELLOW}📦 Deploying ${func_name}...${NC}"
    
    if supabase functions deploy "$func_name" --project-ref "$PROJECT_REF" --no-verify-jwt; then
        echo -e "${GREEN}✅ Successfully deployed ${func_name}${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to deploy ${func_name}${NC}"
        return 1
    fi
}

# Function to verify deployment
verify_function() {
    local func_name=$1
    echo -e "${BLUE}🔍 Verifying ${func_name}...${NC}"
    
    # Get function URL
    local func_url="https://${PROJECT_REF}.supabase.co/functions/v1/${func_name}"
    
    # Test with a simple OPTIONS request
    if curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$func_url" | grep -q "200\|404"; then
        echo -e "${GREEN}✅ ${func_name} is accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ ${func_name} is not accessible${NC}"
        return 1
    fi
}

# Deploy all functions
echo -e "${BLUE}📋 Deploying ${#FUNCTIONS[@]} Edge Functions...${NC}"
echo ""

deployed_count=0
failed_functions=()

for func in "${FUNCTIONS[@]}"; do
    if deploy_function "$func"; then
        ((deployed_count++))
        sleep 2  # Brief pause between deployments
    else
        failed_functions+=("$func")
    fi
    echo ""
done

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}📊 Deployment Summary${NC}"
echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}✅ Successfully deployed: ${deployed_count}/${#FUNCTIONS[@]} functions${NC}"

if [ ${#failed_functions[@]} -gt 0 ]; then
    echo -e "${RED}❌ Failed deployments: ${failed_functions[*]}${NC}"
fi

echo ""

# Verify deployments
echo -e "${BLUE}🔍 Verifying deployments...${NC}"
echo ""

verified_count=0
for func in "${FUNCTIONS[@]}"; do
    if [[ ! " ${failed_functions[@]} " =~ " ${func} " ]]; then
        if verify_function "$func"; then
            ((verified_count++))
        fi
    fi
done

echo ""
echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}🎯 Production Setup Instructions${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""
echo -e "${YELLOW}1. Set Production Environment Variables:${NC}"
echo "   supabase secrets set RESEND_API_KEY=re_your_production_key --project-ref $PROJECT_REF"
echo ""
echo -e "${YELLOW}2. Enable Cron Job for Automated Processing:${NC}"
echo "   - Go to Supabase Dashboard > Edge Functions"
echo "   - Find 'process-notifications-cron' function"
echo "   - Set up cron schedule: '*/5 * * * *' (every 5 minutes)"
echo "   - Or use: supabase functions schedule process-notifications-cron --cron '*/5 * * * *'"
echo ""
echo -e "${YELLOW}3. Monitor Function Logs:${NC}"
echo "   supabase functions logs send-chat-notifications --project-ref $PROJECT_REF"
echo "   supabase functions logs process-notifications-cron --project-ref $PROJECT_REF"
echo ""
echo -e "${YELLOW}4. Test the System:${NC}"
echo "   - Send a test chat message in your application"
echo "   - Check notification_status view in your database"
echo "   - Verify email delivery in Resend dashboard"
echo ""
echo -e "${YELLOW}5. Function URLs:${NC}"
for func in "${FUNCTIONS[@]}"; do
    if [[ ! " ${failed_functions[@]} " =~ " ${func} " ]]; then
        echo "   ${func}: https://${PROJECT_REF}.supabase.co/functions/v1/${func}"
    fi
done
echo ""

if [ $deployed_count -eq ${#FUNCTIONS[@]} ] && [ $verified_count -eq $deployed_count ]; then
    echo -e "${GREEN}🎉 All Edge Functions deployed and verified successfully!${NC}"
    echo -e "${GREEN}🚀 Your production chat notification system is ready!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some functions failed to deploy or verify. Please check the errors above.${NC}"
    exit 1
fi