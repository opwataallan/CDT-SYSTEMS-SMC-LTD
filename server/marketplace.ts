import { Router, Request, Response, NextFunction } from 'express';
import { store, UserAccount } from './store';
import {
  verifySessionToken,
  logAudit,
  sanitizeString,
  sanitizeObject,
  validateEmail,
  validatePhone,
} from './security';
import {
  Store,
  VendorOrder,
  WalletTransaction,
  PayoutRequest,
  StoreReview,
  VendorStaff,
  StorePromotion,
  Product,
  CustomerOrder,
  OrderStatus,
} from '../src/types';

export const marketplaceRouter = Router();

// -------------------------------------------------------------
// Middleware: Authentication & Vendor Authorization
// -------------------------------------------------------------
export interface AuthenticatedRequest extends Request {
  user?: UserAccount;
  vendorId?: string;
  isSuperAdmin?: boolean;
}

export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token =
    req.cookies?.session_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired session' });
  }

  const user = store.users.find((u) => u.id === payload.userId && u.status !== 'suspended');
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User account not found or suspended' });
  }

  req.user = user;
  req.isSuperAdmin = user.role === 'admin';

  // Determine vendor association
  if (user.role === 'vendor' || user.role === 'vendor_staff') {
    req.vendorId = user.vendor_id || user.store_id;
  } else if (req.isSuperAdmin && req.query.vendor_id) {
    // Admin can impersonate/inspect specific vendor
    req.vendorId = String(req.query.vendor_id);
  }

  next();
}

export function requireVendor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  authenticateUser(req, res, () => {
    if (req.isSuperAdmin) {
      // Super admin can act on behalf of vendors or view all
      return next();
    }

    if (req.user?.role !== 'vendor' && req.user?.role !== 'vendor_staff') {
      return res.status(403).json({ error: 'Forbidden', message: 'Vendor privileges required' });
    }

    if (!req.vendorId) {
      return res.status(403).json({ error: 'Forbidden', message: 'No registered store linked to this account' });
    }

    const currentStore = store.stores.find((s) => s.id === req.vendorId || s.slug === req.vendorId);
    if (!currentStore || (currentStore.status !== 'active' && currentStore.status !== 'approved')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Store status is ${currentStore?.status || 'unregistered'}. Store must be approved and active.`,
      });
    }

    next();
  });
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  authenticateUser(req, res, () => {
    if (!req.isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden', message: 'Platform Super Administrator privileges required' });
    }
    next();
  });
}

// -------------------------------------------------------------
// Commission Calculator
// -------------------------------------------------------------
export function calculateVendorCommission(
  vendorId: string,
  subtotal: number,
  categorySlug?: string
): { commissionRate: number; commissionAmount: number; vendorNet: number } {
  // Check main platform store (Cyber Dynamic Tech) -> 0% commission
  if (vendorId === 'store-cyber-dynamic-tech') {
    return { commissionRate: 0, commissionAmount: 0, vendorNet: subtotal };
  }

  const commissionConfig = store.config.commissions || {
    commission_type: 'percentage',
    global_percentage: 8,
    global_fixed_amount: 0,
    category_rates: {},
    vendor_rates: {},
  };

  const storeObj = store.stores.find((s) => s.id === vendorId);

  // 1. Check Store specific override
  let rate = commissionConfig.global_percentage ?? 8;
  if (storeObj?.commission_rate !== undefined && storeObj.commission_rate >= 0) {
    rate = storeObj.commission_rate;
  } else if (commissionConfig.vendor_rates && commissionConfig.vendor_rates[vendorId] !== undefined) {
    rate = commissionConfig.vendor_rates[vendorId];
  } else if (categorySlug && commissionConfig.category_rates && commissionConfig.category_rates[categorySlug] !== undefined) {
    rate = commissionConfig.category_rates[categorySlug];
  }

  let commissionAmount = Math.round((subtotal * rate) / 100);
  if (commissionConfig.commission_type === 'fixed' || commissionConfig.commission_type === 'combo') {
    commissionAmount += (commissionConfig.global_fixed_amount || 0);
  }

  commissionAmount = Math.max(0, Math.min(subtotal, commissionAmount));
  const vendorNet = Math.max(0, subtotal - commissionAmount);

  return {
    commissionRate: rate,
    commissionAmount,
    vendorNet,
  };
}

// -------------------------------------------------------------
// Multi-Vendor Order Splitting Engine
// -------------------------------------------------------------
export function splitOrderIntoVendorOrders(parentOrder: CustomerOrder): VendorOrder[] {
  const itemsByVendor: Record<string, typeof parentOrder.line_items> = {};

  for (const item of parentOrder.line_items) {
    const vId = item.vendor_id || 'store-cyber-dynamic-tech';
    if (!itemsByVendor[vId]) {
      itemsByVendor[vId] = [];
    }
    itemsByVendor[vId].push(item);
  }

  const vendorOrders: VendorOrder[] = [];
  const vendorCount = Object.keys(itemsByVendor).length;

  for (const [vId, vItems] of Object.entries(itemsByVendor)) {
    const vStore = store.stores.find((s) => s.id === vId) || store.stores[0];
    const vSubtotal = vItems.reduce((acc, it) => acc + (it.total || it.price * it.quantity), 0);

    // Fair distribution of shipping fee across vendors
    const vShipping = vendorCount > 0 ? Math.round(parentOrder.shipping_total / vendorCount) : 0;

    const { commissionRate, commissionAmount, vendorNet } = calculateVendorCommission(vId, vSubtotal);

    const vendorOrderId = `VORD-${parentOrder.id || Math.floor(Math.random() * 90000 + 10000)}-${vStore.slug.toUpperCase().slice(0, 8)}`;

    const vOrder: VendorOrder = {
      id: vendorOrderId,
      parent_order_id: parentOrder.id,
      parent_order_number: parentOrder.order_number,
      vendor_id: vId,
      vendor_name: vStore.name,
      store_slug: vStore.slug,
      status: parentOrder.status || 'processing',
      currency: 'UGX',
      date_created: new Date().toISOString(),
      subtotal: vSubtotal,
      shipping_fee: vShipping,
      platform_commission_rate: commissionRate,
      platform_commission_amount: commissionAmount,
      vendor_net_earnings: vendorNet + vShipping,
      line_items: vItems,
      customer_shipping_address: parentOrder.shipping,
      payment_status: parentOrder.status === 'processing' || parentOrder.status === 'completed' ? 'paid' : 'pending',
      timeline: [
        {
          title: 'Order Assigned to Vendor',
          status: 'processing',
          timestamp: new Date().toISOString(),
          description: `Vendor order generated for ${vStore.name}. Ready for fulfillment.`,
          completed: true,
          current: true,
        },
      ],
      payout_status: 'unpaid',
    };

    vendorOrders.push(vOrder);
    store.vendorOrders.push(vOrder);

    // Financial Ledger Record
    const walletTx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      vendor_id: vId,
      order_id: parentOrder.id,
      order_number: parentOrder.order_number,
      amount: vOrder.vendor_net_earnings,
      type: 'order_credit',
      balance_after: 0, // Computed dynamically by getVendorWallet
      status: 'completed',
      description: `Sales credit for order #${parentOrder.order_number} (Gross: UGX ${vSubtotal.toLocaleString()}, Comm: UGX ${commissionAmount.toLocaleString()}, Ship: UGX ${vShipping.toLocaleString()})`,
      created_at: new Date().toISOString(),
    };
    store.walletTransactions.push(walletTx);
  }

  store.saveDatabaseToDisk();
  return vendorOrders;
}

