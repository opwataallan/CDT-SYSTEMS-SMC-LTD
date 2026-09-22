import fs from 'fs';
import path from 'path';
import { MarketplaceConfig, CustomerOrder, Product, Category, DeliveryZone, Coupon, SmsLogEntry, PriceDropAlert } from '../src/types';
import { DEFAULT_MARKETPLACE_CONFIG } from '../src/data/defaultConfig';
import { INITIAL_DELIVERY_ZONES, INITIAL_COUPONS } from '../src/data/cyberCatalog';
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
  // Only products and categories fetched from the live API are stored (no dummy products)
  public products: Product[] = [];
  public categories: Category[] = [];
  public deliveryZones: DeliveryZone[] = [...INITIAL_DELIVERY_ZONES];
  public coupons: Coupon[] = [...INITIAL_COUPONS];
  public orders: CustomerOrder[] = [];
  public priceDropAlerts: PriceDropAlert[] = [];

  private dbPath: string = path.join(process.cwd(), 'data', 'database.json');

  public users: UserAccount[] = [
    {
      id: 1,
      email: 'admin@cyberdynamictech.com',
      password_hash: hashPassword(process.env.ADMIN_INITIAL_PASSWORD || 'Opw_1NDC'),
      first_name: 'Store',
      last_name: 'Administrator',
      phone: '+256779743101',
      role: 'admin',
      status: 'active',
      admin_notes: 'Primary Super Administrator for Cyber Dynamic Technologies Marketplace and WooCommerce API configuration.',
      is_email_verified: true,
      two_factor_enabled: false,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      addresses: [
        {
          id: 'addr_superadmin',
          type: 'shipping',
          first_name: 'Store',
          last_name: 'Administrator',
          phone: '+256779743101',
          email: 'admin@cyberdynamictech.com',
          district: 'Kampala',
          city: 'Kampala Central',
          address_1: 'Kampala',
          landmark: 'Cyber Dynamic Technologies Headquarters',
          is_default: true,
        },
      ],
      wishlist: [],
    },
    {
      id: 2,
      email: 'operations@cyberdynamictech.com',
      password_hash: hashPassword('Admin@Cyber2026!'),
      first_name: 'Cyber',
      last_name: 'Administrator',
      phone: '+256779743101',
      role: 'admin',
      status: 'active',
      admin_notes: 'Secondary backup admin account for Cyber Dynamic Technologies system maintenance.',
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
  public smsLogs: SmsLogEntry[] = [];

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

    // Check if SMS env credentials exist
    if (process.env.SMS_SENDER_ID) {
      this.config.sms.sender_id = process.env.SMS_SENDER_ID;
    }
    if (process.env.AFRICASTALKING_USERNAME) {
      this.config.sms.username = process.env.AFRICASTALKING_USERNAME;
    }
    const smsKey = process.env.SMS_API_KEY || process.env.AFRICASTALKING_API_KEY;
    if (smsKey) {
      this.config.sms.api_key = smsKey;
      this.config.sms.api_key_configured = true;
    }
    if (process.env.TWILIO_ACCOUNT_SID) {
      this.config.sms.account_sid = process.env.TWILIO_ACCOUNT_SID;
    }
    if (process.env.TWILIO_AUTH_TOKEN) {
      this.config.sms.api_secret = process.env.TWILIO_AUTH_TOKEN;
      this.config.sms.api_secret_configured = true;
    }
    if (process.env.SMS_ENDPOINT_URL) {
      this.config.sms.custom_endpoint_url = process.env.SMS_ENDPOINT_URL;
    }

    // Default payment configuration for Uganda Mobile Money
    if (this.config?.payments) {
      this.config.payments.manual_payment_number = '0394760459';
      this.config.payments.manual_account_name = 'OPWATA ALLAN SAMUEL';
      this.config.payments.manual_payment_instructions =
        'Make the payment to 0394760459 and put account names OPWATA ALLAN SAMUEL, please use order number as reference ID';
    }

    // Load any previously persisted data from disk
    this.loadDatabaseFromDisk();
  }

  public loadDatabaseFromDisk(): boolean {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const data = JSON.parse(raw);
        if (data.config) {
          this.config = { ...this.config, ...data.config };
        }
        if (Array.isArray(data.products) && data.products.length > 0) {
          this.products = data.products;
        }
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          this.categories = data.categories;
        }
        if (Array.isArray(data.orders)) {
          this.orders = data.orders;
        }
        if (Array.isArray(data.users) && data.users.length > 0) {
          this.users = data.users;
        }
        if (Array.isArray(data.deliveryZones)) {
          this.deliveryZones = data.deliveryZones;
        }
        if (Array.isArray(data.coupons)) {
          this.coupons = data.coupons;
        }
        if (Array.isArray(data.priceDropAlerts)) {
          this.priceDropAlerts = data.priceDropAlerts;
        }
        console.log(`[Database] Loaded persistent data: ${this.products.length} products, ${this.orders.length} orders, ${this.users.length} users, ${this.priceDropAlerts.length} price drop alerts.`);
        return true;
      }
    } catch (err: any) {
      console.warn(`[Database] Failed to load database file: ${err.message}`);
    }
    return false;
  }

  public saveDatabaseToDisk(): boolean {
    try {
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const dump = {
        saved_at: new Date().toISOString(),
        config: this.config,
        products: this.products,
        categories: this.categories,
        orders: this.orders,
        users: this.users,
        deliveryZones: this.deliveryZones,
        coupons: this.coupons,
        priceDropAlerts: this.priceDropAlerts,
      };

      const tmpPath = `${this.dbPath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(dump, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.dbPath);
      return true;
    } catch (err: any) {
      console.error(`[Database] Error saving database to disk: ${err.message}`);
      return false;
    }
  }

  public exportDatabase() {
    return {
      exported_at: new Date().toISOString(),
      config: this.config,
      products: this.products,
      categories: this.categories,
      orders: this.orders,
      users: this.users.map((u) => this.getSafeUser(u)),
      deliveryZones: this.deliveryZones,
      coupons: this.coupons,
      priceDropAlerts: this.priceDropAlerts,
    };
  }

  public importDatabase(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (data.config) this.config = { ...this.config, ...data.config };
    if (Array.isArray(data.products)) this.products = data.products;
    if (Array.isArray(data.categories)) this.categories = data.categories;
    if (Array.isArray(data.orders)) this.orders = data.orders;
    if (Array.isArray(data.deliveryZones)) this.deliveryZones = data.deliveryZones;
    if (Array.isArray(data.coupons)) this.coupons = data.coupons;
    if (Array.isArray(data.priceDropAlerts)) this.priceDropAlerts = data.priceDropAlerts;
    this.saveDatabaseToDisk();
    return true;
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
