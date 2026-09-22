import React, { useState } from 'react';
import {
  X,
  Code,
  Copy,
  Check,
  Send,
  Sparkles,
  Truck,
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Radio,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { FCMMessage, FCMTopic } from '../types';

interface FCMSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSuccess?: (title: string) => void;
}

export const FCMSchemaModal: React.FC<FCMSchemaModalProps> = ({
  isOpen,
  onClose,
  onTriggerSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'order' | 'flash_sale' | 'device_token' | 'fcm_curl'>('order');
  const [copied, setCopied] = useState(false);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const deviceReg = notificationService.getDeviceRegistration();
  const currentToken = deviceReg.token;

  // Sample FCM Payloads structured according to official Firebase Cloud Messaging v1 specs
  const sampleOrderMessage: FCMMessage = {
    messageId: `fcm_msg_${Date.now()}`,
    to: currentToken,
    priority: 'high',
    notification: {
      title: 'Order #CDT-8942 Dispatched 🚚',
      body: 'Your package is on its way with our express courier in Kampala. Expected arrival in 45 mins.',
      icon: '/pwa-192x192.png',
      image: '/pwa-512x512.png',
      badge: '/pwa-192x192.png',
      click_action: '/#orders',
    },
    data: {
      type: 'order_update',
      order_id: 'CDT-8942',
      order_number: 'CDT-8942',
      status: 'shipped',
      customer_name: 'Allan Opwata',
      total_amount: '3850000',
      delivery_zone: 'Kampala Central & Kololo',
      tracking_link: 'https://cyberdynamictech.com/track/CDT-8942',
      tag: 'order_CDT-8942',
      timestamp: new Date().toISOString(),
    },
    webpush: {
      headers: {
        Urgency: 'high',
      },
      notification: {
        title: 'Order #CDT-8942 Dispatched 🚚',
        body: 'Your package is on its way with our express courier in Kampala.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        tag: 'order_CDT-8942',
        renotify: true,
        actions: [
          { action: 'track_order', title: 'Track Order 🚚' },
          { action: 'dismiss', title: 'Close' },
        ],
      },
      fcm_options: {
        link: '/#orders',
      },
    },
    android: {
      priority: 'high',
      notification: {
        title: 'Order #CDT-8942 Dispatched 🚚',
        body: 'Courier is en route in Kampala.',
        icon: 'ic_launcher',
        color: '#007f19',
        channel_id: 'cdt_order_updates',
      },
    },
  };

  const sampleFlashSaleMessage: FCMMessage = {
    messageId: `fcm_flash_${Date.now()}`,
    to: '/topics/flash_sales',
    priority: 'high',
    notification: {
      title: '⚡ Weekend Tech Flash Deals: Up to 35% OFF!',
      body: 'HP Victus Core i7 Gaming Laptops & Epson EcoTank Wi-Fi Printers heavily discounted for 48 hours.',
      icon: '/pwa-192x192.png',
      image: '/pwa-512x512.png',
      badge: '/pwa-192x192.png',
      click_action: '/#shop',
    },
    data: {
      type: 'flash_sale',
      sale_id: 'weekend_tech_surge_2026',
      title: 'Weekend Tech Surge',
      discount_percentage: '35%',
      category: 'Laptops & Printers',
      product_slug: 'hp-victus-15-core-i7',
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 172800000).toISOString(),
      target_url: '/#shop',
      tag: 'flash_sale_active',
    },
    webpush: {
      notification: {
        title: '⚡ Weekend Tech Flash Deals: Up to 35% OFF!',
        body: 'HP Victus Gaming & Epson EcoTank printers discounted for 48h in Kampala.',
        icon: '/pwa-192x192.png',
        vibrate: [300, 100, 300],
        actions: [
          { action: 'shop_now', title: 'Shop Deals ⚡' },
          { action: 'dismiss', title: 'Later' },
        ],
      },
      fcm_options: {
        link: '/#shop',
      },
    },
    android: {
      priority: 'high',
      notification: {
        title: '⚡ Weekend Tech Flash Deals: Up to 35% OFF!',
        body: 'Limited stock discounts at Cyber Dynamic Kampala.',
        channel_id: 'cdt_promotions',
        color: '#ff6600',
      },
    },
  };

  const getActivePayload = () => {
    switch (activeTab) {
      case 'order':
        return sampleOrderMessage;
      case 'flash_sale':
        return sampleFlashSaleMessage;
      case 'device_token':
        return deviceReg;
      case 'fcm_curl':
        return {
          description: 'HTTP v1 API cURL Example for Backend / Cloud Function dispatch',
          curl_command: `curl -X POST https://fcm.googleapis.com/v1/projects/YOUR_FIREBASE_PROJECT/messages:send \\
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \\
  -H "Content-Type: application/json; UTF-8" \\
  -d '${JSON.stringify({ message: sampleOrderMessage }, null, 2)}'`,
        };
      default:
        return sampleOrderMessage;
    }
  };

  const jsonString = JSON.stringify(getActivePayload(), null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateFCMDispatch = async () => {
    setTestSent(true);
    if (activeTab === 'order') {
      await notificationService.notifyOrderUpdate({
        orderNumber: 'CDT-8942',
        status: 'shipped',
        customerName: 'Allan Opwata',
        totalAmount: 3850000,
        deliveryZone: 'Kampala Central & Kololo',
      });
      onTriggerSuccess?.('Order dispatch push triggered!');
    } else {
      await notificationService.notifyFlashSale({
        title: 'Weekend Tech Surge Deals',
        discountPercentage: '35%',
        category: 'Laptops & Printers',
        productSlug: 'hp-victus-15-core-i7',
        bannerImage: '/pwa-512x512.png',
      });
      onTriggerSuccess?.('Flash sale push triggered!');
    }
    setTimeout(() => setTestSent(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                Firebase Cloud Messaging (FCM) Integration Schema
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Frontend NotificationService data schema for order updates & flash sales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 pt-2 gap-1 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('order')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'order'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Order Update Payload
          </button>
          <button
            onClick={() => setActiveTab('flash_sale')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'flash_sale'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Flash Sale Payload
          </button>
          <button
            onClick={() => setActiveTab('device_token')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'device_token'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Device Registration
          </button>
          <button
            onClick={() => setActiveTab('fcm_curl')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'fcm_curl'
                ? 'bg-slate-900 text-purple-400 border-t-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            HTTP v1 cURL
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              {activeTab === 'order' && 'FCM v1 Payload • Order Status Update'}
              {activeTab === 'flash_sale' && 'FCM v1 Payload • Topic Broadcast (/topics/flash_sales)'}
              {activeTab === 'device_token' && 'Client FCM Device Token & Topic Subscriptions'}
              {activeTab === 'fcm_curl' && 'Google FCM API v1 Backend Invocation'}
            </span>

            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          </div>

          {/* JSON Viewer */}
          <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-[360px]">
            <code>{jsonString}</code>
          </pre>

          {/* Architecture info callout */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Future FCM Integration Architecture:</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When Firebase SDK is linked, the device token is registered with Firebase Messaging,
              and backend order events trigger FCM HTTP v1 messages. The frontend service includes
              <code className="text-cyan-300 font-mono"> handleFCMIncomingMessage() </code> and
              <code className="text-cyan-300 font-mono"> /public/firebase-messaging-sw.js </code>
              to handle background push delivery natively on Android and desktop.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Notification API Status: <strong>{notificationService.getPermissionStatus()}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {(activeTab === 'order' || activeTab === 'flash_sale') && (
              <button
                onClick={handleSimulateFCMDispatch}
                disabled={testSent}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testSent ? 'Notification Dispatched!' : `Test ${activeTab === 'order' ? 'Order' : 'Flash Sale'} Push`}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
