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
  SmsLogEntry,
  PriceDropAlert,
  Store,
  VendorOrder,
  WalletTransaction,
  PayoutRequest,
  StoreReview,
  StorePromotion,
  VendorStaff,
} from '../types';
import { getStoredReviewsForProduct, saveLocalProductReview } from '../data/initialReviews';
import { INITIAL_CATEGORIES } from '../data/cyberCatalog';
import { clientCache } from '../utils/apiCache';

// Support optional custom backend URL (for cPanel static hosting proxying to Node or external API)
const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_API_BASE_URL) ||
  ''
).replace(/\/+$/, '');

function getFullUrl(input: string): string {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
  if (API_BASE_URL && input.startsWith('/')) {
    return `${API_BASE_URL}${input}`;
  }
  return input;
}

/**
 * Universal safe API requester that guarantees:
 * 1. credentials: 'include' (preserves session cookies in iframes/domains)
 * 2. Injects Authorization token from Firebase Auth or local user session
 * 3. Checks content-type and payload BEFORE calling res.json()
 * 4. Gracefully catches HTML responses and 403 Forbidden without cryptic JSON errors
 * 5. Extracts structured server errors
 */
async function safeFetch<T = any>(
  input: string,
  init?: RequestInit,
  fallbackError = 'Request failed'
): Promise<T> {
  const targetUrl = getFullUrl(input);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((init?.headers as Record<string, string>) || {}),
  };

  // Automatically attach authenticated token if available (from localStorage or Firebase Auth)
  try {
    const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('cdt_token') : null;
    if (storedToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
    const { auth } = await import('../firebase');
    if (auth?.currentUser && !headers['Authorization']) {
      const token = await auth.currentUser.getIdToken().catch(() => null);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {
    // Non-critical: Proceed with standard headers
  }

  const mergedInit: RequestInit = {
    credentials: 'include',
    ...init,
    headers,
  };

  let res: Response;
  try {
    res = await fetch(targetUrl, mergedInit);
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
          const retryRes = await fetch(targetUrl, mergedInit);
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
      if (res.status === 403) {
        throw new Error(
          json?.error || json?.message || 'Access denied (403 Forbidden): Administrative or authorized privileges required.'
        );
      }
      if (res.status === 401) {
        throw new Error(
          json?.error || json?.message || 'Authentication required (401). Please sign in to continue.'
        );
      }
      throw new Error(json?.error || json?.message || `${fallbackError} (${res.status})`);
    }
    return json as T;
  }

  // Handle non-JSON responses (HTML, plain text, proxy errors)
  const text = await res.text().catch(() => '');

  // Specific handling for 403 Forbidden responses
  if (res.status === 403) {
    let msg = 'Access denied (403 Forbidden): You do not have permission to access this resource or perform this action.';
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error || parsed?.message) msg = parsed.error || parsed.message;
    } catch {
      const h1Match = text.match(/<h1>(.*?)<\/h1>/i);
      const titleMatch = text.match(/<title>(.*?)<\/title>/i);
      if (h1Match?.[1]) {
        msg = `Access denied (403): ${h1Match[1].replace(/<[^>]*>/g, '').trim()}`;
      } else if (titleMatch?.[1]) {
        msg = `Access denied (403): ${titleMatch[1].replace(/<[^>]*>/g, '').trim()}`;
      }
    }
    throw new Error(msg);
  }

  // Specific handling for 401 Unauthorized responses
  if (res.status === 401) {
    throw new Error('Authentication required (401). Please sign in to continue.');
  }

  // Not JSON: HTML from server restart, proxy error, or static fallback
  if (text.includes('<!DOCTYPE') || text.includes('<html') || contentType.includes('text/html')) {
    let summary = res.statusText || 'Service unavailable';
    const h1Match = text.match(/<h1>(.*?)<\/h1>/i);
    if (h1Match?.[1]) {
      summary = h1Match[1].replace(/<[^>]*>/g, '').trim();
    }
    throw new Error(
      `Service temporarily unavailable (${res.status} ${summary}). Please wait a moment and try again.`
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
  }): Promise<{ success: boolean; user: CustomerUser; message: string; token?: string }> {
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
  async getProducts(
    params: {
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
      vendor?: string;
      store_id?: string;
      store_slug?: string;
    } = {},
    options: { forceRefresh?: boolean } = {}
  ): Promise<{ products: Product[]; total: number; totalPages: number }> {
    const cacheKey = clientCache.generateKey('wc_products', params);
    if (!options.forceRefresh) {
      const cached = clientCache.get<{ products: Product[]; total: number; totalPages: number }>(cacheKey);
      if (cached) return cached;
    }

    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.brand) query.set('brand', params.brand);
    if (params.vendor) query.set('vendor', params.vendor);
    if (params.store_id) query.set('store_id', params.store_id);
    if (params.store_slug) query.set('store_slug', params.store_slug);
    if (params.featured) query.set('featured', 'true');
    if (params.flash_sale) query.set('flash_sale', 'true');
    if (params.min_price) query.set('min_price', String(params.min_price));
    if (params.max_price) query.set('max_price', String(params.max_price));
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', String(params.page));
    const effectiveLimit = params.limit !== undefined ? params.limit : 24;
    query.set('limit', String(effectiveLimit));
    if (params.stock_status) query.set('stock_status', params.stock_status);

    try {
      const result = await safeFetch<{ products: Product[]; total: number; totalPages: number }>(
        `/api/woocommerce/products?${query.toString()}`,
        { method: 'GET' },
        'Failed to fetch products'
      );
      if (result && Array.isArray(result.products)) {
        clientCache.set(cacheKey, result, 120);
      }
      return result;
    } catch (err) {
      // If the backend /api endpoint is momentarily starting, fetch directly from live WooCommerce Store API
      console.warn('Backend /api notice, querying live WooCommerce Store API directly:', err);
      try {
        const perPage = Math.min(effectiveLimit, 100);
        const p = params.page || 1;
        const storeApiUrl = `https://www.cyberdynamictech.com/wp-json/wc/store/v1/products?per_page=${perPage}&page=${p}${
          params.search ? `&search=${encodeURIComponent(params.search)}` : ''
        }`;
        const resp = await fetch(storeApiUrl, {
          headers: { Accept: 'application/json' },
        });
        if (resp.ok) {
          const rawItems = await resp.json();
          if (Array.isArray(rawItems)) {
            const mapped = rawItems.map((raw: any) => {
              const minorUnit = typeof raw.prices?.currency_minor_unit === 'number' ? raw.prices.currency_minor_unit : 0;
              const divisor = Math.pow(10, minorUnit);
              const currentPrice = raw.prices?.price ? Number(raw.prices.price) / divisor : Number(raw.price || 0);
              const regularPrice = raw.prices?.regular_price ? Number(raw.prices.regular_price) / divisor : currentPrice;
              const salePrice = raw.prices?.sale_price && Number(raw.prices.sale_price) < Number(raw.prices.regular_price)
                ? Number(raw.prices.sale_price) / divisor
                : undefined;

              const rawImages = Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : raw.image ? [raw.image] : [];
              const images = rawImages.map((img: any, idx: number) => ({
                id: img.id || idx + 1,
                src: img.src || img.thumbnail || img.url || '',
                name: img.name || raw.name || 'Product Image',
                alt: img.alt || raw.name || 'Product Image',
              }));

              const cleanDesc = (raw.short_description || '')
                .replace(/<[^>]*>?/gm, ' ')
                .replace(/\s+/g, ' ')
                .trim() || raw.name;

              return {
                id: raw.id,
                name: raw.name,
                slug: raw.slug || `product-${raw.id}`,
                permalink: raw.permalink || '',
                featured: Boolean(raw.featured),
                description: raw.description || cleanDesc,
                short_description: cleanDesc,
                sku: raw.sku || `CDT-${raw.id}`,
                price: currentPrice,
                regular_price: regularPrice,
                sale_price: salePrice,
                price_html: raw.price_html || `${currentPrice.toLocaleString()} UGX`,
                on_sale: Boolean(salePrice && salePrice < regularPrice),
                stock_status: raw.is_in_stock === false ? 'outofstock' : 'instock',
                stock_quantity: typeof raw.stock_quantity === 'number' ? raw.stock_quantity : 15,
                manage_stock: true,
                categories: Array.isArray(raw.categories)
                  ? raw.categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))
                  : [],
                tags: Array.isArray(raw.tags) ? raw.tags.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })) : [],
                images: images.length > 0 ? images : [{ id: 1, src: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80', name: raw.name, alt: raw.name }],
                attributes: Array.isArray(raw.attributes) ? raw.attributes : [],
                rating_count: typeof raw.review_count === 'number' ? raw.review_count : 4,
                average_rating: Number(raw.average_rating || 4.8),
                brand: raw.attributes?.[0]?.terms?.[0]?.name || 'Cyber Dynamic Technologies',
                weight: '1.5 kg',
                warranty: '1 Year Warranty Included',
              } as Product;
            });

            const liveResult = {
              products: mapped,
              total: mapped.length,
              totalPages: 1,
            };
            clientCache.set(cacheKey, liveResult, 60);
            return liveResult;
          }
        }
      } catch (storeErr) {
        console.warn('Live Store API direct query also failed:', storeErr);
      }

      // If both backend and live store API are unreachable, return empty array with 0 items (never dummy products)
      return {
        products: [],
        total: 0,
        totalPages: 1,
      };
    }
  },

  async getProduct(identifier: string | number, options: { forceRefresh?: boolean } = {}): Promise<Product> {
    const cacheKey = `product_${identifier}`;
    if (!options.forceRefresh) {
      const cached = clientCache.get<Product>(cacheKey);
      if (cached) return cached;
    }

    try {
      const prod = await safeFetch<Product>(`/api/woocommerce/products/${identifier}`, { method: 'GET' }, 'Product not found');
      if (prod && prod.id) {
        clientCache.set(cacheKey, prod, 180);
      }
      return prod;
    } catch (err) {
      // Try direct live WooCommerce Store API
      try {
        const resp = await fetch(`https://www.cyberdynamictech.com/wp-json/wc/store/v1/products/${identifier}`, {
          headers: { Accept: 'application/json' },
        });
        if (resp.ok) {
          const raw = await resp.json();
          const minorUnit = typeof raw.prices?.currency_minor_unit === 'number' ? raw.prices.currency_minor_unit : 0;
          const divisor = Math.pow(10, minorUnit);
          const currentPrice = raw.prices?.price ? Number(raw.prices.price) / divisor : Number(raw.price || 0);
          const regularPrice = raw.prices?.regular_price ? Number(raw.prices.regular_price) / divisor : currentPrice;
          const rawImages = Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : raw.image ? [raw.image] : [];
          const images = rawImages.map((img: any, idx: number) => ({
            id: img.id || idx + 1,
            src: img.src || img.thumbnail || img.url || '',
            name: img.name || raw.name || 'Product Image',
            alt: img.alt || raw.name || 'Product Image',
          }));

          const mapped: Product = {
            id: raw.id,
            name: raw.name,
            slug: raw.slug || `product-${raw.id}`,
            permalink: raw.permalink || '',
            featured: Boolean(raw.featured),
            description: raw.description || raw.name,
            short_description: (raw.short_description || '').replace(/<[^>]*>?/gm, ' ').trim() || raw.name,
            sku: raw.sku || `CDT-${raw.id}`,
            price: currentPrice,
            regular_price: regularPrice,
            sale_price: undefined,
            on_sale: false,
            stock_status: raw.is_in_stock === false ? 'outofstock' : 'instock',
            stock_quantity: 10,
            manage_stock: true,
            categories: Array.isArray(raw.categories)
              ? raw.categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))
              : [],
            images: images.length > 0 ? images : [{ id: 1, src: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80', name: raw.name, alt: raw.name }],
            attributes: [],
            rating_count: 5,
            average_rating: 5.0,
            brand: 'Cyber Dynamic Technologies',
            warranty: '1 Year Warranty Included',
          };
          clientCache.set(cacheKey, mapped, 180);
          return mapped;
        }
      } catch {
        // Continue to throw error
      }
      throw err;
    }
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    clientCache.clear();
    try {
      const { saveProductToFirestore } = await import('../firebase');
      await saveProductToFirestore(product);
    } catch (e) {
      console.warn('Firestore direct write notice:', e);
    }
    return safeFetch<Product>('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    }, 'Failed to create product');
  },

  async updateProduct(id: number | string, updates: Partial<Product>): Promise<Product> {
    clientCache.clear();
    try {
      const { updateProductInFirestore } = await import('../firebase');
      await updateProductInFirestore(id, updates);
    } catch (e) {
      console.warn('Firestore direct update notice:', e);
    }
    return safeFetch<Product>(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }, 'Failed to update product');
  },

  async deleteProduct(id: number | string): Promise<{ success: boolean; deleted_id: number }> {
    clientCache.clear();
    try {
      const { deleteProductInFirestore } = await import('../firebase');
      await deleteProductInFirestore(id);
    } catch (e) {
      console.warn('Firestore direct delete notice:', e);
    }
    return safeFetch<{ success: boolean; deleted_id: number }>(`/api/products/${id}`, {
      method: 'DELETE',
    }, 'Failed to delete product');
  },

  async duplicateProduct(id: number | string): Promise<Product> {
    clientCache.clear();
    return safeFetch<Product>(`/api/products/${id}/duplicate`, {
      method: 'POST',
    }, 'Failed to duplicate product');
  },

  async createCategory(category: Partial<Category>): Promise<Category> {
    try {
      const { saveCategoryToFirestore } = await import('../firebase');
      await saveCategoryToFirestore(category);
    } catch (e) {}
    return safeFetch<Category>('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    }, 'Failed to create category');
  },

  async updateCategory(id: number | string, updates: Partial<Category>): Promise<Category> {
    return safeFetch<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }, 'Failed to update category');
  },

  async deleteCategory(id: number | string): Promise<{ success: boolean }> {
    try {
      const { deleteCategoryFromFirestore } = await import('../firebase');
      await deleteCategoryFromFirestore(id);
    } catch (e) {}
    return safeFetch<{ success: boolean }>(`/api/categories/${id}`, {
      method: 'DELETE',
    }, 'Failed to delete category');
  },

  async importWooCommerceProducts(): Promise<{ success: boolean; total: number; created: number; updated: number; message: string }> {
    clientCache.clear();
    return safeFetch('/api/woocommerce/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }, 'Failed to import WooCommerce catalog');
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

  async getCategories(options: { forceRefresh?: boolean } = {}): Promise<Category[]> {
    const cacheKey = 'wc_categories';
    if (!options.forceRefresh) {
      const cached = clientCache.get<Category[]>(cacheKey);
      if (cached) return cached;
    }
    try {
      const cats = await safeFetch<Category[]>('/api/woocommerce/categories', { method: 'GET' }, 'Failed to fetch categories');
      if (Array.isArray(cats) && cats.length > 0) {
        clientCache.set(cacheKey, cats, 300);
      }
      return cats;
    } catch {
      return INITIAL_CATEGORIES;
    }
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

    const result = await safeFetch<{ success: boolean; order: CustomerOrder; message: string }>('/api/woocommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 'Failed to create order');

    // Invalidate product and category cache so updated stock levels are fetched
    clientCache.invalidate('wc_products');
    clientCache.invalidate('product_');

    // Mirror to Cloud Firestore orders collection
    if (result && result.order) {
      try {
        const { saveOrderToFirestore } = await import('../firebase');
        await saveOrderToFirestore(result.order);
      } catch (fbOrderErr) {
        console.warn('Firestore order mirror notice:', fbOrderErr);
      }
    }

    return result;
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

  async cancelOrder(
    identifier: string | number,
    reason?: string
  ): Promise<{ success: boolean; order: CustomerOrder; message: string }> {
    return safeFetch(`/api/orders/${identifier}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }, 'Failed to cancel order');
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

  async getSmsLogs(): Promise<{
    logs: SmsLogEntry[];
    count: number;
    provider?: string;
    enabled?: boolean;
  }> {
    return safeFetch('/api/admin/sms/logs', { method: 'GET' }, 'Failed to retrieve SMS logs');
  },

  async sendTestSms(phone: string, message?: string): Promise<{
    success: boolean;
    status: 'sent' | 'simulated' | 'failed';
    message: string;
    log?: SmsLogEntry;
  }> {
    return safeFetch('/api/admin/sms/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    }, 'Failed to send test SMS');
  },

  async getAnnouncements(): Promise<{
    announcements: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      timestamp: string;
      priority: 'normal' | 'high';
      link?: { view: string; params?: any };
    }>;
  }> {
    return safeFetch('/api/notifications/announcements', { method: 'GET' }, 'Failed to fetch announcements');
  },

  async broadcastAnnouncement(data: {
    title: string;
    message: string;
    type?: string;
    priority?: 'normal' | 'high';
    view?: string;
  }): Promise<{
    success: boolean;
    announcement: any;
    announcements: any[];
  }> {
    return safeFetch('/api/admin/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 'Failed to broadcast announcement');
  },

  async backupDatabase(): Promise<any> {
    return safeFetch('/api/database/backup', { method: 'GET' }, 'Failed to backup database');
  },

  async restoreDatabase(payload: any): Promise<{ success: boolean; message: string }> {
    return safeFetch('/api/database/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 'Failed to restore database');
  },

  async syncDatabase(): Promise<{ success: boolean; message: string }> {
    return safeFetch('/api/database/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, 'Failed to sync database');
  },

  // Price Drop Alerts API
  async subscribePriceDropAlert(
    productId: number | string,
    data: {
      email?: string;
      phone?: string;
      notify_type?: 'email' | 'phone' | 'both';
      target_price?: number;
    }
  ): Promise<{
    success: boolean;
    message: string;
    alert: PriceDropAlert;
    is_existing?: boolean;
  }> {
    return safeFetch(`/api/products/${productId}/price-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 'Failed to subscribe to price drop alert');
  },

  async getPriceDropAlertStatus(
    productId: number | string,
    params: { email?: string; phone?: string }
  ): Promise<{
    subscribed: boolean;
    alert?: PriceDropAlert | null;
    current_price?: number;
  }> {
    const query = new URLSearchParams();
    if (params.email) query.set('email', params.email);
    if (params.phone) query.set('phone', params.phone);
    const qs = query.toString();
    return safeFetch(`/api/products/${productId}/price-alert/status${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    }, 'Failed to retrieve price drop alert status');
  },

  async cancelPriceDropAlert(
    productId: number | string,
    data: { email?: string; phone?: string; alert_id?: string }
  ): Promise<{ success: boolean; message: string }> {
    return safeFetch(`/api/products/${productId}/price-alert/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 'Failed to cancel price drop alert');
  },

  async getAdminPriceAlerts(): Promise<{
    alerts: PriceDropAlert[];
    count: number;
    active_count: number;
    triggered_count: number;
  }> {
    return safeFetch('/api/admin/price-alerts', {
      method: 'GET',
    }, 'Failed to fetch price alerts');
  },

  async testPriceAlertTrigger(data: {
    product_id: number;
    test_new_price?: number;
    override_email?: string;
    override_phone?: string;
  }): Promise<{
    success: boolean;
    message: string;
    old_price: number;
    new_price: number;
    drop_percentage: number;
    alerts_triggered: number;
    dispatched_alerts: PriceDropAlert[];
  }> {
    return safeFetch('/api/admin/price-alerts/test-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 'Failed to test price alert trigger');
  },

  // ==========================================
  // Multi-Store / Multi-Vendor Marketplace APIs
  // ==========================================

  // Public: Get all active stores
  async getPublicStores(params?: { district?: string; category?: string; search?: string }): Promise<{
    success: boolean;
    total: number;
    stores: Array<Partial<Store> & { product_count: number }>;
  }> {
    const query = new URLSearchParams();
    if (params?.district) query.set('district', params.district);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return safeFetch(`/api/marketplace/stores/public${qs ? `?${qs}` : ''}`, { method: 'GET' }, 'Failed to fetch stores');
  },

  // Public: Get single storefront by slug
  async getStoreBySlug(slug: string): Promise<{
    success: boolean;
    store: Store;
    products_count: number;
    products: Product[];
    reviews: StoreReview[];
    promotions: StorePromotion[];
  }> {
    return safeFetch(`/api/marketplace/stores/${encodeURIComponent(slug)}`, { method: 'GET' }, 'Failed to load store');
  },

  // Public: Submit vendor registration
  async registerVendorStore(data: any): Promise<{
    success: boolean;
    message: string;
    store: Store;
    status: string;
  }> {
    return safeFetch('/api/marketplace/stores/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 'Failed to register vendor store');
  },

  // Public: Get store reviews
  async getStoreReviews(storeId: string): Promise<{ success: boolean; reviews: StoreReview[] }> {
    return safeFetch(`/api/marketplace/stores/${encodeURIComponent(storeId)}/reviews`, { method: 'GET' }, 'Failed to fetch reviews');
  },

  // Public: Submit store review
  async submitStoreReview(storeId: string, review: { reviewer_name: string; reviewer_email?: string; rating: number; comment: string; order_number?: string }): Promise<{
    success: boolean;
    message: string;
    review: StoreReview;
  }> {
    return safeFetch(`/api/marketplace/stores/${encodeURIComponent(storeId)}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    }, 'Failed to submit review');
  },

  // Vendor: Dashboard Summary
  async getVendorDashboard(): Promise<{
    success: boolean;
    store: Store;
    metrics: {
      today_sales: number;
      today_orders: number;
      monthly_sales: number;
      monthly_orders: number;
      total_products: number;
      low_stock_count: number;
      low_stock_products: Product[];
      gross_sales: number;
      platform_commission: number;
      total_earnings: number;
      available_balance: number;
      pending_balance: number;
      paid_balance: number;
      pending_payouts: number;
      currency: string;
    };
    recent_orders: VendorOrder[];
    recent_transactions: WalletTransaction[];
  }> {
    return safeFetch('/api/marketplace/vendor/dashboard', { method: 'GET' }, 'Failed to fetch vendor dashboard');
  },

  // Vendor: Product Management
  async getVendorProducts(): Promise<{ success: boolean; count: number; products: Product[] }> {
    return safeFetch('/api/marketplace/vendor/products', { method: 'GET' }, 'Failed to fetch vendor products');
  },

  async createVendorProduct(product: Partial<Product>): Promise<{ success: boolean; message: string; product: Product }> {
    return safeFetch('/api/marketplace/vendor/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    }, 'Failed to create product');
  },

  async updateVendorProduct(id: number, product: Partial<Product>): Promise<{ success: boolean; message: string; product: Product }> {
    return safeFetch(`/api/marketplace/vendor/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    }, 'Failed to update product');
  },

  async deleteVendorProduct(id: number): Promise<{ success: boolean; message: string }> {
    return safeFetch(`/api/marketplace/vendor/products/${id}`, {
      method: 'DELETE',
    }, 'Failed to delete product');
  },

  // Vendor: Orders Management
  async getVendorOrders(): Promise<{ success: boolean; count: number; orders: VendorOrder[] }> {
    return safeFetch('/api/marketplace/vendor/orders', { method: 'GET' }, 'Failed to fetch vendor orders');
  },

  async updateVendorOrderStatus(id: string, status: string, note?: string): Promise<{ success: boolean; message: string; order: VendorOrder }> {
    return safeFetch(`/api/marketplace/vendor/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    }, 'Failed to update order status');
  },

  // Vendor: Financial Wallet & Withdrawals
  async getVendorWallet(): Promise<{ success: boolean; wallet: any }> {
    return safeFetch('/api/marketplace/vendor/wallet', { method: 'GET' }, 'Failed to fetch vendor wallet');
  },

  async requestVendorPayout(data: { amount: number; payout_method?: string; account_number?: string; account_name?: string; bank_name?: string }): Promise<{
    success: boolean;
    message: string;
    payout: PayoutRequest;
  }> {
    return safeFetch('/api/marketplace/vendor/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 'Failed to request withdrawal');
  },

  async getVendorPayouts(): Promise<{ success: boolean; count: number; payouts: PayoutRequest[] }> {
    return safeFetch('/api/marketplace/vendor/payouts', { method: 'GET' }, 'Failed to fetch payouts');
  },

  // Vendor: Profile
  async getVendorProfile(): Promise<{ success: boolean; store: Store }> {
    return safeFetch('/api/marketplace/vendor/profile', { method: 'GET' }, 'Failed to fetch store profile');
  },

  async updateVendorProfile(data: Partial<Store>): Promise<{ success: boolean; message: string; store: Store }> {
    return safeFetch('/api/marketplace/vendor/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 'Failed to update store profile');
  },

  // Vendor: Staff Management
  async getVendorStaff(): Promise<{ success: boolean; count: number; staff: VendorStaff[] }> {
    return safeFetch('/api/marketplace/vendor/staff', { method: 'GET' }, 'Failed to fetch staff');
  },

  async createVendorStaff(data: any): Promise<{ success: boolean; message: string; staff: VendorStaff }> {
    return safeFetch('/api/marketplace/vendor/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 'Failed to add staff member');
  },

  // Super Admin: Stores Oversight
  async getAdminStores(): Promise<{ success: boolean; total: number; stores: any[] }> {
    return safeFetch('/api/marketplace/admin/stores', { method: 'GET' }, 'Failed to fetch all stores');
  },

  async updateAdminStoreStatus(id: string, status: string, reason?: string): Promise<{ success: boolean; message: string; store: Store }> {
    return safeFetch(`/api/marketplace/admin/stores/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    }, 'Failed to update store status');
  },

  async updateAdminStoreCommission(id: string, commission_rate: number): Promise<{ success: boolean; message: string; store: Store }> {
    return safeFetch(`/api/marketplace/admin/stores/${encodeURIComponent(id)}/commission`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commission_rate }),
    }, 'Failed to update commission rate');
  },

  async getAdminMarketplaceAnalytics(): Promise<{ success: boolean; analytics: any }> {
    return safeFetch('/api/marketplace/admin/analytics', { method: 'GET' }, 'Failed to fetch marketplace analytics');
  },

  async getAdminPayouts(): Promise<{ success: boolean; payouts: PayoutRequest[] }> {
    return safeFetch('/api/marketplace/admin/payouts', { method: 'GET' }, 'Failed to fetch payouts');
  },

  async updateAdminPayoutStatus(id: string, status: string, notes?: string, transaction_reference?: string): Promise<{
    success: boolean;
    message: string;
    payout: PayoutRequest;
  }> {
    return safeFetch(`/api/marketplace/admin/payouts/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: notes, transaction_reference }),
    }, 'Failed to update payout status');
  },
};
