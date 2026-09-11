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
} from 'lucide-react';
import { CustomerUser, UserRole } from '../../types';
import { api } from '../../services/api';
import { useShop } from '../../context/ShopContext';

export const AdminUsersTab: React.FC = () => {
  const { showToast, config, updateCategorySettings } = useShop();
  const [users, setUsers] = useState<CustomerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const isPosAllowedForUser = (u: CustomerUser) => {
    if (u.role === 'admin') return true;
    const allowedRoles = config.pos?.allowed_roles || ['admin', 'manager'];
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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers();
      setUsers(res.users);
    } catch (err: any) {
      showToast('Could not load user accounts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(q) ||
      (u.first_name || '').toLowerCase().includes(q) ||
      (u.last_name || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q)
    );
  });

  return (
    <div id="admin-users-management" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#007f19]/10 text-[#007f19]">
              <Users className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              User Accounts & Administrative Profile Editor
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exclusive administrator authority: view, edit profiles, adjust roles, verify identities, and manage account statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user by name, email, phone..."
              className="h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#007f19]"
            />
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#007f19] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="w-5 h-5 text-[#007f19] animate-spin mx-auto" />
          <p>Loading user directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">No matching user accounts found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Customer / User</th>
                <th className="py-2.5 px-3">Contact Details</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">POS Access</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Verification</th>
                <th className="py-2.5 px-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const isSuspended = u.status === 'suspended';
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                          {u.first_name ? u.first_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.first_name} {u.last_name}</span>
                            {u.id === 1 && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                                Primary Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">ID #{u.id} • Registered {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-700 font-mono text-[11px]">{u.email}</div>
                      <div className="text-[10px] text-slate-400">{u.phone || 'No phone on file'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={u.role}
                        disabled={updatingId === u.id}
                        onChange={(e) => handleQuickRoleChange(u.id, e.target.value as UserRole)}
                        className="h-7 px-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 focus:outline-hidden focus:border-[#007f19] cursor-pointer disabled:opacity-50"
                      >
                        <option value="customer">Customer</option>
                        <option value="editor">Editor</option>
                        <option value="manager">Store Manager</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Admin Access</span>
                        </span>
                      ) : isPosAllowedForUser(u) ? (
                        <button
                          type="button"
                          onClick={() => toggleUserPosAccess(u.email)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 hover:bg-red-100 text-cyan-800 hover:text-red-700 border border-cyan-300 transition-colors cursor-pointer"
                          title="Click to revoke POS terminal access"
                        >
                          <Store className="w-3 h-3 text-cyan-700" />
                          <span>Authorized (Revoke)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleUserPosAccess(u.email)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-cyan-100 text-slate-600 hover:text-cyan-800 border border-slate-200 transition-colors cursor-pointer"
                          title="Click to authorize this user for POS terminal access"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Grant POS Access</span>
                        </button>
                      )}
                    </td>
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
                    <td className="py-3 px-3">
                      {u.is_email_verified ? (
                        <span className="text-[11px] font-bold text-[#007f19] flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Unverified</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => openEditModal(u)}
                        className="h-7.5 px-2.5 bg-[#920d35]/10 hover:bg-[#920d35] text-[#920d35] hover:text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Edit User Profile"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit Profile</span>
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
                    Admin Profile Editor: User #{editingUser.id}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Administrator changes override all frontend customer defaults immediately.
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
                  <label className="font-bold text-slate-700 block mb-1">Security Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full h-8.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#007f19]"
                  >
                    <option value="customer">Customer</option>
                    <option value="editor">Editor</option>
                    <option value="manager">Store Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Access Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full h-8.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#007f19]"
                  >
                    <option value="active">Active (Normal Access)</option>
                    <option value="suspended">Suspended (Blocked)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Verification</label>
                  <div className="flex items-center h-8.5 gap-2">
                    <input
                      type="checkbox"
                      id="edit_is_verified"
                      checked={editForm.is_email_verified}
                      onChange={(e) => setEditForm({ ...editForm, is_email_verified: e.target.checked })}
                      className="w-4 h-4 rounded text-[#007f19] focus:ring-[#007f19]"
                    />
                    <label htmlFor="edit_is_verified" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Mark as Verified
                    </label>
                  </div>
                </div>
              </div>

              {/* Delivery Address Section */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">
                  Default Kampala Delivery Address
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={editForm.address_1}
                      onChange={(e) => setEditForm({ ...editForm, address_1: e.target.value })}
                      placeholder="Plot, Building, Street in Kampala"
                      className="w-full h-8.5 px-3 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                    />
                  </div>
                  <div>
                    <select
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value, city: e.target.value })}
                      className="w-full h-8.5 px-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                    >
                      <option value="Kampala Central (Nakasero, Kololo, CBD, Kamwokya)">Kampala Central</option>
                      <option value="Nakawa Division (Ntinda, Naguru, Bugolobi, Kyambogo)">Nakawa Division</option>
                      <option value="Makindye Division (Kabalagala, Kansanga, Munyonyo)">Makindye Division</option>
                      <option value="Kawempe Division (Kisaasi, Komamboga, Kalerwe)">Kawempe Division</option>
                      <option value="Rubaga Division (Mengo, Namirembe, Lubaga)">Rubaga Division</option>
                      <option value="Greater Kampala / Wakiso (Kira, Nansana, Namugongo)">Greater Kampala / Wakiso</option>
                      <option value="Entebbe Road Corridor (Lubowa, Seguku, Kajjansi)">Entebbe Road Corridor</option>
                      <option value="Mukono / Jinja Road Corridor (Bweyogerere, Seeta)">Mukono Corridor</option>
                      <option value="Kampala">Kampala</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Admin Private Remarks */}
              <div className="pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-700 block mb-1">
                  Administrator Internal Notes (Audited)
                </label>
                <textarea
                  rows={2}
                  value={editForm.admin_notes}
                  onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                  placeholder="Private remarks about this user, special pricing agreements, or warranty terms..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#007f19]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#007f19] hover:bg-[#006013] text-white font-black text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save User Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
