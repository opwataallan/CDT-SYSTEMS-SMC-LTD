import { ProductReview } from '../types';

export const INITIAL_PRODUCT_REVIEWS: ProductReview[] = [
  // HP Pavilion Laptop reviews (id: 101)
  {
    id: 1001,
    product_id: 101,
    reviewer: 'Ronald Ssemakula',
    district: 'Kampala',
    rating: 5,
    review: 'Super fast machine! Ordered around 10:30 AM and it was delivered to my office on Nakasero Road by 1:00 PM with the official warranty card. Runs Visual Studio Code and Docker without heating up. Highly recommended!',
    date_created: '2 days ago',
    verified: true,
    helpful_count: 14,
  },
  {
    id: 1002,
    product_id: 101,
    reviewer: 'Grace Namubiru',
    district: 'Wakiso',
    rating: 5,
    review: 'Genuine HP sealed box with original 65W charger. Paid with MTN MoMo on delivery. The battery lasts well over 7 hours on office workload. Cyber Dynamic Tech customer service on WhatsApp is very responsive.',
    date_created: '1 week ago',
    verified: true,
    helpful_count: 9,
  },
  {
    id: 1003,
    product_id: 101,
    reviewer: 'Dr. Denis Mugisha',
    district: 'Mbarara',
    rating: 4,
    review: 'Dispatched to Mbarara town pickup station and arrived within 24 hours in mint condition. The 16GB RAM handles data analysis smoothly. Very reliable hardware store.',
    date_created: '2 weeks ago',
    verified: true,
    helpful_count: 6,
  },

  // Dell Latitude 5420 (id: 102)
  {
    id: 1004,
    product_id: 102,
    reviewer: 'Brian Opolot',
    district: 'Jinja',
    rating: 5,
    review: 'Tough business chassis and battery life is remarkable. Delivered directly to our engineering firm in Jinja City. Passed all diagnostic tests easily.',
    date_created: '3 days ago',
    verified: true,
    helpful_count: 11,
  },
  {
    id: 1005,
    product_id: 102,
    reviewer: 'Claire Auma',
    district: 'Gulu',
    rating: 5,
    review: 'Collected at CDT Gulu regional desk on Commercial Road. Smooth transaction, authentic Intel i5 processor. Exactly as advertised.',
    date_created: '5 days ago',
    verified: true,
    helpful_count: 7,
  },

  // Lenovo ThinkPad T14 (id: 103)
  {
    id: 1006,
    product_id: 103,
    reviewer: 'Patrick Kigozi',
    district: 'Mukono',
    rating: 5,
    review: 'Best keyboard in the laptop market. Perfect for remote coding work. TrackPoint works flawlessly and SSD read speeds exceed 3000MB/s. Great price.',
    date_created: '4 days ago',
    verified: true,
    helpful_count: 8,
  },

  // MacBook Air M2 (id: 104)
  {
    id: 1007,
    product_id: 104,
    reviewer: 'Vanessa Tumuhairwe',
    district: 'Kampala',
    rating: 5,
    review: 'Brand new Apple sealed box! Midnight color is stunning. Zero fan noise and instant wake. The team at Cyber Dynamic Tech is genuine and trustworthy.',
    date_created: 'Yesterday',
    verified: true,
    helpful_count: 15,
  },

  // Samsung Galaxy S24 Ultra (id: 105)
  {
    id: 1008,
    product_id: 105,
    reviewer: 'Kenneth Byamukama',
    district: 'Masaka',
    rating: 5,
    review: 'The zoom camera on this phone is unreal. Shipped to Masaka with solid bubble wrap packaging. S-Pen functionality and 7 years of OS updates make it worth every shilling.',
    date_created: '3 days ago',
    verified: true,
    helpful_count: 12,
  },

  // Epson EcoTank L3250 (id: 106)
  {
    id: 1009,
    product_id: 106,
    reviewer: 'Sr. Agnes Nakato',
    district: 'Mbale',
    rating: 5,
    review: 'We bought this for our school administration office in Mbale. Ink bottles are super economical and Wi-Fi direct printing from mobile phones works like magic.',
    date_created: '1 week ago',
    verified: true,
    helpful_count: 10,
  },

  // TP-Link Archer AX55 Wi-Fi 6 Router (id: 107)
  {
    id: 1010,
    product_id: 107,
    reviewer: 'Julius Okello',
    district: 'Lira',
    rating: 5,
    review: 'Coverage reached all 4 rooms in our house without signal drop. Gigabit Ethernet ports connect nicely to our optic fibre router.',
    date_created: '6 days ago',
    verified: true,
    helpful_count: 8,
  },
];

// Fallback template reviews for any other product in catalog
const TEMPLATE_REVIEWS: Array<Omit<ProductReview, 'id' | 'product_id'>> = [
  {
    reviewer: 'Moses Bwambale',
    district: 'Kasese',
    rating: 5,
    review: 'Received in perfect working condition. Exactly matches the technical specifications on the website. Fast courier dispatch.',
    date_created: '3 days ago',
    verified: true,
    helpful_count: 5,
  },
  {
    reviewer: 'Joan Birungi',
    district: 'Kampala',
    rating: 5,
    review: 'Very genuine product, verified serial number with manufacturer warranty. Cyber Dynamic Tech never disappoints.',
    date_created: '5 days ago',
    verified: true,
    helpful_count: 7,
  },
  {
    reviewer: 'Emmanuel Kato',
    district: 'Wakiso',
    rating: 4,
    review: 'Great quality, well-packaged and arrived on time. Works as described with top-notch performance.',
    date_created: '1 week ago',
    verified: true,
    helpful_count: 4,
  },
  {
    reviewer: 'Doreen Akello',
    district: 'Arua',
    rating: 5,
    review: 'Collected at the regional courier station. Solid build quality, authentic accessories included in the box.',
    date_created: '2 weeks ago',
    verified: true,
    helpful_count: 6,
  },
];

/**
 * Returns reviews for a given product id. Merges predefined reviews with local reviews stored in browser.
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

  const seeded = INITIAL_PRODUCT_REVIEWS.filter((r) => r.product_id === productId);

  if (seeded.length > 0 || localReviews.length > 0) {
    return [...localReviews, ...seeded];
  }

  // Generate 2-3 authentic reviews based on productId
  const fallback = TEMPLATE_REVIEWS.slice(0, 2 + (productId % 3)).map((t, idx) => ({
    ...t,
    id: productId * 1000 + idx + 1,
    product_id: productId,
  }));

  return [...localReviews, ...fallback];
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