// -------------------------------------------------------------
// Public Endpoints
// -------------------------------------------------------------

// 1. Get all public active stores
marketplaceRouter.get(['/stores', '/stores/public'], (req: Request, res: Response) => {
  const { district, category, search } = req.query;

  let list = store.stores.filter((s) => s.status === 'active' || s.status === 'approved');

  if (district && district !== 'all') {
    list = list.filter((s) => s.district.toLowerCase() === String(district).toLowerCase());
  }

  if (category && category !== 'all') {
    list = list.filter((s) =>
      s.product_categories.some((c) => c.toLowerCase() === String(category).toLowerCase())
    );
  }

  if (search && String(search).trim()) {
    const q = String(search).toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
    );
  }

  const sanitized = list.map((s) => {
    const productCount = store.products.filter(
      (p) => p.vendor_id === s.id && p.stock_status !== 'outofstock'
    ).length;
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      logo_url: s.logo_url,
      banner_url: s.banner_url,
      description: s.description,
      city: s.city,
      district: s.district,
      country: s.country,
      rating: s.rating,
      rating_count: s.rating_count,
      is_verified: s.is_verified,
      is_platform_store: Boolean(s.is_platform_store),
      product_categories: s.product_categories,
      product_count: productCount,
      delivery_settings: s.delivery_settings,
    };
  });

  res.json({
    success: true,
    total: sanitized.length,
    stores: sanitized,
  });
});

