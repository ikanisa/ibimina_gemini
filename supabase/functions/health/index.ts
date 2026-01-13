/**
 * Health Check Edge Function
 * Provides health status for uptime monitoring
 * 
 * Endpoint: /functions/v1/health
 * Method: GET
 * 
 * Returns:
 * - 200 OK: System is healthy
 * - 503 Service Unavailable: System is unhealthy
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: 'ok' | 'degraded' | 'error';
    edge_function: 'ok' | 'error';
    [key: string]: string;
  };
  uptime?: number;
  responseTime?: number;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const checks: HealthCheckResult['checks'] = {
    edge_function: 'ok',
    database: 'error',
  };

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';

  try {
    // Check database connectivity
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      });

      // Simple database check - query a lightweight table
      const { error: dbError } = await supabase
        .from('institutions')
        .select('id')
        .limit(1);

      if (!dbError) {
        checks.database = 'ok';
        overallStatus = 'healthy';
      } else {
        checks.database = 'degraded';
        overallStatus = 'degraded';
      }
    } else {
      checks.database = 'error';
      overallStatus = 'unhealthy';
    }
  } catch (error) {
    console.error('Health check error:', error);
    checks.database = 'error';
    overallStatus = 'unhealthy';
  }

  const responseTime = Date.now() - startTime;

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: Deno.env.get('APP_VERSION') || 'unknown',
    checks,
    responseTime,
  };

  // Determine HTTP status code
  const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return new Response(
    JSON.stringify(result, null, 2),
    {
      status: httpStatus,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`,
      },
    }
  );
});
