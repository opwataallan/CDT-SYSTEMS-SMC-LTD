import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, cleanFirestoreData } from './index';
import { MarketplaceConfig } from '../types';
import { DEFAULT_MARKETPLACE_CONFIG } from '../data/defaultConfig';

export interface FirestoreGlobalSettingsPayload {
  storeName?: string;
  storeDescription?: string;
  logoUrl?: string;
  mobileLogoUrl?: string;
  faviconUrl?: string;
  defaultProductPlaceholder?: string;
  themeColor?: string;
  secondaryThemeColor?: string;
  currency?: string;
  contactPhone?: string;
  contactEmail?: string;
  businessAddress?: string;
  socialMediaLinks?: any;
  shippingSettings?: any;
  taxSettings?: any;
  paymentSettings?: any;
  notificationSettings?: any;
  checkoutSettings?: any;
  storefrontSettings?: any;
  posSettings?: any;
  vendorSettings?: any;
  marketplaceSettings?: any;
  config?: Partial<MarketplaceConfig>;
  updatedAt?: string;
  updatedBy?: string;
  [key: string]: any;
}

/**
 * Validates settings object before writing to Firestore
 */
export function validateSettings(settings: Partial<MarketplaceConfig> | FirestoreGlobalSettingsPayload): void {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Settings payload must be a valid non-empty object');
  }

  // Validate themeColor format if provided
  const themeColor =
    (settings as any).themeColor ||
    (settings as any).branding?.primary_color ||
    (settings as any).config?.branding?.primary_color;
  if (themeColor && typeof themeColor === 'string' && themeColor.trim()) {
    if (!themeColor.startsWith('#') && !themeColor.startsWith('rgb')) {
      throw new Error(`Invalid theme color format: "${themeColor}". Must be a valid hex (#RRGGBB) or rgb() color.`);
    }
  }

  // Validate storeName length if provided
  const storeName =
    (settings as any).storeName ||
    (settings as any).general?.site_name ||
    (settings as any).config?.general?.site_name;
  if (storeName && typeof storeName === 'string' && storeName.length > 200) {
    throw new Error('Store name must not exceed 200 characters');
  }
}

/**
 * Maps MarketplaceConfig (or partial category) to the Firestore settings/global document structure
 */