// 2. Get Single Storefront by Slug or ID
marketplaceRouter.get('/stores/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const storeObj = store.getStoreByIdOrSlug(slug);

  if (!storeObj) {
    return res.status(404).json({ error: 'Store not found', message: 'No store exists with that slug' });
  }

  // Get Store's Products
  const storeProducts = store.products.filter(
    (p) => p.vendor_id === storeObj.id || (storeObj.is_platform_store && (!p.vendor_id || p.vendor_id === 'store-cyber-dynamic-tech'))
  );

  // Get Store's Reviews
  const storeReviews = store.storeReviews.filter(
    (r) => r.store_id === storeObj.id && r.status === 'approved'
  );

  // Get Store's Promotions
  const storePromotions = store.promotions.filter((pr) => pr.store_id === storeObj.id && pr.active);

  res.json({
    success: true,
    store: {
      id: storeObj.id,
      slug: storeObj.slug,
      name: storeObj.name,
      owner_name: storeObj.owner_name,
      email: storeObj.email,
      phone: storeObj.phone,
      status: storeObj.status,
      is_verified: storeObj.is_verified,
      is_platform_store: Boolean(storeObj.is_platform_store),
      logo_url: storeObj.logo_url,
      banner_url: storeObj.banner_url,
      description: storeObj.description,
      city: storeObj.city,
      district: storeObj.district,
      country: storeObj.country,
      address: storeObj.address,
      product_categories: storeObj.product_categories,
      rating: storeObj.rating,
      rating_count: storeObj.rating_count,
      delivery_settings: storeObj.delivery_settings,
      created_at: storeObj.created_at,
    },
    products_count: storeProducts.length,
    products: storeProducts,
    reviews: storeReviews,
    promotions: storePromotions,
  });
});

// 3. Public Vendor Registration
marketplaceRouter.post('/stores/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      owner_name,
      email,
      phone,
      description,
      city,
      district,
      country = 'Uganda',
      address,
      tin_number,
      registration_number,
      product_categories = [],
      logo_url,
      banner_url,
      payout_method = 'momo',
      payout_account_number,
      payout_account_name,
      delivery_type = 'vendor',
      delivery_fee = 10000,
      password,
    } = req.body || {};

    if (!name || !owner_name || !email || !phone) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Store name, owner name, email, and phone number are mandatory.',
      });
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ error: 'Invalid email', message: emailCheck.error });
    }

    // Check if store name or email already exists
    const cleanSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (store.stores.some((s) => s.slug === cleanSlug)) {
      return res.status(400).json({
        error: 'Duplicate store name',
        message: `A store with the name "${name}" or slug "${cleanSlug}" already exists. Please choose a distinct name.`,
      });
    }

    const storeId = `store-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Create or find user account for the vendor
    let vendorUser = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!vendorUser) {
      const { hashPassword } = await import('./security');
      vendorUser = {
        id: Math.max(...store.users.map((u) => u.id), 0) + 1,
        email: emailCheck.value!,
        password_hash: hashPassword(password || 'VendorPass2026!'),
        first_name: owner_name.split(' ')[0] || owner_name,
        last_name: owner_name.split(' ').slice(1).join(' ') || 'Vendor',
        phone: phone.trim(),
        role: 'vendor',
        status: 'active',
        vendor_id: storeId,
        store_id: storeId,
        admin_notes: `Registered vendor application for ${name}`,
        is_email_verified: true,
        two_factor_enabled: false,
        created_at: new Date().toISOString(),
        addresses: [],
        wishlist: [],
      };
      store.users.push(vendorUser);
    } else {
      vendorUser.role = 'vendor';
      vendorUser.vendor_id = storeId;
      vendorUser.store_id = storeId;
    }

    const autoApprove = Boolean(store.config.marketplace?.auto_approve_vendors);

    const newStore: Store = {
      id: storeId,
      slug: cleanSlug,
      name: sanitizeString(name),
      owner_id: vendorUser.id,
      owner_name: sanitizeString(owner_name),
      email: emailCheck.value!,
      phone: phone.trim(),
      status: autoApprove ? 'active' : 'pending',
      is_verified: autoApprove,
      is_platform_store: false,
      logo_url:
        logo_url ||
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80',
      banner_url:
        banner_url ||
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
      description: sanitizeString(description || `${name} official storefront on Cyber Dynamic Technologies Marketplace.`),
      city: sanitizeString(city || 'Kampala'),
      district: sanitizeString(district || 'Kampala Central'),
      country: sanitizeString(country || 'Uganda'),
      address: sanitizeString(address || 'Kampala, Uganda'),
      tin_number: sanitizeString(tin_number || ''),
      registration_number: sanitizeString(registration_number || ''),
      product_categories: Array.isArray(product_categories) ? product_categories : ['Laptops', 'Accessories'],
      rating: 5.0,
      rating_count: 0,
      commission_rate: store.config.commissions?.global_percentage ?? 8,
      payout_details: {
        method: payout_method,
        account_number: sanitizeString(payout_account_number || phone),
        account_name: sanitizeString(payout_account_name || owner_name),
      },
      delivery_settings: {
        type: delivery_type,
        base_delivery_fee: Number(delivery_fee) || 10000,
        estimated_days: '1-2 business days across Uganda',
        allow_pickup: true,
        pickup_address: sanitizeString(address || 'Store location'),
      },
      created_at: new Date().toISOString(),
    };

    store.stores.push(newStore);
    store.saveDatabaseToDisk();

    logAudit({
      user_email: email,
      action: 'VENDOR_REGISTRATION',
      category: 'Marketplace',
      details: `New vendor registration submitted for "${name}" (ID: ${storeId}, Status: ${newStore.status})`,
      status: 'success',
    });

    res.status(201).json({
      success: true,
      message: autoApprove
        ? `Congratulations! Your store "${name}" has been approved and is now live!`
        : `Your vendor application for "${name}" has been submitted successfully and is pending administrator approval.`,
      store: newStore,
      status: newStore.status,
    });
  } catch (err: any) {
    console.error('Vendor registration error:', err);
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
});

// 4. Store Reviews: List & Add
marketplaceRouter.get('/stores/:id/reviews', (req: Request, res: Response) => {
  const { id } = req.params;
  const reviews = store.storeReviews.filter((r) => r.store_id === id && r.status === 'approved');
  res.json({ success: true, reviews });
});

marketplaceRouter.post('/stores/:id/reviews', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reviewer_name, reviewer_email, rating, comment, order_number } = req.body || {};

  if (!reviewer_name || !rating || !comment) {
    return res.status(400).json({ error: 'Missing fields', message: 'Name, star rating, and review text are required.' });
  }

  const targetStore = store.stores.find((s) => s.id === id);
  if (!targetStore) {
    return res.status(404).json({ error: 'Store not found' });
  }

  const autoApprove = !store.config.marketplace?.require_review_moderation;

  const review: StoreReview = {
    id: `srev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    store_id: id,
    reviewer_name: sanitizeString(reviewer_name),
    reviewer_email: reviewer_email ? sanitizeString(reviewer_email) : undefined,
    rating: Math.min(5, Math.max(1, Number(rating))),
    comment: sanitizeString(comment),
    date_created: new Date().toISOString(),
    verified_purchase: Boolean(order_number),
    order_number: order_number ? sanitizeString(order_number) : undefined,
    status: autoApprove ? 'approved' : 'pending',
  };

  store.storeReviews.push(review);

  // Recalculate store rating
  const approvedReviews = store.storeReviews.filter((r) => r.store_id === id && r.status === 'approved');
  if (approvedReviews.length > 0) {
    const totalScore = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
    targetStore.rating = Number((totalScore / approvedReviews.length).toFixed(1));
    targetStore.rating_count = approvedReviews.length;
  }

  store.saveDatabaseToDisk();

  res.status(201).json({
    success: true,
    message: autoApprove ? 'Review posted successfully.' : 'Review submitted for moderation.',
    review,
  });
});

