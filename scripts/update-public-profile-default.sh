#!/bin/bash

echo "🔄 Running migration to set public profile default to true..."
npx supabase db push

echo "✅ Migration complete! New profiles will now have public profile enabled by default." 