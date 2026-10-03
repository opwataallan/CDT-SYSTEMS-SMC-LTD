import fs from 'fs';
import path from 'path';
import {
  MarketplaceConfig,
  CustomerOrder,
  Product,
  Category,
  DeliveryZone,
  Coupon,
  SmsLogEntry,
  PriceDropAlert,
  Store,
  VendorOrder,
  WalletTransaction,
  PayoutRequest,
  StoreReview,
  VendorStaff,
  StorePromotion,
} from '../src/types';
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
  role: 'admin' | 'manager' | 'customer' | 'editor' | 'vendor' | 'vendor_staff';
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
  vendor_id?: string;
  store_id?: string;
  permissions?: string[];
}

export const INITIAL_STORES: Store[] = [
  {
    id: 'store-cyber-dynamic-tech',
    slug: 'cyber-dynamic-tech',
    name: 'Cyber Dynamic Tech (Main Store)',
    owner_id: 1,
    owner_name: 'Store Administrator',
    email: 'admin@cyberdynamictech.com',
    phone: '+256779743101',
    status: 'active',
    is_verified: true,
    is_platform_store: true,
    logo_url: '/logo.png',
    banner_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
    description: 'Uganda’s premier flagship distributor for genuine brand-new HP, Dell, Lenovo computers, Apple devices, Epson EcoTank systems, and enterprise networking hardware.',
    city: 'Kampala',
    district: 'Kampala Central',
    country: 'Uganda',
    address: 'Plot 14 Kampala Road, Central Business District, Kampala',
    tin_number: '1002345678',
    registration_number: 'CDT-UG-88902',
    product_categories: ['Laptops', 'Desktops', 'Smartphones', 'Networking', 'Accessories', 'Solar & Power'],
    rating: 4.9,
    rating_count: 148,
    commission_rate: 0, // Main platform store operates with 0% platform fee
    payout_details: {
      method: 'momo',
      account_number: '0394760459',
      account_name: 'OPWATA ALLAN SAMUEL',
      bank_name: 'MTN Mobile Money',
      notes: 'Primary corporate revenue account',
    },
    delivery_settings: {
      type: 'platform',
      base_delivery_fee: 10000,
      free_delivery_threshold: 500000,
      estimated_days: 'Same day across Kampala & Wakiso; 1-2 days upcountry',
      districts_served: ['Kampala Central', 'Nakawa', 'Makindye', 'Rubaga', 'Kawempe', 'Wakiso', 'Mukono', 'Jinja', 'Mbarara', 'Gulu'],
      allow_pickup: true,
      pickup_address: 'Plot 14 Kampala Road, CDT Showroom, Kampala',
    },
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'store-kampala-tech',
    slug: 'kampala-tech-hub',
    name: 'Kampala Tech Hub',
    owner_id: 5,
    owner_name: 'David Mukasa',
    email: 'vendor@kampalatech.ug',
    phone: '+256772112233',
    status: 'active',
    is_verified: true,
    is_platform_store: false,
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    banner_url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1600&q=80',
    description: 'Specialists in high-performance computer gaming gear, mechanical keyboards, studio recording microphones, ultra-wide monitors, and creator tech gadgets in Kampala.',
    city: 'Kampala',
    district: 'Nakawa',
    country: 'Uganda',
    address: 'Lugogo Mall Tech Wing, Shop G-12, Nakawa, Kampala',
    tin_number: '1019882231',
    registration_number: 'KTH-2023-412',
    product_categories: ['Accessories', 'Gaming', 'Monitors', 'Audio'],
    rating: 4.8,
    rating_count: 54,
    commission_rate: 8,
    payout_details: {
      method: 'momo',
      account_number: '0772112233',
      account_name: 'DAVID MUKASA',
      bank_name: 'MTN Mobile Money',
    },
    delivery_settings: {
      type: 'vendor',
      base_delivery_fee: 12000,
      free_delivery_threshold: 400000,
      estimated_days: 'Same day express boda in Kampala',
      districts_served: ['Kampala Central', 'Nakawa', 'Wakiso'],
      allow_pickup: true,
      pickup_address: 'Lugogo Mall Tech Wing, Shop G-12, Kampala',
    },
    created_at: '2024-03-15T10:00:00.000Z',
  },
  {
    id: 'store-victoria-gadgets',
    slug: 'victoria-electronics-jinja',
    name: 'Victoria Electronics Jinja',
    owner_id: 6,
    owner_name: 'Emmanuel Otim',
    email: 'vendor@victoriagadgets.ug',
    phone: '+256703998877',
    status: 'active',
    is_verified: true,
    is_platform_store: false,
    logo_url: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=300&q=80',
    banner_url: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=1600&q=80',
    description: 'Eastern Uganda’s trusted supplier of solar inverter systems, hybrid battery banks, agricultural IoT sensors, smart home security cameras, and rugged mobile phones.',
    city: 'Jinja',
    district: 'Jinja',
    country: 'Uganda',
    address: 'Plot 28 Main Street, Near Jinja City Post Office, Jinja',
    tin_number: '1023349911',
    registration_number: 'VEJ-2022-901',
    product_categories: ['Solar & Power', 'Smartphones', 'Security', 'IoT'],
    rating: 4.7,
    rating_count: 38,
    commission_rate: 7.5,
    payout_details: {
      method: 'airtel',
      account_number: '0703998877',
      account_name: 'EMMANUEL OTIM',
      bank_name: 'Airtel Money Pay',
    },
    delivery_settings: {
      type: 'vendor',
      base_delivery_fee: 15000,
      free_delivery_threshold: 600000,
      estimated_days: '1-2 days to Jinja, Iganga, Mukono, Kampala',
      districts_served: ['Jinja', 'Iganga', 'Mukono', 'Kampala Central', 'Mbale'],
      allow_pickup: true,
      pickup_address: 'Plot 28 Main Street, Jinja City',
    },
    created_at: '2024-04-10T12:00:00.000Z',
  },
];