// -------------------------------------------------------------
// Vendor Portal Endpoints (Authenticated & Tenant Isolated)
// -------------------------------------------------------------

// Vendor Dashboard Metrics
marketplaceRouter.get('/vendor/dashboard', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const currentStore = store.stores.find((s) => s.id === vendorId);
  const wallet = store.getVendorWallet(vendorId);

  const vendorProducts = store.products.filter((p) => p.vendor_id === vendorId);
  const vendorOrders = store.vendorOrders.filter((vo) => vo.vendor_id === vendorId);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const todayOrders = vendorOrders.filter((vo) => vo.date_created.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, vo) => sum + vo.subtotal, 0);

  const monthOrders = vendorOrders.filter((vo) => vo.date_created >= startOfMonth);
  const monthlySales = monthOrders.reduce((sum, vo) => sum + vo.subtotal, 0);

  const lowStockProducts = vendorProducts.filter(
    (p) => p.manage_stock && p.stock_quantity <= 3 && p.stock_status !== 'outofstock'
  );

  res.json({
    success: true,
    store: currentStore,
    metrics: {
      today_sales: todaySales,
      today_orders: todayOrders.length,
      monthly_sales: monthlySales,
      monthly_orders: monthOrders.length,
      total_products: vendorProducts.length,
      low_stock_count: lowStockProducts.length,
      low_stock_products: lowStockProducts.slice(0, 5),
      gross_sales: wallet.gross_sales,
      platform_commission: wallet.platform_commission,
      total_earnings: wallet.total_earnings,
      available_balance: wallet.available_balance,
      pending_balance: wallet.pending_balance,
      paid_balance: wallet.paid_balance,
      pending_payouts: wallet.pending_payouts,
      currency: 'UGX',
    },
    recent_orders: vendorOrders.slice(0, 8),
    recent_transactions: wallet.transactions.slice(0, 8),
  });
});

// Vendor Products Management
marketplaceRouter.get('/vendor/products', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const products = store.products.filter((p) => p.vendor_id === vendorId);
  res.json({ success: true, count: products.length, products });
});

