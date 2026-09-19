import { ProductReview } from '../types';

export const INITIAL_PRODUCT_REVIEWS: ProductReview[] = [];

// Clean review system - no dummy or fallback reviews
const TEMPLATE_REVIEWS: Array<Omit<ProductReview, 'id' | 'product_id'>> = [];

/**
 * Returns authentic reviews for a given product id stored in browser/server.
 * No dummy or fallback reviews are generated.
 */
export function getStoredReviewsForProduct(productId: number): ProductReview[] {
  let localReviews: ProductReview[] = [];
  try {
    const saved = localStorage.getItem(`cdt_product_reviews_${productId}`);
    if (saved) {
      localReviews = JSON.parse(saved);
    }
  } catch (err) {
    console.error('Error reading local reviews:', err);
  }

  return localReviews;
}

/**
 * Saves a new review for a product into client storage and updates cache.
 */
export function saveLocalProductReview(productId: number, newReview: Omit<ProductReview, 'id' | 'date_created'>): ProductReview {
  const fullReview: ProductReview = {
    ...newReview,
    id: Date.now(),
    product_id: productId,
    date_created: 'Just now',
    helpful_count: 0,
  };

  try {
    const existing = getStoredReviewsForProduct(productId);
    const updated = [fullReview, ...existing.filter((r) => r.id !== fullReview.id)];
    localStorage.setItem(`cdt_product_reviews_${productId}`, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving local review:', err);
  }

  return fullReview;
}
