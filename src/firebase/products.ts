import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, OperationType, handleFirestoreError, cleanFirestoreData } from './index';
import { Product, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/cyberCatalog';

const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';

/**
 * Fetch all products from Firestore database
 */
export async function getProductsFromFirestore(options?: {
  categorySlug?: string;
  search?: string;
  limitCount?: number;
  featuredOnly?: boolean;
}): Promise<Product[]> {
  const path = PRODUCTS_COLLECTION;
  try {
    let q = query(collection(db, PRODUCTS_COLLECTION));
    const snap = await getDocs(q);
    let items = snap.docs.map((d) => ({ ...d.data(), id: Number(d.id) || d.data().id } as Product));

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
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

/**
 * Real-time listener for products collection
 */
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const path = PRODUCTS_COLLECTION;
  const colRef = collection(db, PRODUCTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const prods = snapshot.docs.map((d) => ({
        ...d.data(),
        id: Number(d.id) || d.data().id,
      })) as Product[];
      onUpdate(prods);
    },
    (err) => {
      console.warn('Real-time products subscription notice:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

/**
 * Save or create a product in Firestore database
 */
export async function saveProductToFirestore(product: Partial<Product>): Promise<Product> {
  const id = Number(product.id) || Math.floor(Date.now() / 1000);
  const path = `${PRODUCTS_COLLECTION}/${id}`;

  const cleanProduct: Record<string, any> = {
    id,
    name: (product.name || 'Untitled Product').trim(),
    slug: (product.slug || product.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `product-${id}`).trim(),
    permalink: `/product/${product.slug || id}`,
    sku: (product.sku || `CDT-${id}`).trim().toUpperCase(),
    barcode: product.barcode?.trim() || '',
    price: Number(product.price) || 0,
    regular_price: Number(product.regular_price || product.price) || 0,
    discount_percent: product.regular_price && product.sale_price && Number(product.regular_price) > Number(product.sale_price)
      ? Math.round(((Number(product.regular_price) - Number(product.sale_price)) / Number(product.regular_price)) * 100)
      : (product.discount_percent || 0),
    on_sale: Boolean(product.sale_price && Number(product.sale_price) < Number(product.regular_price || product.price)),
    profit: (Number(product.price) || 0) - (Number(product.purchase_cost) || 0),
    profit_margin: product.purchase_cost && Number(product.price) > 0
      ? Math.round((((Number(product.price) - Number(product.purchase_cost)) / Number(product.price)) * 100))
      : 0,
    stock_quantity: Number(product.stock_quantity ?? 10),
    stock_status: (Number(product.stock_quantity ?? 10) > 0 ? 'instock' : 'outofstock'),
    manage_stock: product.manage_stock ?? true,
    low_stock_threshold: Number(product.low_stock_threshold ?? 3),
    status: (product.status as 'published' | 'draft' | 'archived') || 'published',
    product_type: (product.product_type as 'physical' | 'digital') || 'physical',
    brand: (product.brand || 'Cyber Dynamic Tech').trim(),
    categories: Array.isArray(product.categories) && product.categories.length > 0
      ? product.categories
      : [{ id: 1, name: 'Computers & Laptops', slug: 'laptops' }],
    images: Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [{ id: 1, src: '/logo.png', name: 'Product Image', alt: product.name || 'Product' }],
    attributes: Array.isArray(product.attributes) ? product.attributes : [],
    variations: Array.isArray(product.variations) ? product.variations : [],
    short_description: (product.short_description || '').trim(),
    description: (product.description || '').trim(),
    average_rating: Number(product.average_rating || 5.0),
    rating_count: Number(product.rating_count || 1),
    featured: Boolean(product.featured),
    flash_sale: Boolean(product.flash_sale),
    warranty: product.warranty || '1 Year Official Warranty',
    weight: product.weight || '',
    dimensions: product.dimensions || { length: '', width: '', height: '' },
    shipping_required: product.shipping_required ?? true,
    tags: Array.isArray(product.tags) ? product.tags : [],
    seo_title: (product.seo_title || product.name || '').trim(),
    seo_description: (product.seo_description || product.short_description || '').trim(),
    created_at: product.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    vendor_id: product.vendor_id || 'store-cyber-dynamic-tech',
    vendor_name: product.vendor_name || 'Cyber Dynamic Tech (Main Store)',
    store_slug: product.store_slug || 'cyber-dynamic-tech',
  };

  if (product.sale_price !== undefined && product.sale_price !== null && Number(product.sale_price) > 0) {
    cleanProduct.sale_price = Number(product.sale_price);
  }
  if (product.purchase_cost !== undefined && product.purchase_cost !== null) {
    cleanProduct.purchase_cost = Number(product.purchase_cost);
  }
  if (product.flash_sale_end) {
    cleanProduct.flash_sale_end = product.flash_sale_end;
  }
  if (product.woocommerce_id !== undefined && product.woocommerce_id !== null) {
    cleanProduct.woocommerce_id = product.woocommerce_id;
  }

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, String(id));
    const sanitized = cleanFirestoreData(cleanProduct);
    await setDoc(docRef, sanitized);
    return sanitized as Product;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Update an existing product in Firestore
 */
export async function updateProductInFirestore(id: number | string, updates: Partial<Product>): Promise<void> {
  const cleanId = String(id);
  const path = `${PRODUCTS_COLLECTION}/${cleanId}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, cleanId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Product with ID ${cleanId} not found in database.`);
    }

    const payload: Record<string, any> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.price !== undefined || updates.purchase_cost !== undefined) {
      const existing = snap.data() as Product;
      const price = updates.price !== undefined ? Number(updates.price) : existing.price;
      const cost = updates.purchase_cost !== undefined ? Number(updates.purchase_cost) : (existing.purchase_cost || 0);
      payload.profit = price - cost;
      payload.profit_margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
    }

    if (updates.stock_quantity !== undefined) {
      payload.stock_quantity = Number(updates.stock_quantity);
      if (Number(updates.stock_quantity) <= 0) {
        payload.stock_status = 'outofstock';
      } else {
        payload.stock_status = 'instock';
      }
    }

    const sanitized = cleanFirestoreData(payload);
    await updateDoc(docRef, sanitized);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Delete a product from Firestore
 */
export async function deleteProductInFirestore(id: number | string): Promise<void> {
  const cleanId = String(id);
  const path = `${PRODUCTS_COLLECTION}/${cleanId}`;
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Duplicate a product in Firestore
 */
export async function duplicateProductInFirestore(id: number | string): Promise<Product> {
  const cleanId = String(id);
  const path = `${PRODUCTS_COLLECTION}/${cleanId}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, cleanId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Product ${cleanId} not found`);
    }
    const orig = snap.data() as Product;
    const newId = Math.floor(Date.now() / 1000);
    const duplicate: Partial<Product> = {
      ...orig,
      id: newId,
      name: `${orig.name} (Copy)`,
      slug: `${orig.slug}-copy-${Math.random().toString(36).substring(2, 6)}`,
      sku: `${orig.sku}-COPY`,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return await saveProductToFirestore(duplicate);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

/**
 * Upload product media directly to Firebase Storage
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (!file) throw new Error('No image file selected.');
  if (!file.type.startsWith('image/')) {
    throw new Error('Only valid image formats (JPEG, PNG, WebP, SVG, GIF) are supported.');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Image size exceeds 15MB limit.');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const cleanName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
  const storageRef = ref(storage, `products/${cleanName}`);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  return await getDownloadURL(snapshot.ref);
}

/**
 * Categories Management in Firestore
 */
export async function getCategoriesFromFirestore(): Promise<Category[]> {
  const path = CATEGORIES_COLLECTION;
  try {
    const snap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    return snap.docs.map((d) => ({ ...d.data(), id: Number(d.id) || d.data().id } as Category));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveCategoryToFirestore(category: Partial<Category>): Promise<Category> {
  const id = Number(category.id) || Math.floor(Date.now() / 1000);
  const path = `${CATEGORIES_COLLECTION}/${id}`;

  const cleanCategory: Record<string, any> = {
    id,
    name: (category.name || 'New Category').trim(),
    slug: (category.slug || category.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${id}`).trim(),
    count: Number(category.count || 0),
    image: category.image || '',
    description: (category.description || '').trim(),
    icon: category.icon || 'Folder',
    created_at: category.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (category.parent_id !== undefined && category.parent_id !== null) {
    cleanCategory.parent_id = Number(category.parent_id);
  }

  try {
    const sanitized = cleanFirestoreData(cleanCategory);
    await setDoc(doc(db, CATEGORIES_COLLECTION, String(id)), sanitized);
    return sanitized as Category;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCategoryFromFirestore(id: number | string): Promise<void> {
  const cleanId = String(id);
  const path = `${CATEGORIES_COLLECTION}/${cleanId}`;
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Seed initial catalog to Firestore if the collection is empty
 */
export async function seedInitialFirestoreCatalogIfEmpty(): Promise<{ seeded: boolean; count: number }> {
  // Only authenticated staff/administrators can write catalog seed data to Firestore
  if (!auth.currentUser) {
    return { seeded: false, count: 0 };
  }

  try {
    const existingSnap = await getDocs(query(collection(db, PRODUCTS_COLLECTION), limit(1)));
    if (!existingSnap.empty) {
      return { seeded: false, count: existingSnap.size };
    }

    console.log('[Firestore] Initializing persistent product catalog as authenticated user...');
    let count = 0;

    // Seed Categories
    for (const cat of INITIAL_CATEGORIES) {
      try {
        await saveCategoryToFirestore(cat);
      } catch (e) {
        console.warn('Category seed notice:', e);
      }
    }

    // Seed Products
    for (const prod of INITIAL_PRODUCTS) {
      try {
        await saveProductToFirestore(prod);
        count++;
      } catch (e) {
        console.warn('Product seed notice for', prod.name, e);
      }
    }

    console.log(`[Firestore] Successfully seeded ${count} products into Firestore database.`);
    return { seeded: true, count };
  } catch (err) {
    console.warn('[Firestore] Catalog initialization notice:', err);
    return { seeded: false, count: 0 };
  }
}