marketplaceRouter.post('/vendor/products', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.vendorId!;
    const currentStore = store.stores.find((s) => s.id === vendorId)!;

    const {
      name,
      sku,
      price,
      regular_price,
      sale_price,
      stock_quantity = 10,
      stock_status = 'instock',
      manage_stock = true,
      brand,
      short_description,
      description,
      categories = [],
      images = [],
      attributes = [],
      variations = [],
      specifications = {},
      warranty,
      featured = false,
      flash_sale = false,
    } = req.body || {};

    if (!name || !price) {
      return res.status(400).json({ error: 'Missing fields', message: 'Product name and price are required.' });
    }

    const newId = Math.max(...store.products.map((p) => p.id), 0) + 1;
    const cleanSlug = `${name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}-${newId}`;

    const numPrice = Number(price);
    const numRegularPrice = Number(regular_price || price);
    const numSalePrice = sale_price ? Number(sale_price) : undefined;

    const newProduct: Product = {
      id: newId,
      name: sanitizeString(name),
      slug: cleanSlug,
      permalink: `https://www.cyberdynamictech.com/product/${cleanSlug}`,
      sku: sku ? sanitizeString(sku) : `SKU-${vendorId.slice(0, 6).toUpperCase()}-${newId}`,
      price: numPrice,
      regular_price: numRegularPrice,
      sale_price: numSalePrice,
      on_sale: Boolean(numSalePrice && numSalePrice < numRegularPrice),
      stock_status: stock_status,
      stock_quantity: Number(stock_quantity) || 0,
      manage_stock: Boolean(manage_stock),
      brand: sanitizeString(brand || currentStore.name),
      categories: Array.isArray(categories) && categories.length > 0 ? categories : [{ id: 1, name: 'General', slug: 'general' }],
      images: Array.isArray(images) && images.length > 0 ? images : [
        {
          id: 1,
          src: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80',
          name: name,
          alt: name,
        },
      ],
      attributes: Array.isArray(attributes) ? attributes : [],
      variations: Array.isArray(variations) ? variations : [],
      short_description: sanitizeString(short_description || ''),
      description: sanitizeString(description || short_description || ''),
      average_rating: 5.0,
      rating_count: 0,
      featured: Boolean(featured),
      flash_sale: Boolean(flash_sale),
      warranty: warranty ? sanitizeString(warranty) : '6 Months Warranty',
      specifications: specifications || {},
      vendor_id: vendorId,
      vendor_name: currentStore.name,
      store_slug: currentStore.slug,
    };

    store.products.unshift(newProduct);
    store.saveDatabaseToDisk();

    logAudit({
      user_email: req.user?.email || 'vendor',
      action: 'VENDOR_PRODUCT_CREATE',
      category: 'Product',
      details: `Vendor "${currentStore.name}" created product "${name}" (ID: ${newId})`,
      status: 'success',
    });

    res.status(201).json({ success: true, message: 'Product created successfully', product: newProduct });
  } catch (err: any) {
    console.error('Vendor product creation error:', err);
    res.status(500).json({ error: 'Product creation failed', message: err.message });
  }
});

marketplaceRouter.put('/vendor/products/:id', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const productId = Number(req.params.id);

  const product = store.products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Security Tenant Check: Ensure vendor owns this product (unless super admin)
  if (!req.isSuperAdmin && product.vendor_id !== vendorId) {
    return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to modify products of another store.' });
  }

  const updates = req.body || {};
  if (updates.name) product.name = sanitizeString(updates.name);
  if (updates.price !== undefined) product.price = Number(updates.price);
  if (updates.regular_price !== undefined) product.regular_price = Number(updates.regular_price);
  if (updates.sale_price !== undefined) {
    product.sale_price = updates.sale_price ? Number(updates.sale_price) : undefined;
    product.on_sale = Boolean(product.sale_price && product.sale_price < product.regular_price);
  }
  if (updates.stock_quantity !== undefined) {
    product.stock_quantity = Number(updates.stock_quantity);
    product.stock_status = product.stock_quantity > 0 ? 'instock' : 'outofstock';
  }
  if (updates.stock_status) product.stock_status = updates.stock_status;
  if (updates.brand) product.brand = sanitizeString(updates.brand);
  if (updates.short_description) product.short_description = sanitizeString(updates.short_description);
  if (updates.description) product.description = sanitizeString(updates.description);
  if (updates.categories) product.categories = updates.categories;
  if (updates.images) product.images = updates.images;
  if (updates.warranty) product.warranty = sanitizeString(updates.warranty);
  if (updates.specifications) product.specifications = updates.specifications;

  store.saveDatabaseToDisk();

  res.json({ success: true, message: 'Product updated successfully', product });
});

marketplaceRouter.delete('/vendor/products/:id', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const productId = Number(req.params.id);

  const index = store.products.findIndex((p) => p.id === productId);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const product = store.products[index];
  // Security Tenant Check
  if (!req.isSuperAdmin && product.vendor_id !== vendorId) {
    return res.status(403).json({ error: 'Forbidden', message: 'You cannot delete another store’s product.' });
  }

  store.products.splice(index, 1);
  store.saveDatabaseToDisk();

  res.json({ success: true, message: 'Product deleted successfully' });
});

