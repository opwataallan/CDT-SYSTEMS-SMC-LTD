import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Eye,
  Store,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { CustomerOrder } from '../types';

// Admin Sub-components
import { AdminSidebar, AdminTab } from '../components/admin/AdminSidebar';
import { AdminTopHeader } from '../components/admin/AdminTopHeader';
import { AdminMobileNav } from '../components/admin/AdminMobileNav';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminSettingsCenter } from '../components/admin/AdminSettingsCenter';
import { AdminHomepageBuilder } from '../components/admin/AdminHomepageBuilder';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { AdminAuditLogsTab } from '../components/admin/AdminAuditLogsTab';
import { AdminWooCommerceTab } from '../components/admin/AdminWooCommerceTab';
import { AdminDeliveryTab } from '../components/admin/AdminDeliveryTab';
import { AdminStoreHeadquartersTab } from '../components/admin/AdminStoreHeadquartersTab';

export const AdminPage: React.FC = () => {
  const {
    user,
    isAdmin,
    login,
    quickLogin,
    logoutUser,
    storeSettings,
    deliveryZones,
    showToast,
    setCurrentView,
  } = useShop();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [wcStatus, setWcStatus] = useState<any>(null);
  const [isCheckingWc, setIsCheckingWc] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);

  // Admin login form state for non-admin users
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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

  // Listen for mobile bottom bar "Menu" event
  useEffect(() => {
    const handleOpenDrawer = () => setIsMobileMenuOpen(true);
    window.addEventListener('open-admin-drawer', handleOpenDrawer);
    return () => window.removeEventListener('open-admin-drawer', handleOpenDrawer);
  }, []);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await login({ email: loginEmail, password: loginPassword });
      const loggedUser = res?.user || user;
      if (loggedUser && loggedUser.role !== 'admin' && loggedUser.role !== 'manager') {
        setLoginError(
          'Access denied: You are signed in, but your role does not possess Administrator or Manager privileges.'
        );
      } else if (loggedUser) {
        showToast(`Welcome back, Administrator ${loggedUser.first_name}!`);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials or account locked.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: 'admin' | 'staff' = 'admin') => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await quickLogin(role);
      if (res.success) {
        showToast(`Authorized demo session as ${role.toUpperCase()}!`);
      } else {
        setLoginError(res.message);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Quick demo login failed');
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

  // Calculate pending payments count
  const pendingPaymentCount = (orders || []).filter(
    (o) => o?.payment_details?.status === 'awaiting_confirmation' || o?.status === 'pending_payment'
  ).length;

  // -------------------------------------------------------------
  // 1. ADMIN AUTHENTICATION GATE (NON-ADMINS)
  // -------------------------------------------------------------
  if (!user || (!isAdmin && user.role !== 'manager')) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-6 sm:p-7 text-white text-center space-y-3 relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-white/95 p-2 shadow-lg mx-auto flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Cyber Dynamic Technologies"
                className="h-full w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                Cyber Dynamic Technologies
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Enterprise Store Administration Portal
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-cyan-300">
                <Lock className="w-3 h-3 text-cyan-400" />
                <span>Restricted Access: Super Admin / Manager</span>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-7 space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
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
                  placeholder="admin@cyberdynamictech.com"
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-cyan-500 bg-slate-50 focus:bg-white transition-colors"
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
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-cyan-500 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Authorize Admin Session</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo One-Click Access (Convenient for preview testing) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 text-center mb-2">
                Preview Environment Fast Access
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin')}
                  disabled={loginLoading}
                  className="h-9 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#007f19] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('staff')}
                  disabled={loginLoading}
                  className="h-9 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Demo Manager</span>
                </button>
              </div>
            </div>

            {/* Return Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setCurrentView('shop')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Return to Public Marketplace Storefront</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. MODERN RESPONSIVE ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Collapsible Sidebar (PC >= lg) */}
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={(t) => setActiveTab(t)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          pendingPaymentCount={pendingPaymentCount}
          ordersCount={orders.length}
          wcConnected={Boolean(wcStatus?.connected)}
        />

        {/* Mobile Slide-Over Drawer & Sticky Bottom Bar (Mobile < lg) */}
        <AdminMobileNav
          activeTab={activeTab}
          onSelectTab={(t) => setActiveTab(t)}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          pendingPaymentCount={pendingPaymentCount}
          ordersCount={orders.length}
          wcConnected={Boolean(wcStatus?.connected)}
        />

        {/* Main Work Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-100">
          {/* Top Administrative Header */}
          <AdminTopHeader
            activeTab={activeTab}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            pendingPaymentCount={pendingPaymentCount}
            wcStatus={wcStatus}
            onSyncWooCommerce={handleSyncNow}
            isSyncing={isSyncing}
          />

          {/* Tab Content Container (Scrollable with mobile bottom padding) */}
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-7 pb-24 lg:pb-8">
            <div className="max-w-7xl mx-auto">
              {/* Executive Overview & Analytics */}
              {(activeTab === 'overview' || activeTab === 'analytics') && (
                <AdminOverviewTab
                  orders={orders}
                  onNavigateTab={(t) => setActiveTab(t)}
                  onSyncWooCommerce={handleSyncNow}
                  isSyncing={isSyncing}
                  wcStatus={wcStatus}
                />
              )}

              {/* Orders & Regional Dispatch */}
              {activeTab === 'orders' && (
                <AdminOrdersTab orders={orders} onRefresh={loadOrders} />
              )}

              {/* 31-Category Store Settings Center */}
              {activeTab === 'settings' && <AdminSettingsCenter />}

              {/* Drag & Drop Homepage Builder */}
              {activeTab === 'homepage' && <AdminHomepageBuilder />}

              {/* Users & Staff RBAC Permissions */}
              {activeTab === 'users' && <AdminUsersTab />}

              {/* Security Audit Logs */}
              {activeTab === 'audit' && <AdminAuditLogsTab />}

              {/* WooCommerce REST Status */}
              {activeTab === 'woocommerce' && (
                <AdminWooCommerceTab
                  wcStatus={wcStatus}
                  isCheckingWc={isCheckingWc}
                  onRecheck={checkWooCommerceStatus}
                  onTriggerSync={handleSyncNow}
                  isSyncing={isSyncing}
                />
              )}

              {/* Regional Delivery Zones */}
              {activeTab === 'delivery' && (
                <AdminDeliveryTab deliveryZones={deliveryZones} />
              )}

              {/* Store Headquarters & Showroom */}
              {activeTab === 'store' && (
                <AdminStoreHeadquartersTab initialSettings={storeSettings} />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
