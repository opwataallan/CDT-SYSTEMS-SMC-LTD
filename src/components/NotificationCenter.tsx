import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  Package,
  Truck,
  CheckCircle2,
  Sparkles,
  Megaphone,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Radio,
  Zap,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { notificationService } from '../services/notificationService';
import { FCMSchemaModal } from './FCMSchemaModal';

export interface InAppNotification {
  id: string;
  type: 'order_status' | 'new_product' | 'flash_sale' | 'store_announcement' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: 'normal' | 'high';
  orderId?: string;
  productId?: number;
  linkView?: string;
  linkParams?: any;
}

const STORAGE_KEY = 'cdt_market_notifications_v1';
const SOUND_STORAGE_KEY = 'cdt_market_notifications_sound';

// Web Audio API gentle synthesizer chime
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // AudioContext blocked or not supported
  }
}

export const NotificationCenter: React.FC = () => {
  const { setCurrentView, config, orders } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'orders' | 'promos'>('all');
  const [isFCMModalOpen, setIsFCMModalOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    return notificationService.getPermissionStatus();
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }

    // Default seed notifications for fresh sessions
    return [
      {
        id: 'seed_app_download',
        type: 'store_announcement',
        title: '📥 Download Cyber Dynamic Android App',
        message: 'Install our fast mobile app for instant order push alerts, offline browsing & quick MoMo checkout.',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'high',
        linkView: 'download_app',
      },
      {
        id: 'seed_welcome',
        type: 'store_announcement',
        title: 'Welcome to Cyber Dynamic Technologies Uganda!',
        message: 'Kampala\'s trusted electronics & IT supply center. Enjoy same-day delivery & 1-year warranties on brand new laptops.',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'high',
        linkView: 'shop',
      },
      {
        id: 'seed_flash_deal',
        type: 'flash_sale',
        title: '⚡ Weekend Flash Deals Active',
        message: 'Discounts on HP Victus Core i7 Gaming Laptops, Epson EcoTank L3250 Wi-Fi Printers & MTN Wakanet Routers.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        priority: 'high',
        linkView: 'shop',
      },
      {
        id: 'seed_warranty',
        type: 'system',
        title: 'Genuine Tech & Physical Warranty',
        message: 'All laptops & equipment are inspected in Kampala dispatch hub before packaging.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true,
        priority: 'normal',
        linkView: 'store-policies',
        linkParams: { policy: 'warranty' },
      },
    ];
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Ignore
    }
  }, [notifications]);

  // Sync sound settings
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(soundEnabled));
    } catch {
      // Ignore
    }
  }, [soundEnabled]);

  // Fetch live store announcements from server on mount
  useEffect(() => {
    api.getAnnouncements()
      .then((res) => {
        if (res.announcements && Array.isArray(res.announcements)) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const fresh = res.announcements
              .filter((a) => !existingIds.has(a.id))
              .map((a) => ({
                id: a.id,
                type: (a.type as any) || 'store_announcement',
                title: a.title,
                message: a.message,
                timestamp: a.timestamp,
                read: false,
                priority: a.priority || 'normal',
                linkView: a.link?.view || 'shop',
                linkParams: a.link?.params,
              }));

            if (fresh.length > 0) {
              if (soundEnabled) playNotificationChime();
              return [...fresh, ...prev];
            }
            return prev;
          });
        }
      })
      .catch(() => {
        // Fallback
      });
  }, []);

  // Sync recent customer orders to notifications
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    setNotifications((prev) => {
      const existingOrderIds = new Set(prev.filter((n) => n.orderId).map((n) => `${n.orderId}_${n.title}`));
      const orderNotifications: InAppNotification[] = [];

      orders.slice(0, 3).forEach((ord) => {
        const orderKey = `${ord.order_number}_Order Placed`;
        if (!existingOrderIds.has(orderKey)) {
          orderNotifications.push({
            id: `ord_${ord.order_number}_created`,
            type: 'order_status',
            title: `Order ${ord.order_number} Received`,
            message: `Your order for UGX ${ord.total.toLocaleString()} is confirmed. Delivery zone: ${ord.delivery_zone || 'Kampala'}.`,
            timestamp: ord.created_at || new Date().toISOString(),
            read: false,
            priority: 'high',
            orderId: ord.order_number,
            linkView: 'track-order',
            linkParams: { orderNumber: ord.order_number },
          });
        }

        if (ord.status === 'shipped') {
          const shippedKey = `${ord.order_number}_Dispatched`;
          if (!existingOrderIds.has(shippedKey)) {
            orderNotifications.push({
              id: `ord_${ord.order_number}_shipped`,
              type: 'order_status',
              title: `Order ${ord.order_number} Dispatched 🚚`,
              message: 'Your package is in transit with our express delivery rider in Kampala.',
              timestamp: new Date().toISOString(),
              read: false,
              priority: 'high',
              orderId: ord.order_number,
              linkView: 'track-order',
              linkParams: { orderNumber: ord.order_number },
            });
          }
        }
      });

      if (orderNotifications.length > 0) {
        return [...orderNotifications, ...prev];
      }
      return prev;
    });
  }, [orders]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Real-time listener for programmatic and FCM notifications dispatched across the app
  useEffect(() => {
    const handleNewNotif = (e: Event) => {
      const custom = e as CustomEvent<any>;
      if (custom.detail) {
        const item = custom.detail;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === item.id)) return prev;
          return [
            {
              id: item.id,
              type: item.type,
              title: item.title,
              message: item.message,
              timestamp: item.timestamp,
              read: false,
              priority: item.priority || 'high',
              linkView: item.link?.view || item.linkView || 'shop',
              linkParams: item.link?.params || item.linkParams,
              orderId: item.orderId || item.link?.params?.orderNumber,
            },
            ...prev,
          ];
        });
      }
    };
    window.addEventListener('cdt_new_notification', handleNewNotif);
    return () => window.removeEventListener('cdt_new_notification', handleNewNotif);
  }, []);

  const handleRequestPushPermission = async () => {
    const status = await notificationService.requestPermission();
    setPushPermission(status);
    if (status === 'granted') {
      await notificationService.showBrowserNotification({
        title: 'Browser Push Notifications Active! 🔔',
        body: 'You are now set up to receive real-time order tracking and flash sale alerts.',
      });
    }
  };

  const handleTriggerOrderPush = async () => {
    await notificationService.notifyOrderUpdate({
      orderNumber: 'CDT-9041',
      status: 'shipped',
      customerName: 'Valued Client',
      totalAmount: 2450000,
      deliveryZone: 'Kampala Central (Nakasero & Kololo)',
    });
  };

  const handleTriggerFlashSalePush = async () => {
    await notificationService.notifyFlashSale({
      title: 'Weekend Tech Surge Deals',
      discountPercentage: '35%',
      category: 'Gaming Laptops & Printers',
      productSlug: 'hp-victus-15-core-i7',
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markItemAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (item: InAppNotification) => {
    markItemAsRead(item.id);
    setIsOpen(false);

    if (item.linkView === 'download_app') {
      window.dispatchEvent(new CustomEvent('cdt_open_android_modal'));
    } else if (item.linkView) {
      setCurrentView(item.linkView as any, item.linkParams);
    } else if (item.orderId) {
      setCurrentView('track-order', { orderNumber: item.orderId });
    }
  };

  // Simulate a live test notification
  const triggerSampleAlert = () => {
    const sample: InAppNotification = {
      id: `alert_${Date.now()}`,
      type: 'flash_sale',
      title: '⚡ Fresh Tech Arrival Alert!',
      message: 'New stock of Lenovo ThinkPad Core i7 Laptops & APC Smart-UPS just landed at CDT Kampala hub.',
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'high',
      linkView: 'shop',
    };
    if (soundEnabled) playNotificationChime();
    setNotifications((prev) => [sample, ...prev]);
  };

  // Filtered list
  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'orders') return item.type === 'order_status';
    if (filter === 'promos') return item.type === 'flash_sale' || item.type === 'new_product' || item.type === 'store_announcement';
    return true;
  });

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'order_status':
        return <Truck className="w-4 h-4 text-cyan-600" />;
      case 'flash_sale':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'new_product':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'store_announcement':
        return <Megaphone className="w-4 h-4 text-blue-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="header-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-700 hover:text-cyan-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
        title="Notifications & Store Alerts"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-2 top-16 sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 w-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[560px] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5 leading-none">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500 text-white">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Order updates & store announcements</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Push Permission Status Banner */}
          {pushPermission === 'default' && (
            <div className="p-3 bg-cyan-50 border-b border-cyan-100 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-[11px] leading-tight">Enable Browser Push Alerts</p>
                  <p className="text-[10px] text-slate-500">Get order tracking and flash deals even when browser is closed</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestPushPermission}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-[11px] shrink-0 transition-colors shadow-xs cursor-pointer"
              >
                Enable
              </button>
            </div>
          )}

          {pushPermission === 'granted' && (
            <div className="px-3 py-1.5 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-[10px] text-emerald-800 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Browser Push Notifications Active</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFCMModalOpen(true)}
                className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
              >
                FCM Schema Ready
              </button>
            </div>
          )}

          {pushPermission === 'denied' && (
            <div className="px-3 py-1.5 bg-rose-50 border-b border-rose-100 text-[10px] text-rose-700 flex items-center justify-between">
              <span>Push alerts blocked by browser</span>
              <span className="text-[9px] text-rose-500">Enable in browser settings</span>
            </div>
          )}

          {/* Filter Pills & Actions Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('orders')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  filter === 'orders'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Orders
              </button>
              <button
                type="button"
                onClick={() => setFilter('promos')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  filter === 'promos'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Promos
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Read all</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  title="Clear all notifications"
                  className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1 ml-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-[220px]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="font-bold text-xs text-slate-700">No notifications in this view</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                  Order tracking updates, price drops, and store announcements will appear here.
                </p>
                <button
                  type="button"
                  onClick={triggerSampleAlert}
                  className="mt-3 text-[11px] font-bold text-cyan-600 hover:underline cursor-pointer"
                >
                  Trigger test notification
                </button>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer relative group ${
                    item.read ? 'bg-white hover:bg-slate-50' : 'bg-cyan-50/40 hover:bg-cyan-50/70'
                  }`}
                >
                  {!item.read && (
                    <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
                  )}

                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                    {getIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className={`text-xs truncate ${item.read ? 'font-semibold text-slate-800' : 'font-extrabold text-slate-900'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5">
                      {item.priority === 'high' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
                          Priority
                        </span>
                      )}
                      {(item.linkView || item.orderId) && (
                        <span className="text-[10px] font-bold text-cyan-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          <span>View Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => deleteNotification(e, item.id)}
                    title="Dismiss"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-all cursor-pointer shrink-0 absolute right-2 top-3"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer with Push Permission, FCM Schema & Quick Test */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex flex-col gap-2 text-[11px]">
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={handleTriggerOrderPush}
                title="Dispatch a test Order Delivery push notification"
                className="px-2 py-1 rounded bg-white hover:bg-cyan-50 border border-slate-200 text-slate-700 hover:text-cyan-700 font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shadow-2xs"
              >
                <Truck className="w-3 h-3 text-cyan-600" />
                <span>Test Order Push</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerFlashSalePush}
                title="Dispatch a test Flash Sale push notification"
                className="px-2 py-1 rounded bg-white hover:bg-amber-50 border border-slate-200 text-slate-700 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Test Flash Sale</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFCMModalOpen(true)}
                title="View Firebase Cloud Messaging (FCM) Integration Schema"
                className="px-2 py-1 rounded bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shadow-2xs"
              >
                <Zap className="w-3 h-3 text-orange-600" />
                <span>FCM Schema</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
              <span className="truncate">Web Push & FCM Data Service</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setCurrentView('store-policies', { policy: 'privacy' });
                }}
                className="hover:text-slate-600 cursor-pointer underline"
              >
                Privacy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Cloud Messaging Schema Viewer Modal */}
      <FCMSchemaModal
        isOpen={isFCMModalOpen}
        onClose={() => setIsFCMModalOpen(false)}
      />
    </div>
  );
};
