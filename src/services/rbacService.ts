import { CustomerUser, UserRole } from '../types';

export const SYSTEM_PERMISSIONS = {
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_SUSPEND: 'users.suspend',
  USERS_ASSIGN_ROLE: 'users.assign_role',

  // Vendors
  VENDORS_VIEW: 'vendors.view',
  VENDORS_CREATE: 'vendors.create',
  VENDORS_EDIT: 'vendors.edit',
  VENDORS_APPROVE: 'vendors.approve',
  VENDORS_SUSPEND: 'vendors.suspend',
  VENDORS_DELETE: 'vendors.delete',
  VENDORS_VIEW_FINANCIALS: 'vendors.view_financials',

  // Stores
  STORES_VIEW: 'stores.view',
  STORES_CREATE: 'stores.create',
  STORES_EDIT: 'stores.edit',
  STORES_DELETE: 'stores.delete',
  STORES_ASSIGN_STAFF: 'stores.assign_staff',

  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_APPROVE: 'products.approve',

  // Categories
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_EDIT: 'categories.edit',
  CATEGORIES_DELETE: 'categories.delete',

  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_EDIT: 'inventory.edit',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_TRANSFER: 'inventory.transfer',
  INVENTORY_RECEIVE: 'inventory.receive',

  // Orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_REFUND: 'orders.refund',
  ORDERS_PROCESS: 'orders.process',

  // POS
  POS_ACCESS: 'pos.access',
  POS_SELL: 'pos.sell',
  POS_REFUND: 'pos.refund',
  POS_DISCOUNT: 'pos.discount',
  POS_OPEN_SHIFT: 'pos.open_shift',
  POS_CLOSE_SHIFT: 'pos.close_shift',
  POS_VIEW_REPORTS: 'pos.view_reports',

  // Payments
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_PROCESS: 'payments.process',
  PAYMENTS_REFUND: 'payments.refund',
  PAYMENTS_RECONCILE: 'payments.reconcile',

  // Finance
  FINANCE_VIEW: 'finance.view',
  FINANCE_REPORTS: 'finance.reports',
  FINANCE_VENDOR_PAYOUTS: 'finance.vendor_payouts',
  FINANCE_TRANSACTIONS: 'finance.transactions',

  // Delivery
  DELIVERY_VIEW: 'delivery.view',
  DELIVERY_ASSIGN: 'delivery.assign',
  DELIVERY_UPDATE_STATUS: 'delivery.update_status',
  DELIVERY_CONFIRM: 'delivery.confirm',

  // Marketing
  MARKETING_VIEW: 'marketing.view',
  MARKETING_CREATE: 'marketing.create',
  MARKETING_EDIT: 'marketing.edit',
  MARKETING_DELETE: 'marketing.delete',
  COUPONS_MANAGE: 'coupons.manage',
  PROMOTIONS_MANAGE: 'promotions.manage',
  BANNERS_MANAGE: 'banners.manage',

  // Customer Support
  SUPPORT_VIEW: 'support.view',
  SUPPORT_MANAGE_TICKETS: 'support.manage_tickets',
  SUPPORT_MANAGE_RETURNS: 'support.manage_returns',
  SUPPORT_VIEW_CUSTOMER_INFO: 'support.view_customer_information',

  // Reports
  REPORTS_VIEW_SALES: 'reports.view_sales',
  REPORTS_VIEW_INVENTORY: 'reports.view_inventory',
  REPORTS_VIEW_FINANCE: 'reports.view_finance',
  REPORTS_VIEW_VENDOR: 'reports.view_vendor',
  REPORTS_VIEW_STORE: 'reports.view_store',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SETTINGS_PAYMENT: 'settings.payment',
  SETTINGS_SHIPPING: 'settings.shipping',
  SETTINGS_TAX: 'settings.tax',
  SETTINGS_NOTIFICATION: 'settings.notification',
  SETTINGS_STOREFRONT: 'settings.storefront',
  SETTINGS_SECURITY: 'settings.security',
  SETTINGS_INTEGRATIONS: 'settings.integrations',

  // System
  SYSTEM_AUDIT_LOGS: 'system.audit_logs',
  SYSTEM_MANAGE_ROLES: 'system.manage_roles',
  SYSTEM_MANAGE_PERMISSIONS: 'system.manage_permissions',
  SYSTEM_MANAGE_INTEGRATIONS: 'system.manage_integrations',
} as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'], // Wildcard - all permissions
  ADMIN: [
    'users.view', 'users.create', 'users.edit', 'users.suspend',
    'vendors.view', 'vendors.approve', 'vendors.edit',
    'stores.view', 'stores.edit', 'stores.assign_staff',
    'products.view', 'products.create', 'products.edit', 'products.delete', 'products.approve',
    'categories.view', 'categories.create', 'categories.edit',
    'inventory.view', 'inventory.adjust', 'inventory.receive',
    'orders.view', 'orders.process', 'orders.cancel', 'orders.refund',
    'pos.access', 'pos.sell', 'pos.view_reports',
    'payments.view', 'payments.process', 'payments.refund',
    'finance.view', 'finance.reports',
    'delivery.view', 'delivery.assign',
    'marketing.view', 'marketing.create', 'coupons.manage', 'promotions.manage', 'banners.manage',
    'support.view', 'support.manage_tickets',
    'reports.view_sales', 'reports.view_inventory', 'reports.view_finance',
    'settings.view', 'settings.edit',
    'system.audit_logs',
  ],
  VENDOR: [
    'products.view', 'products.create', 'products.edit',
    'inventory.view', 'inventory.adjust',
    'orders.view', 'orders.process',
    'finance.view',
    'reports.view_sales',
    'vendors.view', 'vendors.edit',
  ],
  STORE_MANAGER: [
    'stores.view',
    'products.view',
    'inventory.view', 'inventory.adjust', 'inventory.receive',
    'orders.view', 'orders.process',
    'pos.access', 'pos.sell', 'pos.discount', 'pos.open_shift', 'pos.close_shift', 'pos.view_reports',
    'reports.view_store', 'reports.view_sales', 'reports.view_inventory',
  ],
  CASHIER: [
    'pos.access', 'pos.sell', 'pos.open_shift', 'pos.close_shift', 'pos.discount',
    'products.view',
    'orders.view',
  ],
  WAREHOUSE_MANAGER: [
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.transfer', 'inventory.receive',
    'products.view',
    'orders.view', 'orders.process',
    'reports.view_inventory',
  ],
  DELIVERY_AGENT: [
    'delivery.view', 'delivery.update_status', 'delivery.confirm',
    'orders.view',
  ],
  CUSTOMER_SUPPORT: [
    'support.view', 'support.manage_tickets', 'support.manage_returns', 'support.view_customer_information',
    'orders.view',
    'users.view',
  ],
  FINANCE: [
    'finance.view', 'finance.reports', 'finance.vendor_payouts', 'finance.transactions',
    'payments.view', 'payments.process', 'payments.refund', 'payments.reconcile',
    'orders.view',
    'reports.view_finance',
  ],
  MARKETING: [
    'marketing.view', 'marketing.create', 'marketing.edit', 'marketing.delete',
    'coupons.manage', 'promotions.manage', 'banners.manage',
    'reports.view_sales',
  ],
  CUSTOMER: [
    'orders.create', 'orders.view',
  ],
};

