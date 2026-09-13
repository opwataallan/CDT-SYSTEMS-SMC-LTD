export interface ProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface ProductCategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface ProductAttributeOption {
  name: string;
  options: string[];
}

export interface ProductVariation {
  id: number;
  sku: string;
  barcode?: string;
  price: number;
  regular_price: number;
  sale_price?: number;
  on_sale: boolean;
  attributes: Record<string, string>; // e.g. { "Storage": "512GB SSD", "RAM": "16GB" }
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number;
  image?: string;
}

export interface ProductReview {
  id: number;
  reviewer: string;
  reviewer_email?: string;
  rating: number;
  review: string;
  date_created: string;
  verified: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  barcode?: string;
  price: number;
  regular_price: number;
  sale_price?: number;
  on_sale: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number;
  manage_stock: boolean;
  brand: string;
  categories: ProductCategoryRef[];
  images: ProductImage[];
  attributes: ProductAttributeOption[];
  variations?: ProductVariation[];
  short_description: string;
  description: string;
  average_rating: number;
  rating_count: number;
  featured?: boolean;
  flash_sale?: boolean;
  flash_sale_end?: string;
  warranty?: string;
  specifications?: Record<string, string>;
  reviews?: ProductReview[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
  image?: string;
  description?: string;
  icon?: string;
}

export interface CartItem {
  id: string; // unique cart line ID (combines product ID & variation ID)
  productId: number;
  product: Product;
  variationId?: number;
  variation?: ProductVariation;
  selectedAttributes?: Record<string, string>;
  quantity: number;
  unitPrice: number;
}

export interface CustomerAddress {
  id: string;
  type: 'shipping' | 'billing';
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  district: string;
  city: string;
  address_1: string;
  landmark?: string;
  delivery_instructions?: string;
  is_default?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface DeliveryZone {
  id: string;
  name: string;
  districts: string[];
  fee: number;
  free_threshold?: number;
  estimated_delivery: string;
  estimated_days?: string;
  description: string;
}

export type PaymentMethodType = 'momo' | 'airtel' | 'card' | 'cod';

export interface PaymentDetails {
  method: PaymentMethodType;
  phone_number?: string;
  transaction_ref?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'awaiting_confirmation';
  account_name?: string;
  payment_number?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  payment_proof_note?: string;
}

export type OrderStatus = 'pending' | 'pending_payment' | 'processing' | 'on-hold' | 'packed' | 'shipped' | 'out-for-delivery' | 'delivered' | 'completed' | 'cancelled' | 'refunded' | 'failed';

export interface OrderTimelineEvent {
  title: string;
  status: OrderStatus;
  timestamp: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface OrderLineItem {
  id: number;
  product_id: number;
  variation_id?: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
  attributes?: Record<string, string>;
}

export interface CustomerOrder {
  id: number;
  order_number: string;
  status: OrderStatus;
  currency: string;
  date_created: string;
  total: number;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  coupon_code?: string;
  line_items: OrderLineItem[];
  billing: CustomerAddress;
  shipping: CustomerAddress;
  payment_method: PaymentMethodType;
  payment_method_title: string;
  payment_details?: PaymentDetails;
  delivery_zone: string;
  timeline: OrderTimelineEvent[];
  customer_note?: string;
  pos_receipt_details?: any;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  payment_submitted?: boolean;
  payment_submitted_at?: string;
  payment_proof_note?: string;
  payment_confirmed_by?: string;
  payment_confirmed_at?: string;
  woocommerce_order_id?: number;
  woocommerce_synced?: boolean;
  woocommerce_sync_error?: string;
}

export interface Coupon {
  id: number;
  code: string;
  amount: number;
  discount_type: 'percent' | 'fixed_cart';
  min_spend?: number;
  max_spend?: number;
  description: string;
  expiry_date?: string;
}

export type UserRole = 'admin' | 'manager' | 'customer' | 'editor';

export interface CustomerUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  status?: 'active' | 'suspended';
  admin_notes?: string;
  avatar_url?: string;
  is_email_verified?: boolean;
  two_factor_enabled?: boolean;
  created_at?: string;
  last_login?: string;
  addresses: CustomerAddress[];
  wishlist: number[]; // Product IDs
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  bgGradient: string;
  accentColor: string;
  imageUrl: string;
  highlightPrice?: string;
  originalPrice?: string;
  brand?: string;
  productId?: number;
  active: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_email: string;
  action: string;
  category: string;
  details: string;
  ip?: string;
  status: 'success' | 'warning' | 'error';
}

// -------------------------------------------------------------
// Comprehensive 31-Category Central Settings System Architecture
// -------------------------------------------------------------

export interface GeneralSettings {
  site_name: string;
  site_tagline: string;
  site_url: string;
  contact_email: string;
  phone: string;
  whatsapp_number: string;
  business_address: string;
  physical_location: string;
  country: string;
  currency: string;
  currency_symbol: string;
  currency_position: 'left' | 'right';
  decimal_places: number;
  date_format: string;
  timezone: string;
  language: string;
  default_country: string;
  default_city: string;
  store_email: string;
  support_email: string;
}

export interface BrandingSettings {
  logo_url: string;
  mobile_logo_url: string;
  dark_logo_url: string;
  favicon_url: string;
  login_logo_url: string;
  email_logo_url: string;
  default_product_placeholder: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  bg_color: string;
}

export interface AppearanceSettings {
  default_theme: 'light' | 'dark' | 'system';
  button_style: 'solid' | 'gradient' | 'outline';
  border_radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  card_style: 'elevated' | 'bordered' | 'flat';
  font_family: string;
  header_style: 'classic' | 'dense' | 'floating';
  footer_style: 'columns' | 'compact' | 'simple';
  product_grid_desktop: '3' | '4' | '5';
  product_grid_mobile: '1' | '2';
  show_breadcrumbs: boolean;
}

export interface HomepageSectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  title: string;
  subtitle?: string;
  item_count?: number;
  category_filter?: string;
}

export interface HomepageSettings {
  sections: HomepageSectionConfig[];
  banners: HeroBanner[];
  announcement_bar: {
    enabled: boolean;
    text: string;
    link?: string;
    bg_color?: string;
    text_color?: string;
  };
}

export interface ProductDisplaySettings {
  products_per_page: number;
  default_sorting: 'popularity' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  enable_wishlist: boolean;
  enable_reviews: boolean;
  enable_compare: boolean;
  enable_quick_view: boolean;
  enable_buy_now: boolean;
  enable_add_to_cart: boolean;
  show_sku: boolean;
  show_stock: boolean;
  show_ratings: boolean;
  show_discount_percentage: boolean;
  show_related_products: boolean;
  show_recently_viewed: boolean;
  show_product_badges: boolean;
}

export interface ProductBadgeConfig {
  id: string;
  name: string;
  text: string;
  bg_color: string;
  text_color: string;
  position: 'top-left' | 'top-right';
  enabled: boolean;
}

export interface CheckoutSettings {
  allow_guest_checkout: boolean;
  require_account: boolean;
  phone_required: boolean;
  email_required: boolean;
  address_required: boolean;
  allow_delivery_instructions: boolean;
  enable_coupons: boolean;
  allow_order_notes: boolean;
  require_terms_acceptance: boolean;
  require_privacy_acceptance: boolean;
  terms_url: string;
  privacy_url: string;
}

export interface DeliverySettings {
  zones: DeliveryZone[];
  express_delivery_enabled: boolean;
  free_shipping_enabled: boolean;
  local_pickup_enabled: boolean;
  local_pickup_address: string;
}

export interface PaymentGatewayConfig {
  momo_enabled: boolean;
  momo_merchant_code?: string;
  momo_name: string;
  airtel_enabled: boolean;
  airtel_merchant_code?: string;
  airtel_name: string;
  card_enabled: boolean;
  card_provider: 'flutterwave' | 'pesapal' | 'stripe';
  cod_enabled: boolean;
  cod_max_limit: number;
  currency: string;
  manual_payment_number?: string;
  manual_account_name?: string;
  manual_payment_instructions?: string;
}

export interface TaxSettings {
  enable_taxes: boolean;
  tax_rate_percent: number;
  prices_include_tax: boolean;
  tax_label: string;
}

export interface NotificationSettings {
  order_confirmation_customer: boolean;
  order_status_update: boolean;
  admin_new_order_alert: boolean;
  admin_alert_email: string;
  admin_alert_phone: string;
}

export interface EmailSettings {
  sender_name: string;
  sender_email: string;
  reply_to_email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  header_logo_url: string;
  footer_text: string;
  welcome_subject: string;
  order_confirmed_subject: string;
}

export interface SmsSettings {
  enabled: boolean;
  provider: 'africastalking' | 'twilio' | 'uganda_sms';
  sender_id: string;
  notify_on_dispatch: boolean;
  notify_on_delivery: boolean;
}

export interface WhatsAppSettings {
  enabled: boolean;
  business_number: string;
  auto_greeting_message: string;
  enable_order_on_whatsapp: boolean;
}

export interface SeoSettings {
  meta_title: string;
  meta_description: string;
  keywords: string;
  og_image_url: string;
  twitter_handle: string;
  google_site_verification: string;
  robots_index: boolean;
  sitemap_enabled: boolean;
}

export interface SocialMediaSettings {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  x: string;
  whatsapp: string;
  linkedin: string;
}

export interface AnalyticsSettings {
  ga4_measurement_id: string;
  meta_pixel_id: string;
  enable_cookie_consent: boolean;
  cookie_consent_message: string;
}

export interface SecuritySettings {
  enable_rate_limiting: boolean;
  rate_limit_rpm: number;
  session_timeout_minutes: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  password_min_length: number;
  require_special_char: boolean;
  force_2fa_admin: boolean;
  enable_csrf_protection: boolean;
  sanitize_inputs: boolean;
}

export interface AuthSettings {
  allow_customer_registration: boolean;
  require_email_verification: boolean;
  allow_phone_login: boolean;
  remember_me_days: number;
}

export interface PerformanceSettings {
  enable_api_cache: boolean;
  cache_ttl_seconds: number;
  lazy_load_images: boolean;
  search_debounce_ms: number;
  compress_responses: boolean;
}

export interface WooCommerceIntegrationSettings {
  store_url: string;
  consumer_key?: string;
  consumer_secret?: string;
  consumer_key_configured: boolean;
  consumer_secret_configured: boolean;
  webhook_secret?: string;
  webhook_secret_configured: boolean;
  auto_sync_interval_minutes: number;
  auto_sync_on_startup?: boolean;
  api_version?: 'wc/v3' | 'wc/v2';
  verify_ssl?: boolean;
  last_sync_timestamp: string;
  connection_status: 'connected' | 'unauthorized' | 'offline';
}

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  expected_completion: string;
  allow_admin_bypass: boolean;
  contact_phone: string;
  contact_email: string;
}

