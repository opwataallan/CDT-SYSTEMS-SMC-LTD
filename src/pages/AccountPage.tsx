import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  Heart,
  MapPin,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Key,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Settings,
  Shield,
  Check,
  Palette,
  Receipt,
  Ban,
  X,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { CustomerOrder, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ThemeColorSetting } from '../components/ThemeColorSetting';
import { OrderReceiptModal } from '../components/OrderReceiptModal';
import { auth, subscribeToUserOrders, cancelFirestoreOrder } from '../firebase';

interface AccountPageProps {
  initialTab?: 'orders' | 'profile' | 'wishlist' | 'theme';
}

export const AccountPage: React.FC<AccountPageProps> = ({ initialTab = 'orders' }) => {
  const {
    user,
    firebaseUser,
    isFirebaseReady,
    isAdmin,
    login,
    loginWithGoogle,
    register,
    logoutUser,
    updateUserProfile,
    wishlist,
    setCurrentView,
    showToast,
    formatPrice,
  } = useShop();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'wishlist' | 'theme'>(initialTab);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<CustomerOrder | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<CustomerOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of delivery plans / Ordered in error');
  const [isCancelling, setIsCancelling] = useState(false);

  // Auth Modes: 'login' | 'register' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Form states - clean and blank for privacy & security
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    resetToken: '',
    newPassword: '',
  });

  // Profile Edit State
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDistrict, setEditDistrict] = useState('Kampala');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setEditFirstName(user.first_name || '');
      setEditLastName(user.last_name || '');
      setEditPhone(user.phone || '');
      setEditAddress(user.addresses?.[0]?.address_1 || '');
      setEditDistrict(user.addresses?.[0]?.district || 'Kampala');
    }
  }, [user]);

  // Load orders for current customer linked to authenticated Firebase UID
  useEffect(() => {
    // 1. Wait for Firebase Authentication state to finish loading
    if (!isFirebaseReady) {
      return;
    }

    // 2. Get current Firebase Auth user UID
    const currentUid = auth.currentUser?.uid || firebaseUser?.uid;

    // If not authenticated in Firebase Auth, attempt fallback to WooCommerce API with email
    if (!currentUid) {
      if (user?.email) {
        setLoadingOrders(true);
        api.getOrders({ email: user.email })
          .then((apiOrders) => {
            if (Array.isArray(apiOrders)) {
              setOrders(apiOrders);
            }
          })
          .catch(() => {
            setOrders([]);
          })
          .finally(() => {
            setLoadingOrders(false);
          });
      } else {
        setOrders([]);
        setLoadingOrders(false);
        setOrdersError(null);
      }
      return;
    }

    setLoadingOrders(true);
    setOrdersError(null);

    // 3. Query Firestore orders strictly belonging to that UID (where userId == currentUser.uid)
    const unsubscribe = subscribeToUserOrders(
      currentUid,
      (firestoreOrders) => {
        const mappedOrders: CustomerOrder[] = (firestoreOrders || []).map((ord: any) => ({
          id: ord.id || ord.order_number || ord.orderNumber || String(Math.random()),
          order_number: String(ord.order_number || ord.orderNumber || ord.id),
          orderNumber: String(ord.orderNumber || ord.order_number || ord.id),
          userId: ord.userId,
          customerEmail: ord.customerEmail || ord.billing?.email || ord.shipping?.email || '',
          customerName:
            ord.customerName ||
            `${ord.billing?.first_name || ''} ${ord.billing?.last_name || ''}`.trim() ||
            'Customer',
          customerPhone: ord.customerPhone || ord.billing?.phone || ord.shipping?.phone || '',
          status: ord.status || 'pending',
          paymentStatus:
            ord.paymentStatus ||
            ord.payment_details?.status ||
            (ord.paymentMethod === 'cod' ? 'pending' : 'awaiting_confirmation'),
          currency: ord.currency || 'UGX',
          date_created: ord.date_created || ord.createdAt || new Date().toISOString(),
          createdAt: ord.createdAt || ord.date_created || new Date().toISOString(),
          updatedAt: ord.updatedAt || new Date().toISOString(),
          total: Number(ord.total || 0),
          subtotal: Number(ord.subtotal || ord.total || 0),
          discount_total: Number(ord.discount_total || 0),
          shipping_total: Number(ord.shipping_total || 0),
          line_items: (ord.line_items || ord.items || []).map((it: any) => ({
            id: it.id || it.productId || 1,
            product_id: Number(it.productId || it.product_id || 0),
            name: it.name || 'Product',
            quantity: Number(it.quantity || 1),
            price: Number(it.price || it.unitPrice || 0),
            total: Number(it.total || it.subtotal || (Number(it.price || 0) * Number(it.quantity || 1))),
            image: it.image || '',
          })),
          items: ord.items || ord.line_items || [],
          billing: ord.billing || {
            first_name: ord.customerName?.split(' ')[0] || '',
            last_name: ord.customerName?.split(' ').slice(1).join(' ') || '',
            email: ord.customerEmail || '',
            phone: ord.customerPhone || '',
            district: ord.deliveryDistrict || 'Kampala',
            city: ord.deliveryDistrict || 'Kampala',
            address_1: ord.deliveryAddress || '',
          },
          shipping: ord.shipping || {
            first_name: ord.customerName?.split(' ')[0] || '',
            last_name: ord.customerName?.split(' ').slice(1).join(' ') || '',
            email: ord.customerEmail || '',
            phone: ord.customerPhone || '',
            district: ord.deliveryDistrict || 'Kampala',
            city: ord.deliveryDistrict || 'Kampala',
            address_1: ord.deliveryAddress || '',
          },
          delivery_zone: ord.deliveryDistrict || ord.delivery_zone || 'Kampala',
          deliveryAddress: ord.deliveryAddress || ord.shipping?.address_1 || '',
          deliveryDistrict: ord.deliveryDistrict || ord.shipping?.district || 'Kampala',
          payment_method: ord.paymentMethod || ord.payment_method || 'cod',
          paymentMethod: ord.paymentMethod || ord.payment_method || 'cod',
          payment_method_title: ord.payment_method_title || 'Cash on Delivery',
          payment_details: ord.payment_details || { status: ord.paymentStatus || 'pending' },
          timeline: ord.timeline || [],
          customer_note: ord.customer_note || '',
          cancelReason: ord.cancelReason || '',
        }));

        setOrders(mappedOrders);
        setLoadingOrders(false);
        setOrdersError(null);
      },
      (err) => {
        console.warn('Real-time customer orders notice:', err);
        setOrdersError(
          err.message?.includes('permission')
            ? 'Access restricted: Unable to load orders. Please verify your account credentials.'
            : 'Notice: Could not sync orders from cloud storage.'
        );
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [isFirebaseReady, user?.uid, firebaseUser?.uid]);

  // Load wishlist items
  useEffect(() => {
    if (wishlist.length > 0) {
      api.getProducts().then((res) => {
        if (res && Array.isArray(res.products)) {
          setWishlistProducts(res.products.filter((p) => wishlist.includes(p.id)));
        }
      }).catch(() => {});
    } else {
      setWishlistProducts([]);
    }
  }, [wishlist]);

  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;
    setIsCancelling(true);
    try {
      // 1. Cancel in Firestore database
      await cancelFirestoreOrder(cancellingOrder.order_number, cancelReason);

      // 2. Cancel in API store
      const res = await api.cancelOrder(cancellingOrder.order_number, cancelReason);
      if (res.success) {
        showToast(res.message || `Order #${cancellingOrder.order_number} cancelled successfully.`, 'success');
        setOrders((prev) =>
          prev.map((o) =>
            o.order_number === cancellingOrder.order_number
              ? { ...o, status: 'cancelled' }
              : o
          )
        );
        setCancellingOrder(null);
      } else {
        showToast(res.message || 'Failed to cancel order.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred while cancelling order.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await login({ email: formData.email, password: formData.password });
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (formData.password !== formData.confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }
    setAuthLoading(true);
    try {
      await register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setAuthLoading(true);
    try {
      const res = await api.forgotPassword(formData.email);
      setAuthSuccessMsg(res.message);
      if (res.simulated_reset_link) {
        // Extract token
        const match = res.simulated_reset_link.match(/token=([a-zA-Z0-9]+)/);
        if (match) {
          setFormData((prev) => ({ ...prev, resetToken: match[1] }));
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Could not process password reset request.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    if (!formData.resetToken || !formData.newPassword) {
      setAuthError('Token and new password are required.');
      return;
    }
    if (formData.newPassword.length < 8) {
      setAuthError('New password must be at least 8 characters long.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await api.resetPassword({
        email: formData.email,
        reset_token: formData.resetToken,
        new_password: formData.newPassword,
      });
      setAuthSuccessMsg(res.message);
      setAuthMode('login');
      showToast('Password reset successfully! You can now log in.');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to reset password.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateUserProfile({
        first_name: editFirstName,
        last_name: editLastName,
        phone: editPhone,
        addresses: [
          {
            id: 'addr_default',
            type: 'shipping',
            first_name: editFirstName,
            last_name: editLastName,
            phone: editPhone,
            email: user?.email || '',
            district: editDistrict,
            city: editDistrict,
            address_1: editAddress,
            is_default: true,
          },
        ],
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 1. Wait for Firebase Authentication state to finish loading
  if (!isFirebaseReady) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-sm font-bold text-slate-800">Verifying Account Authentication...</h2>
        <p className="text-xs text-slate-500">Checking Firebase security session.</p>
      </div>
    );
  }

  // 2. If user is not logged in: show auth card
  if (!user && !auth.currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-5">
          {/* Official Cyber Dynamic Technologies Logo */}
          <div className="flex justify-center pb-2">
            <img
              src="/logo.png"
              alt="Cyber Dynamic Technologies"
              className="h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-center">
            <h1 className="text-lg font-black text-slate-900">
              {authMode === 'login' && 'Sign In to Your Account'}
              {authMode === 'register' && 'Create Customer Account'}
              {authMode === 'forgot' && 'Reset Your Password'}
              {authMode === 'reset' && 'Enter New Password'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {authMode === 'login' && 'Access order history, live tracking, and saved warranty records.'}
              {authMode === 'register' && 'Join Cyber Dynamic Tech for quick checkout and priority support.'}
              {authMode === 'forgot' && 'Enter your verified email address to receive secure reset instructions.'}
              {authMode === 'reset' && 'Create a strong, unique password for your account.'}
            </p>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Success</span>
              </div>
              <p>{authSuccessMsg}</p>
              {authMode === 'forgot' && formData.resetToken && (
                <button
                  type="button"
                  onClick={() => setAuthMode('reset')}
                  className="text-xs font-bold text-cyan-700 underline mt-1 block cursor-pointer"
                >
                  Proceed to Reset Form with Received Token →
                </button>
              )}
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'login' && (
            <div className="space-y-4 text-xs">
              {/* Firebase Google Sign In */}
              <button
                type="button"
                onClick={async () => {
                  setAuthLoading(true);
                  setAuthError(null);
                  try {
                    await loginWithGoogle();
                  } catch (err: any) {
                    setAuthError(err.message || 'Google sign-in failed');
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2 text-[11px] text-slate-400 font-medium absolute">or continue with email</span>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full h-9 pl-9 pr-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError(null);
                        setAuthSuccessMsg(null);
                        setAuthMode('forgot');
                      }}
                      className="text-[11px] text-cyan-600 hover:underline font-bold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter your password"
                      className="w-full h-9 pl-9 pr-9 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {authLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="pt-1 text-center text-xs text-slate-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setAuthSuccessMsg(null);
                      setAuthMode('register');
                    }}
                    className="font-bold text-cyan-600 hover:underline cursor-pointer"
                  >
                    Register Here
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* REGISTER FORM */}
          {authMode === 'register' && (
            <div className="space-y-4 text-xs">
              {/* Firebase Google Sign In */}
              <button
                type="button"
                onClick={async () => {
                  setAuthLoading(true);
                  setAuthError(null);
                  try {
                    await loginWithGoogle();
                  } catch (err: any) {
                    setAuthError(err.message || 'Google sign-up failed');
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2 text-[11px] text-slate-400 font-medium absolute">or register with email</span>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. John"
                    className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Doe"
                    className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Uganda Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+256 7XX XXX XXX"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Password (min. 8 characters) *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirm Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {authLoading ? 'Creating Account...' : 'Register Account'}
              </button>

              <div className="pt-2 text-center text-xs text-slate-600">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                    setAuthMode('login');
                  }}
                  className="font-bold text-cyan-600 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        )}

          {/* FORGOT PASSWORD FORM */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
              >
                {authLoading ? 'Submitting...' : 'Send Password Reset Link'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {authMode === 'reset' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reset Token</label>
                <input
                  type="text"
                  required
                  value={formData.resetToken}
                  onChange={(e) => setFormData({ ...formData, resetToken: e.target.value })}
                  placeholder="Paste token received"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="At least 8 characters"
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
              >
                {authLoading ? 'Updating Password...' : 'Save New Password'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel & Return to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // User is signed in: show dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Admin Quick Action Banner if Admin */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-slate-900 to-cyan-950 text-white p-4 rounded-xl shadow-sm border border-cyan-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500 text-white flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black">Administrator Privileges Active</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500/30 text-cyan-200 border border-cyan-400/40">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                You have full access to the 31-Category Admin Settings System, user roles, security, and audit logs.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('admin')}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>Open Admin Settings Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Account Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-xs">
            {user.first_name?.[0] || 'U'}{user.last_name ? user.last_name[0] : ''}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900">
                {user.first_name || 'Customer'} {user.last_name || ''}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email} • {user.phone || 'No phone set'}</p>
          </div>
        </div>

        <button
          onClick={logoutUser}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'wishlist'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Wishlist ({wishlist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Addresses & Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'theme'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Theme & Colors</span>
        </button>
      </div>

      {/* TAB CONTENT: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {loadingOrders ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-800">Loading your orders...</p>
              <p className="text-[11px] text-slate-400">
                Retrieving orders permanently linked to your customer account.
              </p>
            </div>
          ) : ordersError ? (
            <div className="bg-white p-8 rounded-xl border border-rose-200 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-xs font-bold text-slate-800">Unable to Load Orders</h3>
              <p className="text-[11px] text-rose-600 max-w-sm mx-auto">{ordersError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoadingOrders(true);
                  setOrdersError(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Retry Loading Orders
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2.5">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-xs font-bold text-slate-800">No Orders Placed Yet</h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Explore our catalog of genuine laptops, Epson ink tank printers, and 4G MiFis.
              </p>
              <button
                onClick={() => setCurrentView('shop')}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{ord.order_number}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          ord.paymentStatus === 'confirmed' || ord.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ord.paymentStatus === 'awaiting_confirmation'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        Payment: {ord.paymentStatus || 'Pending'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ord.date_created).toLocaleDateString()} • {ord.delivery_zone || 'Kampala'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        ord.status === 'delivered' || ord.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : ord.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                      }`}
                    >
                      {ord.status}
                    </span>
                    <button
                      onClick={() => setCurrentView('track-order', { orderNumber: ord.order_number })}
                      className="text-xs font-bold text-cyan-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Track Order</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-100">
                  {ord.line_items.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2.5">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                          />
                        )}
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{item.name}</p>
                          <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 whitespace-nowrap text-xs">
                        {formatPrice(item.total)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 text-xs">Total ({ord.payment_method_title}): </span>
                    <span className="font-black text-sm text-cyan-600">{formatPrice(ord.total)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptOrder(ord)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="View & Print Official Receipt"
                    >
                      <Receipt className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Receipt</span>
                    </button>

                    {ord.status !== 'cancelled' && ord.status !== 'delivered' && ord.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => setCancellingOrder(ord)}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Cancel this order"
                      >
                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancel Order</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <Ban className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">
                  Cancel Order #{cancellingOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setCancellingOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel this order? If you placed payment, our support desk will contact you regarding a full refund or store voucher.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Reason for Cancellation (Optional)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="Change of delivery plans / Ordered in error">Change of delivery plans / Ordered in error</option>
                <option value="Found alternative product on marketplace">Found alternative product on marketplace</option>
                <option value="Delivery time does not suit my schedule">Delivery time does not suit my schedule</option>
                <option value="Payment method issue">Payment method issue</option>
                <option value="Other / Customer requested cancellation">Other / Personal reason</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                disabled={isCancelling}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                disabled={isCancelling}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {selectedReceiptOrder && (
        <OrderReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

      {/* TAB CONTENT: WISHLIST */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlistProducts.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2.5">
              <Heart className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-xs font-bold text-slate-800">Your Wishlist is Empty</h3>
              <p className="text-[11px] text-slate-500">
                Tap the heart icon on any laptop or accessory to save it for later.
              </p>
              <button
                onClick={() => setCurrentView('shop')}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 md:gap-3">
              {wishlistProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PROFILE & ADDRESSES */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Profile Edit Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-[#007f19]" />
                <span>Account Profile Details</span>
              </h3>
              {isAdmin ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-[#007f19] border border-emerald-200">
                  Admin Editable
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Admin Protected</span>
                </span>
              )}
            </div>

            {!isAdmin ? (
              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold block">Verified Customer Profile Policy:</span>
                    Account identity, name, and registered phone details are protected and editable exclusively by Cyber Dynamic Tech Administrators to prevent fraud and maintain delivery integrity.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">First Name</span>
                    <span className="font-bold text-slate-900">{user.first_name || '—'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Last Name</span>
                    <span className="font-bold text-slate-900">{user.last_name || '—'}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Registered Phone</span>
                  <span className="font-bold text-slate-900">{user.phone || '+256 779 743101'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Default Delivery Address</span>
                  <span className="font-bold text-slate-900">
                    {user.addresses?.[0]?.address_1 || 'Kampala'}, {user.addresses?.[0]?.district || 'Uganda'}
                  </span>
                </div>

                <div className="text-center pt-2">
                  <p className="text-[11px] text-slate-500">
                    Need to change your profile or delivery address? Contact your store administrator at{' '}
                    <span className="font-bold text-slate-700">admin@cyberdynamictech.com</span> or WhatsApp{' '}
                    <span className="font-bold text-[#007f19]">+256 779 743101</span>.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[#007f19] text-[11px] flex items-center justify-between">
                  <span className="font-bold">Administrator Edit Mode Enabled</span>
                  <button
                    type="button"
                    onClick={() => setCurrentView('admin')}
                    className="underline text-[10px] font-black cursor-pointer"
                  >
                    Open Full User Directory
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">First Name</label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full h-8.5 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full h-8.5 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full h-8.5 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Plot number, building, or road"
                    className="w-full h-8.5 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kampala Area / Division</label>
                  <select
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full h-8.5 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19] bg-white"
                  >
                    <option value="Kampala Central (Nakasero, Kololo, CBD, Kamwokya, Old Kampala)">Kampala Central (Nakasero, Kololo, CBD)</option>
                    <option value="Nakawa Division (Ntinda, Naguru, Bugolobi, Kyambogo, Luzira)">Nakawa Division (Ntinda, Naguru, Bugolobi)</option>
                    <option value="Makindye Division (Kabalagala, Kansanga, Munyonyo, Nsambya)">Makindye Division (Kabalagala, Kansanga)</option>
                    <option value="Kawempe Division (Kisaasi, Komamboga, Kalerwe, Bwaise)">Kawempe Division (Kisaasi, Kawempe)</option>
                    <option value="Rubaga Division (Mengo, Namirembe, Lubaga, Nateete)">Rubaga Division (Mengo, Namirembe)</option>
                    <option value="Greater Kampala / Wakiso (Kira, Nansana, Namugongo)">Greater Kampala / Wakiso (Kira, Nansana)</option>
                    <option value="Entebbe Road Corridor (Lubowa, Seguku, Kajjansi, Entebbe)">Entebbe Road Corridor (Lubowa, Entebbe)</option>
                    <option value="Mukono / Jinja Road Corridor (Bweyogerere, Seeta, Mukono)">Mukono / Jinja Road Corridor (Mukono)</option>
                    <option value="Kampala">Kampala (General)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-2 bg-[#007f19] hover:bg-[#006013] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {isSavingProfile ? 'Saving Changes...' : 'Save Profile Details (Admin)'}
                </button>
              </form>
            )}
          </div>

          {/* Customer Account & Security Information */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security & Account Status</span>
              </h3>
              <div className="space-y-2 text-slate-600 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span>Account Email:</span>
                  <span className="font-bold text-slate-900">{user.email}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span>Role:</span>
                  <span className="font-bold uppercase text-slate-900">{user.role}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span>Session Type:</span>
                  <span className="font-bold text-emerald-600">Secure HttpOnly Cookie (HMAC-SHA256)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Password Hash:</span>
                  <span className="font-mono text-[11px] text-slate-500">Argon2/Scrypt + Salt</span>
                </div>
              </div>
            </div>

            <div className="bg-cyan-50/70 p-5 rounded-xl border border-cyan-200 text-xs space-y-2">
              <h4 className="font-bold text-cyan-900">Cyber Dynamic Tech Customer Benefits</h4>
              <ul className="space-y-1.5 text-cyan-800 text-[11px]">
                <li>• Genuine brand warranty backed directly by regional distributors</li>
                <li>• Real-time delivery tracking across metropolitan areas</li>
                <li>• Save multiple shipping addresses for fast checkout</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: THEME COLOR SETTING */}
      {activeTab === 'theme' && (
        <div className="space-y-4">
          <ThemeColorSetting mode="full" />
        </div>
      )}
    </div>
  );
};
