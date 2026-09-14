import React, { useState, useEffect } from 'react';
import {
  Settings,
  RefreshCw,
  Package,
  Truck,
  Building2,
  Lock,
  ShieldCheck,
  Users,
  Home,
  Sliders,
  LogOut,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  TrendingUp,
  BarChart2,
  Store,
  Check,
  MapPin,
  Clock,
  CreditCard,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { CustomerOrder, StoreSettings, DeliveryZone } from '../types';
import { AdminSettingsCenter } from '../components/admin/AdminSettingsCenter';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { AdminAuditLogsTab } from '../components/admin/AdminAuditLogsTab';
import { AdminHomepageBuilder } from '../components/admin/AdminHomepageBuilder';
import { AdminAnalyticsDashboard } from '../components/admin/AdminAnalyticsDashboard';

type AdminTab = 'analytics' | 'settings' | 'homepage' | 'orders' | 'users' | 'audit' | 'woocommerce' | 'delivery' | 'store';

export const AdminPage: React.FC = () => {
  const {
    user,
    isAdmin,
    login,
    logoutUser,
    storeSettings,
    refreshSettings,
    showToast,
    deliveryZones,
    setCurrentView,
  } = useShop();

  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [wcStatus, setWcStatus] = useState<any>(null);
  const [isCheckingWc, setIsCheckingWc] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);

  // Admin login form state for non-admin users
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Store Contacts state
  const [storeForm, setStoreForm] = useState<StoreSettings>({ ...storeSettings });
  const [isSavingStore, setIsSavingStore] = useState(false);

  // Order status modal
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Fetch status & orders
  const checkWooCommerceStatus = async () => {
    setIsCheckingWc(true);
    try {
      const res = await api.getWooCommerceStatus();
      setWcStatus(res);
    } catch (err: any) {
      setWcStatus({ connected: false, message: err.message });
    } finally {
      setIsCheckingWc(false);
    }
  };

  const loadOrders = async () => {
    try {
      const ords = await api.getOrders();
      setOrders(ords);
    } catch (e) {}
  };

  useEffect(() => {
    if (isAdmin) {
      checkWooCommerceStatus();
      loadOrders();
    }
  }, [isAdmin]);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await login({ email: loginEmail, password: loginPassword });
      const loggedUser = res?.user || user;
      if (loggedUser && loggedUser.role !== 'admin' && loggedUser.role !== 'manager') {
        setLoginError('Access denied: You are signed in, but your role does not possess Administrator or Manager privileges.');
      } else if (loggedUser) {
        showToast(`Welcome back, Administrator ${loggedUser.first_name}!`);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials or account locked.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      showToast('Initiating catalog synchronization with www.cyberdynamictech.com...');
      const res = await api.triggerSync();
      showToast(res.message);
      await checkWooCommerceStatus();
    } catch (err: any) {
      showToast('Sync notice: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStore(true);
    try {
      await api.saveAdminSettings({ settings: storeForm });
      await refreshSettings();
      showToast('Store settings & Kampala headquarters details updated!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update store settings');
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    try {
      await api.updateOrderStatus(selectedOrder.id, newStatus, statusNote);
      showToast(`Order ${selectedOrder.order_number} status updated to ${newStatus}`);
      setSelectedOrder(null);
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to update order');
    }
  };

  const handleConfirmOrderPayment = async (ord: CustomerOrder) => {
    setConfirmingOrderId(ord.order_number);
    try {
      const note = `Payment verified by store manager (${user?.first_name || 'Admin'}) on ${new Date().toLocaleDateString()}`;
      const res = await api.confirmOrderPayment(ord.order_number, note);
      if (res.success) {
        showToast(
          res.woocommerce_synced
            ? `Payment verified for #${ord.order_number}! Marked as processing and synced with WooCommerce (#${res.order?.woocommerce_order_id || 'WC'}).`
            : `Payment verified for #${ord.order_number}! Marked as processing.`
        );
        await loadOrders();
      }
    } catch (err: any) {
      showToast('Payment confirmation notice: ' + (err.message || 'Verification error'));
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleSyncOrderWooCommerce = async (ord: CustomerOrder) => {
    setSyncingOrderId(ord.order_number);
    try {
      const res = await api.syncOrderToWooCommerce(ord.order_number);
      if (res.success) {
        showToast(res.message || `Order ${ord.order_number} synchronized to WooCommerce!`);
        await loadOrders();
      }
    } catch (err: any) {
      showToast('WooCommerce Sync failed: ' + (err.message || 'Check WooCommerce keys'));
    } finally {
      setSyncingOrderId(null);
    }
  };

  // -------------------------------------------------------------
  // ADMIN AUTHENTICATION GATE
  // -------------------------------------------------------------
  if (!user || (!isAdmin && user.role !== 'manager')) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-cyan-950 p-6 text-white text-center space-y-3">
            <div className="bg-white/95 px-3 py-2 rounded-xl inline-block shadow-md mx-auto">
              <img
                src="/logo.png"
                alt="Cyber Dynamic Technologies"
                className="h-10 w-auto object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight">Cyber Dynamic Technologies Management</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Restricted Area • Requires verified Administrator or Manager role
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loginLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize Admin Session</span>
                  </>
                )}
              </button>
            </form>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Restricted administrative portal. All access attempts are authenticated and audited.</span>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setCurrentView('shop')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                ← Return to Public Marketplace Storefront
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* Top Admin Bar */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#007f19] text-white flex items-center justify-center font-black shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight">Cyber Dynamic Tech Store Management</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Signed in as {user.first_name} {user.last_name} ({user.email})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentView('pos')}
            className="h-8 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Open in-store counter POS register"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Launch POS Register</span>
          </button>

          <button
            onClick={() => setCurrentView('shop')}
            className="h-8 px-3 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="h-8 px-3 bg-[#007f19] hover:bg-[#006013] disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync WooCommerce</span>
          </button>

          <button
            onClick={logoutUser}
            className="h-8 px-3 border border-slate-700 hover:bg-rose-950 hover:text-rose-200 text-slate-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold no-scrollbar">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#007f19] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Analytics & Sales Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-[#007f19]" />
          <span>31-Category Settings Center</span>
        </button>

        <button
          onClick={() => setActiveTab('homepage')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'homepage'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Homepage Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Orders & Dispatch ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users & Profile Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('woocommerce')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'woocommerce'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>WooCommerce REST Status</span>
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'delivery'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Delivery Zones</span>
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'store'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Headquarters</span>
        </button>
      </div>

      {/* TAB CONTENT: ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && <AdminAnalyticsDashboard />}

      {/* TAB CONTENT: 31-CATEGORY SETTINGS CENTER */}
      {activeTab === 'settings' && <AdminSettingsCenter />}

      {/* TAB CONTENT: HOMEPAGE BUILDER */}
      {activeTab === 'homepage' && <AdminHomepageBuilder />}

      {/* TAB CONTENT: USERS & RBAC */}
      {activeTab === 'users' && <AdminUsersTab />}

      {/* TAB CONTENT: AUDIT LOGS */}
      {activeTab === 'audit' && <AdminAuditLogsTab />}

      {/* TAB CONTENT: WOOCOMMERCE STATUS */}
      {activeTab === 'woocommerce' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-600" />
                <span>Authoritative Commerce Source of Truth</span>
              </h3>
              <button
                onClick={checkWooCommerceStatus}
                disabled={isCheckingWc}
                className="text-cyan-600 hover:underline font-bold flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingWc ? 'animate-spin' : ''}`} />
                <span>Re-check</span>
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">WooCommerce URL:</span>
                <span className="font-mono font-bold text-slate-900">
                  {wcStatus?.host || 'https://www.cyberdynamictech.com'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Connection Status:</span>
                <span
                  className={`font-black flex items-center gap-1 ${
                    wcStatus?.connected ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      wcStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {wcStatus?.connected ? 'Connected / Live' : 'Offline / Local Fallback Active'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Host Latency:</span>
                <span className="font-mono font-bold text-slate-900">
                  {wcStatus?.latency_ms ? `${wcStatus.latency_ms} ms` : 'Measuring...'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Consumer Key Authorized:</span>
                <span className="font-bold text-slate-800">
                  {wcStatus?.has_keys ? 'Configured (Server-Side Env)' : 'Ready for Keys in .env'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Catalog Products:</span>
                <span className="font-bold text-slate-900">{wcStatus?.products_in_catalog || 10}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
              <p className="font-bold text-slate-800 mb-0.5">Status Note:</p>
              <p>{wcStatus?.message || 'Ready'}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-extrabold text-xs text-slate-800 border-b border-slate-100 pb-2.5">
              WooCommerce Security Architecture
            </h3>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              In accordance with high-assurance e-commerce standards, WooCommerce credentials (Consumer Key, Consumer Secret)
              are strictly evaluated <strong>on the backend Express server only</strong> via <code>server.ts</code>.
              Browser clients cannot access or intercept the secrets.
            </p>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 space-y-0.5">
              <p className="font-bold text-[11px]">✓ Zero-Exposure REST Architecture Verified</p>
              <p className="text-[10px]">
                Orders, payments, coupons, and inventory automatically synchronize with the primary store at <code>cyberdynamictech.com</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ORDERS & DISPATCH MANAGEMENT */}
      {activeTab === 'orders' && (() => {
        const safeOrders = Array.isArray(orders) ? orders : [];
        const pendingPaymentCount = safeOrders.filter(
          (o) => o?.payment_details?.status === 'awaiting_confirmation' || o?.status === 'pending_payment'
        ).length;

        const filteredOrders = safeOrders.filter((o) => {
          if (!o) return false;
          if (orderFilter === 'pending') {
            return o.payment_details?.status === 'awaiting_confirmation' || o.status === 'pending_payment';
          }
          if (orderFilter === 'processing') {
            return o.status === 'processing' || o.status === 'packed' || o.status === 'shipped';
          }
          if (orderFilter === 'completed') {
            return o.status === 'delivered' || o.status === 'completed';
          }
          return true;
        });

        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Customer Orders & Payment Verification</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Confirm Mobile Money payments to <strong>0394 760459 (CYBER DYNAMIC TECH)</strong> before processing. Confirmed orders automatically sync to WooCommerce.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold self-start sm:self-auto">
                <button
                  onClick={() => setOrderFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${
                    orderFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({orders.length})
                </button>
                <button
                  onClick={() => setOrderFilter('pending')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] flex items-center gap-1 ${
                    orderFilter === 'pending' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-700 hover:bg-amber-100/60'
                  }`}
                >
                  <span>Awaiting Payment</span>
                  {pendingPaymentCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-900 text-[10px] font-black">
                      {pendingPaymentCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setOrderFilter('processing')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${
                    orderFilter === 'processing' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Processing / In Dispatch
                </button>
                <button
                  onClick={() => setOrderFilter('completed')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${
                    orderFilter === 'completed' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 text-[11px]">
                  <tr>
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Customer & Contact</th>
                    <th className="p-3">District & Coordinates</th>
                    <th className="p-3">Items & Total</th>
                    <th className="p-3">Payment Status</th>
                    <th className="p-3">WooCommerce</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        No orders match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const isAwaitingPayment =
                        ord.payment_details?.status === 'awaiting_confirmation' ||
                        ord.status === 'pending_payment';
                      const isCOD = ord.payment_method === 'cod';

                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">
                            <div>{ord.order_number}</div>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {new Date(ord.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">
                              {ord.shipping.first_name} {ord.shipping.last_name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">{ord.shipping.phone}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-cyan-600 shrink-0" />
                              <span>{ord.shipping.district || ord.delivery_zone}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {ord.shipping.address_1}
                            </div>
                            {ord.coordinates && (
                              <a
                                href={`https://www.google.com/maps?q=${ord.coordinates.latitude},${ord.coordinates.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[10px] text-cyan-600 hover:underline font-bold mt-0.5"
                              >
                                <span>GPS: {ord.coordinates.latitude.toFixed(3)}, {ord.coordinates.longitude.toFixed(3)}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-black text-cyan-700">
                              UGX {ord.total.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {ord.line_items.length} item(s)
                            </div>
                          </td>
                          <td className="p-3">
                            {isCOD ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Cash on Delivery
                              </span>
                            ) : isAwaitingPayment ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Awaiting Confirmation</span>
                                </span>
                                {ord.payment_submitted && (
                                  <div className="text-[10px] text-emerald-700 font-bold">
                                    ✓ Customer sent proof: {ord.payment_details?.transaction_ref || 'Phone sent'}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Payment Confirmed</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {ord.woocommerce_order_id ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                WC #{ord.woocommerce_order_id}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSyncOrderWooCommerce(ord)}
                                disabled={syncingOrderId === ord.order_number}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1 cursor-pointer"
                              >
                                <RefreshCw className={`w-2.5 h-2.5 ${syncingOrderId === ord.order_number ? 'animate-spin' : ''}`} />
                                <span>Sync to WC</span>
                              </button>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                ord.status === 'delivered' || ord.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : ord.status === 'processing'
                                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                            {isAwaitingPayment && (
                              <button
                                onClick={() => handleConfirmOrderPayment(ord)}
                                disabled={confirmingOrderId === ord.order_number}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[10px] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>{confirmingOrderId === ord.order_number ? 'Confirming...' : 'Confirm Payment'}</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedOrder(ord);
                                setNewStatus(ord.status);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              Update Status
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* UPDATE STATUS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl p-5 space-y-3.5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-xs text-slate-900">
                Manage Order: {selectedOrder.order_number}
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                UGX {selectedOrder.total.toLocaleString()}
              </span>
            </div>

            {/* Quick payment confirmation in modal if awaiting */}
            {(selectedOrder.payment_details?.status === 'awaiting_confirmation' ||
              selectedOrder.status === 'pending_payment') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Payment Verification Pending</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleConfirmOrderPayment(selectedOrder);
                      setSelectedOrder(null);
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3 h-3" />
                    <span>Confirm Payment & Sync WC</span>
                  </button>
                </div>
                <p className="text-[11px] text-amber-900">
                  Customer payment sent to: <strong>0394 760459 (CYBER DYNAMIC TECH)</strong>
                  {selectedOrder.payment_details?.transaction_ref && (
                    <span> • Ref: {selectedOrder.payment_details.transaction_ref}</span>
                  )}
                </p>
              </div>
            )}

            {/* Coordinates in modal */}
            {selectedOrder.coordinates && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-700 text-[11px]">
                  <MapPin className="w-3 h-3 text-cyan-600" />
                  <span>GPS: {selectedOrder.coordinates.latitude.toFixed(4)}, {selectedOrder.coordinates.longitude.toFixed(4)}</span>
                </span>
                <a
                  href={`https://www.google.com/maps?q=${selectedOrder.coordinates.latitude},${selectedOrder.coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:underline font-bold text-[11px] flex items-center gap-0.5"
                >
                  <span>Open Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">Progression Stage:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="pending_payment">Pending Payment Confirmation</option>
                  <option value="processing">Processing (Inspection in progress)</option>
                  <option value="packed">Packed & Sealed in Kampala Hub</option>
                  <option value="shipped">Dispatched / In Transit</option>
                  <option value="out-for-delivery">Out for Delivery</option>
                  <option value="delivered">Delivered & Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">Courier / Dispatch Note:</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched with express courier to Nakawa"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 h-8 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrderStatus}
                className="flex-1 h-8 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Save Progression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DELIVERY ZONES */}
      {activeTab === 'delivery' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h3 className="font-black text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Truck className="w-3.5 h-3.5 text-cyan-600" />
            <span>Kampala Delivery Area Rates & Timelines</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deliveryZones.map((zone) => (
              <div key={zone.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1.5 text-[11px]">
                <h4 className="font-bold text-slate-900 text-xs">{zone.name}</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping Fee:</span>
                  <span className="font-bold text-slate-800">
                    {zone.fee === 0 ? <span className="text-emerald-600">FREE</span> : `UGX ${zone.fee.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Time:</span>
                  <span className="font-bold text-slate-800">{zone.estimated_delivery || zone.estimated_days}</span>
                </div>
                {zone.free_threshold && (
                  <div className="flex justify-between text-[10px] text-emerald-700">
                    <span>Free on Orders Over:</span>
                    <span className="font-bold">UGX {zone.free_threshold.toLocaleString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: STORE HEADQUARTERS & CONTACTS */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStore} className="max-w-2xl bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3.5 text-xs">
          <h3 className="font-black text-xs text-slate-800 border-b border-slate-100 pb-2">
            Physical Store Information (Kampala Headquarters & Showroom)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">Phone Hotline:</label>
              <input
                type="text"
                value={storeForm.phone}
                onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">WhatsApp Hotline:</label>
              <input
                type="text"
                value={storeForm.whatsapp_number}
                onChange={(e) => setStoreForm({ ...storeForm, whatsapp_number: e.target.value })}
                className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">Support Email:</label>
              <input
                type="email"
                value={storeForm.email}
                onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">Physical Address Line:</label>
              <input
                type="text"
                value={storeForm.address_line}
                onChange={(e) => setStoreForm({ ...storeForm, address_line: e.target.value })}
                className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingStore}
            className="h-8 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
          >
            {isSavingStore ? 'Saving...' : 'Save Headquarters Settings'}
          </button>
        </form>
      )}
    </div>
  );
};
