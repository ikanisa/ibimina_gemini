/**
 * Script to execute configure-groups.sql via Supabase REST API
 * This uses the service role key to execute SQL via RPC
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://wadhydemushqqtcrrlwm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZGh5ZGVtdXNocXF0Y3JybHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc0MTU1NCwiZXhwIjoyMDgxMzE3NTU0fQ.mQg8USbqggCTUinPPhsvdqFl1j8baX71ulUvVdGYL7s';

async function executeConfigureGroups() {
  console.log('📋 Executing configure-groups.sql...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Read the SQL file
  const sqlPath = join(process.cwd(), 'scripts', 'configure-groups.sql');
  const sqlContent = readFileSync(sqlPath, 'utf-8');

  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length < 10) continue; // Skip very short statements

    try {
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      // Use RPC to execute SQL (if we have an execute_sql function)
      // Otherwise, we'll need to use the SQL Editor API
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        console.error(`Error in statement ${i + 1}:`, error.message);
        // Continue with next statement
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error executing statement ${i + 1}:`, message);
    }
  }

  console.log('\n✅ Configuration complete!');
  console.log('\nNote: If exec_sql RPC doesn\'t exist, please run the SQL manually in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/wadhydemushqqtcrrlwm/sql/new');
}

// Run if executed directly
if (require.main === module) {
  executeConfigureGroups().catch(console.error);
}

export { executeConfigureGroups };
