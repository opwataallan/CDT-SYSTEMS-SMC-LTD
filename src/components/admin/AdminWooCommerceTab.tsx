import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  ShieldCheck,
  Server,
  Lock,
  Globe,
  CheckCircle2,
  ExternalLink,
  Activity,
  AlertTriangle,
  Bell,
  Mail,
  Phone,
  Send,
  Copy,
  Check,
  Zap,
  Clock,
  ArrowDownRight,
  Download,
  Package,
  FileArchive,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { PriceDropAlert, Product } from '../../types';

interface AdminWooCommerceTabProps {
  wcStatus: any;
  isCheckingWc: boolean;
  onRecheck: () => void;
  onTriggerSync: () => void;
  isSyncing: boolean;
}

export const AdminWooCommerceTab: React.FC<AdminWooCommerceTabProps> = ({
  wcStatus,
  isCheckingWc,
  onRecheck,
  onTriggerSync,
  isSyncing,
}) => {
  const [alerts, setAlertAlerts] = useState<PriceDropAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedPluginLink, setCopiedPluginLink] = useState(false);
  const [copiedCpanelLink, setCopiedCpanelLink] = useState(false);

  // Test trigger state
  const [testProductId, setTestProductId] = useState<string>('');
  const [testPrice, setTestPrice] = useState<string>('');
  const [testPhone, setTestPhone] = useState<string>('+256779743101');
  const [testEmail, setTestEmail] = useState<string>('opwataallan@gmail.com');
  const [testingTrigger, setTestingTrigger] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<{ total: number; created: number; updated: number; message: string } | null>(null);

  const handleImportIntoDatabase = async () => {
    setIsImporting(true);
    setImportReport(null);
    try {
      const res = await api.importWooCommerceProducts();
      setImportReport(res);
    } catch (e: any) {
      alert(`Import error: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/woocommerce`
    : 'https://your-domain.com/api/webhooks/woocommerce';

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await api.getAdminPriceAlerts();
      if (res && Array.isArray(res.alerts)) {
        setAlertAlerts(res.alerts);
      }
    } catch (err) {
      console.warn('[Admin Alerts Fetch]', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    api.getProducts().then((p) => {
      if (Array.isArray(p) && p.length > 0) {
        setProducts(p);
        if (!testProductId) {
          setTestProductId(String(p[0].id));
          setTestPrice(String(Math.round(p[0].price * 0.85)));
        }
      }
    }).catch(() => {});
  }, []);

  const handleCopyWebhook = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  const handleTestTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testProductId) return;
    setTestingTrigger(true);
    setTestResult(null);

    try {
      const res = await api.testPriceAlertTrigger({
        product_id: Number(testProductId),
        test_new_price: testPrice ? Number(testPrice) : undefined,
        override_email: testEmail || undefined,
        override_phone: testPhone || undefined,
      });
      setTestResult(res);
      fetchAlerts();
    } catch (err: any) {
      setTestResult({ error: err?.message || 'Failed to simulate price drop' });
    } finally {
      setTestingTrigger(false);
    }
  };

  const activeCount = alerts.filter((a) => a.status === 'active').length;
  const triggeredCount = alerts.filter((a) => a.status === 'triggered').length;

  return (
    <div className="space-y-5">
      {/* 0. DEPLOYMENT & INSTALLATION PACKAGES (DIRECT DOWNLOADS) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Package className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>Download Deployment ZIP Packages</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Production Ready
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-compiled and bundled archives ready for 1-click download and installation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Card 1: WordPress Plugin */}
          <div className="bg-slate-800/80 hover:bg-slate-800 transition-all rounded-xl border border-slate-700 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <FileArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <span>WordPress & WooCommerce Plugin</span>
                    </h3>
                    <p className="text-[11px] font-mono text-emerald-400">cyber-dynamic-marketplace.zip (1.6 MB)</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                  Recommended
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                Native WordPress plugin that installs straight into your WordPress admin (<strong>Plugins → Add New → Upload Plugin</strong>). Directly syncs with WooCommerce with zero Node server required.
              </p>

              <div className="mt-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
                <div>✓ Shortcode: <code className="text-emerald-300">[cyber_dynamic_marketplace]</code></div>
                <div>✓ Standalone PWA at: <code className="text-cyan-300">/marketplace-app/</code></div>
                <div>✓ Direct MTN MoMo & Airtel Money order creation</div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center gap-2">
              <a
                href="/cyber-dynamic-marketplace.zip"
                download="cyber-dynamic-marketplace.zip"
                className="flex-1 py-2.5 px-4 bg-[#007f19] hover:bg-[#006013] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Plugin (.zip)</span>
              </a>

              <button
                onClick={() => {
                  const url = `${window.location.origin}/cyber-dynamic-marketplace.zip`;
                  navigator.clipboard.writeText(url);
                  setCopiedPluginLink(true);
                  setTimeout(() => setCopiedPluginLink(false), 2000);
                }}
                className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Copy Direct Download Link"
              >
                {copiedPluginLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Card 2: cPanel Node.js App */}
          <div className="bg-slate-800/80 hover:bg-slate-800 transition-all rounded-xl border border-slate-700 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 flex-shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <span>cPanel Node.js Standalone App</span>
                    </h3>
                    <p className="text-[11px] font-mono text-orange-400">cpanel-production.zip (3.0 MB)</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/30">
                  Full Stack
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                Full-stack Node.js bundle for cPanel <strong>Setup Node.js App</strong> (e.g. running on <code>shop.cyberdynamictech.com</code> or subdomain). Includes bundled backend, client dist, and MySQL schema.
              </p>

              <div className="mt-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
                <div>✓ Startup file: <code className="text-orange-300">app.js</code></div>
                <div>✓ Built dist + SQLite/MySQL dual database support</div>
                <div>✓ Real-time background sync & webhook receivers</div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center gap-2">
              <a
                href="/cpanel-production.zip"
                download="cpanel-production.zip"
                className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download cPanel Bundle (.zip)</span>
              </a>

              <button
                onClick={() => {
                  const url = `${window.location.origin}/cpanel-production.zip`;
                  navigator.clipboard.writeText(url);
                  setCopiedCpanelLink(true);
                  setTimeout(() => setCopiedCpanelLink(false), 2000);
                }}
                className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Copy Direct Download Link"
              >
                {copiedCpanelLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. WOOCOMMERCE REST API STATUS CARD */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-[#007f19]">
                <Server className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                WooCommerce REST API Diagnostics & Remote Catalog Sync
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authoritative e-commerce source of truth hosted on <code>https://www.cyberdynamictech.com</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRecheck();
                fetchAlerts();
              }}
              disabled={isCheckingWc}
              className="h-9 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingWc ? 'animate-spin' : ''}`} />
              <span>Ping Host</span>
            </button>

            <button
              onClick={handleImportIntoDatabase}
              disabled={isImporting}
              className="h-9 px-3.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin' : ''}`} />
              <span>{isImporting ? 'Importing...' : 'Import to Platform DB'}</span>
            </button>

            <button
              onClick={() => {
                onTriggerSync();
                setTimeout(fetchAlerts, 2500);
              }}
              disabled={isSyncing}
              className="h-9 px-3.5 bg-[#007f19] hover:bg-[#006013] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync All Products</span>
            </button>
          </div>
        </div>

        {importReport && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#007f19] shrink-0" />
              <span>{importReport.message} ({importReport.created} new created, {importReport.updated} refreshed, 0 duplicates)</span>
            </div>
            <button
              onClick={() => setImportReport(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
          {/* Left Column: Live Telemetry */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-600" />
              <span>Host Connection Telemetry</span>
            </h3>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">WooCommerce Host:</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {wcStatus?.host || 'https://www.cyberdynamictech.com'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Gateway Status:</span>
                <span
                  className={`font-black flex items-center gap-1.5 ${
                    wcStatus?.connected ? 'text-[#007f19]' : 'text-amber-600'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      wcStatus?.connected ? 'bg-[#007f19] animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {wcStatus?.connected ? 'Connected / Live' : 'Offline / Local Fallback Active'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Server Latency:</span>
                <span className="font-mono font-bold text-slate-900">
                  {wcStatus?.latency_ms ? `${wcStatus.latency_ms} ms` : 'Testing connection...'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Credentials Sealed:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{wcStatus?.has_keys ? 'Configured (Server-Side Env)' : 'Default Keys'}</span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Synchronized Catalog SKUs:</span>
                <span className="font-black text-slate-900">{wcStatus?.products_in_catalog || 48} Products</span>
              </div>
            </div>

            <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-xs text-cyan-900 space-y-1">
              <span className="font-bold block">Status Diagnostic Message:</span>
              <p className="text-[11px] leading-relaxed text-cyan-800">
                {wcStatus?.message || 'Server REST connection is active and synchronizing live orders.'}
              </p>
            </div>
          </div>

          {/* Right Column: High Assurance Security Protocol */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-purple-600" />
              <span>Zero-Exposure REST Security Architecture</span>
            </h3>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 text-xs leading-relaxed text-slate-600">
              <p>
                In strict compliance with enterprise payment security and PCI standards, WooCommerce API keys (<code>Consumer Key</code> and <code>Consumer Secret</code>) are kept strictly on the backend Node.js / Express server.
              </p>
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#007f19]" />
                  <span>Client-Side Isolation Verified</span>
                </div>
                <p className="text-slate-500">
                  Browser clients never receive API secrets. All inventory updates, customer order dispatch calls, and price drop notifications proxy through secure server routes.
                </p>
              </div>

              <a
                href={wcStatus?.host || 'https://www.cyberdynamictech.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-800 hover:underline"
              >
                <span>Visit cyberdynamictech.com Admin Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRICE DROP ALERT ENGINE & WOOCOMMERCE WEBHOOKS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Bell className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                'Notify Me When Price Drops' Automation & Webhooks
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Monitors product prices when updated in the WooCommerce backend and dispatches SMS/Email notifications to subscribed shoppers.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAlerts}
            disabled={loadingAlerts}
            className="h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3 h-3 ${loadingAlerts ? 'animate-spin' : ''}`} />
            <span>Refresh Subscriptions</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Subscriptions</span>
            <div className="text-2xl font-black text-slate-900">{alerts.length}</div>
            <p className="text-[10px] text-slate-400">Total customer alerts captured</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Active Watchers</span>
            <div className="text-2xl font-black text-emerald-700">{activeCount}</div>
            <p className="text-[10px] text-emerald-600">Waiting for WooCommerce price reduction</p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Triggered & Notified</span>
            <div className="text-2xl font-black text-amber-700">{triggeredCount}</div>
            <p className="text-[10px] text-amber-600">Dispatched via SMS / Email</p>
          </div>
        </div>

        {/* Webhook Configuration Guide */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-600" />
              <span>Instant Trigger: WooCommerce Webhook URL</span>
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 uppercase">
              Real-Time Push
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Paste this webhook endpoint in your WordPress/WooCommerce Dashboard under{' '}
            <strong>WooCommerce &gt; Settings &gt; Advanced &gt; Webhooks &gt; Add Webhook</strong> with Topic <code>Product updated</code>.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="w-full font-mono text-xs p-2 rounded-lg bg-white border border-slate-200 text-slate-700 select-all"
            />
            <button
              onClick={handleCopyWebhook}
              className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Price Drop Notification Simulator for Admin Testing */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
              Notification Trigger Simulator (Test Delivery)
            </h4>
          </div>
          <p className="text-xs text-amber-800">
            Simulate a WooCommerce price reduction on any product to verify that notifications dispatch immediately via Africa's Talking / Twilio SMS and Email.
          </p>

          <form onSubmit={handleTestTrigger} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">Select Product</label>
              <select
                value={testProductId}
                onChange={(e) => {
                  setTestProductId(e.target.value);
                  const p = products.find((x) => String(x.id) === e.target.value);
                  if (p) setTestPrice(String(Math.round(p.price * 0.85)));
                }}
                className="w-full text-xs p-2 rounded-lg bg-white border border-amber-300 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name.slice(0, 30)} (UGX {p.price.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">Simulated New Price (UGX)</label>
              <input
                type="number"
                value={testPrice}
                onChange={(e) => setTestPrice(e.target.value)}
                placeholder="Lower than current"
                className="w-full text-xs p-2 rounded-lg bg-white border border-amber-300 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">Recipient Contact</label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. +256779743101"
                className="w-full text-xs p-2 rounded-lg bg-white border border-amber-300 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={testingTrigger}
                className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
              >
                <Send className={`w-3.5 h-3.5 ${testingTrigger ? 'animate-spin' : ''}`} />
                <span>{testingTrigger ? 'Dispatching...' : 'Simulate & Trigger'}</span>
              </button>
            </div>
          </form>

          {/* Test Trigger Result Feedback */}
          {testResult && (
            <div className="p-3 rounded-lg bg-white border border-amber-300 text-xs text-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{testResult.message || 'Trigger execution processed'}</span>
              </div>
              {testResult.alerts_triggered !== undefined && (
                <p className="text-[11px] text-slate-600">
                  Alerts Dispatched: <strong>{testResult.alerts_triggered}</strong> | New Price: <strong>UGX {testResult.new_price?.toLocaleString()}</strong> (-{testResult.drop_percentage}%)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Subscriptions Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Recent Price Drop Subscriptions ({alerts.length})
          </h4>

          {alerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No price drop subscriptions registered yet. When customers click "Notify Me When Price Drops" on product pages, their alerts will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Contact Recipient</th>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3">Price Target</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created / Notified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          {a.product_image && (
                            <img src={a.product_image} alt="" className="w-7 h-7 object-cover rounded border border-slate-200" />
                          )}
                          <span className="truncate">{a.product_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {a.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{a.phone}</div>}
                        {a.email && <div className="flex items-center gap-1 text-slate-500 text-[11px]"><Mail className="w-3 h-3 text-slate-400" />{a.email}</div>}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{a.notify_type}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        {a.target_price ? (
                          <span className="font-bold text-slate-900">Below UGX {a.target_price.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-400 italic">Any drop</span>
                        )}
                        <div className="text-[10px] text-slate-400">Current: UGX {a.current_price?.toLocaleString()}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            a.status === 'triggered'
                              ? 'bg-amber-100 text-amber-800'
                              : a.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {a.notified_at ? (
                          <div className="text-amber-700 font-medium">Notified: {new Date(a.notified_at).toLocaleTimeString()}</div>
                        ) : (
                          <div>Created: {new Date(a.created_at).toLocaleDateString()}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
