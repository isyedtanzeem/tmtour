import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Mail, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  Clock, 
  Lock, 
  Sliders, 
  Check, 
  X,
  Compass,
  FileCheck,
  Code,
  ImageIcon,
  RefreshCw,
  Database
} from 'lucide-react';
import { adminAuthService, DEFAULT_PERMISSIONS, VIEW_ONLY_LEADS_PERMISSIONS } from '../services/adminAuthService';
import { sheetsService } from '../services/sheetsService';
import { AdminUser, AdminRole, ModulePermissions } from '../types';

interface AdminUserManagerProps {
  currentUser: AdminUser | null;
  onUsersChanged?: () => void;
}

export const AdminUserManager: React.FC<AdminUserManagerProps> = ({
  currentUser,
  onUsersChanged,
}) => {
  const [users, setUsers] = useState<AdminUser[]>(() => adminAuthService.getAllUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Form states for create/edit
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formShowPassword, setFormShowPassword] = useState(false);
  const [formRole, setFormRole] = useState<AdminRole>('Lead Specialist');
  const [formActive, setFormActive] = useState(true);
  const [formPermissions, setFormPermissions] = useState<ModulePermissions>(VIEW_ONLY_LEADS_PERMISSIONS);
  const [customPresetType, setCustomPresetType] = useState<'view_only_leads' | 'process_leads' | 'ops' | 'super' | 'custom'>('view_only_leads');

  // Feedback notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  const refreshUserList = () => {
    setUsers(adminAuthService.getAllUsers());
    if (onUsersChanged) onUsersChanged();
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSyncFromSheets = async () => {
    setIsSyncingSheets(true);
    try {
      const res = await sheetsService.syncWithGoogleSheets();
      refreshUserList();
      if (res.success) {
        showNotification('success', 'Staff accounts refreshed from Google Sheets database!');
      } else {
        showNotification('error', res.message || 'Failed to sync staff from Google Sheets.');
      }
    } catch (e: any) {
      showNotification('error', e?.message || 'Error communicating with Google Sheets.');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const openCreateModal = () => {
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormPassword('');
    setFormShowPassword(false);
    setFormRole('Lead Specialist');
    setFormActive(true);
    setFormPermissions(JSON.parse(JSON.stringify(VIEW_ONLY_LEADS_PERMISSIONS)));
    setCustomPresetType('view_only_leads');
    setEditingUser(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPassword('');
    setFormShowPassword(false);
    setFormRole(user.role);
    setFormActive(user.active);
    setFormPermissions(JSON.parse(JSON.stringify(user.permissions || DEFAULT_PERMISSIONS[user.role])));
    
    // Determine preset type
    if (user.role === 'Super Admin') {
      setCustomPresetType('super');
    } else if (
      user.permissions?.leads?.view &&
      !user.permissions?.leads?.manageStatus &&
      !user.permissions?.packages?.view
    ) {
      setCustomPresetType('view_only_leads');
    } else if (
      user.permissions?.leads?.view &&
      user.permissions?.leads?.manageStatus &&
      !user.permissions?.packages?.manage
    ) {
      setCustomPresetType('process_leads');
    } else if (user.role === 'Operations Manager') {
      setCustomPresetType('ops');
    } else {
      setCustomPresetType('custom');
    }

    setIsCreateModalOpen(true);
  };

  const handlePresetChange = (preset: 'view_only_leads' | 'process_leads' | 'ops' | 'super' | 'custom') => {
    setCustomPresetType(preset);
    if (preset === 'view_only_leads') {
      setFormRole('Lead Specialist');
      setFormPermissions(JSON.parse(JSON.stringify(VIEW_ONLY_LEADS_PERMISSIONS)));
    } else if (preset === 'process_leads') {
      setFormRole('Lead Specialist');
      setFormPermissions({
        packages: { view: true, manage: false },
        visas: { view: true, manage: false },
        leads: { view: true, manageStatus: true, delete: false },
        databaseSync: { view: false, manage: false },
        emailAlerts: { view: false, manage: false },
        branding: { manage: false },
        userManagement: { manage: false },
      });
    } else if (preset === 'ops') {
      setFormRole('Operations Manager');
      setFormPermissions(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS['Operations Manager'])));
    } else if (preset === 'super') {
      setFormRole('Super Admin');
      setFormPermissions(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS['Super Admin'])));
    } else {
      setFormRole('Custom Staff');
    }
  };

  const handlePermissionToggle = (module: keyof ModulePermissions, subKey: string) => {
    setCustomPresetType('custom');
    setFormPermissions((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const mod = copy[module] as Record<string, boolean>;
      if (mod && subKey in mod) {
        mod[subKey] = !mod[subKey];
        // If unchecking view, manage must also turn off
        if (subKey === 'view' && !mod[subKey] && 'manage' in mod) {
          mod['manage'] = false;
        }
        // If checking manage, view must also turn on
        if (subKey === 'manage' && mod[subKey] && 'view' in mod) {
          mod['view'] = true;
        }
      }
      return copy;
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formUsername.trim() || !formEmail.trim()) {
      showNotification('error', 'Name, username, and email are required.');
      return;
    }

    if (!editingUser && (!formPassword.trim() || formPassword.trim().length < 4)) {
      showNotification('error', 'Please provide a password of at least 4 characters for new staff accounts.');
      return;
    }

    setIsProcessing(true);

    try {
      if (editingUser) {
        // Update existing user
        const res = await adminAuthService.updateUserAsync(editingUser.id, {
          name: formName,
          username: formUsername,
          email: formEmail,
          role: formRole,
          active: formActive,
          permissions: formPermissions,
          newPassword: formPassword.trim() ? formPassword.trim() : undefined,
        });

        if (res.success) {
          showNotification('success', res.message);
          setIsCreateModalOpen(false);
          refreshUserList();
        } else {
          showNotification('error', res.message);
        }
      } else {
        // Create new user
        const res = await adminAuthService.createUserAsync({
          name: formName,
          username: formUsername,
          email: formEmail,
          password: formPassword,
          role: formRole,
          permissions: formPermissions,
          active: formActive,
        });

        if (res.success) {
          showNotification('success', res.message);
          setIsCreateModalOpen(false);
          refreshUserList();
        } else {
          showNotification('error', res.message);
        }
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to save staff member.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    setIsProcessing(true);
    try {
      const res = await adminAuthService.toggleUserActiveAsync(user.id);
      if (res.success) {
        showNotification('success', res.message);
        refreshUserList();
      } else {
        showNotification('error', res.message);
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to update user status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete the staff user "${user.name}"? This will also remove them from Google Sheets.`)) {
      return;
    }
    setIsProcessing(true);
    try {
      const res = await adminAuthService.deleteUserAsync(user.id);
      if (res.success) {
        showNotification('success', res.message);
        refreshUserList();
      } else {
        showNotification('error', res.message);
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to delete user.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.active) ||
      (statusFilter === 'suspended' && !u.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-semibold transition-all animate-in fade-in slide-in-from-top-2 shadow-md ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Super Admin Control Panel
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Staff Users & Role-Based Permissions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Create staff accounts, configure role restrictions, and define exact functional permissions for each module (e.g. view-only leads, holiday operations, or full super admin).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSyncFromSheets}
            disabled={isSyncingSheets || isProcessing}
            title="Refresh staff records directly from Google Sheets Staff_Users sheet"
            className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 border border-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncingSheets ? 'animate-spin' : ''}`} />
            <span>{isSyncingSheets ? 'Syncing...' : 'Sync from Sheets'}</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Staff User</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Tab Sync Info Banner */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700">
          <Database className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Google Sheets Staff Storage:</strong> Connected to sheet tab <code className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-mono text-emerald-700 font-semibold">Staff_Users</code>. New staff users and role permissions are automatically synchronized and validated via Google Apps Script.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sheets Database Synced</span>
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Accounts</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{users.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Registered staff members</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active Status</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {users.filter((u) => u.active).length}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">Authorized for login</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Super Admins</div>
          <div className="text-2xl font-black text-indigo-900 mt-1">
            {users.filter((u) => u.role === 'Super Admin').length}
          </div>
          <div className="text-[10px] text-indigo-600/80 mt-0.5">Full unrestricted access</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Restricted Roles</div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {users.filter((u) => u.role !== 'Super Admin').length}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-0.5">Module & view restrictions</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, username, or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Operations Manager">Operations Manager</option>
            <option value="Lead Specialist">Lead Specialist</option>
            <option value="Custom Staff">Custom Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          <button
            onClick={refreshUserList}
            title="Refresh list"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-5">Staff Member</th>
                <th className="py-4 px-4">Role & Access Level</th>
                <th className="py-4 px-4">Module Permissions</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Last Activity</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No staff accounts found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPrimaryAdmin = u.id === 'user_super_admin';
                  const isCurrent = currentUser?.id === u.id;

                  // Permission summary string
                  const isViewOnlyLeads =
                    u.permissions?.leads?.view &&
                    !u.permissions?.leads?.manageStatus &&
                    !u.permissions?.packages?.view;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              u.role === 'Super Admin'
                                ? 'bg-purple-100 text-purple-700'
                                : u.role === 'Operations Manager'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-xs font-mono flex items-center gap-2 mt-0.5">
                              <span>@{u.username}</span>
                              <span>•</span>
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              u.role === 'Super Admin'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : u.role === 'Operations Manager'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : u.role === 'Lead Specialist'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            <span>{u.role}</span>
                          </span>
                          {isPrimaryAdmin && (
                            <span className="text-[10px] text-purple-600 font-semibold pl-1">
                              Primary Root Admin
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.role === 'Super Admin' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                              <Check className="w-3 h-3 text-purple-600" />
                              All Modules (Full Access)
                            </span>
                          ) : isViewOnlyLeads ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              <Eye className="w-3 h-3 text-emerald-600" />
                              View-Only Leads
                            </span>
                          ) : (
                            <>
                              {u.permissions?.leads?.view && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                                  Leads: {u.permissions.leads.manageStatus ? 'Process' : 'View Only'}
                                </span>
                              )}
                              {u.permissions?.packages?.view && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                                  Packages: {u.permissions.packages.manage ? 'Manage' : 'View'}
                                </span>
                              )}
                              {u.permissions?.visas?.view && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                                  Visas: {u.permissions.visas.manage ? 'Manage' : 'View'}
                                </span>
                              )}
                              {u.permissions?.databaseSync?.manage && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                                  Sheets Sync
                                </span>
                              )}
                              {u.permissions?.emailAlerts?.view && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                                  Email Alerts
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <button
                          onClick={() => !isPrimaryAdmin && handleToggleActive(u)}
                          disabled={isPrimaryAdmin}
                          title={isPrimaryAdmin ? 'Primary root admin cannot be suspended' : 'Click to toggle active status'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                            u.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          } ${isPrimaryAdmin ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></span>
                          <span>{u.active ? 'Active' : 'Suspended'}</span>
                        </button>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500 font-mono">
                        {u.lastLoginAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(u.lastLoginAt).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Never logged in</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit User & Permissions"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {!isPrimaryAdmin && !isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Permanently Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================= */}
      {/* CREATE / EDIT USER MODAL */}
      {/* ============================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">
                    {editingUser ? `Edit Staff Member: ${editingUser.name}` : 'Create New Staff Account'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Set identity credentials, operational roles, and functional permissions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Profile Details */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Account Credentials & Identification
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Username (Login ID) *
                    </label>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="e.g. rahul_leads"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="rahul@tripmytour.com"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {editingUser ? 'New Password (leave blank to keep current)' : 'Initial Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={formShowPassword ? 'text' : 'password'}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder={editingUser ? 'Keep existing password' : 'Enter password'}
                        required={!editingUser}
                        className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setFormShowPassword(!formShowPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {formShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Account is Active (permitted to sign in to admin terminal)
                    </span>
                  </label>
                </div>
              </div>

              {/* Role Presets */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Role Preset Quick-Select
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handlePresetChange('view_only_leads')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      customPresetType === 'view_only_leads'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between text-emerald-800">
                      <span>View-Only Leads Agent</span>
                      {customPresetType === 'view_only_leads' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Can only view holiday inquiries & visa submissions. Cannot update status, edit packages, or change settings.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetChange('process_leads')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      customPresetType === 'process_leads'
                        ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between text-blue-800">
                      <span>Lead Processing Officer</span>
                      {customPresetType === 'process_leads' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Can view customer leads and update booking/visa status (Contacted, In Review, Completed).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetChange('ops')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      customPresetType === 'ops'
                        ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between text-indigo-800">
                      <span>Operations Manager</span>
                      {customPresetType === 'ops' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Full package & visa creation/editing, lead processing, and manual Sheets synchronization.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePresetChange('super')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      customPresetType === 'super'
                        ? 'border-purple-500 bg-purple-50/70 text-purple-950 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between text-purple-800">
                      <span>Super Admin</span>
                      {customPresetType === 'super' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Full master control including staff account creation, security firewalls, and database configuration.
                    </p>
                  </button>
                </div>
              </div>

              {/* Granular Permission Matrix */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Granular Module Restrictions Matrix
                  </div>
                  {customPresetType === 'custom' && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Custom Rules Active
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Holiday Packages */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-900">Holiday Packages Module</div>
                        <div className="text-[11px] text-slate-500">Travel destinations and packages catalog</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissions.packages.view}
                          onChange={() => handlePermissionToggle('packages', 'view')}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>View</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissions.packages.manage}
                          onChange={() => handlePermissionToggle('packages', 'manage')}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>Create/Edit/Delete</span>
                      </label>
                    </div>
                  </div>

                  {/* Visa Services */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-900">Visa Services Module</div>
                        <div className="text-[11px] text-slate-500">Visa countries, fee structures, and documents</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissions.visas.view}
                          onChange={() => handlePermissionToggle('visas', 'view')}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>View</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissions.visas.manage}
                          onChange={() => handlePermissionToggle('visas', 'manage')}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>Create/Edit/Delete</span>
                      </label>
                    </div>
                  </div>

                  {/* Customer Leads */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-purple-600 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-900">Customer Leads & Inquiries</div>
                        <div className="text-[11px] text-slate-500">Holiday inquiries, bookings, and visa applications</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissions.leads.view}
                          onChange={() => handlePermissionToggle('leads', 'view')}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>View Leads</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissions.leads.manageStatus}
                          onChange={() => handlePermissionToggle('leads', 'manageStatus')}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>Update Status</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissions.leads.delete}
                          onChange={() => handlePermissionToggle('leads', 'delete')}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>Delete</span>
                      </label>
                    </div>
                  </div>

                  {/* Database Sync */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Code className="w-4 h-4 text-slate-700 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-900">Google Sheets Sync & Apps Script</div>
                        <div className="text-[11px] text-slate-500">Web App script deployment and sync endpoints</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissions.databaseSync.view}
                          onChange={() => handlePermissionToggle('databaseSync', 'view')}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>View Status</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissions.databaseSync.manage}
                          onChange={() => handlePermissionToggle('databaseSync', 'manage')}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>Manage & Sync</span>
                      </label>
                    </div>
                  </div>

                  {/* Email Alerts */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-900">Lead Email Notification Alerts</div>
                        <div className="text-[11px] text-slate-500">Configure alert recipients and delivery checks</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissions.emailAlerts.view}
                          onChange={() => handlePermissionToggle('emailAlerts', 'view')}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>View Alerts</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissions.emailAlerts.manage}
                          onChange={() => handlePermissionToggle('emailAlerts', 'manage')}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>Manage Recipients</span>
                      </label>
                    </div>
                  </div>

                  {/* User & Permissions Management */}
                  <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-purple-700 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-purple-950">Staff & Permission Management</div>
                        <div className="text-[11px] text-purple-700">Create, edit, and suspend other admin users</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissions.userManagement.manage}
                          onChange={() => handlePermissionToggle('userManagement', 'manage')}
                          className="w-4 h-4 rounded text-purple-600"
                        />
                        <span className="text-purple-900 font-bold">Super Admin Privilege</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving & Syncing to Sheets...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingUser ? 'Save Changes' : 'Create Staff User'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
