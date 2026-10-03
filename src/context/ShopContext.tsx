import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  ProductVariation,
  CartItem,
  DeliveryZone,
  CustomerUser,
  StoreSettings,
  Coupon,
  MarketplaceConfig,
  Store,
} from '../types';
import { INITIAL_DELIVERY_ZONES } from '../data/cyberCatalog';
import { api } from '../services/api';
import { settingsService } from '../services/settingsService';

interface ShopContextType {
  products: Product[];
  categories: Category[];
  isOnline: boolean;
  syncWithWooCommerce: () => Promise<void>;
  fetchProducts: () => Promise<void>;

  cart: CartItem[];
  addToCart: (product: Product, variation?: ProductVariation, quantity?: number, attributes?: Record<string, string>) => void;
  buyNow: (product: Product, variation?: ProductVariation, quantity?: number, attributes?: Record<string, string>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  wishlist: number[];
  toggleWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;

  recentlyViewed: Product[];
  addToRecentlyViewed: (product: Product) => void;

  appliedCoupon: Coupon | null;
  discountAmount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;

  deliveryZones: DeliveryZone[];
  selectedZone: DeliveryZone;
  setSelectedZone: (zone: DeliveryZone) => void;

  user: CustomerUser | null;
  isAdmin: boolean;
  isVendor: boolean;
  vendorStoreId?: string;
  isPosAllowed: boolean;
  stores: Store[];
  fetchStores: () => Promise<void>;
  goToStorefront: (slug: string) => void;
  loginUser: (email: string, name?: string, phone?: string) => void;
  login: (credentialsOrEmail: { email: string; password: string } | string, maybePassword?: string) => Promise<{ success: boolean; user?: CustomerUser; message: string }>;
  quickLogin: (role?: 'admin' | 'staff' | 'customer' | 'vendor') => Promise<{ success: boolean; message: string }>;
  register: (data: { first_name: string; last_name?: string; email: string; phone?: string; password: string }) => Promise<{ success: boolean; message: string }>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (data: { first_name?: string; last_name?: string; phone?: string; addresses?: any[] }) => Promise<void>;

  config: MarketplaceConfig;
  storeSettings: StoreSettings;
  primaryColor: string;
  setThemeColor: (color: string) => Promise<void>;
  updateCategorySettings: <K extends keyof MarketplaceConfig>(category: K, data: Partial<MarketplaceConfig[K]>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  formatPrice: (amount: number) => string;

  toastMessage: string | null;
  showToast: (msg: string) => void;

  isPageLoading: boolean;
  pageLoadingMessage: string;
  setPageLoading: (loading: boolean, message?: string) => void;

  currentView: string;
  setCurrentView: (view: string, data?: any) => void;
  viewData: any;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global synchronized product catalog & categories (sourced strictly from API)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const fetchStores = async () => {
    try {
      const res = await api.getPublicStores();
      if (res && Array.isArray(res.stores)) {
        setStores(res.stores as Store[]);
      }
    } catch (err) {
      console.warn('API stores fetch notice:', err);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const goToStorefront = (slug: string) => {
    setCurrentView('storefront', { slug });
  };

  const fetchProducts = async (limit: number = 48) => {
    try {
      const res = await api.getProducts({ limit });
      if (res && Array.isArray(res.products)) {
        setProducts(res.products);
      }
    } catch (err) {
      console.warn('API catalog fetch notice:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await api.getCategories();
      if (Array.isArray(cats)) {
        setCategories(cats);
      }
    } catch (err) {
      console.warn('API categories fetch notice:', err);
    }
  };

  const syncWithWooCommerce = async () => {
    try {
      const res = await api.fetchWooCommerceProducts({ per_page: 48, max_products: 48 });
      if (res && Array.isArray(res.products) && res.products.length > 0) {
        setProducts(res.products);
      }
      showToast(`Synchronized ${res.fetched_count || res.products?.length} products from live WooCommerce.`);
    } catch {
      try {
        const res = await api.getProducts({ limit: 48 }, { forceRefresh: true });
        if (res && Array.isArray(res.products) && res.products.length > 0) {
          setProducts(res.products);
        }
        showToast('Catalog refreshed and synchronized.');
      } catch {
        showToast('Catalog is up to date.');
      }
    }
  };

  // CDT Page Loader state
  const [isPageLoading, setIsPageLoadingState] = useState<boolean>(true);
  const [pageLoadingMessage, setPageLoadingMessage] = useState<string>(
    'Initializing Cyber Dynamic Technologies Marketplace...'
  );

  const setPageLoading = (loading: boolean, message = 'Loading Cyber Dynamic Technologies...') => {
    setPageLoadingMessage(message);
    setIsPageLoadingState(loading);
  };

  // Initial catalog load & network listeners
  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      try {
        await Promise.allSettled([
          fetchProducts(),
          fetchCategories(),
          // Background pre-fetch first page of shop catalog (page: 1, limit: 18) to ensure instant catalog readiness
          api.getProducts({ page: 1, limit: 18 }),
        ]);
      } finally {
        setTimeout(() => {
          if (isMounted) setIsPageLoadingState(false);
        }, 500);
      }
    };
    initApp();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Config from Central Settings Service
  const [config, setConfig] = useState<MarketplaceConfig>(settingsService.getConfig());
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(settingsService.toStoreSettings());

  // Listen to live settings changes
  useEffect(() => {
    const unsubscribe = settingsService.subscribe((updated) => {
      setConfig({ ...updated });
      setStoreSettings(settingsService.toStoreSettings());
    });
    return unsubscribe;
  }, []);

  // Cart state persisted in localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cdt_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Wishlist persisted in localStorage
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('cdt_wishlist');
      return saved ? JSON.parse(saved) : [101, 102];
    } catch {
      return [101, 102];
    }
  });

  // Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('cdt_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User session
  const [user, setUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('cdt_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && (parsed.id || parsed.email)) {
        return parsed;
      }
      localStorage.removeItem('cdt_user');
      return null;
    } catch {
      localStorage.removeItem('cdt_user');
      return null;
    }
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const isPosAllowed = Boolean(
    user && (
      user.role === 'admin' ||
      (config?.pos?.enabled !== false && (
        config?.pos?.allowed_roles?.includes(user.role) ||
        (user.email && config?.pos?.allowed_user_emails?.some(
          (email) => email.trim().toLowerCase() === user.email.trim().toLowerCase()
        ))
      ))
    )
  );

  // Delivery zones
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(
    config.delivery.zones || INITIAL_DELIVERY_ZONES
  );
  const [selectedZone, setSelectedZone] = useState<DeliveryZone>(
    config.delivery.zones?.[0] || INITIAL_DELIVERY_ZONES[0]
  );

  // Sync delivery zones if config changes
  useEffect(() => {
    if (config.delivery.zones && config.delivery.zones.length > 0) {
      setDeliveryZones(config.delivery.zones);
      if (!selectedZone || !config.delivery.zones.some((z) => z.id === selectedZone.id)) {
        setSelectedZone(config.delivery.zones[0]);
      }
    }
  }, [config.delivery.zones]);

  // Coupon
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to parse initial URL hash for direct links and browser navigation in cPanel
  const parseHash = (): { view: string; data?: any } | null => {
    if (typeof window === 'undefined') return null;
    const raw = window.location.hash.replace(/^#\/?/, '').trim();
    if (!raw) return null;

    if (raw.startsWith('product/')) {
      const slugOrId = decodeURIComponent(raw.replace('product/', ''));
      return { view: 'product', data: { slug: slugOrId, id: Number(slugOrId) || undefined } };
    }
    if (raw.startsWith('category/')) {
      const cat = decodeURIComponent(raw.replace('category/', ''));
      return { view: 'shop', data: { category: cat } };
    }
    if (raw.startsWith('store/')) {
      const storeSlug = decodeURIComponent(raw.replace('store/', ''));
      return { view: 'storefront', data: { slug: storeSlug } };
    }
    if (['home', 'shop', 'checkout', 'track-order', 'account', 'login', 'register', 'admin', 'pos', 'contact', 'warranty', 'delivery-info', 'stores', 'storefront', 'vendor-register', 'vendor-dashboard'].includes(raw)) {
      return { view: raw };
    }
    return null;
  };

  const initialHashNav = typeof window !== 'undefined' ? parseHash() : null;

  // Router-free view controller with hash sync
  const [currentView, setInternalCurrentView] = useState<string>(initialHashNav?.view || 'home');
  const [viewData, setViewData] = useState<any>(initialHashNav?.data || null);

  const updateBrowserHash = (view: string, data?: any) => {
    if (typeof window === 'undefined') return;
    try {
      if (view === 'home') {
        if (window.location.hash) {
          window.history.pushState(null, '', window.location.pathname + window.location.search);
        }
      } else if (view === 'product' && (data?.slug || data?.id)) {
        window.location.hash = `#product/${encodeURIComponent(data.slug || data.id)}`;
      } else if (view === 'shop' && data?.category) {
        window.location.hash = `#category/${encodeURIComponent(data.category)}`;
      } else if ((view === 'storefront' || view === 'store') && data?.slug) {
        window.location.hash = `#store/${encodeURIComponent(data.slug)}`;
      } else {
        window.location.hash = `#${view}`;
      }
    } catch {}
  };

  // Listen for browser Back/Forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash();
      if (parsed) {
        setInternalCurrentView(parsed.view);
        setViewData(parsed.data || null);
      } else {
        setInternalCurrentView('home');
        setViewData(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const setCurrentView = (view: string, data?: any) => {
    updateBrowserHash(view, data);
    if (view !== currentView) {
      setIsPageLoadingState(true);
      setPageLoadingMessage(
        view === 'shop'
          ? 'Opening CDT Hardware Catalog...'
          : view === 'product'
          ? 'Loading Hardware Specifications...'
          : view === 'checkout'
          ? 'Preparing Secure Checkout...'
          : view === 'pos'
          ? 'Launching CDT POS Terminal...'
          : view === 'admin'
          ? 'Opening CDT Admin Portal...'
          : view === 'track-order'
          ? 'Tracking Order Dispatch...'
          : view === 'account'
          ? 'Loading Account Profile...'
          : view === 'stores'
          ? 'Browsing Verified Ugandan Tech Stores...'
          : view === 'storefront' || view === 'store'
          ? 'Loading Vendor Storefront...'
          : view === 'vendor-dashboard'
          ? 'Launching Seller Center...'
          : view === 'vendor-register'
          ? 'Opening Vendor Onboarding...'
          : 'Loading Cyber Dynamic Technologies...'
      );

      setTimeout(() => {
        setInternalCurrentView(view);
        setViewData(data || null);
        window.scrollTo({ top: 0, behavior: 'instant' });
        setTimeout(() => {
          setIsPageLoadingState(false);
        }, 180);
      }, 140);
    } else {
      setViewData(data || null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cdt_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Sync wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cdt_wishlist', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  // Sync recently viewed to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cdt_recently_viewed', JSON.stringify(recentlyViewed));
    } catch {}
  }, [recentlyViewed]);

  // Sync user to localStorage
  useEffect(() => {
    try {
      if (user) localStorage.setItem('cdt_user', JSON.stringify(user));
      else localStorage.removeItem('cdt_user');
    } catch {}
  }, [user]);

  // Check auth session from server on mount
  useEffect(() => {
    async function verifyAuthSession() {
      try {
        const res = await api.getCurrentUser();
        if (res.authenticated && res.user) {
          setUser(res.user);
        }
      } catch {
        // No active server session, keep local if existing
      }
    }
    verifyAuthSession();
  }, []);

  // Refresh settings from server API
  const refreshSettings = async () => {
    try {
      const publicData = await api.getPublicConfig();
      if (publicData) {
        settingsService.updateConfig(publicData);
      }
    } catch (e) {
      console.warn('Could not refresh public store settings from API, using cached:', e);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const updateCategorySettings = async <K extends keyof MarketplaceConfig>(
    category: K,
    data: Partial<MarketplaceConfig[K]>
  ) => {
    settingsService.updateCategory(category, data);
    try {
      await api.saveCategorySettings(category, data);
      showToast(`Settings for ${String(category)} saved successfully`);
    } catch (e: any) {
      showToast(`Local settings updated (${e.message || 'Saved locally'})`);
    }
  };

  const setThemeColor = async (color: string) => {
    try {
      await updateCategorySettings('branding', { primary_color: color });
    } catch (e) {
      settingsService.updateCategory('branding', { primary_color: color });
    }
  };

  const primaryColor = config?.branding?.primary_color || '#920d35';

  const formatPrice = (amount: number): string => {
    return settingsService.formatPrice(amount);
  };

  // Cart actions
  const addToCart = (
    product: Product,
    variation?: ProductVariation,
    quantity = 1,
    attributes?: Record<string, string>
  ) => {
    const lineId = variation ? `${product.id}_${variation.id}` : `${product.id}`;
    const unitPrice = variation ? variation.price : product.price;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === lineId);
      if (existing) {
        return prev.map((item) =>
          item.id === lineId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: lineId,
          productId: product.id,
          product,
          variationId: variation?.id,
          variation,
          selectedAttributes: attributes,
          quantity,
          unitPrice,
        },
      ];
    });

    showToast(`Added "${product.name.slice(0, 32)}..." to cart!`);
    setIsCartOpen(true);
  };

  const buyNow = (
    product: Product,
    variation?: ProductVariation,
    quantity = 1,
    attributes?: Record<string, string>
  ) => {
    addToCart(product, variation, quantity, attributes);
    setIsCartOpen(false);
    setCurrentView('checkout');
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    showToast('Item removed from cart');
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

  // Coupon application
  const applyCoupon = async (code: string) => {
    try {
      const res = await api.validateCoupon(code, cartSubtotal);
      if (res.valid) {
        setAppliedCoupon({
          id: Date.now(),
          code: res.code,
          amount: res.amount,
          discount_type: res.discount_type,
          description: res.description,
        });
        setDiscountAmount(res.discount_total);
        showToast(`Coupon ${res.code} applied! Saved ${formatPrice(res.discount_total)}`);
        return { success: true, message: 'Coupon applied successfully!' };
      }
      return { success: false, message: 'Invalid coupon' };
    } catch (err: any) {
      showToast(err.message || 'Could not apply coupon');
      return { success: false, message: err.message };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    showToast('Coupon removed');
  };

  // Wishlist actions
  const toggleWishlist = (productId: number) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Removed from your Wishlist');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Saved to your Wishlist!');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: number) => wishlist.includes(productId);

  // Recently viewed
  const addToRecentlyViewed = (product: Product) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, 8);
    });
  };

  // Authentication API Integration
  const login = async (
    credentialsOrEmail: { email: string; password: string } | string,
    maybePassword?: string
  ) => {
    try {
      const credentials =
        typeof credentialsOrEmail === 'string'
          ? { email: credentialsOrEmail, password: maybePassword || '' }
          : credentialsOrEmail;

      const res = await api.login(credentials);
      if (res.success && res.user) {
        setUser(res.user);
        showToast(`Welcome back, ${res.user.first_name}!`);
        return { success: true, user: res.user, message: 'Signed in successfully.' };
      }
      return { success: false, message: 'Login failed.' };
    } catch (err: any) {
      showToast(err.message || 'Invalid credentials');
      throw err;
    }
  };

  const quickLogin = async (role: 'admin' | 'staff' | 'customer' | 'vendor' = 'admin') => {
    try {
      const res = await api.quickLogin(role as any);
      if (res.success && res.user) {
        setUser(res.user);
        showToast(`Signed in as ${res.user.first_name} (${res.user.role})`);
        return { success: true, message: 'Signed in successfully.' };
      }
      return { success: false, message: 'Quick login failed.' };
    } catch (err: any) {
      showToast(err.message || 'Quick login failed');
      throw err;
    }
  };

  const register = async (data: {
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
    password: string;
  }) => {
    try {
      const res = await api.register(data);
      if (res.success && res.user) {
        setUser(res.user);
        showToast(`Account created! Welcome, ${res.user.first_name}`);
        return { success: true, message: 'Registered successfully.' };
      }
      return { success: false, message: 'Registration failed.' };
    } catch (err: any) {
      showToast(err.message || 'Registration failed');
      throw err;
    }
  };

  const logoutUser = async () => {
    try {
      await api.logout();
    } catch {}
    setUser(null);
    showToast('You have logged out.');
  };

  const updateUserProfile = async (data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    addresses?: any[];
  }) => {
    const res = await api.updateProfile(data);
    if (res.success && res.user) {
      setUser(res.user);
      showToast('Profile updated successfully.');
    }
  };

  // Fallback demo login method
  const loginUser = (email: string, name = 'Customer', phone = '+256779743101') => {
    const role = email.includes('admin') ? 'admin' : 'customer';
    const newUser: CustomerUser = {
      id: Date.now(),
      first_name: name.split(' ')[0] || 'Customer',
      last_name: name.split(' ').slice(1).join(' ') || '',
      email,
      phone,
      role,
      addresses: [
        {
          id: 'addr_1',
          type: 'shipping',
          first_name: name.split(' ')[0] || 'Customer',
          last_name: name.split(' ').slice(1).join(' ') || '',
          phone,
          email,
          district: 'Kampala',
          city: 'Kampala',
          address_1: 'Kampala',
          is_default: true,
        },
      ],
      wishlist,
    };
    setUser(newUser);
    showToast(`Signed in as ${newUser.first_name} (${role})`);
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        categories,
        isOnline,
        syncWithWooCommerce,
        fetchProducts,
        cart,
        addToCart,
        buyNow,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        recentlyViewed,
        addToRecentlyViewed,
        appliedCoupon,
        discountAmount,
        applyCoupon,
        removeCoupon,
        deliveryZones,
        selectedZone,
        setSelectedZone,
        user,
        isAdmin,
        isVendor: Boolean(user?.role === 'vendor' || user?.role === 'vendor_staff'),
        vendorStoreId: user?.vendor_id || user?.store_id,
        isPosAllowed,
        stores,
        fetchStores,
        goToStorefront,
        loginUser,
        login,
        quickLogin,
        register,
        logoutUser,
        updateUserProfile,
        config,
        storeSettings,
        primaryColor,
        setThemeColor,
        updateCategorySettings,
        refreshSettings,
        formatPrice,
        toastMessage,
        showToast,
        isPageLoading,
        pageLoadingMessage,
        setPageLoading,
        currentView,
        setCurrentView,
        viewData,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};

