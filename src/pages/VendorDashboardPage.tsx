import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import {
  Store,
  Product,
  VendorOrder,
  WalletTransaction,
  PayoutRequest,
  StoreReview,
  VendorStaff,
  OrderStatus,
} from '../types';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  Store as StoreIcon,
  Users,
  MessageSquare,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Edit2,
  Trash2,
  Download,
  DollarSign,
  Truck,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  X,
  Lock,
  Tag,
} from 'lucide-react';

export const VendorDashboardPage: React.FC = () => {
  const { user, isVendor, isAdmin, setCurrentView, showToast, formatPrice } = useShop();

  const isAuthorized = Boolean(
    isVendor ||
    isAdmin ||
    (user && (
      user.role === 'vendor' ||
      user.role === 'vendor_staff' ||
      user.role === 'seller' ||
      user.role === 'admin' ||
      user.role === 'manager' ||
      user.role === 'super_admin'
    ))
  );

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'finance' | 'profile' | 'staff' | 'reviews'
  >('overview');

  const [loading, setLoading] = useState<boolean>(true);
  const [storeData, setStoreData] = useState<Store | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [staffList, setStaffList] = useState<VendorStaff[]>([]);

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number | ''>('');
  const [newProdRegularPrice, setNewProdRegularPrice] = useState<number | ''>('');
  const [newProdDiscountPercent, setNewProdDiscountPercent] = useState<number | ''>('');
  const [newProdStock, setNewProdStock] = useState<number>(10);
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Laptops');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdSku, setNewProdSku] = useState('');

  const handleVendorRegularPriceChange = (val: number | '') => {
    setNewProdRegularPrice(val);
    if (val === '' || Number(val) <= 0) return;
    const numReg = Number(val);
    if (newProdDiscountPercent !== '' && Number(newProdDiscountPercent) > 0) {
      setNewProdPrice(Math.round(numReg * (1 - Number(newProdDiscountPercent) / 100)));
    } else if (newProdPrice !== '' && numReg > Number(newProdPrice)) {
      setNewProdDiscountPercent(Math.round(((numReg - Number(newProdPrice)) / numReg) * 100));
    }
  };

  const handleVendorDiscountPercentChange = (val: number | '') => {
    setNewProdDiscountPercent(val);
    if (val === '' || Number(val) <= 0) {
      if (newProdRegularPrice !== '') setNewProdPrice(newProdRegularPrice);
      return;
    }
    const cleanPct = Math.min(99, Math.max(1, Number(val)));
    if (newProdRegularPrice !== '' && Number(newProdRegularPrice) > 0) {
      setNewProdPrice(Math.round(Number(newProdRegularPrice) * (1 - cleanPct / 100)));
    }
  };

  const handleVendorSellingPriceChange = (val: number | '') => {
    setNewProdPrice(val);
    if (val === '' || Number(val) <= 0) {
      setNewProdDiscountPercent('');
      return;
    }
    const numSale = Number(val);
    if (newProdRegularPrice !== '' && Number(newProdRegularPrice) > numSale) {
      setNewProdDiscountPercent(Math.round(((Number(newProdRegularPrice) - numSale) / Number(newProdRegularPrice)) * 100));
    } else {
      setNewProdDiscountPercent('');
    }
  };

  const applyVendorDiscountPreset = (percent: number) => {
    setNewProdDiscountPercent(percent);
    const reg = newProdRegularPrice || newProdPrice;
    if (reg && Number(reg) > 0) {
      if (!newProdRegularPrice) setNewProdRegularPrice(reg);
      setNewProdPrice(Math.round(Number(reg) * (1 - percent / 100)));
    }
  };

  const clearVendorDiscount = () => {
    setNewProdDiscountPercent('');
    if (newProdRegularPrice !== '') {
      setNewProdPrice(newProdRegularPrice);
    }
  };

  // Payout Form State
  const [payoutAmount, setPayoutAmount] = useState<number>(50000);
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'momo' | 'airtel' | 'bank'>('momo');

  // Staff Form State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('Store Manager');

  // Search in products
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    setLoading(true);
    try {
      const [dashRes, prodRes, ordRes, walRes, revRes, staffRes] = await Promise.all([
        api.getVendorDashboard().catch(() => null),
        api.getVendorProducts().catch(() => ({ products: [] })),
        api.getVendorOrders().catch(() => ({ orders: [] })),
        api.getVendorWallet().catch(() => ({ wallet: null })),
        api.getVendorProfile().then((res) => res.store?.id ? api.getStoreReviews(res.store.id) : { reviews: [] }).catch(() => ({ reviews: [] })),
        api.getVendorStaff().catch(() => ({ staff: [] })),
      ]);

      if (dashRes && dashRes.store) {
        setStoreData(dashRes.store);
        setMetrics(dashRes.metrics);
        setPayoutPhone(dashRes.store.payout_details?.account_number || '');
        setPayoutMethod(dashRes.store.payout_details?.method || 'momo');
      }

      if (prodRes && prodRes.products) setProducts(prodRes.products);
      if (ordRes && ordRes.orders) setOrders(ordRes.orders);
      if (walRes && walRes.wallet) setWallet(walRes.wallet);
      if (revRes && revRes.reviews) setReviews(revRes.reviews);
      if (staffRes && staffRes.staff) setStaffList(staffRes.staff);
    } catch (err: any) {
      console.warn('Vendor portal load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) {
      showToast('Please enter product name and price.');
      return;
    }

    try {
      const sellPrice = Number(newProdPrice);
      const regPrice = Number(newProdRegularPrice || newProdPrice);
      const isOnSale = regPrice > sellPrice;
      const discountPct = isOnSale
        ? Math.round(((regPrice - sellPrice) / regPrice) * 100)
        : undefined;

      const payload: Partial<Product> = {
        name: newProdName.trim(),
        price: sellPrice,
        regular_price: regPrice,
        sale_price: isOnSale ? sellPrice : undefined,
        discount_percent: discountPct,
        on_sale: isOnSale,
        stock_quantity: Number(newProdStock),
        brand: newProdBrand.trim() || storeData?.name || 'Generic',
        categories: [{ id: 1, name: newProdCategory, slug: newProdCategory.toLowerCase() }],
        description: newProdDescription.trim(),
        short_description: newProdDescription.slice(0, 120),
        sku: newProdSku.trim() || undefined,
        images: newProdImage
          ? [{ id: 1, src: newProdImage, name: newProdName, alt: newProdName }]
          : undefined,
      };

      const res = await api.createVendorProduct(payload);
      if (res.success) {
        showToast(`Product "${res.product.name}" created successfully!`);
        setIsAddProductOpen(false);
        setNewProdName('');
        setNewProdPrice('');
        setNewProdRegularPrice('');
        setNewProdDiscountPercent('');
        setNewProdDescription('');
        setNewProdImage('');
        loadVendorData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this product?')) return;
    try {
      await api.deleteVendorProduct(id);
      showToast('Product removed');
      loadVendorData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product');
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await api.updateVendorOrderStatus(orderId, newStatus);
      if (res.success) {
        showToast(`Order status updated to ${newStatus}`);
        loadVendorData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update order');
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (!amount || amount < 50000) {
      showToast('Minimum payout amount is UGX 50,000');
      return;
    }

    try {
      const res = await api.requestVendorPayout({
        amount,
        payout_method: payoutMethod,
        account_number: payoutPhone.trim(),
        account_name: storeData?.payout_details?.account_name || user?.first_name || '',
      });

      if (res.success) {
        showToast(res.message || 'Withdrawal request submitted!');
        setIsPayoutModalOpen(false);
        loadVendorData();
      }
    } catch (err: any) {
      showToast(err.message || 'Withdrawal request failed');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail) return;

    try {
      const res = await api.createVendorStaff({
        name: staffName.trim(),
        email: staffEmail.trim(),
        role_title: staffRole,
        permissions: ['manage_products', 'manage_orders'],
      });
      if (res.success) {
        showToast('Staff account added successfully!');
        setIsStaffModalOpen(false);
        setStaffName('');
        setStaffEmail('');
        loadVendorData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add staff');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center text-white space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Seller Center Portal</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Restricted Access: The Seller Center Portal is strictly reserved for verified sellers and store administrators. Regular customers do not have access to this portal.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setCurrentView('account', { tab: 'login' })}
              className="w-full py-2.5 px-4 rounded-xl bg-[#920d35] hover:bg-[#a8103d] text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              Sign In with Authorized Seller Account
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Return to Marketplace Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Seller Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 py-3.5 px-4 sm:px-8 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#920d35] flex items-center justify-center font-bold text-white shadow">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight">
                  {storeData?.name || 'Seller Dashboard'}
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {storeData?.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Cyber Dynamic Tech Vendor Portal • {storeData?.district || 'Kampala'}, Uganda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {storeData?.slug && (
              <button
                onClick={() => setCurrentView('storefront', { slug: storeData.slug })}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
              >
                <span>View My Storefront</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setCurrentView('home')}
              className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm shrink-0 self-start">
          <div className="p-3 border-b border-slate-100 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Store Management
            </span>
            <div className="text-xs font-semibold text-slate-800 truncate">
              {user?.first_name} {user?.last_name} ({user?.role})
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#920d35] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-[#920d35] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Products Catalog</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-full font-bold">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#920d35] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Store Orders</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-full font-bold">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'finance'
                  ? 'bg-[#920d35] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4" />
                <span>Wallet & Payouts</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#920d35] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <StoreIcon className="w-4 h-4" />
                <span>Store Profile & Delivery</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'reviews'
                  ? 'bg-[#920d35] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>Customer Reviews</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-full font-bold">
                {reviews.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'staff'
                  ? 'bg-[#920d35] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Staff & Roles</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </nav>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={loadVendorData}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Available for Payout</span>
                    <Wallet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {formatPrice(metrics?.available_balance || 0)}
                  </div>
                  <button
                    onClick={() => setIsPayoutModalOpen(true)}
                    className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    <span>Request Payout</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Total Net Earnings</span>
                    <TrendingUp className="w-4 h-4 text-[#920d35]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {formatPrice(metrics?.total_earnings || 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Gross sales minus {storeData?.commission_rate || 8}% platform commission
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Gross Sales</span>
                    <DollarSign className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {formatPrice(metrics?.gross_sales || 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    From {orders.length} orders fulfilled
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Commission Deducted</span>
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {formatPrice(metrics?.platform_commission || 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Transparent platform fees
                  </p>
                </div>
              </div>

              {/* Quick Actions & Stock Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders in Store */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Recent Store Orders</h3>
                      <p className="text-xs text-slate-400">Orders containing your store items</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-[#920d35] font-bold hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No orders received yet. Once customers purchase from your storefront, they will show here.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 4).map((vo) => (
                        <div
                          key={vo.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{vo.id}</span>
                            <div className="text-[11px] text-slate-500">
                              Parent Order: #{vo.parent_order_number} • {vo.line_items.length} items
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-slate-900 block">
                              {formatPrice(vo.vendor_net_earnings)}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                vo.status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {vo.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Store Action Box */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                      Quick Seller Toolkit
                    </span>
                    <h3 className="text-lg font-extrabold mb-2">Grow Your Electronics Business</h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-6">
                      Add newly arrived stock, update product variations, respond to customer reviews, and request fast Mobile Money withdrawals.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      onClick={() => setIsAddProductOpen(true)}
                      className="w-full bg-[#920d35] hover:bg-[#770929] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Product</span>
                    </button>
                    <button
                      onClick={() => setIsPayoutModalOpen(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Request Cash Payout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Products Catalog ({products.length})</h3>
                  <p className="text-xs text-slate-400">Manage all items linked to your store</p>
                </div>
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="bg-[#920d35] hover:bg-[#770929] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Search Strip */}
              <div className="relative max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter by product name or SKU..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                />
              </div>

              {/* Product List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images[0]?.src || '/logo.png'}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                            <span className="font-semibold text-slate-900 max-w-xs truncate block">
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{p.sku || 'N/A'}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{formatPrice(p.price)}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{p.stock_quantity} units</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.stock_status === 'instock'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {p.stock_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Your Store Orders ({orders.length})</h3>
                  <p className="text-xs text-slate-400">
                    Fulfill customer line items assigned directly to your store
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No orders have been received yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((vo) => (
                    <div
                      key={vo.id}
                      className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm">{vo.id}</span>
                          <span className="text-slate-400 ml-2">Parent: #{vo.parent_order_number}</span>
                          <span className="text-slate-400 ml-2">• {new Date(vo.date_created).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500">Status:</span>
                          <select
                            value={vo.status}
                            onChange={(e) => handleOrderStatusUpdate(vo.id, e.target.value)}
                            className="text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#920d35]"
                          >
                            <option value="processing">Processing</option>
                            <option value="packed">Packed & Tested</option>
                            <option value="shipped">Shipped</option>
                            <option value="out-for-delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2">
                        {vo.line_items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{it.quantity}x</span>
                              <span>{it.name}</span>
                            </div>
                            <span className="font-semibold text-slate-800">{formatPrice(it.total)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Financial Breakdown */}
                      <div className="bg-slate-50 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3 border border-slate-200/60">
                        <div>
                          <span>Subtotal: <strong>{formatPrice(vo.subtotal)}</strong></span>
                          <span className="mx-2">•</span>
                          <span>Commission ({vo.platform_commission_rate}%): <strong className="text-red-600">-{formatPrice(vo.platform_commission_amount)}</strong></span>
                          <span className="mx-2">•</span>
                          <span>Delivery Allowance: <strong>+{formatPrice(vo.shipping_fee)}</strong></span>
                        </div>
                        <div className="text-right font-bold text-slate-900">
                          Your Net Earnings: <span className="text-emerald-600 text-sm">{formatPrice(vo.vendor_net_earnings)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FINANCE & WALLET */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* Balances Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-400 font-semibold block mb-1">Available for Withdrawal</span>
                  <div className="text-2xl font-black text-emerald-600">
                    {formatPrice(wallet?.available_balance || 0)}
                  </div>
                  <button
                    onClick={() => setIsPayoutModalOpen(true)}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-sm transition-all"
                  >
                    Request Payout
                  </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-400 font-semibold block mb-1">Pending Withdrawals</span>
                  <div className="text-2xl font-black text-amber-600">
                    {formatPrice(wallet?.pending_payouts || 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-4">
                    Being processed via Mobile Money or Bank
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-400 font-semibold block mb-1">Total Withdrawn / Paid</span>
                  <div className="text-2xl font-black text-slate-900">
                    {formatPrice(wallet?.paid_balance || 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-4">
                    Successfully disbursed to your account
                  </p>
                </div>
              </div>

              {/* Payout History */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Payout Requests History</h4>
                {wallet?.payouts?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No payout requests have been placed yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {wallet?.payouts?.map((po: any) => (
                      <div key={po.id} className="py-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">{po.id}</span>
                          <span className="text-slate-400 ml-2">via {po.payout_method?.toUpperCase()} ({po.account_number})</span>
                          <div className="text-[11px] text-slate-400">
                            Requested: {new Date(po.requested_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 block">{formatPrice(po.amount)}</span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              po.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : po.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {po.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transactions Ledger */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Financial Ledger & Transactions</h4>
                {wallet?.transactions?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No ledger transactions recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {wallet?.transactions?.map((tx: any) => (
                      <div key={tx.id} className="py-3 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">{tx.description}</span>
                          <div className="text-[11px] text-slate-400">
                            Tx ID: {tx.id} • {new Date(tx.created_at).toLocaleString()}
                          </div>
                        </div>
                        <span
                          className={`font-bold text-sm ${
                            tx.amount >= 0 ? 'text-emerald-600' : 'text-slate-800'
                          }`}
                        >
                          {tx.amount >= 0 ? '+' : ''}{formatPrice(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PROFILE & DELIVERY */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Store Profile & Delivery Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Store Name</label>
                  <input
                    type="text"
                    disabled
                    value={storeData?.name || ''}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">District</label>
                  <input
                    type="text"
                    disabled
                    value={storeData?.district || ''}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Money Payout Number</label>
                  <input
                    type="text"
                    disabled
                    value={storeData?.payout_details?.account_number || ''}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Standard Delivery Fee (UGX)</label>
                  <input
                    type="text"
                    disabled
                    value={formatPrice(storeData?.delivery_settings?.base_delivery_fee || 10000)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Store Address</label>
                  <input
                    type="text"
                    disabled
                    value={storeData?.address || ''}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: STAFF */}
          {activeTab === 'staff' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Store Staff Accounts</h3>
                  <p className="text-xs text-slate-400">Delegate product updates and order fulfillment</p>
                </div>
                <button
                  onClick={() => setIsStaffModalOpen(true)}
                  className="bg-[#920d35] hover:bg-[#770929] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Staff Member</span>
                </button>
              </div>

              {staffList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No additional staff accounts created yet. You are currently managing this store as the primary owner.
                </div>
              ) : (
                <div className="space-y-3">
                  {staffList.map((st) => (
                    <div key={st.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{st.name}</span>
                        <span className="text-slate-500 ml-2">({st.role_title})</span>
                        <div className="text-[11px] text-slate-400">{st.email}</div>
                      </div>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Customer Store Reviews ({reviews.length})</h3>
                <p className="text-xs text-slate-400">Feedback from shoppers who purchased from your storefront</p>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No reviews posted yet. As customers receive their products, reviews will appear here.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="py-4 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{rev.reviewer_name}</span>
                        <span className="text-slate-400">{new Date(rev.date_created).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ADD PRODUCT */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddProductOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Product to Store</h3>
            <p className="text-xs text-slate-500 mb-6">
              Create a new item in your storefront catalogue with stock and pricing.
            </p>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. HP EliteBook 840 G8 Core i7 16GB RAM 512GB SSD"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                />
              </div>

              {/* Price & Discount Section */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/60 to-rose-50/30 border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#920d35]" />
                    <span>Pricing & Discount (UGX)</span>
                  </span>
                  {newProdDiscountPercent !== '' && Number(newProdDiscountPercent) > 0 && (
                    <button
                      type="button"
                      onClick={clearVendorDiscount}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                    >
                      Clear Discount
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Regular Price (UGX) *
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={newProdRegularPrice || ''}
                      onChange={(e) => handleVendorRegularPriceChange(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 2800000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#920d35] focus:outline-none font-mono text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Original catalog price</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>Discount (%)</span>
                      {newProdDiscountPercent !== '' && Number(newProdDiscountPercent) > 0 && (
                        <span className="text-[10px] font-bold text-rose-600">Active</span>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-rose-500">%</span>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={newProdDiscountPercent}
                        onChange={(e) => handleVendorDiscountPercentChange(e.target.value ? Number(e.target.value) : '')}
                        placeholder="15"
                        className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono text-xs text-rose-600 font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Percent deduction</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Selling Price (UGX) *
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={newProdPrice || ''}
                      onChange={(e) => handleVendorSellingPriceChange(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 2500000"
                      className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-[#920d35] focus:outline-none font-mono text-xs font-bold ${
                        newProdPrice && newProdRegularPrice && Number(newProdRegularPrice) > Number(newProdPrice)
                          ? 'border-emerald-400 text-emerald-700 bg-emerald-50/50'
                          : 'border-slate-300 text-slate-800'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Shopper price</span>
                  </div>
                </div>

                {/* 1-Click Preset Discounts */}
                <div>
                  <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-500" />
                    <span>Quick Preset Discounts:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {[5, 10, 15, 20, 25, 30, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => applyVendorDiscountPreset(pct)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          Number(newProdDiscountPercent) === pct
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white hover:bg-rose-50 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {pct}% OFF
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                {newProdRegularPrice && Number(newProdRegularPrice) > 0 ? (
                  <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-[11px] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-900">
                        {formatPrice(Number(newProdPrice || newProdRegularPrice))}
                      </span>
                      {newProdPrice && Number(newProdRegularPrice) > Number(newProdPrice) && (
                        <>
                          <span className="text-slate-400 line-through">
                            {formatPrice(Number(newProdRegularPrice))}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-black">
                            -{newProdDiscountPercent || Math.round(((Number(newProdRegularPrice) - Number(newProdPrice)) / Number(newProdRegularPrice)) * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                    {newProdPrice && Number(newProdRegularPrice) > Number(newProdPrice) && (
                      <span className="text-[10px] font-bold text-emerald-600">
                        Save {formatPrice(Number(newProdRegularPrice) - Number(newProdPrice))}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#920d35] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#920d35] focus:outline-none bg-white"
                  >
                    <option value="Laptops">Laptops</option>
                    <option value="Desktops">Desktops</option>
                    <option value="Smartphones">Smartphones</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Solar & Power">Solar & Power</option>
                    <option value="Gaming">Gaming</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description & Specifications</label>
                <textarea
                  rows={3}
                  value={newProdDescription}
                  onChange={(e) => setNewProdDescription(e.target.value)}
                  placeholder="Include RAM, processor, storage, battery life, condition, warranty..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#920d35] hover:bg-[#770929] text-white px-5 py-2 rounded-xl font-bold shadow-md"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REQUEST PAYOUT */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setIsPayoutModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Request Mobile Money Withdrawal</h3>
            <p className="text-xs text-slate-500 mb-6">
              Funds will be disbursed directly to your registered Uganda phone number.
            </p>

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Available Balance</label>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 font-black text-lg">
                  {formatPrice(wallet?.available_balance || 0)}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Withdrawal Amount (UGX) *</label>
                <input
                  type="number"
                  required
                  min={50000}
                  max={wallet?.available_balance || 0}
                  step={5000}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Minimum withdrawal: UGX 50,000</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payout Gateway *</label>
                <select
                  value={payoutMethod}
                  onChange={(e: any) => setPayoutMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="momo">MTN Mobile Money</option>
                  <option value="airtel">Airtel Money Pay</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone / Account Number *</label>
                <input
                  type="text"
                  required
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  placeholder="0772..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!wallet?.available_balance || wallet.available_balance < 50000}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold shadow-md disabled:opacity-50"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setIsStaffModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Staff Member Account</h3>
            <p className="text-xs text-slate-500 mb-6">
              Grant a team member access to manage products and fulfill orders for {storeData?.name}.
            </p>

            <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Sarah Namata"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Staff Email Address *</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Role Title</label>
                <input
                  type="text"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  placeholder="Store Manager / Inventory Officer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#920d35] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#920d35] hover:bg-[#770929] text-white px-5 py-2 rounded-xl font-bold shadow-md"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
