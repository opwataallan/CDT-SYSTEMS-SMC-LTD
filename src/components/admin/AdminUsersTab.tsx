import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Search,
  RefreshCw,
  Edit,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
  X,
  Save,
  Lock,
  UserCheck,
  AlertTriangle,
  Store,
  Plus,
  ArrowUpDown,
  ShoppingBag,
  ExternalLink,
  Crown,
  Database,
} from 'lucide-react';
import { CustomerUser, UserRole } from '../../types';
import { api } from '../../services/api';
import { useShop } from '../../context/ShopContext';

export const AdminUsersTab: React.FC = () => {
  const { showToast, config, updateCategorySettings, formatPrice } = useShop();
  const [users, setUsers] = useState<CustomerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<CustomerUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'customer' as UserRole,
    status: 'active' as 'active' | 'suspended',
    is_email_verified: true,
    admin_notes: '',
    address_1: '',
    district: 'Kampala',
    city: 'Kampala',
  });

  const loadUsers = async (sync: boolean = false) => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers(sync);
      setUsers(res.users);
    } catch (err: any) {
      showToast('Could not load user accounts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWordPress = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncWordPressUsers();
      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users);
        showToast(
          `Synced ${res.count} users from WordPress & WooCommerce! (WP Authors/Admins: ${res.sources.wordpress}, Customers: ${res.sources.customers})`
        );
      }
    } catch (err: any) {
      showToast('WordPress API sync notice: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const isPosAllowedForUser = (u: CustomerUser) => {
    const level = u.wordpress_user_level ?? (u.role === 'admin' || u.role === 'super_admin' ? 10 : u.role === 'cashier' ? 3 : 0);
    if (level >= 3 || u.role === 'admin' || u.role === 'super_admin' || u.role === 'cashier') return true;
    const allowedRoles = config.pos?.allowed_roles || ['admin', 'manager', 'cashier', 'super_admin'];
    if (allowedRoles.includes(u.role)) return true;
    const allowedEmails = config.pos?.allowed_user_emails || [];
    return allowedEmails.map((e) => e.toLowerCase()).includes(u.email.toLowerCase());
  };

  const toggleUserPosAccess = async (userEmail: string) => {
    const currentEmails = config.pos?.allowed_user_emails || [];
    const exists = currentEmails.map((e) => e.toLowerCase()).includes(userEmail.toLowerCase());
    const updated = exists
      ? currentEmails.filter((e) => e.toLowerCase() !== userEmail.toLowerCase())
      : [...currentEmails, userEmail.toLowerCase()];
    try {
      await updateCategorySettings('pos', {
        ...config.pos,
        allowed_user_emails: updated,
      });
      showToast(
        exists
          ? `Revoked POS register access from ${userEmail}`
          : `Granted POS register access to ${userEmail}`
      );
    } catch (err: any) {
      showToast('Failed to update POS access: ' + err.message);
    }
  };

  const openEditModal = (u: CustomerUser) => {
    setEditingUser(u);
    setEditForm({
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'customer',
      status: u.status || 'active',
      is_email_verified: u.is_email_verified ?? true,
      admin_notes: u.admin_notes || '',
      address_1: u.addresses?.[0]?.address_1 || '',
      district: u.addresses?.[0]?.district || 'Kampala',
      city: u.addresses?.[0]?.city || 'Kampala',
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
  };

  const handleQuickRoleChange = async (userId: number, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      await api.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      showToast(`User role updated to ${newRole.toUpperCase()} successfully.`);
    } catch (err: any) {
      showToast('Failed to change role: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveUserModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsSaving(true);
      const updatedAddresses = [
        {
          id: editingUser.addresses?.[0]?.id || `addr_${Date.now()}`,
          type: 'shipping' as const,
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          phone: editForm.phone,
          district: editForm.district,
          city: editForm.city,
          address_1: editForm.address_1,
          is_default: true,
        },
      ];

      const res = await api.updateAdminUserProfile(editingUser.id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        status: editForm.status,
        is_email_verified: editForm.is_email_verified,
        admin_notes: editForm.admin_notes,
        addresses: updatedAddresses,
      });

      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? res.user : u)));
      showToast(`Successfully updated profile for ${editForm.first_name} ${editForm.last_name}.`);
      closeEditModal();
    } catch (err: any) {
      showToast('Error updating user: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getUserLevelBadge = (u: CustomerUser) => {
    const level = u.wordpress_user_level !== undefined ? u.wordpress_user_level : (
      u.role === 'super_admin' || u.role === 'admin' ? 10 :
      u.role === 'shop_manager' || u.role === 'manager' ? 7 :
      u.role === 'cashier' ? 3 :
      u.role === 'vendor' ? 2 : 0
    );

    switch (level) {
      case 10:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200 shadow-xs">
            <Crown className="w-3 h-3 text-purple-600" />
            <span>Level 10: Super Admin</span>
          </span>
        );
      case 7:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
            <Shield className="w-3 h-3 text-blue-600" />
            <span>Level 7: Store Manager</span>
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Store className="w-3 h-3 text-amber-600" />
            <span>Level 3: Cashier / POS</span>
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
            <Store className="w-3 h-3 text-emerald-600" />
            <span>Level 2: Vendor Partner</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span>Level 0: Customer</span>
          </span>
        );
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];

  // Filter users by search term and selected user level
  const filtered = safeUsers.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (u.email || '').toLowerCase().includes(q) ||
      (u.first_name || '').toLowerCase().includes(q) ||
      (u.last_name || '').toLowerCase().includes(q) ||
      (u.wordpress_username || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (selectedLevelFilter === 'all') return true;

    const level = u.wordpress_user_level !== undefined ? u.wordpress_user_level : (
      u.role === 'super_admin' || u.role === 'admin' ? 10 :
      u.role === 'shop_manager' || u.role === 'manager' ? 7 :
      u.role === 'cashier' ? 3 :
      u.role === 'vendor' ? 2 : 0
    );

    return level === selectedLevelFilter;
  });

  // Calculate user level distribution
  const countLevel10 = safeUsers.filter((u) => (u.wordpress_user_level ?? 0) >= 10 || u.role === 'super_admin' || u.role === 'admin').length;
  const countLevel7 = safeUsers.filter((u) => (u.wordpress_user_level === 7) || u.role === 'shop_manager' || u.role === 'manager').length;
  const countLevel3 = safeUsers.filter((u) => (u.wordpress_user_level === 3) || u.role === 'cashier').length;
  const countLevel2 = safeUsers.filter((u) => (u.wordpress_user_level === 2) || u.role === 'vendor').length;
  const countLevel0 = safeUsers.filter((u) => (u.wordpress_user_level === 0 || u.wordpress_user_level === undefined) && !['super_admin', 'admin', 'shop_manager', 'manager', 'cashier', 'vendor'].includes(u.role)).length;

  return (
    <div id="admin-users-management" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
      {/* Tab Header & WordPress Sync Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#007f19]/10 text-[#007f19]">
              <Users className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              WordPress & WooCommerce User Directory
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Connected to WordPress REST API (<span className="font-mono text-slate-700">cyberdynamictech.com</span>). Granular access enforced by User Levels (10, 7, 3, 2, 0).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, @username..."
              className="h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#007f19]"
            />
          </div>

          <button
            onClick={() => handleSyncWordPress()}
            disabled={isSyncing || loading}
            className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
            title="Fetch all users from WordPress core and WooCommerce customer database via API"
          >
            <Database className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync WordPress API'}</span>
          </button>

          <button
            onClick={() => loadUsers(false)}
            disabled={loading}
            className="h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#007f19] ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* User Levels Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedLevelFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedLevelFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>All Users</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {safeUsers.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedLevelFilter(10)}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedLevelFilter === 10
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <Crown className="w-3 h-3" />
          <span>Level 10: Super Admins</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-200 text-purple-900">
            {countLevel10}
          </span>
        </button>

        <button
          onClick={() => setSelectedLevelFilter(7)}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedLevelFilter === 7
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <Shield className="w-3 h-3" />
          <span>Level 7: Shop Managers</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-200 text-blue-900">
            {countLevel7}
          </span>
        </button>

        <button
          onClick={() => setSelectedLevelFilter(3)}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedLevelFilter === 3
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Store className="w-3 h-3" />
          <span>Level 3: Cashiers</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900">
            {countLevel3}
          </span>
        </button>

        <button
          onClick={() => setSelectedLevelFilter(2)}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedLevelFilter === 2
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Store className="w-3 h-3" />
          <span>Level 2: Vendors</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 text-emerald-900">
            {countLevel2}
          </span>
        </button>

        <button
          onClick={() => setSelectedLevelFilter(0)}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedLevelFilter === 0
              ? 'bg-slate-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Users className="w-3 h-3" />
          <span>Level 0: Customers</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {countLevel0}
          </span>
        </button>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="w-5 h-5 text-[#007f19] animate-spin mx-auto" />
          <p>Loading WordPress & WooCommerce user directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No matching user accounts found for the selected filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">User & Identity</th>
                <th className="py-2.5 px-3">WordPress User Level</th>
                <th className="py-2.5 px-3">Store Role</th>
                <th className="py-2.5 px-3">Orders & Spend</th>
                <th className="py-2.5 px-3">POS Register</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const isSuspended = u.status === 'suspended';
                const wpUserLevel = u.wordpress_user_level !== undefined ? u.wordpress_user_level : (
                  u.role === 'super_admin' || u.role === 'admin' ? 10 :
                  u.role === 'shop_manager' || u.role === 'manager' ? 7 :
                  u.role === 'cashier' ? 3 :
                  u.role === 'vendor' ? 2 : 0
                );

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* User Profile */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.first_name || 'User'}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-300">
                            {u.first_name ? u.first_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>
                              {u.displayName || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'WordPress User'}
                            </span>
                            {u.wordpress_username && (
                              <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                                @{u.wordpress_username}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            {u.wordpress_id ? (
                              <span className="text-purple-600 font-medium">WP ID #{u.wordpress_id}</span>
                            ) : (
                              <span>ID #{u.id}</span>
                            )}
                            <span>•</span>
                            <span>{u.source === 'wordpress_api' ? 'WP Core' : u.source === 'woocommerce_api' ? 'WooCommerce' : 'Marketplace'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* WordPress User Level */}
                    <td className="py-3 px-3">
                      {getUserLevelBadge(u)}
                    </td>

                    {/* Security Role Selector */}
                    <td className="py-3 px-3">
                      <select
                        value={u.role}
                        disabled={updatingId === u.id}
                        onChange={(e) => handleQuickRoleChange(u.id, e.target.value as UserRole)}
                        className="h-7 px-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 focus:outline-hidden focus:border-[#007f19] cursor-pointer disabled:opacity-50"
                      >
                        <option value="super_admin">Level 10: Super Admin</option>
                        <option value="admin">Level 10: Administrator</option>
                        <option value="shop_manager">Level 7: Shop Manager</option>
                        <option value="manager">Level 7: Manager</option>
                        <option value="cashier">Level 3: Cashier</option>
                        <option value="vendor">Level 2: Vendor</option>
                        <option value="editor">Editor</option>
                        <option value="customer">Level 0: Customer</option>
                      </select>
                    </td>

                    {/* Orders & Total Spend */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-slate-800 font-medium">
                        <ShoppingBag className="w-3 h-3 text-slate-400" />
                        <span>{u.orders_count || 0} orders</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-900">
                        {formatPrice(u.total_spent || 0)}
                      </div>
                    </td>

                    {/* POS Register Access */}
                    <td className="py-3 px-3">
                      {wpUserLevel >= 10 || u.role === 'admin' || u.role === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Admin Auto</span>
                        </span>
                      ) : wpUserLevel >= 7 || u.role === 'shop_manager' || u.role === 'cashier' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <Store className="w-2.5 h-2.5" />
                          <span>Staff POS</span>
                        </span>
                      ) : isPosAllowedForUser(u) ? (
                        <button
                          type="button"
                          onClick={() => toggleUserPosAccess(u.email)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 hover:bg-red-100 text-cyan-800 hover:text-red-700 border border-cyan-300 transition-colors cursor-pointer"
                          title="Click to revoke POS terminal access"
                        >
                          <Store className="w-3 h-3 text-cyan-700" />
                          <span>Authorized</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleUserPosAccess(u.email)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-cyan-100 text-slate-600 hover:text-cyan-800 border border-slate-200 transition-colors cursor-pointer"
                          title="Click to authorize this user for POS counter checkout"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Grant POS</span>
                        </button>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          <span>Suspended</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-[#007f19] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </td>

                    {/* Edit Profile */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => openEditModal(u)}
                        className="h-7.5 px-2.5 bg-[#920d35]/10 hover:bg-[#920d35] text-[#920d35] hover:text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Edit User Profile"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADMIN USER EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#007f19] text-white flex items-center justify-center font-black">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    Profile & Level Editor: {editingUser.displayName || `${editingUser.first_name} ${editingUser.last_name}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingUser.wordpress_id ? `WordPress User ID #${editingUser.wordpress_id} (@${editingUser.wordpress_username || 'user'})` : `Local ID #${editingUser.id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUserModal} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Email (Login Identifier)</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs font-mono focus:outline-hidden focus:border-[#007f19]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number (MTN / Airtel)</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+256..."
                    className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Security Role & Level</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full h-8.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#007f19]"
                  >
                    <option value="super_admin">Level 10: Super Admin</option>
                    <option value="admin">Level 10: Administrator</option>
                    <option value="shop_manager">Level 7: Shop Manager</option>
                    <option value="manager">Level 7: Manager</option>
                    <option value="cashier">Level 3: Cashier</option>
                    <option value="vendor">Level 2: Vendor Partner</option>
                    <option value="editor">Editor</option>
                    <option value="customer">Level 0: Customer</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Access Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'suspended' })}
                    className="w-full h-8.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#007f19]"
                  >
                    <option value="active">Active (Full Access)</option>
                    <option value="suspended">Suspended (Blocked)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Identity Verification</label>
                  <select
                    value={editForm.is_email_verified ? 'verified' : 'unverified'}
                    onChange={(e) => setEditForm({ ...editForm, is_email_verified: e.target.value === 'verified' })}
                    className="w-full h-8.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#007f19]"
                  >
                    <option value="verified">Verified Identity</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Internal Administrator Notes</label>
                <textarea
                  value={editForm.admin_notes}
                  onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                  placeholder="Record customer support, account flags, or security notes..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#007f19]" />
                  <span>Primary Delivery Location (Uganda)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">District</label>
                    <input
                      type="text"
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      placeholder="Kampala, Wakiso..."
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">City / Division</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="Central, Nakawa..."
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Street Address / Landmark</label>
                    <input
                      type="text"
                      value={editForm.address_1}
                      onChange={(e) => setEditForm({ ...editForm, address_1: e.target.value })}
                      placeholder="Plot / Street / Building"
                      className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSaving}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#007f19] hover:bg-[#007f19]/90 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