export function mapConfigToFirestorePayload(
  configOrCategory: Partial<MarketplaceConfig> | { category: keyof MarketplaceConfig; data: any }
): FirestoreGlobalSettingsPayload {
  let fullConfig: Partial<MarketplaceConfig> = {};

  if ('category' in configOrCategory && 'data' in configOrCategory) {
    fullConfig = {
      [configOrCategory.category]: configOrCategory.data,
    };
  } else {
    fullConfig = configOrCategory as Partial<MarketplaceConfig>;
  }

  const payload: FirestoreGlobalSettingsPayload = {
    updatedAt: new Date().toISOString(),
    updatedBy: auth.currentUser?.email || 'admin',
  };

  // General settings mapping
  if (fullConfig.general) {
    if (fullConfig.general.site_name !== undefined) payload.storeName = fullConfig.general.site_name;
    if (fullConfig.general.site_tagline !== undefined) payload.storeDescription = fullConfig.general.site_tagline;
    if (fullConfig.general.phone !== undefined) payload.contactPhone = fullConfig.general.phone;
    if (fullConfig.general.contact_email !== undefined) payload.contactEmail = fullConfig.general.contact_email;
    if (fullConfig.general.business_address !== undefined || (fullConfig.general as any).address !== undefined) {
      payload.businessAddress = fullConfig.general.business_address || (fullConfig.general as any).address;
    }
    if (fullConfig.general.currency !== undefined) payload.currency = fullConfig.general.currency;
  }

  // Branding settings mapping
  if (fullConfig.branding) {
    if (fullConfig.branding.logo_url !== undefined || (fullConfig.branding as any).main_logo !== undefined) {
      payload.logoUrl = fullConfig.branding.logo_url || (fullConfig.branding as any).main_logo;
    }
    if ((fullConfig.branding as any).mobile_logo !== undefined || (fullConfig.branding as any).mobileLogoUrl !== undefined) {
      payload.mobileLogoUrl = (fullConfig.branding as any).mobile_logo || (fullConfig.branding as any).mobileLogoUrl;
    }
    if ((fullConfig.branding as any).favicon !== undefined || (fullConfig.branding as any).faviconUrl !== undefined) {
      payload.faviconUrl = (fullConfig.branding as any).favicon || (fullConfig.branding as any).faviconUrl;
    }
    if (fullConfig.branding.default_product_placeholder !== undefined) {
      payload.defaultProductPlaceholder = fullConfig.branding.default_product_placeholder;
    }
    if (fullConfig.branding.primary_color !== undefined) {
      payload.themeColor = fullConfig.branding.primary_color;
    }
    if (fullConfig.branding.secondary_color !== undefined) {
      payload.secondaryThemeColor = fullConfig.branding.secondary_color;
    }
  }

  // Specific domain settings
  if (fullConfig.social) payload.socialMediaLinks = fullConfig.social;
  if (fullConfig.delivery) payload.shippingSettings = fullConfig.delivery;
  if (fullConfig.taxes) payload.taxSettings = fullConfig.taxes;
  if (fullConfig.payments) payload.paymentSettings = fullConfig.payments;
  if (fullConfig.notifications) payload.notificationSettings = fullConfig.notifications;
  if (fullConfig.checkout) payload.checkoutSettings = fullConfig.checkout;
  if (fullConfig.pos) payload.posSettings = fullConfig.pos;
  if (fullConfig.marketplace) {
    payload.marketplaceSettings = fullConfig.marketplace;
    payload.vendorSettings = fullConfig.marketplace;
  }

  if (fullConfig.homepage || fullConfig.products || fullConfig.categories) {
    payload.storefrontSettings = {
      ...(fullConfig.homepage ? { homepage: fullConfig.homepage } : {}),
      ...(fullConfig.products ? { products: fullConfig.products } : {}),
      ...(fullConfig.categories ? { categories: fullConfig.categories } : {}),
    };
  }

  // Include full config object for 31-category preservation
  payload.config = fullConfig;

  return payload;
}

/**
 * Maps Firestore settings/global document data back into a complete MarketplaceConfig
 */