export const INITIAL_STORE_REVIEWS: StoreReview[] = [
  {
    id: 'srev_1',
    store_id: 'store-cyber-dynamic-tech',
    reviewer_name: 'Brian Kigozi',
    reviewer_email: 'brian.k@gmail.com',
    rating: 5,
    comment: 'Exceptional service and genuine products! Purchased 4 Dell Latitude laptops for our accounting firm in Kampala. Received next-day delivery with intact warranty seals.',
    date_created: '2025-01-14T09:30:00Z',
    verified_purchase: true,
    order_number: 'CDT-2025-8812',
    status: 'approved',
    vendor_reply: {
      comment: 'Thank you Brian! We appreciate your trust in Cyber Dynamic Tech for your enterprise IT infrastructure.',
      replied_at: '2025-01-14T11:00:00Z',
    },
  },
  {
    id: 'srev_2',
    store_id: 'store-kampala-tech',
    reviewer_name: 'Patricia Namubiru',
    reviewer_email: 'patricia.nam@yahoo.com',
    rating: 5,
    comment: 'The mechanical keyboard and studio condenser microphone were top quality. Fast delivery to Ntinda via safe Boda dispatch.',
    date_created: '2025-02-01T14:20:00Z',
    verified_purchase: true,
    order_number: 'CDT-2025-9104',
    status: 'approved',
  },
  {
    id: 'srev_3',
    store_id: 'store-victoria-gadgets',
    reviewer_name: 'Kenneth Okello',
    reviewer_email: 'okello.ken@gmail.com',
    rating: 5,
    comment: 'Ordered a 1kVA hybrid solar inverter for our clinic in Jinja. Extremely reliable, arrived within 4 hours. Great seller!',
    date_created: '2025-02-18T16:00:00Z',
    verified_purchase: true,
    order_number: 'CDT-2025-9430',
    status: 'approved',
  },
];

export class MarketplaceStore {
  public config: MarketplaceConfig = { ...DEFAULT_MARKETPLACE_CONFIG };
  // Only products and categories fetched from the live API are stored (no dummy products)
  public products: Product[] = [];
  public categories: Category[] = [];
  public deliveryZones: DeliveryZone[] = [...INITIAL_DELIVERY_ZONES];
  public coupons: Coupon[] = [...INITIAL_COUPONS];
  public orders: CustomerOrder[] = [];
  public priceDropAlerts: PriceDropAlert[] = [];