export interface LegalSettings {
  terms_of_service: string;
  privacy_policy: string;
  refund_return_policy: string;
  warranty_policy: string;
}

export interface CategoriesSettings {
  display_layout: 'grid' | 'carousel' | 'list';
  show_product_count: boolean;
  show_category_images: boolean;
  enable_subcategories: boolean;
}

export interface CartSettings {
  enable_ajax_cart: boolean;
  show_shipping_calculator: boolean;
  show_cross_sells: boolean;
  free_shipping_threshold: number;
  cart_auto_expire_hours: number;
}

export interface CustomersSettings {
  registration_enabled: boolean;
  require_email_verification: boolean;
  default_customer_role: UserRole;
  allow_profile_deletion: boolean;
  enable_customer_dashboard: boolean;
}

export interface OrdersSettings {
  order_number_prefix: string;
  default_order_status: OrderStatus;
  allow_order_cancellation: boolean;
  order_tracking_public: boolean;
  auto_complete_paid_orders: boolean;
}

export interface CouponsSettings {
  enabled: boolean;
  allow_multiple_coupons: boolean;
  default_welcome_code: string;
  default_welcome_discount_percent: number;
}

export interface ReviewsSettings {
  enabled: boolean;
  require_verified_purchase: boolean;
  auto_approve_reviews: boolean;
  allow_customer_photos: boolean;
  star_rating_required: boolean;
}

