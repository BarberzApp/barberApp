const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBookingConstraints() {
  try {
    console.log('🔍 Checking bookings table constraints...')
    
    // Query to get table constraints
    const { data: constraints, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            conname as constraint_name,
            pg_get_constraintdef(oid) as constraint_definition
          FROM pg_constraint 
          WHERE conrelid = 'bookings'::regclass
          AND contype = 'c'
          ORDER BY conname;
        `
      })

    if (error) {
      console.error('❌ Error fetching constraints:', error.message)
      return
    }

    console.log('📋 Bookings table constraints:')
    if (constraints && constraints.length > 0) {
      constraints.forEach(constraint => {
        console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_definition}`)
      })
    } else {
      console.log('  No check constraints found')
    }

    // Also check the table structure
    console.log('')
    console.log('📋 Bookings table structure:')
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'bookings'
          ORDER BY ordinal_position;
        `
      })

    if (columnsError) {
      console.error('❌ Error fetching columns:', columnsError.message)
      return
    }

    if (columns && columns.length > 0) {
      columns.forEach(column => {
        console.log(`  - ${column.column_name}: ${column.data_type} ${column.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${column.column_default ? `DEFAULT ${column.column_default}` : ''}`)
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkBookingConstraints() 