import {
  AppNotification,
  FCMMessage,
  FCMNotificationPayload,
  FCMOrderUpdateData,
  FCMFlashSaleData,
  FCMPriceDropData,
  FCMDeviceRegistration,
  FCMTopic,
  NotificationPreferences,
  PushNotificationPayload,
  NotificationType,
} from '../types';

const STORAGE_KEYS = {
  PREFERENCES: 'cdt_push_preferences_v1',
  DEVICE_REGISTRATION: 'cdt_fcm_device_registration_v1',
  IN_APP_NOTIFICATIONS: 'cdt_market_notifications_v1',
  SOUND_ENABLED: 'cdt_market_notifications_sound',
};

type NotificationListener = (notification: AppNotification) => void;

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();
  private registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for message from service worker when push notification was clicked
      navigator.serviceWorker?.addEventListener('message', (event) => {
        if (event.data?.type === 'CDT_PUSH_NOTIFICATION_CLICKED') {
          this.handleNotificationClick(event.data.data);
        }
      });
    }
  }

  // =========================================================================
  // 1. CAPABILITY & PERMISSION MANAGEMENT
  // =========================================================================

  /**
   * Check if the current browser environment supports Push & Notification APIs
   */
  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current browser notification permission status
   */
  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * True if user has granted permission
   */
  public isPermissionGranted(): boolean {
    return this.getPermissionStatus() === 'granted';
  }

  /**
   * Request browser push notification permission from user
   */
  public async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      
      // Update saved preferences
      const currentPrefs = this.getPreferences();
      this.savePreferences({
        ...currentPrefs,
        browserPushEnabled: permission === 'granted',
        pushPermissionStatus: permission,
      });

      if (permission === 'granted') {
        // Ensure device registration is initialized
        await this.getOrRegisterDeviceToken();
      }

      return permission;
    } catch (error) {
      console.warn('[NotificationService] Failed to request notification permission:', error);
      return 'denied';
    }
  }

  // =========================================================================
  // 2. USER PREFERENCES & TOPIC SUBSCRIPTIONS
  // =========================================================================

  /**
   * Retrieve notification preferences from storage
   */
  public getPreferences(): NotificationPreferences {
    const defaultPrefs: NotificationPreferences = {
      browserPushEnabled: this.isPermissionGranted(),
      inAppEnabled: true,
      orderUpdates: true,
      promotions: true,
      newArrivals: true,
      storeAnnouncements: true,
      pushPermissionStatus: this.getPermissionStatus(),
    };

    if (typeof localStorage === 'undefined') return defaultPrefs;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultPrefs,
          ...parsed,
          pushPermissionStatus: this.getPermissionStatus(),
        };
      }
    } catch (e) {
      // Fallback
    }

    return defaultPrefs;
  }

  /**
   * Update notification preferences
   */
  public savePreferences(prefs: Partial<NotificationPreferences>): NotificationPreferences {
    const updated: NotificationPreferences = {
      ...this.getPreferences(),
      ...prefs,
    };

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
      } catch (e) {
        // Ignore quota
      }
    }

    return updated;
  }

  /**
   * Subscribe to a specific FCM topic (e.g. 'flash_sales', 'order_updates')
   */
  public async subscribeToTopic(topic: FCMTopic): Promise<boolean> {
    const reg = this.getDeviceRegistration();
    if (!reg.subscribedTopics.includes(topic)) {
      reg.subscribedTopics.push(topic);
      this.saveDeviceRegistration(reg);
    }
    return true;
  }

  /**
   * Unsubscribe from an FCM topic
   */
  public async unsubscribeFromTopic(topic: FCMTopic): Promise<boolean> {
    const reg = this.getDeviceRegistration();
    reg.subscribedTopics = reg.subscribedTopics.filter((t) => t !== topic);
    this.saveDeviceRegistration(reg);
    return true;
  }

  // =========================================================================
  // 3. FCM DATA SCHEMA & DEVICE TOKEN MANAGEMENT
  // =========================================================================

  /**
   * Retrieve or create a persistent FCM device registration schema
   * Ready for future Firebase Cloud Messaging SDK initialization.
   */
  public getDeviceRegistration(): FCMDeviceRegistration {
    const defaultTopics: FCMTopic[] = ['all_users', 'order_updates', 'flash_sales', 'price_drops'];

    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.DEVICE_REGISTRATION);
        if (stored) {
          const parsed: FCMDeviceRegistration = JSON.parse(stored);
          parsed.lastActiveAt = new Date().toISOString();
          return parsed;
        }
      } catch (e) {
        // Fallback
      }
    }

    // Detect device platform for FCM payload optimization
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    let platform: FCMDeviceRegistration['platform'] = 'desktop_browser';
    if (/android/i.test(ua)) {
      platform = window.matchMedia('(display-mode: standalone)').matches ? 'android_webapk' : 'android_browser';
    } else if (/iphone|ipad|ipod/i.test(ua)) {
      platform = 'ios_pwa';
    }

    // Generate a structured token placeholder (compatible with FCM token format)
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const token = `fcm_cdt_ug_${platform}_${randomHex}`;

    const reg: FCMDeviceRegistration = {
      token,
      platform,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      subscribedTopics: defaultTopics,
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      fcmEnabled: true,
    };

    this.saveDeviceRegistration(reg);
    return reg;
  }

  /**
   * Save device registration and sync with backend
   */
  public saveDeviceRegistration(reg: FCMDeviceRegistration): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.DEVICE_REGISTRATION, JSON.stringify(reg));
      } catch (e) {
        // Ignore
      }
    }

    // Best-effort background sync with server
    this.syncTokenWithBackend(reg).catch(() => {});
  }

  /**
   * Sync the FCM device registration token with the server
   */
  public async syncTokenWithBackend(reg: FCMDeviceRegistration): Promise<boolean> {
    try {
      await fetch('/api/notifications/fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reg),
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the current FCM token for sending push messages
   */
  public async getOrRegisterDeviceToken(): Promise<string> {
    const reg = this.getDeviceRegistration();
    return reg.token;
  }

  // =========================================================================
  // 4. CORE BROWSER PUSH NOTIFICATION DISPATCH
  // =========================================================================

  /**
   * Get active ServiceWorkerRegistration for native PWA notifications
   */
  private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    if (!this.registrationPromise) {
      this.registrationPromise = navigator.serviceWorker.ready.catch(() => null);
    }
    return this.registrationPromise;
  }

  /**
   * Play synthesizer chime via Web Audio API
   */
  public playChime(): void {
    try {
      if (typeof window === 'undefined') return;
      const soundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) !== 'false';
      if (!soundEnabled) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // AudioContext blocked
    }
  }

  /**
   * Show a native browser notification (using ServiceWorker if available, falling back to Notification)
   */
  public async showBrowserNotification(payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isPermissionGranted()) {
      return false;
    }

    const {
      title,
      body,
      icon = '/pwa-192x192.png',
      badge = '/pwa-192x192.png',
      image,
      tag = `cdt-notif-${Date.now()}`,
      data = {},
      actions = [],
      vibrate = [200, 100, 200],
      renotify = true,
      requireInteraction = false,
      silent = false,
    } = payload;

    // Play chime sound
    if (!silent) {
      this.playChime();
    }

    // Try showing via Service Worker registration (native Android WebAPK standard)
    const swReg = await this.getServiceWorkerRegistration();
    if (swReg && 'showNotification' in swReg) {
      try {
        await swReg.showNotification(title, {
          body,
          icon,
          badge,
          image,
          tag,
          data: {
            ...data,
            timestamp: Date.now(),
          },
          actions: actions as any,
          vibrate,
          renotify,
          requireInteraction,
        } as any);
        return true;
      } catch (err) {
        console.warn('[NotificationService] ServiceWorker showNotification failed, falling back to Notification constructor', err);
      }
    }

    // Fallback to standard Window Notification constructor
    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge,
        image,
        tag,
        data,
        vibrate,
        renotify,
      } as any);

      notification.onclick = () => {
        window.focus();
        notification.close();
        this.handleNotificationClick(data);
      };

      return true;
    } catch (err) {
      console.warn('[NotificationService] Window Notification failed:', err);
      return false;
    }
  }

  // =========================================================================
  // 5. DOMAIN-SPECIFIC DISPATCHERS: ORDER UPDATES & FLASH SALES
  // =========================================================================

  /**
   * Dispatch Order Update Notification (e.g. Processing, Shipped, Out for Delivery)
   */
  public async notifyOrderUpdate(params: {
    orderNumber: string;
    status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'completed' | 'cancelled';
    customerName?: string;
    totalAmount?: number;
    deliveryZone?: string;
    trackingLink?: string;
  }): Promise<AppNotification> {
    const { orderNumber, status, customerName, totalAmount, deliveryZone } = params;

    let title = `Order #${orderNumber} Update`;
    let message = `Status changed to: ${status}`;
    let icon = '📦';

    switch (status) {
      case 'confirmed':
      case 'processing':
        title = `Order #${orderNumber} Confirmed! ✅`;
        message = `Your hardware order ${totalAmount ? `(UGX ${totalAmount.toLocaleString()})` : ''} has been received and is being prepared in our Kampala warehouse.`;
        icon = '✅';
        break;
      case 'shipped':
        title = `Order #${orderNumber} Dispatched 🚚`;
        message = `Your package is on the way! Dispatched for delivery in ${deliveryZone || 'Kampala'}.`;
        icon = '🚚';
        break;
      case 'out_for_delivery':
        title = `Order #${orderNumber} Out for Delivery 🛵`;
        message = `Our express courier is in transit to your address with your order. Keep your phone on!`;
        icon = '🛵';
        break;
      case 'completed':
        title = `Order #${orderNumber} Delivered 🎉`;
        message = `Thank you for shopping with Cyber Dynamic Technologies Uganda. Genuine warranty is active.`;
        icon = '🎉';
        break;
      case 'cancelled':
        title = `Order #${orderNumber} Cancelled`;
        message = `Order has been cancelled. If this is an error, contact our hotline.`;
        icon = '⚠️';
        break;
    }

    // 1. Structure as FCM-compatible payload
    const fcmData: FCMOrderUpdateData = {
      type: 'order_update',
      order_id: orderNumber,
      order_number: orderNumber,
      status,
      customer_name: customerName,
      total_amount: totalAmount ? String(totalAmount) : undefined,
      delivery_zone: deliveryZone,
      tag: `order_${orderNumber}`,
      timestamp: new Date().toISOString(),
    };

    // 2. Persist to in-app notification center
    const inAppNotification: AppNotification = {
      id: `ord_${orderNumber}_${status}_${Date.now()}`,
      type: 'order_status',
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'high',
      link: {
        view: 'track-order',
        params: { orderNumber },
      },
    };

    this.saveInAppNotification(inAppNotification);

    // 3. Trigger Browser Push Notification if permitted & preferred
    const prefs = this.getPreferences();
    if (prefs.browserPushEnabled && prefs.orderUpdates) {
      await this.showBrowserNotification({
        title,
        body: message,
        tag: `order_${orderNumber}`,
        data: {
          url: `/#orders`,
          linkView: 'track-order',
          linkParams: { orderNumber },
          fcmData,
        },
        actions: [
          { action: 'track_order', title: 'Track Package 🚚' },
          { action: 'dismiss', title: 'Close' },
        ],
      });
    }

    return inAppNotification;
  }

  /**
   * Dispatch Flash Sale Notification
   */
  public async notifyFlashSale(params: {
    title: string;
    discountPercentage?: number | string;
    category?: string;
    productId?: number;
    productSlug?: string;
    bannerImage?: string;
    endsAt?: string;
    customMessage?: string;
  }): Promise<AppNotification> {
    const {
      title,
      discountPercentage = '30%',
      category = 'Tech & Electronics',
      productId,
      productSlug,
      bannerImage,
      endsAt,
      customMessage,
    } = params;

    const discountStr = typeof discountPercentage === 'number' ? `${discountPercentage}%` : discountPercentage;
    const alertTitle = `⚡ Flash Sale: ${title} (Up to ${discountStr} OFF)`;
    const message =
      customMessage ||
      `Massive limited-time price drop on ${category} at Cyber Dynamic Technologies Kampala. Shop before stock sells out!`;

    // 1. Structure as FCM-compatible payload
    const fcmData: FCMFlashSaleData = {
      type: 'flash_sale',
      sale_id: `sale_${Date.now()}`,
      title,
      discount_percentage: discountStr,
      category,
      product_id: productId ? String(productId) : undefined,
      product_slug: productSlug,
      banner_image: bannerImage,
      ends_at: endsAt,
      tag: 'flash_sale',
    };

    // 2. Persist to in-app notification center
    const inAppNotification: AppNotification = {
      id: `flash_${Date.now()}`,
      type: 'flash_sale',
      title: alertTitle,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'high',
      link: {
        view: productSlug ? 'product-detail' : 'shop',
        params: productSlug ? { slug: productSlug } : { category },
      },
    };

    this.saveInAppNotification(inAppNotification);

    // 3. Trigger Browser Push Notification if permitted & preferred
    const prefs = this.getPreferences();
    if (prefs.browserPushEnabled && prefs.promotions) {
      await this.showBrowserNotification({
        title: alertTitle,
        body: message,
        image: bannerImage || '/pwa-512x512.png',
        tag: 'flash_sale_active',
        data: {
          url: productSlug ? `/#product/${productSlug}` : '/#shop',
          linkView: productSlug ? 'product-detail' : 'shop',
          linkParams: productSlug ? { slug: productSlug } : { category },
          fcmData,
        },
        actions: [
          { action: 'shop_now', title: 'Shop Deals ⚡' },
          { action: 'dismiss', title: 'Later' },
        ],
      });
    }

    return inAppNotification;
  }

  /**
   * Dispatch Price Drop Alert Notification
   */
  public async notifyPriceDrop(params: {
    productId: number | string;
    productName: string;
    oldPrice: number;
    newPrice: number;
    productSlug?: string;
    productImage?: string;
  }): Promise<AppNotification> {
    const { productId, productName, oldPrice, newPrice, productSlug, productImage } = params;
    const diff = oldPrice - newPrice;
    const pct = Math.round((diff / oldPrice) * 100);

    const title = `📉 Price Drop: ${productName}`;
    const message = `Price reduced from UGX ${oldPrice.toLocaleString()} to UGX ${newPrice.toLocaleString()} (Save UGX ${diff.toLocaleString()} / ${pct}% OFF)!`;

    const fcmData: FCMPriceDropData = {
      type: 'price_drop',
      product_id: String(productId),
      product_name: productName,
      product_slug: productSlug || String(productId),
      product_image: productImage,
      old_price: String(oldPrice),
      new_price: String(newPrice),
      drop_amount: String(diff),
      currency: 'UGX',
    };

    const inAppNotification: AppNotification = {
      id: `pdrop_${productId}_${Date.now()}`,
      type: 'promotion',
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'high',
      link: {
        view: 'product-detail',
        params: { slug: productSlug || String(productId) },
      },
    };

    this.saveInAppNotification(inAppNotification);

    const prefs = this.getPreferences();
    if (prefs.browserPushEnabled) {
      await this.showBrowserNotification({
        title,
        body: message,
        image: productImage,
        tag: `pdrop_${productId}`,
        data: {
          url: `/#product/${productSlug || productId}`,
          linkView: 'product-detail',
          linkParams: { slug: productSlug || String(productId) },
          fcmData,
        },
        actions: [{ action: 'buy_now', title: 'Buy Now 🛒' }],
      });
    }

    return inAppNotification;
  }

  // =========================================================================
  // 6. FUTURE FCM INCOMING MESSAGE HANDLER
  // =========================================================================

  /**
   * Ingest and process a message structured according to Firebase Cloud Messaging (FCM) standards.
   * This ensures seamless drop-in compatibility when Firebase Web SDK is added.
   */
  public async handleFCMIncomingMessage(fcmMessage: FCMMessage): Promise<void> {
    const notification = fcmMessage.notification;
    const data = (fcmMessage.data || {}) as Record<string, any>;

    const title = notification?.title || data.title || 'Cyber Dynamic Technologies';
    const body = notification?.body || data.body || data.message || 'New update available';
    const type = (data.type || 'store_announcement') as NotificationType;

    // Persist into in-app notifications
    const appNotif: AppNotification = {
      id: fcmMessage.messageId || `fcm_${Date.now()}`,
      type,
      title,
      message: body,
      timestamp: new Date().toISOString(),
      read: false,
      priority: fcmMessage.priority === 'high' ? 'high' : 'normal',
      link: {
        view: data.click_action || data.linkView || 'shop',
        params: data.linkParams ? JSON.parse(data.linkParams) : undefined,
      },
    };

    this.saveInAppNotification(appNotif);

    // If browser supports and permits, trigger push
    const prefs = this.getPreferences();
    if (prefs.browserPushEnabled) {
      await this.showBrowserNotification({
        title,
        body,
        icon: notification?.icon || data.icon || '/pwa-192x192.png',
        image: notification?.image || data.image || data.banner_image,
        tag: data.tag || `fcm_${Date.now()}`,
        data: {
          ...data,
          url: data.click_action || '/',
        },
      });
    }
  }

  // =========================================================================
  // 7. IN-APP NOTIFICATION STORE & REACTIVE SUBSCRIPTIONS
  // =========================================================================

  /**
   * Save notification in localStorage and dispatch to live listeners
   */
  private saveInAppNotification(notification: AppNotification): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const existingStr = localStorage.getItem(STORAGE_KEYS.IN_APP_NOTIFICATIONS);
      let list: any[] = [];
      if (existingStr) {
        list = JSON.parse(existingStr);
      }
      // Insert at the front, deduplicating by ID
      list = [notification, ...list.filter((item) => item.id !== notification.id)].slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.IN_APP_NOTIFICATIONS, JSON.stringify(list));
    } catch {
      // Ignore quota
    }

    // Notify in-process listeners
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (e) {
        console.error('[NotificationService] Listener error:', e);
      }
    });

    // Dispatch global window event for cross-component re-rendering
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cdt_new_notification', {
          detail: notification,
        })
      );
    }
  }

  /**
   * Subscribe to new incoming notifications
   */
  public onNotification(callback: NotificationListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Internal click router when push notification is clicked
   */
  private handleNotificationClick(data: any): void {
    if (!data) return;
    if (data.linkView && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cdt_navigate_view', {
          detail: {
            view: data.linkView,
            params: data.linkParams,
          },
        })
      );
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
