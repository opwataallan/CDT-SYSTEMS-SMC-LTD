import express, { Request, Response } from 'express';
import { DEFAULT_MARKETPLACE_CONFIG } from '../src/data/defaultConfig';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../src/data/cyberCatalog';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS & Preflight handling
app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, x-admin-secret');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Helper: Normalize WooCommerce Store API items
function normalizeStoreProduct(raw: any) {
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
  };
}

// ------------------------------------------
// Endpoints
// ------------------------------------------

// Health check
app.get(['/api/health', '/api'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: 'vercel-serverless',
    marketplace: 'Cyber Dynamic Technologies',
    version: '2.5.0',
    timestamp: new Date().toISOString(),
  });
});

// Products catalog (proxies live WooCommerce or serves seeded store catalog)
app.get(['/api/woocommerce/products', '/api/products'], async (req: Request, res: Response) => {
  const { limit = '48', page = '1', search = '', category } = req.query as Record<string, string>;
  const perPage = Math.min(Number(limit) || 48, 100);

  try {
    let url = `https://www.cyberdynamictech.com/wp-json/wc/store/v1/products?per_page=${perPage}&page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;

    const wcRes = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (wcRes.ok) {
      const raw = await wcRes.json();
      if (Array.isArray(raw) && raw.length > 0) {
        const mapped = raw.map(normalizeStoreProduct);
        return res.json({
          products: mapped,
          total: Number(wcRes.headers.get('x-wp-total')) || mapped.length,
          totalPages: Number(wcRes.headers.get('x-wp-totalpages')) || 1,
          source: 'woocommerce_live',
        });
      }
    }
  } catch (err: any) {
    console.warn('[Vercel API] Live Store API query notice:', err.message);
  }

  // Fallback to seeded catalog
  let filtered = [...INITIAL_PRODUCTS];
  if (category && category !== 'all') {
    const catLower = category.toLowerCase();
    filtered = filtered.filter((p) =>
      p.categories?.some((c) => c.slug?.toLowerCase() === catLower || c.name?.toLowerCase() === catLower)
    );
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(s) || p.short_description?.toLowerCase().includes(s));
  }

  return res.json({
    products: filtered,
    total: filtered.length,
    totalPages: 1,
    source: 'seeded_catalog',
  });
});

// Single product
app.get(['/api/woocommerce/products/:id', '/api/products/:id'], async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const wcRes = await fetch(`https://www.cyberdynamictech.com/wp-json/wc/store/v1/products/${id}`, {
      headers: { Accept: 'application/json' },
    });
    if (wcRes.ok) {
      const raw = await wcRes.json();
      return res.json(normalizeStoreProduct(raw));
    }
  } catch {}

  const found = INITIAL_PRODUCTS.find((p) => String(p.id) === String(id) || p.slug === String(id));
  if (found) return res.json(found);

  return res.status(404).json({ error: 'Product not found' });
});

// Categories
app.get(['/api/woocommerce/categories', '/api/categories'], async (_req: Request, res: Response) => {
  try {
    const wcRes = await fetch('https://www.cyberdynamictech.com/wp-json/wc/store/v1/products/categories?per_page=100', {
      headers: { Accept: 'application/json' },
    });
    if (wcRes.ok) {
      const rawCats = await wcRes.json();
      if (Array.isArray(rawCats) && rawCats.length > 0) {
        const mapped = rawCats.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          count: c.count || 0,
          description: c.description || '',
          image: c.image?.src || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80',
        }));
        return res.json(mapped);
      }
    }
  } catch {}

  return res.json(INITIAL_CATEGORIES);
});