  // Multi-Store Marketplace entities
  public stores: Store[] = [...INITIAL_STORES];
  public vendorOrders: VendorOrder[] = [];
  public walletTransactions: WalletTransaction[] = [];
  public payouts: PayoutRequest[] = [];
  public storeReviews: StoreReview[] = [...INITIAL_STORE_REVIEWS];
  public vendorStaff: VendorStaff[] = [];
  public promotions: StorePromotion[] = [];

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
    {
      id: 5,
      email: 'vendor@kampalatech.ug',
      password_hash: hashPassword('Kampala2026!'),
      first_name: 'David',
      last_name: 'Mukasa',
      phone: '+256772112233',
      role: 'vendor',
      status: 'active',
      vendor_id: 'store-kampala-tech',
      store_id: 'store-kampala-tech',
      admin_notes: 'Verified Vendor: Kampala Tech Hub owner.',
      is_email_verified: true,
      two_factor_enabled: false,
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      addresses: [],
      wishlist: [],
    },
    {
      id: 6,
      email: 'vendor@victoriagadgets.ug',
      password_hash: hashPassword('Victoria2026!'),
      first_name: 'Emmanuel',
      last_name: 'Otim',
      phone: '+256703998877',
      role: 'vendor',
      status: 'active',
      vendor_id: 'store-victoria-gadgets',
      store_id: 'store-victoria-gadgets',
      admin_notes: 'Verified Vendor: Victoria Electronics Jinja owner.',
      is_email_verified: true,
      two_factor_enabled: false,
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
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
          const hasVendor = this.users.some((u) => u.role === 'vendor');
          if (!hasVendor) {
            this.users.push(
              {
                id: 201,
                email: 'vendor@kampalatechhub.ug',
                password_hash: '298e0aa62f790295cbda7fd8fa5d27b9cd895ec0fcfbcf1cbcc8ff7f2ad61175',
                first_name: 'David',
                last_name: 'Kato',
                phone: '+256701234567',
                role: 'vendor',
                status: 'active',
                vendor_id: 'store-kampala-tech',
                store_id: 'store-kampala-tech',
                admin_notes: 'Verified Vendor: Kampala Tech Hub owner.',
                is_email_verified: true,
                two_factor_enabled: false,
                created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
                addresses: [],
                wishlist: [],
              },
              {
                id: 202,
                email: 'vendor@victoriagadgets.ug',
                password_hash: '298e0aa62f790295cbda7fd8fa5d27b9cd895ec0fcfbcf1cbcc8ff7f2ad61175',
                first_name: 'Grace',
                last_name: 'Namubiru',
                phone: '+256752345678',
                role: 'vendor',
                status: 'active',
                vendor_id: 'store-victoria-gadgets',
                store_id: 'store-victoria-gadgets',
                admin_notes: 'Verified Vendor: Victoria Electronics Jinja owner.',
                is_email_verified: true,
                two_factor_enabled: false,
                created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
                addresses: [],
                wishlist: [],
              }
            );
          }
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

        // Multi-Store collections
        if (Array.isArray(data.stores) && data.stores.length > 0) {
          this.stores = data.stores;
        }
        if (Array.isArray(data.vendorOrders)) {
          this.vendorOrders = data.vendorOrders;
        }
        if (Array.isArray(data.walletTransactions)) {
          this.walletTransactions = data.walletTransactions;
        }
        if (Array.isArray(data.payouts)) {
          this.payouts = data.payouts;
        }
        if (Array.isArray(data.storeReviews) && data.storeReviews.length > 0) {
          this.storeReviews = data.storeReviews;
        }
        if (Array.isArray(data.vendorStaff)) {
          this.vendorStaff = data.vendorStaff;
        }
        if (Array.isArray(data.promotions)) {
          this.promotions = data.promotions;
        }

        // Backward compatibility: ensure Cyber Dynamic Tech platform store always exists
        const hasMainStore = this.stores.some((s) => s.id === 'store-cyber-dynamic-tech');
        if (!hasMainStore) {
          const mainSeed = INITIAL_STORES.find((s) => s.id === 'store-cyber-dynamic-tech');
          if (mainSeed) this.stores.unshift(mainSeed);
        }

        // Backward compatibility: ensure seed vendors exist if stores only has main
        if (this.stores.length === 1) {
          for (const s of INITIAL_STORES) {
            if (!this.stores.some((existing) => existing.id === s.id)) {
              this.stores.push(s);
            }
          }
        }

        // Backward compatibility: assign legacy/existing products to Cyber Dynamic Tech store
        for (const p of this.products) {
          if (!p.vendor_id) {
            p.vendor_id = 'store-cyber-dynamic-tech';
            p.vendor_name = 'Cyber Dynamic Tech (Main Store)';
            p.store_slug = 'cyber-dynamic-tech';
          }
        }

        console.log(
          `[Database] Loaded persistent data: ${this.products.length} products, ${this.stores.length} stores, ${this.orders.length} orders, ${this.users.length} users.`
        );
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
        stores: this.stores,
        vendorOrders: this.vendorOrders,
        walletTransactions: this.walletTransactions,
        payouts: this.payouts,
        storeReviews: this.storeReviews,
        vendorStaff: this.vendorStaff,
        promotions: this.promotions,
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
      stores: this.stores,
      vendorOrders: this.vendorOrders,
      walletTransactions: this.walletTransactions,
      payouts: this.payouts,
      storeReviews: this.storeReviews,
      vendorStaff: this.vendorStaff,
      promotions: this.promotions,
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
    if (Array.isArray(data.stores)) this.stores = data.stores;
    if (Array.isArray(data.vendorOrders)) this.vendorOrders = data.vendorOrders;
    if (Array.isArray(data.walletTransactions)) this.walletTransactions = data.walletTransactions;
    if (Array.isArray(data.payouts)) this.payouts = data.payouts;
    if (Array.isArray(data.storeReviews)) this.storeReviews = data.storeReviews;
    if (Array.isArray(data.vendorStaff)) this.vendorStaff = data.vendorStaff;
    if (Array.isArray(data.promotions)) this.promotions = data.promotions;
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

  public getStoreByIdOrSlug(identifier: string): Store | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    return this.stores.find(
      (s) => s.id.toLowerCase() === clean || s.slug.toLowerCase() === clean
    );
  }

