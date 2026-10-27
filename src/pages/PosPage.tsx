import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Store,
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  Printer,
  RotateCcw,
  X,
  ShieldAlert,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Tag,
  Percent,
  Clock,
  RefreshCw,
  FileText,
  Pause,
  Play,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Check,
  AlertTriangle,
  Lock,
  Camera,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product, ProductVariation, CustomerOrder } from '../types';
import { api } from '../services/api';
import { PosCameraScannerModal } from '../components/pos/PosCameraScannerModal';

interface PosCartItem {
  id: string;
  productId: number;
  product?: Product;
  variationId?: number;
  variation?: ProductVariation;
  name: string;
  sku: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  itemDiscount: number; // in UGX per item
  isCustom?: boolean;
}

interface HeldOrder {
  id: string;
  timestamp: string;
  customerName: string;
  customerPhone: string;
  items: PosCartItem[];
  subtotal: number;
}

export const PosPage: React.FC = () => {
  const {
    user,
    isAdmin,
    isPosAllowed,
    config,
    login,
    quickLogin,
    setCurrentView,
    formatPrice,
    showToast,
  } = useShop();

  // Products catalog & categories from API or store
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Register State
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountInputValue, setDiscountInputValue] = useState<string>('');

  // Customer Details
  const [customerName, setCustomerName] = useState('Walk-in Retail Customer');
  const [customerPhone, setCustomerPhone] = useState('+256 779 743 101');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo' | 'airtel' | 'card'>('cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Completed Order & Receipt Modal State
  const [completedOrder, setCompletedOrder] = useState<CustomerOrder | null>(null);
  const [receiptDetails, setReceiptDetails] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Variation Picker Modal
  const [variationProduct, setVariationProduct] = useState<Product | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // Custom Item Modal
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  // Held Orders (Hold / Recall feature for busy store counters)
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    try {
      const saved = localStorage.getItem('cdt_pos_held_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);

  // Register Daily Stats Modal
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Barcode Scanner & Hardware State
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mobile POS View Navigation
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);

  // Audio beep feedback for scanning
  const playScanBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1200;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {
      // Audio context might be restricted
    }
  };

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync held orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cdt_pos_held_orders', JSON.stringify(heldOrders));
    } catch {}
  }, [heldOrders]);

  // Load products catalog from API
  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);
      try {
        const res = await api.getProducts({ limit: 500 });
        if (res && res.products) {
          setProducts(res.products);
        }
      } catch (err: any) {
        console.warn('Could not load products for POS:', err);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
    // Auto-focus barcode input for retail cashier workstation
    const timer = setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut listener: F1 = Barcode Focus, F2 = Camera Scanner, F4 = Hold Order, F9 = Complete Sale, Esc = Clear / Close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setShowCameraScanner((prev) => !prev);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          handleHoldOrder();
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0 && !isProcessingSale) {
          handleCompleteSale();
        }
      } else if (e.key === 'Escape') {
        if (showCameraScanner) setShowCameraScanner(false);
        if (showReceiptModal) setShowReceiptModal(false);
        if (variationProduct) setVariationProduct(null);
        if (showCustomItemModal) setShowCustomItemModal(false);
        if (showHeldOrdersModal) setShowHeldOrdersModal(false);
        if (showStatsModal) setShowStatsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isProcessingSale, showReceiptModal, variationProduct, showCustomItemModal, showCameraScanner, heldOrders]);

  // Extract unique categories from loaded products
  const categoriesList = useMemo(() => {
    const set = new Map<string, string>();
    set.set('all', 'All Products');
    products.forEach((p) => {
      p.categories?.forEach((c) => {
        if (c.slug && c.name) {
          set.set(c.slug, c.name);
        }
      });
    });
    return Array.from(set.entries()).map(([slug, name]) => ({ slug, name }));
  }, [products]);

  // Filter products by category & search query
  const filteredProducts = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    return safeProducts.filter((p) => {
      if (!p) return false;
      const matchesCategory =
        selectedCategory === 'all' ||
        (Array.isArray(p.categories) && p.categories.some((c) => c?.slug === selectedCategory));

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.id !== undefined && p.id.toString() === q)
      );
    });
  }, [products, selectedCategory, searchQuery]);

  // Unified Barcode & QR Code Processing Engine (Used by hardware laser & camera scanner)
  const handleProcessScannedCode = (code: string) => {
    const query = code.trim();
    if (!query) return { success: false, message: 'Empty barcode or SKU' };

    // 1. Exact match by explicit barcode, SKU, or product ID
    let match = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === query.toLowerCase()) ||
        p.id.toString() === query
    );

    // 2. Check product variations for matching SKU, barcode, or ID
    let matchedVariation: ProductVariation | undefined;
    if (!match) {
      for (const prod of products) {
        if (prod.variations && prod.variations.length > 0) {
          const v = prod.variations.find(
            (varItem) =>
              (varItem.barcode && varItem.barcode.toLowerCase() === query.toLowerCase()) ||
              (varItem.sku && varItem.sku.toLowerCase() === query.toLowerCase()) ||
              varItem.id.toString() === query
          );
          if (v) {
            match = prod;
            matchedVariation = v;
            break;
          }
        }
      }
    }

    // 3. Fallback to product name matching if query looks like a search term
    if (!match) {
      match = products.find((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    }

    if (match) {
      if (!matchedVariation && match.variations && match.variations.length > 0) {
        setVariationProduct(match);
        return {
          success: true,
          message: `Select variation for ${match.name}`,
          product: match,
        };
      } else {
        addToCart(match, matchedVariation);
        return {
          success: true,
          message: `Added ${match.name}`,
          product: match,
        };
      }
    } else {
      return {
        success: false,
        message: `No product found matching code "${query}"`,
      };
    }
  };

  // Handle Barcode Scanner Submission
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    const result = handleProcessScannedCode(query);
    if (result.success) {
      setBarcodeInput('');
    } else {
      showToast(result.message);
    }
  };

  // Add standard product to POS cart
  const addToCart = (product: Product, variation?: ProductVariation) => {
    const lineId = variation ? `${product.id}_${variation.id}` : `${product.id}`;
    const unitPrice = variation ? variation.price : product.price;
    const itemName = variation
      ? `${product.name} (${Object.values(variation.attributes || {}).join(', ')})`
      : product.name;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === lineId);
      if (existing) {
        return prev.map((item) =>
          item.id === lineId ? { ...item, quantity: item.quantity + 1 } : item
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
          name: itemName,
          sku: variation?.sku || product.sku || `SKU-${product.id}`,
          image: product.images?.[0]?.src,
          unitPrice,
          quantity: 1,
          itemDiscount: 0,
        },
      ];
    });

    playScanBeep();
  };

  // Update item quantity
  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[]
    );
  };

  // Set explicit quantity
  const setQuantity = (id: string, qty: number) => {
    const validQty = Math.max(1, Math.min(999, qty));
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: validQty } : item))
    );
  };

  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Add custom service / fee line item
  const handleAddCustomItem = () => {
    const priceNum = parseFloat(customItemPrice.replace(/[^0-9.]/g, ''));
    if (!customItemName.trim() || isNaN(priceNum) || priceNum <= 0) {
      showToast('Please enter a valid item name and price');
      return;
    }

    const newItem: PosCartItem = {
      id: `custom_${Date.now()}`,
      productId: 0,
      name: customItemName.trim(),
      sku: 'CUSTOM-SERVICE',
      unitPrice: priceNum,
      quantity: 1,
      itemDiscount: 0,
      isCustom: true,
    };

    setCart((prev) => [...prev, newItem]);
    setCustomItemName('');
    setCustomItemPrice('');
    setShowCustomItemModal(false);
    playScanBeep();
    showToast(`Added custom item: ${newItem.name}`);
  };

  // Hold current order to serve another customer in line
  const handleHoldOrder = () => {
    if (cart.length === 0) {
      showToast('Cart is empty. Nothing to hold.');
      return;
    }

    const newHeldOrder: HeldOrder = {
      id: `held_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      items: [...cart],
      subtotal: rawSubtotal,
    };

    setHeldOrders((prev) => [newHeldOrder, ...prev]);
    setCart([]);
    setOrderDiscount(0);
    setDiscountInputValue('');
    showToast(`Order held for ${newHeldOrder.customerName}`);
  };

  // Recall a held order
  const handleRecallOrder = (held: HeldOrder) => {
    if (cart.length > 0) {
      if (!confirm('Recalling this order will replace your current cart. Continue?')) {
        return;
      }
    }
    setCart(held.items);
    setCustomerName(held.customerName);
    setCustomerPhone(held.customerPhone);
    setHeldOrders((prev) => prev.filter((o) => o.id !== held.id));
    setShowHeldOrdersModal(false);
    showToast(`Order for ${held.customerName} resumed!`);
  };

  // Load POS statistics
  const loadRegisterStats = async () => {
    setLoadingStats(true);
    try {
      const stats = await api.getPosStats();
      setStatsData(stats);
      setShowStatsModal(true);
    } catch (err: any) {
      showToast('Could not load register statistics: ' + err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Financial Calculations
  const rawSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, Number(discountInputValue) || 0));
      return Math.round((rawSubtotal * pct) / 100);
    }
    return Math.min(rawSubtotal, Math.max(0, Number(discountInputValue) || 0));
  }, [rawSubtotal, discountType, discountInputValue]);

  const taxRate = Number(config?.pos?.tax_rate_percent || 18);
  const finalTotal = Math.max(0, rawSubtotal - calculatedDiscount);
  const totalCartQty = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);
  // Inclusive tax amount (standard Uganda URA VAT formula: Total * 18 / 118)
  const taxAmount = taxRate > 0 ? Math.round((finalTotal * taxRate) / (100 + taxRate)) : 0;

  // Tender & Change calculation
  const tenderedNumeric = parseFloat(amountTendered.replace(/[^0-9.]/g, '')) || 0;
  const changeDue = Math.max(0, tenderedNumeric - finalTotal);

  // Auto-fill tendered amount when switching to cash or when cart changes if empty
  const handleQuickCash = (amount: number) => {
    setAmountTendered(amount.toString());
  };

  // Process Transaction Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      showToast('Cannot complete sale with an empty cart.');
      return;
    }

    if (paymentMethod === 'cash' && tenderedNumeric > 0 && tenderedNumeric < finalTotal) {
      showToast(`Amount tendered (UGX ${tenderedNumeric.toLocaleString()}) is less than total.`);
      return;
    }

    setIsProcessingSale(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          product_id: item.productId,
          variation_id: item.variationId,
          quantity: item.quantity,
          is_custom: item.isCustom,
          custom_price: item.isCustom ? item.unitPrice : undefined,
          custom_name: item.isCustom ? item.name : undefined,
        })),
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || undefined,
        payment_method: paymentMethod,
        payment_reference: paymentReference || undefined,
        amount_tendered: paymentMethod === 'cash' ? (tenderedNumeric || finalTotal) : finalTotal,
        discount_amount: calculatedDiscount,
        notes: customerNotes || undefined,
      };

      const result = await api.createPosOrder(payload);

      if (result.success && result.order) {
        setCompletedOrder(result.order);
        setReceiptDetails(result.receipt || result.order.pos_receipt_details);
        setShowReceiptModal(true);

        // Reset register for next customer
        setCart([]);
        setOrderDiscount(0);
        setDiscountInputValue('');
        setAmountTendered('');
        setPaymentReference('');
        setCustomerNotes('');
        setCustomerName('Walk-in Retail Customer');
        setCustomerPhone('+256 779 743 101');
        showToast(result.message || 'POS sale completed successfully!');
      }
    } catch (err: any) {
      showToast('POS sale failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Trigger Thermal Printer
  const handlePrintReceipt = () => {
    window.print();
  };

  // ==========================================
  // ACCESS CONTROL / AUTHORIZATION GUARD
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Cyber Dynamic Tech POS Register</h2>
          <p className="text-sm text-slate-400 mb-6">
            Authentication is required to access the Point of Sale terminal. Please sign in as an Administrator or authorized Cashier.
          </p>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => quickLogin('admin')}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Log in as Super Admin</span>
            </button>
            <button
              onClick={() => setCurrentView('account')}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Enter Custom Cashier Credentials</span>
            </button>
          </div>

          <button
            onClick={() => setCurrentView('home')}
            className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Online Store</span>
          </button>
        </div>
      </div>
    );
  }

  // If user is logged in, but not authorized by admin
  if (!isPosAllowed) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-red-900/40 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 bg-red-950/80 border border-red-800 text-red-300 text-xs font-bold rounded-full uppercase tracking-wider mb-3 inline-block">
            Access Restricted (403)
          </span>
          <h2 className="text-2xl font-bold text-white mb-2">POS Cashier Authorization Required</h2>
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
            Your account (<strong className="text-white">{user.email}</strong>) is currently not authorized to operate this Point of Sale terminal.
          </p>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 text-left text-xs text-slate-300 mb-6 space-y-2">
            <p className="font-bold text-slate-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              How to obtain POS terminal access:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
              <li>Ask an Administrator to open <strong className="text-slate-300">Admin Settings &gt; 32. Point of Sale (POS)</strong>.</li>
              <li>Add your email address (<strong className="text-slate-300">{user.email}</strong>) to the <strong className="text-slate-300">Allowed Cashier Users</strong> list.</li>
              <li>Or grant your user account the <strong className="text-slate-300">Admin</strong> or <strong className="text-slate-300">Manager</strong> role.</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setCurrentView('home')}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setCurrentView('admin')}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Open Admin Settings</span>
              </button>
            )}
            <button
              onClick={() => quickLogin('admin')}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Switch to Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // FULL AUTHORIZED POS TERMINAL INTERFACE
  // ==========================================
  return (
    <div className="h-screen max-h-screen w-full overflow-hidden flex flex-col bg-slate-100 text-slate-900 font-sans select-none">
      {/* ================= TOP POS BAR (DESKTOP >= LG) ================= */}
      <header className="hidden lg:flex bg-[#0f172a] text-white px-4 py-2.5 items-center justify-between shadow-md border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#920d35] to-[#580c1f] text-amber-300 font-black rounded-lg flex items-center justify-center shadow-md border border-amber-400/30">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                {config?.pos?.store_name || 'CYBER DYNAMIC TECHNOLOGIES POS'}
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                ONLINE WORKSTATION
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {config?.pos?.store_address || 'Kampala, Uganda'}
            </p>
          </div>
        </div>

        {/* Center Clock */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-300 font-mono shadow-inner">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} •{' '}
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Right Cashier Info & Navigation Controls */}
        <div className="flex items-center gap-2">
          {/* Held Orders badge */}
          {heldOrders.length > 0 && (
            <button
              onClick={() => setShowHeldOrdersModal(true)}
              className="px-2.5 py-1.5 bg-[#580c1f]/80 hover:bg-[#580c1f] text-amber-300 border border-amber-500/50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>Held ({heldOrders.length})</span>
            </button>
          )}

          {/* Camera Scanner Shortcut */}
          <button
            onClick={() => setShowCameraScanner(true)}
            className="px-2.5 py-1.5 bg-[#920d35] hover:bg-[#770929] text-white border border-amber-400/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Scan product barcode with device camera (F2)"
          >
            <Camera className="w-3.5 h-3.5 text-amber-300" />
            <span>Camera Scan (F2)</span>
          </button>

          {/* Drawer / Daily Summary Stats */}
          <button
            onClick={loadRegisterStats}
            disabled={loadingStats}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="View today's register drawer summary"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Register Stats</span>
          </button>

          {/* Cashier Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-800/90 border border-slate-700 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-[#920d35] text-white flex items-center justify-center text-xs font-bold">
              {user.first_name?.[0] || 'C'}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white leading-tight">
                {user.first_name} {user.last_name || ''}
              </p>
              <p className="text-[10px] text-amber-400 capitalize">{user.role}</p>
            </div>
          </div>

          {/* Admin Settings Shortcut (if admin) */}
          {isAdmin && (
            <button
              onClick={() => setCurrentView('admin')}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Admin Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen Kiosk Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Toggle Fullscreen Kiosk Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit POS / Back to Store */}
          <button
            onClick={() => setCurrentView('home')}
            className="px-2.5 py-1.5 bg-[#580c1f]/80 hover:bg-[#580c1f] text-amber-200 border border-amber-400/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Exit POS register and return to online catalog"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* ================= TOP POS BAR (MOBILE < LG) ================= */}
      <header className="lg:hidden bg-[#0f172a] text-white px-3 py-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Register Name */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#920d35] to-[#580c1f] text-amber-300 flex items-center justify-center shrink-0 font-black shadow-xs border border-amber-400/30">
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-white truncate">
                  {config?.pos?.store_name || 'CDT POS'}
                </span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shrink-0"></span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {user.first_name} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Quick Header Actions on Mobile */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowCameraScanner(true)}
              className="h-8 px-2.5 bg-[#920d35] hover:bg-[#770929] active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all border border-amber-400/30"
              title="Camera Barcode Scanner"
            >
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>Scan</span>
            </button>

            {heldOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHeldOrdersModal(true)}
                className="h-8 px-2 bg-[#580c1f] text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                title={`Held orders (${heldOrders.length})`}
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{heldOrders.length}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowMobileMoreMenu(true)}
              className="h-8 w-8 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              title="More register options"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Segmented Switcher (Catalog vs Cart) */}
        <div className="grid grid-cols-2 gap-1.5 mt-2 p-1 bg-slate-950/90 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === 'catalog'
                ? 'bg-[#920d35] text-white shadow-xs border border-amber-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Catalog & Scan</span>
            <span className="text-[10px] opacity-80 font-normal">({filteredProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              mobileTab === 'cart'
                ? 'bg-[#920d35] text-white shadow-xs border border-amber-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Register Cart</span>
            {totalCartQty > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full">
                {totalCartQty}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ================= MAIN REGISTER WORKSPACE ================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* ================= LEFT / CENTER: CATALOG & BARCODE SCANNER ================= */}
        <div
          className={`${
            mobileTab === 'catalog' ? 'flex flex-col flex-1 h-full' : 'hidden'
          } lg:flex lg:flex-col lg:flex-1 bg-slate-100 overflow-hidden border-r border-slate-300 pb-20 lg:pb-0`}
        >
          {/* Top Barcode & Search Controls */}
          <div className="p-2.5 sm:p-3 bg-white border-b border-slate-200 shadow-xs space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Barcode Scanner Input & Camera Scanner Button */}
              <div className="flex-1 flex gap-1.5">
                <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Barcode className="h-4 w-4 text-[#920d35] animate-pulse" />
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan barcode or type SKU / Name & press Enter (F1)..."
                    className="w-full pl-9 pr-20 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#920d35] focus:border-[#920d35] focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-3 bg-[#920d35] hover:bg-[#770929] text-white text-[11px] font-bold rounded-md transition-colors cursor-pointer border border-amber-400/30"
                  >
                    Scan Add
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setShowCameraScanner(true)}
                  className="px-3 py-2 bg-gradient-to-r from-[#920d35] to-[#580c1f] hover:brightness-110 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0 hover:shadow-md active:scale-95 border border-amber-400/40"
                  title="Open Camera Barcode Scanner (F2)"
                >
                  <Camera className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span className="hidden sm:inline">Camera (F2)</span>
                </button>
              </div>

              {/* Text Search Filter */}
              <div className="sm:w-64 relative flex gap-1.5">
                <div className="flex-1 relative">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Quick filter products..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#920d35] focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Add Custom / Service Item Button on Mobile */}
                {config?.pos?.allow_custom_line_items !== false && (
                  <button
                    onClick={() => setShowCustomItemModal(true)}
                    className="sm:hidden px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shrink-0 transition-colors cursor-pointer active:scale-95"
                    title="Add custom line item"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                )}
              </div>

              {/* Add Custom / Service Item Button Desktop */}
              {config?.pos?.allow_custom_line_items !== false && (
                <button
                  onClick={() => setShowCustomItemModal(true)}
                  className="hidden sm:flex px-3 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg text-xs font-bold items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer active:scale-95 border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Custom Item</span>
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {categoriesList.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.slug
                      ? 'bg-[#920d35] text-white shadow-xs font-bold border border-amber-400/40'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 p-3 overflow-y-auto">
            {loadingProducts ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-[#920d35] mb-2" />
                <p className="text-xs font-semibold">Loading product catalog...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 bg-white rounded-xl border border-slate-200 p-8 text-center">
                <ShoppingBag className="w-10 h-10 text-slate-400 mb-2" />
                <p className="font-bold text-slate-700 text-sm">No matching products found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your search query or barcode filter
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {filteredProducts.map((p) => {
                  const hasVariations = p.variations && p.variations.length > 0;
                  const isOutOfStock = p.stock_status === 'outofstock';
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (hasVariations) {
                          setVariationProduct(p);
                        } else {
                          addToCart(p);
                        }
                      }}
                      className="group bg-white rounded-xl border border-slate-200 hover:border-[#920d35] hover:shadow-md p-2.5 flex flex-col text-left transition-all relative overflow-hidden cursor-pointer"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-full h-24 bg-slate-50 rounded-lg overflow-hidden mb-2 relative flex items-center justify-center">
                        {p.images?.[0]?.src ? (
                          <img
                            src={p.images[0].src}
                            alt={p.name}
                            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        ) : (
                          <ShoppingBag className="w-8 h-8 text-slate-300" />
                        )}

                        {/* Stock indicator badge */}
                        <span
                          className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isOutOfStock ? 'Out' : `${p.stock_quantity || 'In'} stock`}
                        </span>

                        {hasVariations && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-slate-900/90 text-amber-300 border border-amber-400/30 rounded text-[9px] font-mono font-bold">
                            Variants
                          </span>
                        )}
                      </div>

                      {/* Brand & SKU */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="truncate font-semibold uppercase">{p.brand || 'GENUINE'}</span>
                        <span className="font-mono text-slate-500">{p.sku || `#${p.id}`}</span>
                      </div>

                      {/* Product Name */}
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-1 min-h-[30px] group-hover:text-[#920d35]">
                        {p.name}
                      </h4>

                      {/* Price & Add Indicator */}
                      <div className="mt-auto pt-1 flex items-center justify-between border-t border-slate-100">
                        <span className="text-xs font-black text-[#920d35]">
                          {formatPrice(p.price)}
                        </span>
                        <span className="w-6 h-6 rounded-md bg-slate-100 group-hover:bg-[#920d35] group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile Floating Cart Summary Bar */}
          {cart.length > 0 && (
            <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 max-w-lg mx-auto bg-slate-950/95 backdrop-blur-md text-white p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-cyan-500/40 flex items-center justify-between animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-cyan-400" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                    {totalCartQty}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-300 truncate">
                    {totalCartQty} {totalCartQty === 1 ? 'item' : 'items'} in current sale
                  </p>
                  <p className="text-sm font-black text-white truncate">
                    {formatPrice(finalTotal)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileTab('cart')}
                className="h-10 px-4 bg-[#920d35] hover:bg-[#770929] active:scale-95 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all shrink-0 border border-amber-400/30"
              >
                <span>Review & Charge</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          )}
        </div>

        {/* ================= RIGHT: REGISTER CART & TENDER (DESKTOP WORKSTATION) ================= */}
        <div
          className={`${
            mobileTab === 'cart' ? 'flex flex-col flex-1 h-full' : 'hidden'
          } lg:flex lg:flex-col lg:w-[440px] xl:w-[480px] 2xl:w-[520px] bg-white shrink-0 shadow-2xl border-l border-slate-300 overflow-hidden`}
        >
          {/* Mobile Top Bar for Cart */}
          <div className="lg:hidden p-2.5 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setMobileTab('catalog')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Add More Items</span>
            </button>
            <div className="text-right">
              <span className="text-[10px] text-slate-400">Total Due</span>
              <p className="text-xs font-black text-amber-300">{formatPrice(finalTotal)}</p>
            </div>
          </div>

          {/* Customer Selector Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#580c1f]/10 text-[#920d35] flex items-center justify-center shrink-0 border border-[#920d35]/20 font-bold">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{customerName}</p>
                <p className="text-[11px] text-slate-500 truncate">{customerPhone || 'Counter Guest'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                className="px-2 py-1 text-[11px] bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md font-semibold transition-colors cursor-pointer"
              >
                {isEditingCustomer ? 'Done' : 'Edit Info'}
              </button>
              <button
                onClick={handleHoldOrder}
                disabled={cart.length === 0}
                className="px-2 py-1 text-[11px] bg-[#580c1f]/10 hover:bg-[#580c1f]/20 disabled:opacity-40 border border-[#580c1f]/30 text-[#920d35] rounded-md font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Hold current order to serve another customer (F4)"
              >
                <Pause className="w-3 h-3 text-[#920d35]" />
                <span>Hold</span>
              </button>
            </div>
          </div>

          {/* Customer Inline Edit Panel */}
          {isEditingCustomer && (
            <div className="p-3 bg-slate-100/80 border-b border-slate-300 text-xs space-y-2 shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:border-[#920d35]"
                    placeholder="Walk-in Customer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Phone (MTN/Airtel)</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:border-[#920d35]"
                    placeholder="+256 7xx xxx xxx"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Email (Optional Receipt)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:border-[#920d35]"
                  placeholder="customer@domain.com"
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-100 min-h-0">
            {cart.length === 0 ? (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-slate-400 text-center p-6">
                <Barcode className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">Register Cart Empty</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Scan a barcode or click any product from the catalog to ring up an item
                </p>
                <button
                  type="button"
                  onClick={() => setShowCameraScanner(true)}
                  className="mt-3 px-3 py-1.5 bg-[#920d35]/10 hover:bg-[#920d35]/20 text-[#920d35] border border-[#920d35]/30 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-[#920d35]" />
                  <span>Scan with Camera (F2)</span>
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-2.5 first:pt-0 flex items-start justify-between gap-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 leading-tight truncate">{item.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{item.sku}</p>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      {formatPrice(item.unitPrice)} × {item.quantity} ={' '}
                      <strong className="font-black text-[#920d35]">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </strong>
                    </p>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center font-bold transition-all cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-mono font-bold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center font-bold transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 sm:w-6 sm:h-6 ml-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ================= REGISTER SUMMARY & TENDER ================= */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 shadow-inner space-y-2.5 overflow-y-auto max-h-[55vh] lg:max-h-none shrink-0">
            {/* Discount / Coupon Input Bar */}
            {config?.pos?.allow_manual_discounts !== false && (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-white border border-slate-300 rounded-md overflow-hidden text-xs">
                  <span className="px-2 text-slate-400 font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="number"
                    value={discountInputValue}
                    onChange={(e) => setDiscountInputValue(e.target.value)}
                    placeholder={discountType === 'percent' ? 'Discount %' : 'Discount UGX'}
                    className="w-full py-1 text-xs focus:outline-hidden"
                  />
                  <div className="flex border-l border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`px-2 py-1 ${discountType === 'fixed' ? 'bg-[#920d35] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      UGX
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-2 py-1 ${discountType === 'percent' ? 'bg-[#920d35] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      %
                    </button>
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Clear all items from register?')) {
                        setCart([]);
                        setOrderDiscount(0);
                        setDiscountInputValue('');
                      }
                    }}
                    className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Financial Breakdown Table */}
            <div className="space-y-1 text-xs text-slate-600 pt-1">
              <div className="flex justify-between">
                <span>Subtotal ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                <span className="font-semibold text-slate-800">{formatPrice(rawSubtotal)}</span>
              </div>

              {calculatedDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatPrice(calculatedDiscount)}</span>
                </div>
              )}

              {taxRate > 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Included VAT ({taxRate}% URA)</span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-300">
                <span className="text-sm font-bold text-slate-900">Total Due</span>
                <span className="text-2xl font-black text-[#920d35] font-mono tracking-tight">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('momo')}
                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'momo'
                    ? 'bg-[#f59e0b] text-slate-950 font-black shadow-sm border border-amber-600/30'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>MTN MoMo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('airtel')}
                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'airtel'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Airtel</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'bg-[#0f172a] text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Card</span>
              </button>
            </div>

            {/* Cash Tendered & Quick Change Buttons */}
            {paymentMethod === 'cash' && (
              <div className="space-y-1.5 p-2 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700">Cash Received (UGX):</span>
                  <input
                    type="number"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder={finalTotal.toString()}
                    className="w-36 px-2.5 py-1 text-right font-mono font-bold bg-slate-50 border border-slate-300 rounded focus:bg-white text-xs focus:border-[#920d35]"
                  />
                </div>

                {/* Quick denomination buttons */}
                {config?.pos?.enable_quick_cash_buttons !== false && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleQuickCash(finalTotal)}
                      className="px-2 py-1 bg-slate-100 hover:bg-[#920d35] hover:text-white text-slate-800 rounded whitespace-nowrap cursor-pointer transition-colors"
                    >
                      Exact
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(50000)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded whitespace-nowrap cursor-pointer"
                    >
                      50k
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(100000)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded whitespace-nowrap cursor-pointer"
                    >
                      100k
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(200000)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded whitespace-nowrap cursor-pointer"
                    >
                      200k
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(500000)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded whitespace-nowrap cursor-pointer"
                    >
                      500k
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(1000000)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded whitespace-nowrap cursor-pointer"
                    >
                      1M
                    </button>
                  </div>
                )}

                {/* Change Due Display */}
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-xs">
                  <span className="font-bold text-slate-600">Change Due:</span>
                  <span className="font-black text-sm text-emerald-600 font-mono">
                    {formatPrice(changeDue)}
                  </span>
                </div>
              </div>
            )}

            {/* Reference input for MoMo, Airtel, or Card */}
            {paymentMethod !== 'cash' && (
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-xs">
                <label className="text-[10px] font-bold text-slate-700 block mb-1">
                  {paymentMethod === 'momo'
                    ? 'MTN MoMo Transaction ID / Reference:'
                    : paymentMethod === 'airtel'
                    ? 'Airtel Money Transaction Reference:'
                    : 'Card Approval / POS Ref:'}
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. TXN-948274 or Approval Code"
                  className="w-full px-2.5 py-1.5 font-mono text-xs bg-slate-50 border border-slate-300 rounded"
                />
              </div>
            )}

            {/* Complete Sale Action Button */}
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || isProcessingSale}
              className="w-full min-h-[50px] py-3.5 bg-gradient-to-r from-[#920d35] via-[#770929] to-[#580c1f] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 text-white font-black text-sm sm:text-base rounded-xl shadow-lg shadow-red-950/25 border border-amber-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessingSale ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Processing Transaction...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-amber-300" />
                  <span>CHARGE {formatPrice(finalTotal)}</span>
                  <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[11px] font-black rounded ml-1 shadow-xs">
                    F9
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================= DESKTOP WORKSTATION SHORTCUTS FOOTER ================= */}
      <footer className="hidden lg:flex items-center justify-between px-4 py-1.5 bg-[#0f172a] text-slate-300 text-xs font-mono border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700 font-bold">F1</kbd>
            <span>Barcode Focus</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700 font-bold">F2</kbd>
            <span>Camera Scanner</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700 font-bold">F4</kbd>
            <span>Hold Order</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-[#920d35] text-white rounded border border-amber-400/40 font-bold">F9</kbd>
            <span>Charge &amp; Complete</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-bold">Esc</kbd>
            <span>Close Modals</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>CYBER DYNAMIC TECHNOLOGIES WORKSTATION</span>
        </div>
      </footer>

      {/* ================= THERMAL RECEIPT PREVIEW MODAL ================= */}
      {showReceiptModal && receiptDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold">Transaction Complete • 80mm Thermal Receipt</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Thermal Receipt Canvas (80mm width standard) */}
            <div id="pos-thermal-receipt" className="p-6 bg-white font-mono text-xs text-slate-900 space-y-4">
              {/* Store Brand Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <h3 className="font-black text-sm uppercase tracking-tight text-black">
                  {receiptDetails.store_name || 'CYBER DYNAMIC TECHNOLOGIES'}
                </h3>
                <p className="text-[10px] text-slate-600 leading-tight">
                  {receiptDetails.store_address || 'Kampala, Uganda'}
                </p>
                <p className="text-[10px] text-slate-600">
                  Tel: {receiptDetails.store_phone || '+256 779 743 101'} • TIN: 1004829182
                </p>
                <p className="text-[9px] uppercase font-bold text-slate-500 pt-1">
                  OFFICIAL TAX INVOICE / CASH SALE
                </p>
              </div>

              {/* Order Metadata */}
              <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>INVOICE NO:</span>
                  <span className="font-bold">{completedOrder?.order_number || 'POS-1000'}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE / TIME:</span>
                  <span>{new Date().toLocaleString('en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span className="font-bold">{receiptDetails.cashier_name || user.first_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="truncate max-w-[180px]">{customerName}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-300 text-[11px]">
                <div className="flex justify-between font-bold border-b border-slate-200 pb-1 text-[10px]">
                  <span>ITEM / DESCRIPTION</span>
                  <span>QTY × RATE = TOTAL</span>
                </div>
                {completedOrder?.line_items?.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="font-bold leading-tight">{item.name}</p>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>{item.quantity} @ {formatPrice(item.price)}</span>
                      <span className="font-bold text-slate-900">{formatPrice(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{formatPrice(completedOrder?.subtotal || 0)}</span>
                </div>
                {Number(completedOrder?.discount_total) > 0 && (
                  <div className="flex justify-between">
                    <span>DISCOUNT:</span>
                    <span>-{formatPrice(completedOrder?.discount_total || 0)}</span>
                  </div>
                )}
                {Number(receiptDetails.tax_amount) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>INCL. VAT ({receiptDetails.tax_rate_percent}%):</span>
                    <span>{formatPrice(receiptDetails.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300 text-black">
                  <span>TOTAL PAID:</span>
                  <span>{formatPrice(completedOrder?.total || 0)}</span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-700 pt-1">
                  <span>PAYMENT METHOD:</span>
                  <span className="font-bold uppercase">{receiptDetails.payment_method}</span>
                </div>

                {receiptDetails.payment_method === 'cash' && (
                  <>
                    <div className="flex justify-between text-[10px] text-slate-700">
                      <span>CASH TENDERED:</span>
                      <span>{formatPrice(receiptDetails.amount_tendered)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-emerald-700">
                      <span>CHANGE DUE:</span>
                      <span>{formatPrice(receiptDetails.change_due)}</span>
                    </div>
                  </>
                )}

                {receiptDetails.payment_reference && (
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <span>REF / APPROVAL:</span>
                    <span className="font-mono">{receiptDetails.payment_reference}</span>
                  </div>
                )}
              </div>

              {/* Warranty Notice & Footer */}
              <div className="text-center text-[10px] text-slate-600 space-y-1 pt-1">
                <p className="font-bold">*** OFFICIAL WARRANTY COVERAGE ***</p>
                <p className="leading-tight">
                  1-Year Manufacturer & Distributor Warranty on all Laptops, Desktops, Printers & UPS systems.
                </p>
                <p className="text-[9px] pt-1">
                  Goods once sold are covered by standard replacement warranty. Retain this slip for support.
                </p>
                <div className="pt-2">
                  <span className="font-mono text-[9px] tracking-widest text-slate-400">
                    * * * THANK YOU FOR YOUR BUSINESS * * *
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Receipt (Ctrl+P)</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 bg-[#920d35] hover:bg-[#770929] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-amber-400/40"
              >
                New Sale (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VARIATION SELECTOR MODAL ================= */}
      {variationProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#920d35] uppercase tracking-wider">Select Specification</span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{variationProduct.name}</h3>
              </div>
              <button onClick={() => setVariationProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto divide-y divide-slate-100">
              {variationProduct.variations?.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => {
                    addToCart(variationProduct, variant);
                    setVariationProduct(null);
                  }}
                  className="w-full py-2.5 px-3 rounded-lg hover:bg-red-50 border border-slate-200 hover:border-[#920d35] flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#920d35]">
                      {Object.values(variant.attributes || {}).join(' / ') || `Variation #${variant.id}`}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">{variant.sku || `SKU-${variant.id}`}</p>
                  </div>
                  <span className="text-xs font-black text-[#920d35] font-mono">{formatPrice(variant.price)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= CUSTOM LINE ITEM MODAL ================= */}
      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add Custom Service or Product</h3>
              <button onClick={() => setShowCustomItemModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Item / Service Name</label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="e.g. Windows OS Setup & Drivers, Laptop RAM Upgrade Service"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Price (UGX)</label>
                <input
                  type="number"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCustomItemModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomItem}
                className="flex-1 py-2.5 bg-[#920d35] hover:bg-[#770929] text-white rounded-xl text-xs font-bold cursor-pointer border border-amber-400/30"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= HELD ORDERS MODAL ================= */}
      {showHeldOrdersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pause className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Held Orders Queue ({heldOrders.length})</h3>
              </div>
              <button onClick={() => setShowHeldOrdersModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {heldOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No orders currently on hold.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                {heldOrders.map((held) => (
                  <div key={held.id} className="py-2.5 first:pt-0 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{held.customerName}</p>
                      <p className="text-[11px] text-slate-500">
                        {held.items.length} items • Held at {held.timestamp}
                      </p>
                      <p className="font-mono font-bold text-[#920d35] mt-0.5">{formatPrice(held.subtotal)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRecallOrder(held)}
                        className="px-3 py-1.5 bg-[#920d35] hover:bg-[#770929] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer border border-amber-400/30"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                      <button
                        onClick={() => setHeldOrders((prev) => prev.filter((o) => o.id !== held.id))}
                        className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Discard held order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= REGISTER STATS / DRAWER MODAL ================= */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-900">Today's Register Drawer Summary</h3>
              </div>
              <button onClick={() => setShowStatsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {statsData && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-cyan-700">Total Sales Today</p>
                    <p className="text-xl font-black text-cyan-950">{formatPrice(statsData.today_revenue || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-cyan-700">Transactions</p>
                    <p className="text-lg font-black text-cyan-950">{statsData.today_orders_count || 0}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-2">
                  <p className="font-bold text-slate-700">Tender Breakdown:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-semibold">Cash Drawer</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatPrice(statsData.breakdown?.cash || 0)}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-semibold">MTN MoMo</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatPrice(statsData.breakdown?.momo || 0)}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-semibold">Airtel Money</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatPrice(statsData.breakdown?.airtel || 0)}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-semibold">Credit/Debit Card</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatPrice(statsData.breakdown?.card || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowStatsModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Close Drawer Summary
            </button>
          </div>
        </div>
      )}

      {/* ================= MOBILE MORE REGISTER OPTIONS MODAL ================= */}
      {showMobileMoreMenu && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {user.first_name?.[0] || 'C'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {user.first_name} {user.last_name || ''}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {user.email} • <span className="text-cyan-700 capitalize font-bold">{user.role}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileMoreMenu(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Options */}
            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  setShowMobileMoreMenu(false);
                  loadRegisterStats();
                }}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold flex items-center justify-between transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-cyan-600" />
                  <span>Today's Register Drawer Summary</span>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-slate-400" />
              </button>

              {heldOrders.length > 0 && (
                <button
                  onClick={() => {
                    setShowMobileMoreMenu(false);
                    setShowHeldOrdersModal(true);
                  }}
                  className="w-full p-3 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 font-bold flex items-center justify-between transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Pause className="w-4 h-4 text-amber-600" />
                    <span>Held Orders Queue ({heldOrders.length})</span>
                  </div>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-amber-500" />
                </button>
              )}

              <button
                onClick={() => {
                  setShowMobileMoreMenu(false);
                  toggleFullscreen();
                }}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold flex items-center justify-between transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 text-slate-600" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-slate-600" />
                  )}
                  <span>{isFullscreen ? 'Exit Fullscreen Kiosk' : 'Enter Fullscreen Kiosk Mode'}</span>
                </div>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    setShowMobileMoreMenu(false);
                    setCurrentView('admin');
                  }}
                  className="w-full p-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 active:bg-cyan-200 text-cyan-900 font-bold flex items-center justify-between transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-cyan-600" />
                    <span>Store Admin Dashboard</span>
                  </div>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-cyan-500" />
                </button>
              )}

              <button
                onClick={() => {
                  setShowMobileMoreMenu(false);
                  setCurrentView('home');
                }}
                className="w-full p-3 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 font-bold flex items-center justify-between transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowLeft className="w-4 h-4 text-red-600" />
                  <span>Exit POS & Return to Online Store</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowMobileMoreMenu(false)}
              className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Camera Barcode & QR Code Scanner Modal */}
      <PosCameraScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScanSuccess={handleProcessScannedCode}
        products={products}
      />
    </div>
  );
};
