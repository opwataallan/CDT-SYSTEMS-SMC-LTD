import {
  Product,
  ProductReview,
  Category,
  CustomerOrder,
  StoreSettings,
  DeliveryZone,
  Coupon,
  HeroBanner,
  CustomerUser,
  MarketplaceConfig,
  AuditLogEntry,
  UserRole,
} from '../types';
import { getStoredReviewsForProduct, saveLocalProductReview } from '../data/initialReviews';

/**
 * Universal safe API requester that guarantees:
 * 1. credentials: 'include' (preserves session cookies in iframes/domains)
 * 2. Checks content-type and payload BEFORE calling res.json()
 * 3. Gracefully catches HTML fallbacks without throwing raw SyntaxError ("Unexpected token <")
 * 4. Extracts structured server errors
 */
async function safeFetch<T = any>(
  input: string,
  init?: RequestInit,
  fallbackError = 'Request failed'
): Promise<T> {
  const mergedInit: RequestInit = {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
  };

  let res: Response;
  try {
    res = await fetch(input, mergedInit);
  } catch (netErr: any) {
    throw new Error(
      netErr?.message || 'Network connection failed. Please verify your connection to the server.'
    );
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (!res.ok) {
      if (res.status === 429) {
        // Automatic gentle backoff retry for rate-limited bursts
        const retryAfter = Number(res.headers.get('Retry-After')) || 1;
        const delayMs = Math.min(Math.max(retryAfter * 1000, 800), 2500);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        try {
          const retryRes = await fetch(input, mergedInit);
          if (retryRes.ok) {
            const retryContentType = retryRes.headers.get('content-type') || '';
            if (retryContentType.includes('application/json')) {
              return (await retryRes.json()) as T;
            }
          }
        } catch {
          // Fall through to throw standard message
        }
      }
      throw new Error(json?.error || json?.message || `${fallbackError} (${res.status})`);
    }
    return json as T;
  }

  // Not JSON: could be HTML from server restart, 502 proxy, or static fallback
  const text = await res.text().catch(() => '');
  if (text.includes('<!DOCTYPE') || text.includes('<html') || contentType.includes('text/html')) {
    throw new Error(
      `Server response was not in JSON format (${res.status} ${res.statusText}). The service may be starting or reloading. Please try again.`
    );
  }

  if (!res.ok) {
    throw new Error(text.trim() || `${fallbackError} (${res.status})`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const api = {
  // ------------------------------------------
  // Security & Anti-Bot Helpers
  // ------------------------------------------
  async getSecurityChallenge(): Promise<{ challenge_token: string; question: string; answer_hash: string }> {
    return safeFetch('/api/security/challenge', { method: 'GET' }, 'Security challenge failed');
  },

  // Helper to solve server-issued anti-bot challenge
  async resolveBotChallenge(): Promise<{ challenge_token: string; challenge_answer: string } | null> {
    try {
      const ch = await safeFetch<{ challenge_token: string; question: string }>('/api/security/challenge', { method: 'GET' });
      const match = ch?.question?.match(/What is (\d+)\s*\+\s*(\d+)\?/);
      if (match) {
        return {
          challenge_token: ch.challenge_token,
          challenge_answer: String(Number(match[1]) + Number(match[2])),
        };
      }
    } catch {
      // Ignore
    }
    return null;
  },

  // ------------------------------------------
  // Authentication & Profile Services
  // ------------------------------------------
  async register(data: {
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
    password: string;
    challenge_token?: string;
    challenge_answer?: string;
    website_url?: string;
  }): Promise<{ success: boolean; user: CustomerUser; message: string }> {
    let payload = { ...data };
    if (!payload.challenge_token) {
      const ch = await this.resolveBotChallenge();
      if (ch) {
        payload.challenge_token = ch.challenge_token;
        payload.challenge_answer = ch.challenge_answer;
      }
    }

    return safeFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 'Registration failed');
  },

  async login(
    credentialsOrEmail: { email: string; password: string } | string,
    maybePassword?: string
  ): Promise<{
    success: boolean;
    user: CustomerUser;
    token: string;
    message: string;
  }> {
    const credentials =
      typeof credentialsOrEmail === 'string'
        ? { email: credentialsOrEmail, password: maybePassword || '' }
        : credentialsOrEmail;

    return safeFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials || {}),
    }, 'Login failed');
  },

  async quickLogin(role: 'admin' | 'staff' | 'customer' = 'admin'): Promise<{
    success: boolean;
    user: CustomerUser;
    token: string;
    message: string;
  }> {
    return safeFetch('/api/auth/quick-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }, 'Quick login failed');
  },

  async getCurrentUser(): Promise<{ authenticated: boolean; user: CustomerUser }> {
    return safeFetch('/api/auth/me', { method: 'GET' }, 'Authentication verification failed');
  },

  async logout(): Promise<{ success: boolean }> {
    return safeFetch('/api/auth/logout', { method: 'POST' }, 'Logout failed');
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; simulated_reset_link?: string }> {
    const ch = await this.resolveBotChallenge();
    const payload: any = { email };
    if (ch) {
      payload.challenge_token = ch.challenge_token;
      payload.challenge_answer = ch.challenge_answer;
    }

    return safeFetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 'Password reset request failed');
  },

  async resetPassword(payload: { email: string; reset_token: string; new_password: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    return safeFetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 'Password reset confirmation failed');
  },

  async updateProfile(profileData: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    addresses?: any[];
  }): Promise<{ success: boolean; user: CustomerUser }> {
    return safeFetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    }, 'Failed to update profile');
  },

  // ------------------------------------------
  // Full 31-Category Admin Settings System
  // ------------------------------------------
  async getAllSettings(): Promise<{
    config: MarketplaceConfig;
    usersCount: number;
    ordersCount: number;
    productsCount: number;
  }> {
    return safeFetch('/api/admin/all-settings', { method: 'GET' }, 'Failed to retrieve marketplace settings');
  },

  async saveCategorySettings<K extends keyof MarketplaceConfig>(category: K, settings: Partial<MarketplaceConfig[K]>): Promise<{
    success: boolean;
    config: MarketplaceConfig;
    message: string;
  }> {
    return safeFetch('/api/admin/all-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, settings }),
    }, 'Failed to save category settings');
  },

  async saveFullSettings(fullConfig: Partial<MarketplaceConfig>): Promise<{
    success: boolean;
    config: MarketplaceConfig;
    message: string;
  }> {
    return safeFetch('/api/admin/all-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullConfig }),
    }, 'Failed to save full configuration');
  },

  async resetCategorySettings(category: string): Promise<{
    success: boolean;
    config: MarketplaceConfig;
    message: string;
  }> {
    return safeFetch('/api/admin/reset-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    }, 'Failed to reset settings');
  },

  async getAuditLogs(): Promise<{ logs: AuditLogEntry[] }> {
    return safeFetch('/api/admin/audit-logs', { method: 'GET' }, 'Failed to retrieve audit logs');
  },

  async getAdminUsers(): Promise<{ users: CustomerUser[] }> {
    return safeFetch('/api/admin/users', { method: 'GET' }, 'Failed to retrieve users');
  },

  async updateUserRole(id: number, role: UserRole): Promise<{ success: boolean; user: CustomerUser }> {
    return safeFetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }, 'Failed to update user role');
  },

  async updateAdminUserProfile(id: number, profileData: Partial<CustomerUser>): Promise<{
    success: boolean;
    user: CustomerUser;
    message: string;
  }> {
    return safeFetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    }, 'Failed to update user profile');
  },

  async getAnalytics(timeframe: string = '30d'): Promise<any> {
    return safeFetch(`/api/admin/analytics?timeframe=${encodeURIComponent(timeframe)}`, { method: 'GET' }, 'Failed to retrieve analytics');
  },

  async getPublicConfig(): Promise<Partial<MarketplaceConfig>> {
    return safeFetch('/api/config/public', { method: 'GET' }, 'Failed to fetch public configuration');
  },

  // ------------------------------------------
  // WooCommerce & Catalog Services
  // ------------------------------------------
  async getProducts(params: {
    search?: string;
    category?: string;
    brand?: string;
    featured?: boolean;
    flash_sale?: boolean;
    min_price?: number;
    max_price?: number;
    sort?: string;
    page?: number;
    limit?: number;
    stock_status?: string;
  } = {}): Promise<{ products: Product[]; total: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.brand) query.set('brand', params.brand);
    if (params.featured) query.set('featured', 'true');
    if (params.flash_sale) query.set('flash_sale', 'true');
    if (params.min_price) query.set('min_price', String(params.min_price));
    if (params.max_price) query.set('max_price', String(params.max_price));
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', String(params.page));
    query.set('limit', String(params.limit !== undefined ? params.limit : 5000));
    if (params.stock_status) query.set('stock_status', params.stock_status);

    return safeFetch(`/api/woocommerce/products?${query.toString()}`, { method: 'GET' }, 'Failed to fetch products');
  },

  async getProduct(identifier: string | number): Promise<Product> {
    return safeFetch(`/api/woocommerce/products/${identifier}`, { method: 'GET' }, 'Product not found');
  },

  async getReviews(productId: number): Promise<ProductReview[]> {
    try {
      const res = await safeFetch<ProductReview[]>(`/api/products/${productId}/reviews`, { method: 'GET' });
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // Graceful fallback to client stored reviews
    }
    return getStoredReviewsForProduct(productId);
  },

  async addReview(
    productId: number,
    reviewData: {
      reviewer: string;
      reviewer_email?: string;
      district?: string;
      rating: number;
      review: string;
    }
  ): Promise<ProductReview> {
    try {
      const res = await safeFetch<ProductReview>(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });
      if (res && res.id) {
        saveLocalProductReview(productId, res);
        return res;
      }
    } catch {
      // Graceful fallback to local persistence
    }
    return saveLocalProductReview(productId, {
      ...reviewData,
      verified: true,
    });
  },

  async getCategories(): Promise<Category[]> {
    return safeFetch('/api/woocommerce/categories', { method: 'GET' }, 'Failed to fetch categories');
  },

  async validateCoupon(code: string, cartSubtotal: number): Promise<{
    valid: boolean;
    code: string;
    discount_total: number;
    discount_type: 'percent' | 'fixed_cart';
    amount: number;
    description: string;
  }> {
    return safeFetch('/api/woocommerce/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, cart_subtotal: cartSubtotal }),
    }, 'Failed to validate coupon');
  },

  async createOrder(orderData: any): Promise<{ success: boolean; order: CustomerOrder; message: string }> {
    let payload = { ...orderData };
    if (!payload.challenge_token) {
      const ch = await this.resolveBotChallenge();
      if (ch) {
        payload.challenge_token = ch.challenge_token;
        payload.challenge_answer = ch.challenge_answer;
      }
    }

    return safeFetch('/api/woocommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 'Failed to create order');
  },

  async getOrders(filter?: { email?: string; phone?: string }): Promise<CustomerOrder[]> {
    const query = new URLSearchParams();
    if (filter?.email) query.set('email', filter.email);
    if (filter?.phone) query.set('phone', filter.phone);
    return safeFetch(`/api/woocommerce/orders?${query.toString()}`, { method: 'GET' }, 'Failed to fetch orders');
  },

  async getOrder(orderNumberOrId: string, verify?: { email?: string; phone?: string }): Promise<CustomerOrder> {
    const params = new URLSearchParams();
    if (verify?.email) params.set('verify_email', verify.email);
    if (verify?.phone) params.set('verify_phone', verify.phone);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return safeFetch(`/api/woocommerce/orders/${orderNumberOrId}${qs}`, { method: 'GET' }, 'Order not found');
  },

  async requestMoMoPayment(payload: {
    provider: 'momo' | 'airtel';
    phone_number: string;
    amount: number;
    order_number?: string;
  }) {
    return safeFetch('/api/payments/momo/request-to-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 'Payment request failed');
  },

  async getWooCommerceStatus() {
    return safeFetch('/api/woocommerce/status', { method: 'GET' }, 'Failed to get WooCommerce status');
  },

  async getAdminSettings(): Promise<{
    settings: StoreSettings;
    deliveryZones: DeliveryZone[];
    heroBanners: HeroBanner[];
    coupons: Coupon[];
    webhookLogsCount: number;
  }> {
    return safeFetch('/api/admin/settings', { method: 'GET' }, 'Failed to fetch admin settings');
  },

  async saveAdminSettings(data: {
    settings?: Partial<StoreSettings>;
    newDeliveryZones?: DeliveryZone[];
    newBanners?: HeroBanner[];
  }) {
    return safeFetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 'Failed to save admin settings');
  },

  async updateOrderStatus(id: number | string, status: string, note?: string) {
    return safeFetch(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    }, 'Failed to update order status');
  },

  async submitOrderPayment(
    identifier: string | number,
    data: { phone?: string; transaction_ref?: string; note?: string }
  ): Promise<{ success: boolean; order: CustomerOrder; message: string }> {
    return safeFetch(`/api/orders/${identifier}/submit-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 'Failed to submit payment details');
  },

  async confirmOrderPayment(
    identifier: string | number,
    notes?: string
  ): Promise<{
    success: boolean;
    order: CustomerOrder;
    woocommerce_synced?: boolean;
    woocommerce_order_id?: number;
    woocommerce_sync_error?: string;
    message: string;
  }> {
    return safeFetch(`/api/admin/orders/${identifier}/confirm-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }, 'Failed to confirm payment');
  },

  async syncOrderToWooCommerce(
    identifier: string | number
  ): Promise<{
    success: boolean;
    order: CustomerOrder;
    woocommerce_order_id?: number;
    message: string;
  }> {
    return safeFetch(`/api/admin/orders/${identifier}/sync-woocommerce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, 'Failed to sync order with WooCommerce');
  },

  async triggerSync() {
    return safeFetch('/api/admin/sync', { method: 'POST' }, 'Failed to trigger catalog sync');
  },

  async testWooCommerceConnection(credentials?: {
    store_url?: string;
    consumer_key?: string;
    consumer_secret?: string;
    api_version?: string;
  }): Promise<{
    success: boolean;
    status: number;
    message: string;
    latency_ms: number;
    sample?: any;
    raw_error?: any;
  }> {
    return safeFetch('/api/woocommerce/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials || {}),
    }, 'Failed to test WooCommerce connection');
  },

  async fetchWooCommerceProducts(params?: {
    store_url?: string;
    consumer_key?: string;
    consumer_secret?: string;
    api_version?: string;
    per_page?: number;
    max_products?: number;
    page?: number;
    append?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    fetched_count: number;
    total_catalog_count: number;
    products: Product[];
    categories_count: number;
    timestamp: string;
    source?: string;
  }> {
    const payload = {
      per_page: 5000,
      max_products: 5000,
      ...(params || {}),
    };
    return safeFetch('/api/woocommerce/fetch-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 'Failed to fetch products from WooCommerce');
  },

  async syncWooCommerce(max_products: number = 5000): Promise<{
    success: boolean;
    message: string;
    fetched_count: number;
    total_catalog_count: number;
    products: Product[];
    source?: string;
    timestamp: string;
  }> {
    return safeFetch('/api/woocommerce/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_products }),
    }, 'Failed to synchronize with WooCommerce');
  },

  async clearProductsCatalog(): Promise<{
    success: boolean;
    message: string;
    products_count: number;
  }> {
    return safeFetch('/api/admin/clear-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, 'Failed to clear products catalog');
  },

  async checkPosAccess(): Promise<{
    allowed: boolean;
    user?: any;
    posConfig?: any;
    reason?: string;
  }> {
    return safeFetch('/api/pos/auth-check', { method: 'GET' }, 'Failed to check POS access');
  },

  async getPosStats(): Promise<{
    today_orders_count: number;
    total_orders_count: number;
    today_revenue: number;
    breakdown: {
      cash: number;
      momo: number;
      airtel: number;
      card: number;
    };
    recent_transactions: any[];
  }> {
    return safeFetch('/api/pos/stats', { method: 'GET' }, 'Failed to fetch POS register statistics');
  },

  async createPosOrder(payload: {
    items: Array<{
      product_id: number;
      variation_id?: number;
      quantity: number;
      is_custom?: boolean;
      custom_price?: number;
      custom_name?: string;
    }>;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    payment_method: 'cash' | 'momo' | 'airtel' | 'card';
    payment_reference?: string;
    amount_tendered?: number;
    discount_amount?: number;
    notes?: string;
  }): Promise<{
    success: boolean;
    order: CustomerOrder;
    receipt: any;
    message: string;
  }> {
    return safeFetch(
      '/api/pos/orders',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      'Failed to complete POS order'
    );
  },
};
