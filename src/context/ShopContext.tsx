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
import { INITIAL_DELIVERY_ZONES, INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/cyberCatalog';
import { api } from '../services/api';
import { settingsService } from '../services/settingsService';
import {
  auth,
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  signOutFirebase,
  syncUserProfile,
  onAuthStateChanged,
  saveGlobalSettingsToFirestore,
  loadGlobalSettingsFromFirestore,
  subscribeToGlobalSettings,
  subscribeToProducts,
  seedInitialFirestoreCatalogIfEmpty,
  saveUserCartToFirestore,
  getUserCartFromFirestore,
  saveUserWishlistToFirestore,
  getUserWishlistFromFirestore,
} from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';

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
  firebaseUser: FirebaseUser | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  vendorStoreId?: string;
  isPosAllowed: boolean;
  stores: Store[];
  fetchStores: () => Promise<void>;
  goToStorefront: (slug: string) => void;
  loginUser: (email: string, name?: string, phone?: string) => void;
  login: (credentialsOrEmail: { email: string; password: string } | string, maybePassword?: string) => Promise<{ success: boolean; user?: CustomerUser; message: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; user?: CustomerUser; message: string }>;
  isFirebaseReady: boolean;
  quickLogin: (role?: 'admin' | 'staff' | 'customer' | 'vendor') => Promise<{ success: boolean; message: string }>;
  register: (data: { first_name: string; last_name?: string; email: string; phone?: string; password: string }) => Promise<{ success: boolean; message: string }>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (data: { first_name?: string; last_name?: string; phone?: string; addresses?: any[] }) => Promise<void>;

  config: MarketplaceConfig;
  storeSettings: StoreSettings;
  primaryColor: string;
  setThemeColor: (color: string) => Promise<void>;
  updateCategorySettings: <K extends keyof MarketplaceConfig>(category: K, data: Partial<MarketplaceConfig[K]>) => Promise<void>;
  saveAllSettings: (fullConfig: Partial<MarketplaceConfig>) => Promise<void>;
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
  // Global synchronized product catalog & categories (exclusively fetched from live WooCommerce API)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(() => INITIAL_CATEGORIES);
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
      if (Array.isArray(cats) && cats.length > 0) {
        const existingSlugs = new Set(cats.map((c: Category) => c.slug || c.id));
        const combined = [
          ...cats,
          ...INITIAL_CATEGORIES.filter((c) => !existingSlugs.has(c.slug || c.id)),
        ];
        setCategories(combined);
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
    let unsubProducts: (() => void) | null = null;

    const initApp = async () => {
      try {
        // 1. Load products and categories from local cache & API
        await Promise.allSettled([
          fetchProducts(),
          fetchCategories(),
          api.getProducts({ page: 1, limit: 18 }),
        ]);

        // 3. Real-time subscription to database products
        try {
          unsubProducts = subscribeToProducts((firestoreProducts) => {
            if (isMounted && Array.isArray(firestoreProducts) && firestoreProducts.length > 0) {
              setProducts(firestoreProducts);
            }
          });
        } catch (subErr) {
          console.warn('Real-time products subscription notice:', subErr);
        }
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
      if (unsubProducts) unsubProducts();
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

  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Sync Firebase Auth with application user session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setIsFirebaseReady(true);
      if (fbUser) {
        try {
          const profile: any = await syncUserProfile(fbUser);
          const isOpwataAdmin = fbUser.email?.trim().toLowerCase() === 'opwataallan@gmail.com';
          const role = isOpwataAdmin
            ? 'SUPER_ADMIN'
            : (profile?.role || 'CUSTOMER');
          const customerUser: CustomerUser = {
            id: typeof profile?.id === 'number' ? profile.id : Date.now(),
            uid: fbUser.uid,
            displayName: profile?.displayName || fbUser.displayName || 'Customer',
            photoURL: profile?.photoURL || fbUser.photoURL || '',
            first_name: profile?.first_name || fbUser.displayName?.split(' ')[0] || 'Customer',
            last_name: profile?.last_name || fbUser.displayName?.split(' ').slice(1).join(' ') || '',
            email: fbUser.email || profile?.email || '',
            phone: profile?.phone || '',
            role: role as any,
            status: profile?.status || 'ACTIVE',
            isSuperAdmin: isOpwataAdmin || profile?.isSuperAdmin || role === 'SUPER_ADMIN',
            admin: isOpwataAdmin || profile?.admin || role === 'SUPER_ADMIN' || role === 'ADMIN',
            permissions: profile?.permissions || (isOpwataAdmin ? ['*'] : []),
            vendorId: profile?.vendorId || null,
            assignedStoreIds: profile?.assignedStoreIds || [],
            addresses: profile?.addresses || [],
            wishlist: profile?.wishlist || [],
            vendor_id: profile?.vendorId || profile?.vendor_id,
            store_id: profile?.store_id,
          };
          setUser(customerUser);
          localStorage.setItem('cdt_user', JSON.stringify(customerUser));

          // If administrator is signed in, ensure Firestore catalog is initialized if empty
          if (customerUser.admin || customerUser.isSuperAdmin || isOpwataAdmin) {
            seedInitialFirestoreCatalogIfEmpty().catch(() => {});
          }
        } catch (err) {
          console.error('Error syncing Firebase user profile:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const isSuperAdmin = Boolean(
    user && (
      user.role === 'SUPER_ADMIN' ||
      user.isSuperAdmin === true ||
      (user.email && user.email.trim().toLowerCase() === 'opwataallan@gmail.com')
    )
  );

  const isAdmin = Boolean(
    isSuperAdmin ||
    (user && (
      user.role === 'ADMIN' ||
      user.role === 'admin' ||
      user.role === 'manager' ||
      user.role === 'STORE_MANAGER'
    ))
  );

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

  // Sync cart to localStorage and Firestore
  useEffect(() => {
    try {
      localStorage.setItem('cdt_cart', JSON.stringify(cart));
    } catch {}

    const uid = firebaseUser?.uid || (user?.uid ? String(user.uid) : (user?.id ? `user_${user.id}` : null));
    if (uid) {
      saveUserCartToFirestore(uid, cart).catch(() => {});
    }
  }, [cart, user, firebaseUser]);

  // Sync wishlist to localStorage and Firestore
  useEffect(() => {
    try {
      localStorage.setItem('cdt_wishlist', JSON.stringify(wishlist));
    } catch {}

    const uid = firebaseUser?.uid || (user?.uid ? String(user.uid) : (user?.id ? `user_${user.id}` : null));
    if (uid) {
      saveUserWishlistToFirestore(uid, wishlist).catch(() => {});
    }
  }, [wishlist, user, firebaseUser]);

  // Restore cart and wishlist from Firestore when user authenticates
  useEffect(() => {
    const uid = firebaseUser?.uid || (user?.uid ? String(user.uid) : (user?.id ? `user_${user.id}` : null));
    if (!uid) return;

    let isMounted = true;
    getUserCartFromFirestore(uid).then((remoteCart) => {
      if (isMounted && Array.isArray(remoteCart) && remoteCart.length > 0) {
        setCart((currentLocal) => {
          if (currentLocal.length === 0) return remoteCart;
          const localIds = new Set(currentLocal.map((i) => i.id));
          const additions = remoteCart.filter((i) => !localIds.has(i.id));
          return [...currentLocal, ...additions];
        });
      }
    }).catch(() => {});

    getUserWishlistFromFirestore(uid).then((remoteWishlist) => {
      if (isMounted && Array.isArray(remoteWishlist) && remoteWishlist.length > 0) {
        setWishlist((currentLocal) => {
          const merged = Array.from(new Set([...currentLocal, ...remoteWishlist]));
          return merged;
        });
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.uid, firebaseUser?.uid]);

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

  // Real-time synchronization of settings/global from Cloud Firestore
  useEffect(() => {
    let isSubscribed = true;

    // 1. Initial read from Firestore settings/global
    loadGlobalSettingsFromFirestore()
      .then((firestoreSettings) => {
        if (isSubscribed && firestoreSettings) {
          settingsService.updateConfig(firestoreSettings);
        }
      })
      .catch((err) => {
        console.warn('Initial Firestore settings load notice:', err);
      });

    // 2. Real-time onSnapshot synchronization
    const unsubscribe = subscribeToGlobalSettings(
      (updatedConfig) => {
        if (isSubscribed) {
          settingsService.updateConfig(updatedConfig);
        }
      },
      (err) => {
        console.warn('Settings real-time listener notice:', err);
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  // Refresh settings from server API (fallback/initial sync)
  const refreshSettings = async () => {
    try {
      const firestoreSettings = await loadGlobalSettingsFromFirestore();
      if (firestoreSettings) {
        settingsService.updateConfig(firestoreSettings);
        return;
      }
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
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid settings data provided');
    }

    // 1. Write to Cloud Firestore settings/global and settings/{category} with merge: true
    try {
      await saveGlobalSettingsToFirestore({ category, data });
    } catch (firestoreErr: any) {
      console.error('Failed to write to Cloud Firestore settings:', firestoreErr);
      showToast('Unable to save changes. Please check your connection or permissions.');
      throw firestoreErr;
    }

    // 2. Apply locally & DOM
    settingsService.updateCategory(category, data);

    // 3. Mirror to server cache for backward compatibility
    try {
      await api.saveCategorySettings(category, data);
    } catch (e) {
      console.warn('Backend server cache update notice:', e);
    }

    showToast(`Settings for "${String(category)}" saved successfully to Cloud Firestore!`);
  };

  const saveAllSettings = async (fullConfig: Partial<MarketplaceConfig>) => {
    try {
      await saveGlobalSettingsToFirestore(fullConfig);
    } catch (firestoreErr: any) {
      console.error('Failed to write all settings to Cloud Firestore:', firestoreErr);
      showToast('Unable to save changes. Please check your connection or permissions.');
      throw firestoreErr;
    }

    settingsService.updateConfig(fullConfig);

    try {
      await api.saveFullSettings(fullConfig);
    } catch (e) {
      console.warn('Backend server cache update notice:', e);
    }

    showToast('All settings categories successfully saved to Cloud Firestore!');
  };

  const setThemeColor = async (color: string) => {
    try {
      await updateCategorySettings('branding', { primary_color: color });
    } catch (e: any) {
      settingsService.updateCategory('branding', { primary_color: color });
      showToast(e.message || 'Theme color updated locally');
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
        // Also ensure Firebase Auth session is active
        if (typeof credentials === 'object' && credentials.email && credentials.password) {
          try {
            let fbUser: FirebaseUser | null = null;
            try {
              fbUser = await signInWithEmail(credentials.email, credentials.password);
            } catch (authErr: any) {
              if (authErr?.code === 'auth/user-not-found' || authErr?.code === 'auth/invalid-credential') {
                try {
                  fbUser = await registerWithEmail(credentials.email, credentials.password);
                } catch {}
              }
            }
            if (fbUser) {
              res.user.uid = fbUser.uid;
              setFirebaseUser(fbUser);
              await syncUserProfile(fbUser, {
                first_name: res.user.first_name,
                last_name: res.user.last_name,
                phone: res.user.phone,
              });
            }
          } catch (fbErr) {
            console.warn('Firebase email auth sync notice:', fbErr);
          }
        }
        setUser(res.user);
        localStorage.setItem('cdt_user', JSON.stringify(res.user));
        if (res.token) localStorage.setItem('cdt_token', res.token);
        showToast(`Welcome back, ${res.user.first_name || 'Customer'}!`);
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
        localStorage.setItem('cdt_user', JSON.stringify(res.user));
        if (res.token) localStorage.setItem('cdt_token', res.token);
        showToast(`Signed in as ${res.user.first_name || 'User'} (${res.user.role})`);
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
        if (data.email && data.password) {
          try {
            let fbUser: FirebaseUser | null = null;
            try {
              fbUser = await registerWithEmail(data.email, data.password);
            } catch (regErr: any) {
              if (regErr?.code === 'auth/email-already-in-use') {
                try {
                  fbUser = await signInWithEmail(data.email, data.password);
                } catch {}
              }
            }
            if (fbUser) {
              res.user.uid = fbUser.uid;
              setFirebaseUser(fbUser);
              await syncUserProfile(fbUser, {
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone,
              });
            }
          } catch (e) {
            console.warn('Firebase register notice:', e);
          }
        }
        setUser(res.user);
        localStorage.setItem('cdt_user', JSON.stringify(res.user));
        if (res.token) localStorage.setItem('cdt_token', res.token);
        showToast(`Account created! Welcome, ${res.user.first_name || 'Customer'}`);
        return { success: true, message: 'Registered successfully.' };
      }
      return { success: false, message: 'Registration failed.' };
    } catch (err: any) {
      showToast(err.message || 'Registration failed');
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser) {
        const profile: any = await syncUserProfile(fbUser);
        const isOpwataAdmin = fbUser.email?.trim().toLowerCase() === 'opwataallan@gmail.com';
        const role = isOpwataAdmin ? 'SUPER_ADMIN' : (profile?.role || 'CUSTOMER');
        const customerUser: CustomerUser = {
          id: typeof profile?.id === 'number' ? profile.id : Date.now(),
          uid: fbUser.uid,
          displayName: profile?.displayName || fbUser.displayName || 'Customer',
          photoURL: profile?.photoURL || fbUser.photoURL || '',
          first_name: profile?.first_name || fbUser.displayName?.split(' ')[0] || 'Customer',
          last_name: profile?.last_name || fbUser.displayName?.split(' ').slice(1).join(' ') || '',
          email: fbUser.email || '',
          phone: profile?.phone || '',
          role: role as any,
          status: profile?.status || 'ACTIVE',
          isSuperAdmin: isOpwataAdmin || profile?.isSuperAdmin || role === 'SUPER_ADMIN',
          admin: isOpwataAdmin || profile?.admin || role === 'SUPER_ADMIN' || role === 'ADMIN',
          permissions: profile?.permissions || (isOpwataAdmin ? ['*'] : []),
          vendorId: profile?.vendorId || null,
          assignedStoreIds: profile?.assignedStoreIds || [],
          addresses: profile?.addresses || [],
          wishlist: profile?.wishlist || [],
          vendor_id: profile?.vendorId || profile?.vendor_id,
          store_id: profile?.store_id,
        };
        setFirebaseUser(fbUser);
        setUser(customerUser);
        localStorage.setItem('cdt_user', JSON.stringify(customerUser));
        showToast(`Welcome, ${customerUser.first_name}! Signed in with Google.`);
        return { success: true, user: customerUser, message: 'Signed in with Google.' };
      }
      return { success: false, message: 'Google sign-in was cancelled.' };
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const isPermission = err?.message?.includes('permission') || err?.code === 'permission-denied';
      showToast(isPermission ? "We couldn't complete that action. Please try again." : (err.message || 'Google sign-in failed'));
      throw err;
    }
  };

  const logoutUser = async () => {
    try {
      await signOutFirebase();
    } catch {}
    try {
      await api.logout();
    } catch {}
    setFirebaseUser(null);
    setUser(null);
    localStorage.removeItem('cdt_user');
    localStorage.removeItem('cdt_token');
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
        firebaseUser,
        isSuperAdmin,
        isAdmin,
        isVendor: Boolean(user?.role === 'vendor' || user?.role === 'vendor_staff'),
        vendorStoreId: user?.vendor_id || user?.store_id,
        isPosAllowed,
        stores,
        fetchStores,
        goToStorefront,
        loginUser,
        login,
        loginWithGoogle,
        isFirebaseReady,
        quickLogin,
        register,
        logoutUser,
        updateUserProfile,
        config,
        storeSettings,
        primaryColor,
        setThemeColor,
        updateCategorySettings,
        saveAllSettings,
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