// Vendor Orders Management
marketplaceRouter.get('/vendor/orders', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const orders = store.vendorOrders.filter((vo) => vo.vendor_id === vendorId);
  res.json({ success: true, count: orders.length, orders });
});

marketplaceRouter.patch('/vendor/orders/:id/status', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const { id } = req.params;
  const { status, note } = req.body || {};

  const vOrder = store.vendorOrders.find((vo) => vo.id === id);
  if (!vOrder) {
    return res.status(404).json({ error: 'Vendor order not found' });
  }

  // Security Check: Vendor can only update their own order
  if (!req.isSuperAdmin && vOrder.vendor_id !== vendorId) {
    return res.status(403).json({ error: 'Forbidden', message: 'Cannot manage another store’s order.' });
  }

  const allowedStatuses: OrderStatus[] = [
    'processing',
    'packed',
    'shipped',
    'out-for-delivery',
    'delivered',
    'completed',
    'cancelled',
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status', allowed: allowedStatuses });
  }

  vOrder.status = status;
  if (status === 'delivered' || status === 'completed') {
    vOrder.payment_status = 'paid';
  }

  vOrder.timeline.push({
    title: `Order Status: ${status.replace('-', ' ').toUpperCase()}`,
    status,
    timestamp: new Date().toISOString(),
    description: note || `Status updated by vendor to ${status}.`,
    completed: true,
    current: true,
  });

  store.saveDatabaseToDisk();

  logAudit({
    user_email: req.user?.email || 'vendor',
    action: 'VENDOR_ORDER_STATUS_UPDATE',
    category: 'Orders',
    details: `Vendor order ${id} status updated to ${status}`,
    status: 'success',
  });

  res.json({ success: true, message: `Vendor order updated to ${status}`, order: vOrder });
});

// Vendor Wallet & Payout Requests
marketplaceRouter.get('/vendor/wallet', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const wallet = store.getVendorWallet(vendorId);
  res.json({ success: true, wallet });
});

marketplaceRouter.post('/vendor/payouts', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const currentStore = store.stores.find((s) => s.id === vendorId)!;
  const wallet = store.getVendorWallet(vendorId);

  const { amount, payout_method, account_number, account_name, bank_name } = req.body || {};
  const numAmount = Number(amount);

  const minPayout = store.config.marketplace?.min_payout_amount_ugx || 50000;
  if (!numAmount || numAmount < minPayout) {
    return res.status(400).json({
      error: 'Invalid payout amount',
      message: `Minimum withdrawal amount is UGX ${minPayout.toLocaleString()}.`,
    });
  }

  if (numAmount > wallet.available_balance) {
    return res.status(400).json({
      error: 'Insufficient funds',
      message: `Requested UGX ${numAmount.toLocaleString()} exceeds your available balance of UGX ${wallet.available_balance.toLocaleString()}.`,
    });
  }

  const payoutId = `PO-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

  const newPayout: PayoutRequest = {
    id: payoutId,
    vendor_id: vendorId,
    vendor_name: currentStore.name,
    amount: numAmount,
    currency: 'UGX',
    payout_method: payout_method || currentStore.payout_details.method || 'momo',
    account_number: account_number || currentStore.payout_details.account_number,
    account_name: account_name || currentStore.payout_details.account_name,
    bank_name: bank_name || currentStore.payout_details.bank_name,
    status: 'pending',
    requested_at: new Date().toISOString(),
  };

  store.payouts.unshift(newPayout);

  // Financial ledger transaction
  const tx: WalletTransaction = {
    id: `tx_${Date.now()}_payout_hold`,
    vendor_id: vendorId,
    amount: -numAmount,
    type: 'payout_withdrawal',
    balance_after: wallet.available_balance - numAmount,
    status: 'pending',
    description: `Withdrawal request #${payoutId} submitted for UGX ${numAmount.toLocaleString()} via ${newPayout.payout_method.toUpperCase()}`,
    created_at: new Date().toISOString(),
  };
  store.walletTransactions.push(tx);

  store.saveDatabaseToDisk();

  logAudit({
    user_email: req.user?.email || 'vendor',
    action: 'VENDOR_PAYOUT_REQUEST',
    category: 'Finance',
    details: `Vendor "${currentStore.name}" requested payout #${payoutId} of UGX ${numAmount.toLocaleString()}`,
    status: 'success',
  });

  res.status(201).json({
    success: true,
    message: `Withdrawal request for UGX ${numAmount.toLocaleString()} submitted successfully. Funds will be verified and disbursed via ${newPayout.payout_method.toUpperCase()}.`,
    payout: newPayout,
  });
});

marketplaceRouter.get('/vendor/payouts', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const list = store.payouts.filter((p) => p.vendor_id === vendorId);
  res.json({ success: true, count: list.length, payouts: list });
});

// Vendor Store Profile Management
marketplaceRouter.get('/vendor/profile', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const currentStore = store.stores.find((s) => s.id === vendorId);
  res.json({ success: true, store: currentStore });
});

