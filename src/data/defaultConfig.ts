import { MarketplaceConfig } from '../types';
import { INITIAL_DELIVERY_ZONES, INITIAL_HERO_BANNERS } from './cyberCatalog';

export const DEFAULT_MARKETPLACE_CONFIG: MarketplaceConfig = {
  general: {
    site_name: 'Cyber Dynamic Tech',
    site_tagline: 'Premier Ugandan Technology & Electronics Marketplace',
    site_url: 'https://www.cyberdynamictech.com',
    contact_email: 'sales@cyberdynamictech.com',
    phone: '+256 779 743 101',
    whatsapp_number: '+256779743101',
    business_address: 'Kampala, Uganda',
    physical_location: 'Kampala, Uganda',
    country: 'Uganda',
    currency: 'UGX',
    currency_symbol: 'UGX',
    currency_position: 'left',
    decimal_places: 0,
    date_format: 'DD/MM/YYYY',
    timezone: 'Africa/Kampala',
    language: 'en_UG',
    default_country: 'Uganda',
    default_city: 'Kampala',
    store_email: 'sales@cyberdynamictech.com',
    support_email: 'support@cyberdynamictech.com',
  },

  branding: {
    logo_url: '/logo.png',
    mobile_logo_url: '/logo.png',
    dark_logo_url: '/logo.png',
    favicon_url: '/logo.png',
    login_logo_url: '/logo.png',
    email_logo_url: '/logo.png',
    default_product_placeholder: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&auto=format&fit=crop&q=80',
    primary_color: '#920d35', // Cyber Dynamic Tech Burgundy / Crimson #920d35
    secondary_color: '#0f172a', // slate-900
    accent_color: '#770929', // burgundy-dark
    text_color: '#0f172a',
    bg_color: '#f8fafc',
  },

  appearance: {
    default_theme: 'light',
    button_style: 'solid',
    border_radius: 'md',
    card_style: 'bordered',
    font_family: 'Inter, system-ui, sans-serif',
    header_style: 'dense',
    footer_style: 'columns',
    product_grid_desktop: '4',
    product_grid_mobile: '2',
    show_breadcrumbs: true,
  },

  homepage: {
    banners: [...INITIAL_HERO_BANNERS],
    announcement_bar: {
      enabled: true,
      text: '⚡ Free Express Logistics across Kampala & Wakiso on orders over UGX 500,000 | MTN MoMo & Airtel Money Accepted',
      link: '/shop',
      bg_color: '#0f172a',
      text_color: '#ffffff',
    },
    sections: [
      { id: 'hero_banners', name: 'Hero Carousel Banners', enabled: true, title: 'Featured Promotions' },
      { id: 'value_props', name: 'Trust & Logistics Value Props', enabled: true, title: 'Why Choose Cyber Dynamic Tech' },
      { id: 'flash_deals', name: 'Flash Deals / Daily Offers', enabled: true, title: 'Flash Sales & Limited Deals', item_count: 4 },
      { id: 'category_grid', name: 'Featured Categories Grid', enabled: true, title: 'Explore Product Categories' },
      { id: 'featured_products', name: 'Trending Hardware & Electronics', enabled: true, title: 'Trending Tech Products', item_count: 8 },
      { id: 'printers_networking', name: 'Printers & Networking Showcase', enabled: true, title: 'Printers & Enterprise Networking', category_filter: 'printers', item_count: 4 },
      { id: 'why_choose_us', name: 'Verified Warranty & Dispatch Hub', enabled: true, title: 'Authentic Warranty Guaranteed' },
    ],
  },

  products: {
    products_per_page: 16,
    default_sorting: 'popularity',
    enable_wishlist: true,
    enable_reviews: true,
    enable_compare: true,
    enable_quick_view: true,
    enable_buy_now: true,
    enable_add_to_cart: true,
    show_sku: true,
    show_stock: true,
    show_ratings: true,
    show_discount_percentage: true,
    show_related_products: true,
    show_recently_viewed: true,
    show_product_badges: true,
  },

  categories: {
    display_layout: 'grid',
    show_product_count: true,
    show_category_images: true,
    enable_subcategories: true,
  },

  cart: {
    enable_ajax_cart: true,
    show_shipping_calculator: true,
    show_cross_sells: true,
    free_shipping_threshold: 500000,
    cart_auto_expire_hours: 48,
  },

  badges: [
    { id: 'badge_sale', name: 'Sale Badge', text: 'SALE', bg_color: '#ef4444', text_color: '#ffffff', position: 'top-left', enabled: true },
    { id: 'badge_new', name: 'New Badge', text: 'NEW', bg_color: '#06b6d4', text_color: '#ffffff', position: 'top-left', enabled: true },
    { id: 'badge_hot', name: 'Hot Badge', text: 'POPULAR', bg_color: '#f97316', text_color: '#ffffff', position: 'top-right', enabled: true },
    { id: 'badge_warranty', name: 'Warranty Badge', text: '1 YR WARRANTY', bg_color: '#10b981', text_color: '#ffffff', position: 'top-right', enabled: true },
  ],

  customers: {
    registration_enabled: true,
    require_email_verification: false,
    default_customer_role: 'customer',
    allow_profile_deletion: false,
    enable_customer_dashboard: true,
  },

  orders: {
    order_number_prefix: 'CDT-',
    default_order_status: 'processing',
    allow_order_cancellation: true,
    order_tracking_public: true,
    auto_complete_paid_orders: false,
  },

  checkout: {
    allow_guest_checkout: true,
    require_account: false,
    phone_required: true,
    email_required: true,
    address_required: true,
    allow_delivery_instructions: true,
    enable_coupons: true,
    allow_order_notes: true,
    require_terms_acceptance: true,
    require_privacy_acceptance: true,
    terms_url: '/terms',
    privacy_url: '/privacy',
  },

  delivery: {
    zones: [...INITIAL_DELIVERY_ZONES],
    express_delivery_enabled: true,
    free_shipping_enabled: true,
    local_pickup_enabled: true,
    local_pickup_address: 'Kampala, Uganda',
  },

  payments: {
    momo_enabled: true,
    momo_merchant_code: 'CDT-MTN-001',
    momo_name: 'MTN Mobile Money Uganda',
    airtel_enabled: true,
    airtel_merchant_code: 'CDT-AIR-002',
    airtel_name: 'Airtel Money Uganda',
    card_enabled: true,
    card_provider: 'flutterwave',
    cod_enabled: true,
    cod_max_limit: 3000000,
    currency: 'UGX',
    manual_payment_number: '0394 760459',
    manual_account_name: 'ALLAN',
    manual_payment_instructions: 'Make the payment to 0394 760459 and put accounts names ALLAN, please use order number as id',
  },

  taxes: {
    enable_taxes: false,
    tax_rate_percent: 18,
    prices_include_tax: true,
    tax_label: 'VAT (18% Included)',
  },

  coupons: {
    enabled: true,
    allow_multiple_coupons: false,
    default_welcome_code: 'WELCOME5',
    default_welcome_discount_percent: 5,
  },

  reviews: {
    enabled: true,
    require_verified_purchase: false,
    auto_approve_reviews: true,
    allow_customer_photos: true,
    star_rating_required: true,
  },

  wishlist: {
    enabled: true,
    require_login_to_save: false,
    allow_public_sharing: true,
  },

  notifications: {
    order_confirmation_customer: true,
    order_status_update: true,
    admin_new_order_alert: true,
    admin_alert_email: 'sales@cyberdynamictech.com',
    admin_alert_phone: '+256779743101',
  },

  email: {
    sender_name: 'Cyber Dynamic Tech Store',
    sender_email: 'orders@cyberdynamictech.com',
    reply_to_email: 'support@cyberdynamictech.com',
    smtp_host: 'mail.cyberdynamictech.com',
    smtp_port: 587,
    smtp_secure: true,
    header_logo_url: '',
    footer_text: 'Cyber Dynamic Tech Uganda - High Performance Technology & Electronics',
    welcome_subject: 'Welcome to Cyber Dynamic Tech Uganda!',
    order_confirmed_subject: 'Order Confirmed: {order_number} - Cyber Dynamic Tech',
  },

  sms: {
    enabled: true,
    provider: 'africastalking',
    sender_id: 'CYBERTECH',
    notify_on_dispatch: true,
    notify_on_delivery: true,
  },

  whatsapp: {
    enabled: true,
    business_number: '+256779743101',
    auto_greeting_message: 'Hello Cyber Dynamic Tech, I would like to inquire about an order / product:',
    enable_order_on_whatsapp: true,
  },

  seo: {
    meta_title: 'Cyber Dynamic Tech | Premier Electronics & Tech Marketplace Uganda',
    meta_description: 'Buy genuine laptops, printers, routers, power backup systems, ink & computer accessories in Uganda. Same-day Kampala delivery and nationwide dispatch.',
    keywords: 'electronics uganda, buy laptop kampala, epson printer kampala, tp-link router, mtn momo shopping, cyber dynamic tech',
    og_image_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&auto=format&fit=crop&q=80',
    twitter_handle: '@cyberdynamictech',
    google_site_verification: 'google-site-verification-cdt-2026',
    robots_index: true,
    sitemap_enabled: true,
  },

  social: {
    facebook: 'https://facebook.com/cyberdynamictech',
    instagram: 'https://instagram.com/cyberdynamictech',
    tiktok: 'https://tiktok.com/@cyberdynamictech',
    youtube: 'https://youtube.com/@cyberdynamictech',
    x: 'https://x.com/cyberdynamictech',
    whatsapp: 'https://wa.me/256779743101',
    linkedin: 'https://linkedin.com/company/cyberdynamictech',
  },

  analytics: {
    ga4_measurement_id: 'G-CDTUGANDA01',
    meta_pixel_id: 'FB-CDT-PIXEL-2026',
    enable_cookie_consent: true,
    cookie_consent_message: 'We use cookies and secure sessions to enhance your shopping experience and process mobile money payments securely.',
  },

  security: {
    enable_rate_limiting: true,
    rate_limit_rpm: 120,
    session_timeout_minutes: 1440, // 24 hours
    max_login_attempts: 5,
    lockout_duration_minutes: 15,
    password_min_length: 8,
    require_special_char: true,
    force_2fa_admin: false,
    enable_csrf_protection: true,
    sanitize_inputs: true,
  },

  auth: {
    allow_customer_registration: true,
    require_email_verification: false,
    allow_phone_login: true,
    remember_me_days: 30,
  },

  performance: {
    enable_api_cache: true,
    cache_ttl_seconds: 300,
    lazy_load_images: true,
    search_debounce_ms: 250,
    compress_responses: true,
  },

  api: {
    rate_limit_per_minute: 120,
    enable_cors: true,
    cors_allowed_origins: '*',
    enable_swagger_docs: true,
    woocommerce_api_enabled: true,
    woocommerce_store_url: 'https://www.cyberdynamictech.com',
    woocommerce_consumer_key: '',
    woocommerce_consumer_secret: '',
    woocommerce_api_version: 'wc/v3',
    api_timeout_seconds: 30,
  },

  woocommerce: {
    store_url: 'https://www.cyberdynamictech.com',
    consumer_key: '',
    consumer_secret: '',
    consumer_key_configured: false,
    consumer_secret_configured: false,
    webhook_secret: '',
    webhook_secret_configured: false,
    auto_sync_interval_minutes: 60,
    auto_sync_on_startup: true,
    api_version: 'wc/v3',
    verify_ssl: true,
    last_sync_timestamp: new Date().toISOString(),
    connection_status: 'offline',
  },

  maintenance: {
    enabled: false,
    message: 'Cyber Dynamic Tech is currently undergoing scheduled platform upgrades to serve you better. We will be back shortly!',
    expected_completion: 'Within 30 minutes',
    allow_admin_bypass: true,
    contact_phone: '+256 779 743 101',
    contact_email: 'support@cyberdynamictech.com',
  },

  legal: {
    terms_of_service: 'All products sold by Cyber Dynamic Tech are guaranteed genuine and backed by official manufacturer warranties where stated. Payment must be made through approved channels.',
    privacy_policy: 'Cyber Dynamic Tech protects customer data strictly. Contact numbers and delivery addresses are utilized solely for fulfilling your orders.',
    refund_return_policy: 'Defective products can be returned within 7 days of delivery with serial numbers intact and original packaging.',
    warranty_policy: '1-year official distributor warranty on all brand-new laptops, printers, and UPS power backups.',
  },

  advanced: {
    debug_mode: false,
    custom_header_scripts: '',
    custom_footer_scripts: '',
    allow_export_backup: true,
  },

  pos: {
    enabled: true,
    allowed_roles: ['admin', 'manager'],
    allowed_user_emails: ['opwataallan@gmail.com', 'admin@cyberdynamictech.com'],
    store_name: 'Cyber Dynamic Tech Kampala Flagship Store',
    store_address: 'Kampala, Uganda',
    store_phone: '+256 779 743 101',
    enable_barcode_scanner: true,
    enable_quick_cash_buttons: true,
    allow_custom_line_items: true,
    allow_manual_discounts: true,
    tax_rate_percent: 18,
    receipt_header: 'CYBER DYNAMIC TECH LIMITED\nKampala, Uganda\nTel: +256 779 743 101 / +256 701 000 000\nOfficial Genuine Tech Distributor & IT Solutions',
    receipt_footer: 'Thank you for choosing Cyber Dynamic Tech!\n1-Year official distributor warranty on all brand-new hardware.\nPlease retain this receipt for warranty and support claims.',
    default_payment_method: 'cash',
    auto_print_receipt: false,
  },
};
