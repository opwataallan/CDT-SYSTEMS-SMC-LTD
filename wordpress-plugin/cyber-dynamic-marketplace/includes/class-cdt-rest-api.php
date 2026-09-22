<?php
/**
 * REST API Endpoints for Cyber Dynamic Technologies Marketplace
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class CDT_Marketplace_REST_API {

    const NAMESPACE = 'cdt/v1';

    /**
     * Register all REST API routes
     */
    public static function register_routes() {
        // Products list
        register_rest_route( self::NAMESPACE, '/products', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( __CLASS__, 'get_products' ),
            'permission_callback' => '__return_true',
        ) );

        // Single product
        register_rest_route( self::NAMESPACE, '/products/(?P<id_or_slug>[a-zA-Z0-9_-]+)', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( __CLASS__, 'get_product' ),
            'permission_callback' => '__return_true',
        ) );

        // Product categories
        register_rest_route( self::NAMESPACE, '/categories', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( __CLASS__, 'get_categories' ),
            'permission_callback' => '__return_true',
        ) );

        // Orders: Create Order & List Orders
        register_rest_route( self::NAMESPACE, '/orders', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( __CLASS__, 'get_orders' ),
                'permission_callback' => '__return_true',
            ),
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( __CLASS__, 'create_order' ),
                'permission_callback' => '__return_true',
            ),
        ) );

        // Order Tracking
        register_rest_route( self::NAMESPACE, '/orders/(?P<id>[a-zA-Z0-9_-]+)', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( __CLASS__, 'get_single_order' ),
            'permission_callback' => '__return_true',
        ) );

        // Coupon Validation
        register_rest_route( self::NAMESPACE, '/coupons/validate', array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array( __CLASS__, 'validate_coupon' ),
            'permission_callback' => '__return_true',
        ) );

        // System & WooCommerce Status
        register_rest_route( self::NAMESPACE, '/status', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( __CLASS__, 'get_status' ),
            'permission_callback' => '__return_true',
        ) );

        // Public App & Brand Configuration
        register_rest_route( self::NAMESPACE, '/config/public', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( __CLASS__, 'get_public_config' ),
            'permission_callback' => '__return_true',
        ) );

        // Gemini AI API Status
        register_rest_route( self::NAMESPACE, '/ai/status', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( __CLASS__, 'get_ai_status' ),
            'permission_callback' => '__return_true',
        ) );

        // Gemini AI Assistant Query
        register_rest_route( self::NAMESPACE, '/ai/assistant', array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array( __CLASS__, 'ai_assistant' ),
            'permission_callback' => '__return_true',
        ) );

        // Media Upload to WordPress Library
        register_rest_route( self::NAMESPACE, '/upload', array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array( __CLASS__, 'handle_upload' ),
            'permission_callback' => array( __CLASS__, 'upload_permission_check' ),
        ) );
    }

    /**
     * Format a WooCommerce product object for the React frontend
     */
    private static function format_product( $product ) {
        if ( ! is_a( $product, 'WC_Product' ) ) {
            return null;
        }

        $id = $product->get_id();
        $images = array();
        $image_id = $product->get_image_id();
        if ( $image_id ) {
            $img_url = wp_get_attachment_image_url( $image_id, 'full' );
            if ( $img_url ) {
                $images[] = array(
                    'id'   => $image_id,
                    'src'  => $img_url,
                    'name' => get_the_title( $image_id ),
                    'alt'  => get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ?: $product->get_name(),
                );
            }
        }

        // Additional gallery images
        $gallery_ids = $product->get_gallery_image_ids();
        if ( ! empty( $gallery_ids ) ) {
            foreach ( $gallery_ids as $gid ) {
                $g_url = wp_get_attachment_image_url( $gid, 'full' );
                if ( $g_url ) {
                    $images[] = array(
                        'id'   => $gid,
                        'src'  => $g_url,
                        'name' => get_the_title( $gid ),
                        'alt'  => get_post_meta( $gid, '_wp_attachment_image_alt', true ) ?: $product->get_name(),
                    );
                }
            }
        }

        if ( empty( $images ) ) {
            $placeholder = wc_placeholder_img_src();
            $images[] = array(
                'id'   => 0,
                'src'  => $placeholder,
                'name' => $product->get_name(),
                'alt'  => $product->get_name(),
            );
        }

        // Categories
        $categories = array();
        $term_ids = $product->get_category_ids();
        foreach ( $term_ids as $tid ) {
            $term = get_term( $tid, 'product_cat' );
            if ( $term && ! is_wp_error( $term ) ) {
                $categories[] = array(
                    'id'   => $term->term_id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                );
            }
        }

        // Attributes
        $attributes = array();
        foreach ( $product->get_attributes() as $attr_slug => $attr ) {
            if ( is_a( $attr, 'WC_Product_Attribute' ) ) {
                $name = wc_attribute_label( $attr->get_name() );
                $options = $attr->get_options();
                if ( $attr->is_taxonomy() ) {
                    $tax_terms = wc_get_product_terms( $id, $attr->get_name(), array( 'fields' => 'names' ) );
                    $options = ! is_wp_error( $tax_terms ) ? $tax_terms : $options;
                }
                $attributes[] = array(
                    'id'      => $attr->get_id(),
                    'name'    => $name,
                    'options' => is_array( $options ) ? array_values( $options ) : array( (string) $options ),
                );
            }
        }

        $regular_price = floatval( $product->get_regular_price() ?: 0 );
        $sale_price = $product->get_sale_price() ? floatval( $product->get_sale_price() ) : null;
        $price = floatval( $product->get_price() ?: ( $sale_price ?: $regular_price ) );

        return array(
            'id'                => $id,
            'name'              => $product->get_name(),
            'slug'              => $product->get_slug(),
            'permalink'         => $product->get_permalink(),
            'price'             => $price,
            'regular_price'     => $regular_price ?: $price,
            'sale_price'        => $sale_price,
            'on_sale'           => $product->is_on_sale(),
            'sku'               => $product->get_sku() ?: 'SKU-' . $id,
            'barcode'           => 'CDT' . str_pad( (string) $id, 6, '0', STR_PAD_LEFT ),
            'stock_status'      => $product->is_in_stock() ? 'instock' : 'outofstock',
            'stock_quantity'    => $product->get_stock_quantity() !== null ? $product->get_stock_quantity() : 50,
            'short_description' => wp_strip_all_tags( $product->get_short_description() ),
            'description'       => wp_kses_post( $product->get_description() ),
            'categories'        => $categories,
            'images'            => $images,
            'attributes'        => $attributes,
            'average_rating'    => floatval( $product->get_average_rating() ),
            'rating_count'      => intval( $product->get_rating_count() ),
            'date_created'      => $product->get_date_created() ? $product->get_date_created()->date( 'c' ) : gmdate( 'c' ),
            'featured'          => $product->is_featured(),
            'warranty'          => '1 Year Official Cyber Dynamic Warranty with Free Kampala Delivery Support',
        );
    }

    /**
     * GET /cdt/v1/products
     */
    public static function get_products( $request ) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_REST_Response( array( 'products' => array(), 'total' => 0, 'totalPages' => 0 ), 200 );
        }

        $per_page = intval( $request->get_param( 'per_page' ) ?: 24 );
        $per_page = min( max( $per_page, 1 ), 100 );
        $page = intval( $request->get_param( 'page' ) ?: 1 );
        $search = sanitize_text_field( $request->get_param( 'search' ) ?: '' );
        $category = sanitize_text_field( $request->get_param( 'category' ) ?: '' );
        $featured = $request->get_param( 'featured' );
        $on_sale = $request->get_param( 'on_sale' );

        $query_args = array(
            'status'   => 'publish',
            'limit'    => $per_page,
            'page'     => $page,
            'paginate' => true,
        );

        if ( ! empty( $search ) ) {
            $query_args['s'] = $search;
        }

        if ( ! empty( $category ) ) {
            if ( is_numeric( $category ) ) {
                $query_args['category'] = array( get_term_field( 'slug', intval( $category ), 'product_cat' ) );
            } else {
                $query_args['category'] = array( $category );
            }
        }

        if ( $featured === 'true' || $featured === '1' ) {
            $query_args['featured'] = true;
        }

        $results = wc_get_products( $query_args );
        $formatted = array();

        if ( is_object( $results ) && isset( $results->products ) ) {
            foreach ( $results->products as $p ) {
                $formatted[] = self::format_product( $p );
            }
            $total = $results->total;
            $total_pages = $results->max_num_pages;
        } else {
            $total = count( $formatted );
            $total_pages = 1;
        }

        return new WP_REST_Response( array(
            'products'   => $formatted,
            'total'      => $total,
            'totalPages' => $total_pages,
            'page'       => $page,
        ), 200 );
    }

    /**
     * GET /cdt/v1/products/:id_or_slug
     */
    public static function get_product( $request ) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_Error( 'wc_inactive', 'WooCommerce is not active', array( 'status' => 503 ) );
        }

        $id_or_slug = $request->get_param( 'id_or_slug' );
        $product = null;

        if ( is_numeric( $id_or_slug ) ) {
            $product = wc_get_product( intval( $id_or_slug ) );
        } else {
            $post = get_page_by_path( sanitize_title( $id_or_slug ), OBJECT, 'product' );
            if ( $post ) {
                $product = wc_get_product( $post->ID );
            }
        }

        if ( ! $product ) {
            return new WP_Error( 'not_found', 'Product not found', array( 'status' => 404 ) );
        }

        return new WP_REST_Response( self::format_product( $product ), 200 );
    }

    /**
     * GET /cdt/v1/categories
     */
    public static function get_categories( $request ) {
        $terms = get_terms( array(
            'taxonomy'   => 'product_cat',
            'hide_empty' => false,
            'orderby'    => 'count',
            'order'      => 'DESC',
        ) );

        $categories = array();
        if ( ! is_wp_error( $terms ) ) {
            foreach ( $terms as $term ) {
                $thumb_id = get_term_meta( $term->term_id, 'thumbnail_id', true );
                $img_url = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'medium' ) : '';
                if ( ! $img_url ) {
                    $img_url = 'https://www.cyberdynamictech.com/wp-content/uploads/2024/12/1-2.jpg';
                }

                $categories[] = array(
                    'id'          => $term->term_id,
                    'name'        => $term->name,
                    'slug'        => $term->slug,
                    'description' => $term->description ?: $term->name . ' technology hardware & electronics',
                    'count'       => $term->count,
                    'image'       => $img_url,
                );
            }
        }

        return new WP_REST_Response( $categories, 200 );
    }

    /**
     * POST /cdt/v1/orders - Native WooCommerce Order Creation
     */
    public static function create_order( $request ) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_Error( 'wc_inactive', 'WooCommerce is not active', array( 'status' => 503 ) );
        }

        $params = $request->get_json_params() ?: $request->get_params();
        $billing = isset( $params['billing'] ) && is_array( $params['billing'] ) ? $params['billing'] : array();
        $shipping = isset( $params['shipping'] ) && is_array( $params['shipping'] ) ? $params['shipping'] : $billing;
        $line_items = isset( $params['line_items'] ) && is_array( $params['line_items'] ) ? $params['line_items'] : array();
        $payment_method = sanitize_text_field( $params['payment_method'] ?? 'momo' );

        $first_name = sanitize_text_field( $billing['first_name'] ?? ( $params['first_name'] ?? 'Valued' ) );
        $last_name = sanitize_text_field( $billing['last_name'] ?? ( $params['last_name'] ?? 'Customer' ) );
        $email = sanitize_email( $billing['email'] ?? ( $params['email'] ?? '' ) );
        $phone = sanitize_text_field( $billing['phone'] ?? ( $params['phone'] ?? '' ) );
        $address_1 = sanitize_text_field( $billing['address_1'] ?? ( $params['address'] ?? 'Kampala, Uganda' ) );
        $city = sanitize_text_field( $billing['city'] ?? ( $params['city'] ?? 'Kampala' ) );

        try {
            $order = wc_create_order();

            // Add Line Items
            foreach ( $line_items as $item ) {
                $product_id = intval( $item['product_id'] ?? 0 );
                $qty = intval( $item['quantity'] ?? 1 );
                $product = wc_get_product( $product_id );
                if ( $product ) {
                    $order->add_product( $product, $qty );
                }
            }

            // Set Addresses
            $address = array(
                'first_name' => $first_name,
                'last_name'  => $last_name,
                'email'      => $email,
                'phone'      => $phone,
                'address_1'  => $address_1,
                'city'       => $city,
                'country'    => 'UG',
            );
            $order->set_address( $address, 'billing' );
            $order->set_address( $address, 'shipping' );

            // Set Payment Method
            $method_title = 'MTN Mobile Money';
            if ( $payment_method === 'airtel' ) {
                $method_title = 'Airtel Money';
            } elseif ( $payment_method === 'cod' ) {
                $method_title = 'Cash on Delivery';
            }
            $order->set_payment_method( $payment_method );
            $order->set_payment_method_title( $method_title );

            // Customer notes & source tag
            $order->add_order_note( 'Order placed via Cyber Dynamic Technologies Mobile App.' );
            $order->calculate_totals();
            $order->update_status( 'pending', 'Customer initiated order from Cyber Dynamic Marketplace app.' );

            $order_id = $order->get_id();
            $order_number = $order->get_order_number();

            return new WP_REST_Response( array(
                'success' => true,
                'message' => 'Order created successfully in WooCommerce!',
                'order'   => array(
                    'id'             => $order_id,
                    'order_number'   => (string) $order_number,
                    'status'         => $order->get_status(),
                    'total'          => floatval( $order->get_total() ),
                    'currency'       => $order->get_currency(),
                    'payment_method' => $payment_method,
                    'customer_email' => $email,
                    'customer_phone' => $phone,
                    'date_created'   => $order->get_date_created() ? $order->get_date_created()->date( 'c' ) : gmdate( 'c' ),
                    'tracking_url'   => site_url( '/marketplace/?view=track-order&order=' . $order_number ),
                ),
            ), 201 );
        } catch ( Exception $e ) {
            return new WP_Error( 'order_creation_failed', $e->getMessage(), array( 'status' => 500 ) );
        }
    }

    /**
     * GET /cdt/v1/orders
     */
    public static function get_orders( $request ) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_REST_Response( array(), 200 );
        }

        $email = sanitize_email( $request->get_param( 'email' ) ?: '' );
        $user_id = get_current_user_id();

        $args = array(
            'limit'   => 20,
            'orderby' => 'date',
            'order'   => 'DESC',
        );

        if ( $user_id ) {
            $args['customer_id'] = $user_id;
        } elseif ( $email ) {
            $args['billing_email'] = $email;
        }

        $orders = wc_get_orders( $args );
        $formatted = array();

        foreach ( $orders as $o ) {
            $formatted[] = array(
                'id'             => $o->get_id(),
                'order_number'   => (string) $o->get_order_number(),
                'status'         => $o->get_status(),
                'total'          => floatval( $o->get_total() ),
                'currency'       => $o->get_currency(),
                'payment_method' => $o->get_payment_method(),
                'customer_email' => $o->get_billing_email(),
                'customer_phone' => $o->get_billing_phone(),
                'date_created'   => $o->get_date_created() ? $o->get_date_created()->date( 'c' ) : gmdate( 'c' ),
            );
        }

        return new WP_REST_Response( $formatted, 200 );
    }

    /**
     * GET /cdt/v1/orders/:id
     */
    public static function get_single_order( $request ) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_Error( 'wc_inactive', 'WooCommerce is not active', array( 'status' => 503 ) );
        }

        $id = $request->get_param( 'id' );
        $order = null;

        if ( is_numeric( $id ) ) {
            $order = wc_get_order( intval( $id ) );
        } else {
            // Find by order number
            $orders = wc_get_orders( array( 'order_number' => $id, 'limit' => 1 ) );
            if ( ! empty( $orders ) ) {
                $order = $orders[0];
            }
        }

        if ( ! $order ) {
            return new WP_Error( 'order_not_found', 'Order not found', array( 'status' => 404 ) );
        }

        $items = array();
        foreach ( $order->get_items() as $item_id => $item ) {
            $product = $item->get_product();
            $items[] = array(
                'id'         => $item_id,
                'name'       => $item->get_name(),
                'product_id' => $item->get_product_id(),
                'quantity'   => $item->get_quantity(),
                'subtotal'   => floatval( $item->get_subtotal() ),
                'total'      => floatval( $item->get_total() ),
                'image'      => $product && $product->get_image_id() ? wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ) : '',
            );
        }

        return new WP_REST_Response( array(
            'id'             => $order->get_id(),
            'order_number'   => (string) $order->get_order_number(),
            'status'         => $order->get_status(),
            'total'          => floatval( $order->get_total() ),
            'subtotal'       => floatval( $order->get_subtotal() ),
            'shipping_total' => floatval( $order->get_shipping_total() ),
            'currency'       => $order->get_currency(),
            'payment_method' => $order->get_payment_method(),
            'customer_email' => $order->get_billing_email(),
            'customer_phone' => $order->get_billing_phone(),
            'billing'        => $order->get_address( 'billing' ),
            'shipping'       => $order->get_address( 'shipping' ),
            'line_items'     => $items,
            'date_created'   => $order->get_date_created() ? $order->get_date_created()->date( 'c' ) : gmdate( 'c' ),
        ), 200 );
    }

    /**
     * POST /cdt/v1/coupons/validate
     */
    public static function validate_coupon( $request ) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_Error( 'wc_inactive', 'WooCommerce is not active', array( 'status' => 503 ) );
        }

        $code = sanitize_text_field( $request->get_param( 'code' ) ?: '' );
        if ( empty( $code ) ) {
            return new WP_Error( 'missing_code', 'Coupon code is required', array( 'status' => 400 ) );
        }

        $coupon = new WC_Coupon( $code );
        if ( ! $coupon->get_id() || ! $coupon->is_valid() ) {
            return new WP_Error( 'invalid_coupon', 'Coupon code is invalid or has expired', array( 'status' => 400 ) );
        }

        return new WP_REST_Response( array(
            'valid'         => true,
            'code'          => $coupon->get_code(),
            'amount'        => floatval( $coupon->get_amount() ),
            'discount_type' => $coupon->get_discount_type(),
            'description'   => $coupon->get_description(),
        ), 200 );
    }

    /**
     * GET /cdt/v1/status
     */
    public static function get_status( $request ) {
        $wc_active = class_exists( 'WooCommerce' );
        $product_count = $wc_active ? wp_count_posts( 'product' )->publish : 0;
        $category_count = wp_count_terms( 'product_cat' );

        return new WP_REST_Response( array(
            'connected'               => true,
            'has_keys'                => true,
            'host'                    => site_url(),
            'latency_ms'              => 1,
            'message'                 => 'Connected to native WooCommerce via WordPress Plugin.',
            'last_sync'               => gmdate( 'c' ),
            'products_in_catalog'     => intval( $product_count ),
            'categories_count'        => intval( $category_count ),
            'consumer_key_configured' => true,
            'consumer_secret_configured' => true,
            'plugin_version'          => CDT_MARKETPLACE_VERSION,
            'woocommerce_version'     => $wc_active ? WC()->version : 'inactive',
        ), 200 );
    }

    /**
     * GET /cdt/v1/config/public
     */
    public static function get_public_config( $request ) {
        $brand_name = get_option( 'cdt_brand_name', 'Cyber Dynamic Technologies' );
        $whatsapp = get_option( 'cdt_whatsapp_number', '+256779743101' );
        $hotline = get_option( 'cdt_hotline_number', '0394760459' );
        $apk_url = get_option( 'cdt_android_apk_url', '' );
        $flashing_ads = get_option( 'cdt_flashing_ads_enabled', 'yes' );
        $announcement_text = get_option( 'cdt_announcement_text', '🔥 FLASH SALE: Genuine HP & Dell Laptops in stock! Free Same-Day Delivery across Kampala & Entebbe.' );

        return new WP_REST_Response( array(
            'brand' => array(
                'name'     => $brand_name,
                'logo_url' => get_option( 'cdt_logo_url', 'https://www.cyberdynamictech.com/wp-content/uploads/2024/12/cropped-Cyber-Dynamic-logo.png' ),
                'tagline'  => 'Uganda Premier Tech & Electronics Marketplace',
            ),
            'contact' => array(
                'whatsapp' => $whatsapp,
                'hotline'  => $hotline,
                'email'    => get_option( 'admin_email' ),
                'address'  => 'Kampala, Uganda',
            ),
            'android' => array(
                'apk_download_url' => $apk_url ?: 'https://www.cyberdynamictech.com/cyber-dynamic.apk',
                'version'          => '1.0.0',
            ),
            'announcement' => array(
                'enabled' => $flashing_ads === 'yes',
                'message' => $announcement_text,
            ),
            'currency' => array(
                'code'   => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'UGX',
                'symbol' => function_exists( 'get_woocommerce_currency_symbol' ) ? html_entity_decode( get_woocommerce_currency_symbol() ) : 'USh',
            ),
        ), 200 );
    }

    /**
     * GET /cdt/v1/ai/status
     */
    public static function get_ai_status( $request ) {
        $api_key = get_option( 'cdt_gemini_api_key', '' );
        $has_key = ! empty( $api_key ) && strlen( trim( $api_key ) ) > 5;

        return new WP_REST_Response( array(
            'success'    => true,
            'service'    => 'Google Gemini AI (WordPress Plugin)',
            'model'      => 'gemini-2.5-flash',
            'configured' => $has_key,
            'status'     => $has_key ? 'active' : 'unconfigured_api_key',
            'message'    => $has_key
                ? 'Gemini AI API is configured and operational in WordPress.'
                : 'GEMINI_API_KEY is not configured. Add your key in WP-Admin -> Cyber Dynamic -> Settings.',
        ), 200 );
    }

    /**
     * POST /cdt/v1/ai/assistant - Proxy to Google Gemini API
     */
    public static function ai_assistant( $request ) {
        $api_key = get_option( 'cdt_gemini_api_key', '' );
        if ( empty( $api_key ) ) {
            return new WP_Error( 'ai_unconfigured', 'Gemini AI API key is not configured in WordPress settings.', array( 'status' => 503 ) );
        }

        $params = $request->get_json_params() ?: $request->get_params();
        $message = sanitize_text_field( $params['message'] ?? '' );
        if ( empty( $message ) ) {
            return new WP_Error( 'missing_message', 'Message query is required', array( 'status' => 400 ) );
        }

        // Fetch top products for catalog context
        $catalog_sample = array();
        if ( class_exists( 'WooCommerce' ) ) {
            $prods = wc_get_products( array( 'limit' => 12, 'status' => 'publish' ) );
            foreach ( $prods as $p ) {
                $catalog_sample[] = array(
                    'name'      => $p->get_name(),
                    'price_ugx' => floatval( $p->get_price() ),
                    'stock'     => $p->is_in_stock() ? 'in stock' : 'out of stock',
                );
            }
        }

        $system_instruction = "You are the knowledgeable tech shopping advisor for Cyber Dynamic Technologies (Kampala, Uganda).
Store URL: https://www.cyberdynamictech.com
Hotline: +256779743101 / 0394760459.
Payment options: MTN Mobile Money, Airtel Money, and Cash on Delivery.
Catalog sample: " . wp_json_encode( $catalog_sample ) . ".
Assist customers with product specs, recommendations, prices in UGX, and delivery options in Uganda.";

        $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . urlencode( $api_key );
        $body = wp_json_encode( array(
            'contents' => array(
                array(
                    'role'  => 'user',
                    'parts' => array(
                        array( 'text' => $system_instruction . "\n\nCustomer question: " . $message ),
                    ),
                ),
            ),
        ) );

        $response = wp_remote_post( $endpoint, array(
            'headers'     => array( 'Content-Type' => 'application/json' ),
            'body'        => $body,
            'timeout'     => 20,
            'data_format' => 'body',
        ) );

        if ( is_wp_error( $response ) ) {
            return new WP_Error( 'ai_request_failed', $response->get_error_message(), array( 'status' => 500 ) );
        }

        $code = wp_remote_retrieve_response_code( $response );
        $res_body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code !== 200 ) {
            $err_msg = isset( $res_body['error']['message'] ) ? $res_body['error']['message'] : 'Gemini API Error';
            return new WP_Error( 'ai_api_error', $err_msg, array( 'status' => $code ) );
        }

        $reply = $res_body['candidates'][0]['content']['parts'][0]['text'] ?? 'Thank you for reaching Cyber Dynamic Technologies. How else may we assist you?';

        return new WP_REST_Response( array(
            'success' => true,
            'reply'   => $reply,
        ), 200 );
    }

    /**
     * Check permission for upload endpoint
     */
    public static function upload_permission_check() {
        return current_user_can( 'upload_files' ) || '__return_true';
    }

    /**
     * POST /cdt/v1/upload
     */
    public static function handle_upload( $request ) {
        $params = $request->get_json_params() ?: $request->get_params();
        $data = $params['data'] ?? '';
        $filename = sanitize_file_name( $params['filename'] ?? 'upload' );

        if ( empty( $data ) || ! preg_match( '/^data:image\/(\w+);base64,/', $data, $type ) ) {
            return new WP_Error( 'invalid_data', 'Base64 image data is required', array( 'status' => 400 ) );
        }

        $data = substr( $data, strpos( $data, ',' ) + 1 );
        $decoded = base64_decode( $data );
        if ( false === $decoded ) {
            return new WP_Error( 'decode_failed', 'Base64 decode failed', array( 'status' => 400 ) );
        }

        $ext = strtolower( $type[1] );
        if ( ! in_array( $ext, array( 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg' ) ) ) {
            return new WP_Error( 'invalid_extension', 'Unsupported image extension', array( 'status' => 400 ) );
        }

        $upload_dir = wp_upload_dir();
        $unique_filename = wp_unique_filename( $upload_dir['path'], $filename . '.' . $ext );
        $filepath = $upload_dir['path'] . '/' . $unique_filename;

        file_put_contents( $filepath, $decoded );

        $filetype = wp_check_filetype( $unique_filename, null );
        $attachment = array(
            'post_mime_type' => $filetype['type'],
            'post_title'     => sanitize_file_name( $unique_filename ),
            'post_content'   => '',
            'post_status'    => 'inherit',
        );

        $attach_id = wp_insert_attachment( $attachment, $filepath );
        require_once ABSPATH . 'wp-admin/includes/image.php';
        $attach_data = wp_generate_attachment_metadata( $attach_id, $filepath );
        wp_update_attachment_metadata( $attach_id, $attach_data );

        return new WP_REST_Response( array(
            'success'  => true,
            'url'      => wp_get_attachment_url( $attach_id ),
            'filename' => $unique_filename,
            'id'       => $attach_id,
        ), 200 );
    }
}
