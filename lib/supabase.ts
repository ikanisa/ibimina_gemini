// ============================================================================
// SUPABASE CLIENT SETUP (Native Fetch)
// ============================================================================

// Use environment variables for Supabase credentials
// These MUST be set via environment variables - see .env.example
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Missing required environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. ' +
    'Please create a .env.local file with these values. See .env.example for reference.'
  );
}

// Helper to safely access localStorage (handles SSR)
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

class SupabaseClient {
  private url: string;
  private key: string;
  private accessToken: string | null = null;

  constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
    // Try to restore session from localStorage (safe for SSR)
    const savedToken = safeLocalStorage.getItem('supabase_token');
    if (savedToken) {
      this.accessToken = savedToken;
    }
  }

  private getHeaders(): Record<string, string> {
    // Try to restore session from localStorage
    const savedToken = safeLocalStorage.getItem('supabase_token');
    if (savedToken) {
      this.accessToken = savedToken;
    }
    
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.accessToken || this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  // Auth methods
  auth = {
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': this.key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error_description || data.message || 'Login failed');
      }

      this.accessToken = data.access_token;
      safeLocalStorage.setItem('supabase_token', data.access_token);
      safeLocalStorage.setItem('supabase_user', JSON.stringify(data.user));

      return { data: { user: data.user, session: data }, error: null };
    },

    signOut: async () => {
      this.accessToken = null;
      safeLocalStorage.removeItem('supabase_token');
      safeLocalStorage.removeItem('supabase_user');
      return { error: null };
    },

    getSession: async () => {
      if (typeof window === 'undefined') {
        return { data: { session: null }, error: null };
      }
      
      const token = safeLocalStorage.getItem('supabase_token');
      const userStr = safeLocalStorage.getItem('supabase_user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        return { data: { session: { user, access_token: token } }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    onAuthStateChange: (_callback: (event: string, session: unknown) => void) => {
      // Simple implementation - in production you'd want proper event handling
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  };

  // Database methods
  from(table: string) {
    return new SupabaseQueryBuilder(this.url, this.getHeaders(), table);
  }
}

class SupabaseQueryBuilder {
  private url: string;
  private headers: Record<string, string>;
  private table: string;
  private query: string[] = [];
  private selectQuery = '*';
  private limitValue?: number;
  private orderByValue?: string;
  private countMode: 'exact' | 'planned' | 'estimated' | null = null;
  private headMode = false;

  constructor(url: string, headers: Record<string, string>, table: string) {
    this.url = url;
    // Create a copy of headers to avoid mutations affecting other queries
    this.headers = { ...headers };
    this.table = table;
  }

  select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated', head?: boolean }) {
    this.selectQuery = columns;
    if (options?.count) {
      this.countMode = options.count;
      this.headers['Prefer'] = `count=${options.count}`;
    }
    if (options?.head) {
      this.headMode = true;
    }
    return this;
  }

  eq(column: string, value: unknown) {
    this.query.push(`${column}=eq.${value}`);
    return this;
  }

  gte(column: string, value: unknown) {
    this.query.push(`${column}=gte.${value}`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const direction = options?.ascending === false ? 'desc' : 'asc';
    this.orderByValue = `${column}.${direction}`;
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  async then<T>(resolve: (value: { data: T | null; error: { message: string } | null; count: number | null }) => void) {
    try {
      const queryParams = new URLSearchParams();
      
      if (!this.headMode) {
        queryParams.append('select', this.selectQuery);
      }
      
      this.query.forEach(q => {
        // Use indexOf to handle values that may contain '=' characters
        const eqIndex = q.indexOf('=');
        if (eqIndex !== -1) {
          const key = q.substring(0, eqIndex);
          const value = q.substring(eqIndex + 1);
          queryParams.append(key, value);
        }
      });

      if (this.orderByValue) {
        queryParams.append('order', this.orderByValue);
      }

      if (this.limitValue) {
        queryParams.append('limit', this.limitValue.toString());
      }

      const method = this.headMode ? 'HEAD' : 'GET';
      const response = await fetch(
        `${this.url}/rest/v1/${this.table}?${queryParams}`,
        { method, headers: this.headers }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        return resolve({ data: null, error, count: null });
      }

      let data: T | null = null;
      let count: number | null = null;

      if (this.countMode) {
        const contentRange = response.headers.get('Content-Range');
        if (contentRange) {
          const match = contentRange.match(/\/(\d+)$/);
          count = match ? parseInt(match[1]) : null;
        }
      }

      if (!this.headMode) {
        data = await response.json();
      }

      return resolve({ data, error: null, count });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return resolve({ data: null, error: { message }, count: null });
    }
  }

  async insert(data: Record<string, unknown> | Record<string, unknown>[]) {
    try {
      const response = await fetch(
        `${this.url}/rest/v1/${this.table}`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: new Error(errorData.message || 'Insert failed') };
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async update(data: Record<string, unknown>) {
    try {
      const queryParams = new URLSearchParams();
      this.query.forEach(q => {
        const [key, value] = q.split('=');
        queryParams.append(key, value);
      });

      const response = await fetch(
        `${this.url}/rest/v1/${this.table}?${queryParams.toString()}`,
        {
          method: 'PATCH',
          headers: this.headers,
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: new Error(errorData.message || 'Update failed') };
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async delete() {
    try {
      const queryParams = new URLSearchParams();
      this.query.forEach(q => {
        const [key, value] = q.split('=');
        queryParams.append(key, value);
      });

      const response = await fetch(
        `${this.url}/rest/v1/${this.table}?${queryParams.toString()}`,
        {
          method: 'DELETE',
          headers: this.headers
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: new Error(errorData.message || 'Delete failed') };
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}

export const supabase = new SupabaseClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');
