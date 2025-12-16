#!/bin/bash
echo "🚀 Starting Phase 1 Startup Sequence..."

# 1. Start Supabase
echo "🐘 Starting Supabase..."
cd backend
npx supabase start || echo "Supabase start failed or already running"
cd ..

# 2. Update n8n
echo "🔄 Updating n8n..."
node backend/scripts/update_n8n_container.js

# 3. Migration
echo "📦 Running Migrations..."
cd backend
npx supabase migration up
cd ..

# 4. Deploy Workflow
echo "⚡ Deploying WF01..."
node backend/scripts/deploy_workflow_api.js backend/n8n/WF01-Document-Parsing.json

# 5. Gen Types
echo "📝 Generating Types..."
cd backend
npx supabase gen types typescript --local > ../frontend/src/types/supabase.ts
cd ..

echo "✅ Startup Sequence Complete!"