marketplaceRouter.patch('/vendor/profile', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const currentStore = store.stores.find((s) => s.id === vendorId);
  if (!currentStore) return res.status(404).json({ error: 'Store not found' });

  const {
    name,
    phone,
    description,
    city,
    district,
    address,
    logo_url,
    banner_url,
    payout_details,
    delivery_settings,
    product_categories,
  } = req.body || {};

  if (name) currentStore.name = sanitizeString(name);
  if (phone) currentStore.phone = phone.trim();
  if (description) currentStore.description = sanitizeString(description);
  if (city) currentStore.city = sanitizeString(city);
  if (district) currentStore.district = sanitizeString(district);
  if (address) currentStore.address = sanitizeString(address);
  if (logo_url) currentStore.logo_url = sanitizeString(logo_url);
  if (banner_url) currentStore.banner_url = sanitizeString(banner_url);
  if (payout_details) currentStore.payout_details = { ...currentStore.payout_details, ...payout_details };
  if (delivery_settings) currentStore.delivery_settings = { ...currentStore.delivery_settings, ...delivery_settings };
  if (Array.isArray(product_categories)) currentStore.product_categories = product_categories;

  store.saveDatabaseToDisk();

  res.json({ success: true, message: 'Store profile updated successfully', store: currentStore });
});

// Vendor Staff Accounts
marketplaceRouter.get('/vendor/staff', requireVendor, (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const staff = store.vendorStaff.filter((vs) => vs.vendor_id === vendorId);
  res.json({ success: true, count: staff.length, staff });
});

marketplaceRouter.post('/vendor/staff', requireVendor, async (req: AuthenticatedRequest, res: Response) => {
  const vendorId = req.vendorId!;
  const { name, email, role_title = 'Store Manager', permissions = ['manage_products', 'manage_orders'], password } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing fields', message: 'Staff name and email are required.' });
  }

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  let staffUser = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!staffUser) {
    const { hashPassword } = await import('./security');
    staffUser = {
      id: Math.max(...store.users.map((u) => u.id), 0) + 1,
      email: emailCheck.value!,
      password_hash: hashPassword(password || 'StaffPass2026!'),
      first_name: name.split(' ')[0] || name,
      last_name: name.split(' ').slice(1).join(' ') || 'Staff',
      phone: '',
      role: 'vendor_staff',
      status: 'active',
      vendor_id: vendorId,
      store_id: vendorId,
      permissions: permissions,
      is_email_verified: true,
      two_factor_enabled: false,
      created_at: new Date().toISOString(),
      addresses: [],
      wishlist: [],
    };
    store.users.push(staffUser);
  }

  const newStaff: VendorStaff = {
    id: `staff_${Date.now()}`,
    vendor_id: vendorId,
    user_id: staffUser.id,
    name: sanitizeString(name),
    email: emailCheck.value!,
    role_title: sanitizeString(role_title),
    permissions: Array.isArray(permissions) ? permissions : ['manage_products', 'manage_orders'],
    status: 'active',
    created_at: new Date().toISOString(),
  };

  store.vendorStaff.push(newStaff);
  store.saveDatabaseToDisk();

  res.status(201).json({ success: true, message: 'Staff account created successfully', staff: newStaff });
});

// -------------------------------------------------------------
// Super Admin Marketplace Management Endpoints
// -------------------------------------------------------------

// 1. Get all stores (all statuses) with full ledger overview
marketplaceRouter.get('/admin/stores', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const storesWithStats = store.stores.map((s) => {
    const pCount = store.products.filter((p) => p.vendor_id === s.id).length;
    const orders = store.vendorOrders.filter((vo) => vo.vendor_id === s.id);
    const gmv = orders.reduce((sum, vo) => sum + vo.subtotal, 0);
    const comm = orders.reduce((sum, vo) => sum + vo.platform_commission_amount, 0);
    const wallet = store.getVendorWallet(s.id);

    return {
      ...s,
      product_count: pCount,
      order_count: orders.length,
      gmv,
      platform_commission_collected: comm,
      available_balance: wallet.available_balance,
      pending_payouts: wallet.pending_payouts,
    };
  });

  res.json({ success: true, total: store.stores.length, stores: storesWithStats });
});

