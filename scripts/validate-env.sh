#!/bin/bash
set -e

echo "🔍 Validating Consilium environment variables..."
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
VALIDATION_PASSED=true

# Function to check if a variable is set
check_var() {
    local var_name=$1
    local var_value="${!var_name}"
    local is_required=$2

    if [ -z "$var_value" ]; then
        if [ "$is_required" = "required" ]; then
            echo -e "${RED}❌ Missing required variable: $var_name${NC}"
            VALIDATION_PASSED=false
        else
            echo -e "${YELLOW}⚠️  Optional variable not set: $var_name${NC}"
        fi
    else
        echo -e "${GREEN}✅ $var_name is set${NC}"
    fi
}

echo "📦 Database Configuration"
echo "------------------------"
check_var "DATABASE_URL" "required"
check_var "DIRECT_URL" "optional"
echo ""

echo "🔄 Cache Configuration"
echo "---------------------"
check_var "REDIS_URL" "required"
check_var "UPSTASH_REDIS_REST_URL" "optional"
check_var "UPSTASH_REDIS_REST_TOKEN" "optional"
echo ""

echo "🔐 Authentication"
echo "----------------"
check_var "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "required"
check_var "CLERK_SECRET_KEY" "required"
check_var "CLERK_WEBHOOK_SECRET" "optional"
echo ""

echo "🤖 LLM API Keys"
echo "--------------"
# At least one LLM API key must be set
if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$GOOGLE_API_KEY" ] && [ -z "$GROQ_API_KEY" ] && [ -z "$XAI_API_KEY" ]; then
    echo -e "${RED}❌ At least one LLM API key must be set${NC}"
    echo "   - OPENAI_API_KEY (for GPT models)"
    echo "   - ANTHROPIC_API_KEY (for Claude models)"
    echo "   - GOOGLE_API_KEY (for Gemini models)"
    echo "   - GROQ_API_KEY (for Groq models)"
    echo "   - XAI_API_KEY (for Grok models)"
    VALIDATION_PASSED=false
else
    check_var "OPENAI_API_KEY" "optional"
    check_var "ANTHROPIC_API_KEY" "optional"
    check_var "GOOGLE_API_KEY" "optional"
    check_var "GROQ_API_KEY" "optional"
    check_var "XAI_API_KEY" "optional"
fi
echo ""

echo "🌐 Application URLs"
echo "------------------"
check_var "NEXT_PUBLIC_APP_URL" "required"
check_var "NEXT_PUBLIC_API_URL" "required"
check_var "AGENTS_URL" "optional"
echo ""

echo "🔧 Optional Services"
echo "-------------------"
check_var "SENTRY_DSN" "optional"
check_var "RESEND_API_KEY" "optional"
check_var "LANGFUSE_SECRET_KEY" "optional"
check_var "ENCRYPTION_KEY" "optional"
check_var "JWT_SECRET" "optional"
echo ""

# Final summary
echo "=================================="
if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}✅ All required environment variables are set!${NC}"
    echo ""
    echo "You're ready to:"
    echo "  - Run 'pnpm dev' for local development"
    echo "  - Run 'docker-compose up' for containerized development"
    echo "  - Deploy to production"
    exit 0
else
    echo -e "${RED}❌ Environment validation failed!${NC}"
    echo ""
    echo "Please set the missing required variables in your .env.local file"
    echo "or environment before proceeding."
    echo ""
    echo "Quick start:"
    echo "  1. Copy .env.example to .env.local"
    echo "  2. Fill in the required values"
    echo "  3. Run this script again"
    exit 1
fi