export function mapFirestoreDataToConfig(
  firestoreData: Record<string, any>,
  fallbackConfig: MarketplaceConfig = DEFAULT_MARKETPLACE_CONFIG
): MarketplaceConfig {
  const base: MarketplaceConfig = JSON.parse(JSON.stringify(fallbackConfig));

  // Merge full config if stored
  if (firestoreData.config && typeof firestoreData.config === 'object') {
    for (const key of Object.keys(firestoreData.config)) {
      if ((base as any)[key] && typeof (base as any)[key] === 'object') {
        (base as any)[key] = { ...(base as any)[key], ...firestoreData.config[key] };
      } else {
        (base as any)[key] = firestoreData.config[key];
      }
    }
  }

  // Map top-level aliases into base config
  if (firestoreData.storeName) base.general.site_name = firestoreData.storeName;
  if (firestoreData.storeDescription) base.general.site_tagline = firestoreData.storeDescription;
  if (firestoreData.currency) base.general.currency = firestoreData.currency;
  if (firestoreData.contactPhone) base.general.phone = firestoreData.contactPhone;
  if (firestoreData.contactEmail) base.general.contact_email = firestoreData.contactEmail;
  if (firestoreData.businessAddress) {
    base.general.business_address = firestoreData.businessAddress;
    (base.general as any).address = firestoreData.businessAddress;
  }

  if (firestoreData.logoUrl) {
    base.branding.logo_url = firestoreData.logoUrl;
    (base.branding as any).main_logo = firestoreData.logoUrl;
  }
  if (firestoreData.mobileLogoUrl) {
    (base.branding as any).mobile_logo = firestoreData.mobileLogoUrl;
  }
  if (firestoreData.faviconUrl) {
    (base.branding as any).favicon = firestoreData.faviconUrl;
  }
  if (firestoreData.defaultProductPlaceholder) {
    base.branding.default_product_placeholder = firestoreData.defaultProductPlaceholder;
  }
  if (firestoreData.themeColor) {
    base.branding.primary_color = firestoreData.themeColor;
  }
  if (firestoreData.secondaryThemeColor) {
    base.branding.secondary_color = firestoreData.secondaryThemeColor;
  }

  if (firestoreData.socialMediaLinks) base.social = { ...base.social, ...firestoreData.socialMediaLinks };
  if (firestoreData.shippingSettings) base.delivery = { ...base.delivery, ...firestoreData.shippingSettings };
  if (firestoreData.taxSettings) base.taxes = { ...base.taxes, ...firestoreData.taxSettings };
  if (firestoreData.paymentSettings) base.payments = { ...base.payments, ...firestoreData.paymentSettings };
  if (firestoreData.notificationSettings) base.notifications = { ...base.notifications, ...firestoreData.notificationSettings };
  if (firestoreData.checkoutSettings) base.checkout = { ...base.checkout, ...firestoreData.checkoutSettings };
  if (firestoreData.posSettings) base.pos = { ...base.pos, ...firestoreData.posSettings };
  if (firestoreData.marketplaceSettings) base.marketplace = { ...(base.marketplace || {}), ...firestoreData.marketplaceSettings };
  if (firestoreData.vendorSettings) base.marketplace = { ...(base.marketplace || {}), ...firestoreData.vendorSettings };

  if (firestoreData.storefrontSettings) {
    if (firestoreData.storefrontSettings.homepage) {
      base.homepage = { ...base.homepage, ...firestoreData.storefrontSettings.homepage };
    }
    if (firestoreData.storefrontSettings.products) {
      base.products = { ...base.products, ...firestoreData.storefrontSettings.products };
    }
    if (firestoreData.storefrontSettings.categories) {
      base.categories = { ...base.categories, ...firestoreData.storefrontSettings.categories };
    }
  }

  return base;
}

/**
 * Saves or updates global settings in Cloud Firestore: settings/global
 * Uses merge behavior to preserve any other existing settings.
 */
export async function saveGlobalSettingsToFirestore(
  settingsToSave: Partial<MarketplaceConfig> | { category: keyof MarketplaceConfig; data: any }
): Promise<{ success: boolean; data: FirestoreGlobalSettingsPayload }> {
  validateSettings(settingsToSave);

  const payload = mapConfigToFirestorePayload(settingsToSave);
  const docRef = doc(db, 'settings', 'global');
  const path = 'settings/global';

  try {
    // 1. Merge write into centralized settings/global
    const cleanPayload = cleanFirestoreData(payload);
    await setDoc(docRef, cleanPayload, { merge: true });

    // 2. Also write to specific domain document e.g. /settings/general, /settings/storefront, /settings/payment
    if ('category' in settingsToSave && settingsToSave.category) {
      const cat = String(settingsToSave.category);
      const catDocRef = doc(db, 'settings', cat);
      const domainPayload = cleanFirestoreData({
        category: cat,
        data: settingsToSave.data,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || 'admin',
      });
      await setDoc(catDocRef, domainPayload, { merge: true });
    }

    return { success: true, data: cleanPayload };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Reads settings/global from Cloud Firestore.
 * Returns null if the document does not exist yet.
 */
export async function loadGlobalSettingsFromFirestore(): Promise<MarketplaceConfig | null> {
  const docRef = doc(db, 'settings', 'global');
  const path = 'settings/global';

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return mapFirestoreDataToConfig(data);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

/**
 * Real-time listener for settings/global using onSnapshot.
 * Allows instant live updates across storefront, admin portal, POS, and checkout.
 */
export function subscribeToGlobalSettings(
  onUpdate: (config: MarketplaceConfig) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, 'settings', 'global');
  const path = 'settings/global';

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const mergedConfig = mapFirestoreDataToConfig(data);
        onUpdate(mergedConfig);
      }
    },
    (error) => {
      console.warn('Real-time settings listener notice:', error.message);
      if (onError) {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (e: any) {
          onError(e);
        }
      }
    }
  );
}
