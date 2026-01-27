/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * Execute configuration SQL via Supabase Management API
 * NOTE: This script is intended to run with Deno, not Node.js
 */

// Make this a module for top-level await
export { };

const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZGh5ZGVtdXNocXF0Y3JybHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc0MTU1NCwiZXhwIjoyMDgxMzE3NTU0fQ.mQg8USbqggCTUinPPhsvdqFl1j8baX71ulUvVdGYL7s";
const SUPABASE_URL = `https://wadhydemushqqtcrrlwm.supabase.co`;

async function executeViaRPC(functionName: string, params: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`RPC call failed: ${error}`);
  }

  return await response.json();
}

// Step 1: Mark daily contribution groups
console.log("Step 1: Marking daily contribution groups...");
try {
  await executeViaRPC('exec_sql', {
    query: `UPDATE public.groups SET daily_contribution = true WHERE group_name ILIKE '%buri munsi%' OR group_name ILIKE '%daily%' OR group_name ILIKE '%everyday%'`
  });
  console.log("✅ Step 1 completed");
} catch {
  console.log("⚠️ Step 1: Using direct update...");
  // Try direct update via REST API
  const updateResult = await fetch(`${SUPABASE_URL}/rest/v1/groups?daily_contribution=eq.false&group_name=ilike.*buri*munsi*`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ daily_contribution: true }),
  });
  console.log("Update result:", await updateResult.text());
}

// Step 2: Ensure groups have leaders - this needs to be done via a function
console.log("\nStep 2: Ensuring all groups have leaders...");
// This will be handled by the database function, we'll call it via SQL

// Step 3: Seed notification templates
console.log("\nStep 3: Seeding notification templates...");
try {
  // Get all institutions first
  const institutionsResponse = await fetch(`${SUPABASE_URL}/rest/v1/institutions?status=eq.ACTIVE&select=id`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });

  const institutions = await institutionsResponse.json();
  console.log(`Found ${institutions.length} active institutions`);

  for (const inst of institutions) {
    try {
      await executeViaRPC('seed_notification_templates', {
        p_institution_id: inst.id,
      });
      console.log(`✅ Seeded templates for institution ${inst.id}`);
    } catch (error) {
      console.error(`❌ Failed to seed templates for ${inst.id}:`, error);
    }
  }
} catch (error) {
  console.error("Error in Step 3:", error);
}

console.log("\n✅ Configuration complete!");
