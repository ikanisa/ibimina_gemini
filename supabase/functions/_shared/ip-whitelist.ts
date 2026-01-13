/**
 * IP Whitelisting Utility for Supabase Edge Functions
 * 
 * Supports:
 * - Exact IP addresses (IPv4 and IPv6)
 * - CIDR notation (e.g., 192.168.1.0/24)
 * - Per-institution IP whitelists from database
 * - Environment variable fallback
 * 
 * Usage:
 *   const isAllowed = await checkIPWhitelist(clientIP, institutionId, supabase)
 *   if (!isAllowed) {
 *     return new Response(JSON.stringify({ error: 'IP not allowed' }), { status: 403 })
 *   }
 */

interface IPWhitelistResult {
  allowed: boolean;
  reason?: string;
  source?: 'environment' | 'database' | 'default';
}

/**
 * Convert IP address to number for comparison
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

/**
 * Check if IP is in CIDR range (IPv4)
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    const [network, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    
    if (isNaN(prefix) || prefix < 0 || prefix > 32) {
      return false;
    }

    const ipNum = ipToNumber(ip);
    const networkNum = ipToNumber(network);
    const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0; // Unsigned right shift

    return (ipNum & mask) === (networkNum & mask);
  } catch {
    return false;
  }
}

/**
 * Check if IP is in CIDR range (IPv6)
 * Simplified IPv6 CIDR check - for production, use a proper IPv6 library
 */
function isIPv6InCIDR(ip: string, cidr: string): boolean {
  try {
    const [network, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    
    if (isNaN(prefix) || prefix < 0 || prefix > 128) {
      return false;
    }

    // Normalize IPv6 addresses
    const normalizeIPv6 = (addr: string): string => {
      // Expand compressed IPv6 addresses
      if (addr.includes('::')) {
        const parts = addr.split('::');
        const left = parts[0].split(':').filter(Boolean);
        const right = parts[1]?.split(':').filter(Boolean) || [];
        const missing = 8 - left.length - right.length;
        const expanded = [...left, ...Array(missing).fill('0'), ...right];
        return expanded.map(p => p.padStart(4, '0')).join(':');
      }
      return addr.split(':').map(p => p.padStart(4, '0')).join(':');
    };

    const ipNormalized = normalizeIPv6(ip);
    const networkNormalized = normalizeIPv6(network);

    // For simplified check, compare first prefix/4 hex digits
    const prefixHex = Math.ceil(prefix / 4);
    return ipNormalized.substring(0, prefixHex) === networkNormalized.substring(0, prefixHex);
  } catch {
    return false;
  }
}

/**
 * Check if IP matches a whitelist entry (supports exact IP or CIDR)
 */
function matchesWhitelistEntry(ip: string, entry: string): boolean {
  const trimmed = entry.trim();
  
  // Exact match
  if (ip === trimmed) {
    return true;
  }

  // CIDR notation
  if (trimmed.includes('/')) {
    // IPv4 CIDR
    if (ip.includes('.')) {
      return isIPInCIDR(ip, trimmed);
    }
    // IPv6 CIDR
    if (ip.includes(':')) {
      return isIPv6InCIDR(ip, trimmed);
    }
  }

  return false;
}

/**
 * Check IP against environment variable whitelist
 */
function checkEnvironmentWhitelist(ip: string | null): IPWhitelistResult {
  if (!ip) {
    return { allowed: false, reason: 'No IP address provided', source: 'environment' };
  }

  const allowedIPs = Deno.env.get('SMS_WEBHOOK_ALLOWED_IPS');
  
  // If no allowlist configured, allow all (backward compatible)
  if (!allowedIPs) {
    return { allowed: true, source: 'default' };
  }

  // Parse comma-separated list
  const allowedIPList = allowedIPs.split(',').map(ip => ip.trim()).filter(Boolean);

  // Check if IP matches any entry
  const allowed = allowedIPList.some(entry => matchesWhitelistEntry(ip, entry));

  return {
    allowed,
    reason: allowed ? undefined : 'IP not in environment whitelist',
    source: 'environment',
  };
}

/**
 * Check IP against database whitelist for institution
 */
async function checkDatabaseWhitelist(
  ip: string | null,
  institutionId: string | undefined,
  supabase: any
): Promise<IPWhitelistResult> {
  if (!ip) {
    return { allowed: false, reason: 'No IP address provided', source: 'database' };
  }

  // If no institution ID, skip database check
  if (!institutionId) {
    return { allowed: true, source: 'default' };
  }

  try {
    // Get IP whitelist for institution
    const { data, error } = await supabase
      .from('institution_ip_whitelist')
      .select('ip_address, cidr_prefix')
      .eq('institution_id', institutionId)
      .eq('is_active', true);

    if (error) {
      console.warn('Failed to load IP whitelist from database:', error);
      // Fallback to environment check
      return checkEnvironmentWhitelist(ip);
    }

    // If no whitelist entries, allow (institution hasn't configured whitelist)
    if (!data || data.length === 0) {
      return { allowed: true, source: 'default' };
    }

    // Check if IP matches any whitelist entry
    const allowed = data.some(entry => {
      if (entry.cidr_prefix) {
        // CIDR notation
        const cidr = `${entry.ip_address}/${entry.cidr_prefix}`;
        return matchesWhitelistEntry(ip, cidr);
      } else {
        // Exact IP match
        return matchesWhitelistEntry(ip, entry.ip_address);
      }
    });

    return {
      allowed,
      reason: allowed ? undefined : 'IP not in institution whitelist',
      source: 'database',
    };
  } catch (error) {
    console.error('Database IP whitelist check error:', error);
    // Fallback to environment check
    return checkEnvironmentWhitelist(ip);
  }
}

/**
 * Main IP whitelist check function
 * Checks database first (if institution ID provided), then environment variable
 */
export async function checkIPWhitelist(
  ip: string | null,
  institutionId: string | undefined,
  supabase?: any
): Promise<IPWhitelistResult> {
  // Try database whitelist first (if institution ID and supabase client provided)
  if (institutionId && supabase) {
    const dbResult = await checkDatabaseWhitelist(ip, institutionId, supabase);
    // If database has a definitive answer (not default), use it
    if (dbResult.source !== 'default') {
      return dbResult;
    }
  }

  // Fallback to environment variable
  return checkEnvironmentWhitelist(ip);
}

/**
 * Extract client IP from request headers
 */
export function extractClientIP(req: Request): string | null {
  // Check x-forwarded-for (first IP in chain)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 0) {
      return ips[0];
    }
  }

  // Check x-real-ip
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP.trim();
  }

  return null;
}
