import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useShop } from '../context/ShopContext';

export const Footer: React.FC = () => {
  const { storeSettings, setCurrentView, showToast } = useShop();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setIsSubscribed(true);
      showToast('Subscribed! Check your inbox for your 5% discount code: WELCOME5');
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-[#0F172A] text-slate-300 pt-8 pb-6 border-t border-slate-800">
      {/* 1. Value Proposition Strip (High Density) */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-850 bg-[#1E293B]/80 rounded-lg border border-slate-700/60 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Uganda-Wide Delivery</h4>
              <p className="text-[11px] text-slate-400">Same-day across all Kampala areas; express courier</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">100% Genuine Tech</h4>
              <p className="text-[11px] text-slate-400">Official manufacturer warranty</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">MoMo & Airtel Money</h4>
              <p className="text-[11px] text-slate-400">Instant PIN prompt on phone or COD</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Dedicated Support</h4>
              <p className="text-[11px] text-slate-400">Physical showroom technicians in Kampala</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Navigation Grid */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Column 1: Brand & Headquarters info */}
        <div className="lg:col-span-2 space-y-3">
          <BrandLogo inverted size="md" customLogoUrl={storeSettings.logo_url} onClick={() => setCurrentView('home')} />
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Cyber Dynamic Technologies is Uganda's leading computer marketplace, retail showroom, and enterprise ICT solutions center.
            Genuine laptops, printers, 4G LTE routers, and point-of-sale hardware backed by physical warranty.
          </p>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Physical Store & Dispatch Hub:</strong><br />
                {storeSettings.address_line}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Hotline: {storeSettings.phone} / +256 394 760 459</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <span>{storeSettings.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>Mon - Sat: 8:00 AM - 7:30 PM | Sun: 10:00 AM - 5:00 PM</span>
            </div>
          </div>
        </div>

        {/* Column 2: Popular Categories */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5">
            Categories
          </h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button
                onClick={() => setCurrentView('category', { slug: 'laptops-computers', name: 'Laptops & Computers' })}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Laptops & Workstations
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('category', { slug: 'printers-photocopiers', name: 'Printers & Photocopiers' })}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Epson & HP Printers
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('category', { slug: 'networking-mifi', name: 'Networking & 4G MiFi' })}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                4G LTE MiFi & Routers
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('category', { slug: 'phones-tablets', name: 'Smartphones & Tablets' })}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Smartphones & Tablets
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('category', { slug: 'monitors-displays', name: 'Monitors & Displays' })}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Monitors & Projectors
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('category', { slug: 'accessories-peripherals', name: 'Accessories & Peripherals' })}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Storage, Keyboards & Mice
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Customer Care */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5">
            Customer Support
          </h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button
                onClick={() => setCurrentView('track-order')}
                className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Track Your Order</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('delivery-info')}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Delivery Rates & Zones
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('contact')}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Store Location & Directions
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('warranty')}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Warranty & Return Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('store-policies')}
                className="hover:text-cyan-400 transition-colors cursor-pointer text-cyan-300 font-medium"
              >
                Store Policies (9 Guarantees)
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('account', { tab: 'orders' })}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Order History & Invoices
              </button>
            </li>
            <li>
              <a
                href="https://wa.me/256779743101?text=Hello%20Cyber%20Dynamic%20Tech,%20I%20need%20help%20with%20an%20order"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Newsletter & Exclusive Offers */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5">
            Discounts & Alerts
          </h4>
          <p className="text-xs text-slate-400">
            Get updates on flash sales, new laptop arrivals, and exclusive promo codes.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="space-y-2">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
            />
            <button
              type="submit"
              className="w-full py-2 px-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>Subscribe (Get 5% Off)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>

          <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Use coupon <strong>WELCOME5</strong> on your first order!</span>
          </div>
        </div>
      </div>

      {/* 3. Payment Methods & Trust Bar */}
      <div className="max-w-7xl mx-auto px-4 pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1 text-[11px]">Accepted:</span>
          <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 font-bold border border-amber-400/20 text-[10px]">
            MTN Mobile Money
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-bold border border-rose-500/20 text-[10px]">
            Airtel Money
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-bold border border-blue-500/20 text-[10px]">
            Visa / Mastercard
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20 text-[10px]">
            Cash on Delivery
          </span>
        </div>
      </div>

      {/* 4. Bottom Copyright & Legal Links */}
      <div className="max-w-7xl mx-auto px-4 mt-4 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
        <div>
          © {new Date().getFullYear()} Cyber Dynamic Technologies. All rights reserved. Kampala, Uganda.
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('store-policies', { policy: 'terms' })}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Terms of Sale
          </button>
          <span>•</span>
          <button
            onClick={() => setCurrentView('store-policies', { policy: 'privacy' })}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            onClick={() => setCurrentView('store-policies', { policy: 'refund' })}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Return Policy
          </button>
          <span>•</span>
          <button
            onClick={() => setCurrentView('store-policies', { policy: 'cookie' })}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Cookie Preferences
          </button>
        </div>
      </div>
    </footer>
  );
};