// Auth: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email = '' } = req.body || {};
  const emailLower = String(email).toLowerCase().trim();
  const isAdmin = emailLower.includes('admin') || emailLower.includes('opwata') || emailLower === 'info@cyberdynamictech.com';
  const isStaff = emailLower.includes('staff') || emailLower.includes('manager');

  const user = {
    id: isAdmin ? 1 : isStaff ? 2 : Math.floor(100 + Math.random() * 900),
    wordpress_id: isAdmin ? 1 : isStaff ? 2 : Math.floor(100 + Math.random() * 900),
    email: emailLower || 'user@cyberdynamictech.com',
    username: emailLower ? emailLower.split('@')[0] : 'admin',
    first_name: isAdmin ? 'Allan' : isStaff ? 'Shop' : 'Valued',
    last_name: isAdmin ? 'Opwata' : isStaff ? 'Manager' : 'Customer',
    role: isAdmin ? 'administrator' : isStaff ? 'shop_manager' : 'customer',
    user_level: isAdmin ? 10 : isStaff ? 7 : 0,
    level_label: isAdmin ? 'Level 10: Super Administrator' : isStaff ? 'Level 7: Shop Manager' : 'Level 0: Customer',
    capabilities: isAdmin ? ['manage_options', 'manage_woocommerce', 'view_admin_dashboard', 'edit_products'] : ['read'],
  };

  const token = `cdt_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return res.json({
    success: true,
    user,
    token,
    message: `Welcome back, ${user.first_name}!`,
  });
});

// Auth: Quick Login
app.post('/api/auth/quick-login', (req: Request, res: Response) => {
  const { role = 'admin' } = req.body || {};
  const demoUsers: Record<string, any> = {
    admin: {
      id: 1,
      wordpress_id: 1,
      email: 'admin@cyberdynamictech.com',
      username: 'admin',
      first_name: 'Allan',
      last_name: 'Opwata',
      role: 'administrator',
      user_level: 10,
      level_label: 'Level 10: Super Administrator',
      capabilities: ['manage_options', 'manage_woocommerce', 'view_admin_dashboard', 'edit_products'],
    },
    staff: {
      id: 2,
      wordpress_id: 2,
      email: 'manager@cyberdynamictech.com',
      username: 'manager',
      first_name: 'Shop',
      last_name: 'Manager',
      role: 'shop_manager',
      user_level: 7,
      level_label: 'Level 7: Shop Manager',
      capabilities: ['manage_woocommerce', 'edit_products', 'manage_orders'],
    },
    cashier: {
      id: 3,
      wordpress_id: 3,
      email: 'cashier@cyberdynamictech.com',
      username: 'cashier',
      first_name: 'Kampala',
      last_name: 'Cashier',
      role: 'cashier',
      user_level: 3,
      level_label: 'Level 3: Cashier',
      capabilities: ['pos_checkout', 'read'],
    },
    vendor: {
      id: 4,
      wordpress_id: 4,
      email: 'vendor@cyberdynamictech.com',
      username: 'cybertech_vendor',
      first_name: 'Kampala',
      last_name: 'Electronics Hub',
      role: 'vendor',
      user_level: 2,
      level_label: 'Level 2: Vendor Partner',
      vendor_id: 'store_cdt_kampala',
      capabilities: ['manage_vendor_products', 'read'],
    },
    customer: {
      id: 99,
      wordpress_id: 99,
      email: 'customer@cyberdynamictech.com',
      username: 'shopper',
      first_name: 'Valued',
      last_name: 'Shopper',
      role: 'customer',
      user_level: 0,
      level_label: 'Level 0: Customer',
      capabilities: ['read'],
    },
  };

  const user = demoUsers[role] || demoUsers.admin;
  const token = `cdt_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return res.json({
    success: true,
    user,
    token,
    message: `Signed in as ${user.first_name} (${user.level_label})`,
  });
});

// Auth: Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email = '', first_name = '', last_name = '', phone = '' } = req.body || {};
  const user = {
    id: Math.floor(1000 + Math.random() * 9000),
    wordpress_id: Math.floor(1000 + Math.random() * 9000),
    email,
    username: email ? email.split('@')[0] : `user_${Date.now()}`,
    first_name: first_name || 'Customer',
    last_name: last_name || '',
    phone: phone || '',
    role: 'customer',
    user_level: 0,
    level_label: 'Level 0: Customer',
    capabilities: ['read'],
  };

  const token = `cdt_tok_${Date.now()}`;
  return res.json({
    success: true,
    user,
    token,
    message: 'Account registered successfully!',
  });
});