// 2. Change store status (Approve, Reject, Suspend, Activate)
marketplaceRouter.patch('/admin/stores/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body || {};

  const storeObj = store.stores.find((s) => s.id === id);
  if (!storeObj) return res.status(404).json({ error: 'Store not found' });

  if (storeObj.is_platform_store && status === 'suspended') {
    return res.status(400).json({ error: 'Cannot suspend the main Cyber Dynamic Tech platform store.' });
  }

  storeObj.status = status;
  if (status === 'approved' || status === 'active') {
    storeObj.is_verified = true;
    delete storeObj.rejection_reason;
    delete storeObj.suspended_reason;
  } else if (status === 'rejected') {
    storeObj.rejection_reason = reason || 'Store application rejected by administrator.';
  } else if (status === 'suspended') {
    storeObj.suspended_reason = reason || 'Store temporarily suspended by administrator.';
  }

  store.saveDatabaseToDisk();

  logAudit({
    user_email: req.user?.email || 'admin',
    action: 'ADMIN_STORE_STATUS_UPDATE',
    category: 'Marketplace',
    details: `Store "${storeObj.name}" status updated to "${status}"`,
    status: 'success',
  });

  res.json({ success: true, message: `Store "${storeObj.name}" is now ${status}.`, store: storeObj });
});

// 3. Configure store custom commission
marketplaceRouter.patch('/admin/stores/:id/commission', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { commission_rate } = req.body || {};

  const storeObj = store.stores.find((s) => s.id === id);
  if (!storeObj) return res.status(404).json({ error: 'Store not found' });

  storeObj.commission_rate = Math.max(0, Math.min(100, Number(commission_rate) || 0));
  store.saveDatabaseToDisk();

  res.json({ success: true, message: `Commission rate updated to ${storeObj.commission_rate}% for "${storeObj.name}"`, store: storeObj });
});

// 4. Admin Marketplace Analytics
marketplaceRouter.get('/admin/analytics', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const activeStores = store.stores.filter((s) => s.status === 'active' || s.status === 'approved');
  const pendingStores = store.stores.filter((s) => s.status === 'pending');

  const totalGMV = store.vendorOrders.reduce((sum, vo) => sum + vo.subtotal, 0);
  const totalCommissions = store.vendorOrders.reduce((sum, vo) => sum + vo.platform_commission_amount, 0);
  const totalVendorEarnings = store.vendorOrders.reduce((sum, vo) => sum + vo.vendor_net_earnings, 0);

  const pendingPayouts = store.payouts.filter((p) => p.status === 'pending' || p.status === 'processing');
  const pendingPayoutsAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

  const completedPayouts = store.payouts.filter((p) => p.status === 'paid');
  const completedPayoutsAmount = completedPayouts.reduce((sum, p) => sum + p.amount, 0);

  res.json({
    success: true,
    analytics: {
      total_stores: store.stores.length,
      active_stores: activeStores.length,
      pending_stores: pendingStores.length,
      total_products: store.products.length,
      total_vendor_orders: store.vendorOrders.length,
      marketplace_gmv: totalGMV,
      platform_commissions: totalCommissions,
      vendor_earnings: totalVendorEarnings,
      pending_payouts_count: pendingPayouts.length,
      pending_payouts_amount: pendingPayoutsAmount,
      completed_payouts_amount: completedPayoutsAmount,
      currency: 'UGX',
    },
  });
});

// 5. Admin Payouts List & Status Update (Approve / Reject / Mark Paid)
marketplaceRouter.get('/admin/payouts', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, payouts: store.payouts });
});

marketplaceRouter.patch('/admin/payouts/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, transaction_reference, admin_notes } = req.body || {};

  const payout = store.payouts.find((p) => p.id === id);
  if (!payout) return res.status(404).json({ error: 'Payout request not found' });

  const prevStatus = payout.status;
  payout.status = status;
  if (admin_notes) payout.admin_notes = sanitizeString(admin_notes);
  if (transaction_reference) payout.transaction_reference = sanitizeString(transaction_reference);

  if (status === 'paid') {
    payout.processed_at = new Date().toISOString();
    payout.processed_by = req.user?.email || 'admin';

    // Update corresponding financial ledger transaction
    const tx = store.walletTransactions.find((t) => t.description.includes(payout.id));
    if (tx) {
      tx.status = 'completed';
    }
  } else if (status === 'rejected' || status === 'cancelled') {
    // If payout was rejected, reverse/cancel the debit transaction
    const tx = store.walletTransactions.find((t) => t.description.includes(payout.id));
    if (tx) {
      tx.status = 'cancelled';
    }
    // Credit refund back to vendor ledger
    store.walletTransactions.push({
      id: `tx_${Date.now()}_refund`,
      vendor_id: payout.vendor_id,
      amount: payout.amount,
      type: 'payout_refund',
      balance_after: 0,
      status: 'completed',
      description: `Refund of rejected payout #${payout.id} (Reason: ${admin_notes || 'Rejected by Admin'})`,
      created_at: new Date().toISOString(),
    });
  }

  store.saveDatabaseToDisk();

  logAudit({
    user_email: req.user?.email || 'admin',
    action: 'ADMIN_PAYOUT_STATUS_UPDATE',
    category: 'Finance',
    details: `Payout #${payout.id} (UGX ${payout.amount.toLocaleString()}) changed from ${prevStatus} to ${status}`,
    status: 'success',
  });

  res.json({ success: true, message: `Payout #${payout.id} marked as ${status}.`, payout });
});