export interface WishlistSettings {
  enabled: boolean;
  require_login_to_save: boolean;
  allow_public_sharing: boolean;
}

export interface ApiSettings {
  rate_limit_enabled?: boolean;
  rate_limit_per_minute: number;
  rate_limit_requests?: number;
  rate_limit_window_seconds?: number;
  enable_cors: boolean;
  cors_allowed_origins: string;
  enable_swagger_docs: boolean;
  woocommerce_api_enabled?: boolean;
  woocommerce_store_url?: string;
  woocommerce_consumer_key?: string;
  woocommerce_consumer_secret?: string;
  woocommerce_api_version?: string;
  api_timeout_seconds?: number;
  webhook_secret?: string;
}

export interface AdvancedSettings {
  debug_mode: boolean;
  custom_header_scripts: string;
  custom_footer_scripts: string;
  allow_export_backup: boolean;
}

export interface PosSettings {
  enabled: boolean;
  allowed_roles: UserRole[];
  allowed_user_emails: string[];
  store_name: string;
  store_address: string;
  store_phone: string;
  enable_barcode_scanner: boolean;
  enable_quick_cash_buttons: boolean;
  allow_custom_line_items: boolean;
  allow_manual_discounts: boolean;
  tax_rate_percent: number;
  receipt_header: string;
  receipt_footer: string;
  default_payment_method: 'cash' | 'momo' | 'airtel' | 'card';
  auto_print_receipt: boolean;
}

