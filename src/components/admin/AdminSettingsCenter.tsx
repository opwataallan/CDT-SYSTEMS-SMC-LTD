import React, { useState } from 'react';
import {
  Globe,
  Palette,
  Layout,
  Home,
  Package,
  FolderTree,
  ShoppingCart,
  CreditCard,
  Users,
  ClipboardList,
  Truck,
  DollarSign,
  Percent,
  Ticket,
  Star,
  Heart,
  Bell,
  Mail,
  MessageSquare,
  PhoneCall,
  Search,
  Share2,
  BarChart3,
  Shield,
  Key,
  Zap,
  Cpu,
  RefreshCw,
  Power,
  FileText,
  Code2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  DownloadCloud,
  Check,
  Activity,
  Radio,
  SlidersHorizontal,
  Store,
  Plus,
  UserCheck,
  Lock,
  Unlock,
  Monitor,
  Send,
  Smartphone,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { MarketplaceConfig, SmsLogEntry } from '../../types';
import { DEFAULT_MARKETPLACE_CONFIG } from '../../data/defaultConfig';
import { api } from '../../services/api';
import { ThemeColorSetting } from '../ThemeColorSetting';

type CategoryKey = keyof MarketplaceConfig;

interface CategoryMeta {
  key: CategoryKey;
  label: string;
  description: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryMeta[] = [
  { key: 'general', label: '1. General', description: 'Store identity, currency, phone & timezone', icon: Globe },
  { key: 'branding', label: '2. Branding', description: 'Logos, favicons, brand placeholders', icon: Palette },
  { key: 'appearance', label: '3. Appearance', description: 'Color palette, fonts, buttons, grid density', icon: Layout },
  { key: 'homepage', label: '4. Homepage', description: 'Hero banner, deals, badges & layout sections', icon: Home },
  { key: 'products', label: '5. Products', description: 'Catalog layout, stock badges, buy now toggles', icon: Package },
  { key: 'categories', label: '6. Categories', description: 'Category cards display & counts', icon: FolderTree },
  { key: 'cart', label: '7. Shopping Cart', description: 'Cart behavior, shipping estimator & cross-sells', icon: ShoppingCart },
  { key: 'checkout', label: '8. Checkout', description: 'Field requirements, guest checkout & terms', icon: CreditCard },
  { key: 'customers', label: '9. Customers', description: 'Account creation, default roles, verification', icon: Users },
  { key: 'orders', label: '10. Orders', description: 'Number prefix, default status, cancellation', icon: ClipboardList },
  { key: 'delivery', label: '11. Delivery', description: 'Uganda delivery zones, rates & pickup hubs', icon: Truck },
  { key: 'payments', label: '12. Payments', description: 'MTN MoMo, Airtel, Bank Transfer, COD', icon: DollarSign },
  { key: 'taxes', label: '13. Taxes', description: 'VAT rate, tax calculation & display', icon: Percent },
  { key: 'coupons', label: '14. Coupons', description: 'Discount codes, welcome discounts', icon: Ticket },
  { key: 'reviews', label: '15. Reviews', description: 'Customer ratings, photo reviews, approval', icon: Star },
  { key: 'wishlist', label: '16. Wishlist', description: 'Wishlist sharing, guest access', icon: Heart },
  { key: 'notifications', label: '17. Notifications', description: 'Automated order status triggers', icon: Bell },
  { key: 'email', label: '18. Email', description: 'SMTP configuration & notification templates', icon: Mail },
  { key: 'sms', label: '19. SMS', description: 'Uganda SMS gateway & dispatch alerts', icon: MessageSquare },
  { key: 'whatsapp', label: '20. WhatsApp', description: 'Kampala WhatsApp live chat & orders', icon: PhoneCall },
  { key: 'seo', label: '21. SEO', description: 'Meta titles, keywords, OpenGraph images', icon: Search },
  { key: 'social', label: '22. Social Media', description: 'Facebook, X, Instagram, TikTok links', icon: Share2 },
  { key: 'analytics', label: '23. Analytics', description: 'Google Analytics 4 & Meta Pixel IDs', icon: BarChart3 },
  { key: 'security', label: '24. Security', description: 'Rate limiting, lockout rules, session timeout', icon: Shield },
  { key: 'auth', label: '25. Authentication', description: 'Password complexity, 2FA, session rules', icon: Key },
  { key: 'performance', label: '26. Performance', description: 'Cache TTL, lazy loading, search debounce', icon: Zap },
  { key: 'api', label: '27. API', description: 'Rate limits, CORS, webhook secrets', icon: Cpu },
  { key: 'woocommerce', label: '28. WooCommerce', description: 'Remote store sync, sync intervals', icon: RefreshCw },
  { key: 'maintenance', label: '29. Maintenance', description: 'Store offline message & admin bypass', icon: Power },
  { key: 'legal', label: '30. Legal', description: 'Terms, Privacy, Returns & Cookie consent', icon: FileText },
  { key: 'advanced', label: '31. Advanced', description: 'Custom CSS, head scripts & debug mode', icon: Code2 },
  { key: 'pos', label: '32. Point of Sale (POS)', description: 'Register terminal access, cashier permissions & receipts', icon: Store },
];

export const AdminSettingsCenter: React.FC = () => {
  const { config, updateCategorySettings, showToast, setCurrentView } = useShop();

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [localConfig, setLocalConfig] = useState<MarketplaceConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [newCashierEmail, setNewCashierEmail] = useState('');

  // WooCommerce & API Interactive Testing / Sync State
  const [showConsumerKey, setShowConsumerKey] = useState(false);
  const [showConsumerSecret, setShowConsumerSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency_ms?: number } | null>(null);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [fetchResult, setFetchResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [fetchPerPage, setFetchPerPage] = useState(5000);
  const [fetchAppend, setFetchAppend] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [wcStatus, setWcStatus] = useState<any>(null);

  // SMS Settings & Live Testing State
  const [showSmsApiKey, setShowSmsApiKey] = useState(false);
  const [showSmsSecret, setShowSmsSecret] = useState(false);
  const [smsTestPhone, setSmsTestPhone] = useState('+256779743101');
  const [smsTestMsg, setSmsTestMsg] = useState('Cyber Dynamic Tech Uganda: This is a test dispatch from the SMS Gateway settings console.');
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [smsTestFeedback, setSmsTestFeedback] = useState<{ success: boolean; message: string; status?: string } | null>(null);
  const [smsLogs, setSmsLogs] = useState<SmsLogEntry[]>([]);
  const [isLoadingSmsLogs, setIsLoadingSmsLogs] = useState(false);

  // Customer Broadcast Notification State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'high'>('normal');
  const [broadcastView, setBroadcastView] = useState('shop');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const loadSmsLogs = async () => {
    setIsLoadingSmsLogs(true);
    try {
      const res = await api.getSmsLogs();
      if (res.logs) {
        setSmsLogs(res.logs);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingSmsLogs(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!smsTestPhone.trim()) {
      showToast('Please enter a recipient phone number');
      return;
    }
    setIsTestingSms(true);
    setSmsTestFeedback(null);
    try {
      const res = await api.sendTestSms(smsTestPhone, smsTestMsg);
      setSmsTestFeedback({
        success: res.success,
        message: res.message,
        status: res.status,
      });
      loadSmsLogs();
      showToast(res.message);
    } catch (err: any) {
      setSmsTestFeedback({
        success: false,
        message: err.message || 'SMS test failed',
        status: 'failed',
      });
      showToast('Failed to send test SMS');
    } finally {
      setIsTestingSms(false);
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast('Title and message are required to broadcast an announcement');
      return;
    }
    setIsBroadcasting(true);
    setBroadcastFeedback(null);
    try {
      const res = await api.broadcastAnnouncement({
        title: broadcastTitle,
        message: broadcastMessage,
        priority: broadcastPriority,
        view: broadcastView,
      });
      if (res.success) {
        setBroadcastFeedback({
          success: true,
          message: `Broadcasted "${broadcastTitle}" to customer in-app notification center.`,
        });
        showToast('Announcement broadcasted successfully!');
        setBroadcastTitle('');
        setBroadcastMessage('');
      }
    } catch (err: any) {
      setBroadcastFeedback({
        success: false,
        message: err.message || 'Broadcast failed',
      });
      showToast('Failed to broadcast announcement');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const loadWcStatus = async () => {
    try {
      const status = await api.getWooCommerceStatus();
      setWcStatus(status);
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    if (activeCategory === 'woocommerce' || activeCategory === 'api') {
      loadWcStatus();
    }
    if (activeCategory === 'sms') {
      loadSmsLogs();
    }
  }, [activeCategory]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const storeUrl =
        localConfig.woocommerce?.store_url ||
        localConfig.api?.woocommerce_store_url ||
        'https://www.cyberdynamictech.com';
      const consumerKey =
        localConfig.woocommerce?.consumer_key ||
        localConfig.api?.woocommerce_consumer_key ||
        '';
      const consumerSecret =
        localConfig.woocommerce?.consumer_secret ||
        localConfig.api?.woocommerce_consumer_secret ||
        '';
      const apiVersion =
        localConfig.woocommerce?.api_version ||
        localConfig.api?.woocommerce_api_version ||
        'wc/v3';

      // Only send keys if user has typed a fresh unmasked key in the form
      const hasFreshKey = consumerKey && !consumerKey.includes('•') && !consumerKey.includes('*');
      const hasFreshSecret = consumerSecret && !consumerSecret.includes('•') && !consumerSecret.includes('*');

      const res = await api.testWooCommerceConnection({
        store_url: storeUrl,
        api_version: apiVersion,
        ...(hasFreshKey ? { consumer_key: consumerKey } : {}),
        ...(hasFreshSecret ? { consumer_secret: consumerSecret } : {}),
      });

      setTestResult({
        success: res.success,
        message: res.message,
        latency_ms: res.latency_ms,
      });
      showToast(res.success ? 'WooCommerce connection successful!' : `Connection test failed: ${res.message}`);
      loadWcStatus();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to WooCommerce API',
      });
      showToast('Connection test error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleFetchProducts = async () => {
    setIsFetchingProducts(true);
    setFetchResult(null);
    try {
      const storeUrl =
        localConfig.woocommerce?.store_url ||
        localConfig.api?.woocommerce_store_url ||
        'https://www.cyberdynamictech.com';
      const consumerKey =
        localConfig.woocommerce?.consumer_key ||
        localConfig.api?.woocommerce_consumer_key ||
        '';
      const consumerSecret =
        localConfig.woocommerce?.consumer_secret ||
        localConfig.api?.woocommerce_consumer_secret ||
        '';
      const apiVersion =
        localConfig.woocommerce?.api_version ||
        localConfig.api?.woocommerce_api_version ||
        'wc/v3';

      const hasFreshKey = consumerKey && !consumerKey.includes('•') && !consumerKey.includes('*');
      const hasFreshSecret = consumerSecret && !consumerSecret.includes('•') && !consumerSecret.includes('*');

      // If user typed fresh unmasked keys, update backend settings
      if (hasFreshKey || hasFreshSecret) {
        await updateCategorySettings('woocommerce', {
          ...localConfig.woocommerce,
          ...(hasFreshKey ? { consumer_key: consumerKey } : {}),
          ...(hasFreshSecret ? { consumer_secret: consumerSecret } : {}),
        });
      }

      const res = await api.fetchWooCommerceProducts({
        store_url: storeUrl,
        api_version: apiVersion,
        per_page: fetchPerPage,
        append: fetchAppend,
        ...(hasFreshKey ? { consumer_key: consumerKey } : {}),
        ...(hasFreshSecret ? { consumer_secret: consumerSecret } : {}),
      });

      setFetchResult({
        success: res.success,
        message: res.message,
        count: res.fetched_count,
      });
      showToast(res.message);
      loadWcStatus();
    } catch (err: any) {
      setFetchResult({
        success: false,
        message: err.message || 'Failed to fetch products from WooCommerce',
      });
      showToast('Failed to fetch products');
    } finally {
      setIsFetchingProducts(false);
    }
  };

  const handleClearCatalog = async () => {
    if (!confirm('Are you sure you want to clear all products from the store catalog? You can then fetch your live products from WooCommerce.')) {
      return;
    }
    setIsClearing(true);
    try {
      const res = await api.clearProductsCatalog();
      showToast(res.message);
      loadWcStatus();
    } catch (err: any) {
      showToast(err.message || 'Failed to clear catalog');
    } finally {
      setIsClearing(false);
    }
  };

  // Sync when config updates
  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleFieldChange = (category: CategoryKey, field: string, value: any) => {
    setLocalConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
    setSaveSuccessMsg(null);
  };

  const handleSaveCurrent = async () => {
    setIsSaving(true);
    try {
      await updateCategorySettings(activeCategory, localConfig[activeCategory]);
      setSaveSuccessMsg(`Settings for "${CATEGORIES.find(c => c.key === activeCategory)?.label}" saved successfully.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCurrent = () => {
    if (confirm(`Reset "${activeCategory}" to factory defaults?`)) {
      const defaultCat = DEFAULT_MARKETPLACE_CONFIG[activeCategory];
      setLocalConfig((prev) => ({
        ...prev,
        [activeCategory]: defaultCat,
      }));
      updateCategorySettings(activeCategory, defaultCat);
      showToast(`Category ${activeCategory} reset to default`);
    }
  };

  const filteredCategories = CATEGORIES.filter(
    (c) =>
      c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMeta = CATEGORIES.find((c) => c.key === activeCategory)!;
  const currentValues = localConfig[activeCategory] as any;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[720px]">
      {/* Category Navigation Sidebar */}
      <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0">
        <div className="p-3.5 border-b border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              31 Settings Categories
            </span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
              v2.6
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search setting category..."
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto max-h-[640px] divide-y divide-slate-100 p-1.5 space-y-0.5">
          {filteredCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.key);
                  setSaveSuccessMsg(null);
                }}
                className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-xs font-bold'
                    : 'hover:bg-slate-200/70 text-slate-700'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate leading-tight">{cat.label}</p>
                  <p
                    className={`text-[10px] truncate mt-0.5 ${
                      isActive ? 'text-cyan-100' : 'text-slate-500'
                    }`}
                  >
                    {cat.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Form Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Category Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <currentMeta.icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">{currentMeta.label} Settings</h2>
              <p className="text-xs text-slate-500">{currentMeta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetCurrent}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleSaveCurrent}
              disabled={isSaving}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Setting Inputs Body */}
        <div className="p-5 overflow-y-auto max-h-[700px] space-y-5">
          {/* GENERAL CATEGORY */}
          {activeCategory === 'general' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Site / Marketplace Name</label>
                  <input
                    type="text"
                    value={currentValues.site_name}
                    onChange={(e) => handleFieldChange('general', 'site_name', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Displayed in page headers, invoices & notifications</p>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Site Tagline</label>
                  <input
                    type="text"
                    value={currentValues.site_tagline}
                    onChange={(e) => handleFieldChange('general', 'site_tagline', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Branded motto and subtitle</p>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Website URL</label>
                  <input
                    type="url"
                    value={currentValues.website_url}
                    onChange={(e) => handleFieldChange('general', 'website_url', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Contact Email Address</label>
                  <input
                    type="email"
                    value={currentValues.contact_email}
                    onChange={(e) => handleFieldChange('general', 'contact_email', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Uganda Phone Number</label>
                  <input
                    type="text"
                    value={currentValues.phone}
                    onChange={(e) => handleFieldChange('general', 'phone', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">WhatsApp Hotline Number</label>
                  <input
                    type="text"
                    value={currentValues.whatsapp}
                    onChange={(e) => handleFieldChange('general', 'whatsapp', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Primary Currency</label>
                  <select
                    value={currentValues.currency}
                    onChange={(e) => handleFieldChange('general', 'currency', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="UGX">UGX - Uganda Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="KES">KES - Kenya Shilling</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Currency Position</label>
                  <select
                    value={currentValues.currency_position}
                    onChange={(e) => handleFieldChange('general', 'currency_position', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="left">Left (UGX 2,500,000)</option>
                    <option value="right">Right (2,500,000 UGX)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Physical Business Address</label>
                <input
                  type="text"
                  value={currentValues.address}
                  onChange={(e) => handleFieldChange('general', 'address', e.target.value)}
                  className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {/* BRANDING CATEGORY */}
          {activeCategory === 'branding' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-600" />
                  <span>Logo Live Preview</span>
                </h3>
                <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-center min-h-[70px]">
                  {currentValues.main_logo ? (
                    <img
                      src={currentValues.main_logo}
                      alt="Brand Logo"
                      className="max-h-12 object-contain"
                    />
                  ) : (
                    <span className="text-slate-400 text-xs italic">No logo configured</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Main Store Logo URL</label>
                  <input
                    type="url"
                    value={currentValues.main_logo}
                    onChange={(e) => handleFieldChange('branding', 'main_logo', e.target.value)}
                    placeholder="https://www.cyberdynamictech.com/wp-content/uploads/...logo.png"
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Default logo loaded across headers and navbar</p>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Mobile Logo URL</label>
                  <input
                    type="url"
                    value={currentValues.mobile_logo || ''}
                    onChange={(e) => handleFieldChange('branding', 'mobile_logo', e.target.value)}
                    placeholder="Compact icon/logo for small screens"
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Favicon URL</label>
                  <input
                    type="url"
                    value={currentValues.favicon || ''}
                    onChange={(e) => handleFieldChange('branding', 'favicon', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Default Product Placeholder Image</label>
                  <input
                    type="url"
                    value={currentValues.default_product_placeholder || ''}
                    onChange={(e) => handleFieldChange('branding', 'default_product_placeholder', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="pt-2">
                  <ThemeColorSetting mode="full" />
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE CATEGORY */}
          {activeCategory === 'appearance' && (
            <div className="space-y-5 text-xs">
              <ThemeColorSetting mode="full" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Border Radius Style</label>
                  <select
                    value={currentValues.border_radius}
                    onChange={(e) => handleFieldChange('appearance', 'border_radius', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="none">Sharp Corners (0px)</option>
                    <option value="small">Subtle (4px)</option>
                    <option value="medium">Modern Rounded (8px)</option>
                    <option value="large">Card Curved (12px)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Default Theme Mode</label>
                  <select
                    value={currentValues.theme_mode}
                    onChange={(e) => handleFieldChange('appearance', 'theme_mode', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="light">Crisp Light Mode</option>
                    <option value="dark">Tech Dark Mode</option>
                    <option value="system">Follow User Device</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Desktop Grid Columns</label>
                  <select
                    value={currentValues.product_grid_columns}
                    onChange={(e) => handleFieldChange('appearance', 'product_grid_columns', Number(e.target.value))}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value={3}>3 Columns</option>
                    <option value={4}>4 Columns (Default)</option>
                    <option value={5}>5 Columns (Dense)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Mobile Grid Columns</label>
                  <select
                    value={currentValues.mobile_grid_columns}
                    onChange={(e) => handleFieldChange('appearance', 'mobile_grid_columns', Number(e.target.value))}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value={1}>1 Column (List style)</option>
                    <option value={2}>2 Columns (Standard mobile)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* HOMEPAGE CATEGORY */}
          {activeCategory === 'homepage' && (
            <div className="space-y-4 text-xs">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs">Hero Banner Setup</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Banner Title</label>
                    <input
                      type="text"
                      value={currentValues.hero_title || ''}
                      onChange={(e) => handleFieldChange('homepage', 'hero_title', e.target.value)}
                      placeholder="Welcome to Cyber Dynamic Tech"
                      className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Banner Subtitle</label>
                    <input
                      type="text"
                      value={currentValues.hero_subtitle || ''}
                      onChange={(e) => handleFieldChange('homepage', 'hero_subtitle', e.target.value)}
                      placeholder="Genuine Laptops, Printers & Networking in Uganda"
                      className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">Homepage Sections Visibility</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'hero', label: 'Hero Slides / Announcements' },
                    { id: 'flash_sale', label: 'Flash Sale Countdown' },
                    { id: 'categories', label: 'Browse Categories Grid' },
                    { id: 'featured_products', label: 'Featured Products' },
                    { id: 'best_sellers', label: 'Best Sellers' },
                    { id: 'new_arrivals', label: 'New Arrivals' },
                    { id: 'recently_viewed', label: 'Recently Viewed' },
                  ].map((sec) => {
                    const isEnabled = currentValues.sections?.some((s: any) => s.id === sec.id && s.enabled);
                    return (
                      <label
                        key={sec.id}
                        className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(isEnabled)}
                          onChange={(e) => {
                            const updated = (currentValues.sections || []).map((s: any) =>
                              s.id === sec.id ? { ...s, enabled: e.target.checked } : s
                            );
                            handleFieldChange('homepage', 'sections', updated);
                          }}
                          className="rounded text-cyan-600"
                        />
                        <span className="font-bold text-slate-700 text-xs">{sec.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS CATEGORY */}
          {activeCategory === 'products' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Products Per Page</label>
                  <input
                    type="number"
                    value={currentValues.products_per_page}
                    onChange={(e) => handleFieldChange('products', 'products_per_page', Number(e.target.value))}
                    min={4}
                    max={48}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Default Sorting</label>
                  <select
                    value={currentValues.default_sort}
                    onChange={(e) => handleFieldChange('products', 'default_sort', e.target.value)}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="popularity">Popularity / Best Selling</option>
                    <option value="latest">Newest Arrivals</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800 block mb-1">Catalog Feature Toggles</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'enable_wishlist', label: 'Customer Wishlist' },
                    { key: 'enable_reviews', label: 'Customer Reviews & Star Ratings' },
                    { key: 'enable_quick_view', label: 'Quick View Modal' },
                    { key: 'enable_buy_now', label: 'Direct "Buy Now" Checkout' },
                    { key: 'enable_add_to_cart', label: 'Standard Add to Cart' },
                    { key: 'show_sku', label: 'Display Product SKU' },
                    { key: 'show_stock', label: 'Display Stock Quantity / Status' },
                    { key: 'show_discount_percentage', label: 'Show Discount Percentage Badges' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(currentValues[item.key])}
                        onChange={(e) => handleFieldChange('products', item.key, e.target.checked)}
                        className="rounded text-cyan-600"
                      />
                      <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHECKOUT CATEGORY */}
          {activeCategory === 'checkout' && (
            <div className="space-y-3 text-xs">
              <span className="font-bold text-slate-800 block mb-1">Checkout Policy & Field Controls</span>
              <div className="space-y-2">
                {[
                  { key: 'guest_checkout', label: 'Allow Guest Checkout (No account required)' },
                  { key: 'require_account', label: 'Strictly Require User Account Before Ordering' },
                  { key: 'phone_required', label: 'Require Uganda Phone Number at Checkout' },
                  { key: 'email_required', label: 'Require Customer Email Address' },
                  { key: 'delivery_instructions_enabled', label: 'Enable Delivery Notes & Landmarks Input' },
                  { key: 'coupon_field_enabled', label: 'Display Coupon / Promo Code Input' },
                  { key: 'terms_acceptance_required', label: 'Require Terms of Service Checkbox' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(currentValues[item.key])}
                      onChange={(e) => handleFieldChange('checkout', item.key, e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <span className="text-xs font-bold text-slate-800">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* DELIVERY CATEGORY */}
          {activeCategory === 'delivery' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">Uganda Delivery Zones & Rates</span>
                <span className="text-[11px] text-slate-500">Free delivery minimum: UGX {(currentValues.free_delivery_minimum || 500000).toLocaleString()}</span>
              </div>

              <div className="space-y-2">
                {(currentValues.zones || []).map((zone: any, idx: number) => (
                  <div
                    key={zone.id || idx}
                    className="p-3 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{zone.name}</p>
                      <p className="text-[11px] text-slate-500">{zone.estimated_time} • {zone.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">UGX:</span>
                      <input
                        type="number"
                        value={zone.rate}
                        onChange={(e) => {
                          const updated = [...currentValues.zones];
                          updated[idx] = { ...updated[idx], rate: Number(e.target.value) };
                          handleFieldChange('delivery', 'zones', updated);
                        }}
                        className="w-24 h-7.5 px-2 bg-white border border-slate-200 rounded text-xs font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAYMENTS CATEGORY */}
          {activeCategory === 'payments' && (
            <div className="space-y-5 text-xs">
              <div>
                <span className="font-bold text-slate-800 block mb-1">Accepted Payment Gateways</span>
                <p className="text-[11px] text-slate-500 mb-3">Enable or disable supported payment methods for checkout</p>
                <div className="space-y-2.5">
                  {[
                    { key: 'cash_on_delivery', title: 'Cash on Delivery (COD)', desc: 'Customers pay in cash when goods are inspected and delivered' },
                    { key: 'mtn_momo', title: 'MTN Mobile Money Uganda', desc: 'Direct merchant collection or manual prompt' },
                    { key: 'airtel_money', title: 'Airtel Money Uganda', desc: 'Secure mobile money transaction' },
                    { key: 'bank_transfer', title: 'Direct Bank Wire (Stanbic / Centenary)', desc: 'For corporate computer procurement' },
                    { key: 'flutterwave_enabled', title: 'Card & Visa Processing', desc: 'International and local debit cards' },
                  ].map((gate) => (
                    <div key={gate.key} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{gate.title}</p>
                        <p className="text-[11px] text-slate-500">{gate.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(currentValues[gate.key])}
                          onChange={(e) => handleFieldChange('payments', gate.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Manual Mobile Money & Transfer Account Details */}
              <div className="p-4 bg-cyan-50/60 border border-cyan-200 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-600 animate-pulse" />
                  <h4 className="font-bold text-slate-900 text-sm">Payment Landing Page & Mobile Money Account Details</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  These details are displayed to customers on the post-checkout payment landing page for Mobile Money and direct bank payments.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Payment Mobile / Phone Number *
                    </label>
                    <input
                      type="text"
                      value={currentValues['manual_payment_number'] ?? '0394 760459'}
                      onChange={(e) => handleFieldChange('payments', 'manual_payment_number', e.target.value)}
                      placeholder="e.g. 0394 760459"
                      className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">Customers will see a 1-click Copy button for this number</p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      value={currentValues['manual_account_name'] ?? 'CYBER DYNAMIC TECH'}
                      onChange={(e) => handleFieldChange('payments', 'manual_account_name', e.target.value)}
                      placeholder="e.g. CYBER DYNAMIC TECH"
                      className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold uppercase focus:outline-hidden focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">Name displayed on MTN/Airtel receiver confirmation</p>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Custom Customer Prompt Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={
                      currentValues['manual_payment_instructions'] ??
                      `Make the payment to ${currentValues['manual_payment_number'] || '0394 760459'} and put accounts names ${currentValues['manual_account_name'] || 'CYBER DYNAMIC TECH'}, please use order number as id`
                    }
                    onChange={(e) => handleFieldChange('payments', 'manual_payment_instructions', e.target.value)}
                    placeholder="Make the payment to 0394 760459 and put accounts names CYBER DYNAMIC TECH, please use order number as id"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Live message displayed on customer screen upon checkout
                  </p>
                </div>

                {/* Preview Box */}
                <div className="p-3 bg-white border border-cyan-300 rounded-lg space-y-1.5 shadow-2xs">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-800 block">
                    Customer Screen Preview
                  </span>
                  <p className="font-bold text-slate-900 text-xs">
                    "Make the payment to <span className="font-mono text-cyan-700 bg-cyan-50 px-1 py-0.5 rounded border border-cyan-200">{currentValues['manual_payment_number'] || '0394 760459'}</span> and put accounts names <span className="text-slate-900 underline font-extrabold">{currentValues['manual_account_name'] || 'CYBER DYNAMIC TECH'}</span>, please use order number as id"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* WOOCOMMERCE CATEGORY */}
          {activeCategory === 'woocommerce' && (
            <div className="space-y-5 text-xs">
              {/* WooCommerce Live Status Overview Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        testResult?.success || wcStatus?.status === 'configured' || wcStatus?.configured ? 'bg-emerald-400' : 'bg-amber-400'
                      }`} />
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${
                        testResult?.success || wcStatus?.status === 'configured' || wcStatus?.configured ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">WooCommerce Remote Sync & API Engine</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      testResult?.success || wcStatus?.status === 'configured' || wcStatus?.configured
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {testResult?.success
                        ? `Connected (${testResult.latency_ms}ms)`
                        : wcStatus?.status === 'configured' || wcStatus?.configured
                        ? 'Configured'
                        : 'Setup Required'}
                    </span>
                    <button
                      type="button"
                      onClick={loadWcStatus}
                      className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-200/60"
                      title="Refresh status"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </div>

                <p className="text-slate-600 text-[11.5px] leading-relaxed">
                  Connect your live WooCommerce online store to synchronize products, stock counts, categories, and images in real-time. Enter your WordPress URL, Consumer Key, and Consumer Secret below.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10.5px] text-slate-400 block font-medium">Catalog Products</span>
                    <span className="text-sm font-bold text-slate-800">
                      {wcStatus?.catalog_products_count ?? currentValues.products_count ?? 0}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10.5px] text-slate-400 block font-medium">API Version</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">
                      {currentValues.api_version || 'wc/v3'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10.5px] text-slate-400 block font-medium">Consumer Key</span>
                    <span className={`text-sm font-bold ${currentValues.consumer_key_configured || wcStatus?.consumer_key_configured ? 'text-emerald-700' : 'text-amber-600'}`}>
                      {currentValues.consumer_key_configured || wcStatus?.consumer_key_configured ? '✓ Configured' : 'Missing'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10.5px] text-slate-400 block font-medium">Consumer Secret</span>
                    <span className={`text-sm font-bold ${currentValues.consumer_secret_configured || wcStatus?.consumer_secret_configured ? 'text-emerald-700' : 'text-amber-600'}`}>
                      {currentValues.consumer_secret_configured || wcStatus?.consumer_secret_configured ? '✓ Configured' : 'Missing'}
                    </span>
                  </div>
                </div>

                {/* Connection test result banner */}
                {testResult && (
                  <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                    testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {testResult.success ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />}
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs">{testResult.success ? 'Connection Successful' : 'Connection Failed'}</p>
                      <p className="text-[11px] opacity-90">{testResult.message}</p>
                      {testResult.latency_ms && (
                        <p className="text-[10.5px] font-mono opacity-80">Server round-trip latency: {testResult.latency_ms} ms</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Fetch products result banner */}
                {fetchResult && (
                  <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                    fetchResult.success ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {fetchResult.success ? <CheckCircle2 size={16} className="shrink-0 text-blue-600 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />}
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs">{fetchResult.success ? 'Products Imported' : 'Fetch Failed'}</p>
                      <p className="text-[11px] opacity-90">{fetchResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* API Credentials Configuration */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={14} className="text-cyan-600" /> WooCommerce API Credentials
                </h4>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    WooCommerce Store URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={currentValues.store_url || ''}
                    onChange={(e) => handleFieldChange('woocommerce', 'store_url', e.target.value)}
                    placeholder="https://www.cyberdynamictech.com"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">The root URL of your WordPress WooCommerce installation</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800 block flex items-center gap-1.5">
                        Consumer Key (CK)
                        {(currentValues.consumer_key_configured || wcStatus?.consumer_key_configured) && (
                          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🔒 Server Stored
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowConsumerKey(!showConsumerKey)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        {showConsumerKey ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showConsumerKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showConsumerKey ? 'text' : 'password'}
                      value={currentValues.consumer_key || ''}
                      onChange={(e) => handleFieldChange('woocommerce', 'consumer_key', e.target.value)}
                      placeholder={
                        currentValues.consumer_key_configured || wcStatus?.consumer_key_configured
                          ? '•••••••• (Stored securely in server environment)'
                          : 'ck_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                      }
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Configured server-side via WOOCOMMERCE_CONSUMER_KEY or input above to update.</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800 block flex items-center gap-1.5">
                        Consumer Secret (CS)
                        {(currentValues.consumer_secret_configured || wcStatus?.consumer_secret_configured) && (
                          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🔒 Server Stored
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowConsumerSecret(!showConsumerSecret)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        {showConsumerSecret ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showConsumerSecret ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showConsumerSecret ? 'text' : 'password'}
                      value={currentValues.consumer_secret || ''}
                      onChange={(e) => handleFieldChange('woocommerce', 'consumer_secret', e.target.value)}
                      placeholder={
                        currentValues.consumer_secret_configured || wcStatus?.consumer_secret_configured
                          ? '•••••••• (Stored securely in server environment)'
                          : 'cs_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                      }
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Configured server-side via WOOCOMMERCE_CONSUMER_SECRET or input above to update.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">REST API Version</label>
                    <select
                      value={currentValues.api_version || 'wc/v3'}
                      onChange={(e) => handleFieldChange('woocommerce', 'api_version', e.target.value)}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="wc/v3">wc/v3 (Recommended, WooCommerce 3.5+)</option>
                      <option value="wc/v2">wc/v2 (Legacy)</option>
                      <option value="wc/v1">wc/v1 (Legacy)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Sync Schedule Frequency</label>
                    <select
                      value={currentValues.sync_frequency || 'realtime_webhook'}
                      onChange={(e) => handleFieldChange('woocommerce', 'sync_frequency', e.target.value)}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="realtime_webhook">Realtime Webhooks (Fastest)</option>
                      <option value="every_15_mins">Every 15 Minutes</option>
                      <option value="every_hour">Every 1 Hour</option>
                      <option value="every_6_hours">Every 6 Hours</option>
                      <option value="daily">Daily Overnight Sync</option>
                      <option value="manual">Manual Trigger Only</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentValues.verify_ssl ?? true)}
                      onChange={(e) => handleFieldChange('woocommerce', 'verify_ssl', e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Verify HTTPS SSL Certificate</span>
                      <span className="text-[10.5px] text-slate-500">Ensure secure communication with WooCommerce host</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentValues.auto_sync_on_startup)}
                      onChange={(e) => handleFieldChange('woocommerce', 'auto_sync_on_startup', e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Auto-Sync on Startup</span>
                      <span className="text-[10.5px] text-slate-500">Fetch updated catalog when server initializes</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Controls: Test, Fetch, Clear */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-4 bg-slate-50/50">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal size={14} className="text-cyan-600" /> Live API Operations
                </h4>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Test Connection Button */}
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg font-bold text-xs shadow-xs disabled:opacity-50 transition-colors"
                  >
                    <Activity size={14} className={isTesting ? 'animate-spin text-cyan-600' : 'text-cyan-600'} />
                    {isTesting ? 'Testing Connection...' : 'Test API Connection'}
                  </button>

                  {/* Clear Catalog Button */}
                  <button
                    type="button"
                    onClick={handleClearCatalog}
                    disabled={isClearing}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg font-bold text-xs shadow-xs disabled:opacity-50 transition-colors"
                    title="Clear dummy products or reset catalog"
                  >
                    <Trash2 size={14} className="text-rose-500" />
                    {isClearing ? 'Clearing Catalog...' : 'Clear Store Catalog'}
                  </button>
                </div>

                {/* Fetch Products section */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Fetch Products from WooCommerce</span>
                      <p className="text-[11px] text-slate-500">Imports published products, variations, categories, and images from your connected store.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span>Items:</span>
                        <select
                          value={fetchPerPage}
                          onChange={(e) => setFetchPerPage(Number(e.target.value))}
                          className="h-7.5 px-2 border border-slate-200 rounded text-xs bg-white font-medium"
                        >
                          <option value={5000}>5000 (Fetch All Live)</option>
                          <option value={1000}>1000</option>
                          <option value={500}>500</option>
                          <option value={100}>100</option>
                          <option value={50}>50</option>
                          <option value={20}>20</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fetchAppend}
                          onChange={(e) => setFetchAppend(e.target.checked)}
                          className="rounded text-cyan-600"
                        />
                        <span>Append</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleFetchProducts}
                      disabled={isFetchingProducts}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-xs shadow-xs disabled:opacity-50 transition-colors"
                    >
                      <DownloadCloud size={14} className={isFetchingProducts ? 'animate-bounce' : ''} />
                      {isFetchingProducts ? 'Fetching from WooCommerce...' : 'Fetch Live Products Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API SETTINGS CATEGORY (Category 27) */}
          {activeCategory === 'api' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-cyan-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Store API & WooCommerce Integration</h3>
                </div>
                <p className="text-slate-600 text-[11.5px] leading-relaxed">
                  Configure REST API endpoints, CORS origins, rate limits, and WooCommerce synchronization keys. All settings take effect immediately when saved.
                </p>
              </div>

              {/* WooCommerce API Credentials inside API category */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Key size={14} className="text-cyan-600" /> WooCommerce API Connection
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentValues.woocommerce_api_enabled ?? true)}
                      onChange={(e) => handleFieldChange('api', 'woocommerce_api_enabled', e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <span className="font-bold text-slate-700 text-xs">Enable Integration</span>
                  </label>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">WooCommerce Store URL</label>
                  <input
                    type="url"
                    value={currentValues.woocommerce_store_url || currentValues.store_url || ''}
                    onChange={(e) => {
                      handleFieldChange('api', 'woocommerce_store_url', e.target.value);
                      handleFieldChange('woocommerce', 'store_url', e.target.value);
                    }}
                    placeholder="https://www.cyberdynamictech.com"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800 block">Consumer Key</label>
                      <button
                        type="button"
                        onClick={() => setShowConsumerKey(!showConsumerKey)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        {showConsumerKey ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showConsumerKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showConsumerKey ? 'text' : 'password'}
                      value={currentValues.woocommerce_consumer_key || currentValues.consumer_key || ''}
                      onChange={(e) => {
                        handleFieldChange('api', 'woocommerce_consumer_key', e.target.value);
                        handleFieldChange('woocommerce', 'consumer_key', e.target.value);
                      }}
                      placeholder={
                        currentValues.consumer_key_configured || wcStatus?.consumer_key_configured
                          ? '•••••••• (Stored securely in server environment)'
                          : 'ck_live_...'
                      }
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800 block">Consumer Secret</label>
                      <button
                        type="button"
                        onClick={() => setShowConsumerSecret(!showConsumerSecret)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        {showConsumerSecret ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showConsumerSecret ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showConsumerSecret ? 'text' : 'password'}
                      value={currentValues.woocommerce_consumer_secret || currentValues.consumer_secret || ''}
                      onChange={(e) => {
                        handleFieldChange('api', 'woocommerce_consumer_secret', e.target.value);
                        handleFieldChange('woocommerce', 'consumer_secret', e.target.value);
                      }}
                      placeholder={
                        currentValues.consumer_secret_configured || wcStatus?.consumer_secret_configured
                          ? '•••••••• (Stored securely in server environment)'
                          : 'cs_live_...'
                      }
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg font-bold text-xs"
                  >
                    <Activity size={14} className={isTesting ? 'animate-spin text-cyan-600' : 'text-cyan-600'} />
                    {isTesting ? 'Testing Connection...' : 'Test API Connection'}
                  </button>

                  <button
                    type="button"
                    onClick={handleFetchProducts}
                    disabled={isFetchingProducts}
                    className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-xs"
                  >
                    <DownloadCloud size={14} />
                    {isFetchingProducts ? 'Fetching Products...' : 'Fetch Live Products'}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearCatalog}
                    disabled={isClearing}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg font-bold text-xs"
                  >
                    <Trash2 size={14} className="text-rose-500" />
                    {isClearing ? 'Clearing Catalog...' : 'Clear Catalog'}
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                    testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {testResult.success ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />}
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs">{testResult.success ? 'Connection Successful' : 'Connection Failed'}</p>
                      <p className="text-[11px] opacity-90">{testResult.message}</p>
                      {testResult.latency_ms && <p className="text-[10.5px] font-mono">Latency: {testResult.latency_ms} ms</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Rate Limiting & Security Controls */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={14} className="text-cyan-600" /> API Security & Traffic Controls
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentValues.rate_limit_enabled ?? true)}
                      onChange={(e) => handleFieldChange('api', 'rate_limit_enabled', e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Enable Rate Limiting</span>
                      <span className="text-[10.5px] text-slate-500">Protect endpoints against abuse and DoS</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentValues.cors_enabled ?? true)}
                      onChange={(e) => handleFieldChange('api', 'cors_enabled', e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Enable CORS Restrictions</span>
                      <span className="text-[10.5px] text-slate-500">Restrict API access to authorized domain origins</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Max Requests per Window</label>
                    <input
                      type="number"
                      value={currentValues.rate_limit_requests ?? 100}
                      onChange={(e) => handleFieldChange('api', 'rate_limit_requests', Number(e.target.value))}
                      className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Window Period (Seconds)</label>
                    <input
                      type="number"
                      value={currentValues.rate_limit_window_seconds ?? 60}
                      onChange={(e) => handleFieldChange('api', 'rate_limit_window_seconds', Number(e.target.value))}
                      className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Allowed CORS Origins (comma separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(currentValues.cors_origins) ? currentValues.cors_origins.join(', ') : (currentValues.cors_origins || '*')}
                    onChange={(e) => {
                      const origins = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                      handleFieldChange('api', 'cors_origins', origins);
                    }}
                    placeholder="https://cyberdynamictech.com, https://localhost:3000"
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 block">Webhook Verification Secret</label>
                    <button
                      type="button"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      {showWebhookSecret ? <EyeOff size={12} /> : <Eye size={12} />}
                      {showWebhookSecret ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showWebhookSecret ? 'text' : 'password'}
                    value={currentValues.webhook_secret || ''}
                    onChange={(e) => handleFieldChange('api', 'webhook_secret', e.target.value)}
                    placeholder="whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Used to verify authenticity of incoming order update webhooks from WooCommerce</p>
                </div>
              </div>
            </div>
          )}

          {/* MAINTENANCE CATEGORY */}
          {activeCategory === 'maintenance' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-amber-900 text-xs">Enable Store Maintenance Mode</p>
                  <p className="text-[11px] text-amber-700">When enabled, visitors see a maintenance screen. Administrators remain logged in.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(currentValues.enabled)}
                    onChange={(e) => handleFieldChange('maintenance', 'enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Maintenance Notice Message</label>
                <textarea
                  rows={3}
                  value={currentValues.message || ''}
                  onChange={(e) => handleFieldChange('maintenance', 'message', e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Expected Reopening Time / Date</label>
                <input
                  type="text"
                  value={currentValues.expected_reopening || ''}
                  onChange={(e) => handleFieldChange('maintenance', 'expected_reopening', e.target.value)}
                  placeholder="e.g. Back online today at 2:00 PM EAT"
                  className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {/* POINT OF SALE (POS) CATEGORY */}
          {activeCategory === 'pos' && (
            <div className="space-y-6 text-xs">
              {/* POS Terminal Banner & Status */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-cyan-950 border border-cyan-800/60 rounded-xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white">In-Store Point of Sale (POS) Terminal</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {currentValues.enabled !== false ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Fast physical counter checkout, barcode scanner support, mobile money/cash tenders & 80mm receipts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentView('pos')}
                    className="flex-1 sm:flex-none px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Launch POS Register</span>
                  </button>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={currentValues.enabled !== false}
                      onChange={(e) => handleFieldChange('pos', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              </div>

              {/* CASHIER ACCESS CONTROL & PERMISSIONS */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck className="w-4 h-4 text-cyan-600" />
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Cashier Authorization & Role Permissions
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Control who can open and operate the POS register. Administrators always have access. You can grant access by role or whitelist specific cashier accounts by email.
                  </p>
                </div>

                {/* Allowed Roles */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">Authorized User Roles:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Admin (Locked) */}
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-300 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-emerald-950 capitalize">Admin</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold">Always Allowed</span>
                    </div>

                    {/* Manager */}
                    <label className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={((currentValues.allowed_roles as string[]) || []).includes('manager')}
                        onChange={(e) => {
                          const current = (currentValues.allowed_roles as string[]) || ['admin', 'manager'];
                          const updated = e.target.checked
                            ? Array.from(new Set([...current, 'manager']))
                            : current.filter((r) => r !== 'manager');
                          handleFieldChange('pos', 'allowed_roles', updated);
                        }}
                        className="rounded text-cyan-600"
                      />
                      <span className="font-bold text-slate-800">Manager</span>
                    </label>

                    {/* Editor */}
                    <label className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={((currentValues.allowed_roles as string[]) || []).includes('editor')}
                        onChange={(e) => {
                          const current = (currentValues.allowed_roles as string[]) || ['admin', 'manager'];
                          const updated = e.target.checked
                            ? Array.from(new Set([...current, 'editor']))
                            : current.filter((r) => r !== 'editor');
                          handleFieldChange('pos', 'allowed_roles', updated);
                        }}
                        className="rounded text-cyan-600"
                      />
                      <span className="font-bold text-slate-800">Editor / Staff</span>
                    </label>

                    {/* Customer */}
                    <label className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={((currentValues.allowed_roles as string[]) || []).includes('customer')}
                        onChange={(e) => {
                          const current = (currentValues.allowed_roles as string[]) || ['admin', 'manager'];
                          const updated = e.target.checked
                            ? Array.from(new Set([...current, 'customer']))
                            : current.filter((r) => r !== 'customer');
                          handleFieldChange('pos', 'allowed_roles', updated);
                        }}
                        className="rounded text-cyan-600"
                      />
                      <span className="font-bold text-slate-800">Customer</span>
                    </label>
                  </div>
                </div>

                {/* Whitelisted Cashier User Emails */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="font-bold text-slate-800 block mb-1">
                    Allowed Cashier Users (Whitelist by Email Address):
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Specific users authorized to access the POS page, regardless of their role.
                  </p>

                  {/* Active tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px]">
                    {((currentValues.allowed_user_emails as string[]) || []).map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-100/70 border border-cyan-300 text-cyan-900 rounded-md font-mono text-[11px] font-semibold"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = (currentValues.allowed_user_emails as string[]) || [];
                            handleFieldChange(
                              'pos',
                              'allowed_user_emails',
                              list.filter((e) => e.toLowerCase() !== email.toLowerCase())
                            );
                          }}
                          className="text-cyan-700 hover:text-red-700 font-bold ml-1 cursor-pointer"
                          title="Revoke access"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {(!currentValues.allowed_user_emails || currentValues.allowed_user_emails.length === 0) && (
                      <span className="text-slate-400 italic text-[11px] py-1">
                        No specific email whitelist defined. Only Allowed Roles can access.
                      </span>
                    )}
                  </div>

                  {/* Add email input */}
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="email"
                      value={newCashierEmail}
                      onChange={(e) => setNewCashierEmail(e.target.value)}
                      placeholder="Enter staff email e.g. cashier@cyberdynamictech.com"
                      className="flex-1 h-8.5 px-3 border border-slate-300 rounded-lg text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = newCashierEmail.trim().toLowerCase();
                          if (val && val.includes('@')) {
                            const list = (currentValues.allowed_user_emails as string[]) || [];
                            if (!list.map((x) => x.toLowerCase()).includes(val)) {
                              handleFieldChange('pos', 'allowed_user_emails', [...list, val]);
                              setNewCashierEmail('');
                              showToast(`Added ${val} to authorized cashiers`);
                            }
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newCashierEmail.trim().toLowerCase();
                        if (!val || !val.includes('@')) {
                          showToast('Please enter a valid email address');
                          return;
                        }
                        const list = (currentValues.allowed_user_emails as string[]) || [];
                        if (list.map((x) => x.toLowerCase()).includes(val)) {
                          showToast('This email is already in the authorized list');
                          return;
                        }
                        handleFieldChange('pos', 'allowed_user_emails', [...list, val]);
                        setNewCashierEmail('');
                        showToast(`Added ${val} to authorized cashiers`);
                      }}
                      className="px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Authorize Email</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* REGISTER HARDWARE & CHECKOUT WORKFLOW */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Register Hardware & Counter Preferences
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quick Cash buttons */}
                  <label className="flex items-center gap-2.5 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentValues.enable_quick_cash_buttons !== false}
                      onChange={(e) => handleFieldChange('pos', 'enable_quick_cash_buttons', e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Quick Cash Tender Buttons</span>
                      <span className="text-[11px] text-slate-400">Show exact, 50k, 100k, 200k, 500k, 1M shortcuts</span>
                    </div>
                  </label>

                  {/* Allow Custom Line Items */}
                  <label className="flex items-center gap-2.5 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentValues.allow_custom_line_items !== false}
                      onChange={(e) => handleFieldChange('pos', 'allow_custom_line_items', e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Allow Custom Line Items</span>
                      <span className="text-[11px] text-slate-400">Ring up custom services (e.g. OS setup, repair labor)</span>
                    </div>
                  </label>

                  {/* Allow Manual Discounts */}
                  <label className="flex items-center gap-2.5 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentValues.allow_manual_discounts !== false}
                      onChange={(e) => handleFieldChange('pos', 'allow_manual_discounts', e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Allow Cashier Discounts</span>
                      <span className="text-[11px] text-slate-400">Permit custom percentage or UGX discount deductions</span>
                    </div>
                  </label>

                  {/* Auto Print Receipt */}
                  <label className="flex items-center gap-2.5 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentValues.print_receipt_on_complete)}
                      onChange={(e) => handleFieldChange('pos', 'print_receipt_on_complete', e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Auto-Prompt Thermal Print</span>
                      <span className="text-[11px] text-slate-400">Trigger printer dialog immediately on completed charge</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Default Tender Method</label>
                    <select
                      value={currentValues.default_payment_method || 'cash'}
                      onChange={(e) => handleFieldChange('pos', 'default_payment_method', e.target.value)}
                      className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="cash">Cash (Physical Cash Drawer)</option>
                      <option value="momo">MTN Mobile Money</option>
                      <option value="airtel">Airtel Money</option>
                      <option value="card">Credit / Debit Card Terminal</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Tax / VAT Rate (% URA)</label>
                    <input
                      type="number"
                      value={currentValues.tax_rate_percent !== undefined ? currentValues.tax_rate_percent : 18}
                      onChange={(e) => handleFieldChange('pos', 'tax_rate_percent', Number(e.target.value))}
                      className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* PHYSICAL STORE DETAILS ON RECEIPTS */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Store Identity on 80mm Thermal Receipts
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Store Name on Receipts</label>
                    <input
                      type="text"
                      value={currentValues.store_name || ''}
                      onChange={(e) => handleFieldChange('pos', 'store_name', e.target.value)}
                      placeholder="CYBER DYNAMIC TECH LIMITED"
                      className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Store Phone / Contact</label>
                    <input
                      type="text"
                      value={currentValues.store_phone || ''}
                      onChange={(e) => handleFieldChange('pos', 'store_phone', e.target.value)}
                      placeholder="+256 779 743 101"
                      className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-800 block mb-1">Physical Store Address</label>
                    <input
                      type="text"
                      value={currentValues.store_address || ''}
                      onChange={(e) => handleFieldChange('pos', 'store_address', e.target.value)}
                      placeholder="Kampala, Uganda"
                      className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-800 block mb-1">Receipt Warranty & Return Notice</label>
                    <textarea
                      rows={2}
                      value={currentValues.receipt_footer_text || ''}
                      onChange={(e) => handleFieldChange('pos', 'receipt_footer_text', e.target.value)}
                      placeholder="1-Year Official Warranty on all brand-new laptops, printers, and UPS power backups. Retain this invoice for warranty verification."
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS SETTINGS & BROADCAST CENTER */}
          {activeCategory === 'notifications' && (
            <div className="space-y-6 text-xs">
              {/* Notifications Overview Banner */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-800/60 rounded-xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white">In-App & Push Notification System</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {currentValues.in_app_enabled !== false ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Real-time alerts for customer order milestones, new tech inventory, flash deals & official store announcements.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer bg-indigo-900/60 px-3 py-1.5 rounded-lg border border-indigo-700/50">
                    <input
                      type="checkbox"
                      checked={currentValues.in_app_enabled !== false}
                      onChange={(e) => handleFieldChange('notifications', 'in_app_enabled', e.target.checked)}
                      className="rounded text-indigo-500"
                    />
                    <span className="font-bold text-white text-xs">Enable In-App Bell</span>
                  </label>
                </div>
              </div>

              {/* Notification Channels & Triggers */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Notification Channels & Event Triggers</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select which events dispatch visual alerts to shoppers and team members.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-start gap-3 cursor-pointer transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={currentValues.order_updates_enabled !== false}
                      onChange={(e) => handleFieldChange('notifications', 'order_updates_enabled', e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Order Tracking Updates</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Alert customer when order is confirmed, payment verified, dispatched in Kampala, or delivered.
                      </span>
                    </div>
                  </label>

                  <label className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-start gap-3 cursor-pointer transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={currentValues.new_products_enabled !== false}
                      onChange={(e) => handleFieldChange('notifications', 'new_products_enabled', e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">New Product Arrivals</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Notify shoppers when new laptops, printers, routers, or phones are added to the catalog.
                      </span>
                    </div>
                  </label>

                  <label className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-start gap-3 cursor-pointer transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={currentValues.flash_sales_enabled !== false}
                      onChange={(e) => handleFieldChange('notifications', 'flash_sales_enabled', e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Flash Deals & Weekend Discounts</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Notify users of time-limited price cuts, holiday coupons, and bundle promotions.
                      </span>
                    </div>
                  </label>

                  <label className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-start gap-3 cursor-pointer transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={currentValues.store_announcements_enabled !== false}
                      onChange={(e) => handleFieldChange('notifications', 'store_announcements_enabled', e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Official Store Announcements</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Display important notices such as holiday delivery schedules, maintenance, and Kampala hub updates.
                      </span>
                    </div>
                  </label>

                  <label className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-start gap-3 cursor-pointer transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={currentValues.sound_enabled !== false}
                      onChange={(e) => handleFieldChange('notifications', 'sound_enabled', e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Subtle Audio Chime</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Play gentle synthesizer chime via Web Audio API on new notification arrivals.
                      </span>
                    </div>
                  </label>

                  <label className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-start gap-3 cursor-pointer transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={currentValues.low_stock_alerts_enabled !== false}
                      onChange={(e) => handleFieldChange('notifications', 'low_stock_alerts_enabled', e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Low Inventory Alerts (Staff)</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Alert managers when warehouse inventory drops below 3 units.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Broadcast Announcement Console */}
              <div className="p-4 bg-white border border-indigo-200 rounded-xl shadow-xs space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-600" />
                    <span>Broadcast Instant Store Announcement</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Send an immediate bulletin to all customers currently browsing or opening CDT Market in Kampala.
                  </p>
                </div>

                <form onSubmit={handleBroadcastAnnouncement} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-800 block mb-1">Announcement Title</label>
                      <input
                        type="text"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="e.g. ⚡ Flash Weekend Sale: 15% off HP Gaming Laptops"
                        className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Priority Level</label>
                      <select
                        value={broadcastPriority}
                        onChange={(e) => setBroadcastPriority(e.target.value as 'normal' | 'high')}
                        className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs bg-white"
                      >
                        <option value="normal">Normal Bulletin</option>
                        <option value="high">High Priority (Urgent)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Announcement Message</label>
                    <textarea
                      rows={2}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Special promo pricing available today only. Free doorstep delivery across Kampala central."
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-2">
                      <label className="text-slate-600 text-[11px] font-semibold">Destination link:</label>
                      <select
                        value={broadcastView}
                        onChange={(e) => setBroadcastView(e.target.value)}
                        className="h-7 px-2 border border-slate-200 rounded text-xs bg-white"
                      >
                        <option value="shop">Product Catalog (Shop)</option>
                        <option value="track-order">Order Tracking</option>
                        <option value="home">Homepage</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isBroadcasting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast to All Shoppers'}</span>
                    </button>
                  </div>

                  {broadcastFeedback && (
                    <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      broadcastFeedback.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {broadcastFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                      <span>{broadcastFeedback.message}</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* SMS API SETTINGS & GATEWAY DISPATCH CONSOLE */}
          {activeCategory === 'sms' && (
            <div className="space-y-6 text-xs">
              {/* SMS Gateway Overview Banner */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-emerald-950 border border-emerald-800/60 rounded-xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white">Uganda & Global SMS Gateway (Africa's Talking / Twilio)</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {currentValues.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Sends immediate telephone SMS messages to customers upon order placement, courier dispatch & doorstep delivery.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-700/50">
                    <input
                      type="checkbox"
                      checked={Boolean(currentValues.enabled)}
                      onChange={(e) => handleFieldChange('sms', 'enabled', e.target.checked)}
                      className="rounded text-emerald-500"
                    />
                    <span className="font-bold text-white text-xs">Enable SMS Dispatch</span>
                  </label>
                </div>
              </div>

              {/* Provider & Credentials Configuration */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-600" />
                      <span>Gateway Provider & Authentication</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Select your preferred SMS telecom gateway and specify authorized credentials.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentValues.api_key_configured
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {currentValues.api_key_configured ? '✓ API Key Configured' : '⚠ Simulation Mode Active'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">SMS Telecom Provider</label>
                    <select
                      value={currentValues.provider || 'africastalking'}
                      onChange={(e) => handleFieldChange('sms', 'provider', e.target.value)}
                      className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                    >
                      <option value="africastalking">Africa's Talking (Uganda / MTN / Airtel)</option>
                      <option value="twilio">Twilio SMS Gateway</option>
                      <option value="custom_http">Custom HTTP Gateway / Uganda Local SMS</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Sender ID (Branded Header)</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={currentValues.sender_id || ''}
                      onChange={(e) => handleFieldChange('sms', 'sender_id', e.target.value)}
                      placeholder="CYBERTECH (up to 11 characters)"
                      className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono uppercase"
                    />
                  </div>

                  {currentValues.provider === 'africastalking' && (
                    <>
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Africa's Talking Username</label>
                        <input
                          type="text"
                          value={currentValues.username || ''}
                          onChange={(e) => handleFieldChange('sms', 'username', e.target.value)}
                          placeholder="sandbox or production username"
                          className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-800 block mb-1 flex items-center justify-between">
                          <span>Africa's Talking API Key</span>
                          <button
                            type="button"
                            onClick={() => setShowSmsApiKey(!showSmsApiKey)}
                            className="text-[10px] text-cyan-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {showSmsApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showSmsApiKey ? 'Hide' : 'Reveal'}</span>
                          </button>
                        </label>
                        <input
                          type={showSmsApiKey ? 'text' : 'password'}
                          value={currentValues.api_key || ''}
                          onChange={(e) => handleFieldChange('sms', 'api_key', e.target.value)}
                          placeholder={currentValues.api_key_configured ? '•••••••••••••••• (Securely Configured)' : 'Enter Africa\'s Talking API Key'}
                          className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </>
                  )}

                  {currentValues.provider === 'twilio' && (
                    <>
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Twilio Account SID</label>
                        <input
                          type="text"
                          value={currentValues.account_sid || ''}
                          onChange={(e) => handleFieldChange('sms', 'account_sid', e.target.value)}
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-800 block mb-1 flex items-center justify-between">
                          <span>Twilio Auth Token</span>
                          <button
                            type="button"
                            onClick={() => setShowSmsSecret(!showSmsSecret)}
                            className="text-[10px] text-cyan-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {showSmsSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showSmsSecret ? 'Hide' : 'Reveal'}</span>
                          </button>
                        </label>
                        <input
                          type={showSmsSecret ? 'text' : 'password'}
                          value={currentValues.api_secret || ''}
                          onChange={(e) => handleFieldChange('sms', 'api_secret', e.target.value)}
                          placeholder={currentValues.api_secret_configured ? '•••••••••••••••• (Configured)' : 'Enter Twilio Auth Token'}
                          className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </>
                  )}

                  {currentValues.provider === 'custom_http' && (
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-800 block mb-1">Custom HTTP Gateway Endpoint URL</label>
                      <input
                        type="url"
                        value={currentValues.custom_endpoint_url || ''}
                        onChange={(e) => handleFieldChange('sms', 'custom_endpoint_url', e.target.value)}
                        placeholder="https://api.ugandasms.com/v1/messages/send"
                        className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Automated Event Dispatch Toggles */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Automated Customer Dispatch Milestones</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Determine which order milestones automatically send an SMS to the customer's phone number.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl flex items-start gap-2.5 cursor-pointer shadow-2xs">
                    <input
                      type="checkbox"
                      checked={currentValues.notify_on_order_placed !== false}
                      onChange={(e) => handleFieldChange('sms', 'notify_on_order_placed', e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Order Placed</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Immediately confirms receipt of order and lists the order ID.
                      </span>
                    </div>
                  </label>

                  <label className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl flex items-start gap-2.5 cursor-pointer shadow-2xs">
                    <input
                      type="checkbox"
                      checked={currentValues.notify_on_dispatch !== false}
                      onChange={(e) => handleFieldChange('sms', 'notify_on_dispatch', e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Courier Dispatched</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Alerts customer when courier rider picks up package for delivery.
                      </span>
                    </div>
                  </label>

                  <label className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl flex items-start gap-2.5 cursor-pointer shadow-2xs">
                    <input
                      type="checkbox"
                      checked={currentValues.notify_on_delivery !== false}
                      onChange={(e) => handleFieldChange('sms', 'notify_on_delivery', e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Order Delivered</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Thank you notice and official warranty reminder upon delivery.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* SMS Message Templates */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Customizable SMS Message Templates</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dynamic placeholders: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">&#123;name&#125;</code>, <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">&#123;order_id&#125;</code>, <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">&#123;currency&#125;</code>, <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">&#123;total&#125;</code>.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Order Placed Message Template</label>
                    <textarea
                      rows={2}
                      value={currentValues.template_order_placed || ''}
                      onChange={(e) => handleFieldChange('sms', 'template_order_placed', e.target.value)}
                      placeholder="Dear {name}, your Cyber Dynamic Tech order {order_id} has been received! Total: {currency} {total}. We are preparing it for delivery in Kampala."
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Courier Dispatched Message Template</label>
                    <textarea
                      rows={2}
                      value={currentValues.template_dispatch || ''}
                      onChange={(e) => handleFieldChange('sms', 'template_dispatch', e.target.value)}
                      placeholder="Dear {name}, your CDT order {order_id} is dispatched with our courier for delivery. Inquiries: +256 779 743 101."
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Delivered & Warranty Message Template</label>
                    <textarea
                      rows={2}
                      value={currentValues.template_delivered || ''}
                      onChange={(e) => handleFieldChange('sms', 'template_delivered', e.target.value)}
                      placeholder="Dear {name}, your Cyber Dynamic Tech order {order_id} has been safely delivered! Thank you for choosing CDT."
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Live SMS Test Console */}
              <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-xs space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span>Live SMS Test & Diagnostic Console</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Test live gateway connectivity by sending an immediate test SMS to any Ugandan phone number.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Recipient Phone (+256...)</label>
                    <input
                      type="text"
                      value={smsTestPhone}
                      onChange={(e) => setSmsTestPhone(e.target.value)}
                      placeholder="+256779743101"
                      className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-800 block mb-1">Test Message Body</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={smsTestMsg}
                        onChange={(e) => setSmsTestMsg(e.target.value)}
                        className="flex-1 h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleSendTestSms}
                        disabled={isTestingSms}
                        className="px-4 h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isTestingSms ? 'Sending...' : 'Send Test SMS'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {smsTestFeedback && (
                  <div className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                    smsTestFeedback.success
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}>
                    {smsTestFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block">
                        {smsTestFeedback.status === 'sent'
                          ? 'Live Dispatch Succeeded'
                          : smsTestFeedback.status === 'simulated'
                          ? 'Simulation Dispatch Logged'
                          : 'SMS Dispatch Error'}
                      </span>
                      <span className="text-[11px]">{smsTestFeedback.message}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent SMS Gateway Logs Table */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-slate-700" />
                      <span>Recent SMS Dispatch Audit Logs ({smsLogs.length})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Audit trail of outbound SMS transmissions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadSmsLogs}
                    disabled={isLoadingSmsLogs}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-xs text-slate-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSmsLogs ? 'animate-spin' : ''}`} />
                    <span>Refresh Logs</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Recipient</th>
                        <th className="py-2 px-3">Message Preview</th>
                        <th className="py-2 px-3">Provider</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {smsLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400 font-sans">
                            No SMS messages dispatched yet. Use the Test Console above to trigger one.
                          </td>
                        </tr>
                      ) : (
                        smsLogs.slice(0, 15).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{log.to}</td>
                            <td className="py-2 px-3 text-slate-600 font-sans truncate max-w-[280px]" title={log.message}>
                              {log.message}
                            </td>
                            <td className="py-2 px-3 uppercase text-[10px] text-slate-500 font-semibold">{log.provider}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                log.status === 'sent'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.status === 'simulated'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LEGAL, POLICIES & COOKIE CONSENT CENTER */}
          {activeCategory === 'legal' && (
            <div className="space-y-6 text-xs">
              {/* Legal Overview Banner */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-700 text-slate-300 border border-slate-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white">Store Policies & Cookie Compliance</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        9 Policies Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Compliant with Uganda Electronic Transactions Act, Consumer Protection laws & GDPR international standards.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentView('store-policies')}
                  className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Customer Policies Page</span>
                </button>
              </div>

              {/* Cookie Consent Settings */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-600" />
                  <span>Cookie Consent Banner Settings</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentValues.cookie_consent_enabled !== false}
                      onChange={(e) => handleFieldChange('legal', 'cookie_consent_enabled', e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <span className="font-bold text-slate-800">Show Cookie Consent Banner</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentValues.require_explicit_consent)}
                      onChange={(e) => handleFieldChange('legal', 'require_explicit_consent', e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <span className="font-bold text-slate-800">Require Explicit Accept / Reject</span>
                  </label>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Cookie Banner Notice Text</label>
                  <input
                    type="text"
                    value={currentValues.cookie_banner_text || ''}
                    onChange={(e) => handleFieldChange('legal', 'cookie_banner_text', e.target.value)}
                    placeholder="We use cookies to secure checkout, store shopping cart items, and provide fast delivery in Uganda."
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* 9 Policy Documents Editor */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <span>Policy Document Content (Displayed on /store-policies)</span>
                </h4>

                <div className="space-y-4">
                  {[
                    { key: 'policy_terms', title: '1. Terms & Conditions of Service' },
                    { key: 'policy_privacy', title: '2. Privacy & Customer Data Protection' },
                    { key: 'policy_refund', title: '3. Return & Refund Policy (14-Day Warranty)' },
                    { key: 'policy_shipping', title: '4. Shipping & Delivery Policy (Kampala & Upcountry)' },
                    { key: 'policy_payment', title: '5. Payment Policy (MTN MoMo, Airtel, COD)' },
                    { key: 'policy_warranty', title: '6. Hardware Warranty & Physical Inspection Policy' },
                    { key: 'policy_cancellation', title: '7. Order Cancellation Policy' },
                    { key: 'policy_cookie', title: '8. Cookie Policy' },
                    { key: 'policy_contact', title: '9. Contact & Customer Support Policy' },
                  ].map((p) => (
                    <div key={p.key} className="bg-white p-3 border border-slate-200 rounded-lg space-y-1.5">
                      <label className="font-bold text-slate-900 block text-xs">{p.title}</label>
                      <textarea
                        rows={3}
                        value={(currentValues as any)[p.key] || ''}
                        onChange={(e) => handleFieldChange('legal', p.key as any, e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-md text-xs leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FALLBACK / GENERIC RENDERER FOR OTHER CATEGORIES */}
          {![
            'general',
            'branding',
            'appearance',
            'homepage',
            'products',
            'checkout',
            'delivery',
            'payments',
            'woocommerce',
            'api',
            'maintenance',
            'pos',
            'notifications',
            'sms',
            'legal',
          ].includes(activeCategory) && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-500 text-xs">
                Configure settings for <strong className="text-slate-800">{currentMeta.label}</strong>. All modifications persist immediately upon clicking <em>Save Settings</em>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(currentValues).map(([key, val]) => {
                  if (typeof val === 'boolean') {
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) => handleFieldChange(activeCategory, key, e.target.checked)}
                          className="rounded text-cyan-600"
                        />
                        <span className="font-bold text-slate-800 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                      </label>
                    );
                  }

                  if (Array.isArray(val)) {
                    const isSimpleArray = val.every((item) => typeof item === 'string' || typeof item === 'number');
                    return (
                      <div key={key} className="sm:col-span-2">
                        <label className="font-bold text-slate-800 block mb-1 capitalize">
                          {key.replace(/_/g, ' ')} {isSimpleArray && <span className="text-slate-400 font-normal">(comma-separated)</span>}
                        </label>
                        {isSimpleArray ? (
                          <input
                            type="text"
                            value={val.join(', ')}
                            onChange={(e) => {
                              const items = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                              handleFieldChange(activeCategory, key, items);
                            }}
                            className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        ) : (
                          <textarea
                            rows={4}
                            value={JSON.stringify(val, null, 2)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                handleFieldChange(activeCategory, key, parsed);
                              } catch {
                                // Keep raw string until valid JSON or user finishes
                              }
                            }}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        )}
                      </div>
                    );
                  }

                  if (typeof val === 'object' && val !== null) {
                    return (
                      <div key={key} className="sm:col-span-2">
                        <label className="font-bold text-slate-800 block mb-1 capitalize">
                          {key.replace(/_/g, ' ')} (JSON Configuration)
                        </label>
                        <textarea
                          rows={4}
                          defaultValue={JSON.stringify(val, null, 2)}
                          onBlur={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              handleFieldChange(activeCategory, key, parsed);
                            } catch (err: any) {
                              showToast(`Invalid JSON for ${key}`);
                            }
                          }}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={key}>
                      <label className="font-bold text-slate-800 block mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <input
                        type={typeof val === 'number' ? 'number' : 'text'}
                        value={val !== undefined && val !== null ? String(val) : ''}
                        onChange={(e) =>
                          handleFieldChange(
                            activeCategory,
                            key,
                            typeof val === 'number' ? Number(e.target.value) : e.target.value
                          )
                        }
                        className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