  public getVendorWallet(vendorId: string) {
    const store = this.stores.find((s) => s.id === vendorId);
    const storeOrders = this.vendorOrders.filter((vo) => vo.vendor_id === vendorId);
    const transactions = this.walletTransactions.filter((t) => t.vendor_id === vendorId);
    const vendorPayouts = this.payouts.filter((p) => p.vendor_id === vendorId);

    // Gross sales from orders
    const grossSales = storeOrders.reduce((sum, vo) => sum + (vo.subtotal || 0), 0);
    // Platform commission deducted
    const platformCommission = storeOrders.reduce((sum, vo) => sum + (vo.platform_commission_amount || 0), 0);
    // Delivery fees credited
    const deliveryFees = storeOrders.reduce((sum, vo) => sum + (vo.shipping_fee || 0), 0);
    // Net vendor earnings = gross + delivery - commission
    const totalEarnings = Math.max(0, grossSales + deliveryFees - platformCommission);

    // Paid balance = sum of approved/paid payouts
    const paidBalance = vendorPayouts
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    // Pending payouts currently in progress
    const pendingPayouts = vendorPayouts
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + p.amount, 0);

    // Available balance = Net Earnings - Paid Balance - Pending Payouts
    const availableBalance = Math.max(0, totalEarnings - paidBalance - pendingPayouts);

    // Pending balance from processing/unpaid vendor orders
    const pendingBalance = storeOrders
      .filter((vo) => vo.payment_status === 'pending')
      .reduce((sum, vo) => sum + (vo.vendor_net_earnings || 0), 0);

    return {
      vendor_id: vendorId,
      store_name: store?.name || vendorId,
      currency: 'UGX',
      gross_sales: grossSales,
      platform_commission: platformCommission,
      delivery_fees: deliveryFees,
      total_earnings: totalEarnings,
      available_balance: availableBalance,
      pending_balance: pendingBalance,
      paid_balance: paidBalance,
      pending_payouts: pendingPayouts,
      transactions: transactions.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
      payouts: vendorPayouts.sort(
        (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
      ),
      order_count: storeOrders.length,
    };
  }
}

export const store = new MarketplaceStore();
