/**
 * Execute configuration SQL script via Supabase Management API
 */

const SUPABASE_ACCESS_TOKEN = "sbp_d3eb3056d2f5f9e672187f498516d47774372ceb";
const PROJECT_REF = "wadhydemushqqtcrrlwm";
const SUPABASE_URL = `https://wadhydemushqqtcrrlwm.supabase.co`;
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZGh5ZGVtdXNocXF0Y3JybHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc0MTU1NCwiZXhwIjoyMDgxMzE3NTU0fQ.mQg8USbqggCTUinPPhsvdqFl1j8baX71ulUvVdGYL7s";

// Read the SQL file
const sqlScript = await Deno.readTextFile("scripts/configure-groups.sql");

// Split into individual statements (simple approach)
const statements = sqlScript
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

async function executeSQL(query: string) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SQL execution failed: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error executing SQL:`, error);
    throw error;
  }
}

// Execute the full script as one query
try {
  console.log("Executing configuration script...");
  const result = await executeSQL(sqlScript);
  console.log("✅ Configuration script executed successfully!");
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("❌ Error:", error);
  Deno.exit(1);
}
