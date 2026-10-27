import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  getDocFromServer,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId as the second parameter
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export { onAuthStateChanged };

// Firebase Storage Image Upload Helper
export const uploadSettingImage = async (file: File, folder: string = 'branding'): Promise<string> => {
  if (!file) throw new Error('No file selected for upload');
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (PNG, JPG, SVG, WebP, ICO, GIF)');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size must be under 10MB');
  }

  const extension = file.name.split('.').pop() || 'png';
  const cleanName = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
  const storageRef = ref(storage, `settings/${folder}/${cleanName}`);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
};

// Re-export settings and products modules
export * from './settings';
export * from './products';

// Standardized Operation Types & Error Reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes all undefined keys and values from an object or array
 * so that Firestore's setDoc/updateDoc never fails with 'Unsupported field value: undefined'.
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        clean[key] = cleanFirestoreData(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as T;
}

// Connectivity Test on App Startup
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Auto-run connection test
testConnection();

// Firebase Auth Helper Functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.error('Google Sign-in failed:', err);
    throw err;
  }
};

export const signInWithEmail = async (email: string, pass: string) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  } catch (err: any) {
    console.error('Email sign-in failed:', err);
    throw err;
  }
};

export const registerWithEmail = async (email: string, pass: string) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    return cred.user;
  } catch (err: any) {
    console.error('Email registration failed:', err);
    throw err;
  }
};

export const signOutFirebase = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.error('Sign-out error:', err);
  }
};

