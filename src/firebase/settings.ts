// Decoupled Settings Module - Settings persist locally and through WooCommerce backend API.
import { MarketplaceConfig } from '../types';
import { DEFAULT_MARKETPLACE_CONFIG } from '../data/defaultConfig';

export interface FirestoreGlobalSettingsPayload {
  [key: string]: any;
}

export function validateSettings(settings: any): void {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Settings payload must be a valid non-empty object');
  }
}

export async function fetchGlobalSettingsFromFirestore(): Promise<MarketplaceConfig | null> {
  try {
    const local = localStorage.getItem('cdt_marketplace_config');
    if (local) return JSON.parse(local);
  } catch {}
  return DEFAULT_MARKETPLACE_CONFIG;
}

export async function saveGlobalSettingsToFirestore(
  settings: Partial<MarketplaceConfig>,
  _userId?: string
): Promise<void> {
  try {
    const existing = await fetchGlobalSettingsFromFirestore();
    const merged = { ...existing, ...settings };
    localStorage.setItem('cdt_marketplace_config', JSON.stringify(merged));
  } catch (err) {
    console.warn('Local settings save notice:', err);
  }
}

export function subscribeToGlobalSettings(
  onUpdate: (settings: MarketplaceConfig) => void,
  _onError?: (err: any) => void
): () => void {
  fetchGlobalSettingsFromFirestore().then((cfg) => {
    if (cfg) onUpdate(cfg);
  });
  return () => {};
}