export interface MarketplaceConfig {
  general: GeneralSettings;
  branding: BrandingSettings;
  appearance: AppearanceSettings;
  homepage: HomepageSettings;
  products: ProductDisplaySettings;
  categories: CategoriesSettings;
  cart: CartSettings;
  checkout: CheckoutSettings;
  customers: CustomersSettings;
  orders: OrdersSettings;
  delivery: DeliverySettings;
  payments: PaymentGatewayConfig;
  taxes: TaxSettings;
  coupons: CouponsSettings;
  reviews: ReviewsSettings;
  wishlist: WishlistSettings;
  notifications: NotificationSettings;
  email: EmailSettings;
  sms: SmsSettings;
  whatsapp: WhatsAppSettings;
  seo: SeoSettings;
  social: SocialMediaSettings;
  analytics: AnalyticsSettings;
  security: SecuritySettings;
  auth: AuthSettings;
  performance: PerformanceSettings;
  api: ApiSettings;
  woocommerce: WooCommerceIntegrationSettings;
  maintenance: MaintenanceSettings;
  legal: LegalSettings;
  advanced: AdvancedSettings;
  pos: PosSettings;
  badges?: ProductBadgeConfig[];
}

// Backward-compatible StoreSettings mapping
export interface StoreSettings {
  site_name: string;
  site_url: string;
  tagline: string;
  logo_url?: string;
  phone: string;
  order_hotline: string;
  whatsapp_number: string;
  email: string;
  address: string;
  physical_location: string;
  business_hours: string;
  currency: string;
  currency_symbol: string;
  woocommerce_connected: boolean;
  woocommerce_url: string;
  last_sync?: string;
  notice_banner?: {
    enabled: boolean;
    text: string;
    link?: string;
  };
}