// Firestore User Profile Sync
export const syncUserProfile = async (
  user: FirebaseUser,
  additionalData: {
    first_name?: string;
    last_name?: string;
    displayName?: string;
    photoURL?: string;
    phone?: string;
    role?: string;
  } = {}
) => {
  if (!user || !user.uid) return null;
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    const isDesignatedSuperAdmin = user.email?.trim().toLowerCase() === 'opwataallan@gmail.com';
    const names = (user.displayName || additionalData.displayName || '').trim().split(' ');
    const firstName = additionalData.first_name || names[0] || 'Customer';
    const lastName = additionalData.last_name || names.slice(1).join(' ') || '';
    const displayName = user.displayName || additionalData.displayName || `${firstName} ${lastName}`.trim();
    const photoURL = user.photoURL || additionalData.photoURL || '';
    const phone = additionalData.phone || user.phoneNumber || '';
    const email = user.email || '';

    if (!snap.exists()) {
      // 1. Initial user profile creation
      const initialProfile = {
        uid: user.uid,
        email: email,
        displayName: displayName,
        photoURL: photoURL,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role: isDesignatedSuperAdmin ? 'SUPER_ADMIN' : 'CUSTOMER',
        permissions: isDesignatedSuperAdmin ? ['*'] : [],
        status: 'ACTIVE',
        isSuperAdmin: isDesignatedSuperAdmin,
        admin: isDesignatedSuperAdmin,
        vendorId: null,
        assignedStoreIds: [],
        addresses: [],
        wishlist: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(userRef, initialProfile);

      // If opwataallan@gmail.com, also bootstrap /admins/{uid} doc
      if (isDesignatedSuperAdmin) {
        try {
          await setDoc(
            doc(db, 'admins', user.uid),
            {
              uid: user.uid,
              email: email,
              role: 'SUPER_ADMIN',
              isSuperAdmin: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn('Super Admin bootstrap admin doc notice:', e);
        }
      }

      return initialProfile;
    } else {
      // 2. Existing user: update ONLY permitted profile fields
      const existing = snap.data();
      const updates: Record<string, any> = {};

      if (!existing.displayName && displayName) updates.displayName = displayName;
      if (!existing.photoURL && photoURL) updates.photoURL = photoURL;
      if (!existing.phone && phone) updates.phone = phone;
      if (existing.first_name === 'Customer' && firstName !== 'Customer') {
        updates.first_name = firstName;
        updates.last_name = lastName;
      }

      // Elevate designated Super Admin if not already elevated
      if (isDesignatedSuperAdmin && existing.role !== 'SUPER_ADMIN' && existing.role !== 'admin') {
        updates.role = 'SUPER_ADMIN';
        updates.isSuperAdmin = true;
        updates.admin = true;
        updates.permissions = ['*'];
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        try {
          await updateDoc(userRef, updates);
        } catch (updateErr) {
          console.warn('Profile sync non-critical update notice:', updateErr);
        }
      }

      // Return user profile with safe defaults merged in-memory without attempting unauthorized field writes
      return {
        uid: user.uid,
        email: existing.email || email,
        displayName: updates.displayName || existing.displayName || displayName || 'Customer',
        photoURL: updates.photoURL || existing.photoURL || photoURL || '',
        first_name: updates.first_name || existing.first_name || firstName || 'Customer',
        last_name: updates.last_name || existing.last_name || lastName || '',
        phone: updates.phone || existing.phone || phone || '',
        role: isDesignatedSuperAdmin ? 'SUPER_ADMIN' : (existing.role || 'CUSTOMER'),
        permissions: isDesignatedSuperAdmin ? ['*'] : (existing.permissions || []),
        status: existing.status || 'ACTIVE',
        isSuperAdmin: isDesignatedSuperAdmin || existing.isSuperAdmin || false,
        admin: isDesignatedSuperAdmin || existing.admin || false,
        vendorId: existing.vendorId ?? null,
        assignedStoreIds: existing.assignedStoreIds || [],
        addresses: existing.addresses || [],
        wishlist: existing.wishlist || [],
        createdAt: existing.createdAt || new Date().toISOString(),
        updatedAt: updates.updatedAt || existing.updatedAt || new Date().toISOString(),
        ...updates,
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

// Firestore Order Persistence & Retrieval
export const saveOrderToFirestore = async (order: any, userId?: string) => {
  const currentUid = auth.currentUser?.uid || userId;
  if (!currentUid) {
    throw new Error('Authentication required: Cannot link order to customer account without an active Firebase Auth UID.');
  }

  const orderDocId = String(order.order_number || order.id || `ord_${Date.now()}`);
  const path = `orders/${orderDocId}`;

  // Map and clean items
  const cleanItems = (order.line_items || order.items || []).map((item: any) => ({
    id: item.id || item.productId || Math.random().toString(36).substring(2, 9),
    productId: Number(item.productId || item.product_id || item.product?.id || 0),
    name: item.name || item.product?.name || 'Product',
    price: Number(item.price || item.unitPrice || 0),
    unitPrice: Number(item.unitPrice || item.price || 0),
    quantity: Number(item.quantity || 1),
    subtotal: Number(item.subtotal || item.total || (Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1))),
    total: Number(item.total || item.subtotal || (Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1))),
    image: item.image || item.product?.images?.[0]?.src || '',
  }));

  const orderDoc = {
    orderNumber: String(order.order_number || order.id || orderDocId),
    order_number: String(order.order_number || order.id || orderDocId),
    userId: currentUid,
    customerEmail: String(order.billing?.email || order.shipping?.email || auth.currentUser?.email || ''),
    customerName: String(
      `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() ||
        auth.currentUser?.displayName ||
        'Customer'
    ),
    customerPhone: String(order.billing?.phone || order.shipping?.phone || ''),
    total: Number(order.total) || 0,
    subtotal: Number(order.subtotal) || Number(order.total) || 0,
    discount_total: Number(order.discount_total) || 0,
    shipping_total: Number(order.shipping_total) || 0,
    status: String(order.status || 'pending'),
    paymentStatus: String(
      order.payment_details?.status || (order.payment_method === 'cod' ? 'pending' : 'awaiting_confirmation')
    ),
    paymentMethod: String(order.payment_method || 'cod'),
    payment_method_title: String(
      order.payment_method_title ||
        (order.payment_method === 'momo'
          ? 'MTN Mobile Money'
          : order.payment_method === 'airtel'
          ? 'Airtel Money'
          : order.payment_method === 'card'
          ? 'Visa / Mastercard'
          : 'Cash on Delivery')
    ),
    payment_details: order.payment_details || {},
    deliveryDistrict: String(order.delivery_zone || order.shipping?.district || 'Kampala'),
    deliveryAddress: String(order.shipping?.address_1 || ''),
    shippingAddress: {
      address_1: String(order.shipping?.address_1 || order.billing?.address_1 || ''),
      district: String(order.shipping?.district || order.delivery_zone || 'Kampala'),
      city: String(order.shipping?.city || order.delivery_zone || 'Kampala'),
      phone: String(order.shipping?.phone || order.billing?.phone || ''),
    },
    billing: order.billing || {},
    shipping: order.shipping || {},
    items: cleanItems,
    line_items: cleanItems,
    lineItemsCount: cleanItems.length,
    customer_note: String(order.customer_note || ''),
    currency: String(order.currency || 'UGX'),
    date_created: String(order.date_created || new Date().toISOString()),
    createdAt: String(order.date_created || new Date().toISOString()),
    updatedAt: new Date().toISOString(),
  };

  try {
    const cleanDoc = cleanFirestoreData(orderDoc);
    await setDoc(doc(db, 'orders', orderDocId), cleanDoc);
    return cleanDoc;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const getUserOrdersFromFirestore = async (userId: string) => {
  if (!auth.currentUser || !userId || auth.currentUser.uid !== userId) {
    return [];
  }
  const path = 'orders';
  try {
    const q = query(collection(db, 'orders'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    orders.sort((a: any, b: any) => {
      const timeA = new Date(a.date_created || a.createdAt || 0).getTime();
      const timeB = new Date(b.date_created || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    return orders;
  } catch (err: any) {
    console.warn('getUserOrdersFromFirestore notice:', err?.message || err);
    return [];
  }
};

export const subscribeToUserOrders = (
  userId: string,
  onUpdate: (orders: any[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!auth.currentUser || !userId || auth.currentUser.uid !== userId) {
    onUpdate([]);
    return () => {};
  }
  const path = 'orders';
  const q = query(collection(db, 'orders'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      orders.sort((a: any, b: any) => {
        const timeA = new Date(a.date_created || a.createdAt || 0).getTime();
        const timeB = new Date(b.date_created || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      onUpdate(orders);
    },
    (err: any) => {
      console.warn('Real-time customer orders listener notice:', err);
      onUpdate([]);
      if (onError) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  );
};

export const getAllOrdersFromFirestore = async () => {
  if (!auth.currentUser) {
    return [];
  }
  const path = 'orders';
  try {
    const snapshot = await getDocs(collection(db, 'orders'));
    const orders = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    orders.sort((a: any, b: any) => {
      const timeA = new Date(a.date_created || a.createdAt || 0).getTime();
      const timeB = new Date(b.date_created || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    return orders;
  } catch (err: any) {
    console.warn('getAllOrdersFromFirestore notice:', err?.message || err);
    return [];
  }
};

export const updateFirestoreOrderStatus = async (
  orderNumberOrId: string,
  newStatus: string,
  extraUpdates: Record<string, any> = {}
) => {
  const cleanId = String(orderNumberOrId).trim();
  const docRef = doc(db, 'orders', cleanId);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...extraUpdates,
      });
      return;
    }

    // Try finding by orderNumber if doc ID differed
    const q = query(collection(db, 'orders'), where('orderNumber', '==', cleanId));
    const snapQ = await getDocs(q);
    if (!snapQ.empty) {
      await updateDoc(snapQ.docs[0].ref, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...extraUpdates,
      });
    }
  } catch (err) {
    console.warn('Could not update order status in Firestore:', err);
  }
};

export const cancelFirestoreOrder = async (orderNumber: string, reason?: string) => {
  const cleanNum = String(orderNumber).trim();
  const docRef = doc(db, 'orders', cleanNum);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, {
        status: 'cancelled',
        cancelReason: reason || 'Cancelled by customer',
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    const q = query(collection(db, 'orders'), where('orderNumber', '==', cleanNum));
    const snapQ = await getDocs(q);
    if (!snapQ.empty) {
      await updateDoc(snapQ.docs[0].ref, {
        status: 'cancelled',
        cancelReason: reason || 'Cancelled by customer',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Could not cancel order in Firestore:', err);
  }
};

// Admin Audit & Safe Migration Utility for Legacy Orders
export interface OrderMigrationAuditResult {
  totalOrders: number;
  linkedOrdersCount: number;
  legacyOrdersCount: number;
  legacyOrders: any[];
}

export const auditLegacyFirestoreOrders = async (): Promise<OrderMigrationAuditResult> => {
  const orders = await getAllOrdersFromFirestore();
  const safeOrders = orders || [];
  const legacyOrders = safeOrders.filter((o: any) => !o.userId || typeof o.userId !== 'string' || o.userId.trim() === '');
  const linkedOrders = safeOrders.filter((o: any) => Boolean(o.userId && typeof o.userId === 'string' && o.userId.trim() !== ''));

  return {
    totalOrders: safeOrders.length,
    linkedOrdersCount: linkedOrders.length,
    legacyOrdersCount: legacyOrders.length,
    legacyOrders,
  };
};

export const safelyAssociateOrderWithUser = async (orderDocId: string, verifiedUserId: string) => {
  if (!verifiedUserId || !orderDocId) {
    throw new Error('Valid order ID and verified Firebase Auth UID are required.');
  }
  const docRef = doc(db, 'orders', orderDocId);
  await updateDoc(docRef, {
    userId: verifiedUserId,
    updatedAt: new Date().toISOString(),
  });
};

// Firestore Reviews Persistence & Retrieval
export const saveReviewToFirestore = async (review: {
  productId: number;
  reviewer: string;
  rating: number;
  review: string;
}) => {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) throw new Error('Must be signed in to submit a review');
  const reviewDocId = `rev_${review.productId}_${currentUid}_${Date.now()}`;
  const path = `reviews/${reviewDocId}`;
  try {
    const reviewData = {
      productId: review.productId,
      userId: currentUid,
      reviewer: review.reviewer,
      rating: review.rating,
      review: review.review,
      verified: true,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'reviews', reviewDocId), reviewData);
    return reviewData;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const getProductReviewsFromFirestore = async (productId: number) => {
  const path = 'reviews';
  try {
    const q = query(collection(db, 'reviews'), where('productId', '==', productId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
};

// Firestore Customer Cart Persistence
export const saveUserCartToFirestore = async (userId: string, items: any[]) => {
  if (!userId || !auth.currentUser) return;
  try {
    const payload = cleanFirestoreData({
      userId,
      items: Array.isArray(items) ? items : [],
      itemCount: Array.isArray(items) ? items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) : 0,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'carts', userId), payload, { merge: true });
  } catch (err) {
    console.warn('Could not save cart to Firestore:', err);
  }
};

export const getUserCartFromFirestore = async (userId: string): Promise<any[] | null> => {
  if (!userId || !auth.currentUser) return null;
  try {
    const snap = await getDoc(doc(db, 'carts', userId));
    if (snap.exists() && Array.isArray(snap.data()?.items)) {
      return snap.data().items;
    }
    return null;
  } catch (err) {
    console.warn('Could not load cart from Firestore:', err);
    return null;
  }
};

// Firestore Customer Wishlist Persistence
export const saveUserWishlistToFirestore = async (userId: string, productIds: number[]) => {
  if (!userId || !auth.currentUser) return;
  try {
    const payload = cleanFirestoreData({
      userId,
      productIds: Array.isArray(productIds) ? productIds : [],
      count: Array.isArray(productIds) ? productIds.length : 0,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'wishlists', userId), payload, { merge: true });
  } catch (err) {
    console.warn('Could not save wishlist to Firestore:', err);
  }
};

export const getUserWishlistFromFirestore = async (userId: string): Promise<number[] | null> => {
  if (!userId || !auth.currentUser) return null;
  try {
    const snap = await getDoc(doc(db, 'wishlists', userId));
    if (snap.exists() && Array.isArray(snap.data()?.productIds)) {
      return snap.data().productIds;
    }
    return null;
  } catch (err) {
    console.warn('Could not load wishlist from Firestore:', err);
    return null;
  }
};

