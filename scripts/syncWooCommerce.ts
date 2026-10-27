import fs from 'fs';
import path from 'path';

async function syncWooCommerceCatalog() {
  console.log('[Sync] Fetching all live products from Cyber Dynamic Tech WooCommerce API...');
  const allProducts: any[] = [];
  const catMap = new Map<string, any>();
  let page = 1;

  while (true) {
    const url = `https://www.cyberdynamictech.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`;
    console.log(`[Sync] Requesting page ${page}...`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CyberDynamicTech-Sync/2.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`[Sync] Page ${page} responded with HTTP ${res.status}`);
      break;
    }

    const rawList = await res.json();
    if (!Array.isArray(rawList) || rawList.length === 0) {
      break;
    }

    for (const p of rawList) {
      let regularPrice = 0;
      let salePrice: number | undefined = undefined;
      let currentPrice = 0;

      if (p.prices) {
        const minorUnit = typeof p.prices.currency_minor_unit === 'number' ? p.prices.currency_minor_unit : 0;
        const divisor = Math.pow(10, minorUnit);
        currentPrice = p.prices.price ? Number(p.prices.price) / divisor : 0;
        regularPrice = p.prices.regular_price ? Number(p.prices.regular_price) / divisor : currentPrice;
        if (p.prices.sale_price && Number(p.prices.sale_price) < Number(p.prices.regular_price)) {
          salePrice = Number(p.prices.sale_price) / divisor;
        }
      } else {
        regularPrice = Number(p.regular_price || p.price || 0);
        salePrice = p.sale_price ? Number(p.sale_price) : undefined;
        currentPrice = Number(p.price || regularPrice || 0);
      }

      const images =
        p.images && Array.isArray(p.images) && p.images.length > 0
          ? p.images.map((img: any, idx: number) => ({
              id: img.id || idx + 1,
              src: (img.src || img.thumbnail || '').replace('http://www.cyberdynamictech.com', 'https://www.cyberdynamictech.com'),
              name: img.name || p.name || 'Product Image',
              alt: img.alt || p.name || 'Product Image',
            }))
          : [
              {
                id: 1,
                src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
                name: p.name,
                alt: p.name,
              },
            ];

      const categories =
        p.categories && Array.isArray(p.categories) && p.categories.length > 0
          ? p.categories.map((c: any) => {
              const slug = c.slug || String(c.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const catObj = {
                id: c.id,
                name: c.name,
                slug: slug,
              };
              if (!catMap.has(slug)) {
                catMap.set(slug, {
                  id: c.id || Math.floor(Math.random() * 10000),
                  name: c.name,
                  slug: slug,
                  description: `${c.name} technology and electronics`,
                  image: images[0]?.src || '',
                  count: 1,
                });
              } else {
                catMap.get(slug).count++;
              }
              return catObj;
            })
          : [{ id: 1, name: 'General Tech', slug: 'general-tech' }];

      allProducts.push({
        id: p.id,
        name: p.name,
        slug: p.slug || `product-${p.id}`,
        permalink: p.permalink || `https://www.cyberdynamictech.com/product/${p.slug || p.id}`,
        sku: p.sku || `CDT-${p.id}`,
        barcode: p.sku || `CDT${p.id}`,
        price: currentPrice,
        regular_price: regularPrice,
        sale_price: salePrice,
        on_sale: salePrice !== undefined && salePrice < regularPrice,
        status: 'publish',
        featured: p.is_featured || false,
        catalog_visibility: 'visible',
        short_description: p.short_description || '',
        description: p.description || '',
        stock_status: p.is_in_stock ? 'instock' : 'outofstock',
        stock_quantity: typeof p.stock_quantity === 'number' ? p.stock_quantity : (p.is_in_stock ? 20 : 0),
        images,
        categories,
        tags: [],
        attributes: p.attributes || [],
        variations: p.variations || [],
        average_rating: p.average_rating ? Number(p.average_rating) : 5,
        rating_count: p.review_count || 0,
        brand: categories[0]?.name || 'Cyber Dynamic Tech',
      });
    }

    console.log(`[Sync] Page ${page} complete. Running total: ${allProducts.length}`);
    if (rawList.length < 100) break;
    page++;
  }

  // Also fetch live categories from store API
  try {
    const catRes = await fetch('https://www.cyberdynamictech.com/wp-json/wc/store/v1/products/categories?per_page=100');
    if (catRes.ok) {
      const liveCats = await catRes.json();
      if (Array.isArray(liveCats)) {
        for (const c of liveCats) {
          catMap.set(c.slug, {
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || `${c.name} hardware and electronics`,
            image: c.image?.src || '',
            count: c.count || 1,
          });
        }
      }
    }
  } catch (err: any) {
    console.warn('[Sync] Category fetch notice:', err.message);
  }

  const dbPath = path.join(process.cwd(), 'data', 'database.json');
  const dbData = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf8')) : {};
  dbData.products = allProducts;
  dbData.categories = Array.from(catMap.values());
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');

  console.log(`[Sync] Successfully saved ${allProducts.length} live WooCommerce products and ${dbData.categories.length} categories into database.json!`);
}

syncWooCommerceCatalog().catch((e) => {
  console.error('[Sync] Fatal error:', e);
});