/**
 * Checks if a user has a specific granular permission
 */
export function hasPermission(user: CustomerUser | null, permission: string): boolean {
  if (!user) return false;

  // Super Admin has all permissions unconditionally
  if (
    user.role === 'SUPER_ADMIN' ||
    user.isSuperAdmin === true ||
    (user.email && user.email.trim().toLowerCase() === 'opwataallan@gmail.com')
  ) {
    return true;
  }

  // Check explicit user permissions list
  const userPerms = user.permissions || [];
  if (userPerms.includes('*') || userPerms.includes(permission)) {
    return true;
  }

  // Check wildcard category permissions e.g. 'products.*'
  const [category] = permission.split('.');
  if (userPerms.includes(`${category}.*`)) {
    return true;
  }

  // Check default role permissions mapping
  const normalizedRole = String(user.role).toUpperCase();
  const rolePerms = DEFAULT_ROLE_PERMISSIONS[normalizedRole] || [];
  if (rolePerms.includes('*') || rolePerms.includes(permission)) {
    return true;
  }

  return false;
}

/**
 * Checks if user has any of the specified permissions
 */
export function hasAnyPermission(user: CustomerUser | null, permissions: string[]): boolean {
  return permissions.some((perm) => hasPermission(user, perm));
}

/**
 * Checks if user has all of the specified permissions
 */
export function hasAllPermissions(user: CustomerUser | null, permissions: string[]): boolean {
  return permissions.every((perm) => hasPermission(user, perm));
}

/**
 * Checks if a user is authorized for a specific store scope
 */
export function canAccessStore(user: CustomerUser | null, storeId: string): boolean {
  if (!user || !storeId) return false;
  if (hasPermission(user, 'stores.edit') || user.isSuperAdmin) return true;

  if (user.store_id === storeId || user.storeId === storeId) return true;
  if (user.assignedStoreIds && user.assignedStoreIds.includes(storeId)) return true;

  return false;
}

/**
 * Checks if a user is authorized for a specific vendor scope
 */
export function canAccessVendor(user: CustomerUser | null, vendorId: string): boolean {
  if (!user || !vendorId) return false;
  if (hasPermission(user, 'vendors.edit') || user.isSuperAdmin) return true;

  return user.vendor_id === vendorId || user.vendorId === vendorId;
}
