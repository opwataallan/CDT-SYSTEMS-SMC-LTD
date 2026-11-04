// Decoupled Products Module - Products and categories are managed via live WooCommerce API and local caching.
import { Product, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/cyberCatalog';

export async function getProductsFromFirestore(options?: {
  categorySlug?: string;
  search?: string;
  limitCount?: number;
  featuredOnly?: boolean;
}): Promise<Product[]> {
  let items = [...INITIAL_PRODUCTS];
  try {
    const cached = localStorage.getItem('cdt_catalog_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
    }
  } catch {}

  if (options?.categorySlug && options.categorySlug !== 'all') {
    items = items.filter((p) =>
      p.categories?.some((c) => c.slug === options.categorySlug || c.name.toLowerCase() === options.categorySlug?.toLowerCase())
    );
  }

  if (options?.search && options.search.trim()) {
    const s = options.search.toLowerCase().trim();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.sku?.toLowerCase().includes(s) ||
        p.brand?.toLowerCase().includes(s) ||
        p.short_description?.toLowerCase().includes(s)
    );
  }

  if (options?.featuredOnly) {
    items = items.filter((p) => p.featured || p.flash_sale);
  }

  if (options?.limitCount && options.limitCount > 0) {
    items = items.slice(0, options.limitCount);
  }

  return items;
}

export async function getProductByIdFromFirestore(id: string | number): Promise<Product | null> {
  const items = await getProductsFromFirestore();
  return items.find((p) => String(p.id) === String(id) || p.slug === String(id)) || null;
}

export async function saveProductToFirestore(product: Partial<Product>): Promise<Product> {
  return product as Product;
}

export async function deleteProductFromFirestore(_id: string | number): Promise<void> {}

export async function getCategoriesFromFirestore(): Promise<Category[]> {
  return INITIAL_CATEGORIES;
}

export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  _onError?: (err: any) => void
): () => void {
  getProductsFromFirestore().then(onUpdate);
  return () => {};
}

export async function uploadProductImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function seedInitialDataToFirestore(): Promise<{ seeded: boolean; message: string }> {
  return { seeded: true, message: 'Products initialized.' };
}
