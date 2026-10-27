import { MarketplaceConfig, StoreSettings } from '../types';
import { DEFAULT_MARKETPLACE_CONFIG } from '../data/defaultConfig';

type Listener = (config: MarketplaceConfig) => void;

// Helper to adjust hex color brightness/tint
function adjustColorBrightness(hex: string, percent: number): string {
  if (!hex || !hex.startsWith('#')) return hex;
  let cleanHex = hex.slice(1);
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return hex;

  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Convert hex to rgb values string e.g. "146, 13, 53"
function hexToRgbValues(hex: string): string {
  if (!hex || !hex.startsWith('#')) return '146, 13, 53';
  let cleanHex = hex.slice(1);
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return '146, 13, 53';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

class SettingsService {
  private config: MarketplaceConfig = { ...DEFAULT_MARKETPLACE_CONFIG };
  private listeners: Set<Listener> = new Set();
  private isLoaded: boolean = false;

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    try {
      const saved = localStorage.getItem('cdt_marketplace_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = { ...DEFAULT_MARKETPLACE_CONFIG, ...parsed };
      }
    } catch (e) {
      // Use defaults
    }
    this.applyThemeToDOM();
  }

  public setPrimaryColor(color: string) {
    this.updateCategory('branding', { primary_color: color });
  }

  public getConfig(): MarketplaceConfig {
    return this.config;
  }

  public get<T = any>(path: string, defaultValue?: T): T {
    const parts = path.split('.');
    let current: any = this.config;
    for (const part of parts) {
      if (current === undefined || current === null) return defaultValue as T;
      current = current[part];
    }
    return (current !== undefined ? current : defaultValue) as T;
  }

  public updateConfig(partial: Partial<MarketplaceConfig>) {
    this.config = { ...this.config, ...partial };
    try {
      localStorage.setItem('cdt_marketplace_config', JSON.stringify(this.config));
    } catch {}
    this.applyThemeToDOM();
    this.notifyListeners();
  }

  public updateCategory<K extends keyof MarketplaceConfig>(category: K, data: Partial<MarketplaceConfig[K]>) {
    this.config = {
      ...this.config,
      [category]: {
        ...(this.config[category] as any),
        ...data,
      },
    };
    try {
      localStorage.setItem('cdt_marketplace_config', JSON.stringify(this.config));
    } catch {}
    this.applyThemeToDOM();
    this.notifyListeners();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.config);
      } catch (err) {
        console.error('Error notifying settings listener:', err);
      }
    }
  }

  // Format price using currency settings
  public formatPrice(amount: number): string {
    const symbol = this.config.general.currency_symbol || 'UGX';
    const position = this.config.general.currency_position || 'left';
    const decimals = this.config.general.decimal_places || 0;
    const formattedNum = (amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return position === 'left' ? `${symbol} ${formattedNum}` : `${formattedNum} ${symbol}`;
  }

  // Convert to backward-compatible StoreSettings
  public toStoreSettings(): StoreSettings {
    return {
      site_name: this.config.general.site_name,
      site_url: this.config.general.site_url,
      tagline: this.config.general.site_tagline,
      logo_url: this.config.branding.logo_url || (this.config.branding as any).main_logo,
      mobile_logo_url: (this.config.branding as any).mobile_logo,
      favicon_url: (this.config.branding as any).favicon,
      theme_color: this.config.branding.primary_color,
      phone: this.config.general.phone,
      order_hotline: this.config.general.phone,
      whatsapp_number: this.config.general.whatsapp_number,
      email: this.config.general.contact_email,
      address: this.config.general.business_address,
      physical_location: this.config.general.physical_location,
      business_hours: 'Mon - Sat: 8:00 AM - 7:00 PM',
      currency: this.config.general.currency,
      currency_symbol: this.config.general.currency_symbol,
      woocommerce_connected: this.config.woocommerce.connection_status === 'connected',
      woocommerce_url: this.config.woocommerce.store_url,
      last_sync: this.config.woocommerce.last_sync_timestamp,
      notice_banner: {
        enabled: this.config.homepage.announcement_bar.enabled,
        text: this.config.homepage.announcement_bar.text,
        link: this.config.homepage.announcement_bar.link,
      },
      hero_banner_image: this.config.homepage.hero_banner_image || '/assets/cdt-hero-banner.svg',
      hero_banner_link: this.config.homepage.hero_banner_link || 'shop',
    };
  }

  // Apply dynamic colors and styles to DOM root
  public applyThemeToDOM() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const { branding, appearance, general } = this.config;

    // Dynamically sync favicon
    const favUrl = (branding as any).favicon || (branding as any).faviconUrl;
    if (favUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = favUrl;
    }

    // Dynamically sync site title if default
    if (general?.site_name && document.title.includes('Cyber Dynamic Technologies')) {
      document.title = `${general.site_name} | Technology • Solutions • Growth`;
    }

    const primary = branding.primary_color || '#920d35';
    const primaryHover = branding.accent_color || adjustColorBrightness(primary, -15);
    const primaryDark = adjustColorBrightness(primary, -28);
    const primaryLight = adjustColorBrightness(primary, 92);
    const primary100 = adjustColorBrightness(primary, 82);
    const primary200 = adjustColorBrightness(primary, 65);
    const primaryRgb = hexToRgbValues(primary);

    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--brand-primary-hover', primaryHover);
    root.style.setProperty('--brand-primary-dark', primaryDark);
    root.style.setProperty('--brand-primary-light', primaryLight);
    root.style.setProperty('--brand-primary-100', primary100);
    root.style.setProperty('--brand-primary-200', primary200);
    root.style.setProperty('--brand-primary-rgb', primaryRgb);

    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-hover', primaryHover);
    root.style.setProperty('--color-primary-light', primaryLight);
    root.style.setProperty('--color-primary-dark', primaryDark);

    if (branding.secondary_color) {
      root.style.setProperty('--color-secondary', branding.secondary_color);
    }
    if (branding.accent_color) {
      root.style.setProperty('--color-accent', branding.accent_color);
    }

    // Border radius mapping
    const radiusMap: Record<string, string> = {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      full: '9999px',
    };
    if (appearance.border_radius && radiusMap[appearance.border_radius]) {
      root.style.setProperty('--radius', radiusMap[appearance.border_radius]);
    }
  }
}

export const settingsService = new SettingsService();
