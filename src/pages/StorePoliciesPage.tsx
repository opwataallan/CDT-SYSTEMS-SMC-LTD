import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import {
  FileText,
  Shield,
  RotateCcw,
  Truck,
  CreditCard,
  Award,
  XCircle,
  Cookie,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Printer,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  PhoneCall,
} from 'lucide-react';

interface StorePoliciesPageProps {
  initialPolicy?: string;
}

interface PolicyItem {
  id: string;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  badge: string;
  configKey: string;
  fallbackKey: string;
}

const POLICIES: PolicyItem[] = [
  {
    id: 'terms',
    title: 'Terms & Conditions of Sale',
    shortTitle: 'Terms of Sale',
    icon: FileText,
    badge: 'Legal Agreement',
    configKey: 'policy_terms',
    fallbackKey: 'terms_of_service',
  },
  {
    id: 'privacy',
    title: 'Privacy & Customer Data Protection',
    shortTitle: 'Privacy Policy',
    icon: Shield,
    badge: 'Data Security',
    configKey: 'policy_privacy',
    fallbackKey: 'privacy_policy',
  },
  {
    id: 'refund',
    title: 'Return & Refund Policy (14-Day Warranty Window)',
    shortTitle: 'Refunds & Returns',
    icon: RotateCcw,
    badge: 'Buyer Protection',
    configKey: 'policy_refund',
    fallbackKey: 'refund_return_policy',
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery Logistics (Kampala & Upcountry)',
    shortTitle: 'Shipping & Delivery',
    icon: Truck,
    badge: 'Nationwide Logistics',
    configKey: 'policy_shipping',
    fallbackKey: 'shipping_delivery_policy',
  },
  {
    id: 'payment',
    title: 'Payment Methods & Security (MTN MoMo, Airtel, COD)',
    shortTitle: 'Payment Methods',
    icon: CreditCard,
    badge: 'Verified Checkout',
    configKey: 'policy_payment',
    fallbackKey: 'payment_policy',
  },
  {
    id: 'warranty',
    title: 'Hardware Warranty & Technical Verification',
    shortTitle: 'Hardware Warranty',
    icon: Award,
    badge: 'Genuine Assurance',
    configKey: 'policy_warranty',
    fallbackKey: 'warranty_policy',
  },
  {
    id: 'cancellation',
    title: 'Order Cancellation & Modification Policy',
    shortTitle: 'Order Cancellation',
    icon: XCircle,
    badge: 'Customer Flexibility',
    configKey: 'policy_cancellation',
    fallbackKey: 'cancellation_policy',
  },
  {
    id: 'cookie',
    title: 'Cookie & Storage Transparency Policy',
    shortTitle: 'Cookie Policy',
    icon: Cookie,
    badge: 'Transparency',
    configKey: 'policy_cookie',
    fallbackKey: 'cookie_policy',
  },
  {
    id: 'contact',
    title: 'Customer Support, Escalation & Showroom Directions',
    shortTitle: 'Customer Care & Support',
    icon: HelpCircle,
    badge: 'Physical Showroom',
    configKey: 'policy_contact',
    fallbackKey: 'contact_support_policy',
  },
];

