import { MarketplaceConfig, CustomerOrder, Product, Category, DeliveryZone, Coupon } from '../src/types';
import { DEFAULT_MARKETPLACE_CONFIG } from '../src/data/defaultConfig';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_DELIVERY_ZONES, INITIAL_COUPONS } from '../src/data/cyberCatalog';
import { hashPassword, encryptField, decryptField } from './security';

export interface UserAccount {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'admin' | 'manager' | 'customer' | 'editor';
  status?: 'active' | 'suspended';
  admin_notes?: string;
  avatar_url?: string;
  is_email_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  last_login?: string;
  reset_token?: string;
  reset_token_expires?: number;
  verification_token?: string;
  addresses: any[];
  wishlist: number[];
}

export class MarketplaceStore {
  public config: MarketplaceConfig = { ...DEFAULT_MARKETPLACE_CONFIG };
  public products: Product[] = [...INITIAL_PRODUCTS];
  public categories: Category[] = [...INITIAL_CATEGORIES];
  public deliveryZones: DeliveryZone[] = [...INITIAL_DELIVERY_ZONES];
  public coupons: Coupon[] = [...INITIAL_COUPONS];
  public orders: CustomerOrder[] = [];

  public users: UserAccount[] = [
    {
      id: 1,
      email: 'opwataallan@gmail.com',
      password_hash: hashPassword(process.env.ADMIN_INITIAL_PASSWORD || 'Opw_1NDC'),
      first_name: 'Allan',
      last_name: 'Opwata',
      phone: '+256779743101',
      role: 'admin',
      status: 'active',
      admin_notes: 'Primary Super Administrator for Cyber Dynamic Tech Marketplace and WooCommerce API configuration.',
      is_email_verified: true,
      two_factor_enabled: false,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      addresses: [
        {
          id: 'addr_superadmin',
          type: 'shipping',
          first_name: 'Allan',
          last_name: 'Opwata',
          phone: '+256779743101',
          email: 'opwataallan@gmail.com',
          district: 'Kampala',
          city: 'Kampala Central',
          address_1: 'Kampala',
          landmark: 'Cyber Dynamic Tech Headquarters',
          is_default: true,
        },
      ],
      wishlist: [],
    },
    {
      id: 2,
      email: 'admin@cyberdynamictech.com',
      password_hash: hashPassword('Admin@Cyber2026!'),
      first_name: 'Cyber',
      last_name: 'Administrator',
      phone: '+256779743101',
      role: 'admin',
      status: 'active',
      admin_notes: 'Secondary backup admin account for Cyber Dynamic Tech system maintenance.',
      is_email_verified: true,
      two_factor_enabled: false,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      addresses: [],
      wishlist: [],
    },
    {
      id: 3,
      email: 'grace.akello@kumi-tech.ug',
      password_hash: hashPassword('GraceTech2026!'),
      first_name: 'Grace',
      last_name: 'Akello',
      phone: '+256701234567',
      role: 'manager',
      status: 'active',
      admin_notes: 'Regional Operations Manager for Eastern Uganda hub in Kumi.',
      is_email_verified: true,
      two_factor_enabled: false,
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      addresses: [],
      wishlist: [],
    },
    {
      id: 4,
      email: 'content.editor@cyberdynamictech.com',
      password_hash: hashPassword('EditorPass2026!'),
      first_name: 'Sarah',
      last_name: 'Editor',
      phone: '+256752000111',
      role: 'editor',
      status: 'active',
      admin_notes: 'Product catalog curator & banner copywriter.',
      is_email_verified: true,
      two_factor_enabled: false,
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      addresses: [],
      wishlist: [],
    },
  ];

  public webhookLogs: Array<{ event: string; payload: any; timestamp: string }> = [];

  constructor() {
    // Check if env credentials exist to update WooCommerce settings
    if (process.env.WOOCOMMERCE_URL) {
      this.config.woocommerce.store_url = process.env.WOOCOMMERCE_URL;
    }
    if (process.env.WOOCOMMERCE_CONSUMER_KEY) {
      this.config.woocommerce.consumer_key = process.env.WOOCOMMERCE_CONSUMER_KEY;
      this.config.woocommerce.consumer_key_configured = true;
    }
    if (process.env.WOOCOMMERCE_CONSUMER_SECRET) {
      this.config.woocommerce.consumer_secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
      this.config.woocommerce.consumer_secret_configured = true;
    }
    if (process.env.WOOCOMMERCE_WEBHOOK_SECRET) {
      this.config.woocommerce.webhook_secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
      this.config.woocommerce.webhook_secret_configured = true;
    }
  }

  public getSafeUser(user: UserAccount) {
    const { password_hash, reset_token, reset_token_expires, verification_token, ...safe } = user;
    return {
      ...safe,
      phone: decryptField(safe.phone),
    };
  }
}

export const store = new MarketplaceStore();
