-- ==============================================================================
-- Cyber Dynamic Technologies Marketplace - cPanel MySQL/MariaDB Database Schema
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- Coexists safely with WordPress tables (uses `cdt_` prefix)
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Configuration & Store Settings Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdt_config` (
  `config_key` VARCHAR(100) NOT NULL,
  `config_value` LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. User Accounts Table (Admins, Managers, Staff, Customers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdt_users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL DEFAULT '',
  `last_name` VARCHAR(100) NOT NULL DEFAULT '',
  `phone` VARCHAR(191) NOT NULL DEFAULT '',
  `role` ENUM('admin', 'manager', 'editor', 'customer') NOT NULL DEFAULT 'customer',
  `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  `admin_notes` TEXT NULL,
  `is_email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `addresses_json` LONGTEXT NULL,
  `wishlist_json` LONGTEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` DATETIME NULL,
  `reset_token` VARCHAR(255) NULL,
  `reset_token_expires` BIGINT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cdt_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Customer Orders Table (Orders placed via Marketplace & synced to WooCommerce)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdt_orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(100) NOT NULL,
  `woocommerce_order_id` INT UNSIGNED NULL,
  `customer_id` INT UNSIGNED NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `shipping_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'momo',
  `payment_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `payment_reference` VARCHAR(191) NULL,
  `customer_email` VARCHAR(191) NOT NULL,
  `customer_phone` VARCHAR(50) NOT NULL,
  `billing_json` LONGTEXT NOT NULL,
  `shipping_json` LONGTEXT NOT NULL,
  `items_json` LONGTEXT NOT NULL,
  `delivery_zone_json` LONGTEXT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cdt_orders_number` (`order_number`),
  KEY `idx_cdt_orders_customer_email` (`customer_email`),
  KEY `idx_cdt_orders_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Cached WooCommerce Products Table (High-Speed Local Query Cache)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdt_products_cache` (
  `id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `permalink` VARCHAR(500) NOT NULL,
  `sku` VARCHAR(100) NULL,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `regular_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `sale_price` DECIMAL(12, 2) NULL,
  `on_sale` TINYINT(1) NOT NULL DEFAULT 0,
  `stock_status` VARCHAR(50) NOT NULL DEFAULT 'instock',
  `stock_quantity` INT NULL,
  `categories_json` LONGTEXT NULL,
  `images_json` LONGTEXT NULL,
  `attributes_json` LONGTEXT NULL,
  `raw_data_json` LONGTEXT NULL,
  `last_synced_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cdt_products_slug` (`slug`),
  KEY `idx_cdt_products_price` (`price`),
  KEY `idx_cdt_products_stock` (`stock_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Delivery Zones Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdt_delivery_zones` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `estimated_hours` VARCHAR(100) NOT NULL,
  `districts_json` LONGTEXT NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Coupons Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdt_coupons` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `discount_type` ENUM('fixed', 'percent') NOT NULL DEFAULT 'fixed',
  `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `description` VARCHAR(255) NULL,
  `usage_limit` INT NULL,
  `minimum_amount` DECIMAL(10, 2) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cdt_coupons_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Price Drop Alerts Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdt_price_drop_alerts` (
  `id` VARCHAR(100) NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `target_price` DECIMAL(12, 2) NOT NULL,
  `initial_price` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('active', 'triggered', 'cancelled') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cdt_alerts_product` (`product_id`),
  KEY `idx_cdt_alerts_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Audit Logs & Webhooks Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cdt_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_type` VARCHAR(100) NOT NULL,
  `actor_email` VARCHAR(191) NULL,
  `actor_role` VARCHAR(50) NULL,
  `ip_address` VARCHAR(50) NULL,
  `payload_json` LONGTEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cdt_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Seed default initial super admin account
INSERT INTO `cdt_users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `status`, `admin_notes`, `is_email_verified`)
VALUES (1, 'admin@cyberdynamictech.com', '$2b$10$T8Z2p0Q0n3k0M5s1V4a2eu9a1uY.Q4rOaVq7iKkX5Z8sK1a0m2.0.', 'Store', 'Administrator', '+256779743101', 'admin', 'active', 'Initial Super Administrator seeded for cPanel deployment.', 1)
ON DUPLICATE KEY UPDATE `email` = `email`;