export const StorePoliciesPage: React.FC<StorePoliciesPageProps> = ({ initialPolicy }) => {
  const { config, setCurrentView } = useShop();
  const [activePolicyId, setActivePolicyId] = useState<string>(initialPolicy || 'terms');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const legalConfig = config?.legal || {};
  const storePhone = config?.general?.phone || '+256 779 743 101';
  const storeEmail = config?.general?.email || 'support@cyberdynamictech.com';

  useEffect(() => {
    if (initialPolicy) {
      setActivePolicyId(initialPolicy);
      setOpenAccordions((prev) => ({ ...prev, [initialPolicy]: true }));
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Open all by default on desktop, open active on mobile
      const initialMap: Record<string, boolean> = {};
      POLICIES.forEach((p) => {
        initialMap[p.id] = true;
      });
      setOpenAccordions(initialMap);
    }
  }, [initialPolicy]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getPolicyContent = (item: PolicyItem): string => {
    const custom = (legalConfig as any)[item.configKey];
    if (custom && typeof custom === 'string' && custom.trim()) return custom;
    const fallback = (legalConfig as any)[item.fallbackKey];
    if (fallback && typeof fallback === 'string' && fallback.trim()) return fallback;
    return 'Policy document is currently being updated by the store administration.';
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredPolicies = POLICIES.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const content = getPolicyContent(p).toLowerCase();
    return p.title.toLowerCase().includes(q) || p.shortTitle.toLowerCase().includes(q) || content.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb & Back button */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            onClick={() => setCurrentView('home')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-cyan-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="Print legal policies"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print Document</span>
            </button>
            <button
              onClick={() => setCurrentView('contact')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>

        {/* Hero Header */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold mb-3">
              <Shield className="w-3.5 h-3.5 text-cyan-600" />
              <span>Official Cyber Dynamic Tech Policies & Legal Terms</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              Store Policies & Customer Protection
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              At Cyber Dynamic Tech, customer confidence, hardware authenticity, and transparent logistics are our top priorities.
              Review our nine store operating standards covering warranties, returns, payments, delivery zones across Uganda, and consumer privacy.
            </p>

            {/* Quick Search */}
            <div className="mt-5 relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search policies (e.g., warranty, MoMo, return, delivery)..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-cyan-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Quick Jump Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 space-y-2">
            <div className="sticky top-24 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-3 pb-2 border-b border-slate-100">
                Policy Directory (9 Policies)
              </h3>
              <nav className="mt-3 space-y-1">
                {POLICIES.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activePolicyId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePolicyId(item.id);
                        setOpenAccordions((prev) => ({ ...prev, [item.id]: true }));
                        const el = document.getElementById(`policy-${item.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">
                          {idx + 1}. {item.shortTitle}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-1">
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Kampala Showroom</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Have questions about an ongoing order or warranty claim? Speak directly with our showroom team:
                </p>
                <div className="pt-1 font-mono text-[11px] font-bold text-slate-800">{storePhone}</div>
                <div className="text-[11px] text-cyan-700">{storeEmail}</div>
              </div>
            </div>
          </aside>

          {/* Accordions / Policy Detail Content */}
          <div className="lg:col-span-8 space-y-4">
            {filteredPolicies.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold">No policies matched "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs text-cyan-600 font-bold hover:underline"
                >
                  Reset search filter
                </button>
              </div>
            ) : (
              filteredPolicies.map((item, index) => {
                const Icon = item.icon;
                const isOpen = openAccordions[item.id] !== false;
                const content = getPolicyContent(item);
                const isActive = activePolicyId === item.id;

                return (
                  <article
                    key={item.id}
                    id={`policy-${item.id}`}
                    className={`bg-white border rounded-2xl transition-all shadow-xs overflow-hidden ${
                      isActive ? 'border-cyan-400 ring-2 ring-cyan-100' : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Header bar / accordion toggle */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(item.id)}
                      className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-50/70 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/60">
                          <Icon className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Section 0{index + 1}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                              {item.badge}
                            </span>
                          </div>
                          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                            {item.title}
                          </h2>
                        </div>
                      </div>

                      <div className="shrink-0 ml-3 text-slate-400">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {/* Content Section */}
                    {isOpen && (
                      <div className="px-5 pb-6 pt-1 border-t border-slate-100 text-slate-700 text-xs sm:text-sm leading-relaxed space-y-4">
                        <div className="whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100 font-normal">
                          {content}
                        </div>

                        {/* Extra contextual highlights based on policy */}
                        {item.id === 'refund' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                              <span className="font-bold block mb-0.5">Eligible for Full Return:</span>
                              Manufacturer hardware malfunction within 14 days with original box & accessories.
                            </div>
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                              <span className="font-bold block mb-0.5">Excluded from Return:</span>
                              Physical drop damage, liquid spills, power surge burns, or broken screen seals.
                            </div>
                          </div>
                        )}

                        {item.id === 'shipping' && (
                          <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-cyan-900 text-xs flex items-center justify-between gap-3">
                            <div>
                              <span className="font-bold block">Need same-day delivery in Kampala?</span>
                              Orders confirmed before 3:00 PM are dispatched immediately with real-time tracking.
                            </div>
                            <button
                              onClick={() => setCurrentView('track-order')}
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shrink-0 cursor-pointer"
                            >
                              Track Order
                            </button>
                          </div>
                        )}

                        {item.id === 'cookie' && (
                          <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs flex items-center justify-between gap-3">
                            <span>Manage your cookie consent preferences or reset your choices anytime:</span>
                            <button
                              onClick={() => {
                                localStorage.removeItem('cdt_cookie_consent_v1');
                                window.location.reload();
                              }}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg shrink-0 cursor-pointer"
                            >
                              Reset Preferences
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}

            {/* Support Callout Box */}
            <div className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 border border-slate-700/80 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold mb-1">Require Official Written Warranty or VAT Invoice?</h3>
                  <p className="text-xs text-slate-300">
                    Corporate purchase orders (POs), school ICT supply agreements, and tax invoices are processed daily.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('contact')}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Contact Accounts Team
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