// Auth: Current session
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer cdt_tok_')) {
    return res.json({
      authenticated: true,
      user: {
        id: 1,
        wordpress_id: 1,
        email: 'admin@cyberdynamictech.com',
        username: 'admin',
        first_name: 'Allan',
        last_name: 'Opwata',
        role: 'administrator',
        user_level: 10,
        level_label: 'Level 10: Super Administrator',
      },
    });
  }
  return res.json({ authenticated: false, user: null });
});

// Auth: Logout
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  return res.json({ success: true, message: 'Logged out' });
});

// Orders creation
app.post(['/api/woocommerce/orders', '/api/orders'], (req: Request, res: Response) => {
  const payload = req.body || {};
  const orderNumber = `CDT-${Math.floor(1000 + Math.random() * 9000)}`;

  const order = {
    id: Date.now(),
    order_number: orderNumber,
    status: 'processing',
    created_at: new Date().toISOString(),
    customer_id: payload.userId || 1,
    items: payload.items || [],
    total: payload.total || 0,
    subtotal: payload.subtotal || payload.total || 0,
    shipping_total: payload.shipping_total || 0,
    payment_method: payload.payment_method || 'momo_mtn',
    payment_status: 'paid',
    billing: payload.billing || {},
    delivery_zone: payload.delivery_zone || 'Kampala Central',
  };

  return res.json({
    success: true,
    order,
    message: `Order #${orderNumber} placed successfully!`,
  });
});

// Coupons validation
app.post('/api/woocommerce/coupons/validate', (req: Request, res: Response) => {
  const { code = '', cart_subtotal = 0 } = req.body || {};
  const cleanCode = String(code).toUpperCase().trim();

  const coupons: Record<string, any> = {
    CYBER10: { amount: 10, discount_type: 'percent', min_spend: 100000, description: '10% off your entire tech order' },
    WELCOME5: { amount: 5, discount_type: 'percent', min_spend: 50000, description: '5% welcome discount' },
    MOMOFREE: { amount: 15000, discount_type: 'fixed_cart', min_spend: 300000, description: 'UGX 15,000 off delivery' },
  };

  const coupon = coupons[cleanCode];
  if (!coupon) {
    return res.status(400).json({ valid: false, message: 'Invalid coupon code.' });
  }

  if (cart_subtotal < coupon.min_spend) {
    return res.status(400).json({
      valid: false,
      message: `Minimum spend of UGX ${coupon.min_spend.toLocaleString()} required.`,
    });
  }

  const discountTotal = coupon.discount_type === 'percent'
    ? Math.round((cart_subtotal * coupon.amount) / 100)
    : coupon.amount;

  return res.json({
    valid: true,
    code: cleanCode,
    discount_total: discountTotal,
    discount_type: coupon.discount_type,
    amount: coupon.amount,
    description: coupon.description,
  });
});

// Admin settings
app.get('/api/admin/all-settings', (_req: Request, res: Response) => {
  return res.json({
    config: DEFAULT_MARKETPLACE_CONFIG,
    usersCount: 142,
    ordersCount: 89,
    productsCount: 328,
  });
});

app.post('/api/admin/all-settings', (req: Request, res: Response) => {
  const { category, settings } = req.body || {};
  return res.json({
    success: true,
    config: {
      ...DEFAULT_MARKETPLACE_CONFIG,
      ...(category ? { [category]: settings } : {}),
    },
    message: 'Marketplace settings saved successfully.',
  });
});

// Stores
app.get(['/api/stores', '/api/public/stores'], (_req: Request, res: Response) => {
  return res.json({
    stores: [
      {
        id: 'store_cdt_kampala',
        name: 'Cyber Dynamic Technologies Flagship',
        slug: 'cyber-dynamic-flagship',
        description: 'Official flagship showroom and enterprise technical fulfillment center in Kampala.',
        logo: '/logo.png',
        banner: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&auto=format&fit=crop&q=80',
        rating: 4.9,
        review_count: 84,
        verified: true,
        address: 'Kampala Central, Uganda',
        phone: '+256 779 743 101',
        email: 'sales@cyberdynamictech.com',
      },
    ],
  });
});

// Default API catch-all
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Cyber Dynamic Technologies Marketplace API (Vercel Serverless Ready)',
    timestamp: new Date().toISOString(),
  });
});

// Export Express app for Vercel Serverless Function
export default app;
