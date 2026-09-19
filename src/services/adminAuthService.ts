import { AdminUser, AdminRole, ModulePermissions, SecurityAuditLog } from '../types';
import { sheetsService } from './sheetsService';

const CREDENTIALS_KEY = 'tripmytour_admin_credentials';
const USERS_STORAGE_KEY = 'tripmytour_admin_users_v2';
const SESSION_LOCAL_KEY = 'tripmytour_admin_session';
const SESSION_SESSION_KEY = 'tripmytour_admin_session_transient';
const LOCKOUT_KEY = 'tripmytour_admin_lockout';
const AUDIT_LOGS_KEY = 'tripmytour_admin_audit_logs';

export const DEFAULT_PERMISSIONS: Record<AdminRole, ModulePermissions> = {
  'Super Admin': {
    packages: { view: true, manage: true },
    visas: { view: true, manage: true },
    leads: { view: true, manageStatus: true, delete: true },
    databaseSync: { view: true, manage: true },
    emailAlerts: { view: true, manage: true },
    branding: { manage: true },
    userManagement: { manage: true },
  },
  'Operations Manager': {
    packages: { view: true, manage: true },
    visas: { view: true, manage: true },
    leads: { view: true, manageStatus: true, delete: false },
    databaseSync: { view: true, manage: true },
    emailAlerts: { view: true, manage: false },
    branding: { manage: true },
    userManagement: { manage: false },
  },
  'Lead Specialist': {
    packages: { view: true, manage: false },
    visas: { view: true, manage: false },
    leads: { view: true, manageStatus: true, delete: false },
    databaseSync: { view: false, manage: false },
    emailAlerts: { view: false, manage: false },
    branding: { manage: false },
    userManagement: { manage: false },
  },
  'Custom Staff': {
    packages: { view: false, manage: false },
    visas: { view: false, manage: false },
    leads: { view: true, manageStatus: false, delete: false },
    databaseSync: { view: false, manage: false },
    emailAlerts: { view: false, manage: false },
    branding: { manage: false },
    userManagement: { manage: false },
  },
};

export const VIEW_ONLY_LEADS_PERMISSIONS: ModulePermissions = {
  packages: { view: false, manage: false },
  visas: { view: false, manage: false },
  leads: { view: true, manageStatus: false, delete: false },
  databaseSync: { view: false, manage: false },
  emailAlerts: { view: false, manage: false },
  branding: { manage: false },
  userManagement: { manage: false },
};

const DEFAULT_USERS_SEED: AdminUser[] = [
  {
    id: 'user_super_admin',
    username: 'admin',
    email: 'admin@tripmytour.com',
    password: 'admin',
    name: 'Syed Tanzeem (Super Admin)',
    role: 'Super Admin',
    active: true,
    permissions: DEFAULT_PERMISSIONS['Super Admin'],
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'user_lead_viewer_sample',
    username: 'lead_viewer',
    email: 'viewer@tripmytour.com',
    password: 'viewer123',
    name: 'Rahul (View-Only Leads)',
    role: 'Lead Specialist',
    active: true,
    permissions: VIEW_ONLY_LEADS_PERMISSIONS,
    createdAt: '2026-09-15T00:00:00.000Z',
  },
];

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds

class AdminAuthService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initDefaults();
    if (typeof window !== 'undefined') {
      window.addEventListener('sheets-staff-synced', (e: any) => {
        if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
          this.syncFromSheets(e.detail);
        }
      });
    }
  }

  public syncFromSheets(remoteUsers: AdminUser[]): void {
    if (!Array.isArray(remoteUsers) || remoteUsers.length === 0) return;
    try {
      const existing = this.getAllUsers();
      const mergedMap = new Map<string, AdminUser>();
      existing.forEach((u) => mergedMap.set(u.id, u));

      remoteUsers.forEach((ru) => {
        let perms = ru.permissions;
        if (typeof perms === 'string') {
          try {
            perms = JSON.parse(perms);
          } catch (e) {}
        }
        mergedMap.set(ru.id, {
          ...ru,
          permissions: perms || DEFAULT_PERMISSIONS[ru.role] || DEFAULT_PERMISSIONS['Lead Specialist'],
          active: ru.active === true || String(ru.active).toLowerCase() === 'true',
        });
      });

      const mergedList = Array.from(mergedMap.values());
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mergedList));
      this.notify();
    } catch (e) {
      console.warn('Failed to merge remote users from sheets:', e);
    }
  }

  private initDefaults(): void {
    if (!localStorage.getItem(USERS_STORAGE_KEY)) {
      // Check if old credentials existed and preserve custom password if set
      let superAdminPassword = 'admin';
      let superAdminName = 'Syed Tanzeem (Super Admin)';
      let superAdminEmail = 'admin@tripmytour.com';
      try {
        const oldCreds = localStorage.getItem(CREDENTIALS_KEY);
        if (oldCreds) {
          const parsed = JSON.parse(oldCreds);
          if (parsed.password) superAdminPassword = parsed.password;
          if (parsed.name) superAdminName = parsed.name;
          if (parsed.email) superAdminEmail = parsed.email;
        }
      } catch (e) {
        // ignore
      }

      const initialUsers = [...DEFAULT_USERS_SEED];
      initialUsers[0].password = superAdminPassword;
      initialUsers[0].name = superAdminName;
      initialUsers[0].email = superAdminEmail;

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    });
    window.dispatchEvent(new Event('admin-auth-changed'));
  }

  // =========================================================================
  // USER MANAGEMENT (SUPER ADMIN ONLY)
  // =========================================================================

  public getAllUsers(): AdminUser[] {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse users:', e);
    }
    return DEFAULT_USERS_SEED;
  }

  public getUserById(id: string): AdminUser | null {
    const users = this.getAllUsers();
    return users.find((u) => u.id === id) || null;
  }

  private saveUsers(users: AdminUser[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    this.notify();
  }

  public createUser(userData: {
    name: string;
    username: string;
    email: string;
    password?: string;
    role: AdminRole;
    permissions?: ModulePermissions;
    active?: boolean;
  }): { success: boolean; message: string; user?: AdminUser } {
    const users = this.getAllUsers();
    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanName = userData.name.trim();

    if (!cleanUsername || !cleanEmail || !cleanName) {
      return { success: false, message: 'Name, username, and email are all required.' };
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: `Username "${cleanUsername}" is already in use by another staff member.` };
    }

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: `Email "${cleanEmail}" is already registered.` };
    }

    const assignedPermissions = userData.permissions || DEFAULT_PERMISSIONS[userData.role] || DEFAULT_PERMISSIONS['Lead Specialist'];

    const newUser: AdminUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      password: (userData.password || 'welcome123').trim(),
      role: userData.role,
      active: userData.active !== undefined ? userData.active : true,
      permissions: assignedPermissions,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    this.saveUsers(updatedUsers);

    // Synchronize to Google Sheets Staff_Users tab
    sheetsService.saveStaffUser(newUser).catch((err) => {
      console.warn('Google Sheets staff sync notice:', err);
    });

    this.logAudit({
      action: 'USER_CREATED',
      details: `Super Admin created user '${newUser.name}' (${newUser.username}) with role '${newUser.role}'.`,
    });

    return {
      success: true,
      message: `User '${newUser.name}' created with role: ${newUser.role} (synced with Google Sheets)!`,
      user: newUser,
    };
  }

  public async createUserAsync(userData: {
    name: string;
    username: string;
    email: string;
    password?: string;
    role: AdminRole;
    permissions?: ModulePermissions;
    active?: boolean;
  }): Promise<{ success: boolean; message: string; user?: AdminUser; sheetsSynced?: boolean }> {
    const res = this.createUser(userData);
    if (!res.success || !res.user) {
      return res;
    }

    try {
      const sheetsRes = await sheetsService.saveStaffUser(res.user);
      return {
        success: true,
        message: sheetsRes.success
          ? `User '${res.user.name}' created and saved to Google Sheets!`
          : `User '${res.user.name}' created locally. (${sheetsRes.message || sheetsRes.error || ''})`,
        user: res.user,
        sheetsSynced: sheetsRes.success,
      };
    } catch (err: any) {
      return {
        success: true,
        message: `User '${res.user.name}' created locally. (Sheets sync pending: ${err?.message || ''})`,
        user: res.user,
        sheetsSynced: false,
      };
    }
  }

  public updateUser(
    id: string,
    updates: Partial<AdminUser> & { newPassword?: string }
  ): { success: boolean; message: string; user?: AdminUser } {
    const users = this.getAllUsers();
    const targetIdx = users.findIndex((u) => u.id === id);

    if (targetIdx === -1) {
      return { success: false, message: 'User not found in system records.' };
    }

    const existing = users[targetIdx];

    // Protect primary super admin from losing super admin privileges or being deactivated
    if (existing.id === 'user_super_admin' && updates.active === false) {
      return { success: false, message: 'The primary system Super Admin account cannot be deactivated.' };
    }
    if (existing.id === 'user_super_admin' && updates.role && updates.role !== 'Super Admin') {
      return { success: false, message: 'The primary system Super Admin role cannot be altered.' };
    }

    // Check username uniqueness if changed
    if (updates.username && updates.username.trim().toLowerCase() !== existing.username.toLowerCase()) {
      const uCheck = updates.username.trim().toLowerCase();
      if (users.some((u) => u.id !== id && u.username.toLowerCase() === uCheck)) {
        return { success: false, message: `Username "${uCheck}" is already taken.` };
      }
    }

    // Check email uniqueness if changed
    if (updates.email && updates.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const eCheck = updates.email.trim().toLowerCase();
      if (users.some((u) => u.id !== id && u.email.toLowerCase() === eCheck)) {
        return { success: false, message: `Email "${eCheck}" is already assigned to another user.` };
      }
    }

    const updatedUser: AdminUser = {
      ...existing,
      name: updates.name ? updates.name.trim() : existing.name,
      username: updates.username ? updates.username.trim().toLowerCase() : existing.username,
      email: updates.email ? updates.email.trim().toLowerCase() : existing.email,
      role: updates.role || existing.role,
      active: updates.active !== undefined ? updates.active : existing.active,
      permissions: updates.permissions || existing.permissions,
      password: updates.newPassword ? updates.newPassword.trim() : (updates.password || existing.password),
    };

    users[targetIdx] = updatedUser;
    this.saveUsers(users);

    // Sync to Google Sheets
    sheetsService.saveStaffUser(updatedUser).catch((err) => {
      console.warn('Google Sheets staff update notice:', err);
    });

    // If current logged-in user was updated, sync session state
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      this.updateActiveSession(updatedUser);
    }

    this.logAudit({
      action: 'USER_UPDATED',
      details: `User profile & permissions updated for '${updatedUser.name}' (${updatedUser.username}). Role: ${updatedUser.role}, Status: ${updatedUser.active ? 'Active' : 'Suspended'}.`,
    });

    return {
      success: true,
      message: `User '${updatedUser.name}' updated successfully (synced to Google Sheets)!`,
      user: updatedUser,
    };
  }

  public async updateUserAsync(
    id: string,
    updates: Partial<AdminUser> & { newPassword?: string }
  ): Promise<{ success: boolean; message: string; user?: AdminUser; sheetsSynced?: boolean }> {
    const res = this.updateUser(id, updates);
    if (!res.success || !res.user) {
      return res;
    }

    try {
      const sheetsRes = await sheetsService.saveStaffUser(res.user);
      return {
        success: true,
        message: sheetsRes.success
          ? `User '${res.user.name}' updated and synced to Google Sheets!`
          : `User '${res.user.name}' updated locally. (${sheetsRes.message || sheetsRes.error || ''})`,
        user: res.user,
        sheetsSynced: sheetsRes.success,
      };
    } catch {
      return {
        success: true,
        message: `User '${res.user.name}' updated locally.`,
        user: res.user,
        sheetsSynced: false,
      };
    }
  }

  public toggleUserActive(id: string): { success: boolean; message: string; active?: boolean } {
    const users = this.getAllUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return { success: false, message: 'User not found.' };

    if (user.id === 'user_super_admin') {
      return { success: false, message: 'The primary system Super Admin cannot be suspended.' };
    }

    const nextActive = !user.active;
    return this.updateUser(id, { active: nextActive }).success
      ? { success: true, message: `User ${user.name} is now ${nextActive ? 'Active' : 'Suspended'}.`, active: nextActive }
      : { success: false, message: 'Failed to update user status.' };
  }

  public async toggleUserActiveAsync(id: string): Promise<{ success: boolean; message: string; active?: boolean }> {
    const res = this.toggleUserActive(id);
    if (!res.success) return res;
    const user = this.getUserById(id);
    if (user) {
      await sheetsService.saveStaffUser(user).catch(() => {});
    }
    return res;
  }

  public deleteUser(id: string): { success: boolean; message: string } {
    const users = this.getAllUsers();
    const user = users.find((u) => u.id === id);

    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    if (user.id === 'user_super_admin') {
      return { success: false, message: 'The primary Super Admin cannot be deleted.' };
    }

    const current = this.getCurrentUser();
    if (current && current.id === id) {
      return { success: false, message: 'You cannot delete your own currently active account.' };
    }

    const filtered = users.filter((u) => u.id !== id);
    this.saveUsers(filtered);

    // Sync deletion to Google Sheets
    sheetsService.deleteStaffUser(id).catch((err) => {
      console.warn('Google Sheets staff delete notice:', err);
    });

    this.logAudit({
      action: 'USER_DELETED',
      details: `Staff user '${user.name}' (${user.username}) was permanently removed by Super Admin.`,
    });

    return { success: true, message: `User '${user.name}' has been deleted.` };
  }

  public async deleteUserAsync(id: string): Promise<{ success: boolean; message: string; sheetsSynced?: boolean }> {
    const res = this.deleteUser(id);
    if (!res.success) return res;

    try {
      const sheetsRes = await sheetsService.deleteStaffUser(id);
      return {
        success: true,
        message: sheetsRes.success
          ? 'Staff user deleted and removed from Google Sheets database.'
          : 'Staff user deleted locally.',
        sheetsSynced: sheetsRes.success,
      };
    } catch {
      return { success: true, message: 'Staff user deleted locally.', sheetsSynced: false };
    }
  }

  // =========================================================================
  // AUTHENTICATION & SESSIONS
  // =========================================================================

  public getLockoutState(): { isLocked: boolean; remainingSeconds: number; failedAttempts: number } {
    try {
      const raw = localStorage.getItem(LOCKOUT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const now = Date.now();
        if (parsed.lockedUntil && parsed.lockedUntil > now) {
          const remainingSeconds = Math.ceil((parsed.lockedUntil - now) / 1000);
          return {
            isLocked: true,
            remainingSeconds,
            failedAttempts: parsed.failedAttempts || MAX_FAILED_ATTEMPTS,
          };
        } else if (parsed.lockedUntil && parsed.lockedUntil <= now) {
          localStorage.removeItem(LOCKOUT_KEY);
        } else {
          return {
            isLocked: false,
            remainingSeconds: 0,
            failedAttempts: parsed.failedAttempts || 0,
          };
        }
      }
    } catch {
      // ignore
    }
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 0 };
  }

  private recordFailedAttempt(identifier: string): { isLocked: boolean; remainingSeconds: number; remainingAttempts: number } {
    let failedAttempts = 1;
    let lockedUntil: number | null = null;
    const now = Date.now();

    try {
      const raw = localStorage.getItem(LOCKOUT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        failedAttempts = (parsed.failedAttempts || 0) + 1;
      }
    } catch {
      failedAttempts = 1;
    }

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      lockedUntil = now + LOCKOUT_DURATION_MS;
    }

    localStorage.setItem(
      LOCKOUT_KEY,
      JSON.stringify({
        failedAttempts,
        lockedUntil,
        lastAttemptAt: new Date().toISOString(),
      })
    );

    this.logAudit({
      action: 'LOGIN_FAILED',
      details: `Failed authentication attempt for '${identifier}'. Failed count: ${failedAttempts}`,
    });

    const isLocked = !!lockedUntil;
    const remainingSeconds = isLocked ? Math.ceil(LOCKOUT_DURATION_MS / 1000) : 0;
    const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts);

    return { isLocked, remainingSeconds, remainingAttempts };
  }

  private clearFailedAttempts(): void {
    localStorage.removeItem(LOCKOUT_KEY);
  }

  public isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    return user !== null;
  }

  public getCurrentUser(): AdminUser | null {
    try {
      const localRaw = localStorage.getItem(SESSION_LOCAL_KEY);
      if (localRaw) {
        const session = JSON.parse(localRaw);
        if (session && session.user) {
          if (session.sessionExpiresAt && new Date(session.sessionExpiresAt).getTime() < Date.now()) {
            this.logout();
            return null;
          }
          return session.user;
        }
      }

      const sessionRaw = sessionStorage.getItem(SESSION_SESSION_KEY);
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session && session.user) {
          return session.user;
        }
      }
    } catch (e) {
      console.error('Failed to parse admin session:', e);
    }
    return null;
  }

  private updateActiveSession(user: AdminUser): void {
    const localRaw = localStorage.getItem(SESSION_LOCAL_KEY);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        parsed.user = user;
        localStorage.setItem(SESSION_LOCAL_KEY, JSON.stringify(parsed));
      } catch (e) {}
    }
    const sessionRaw = sessionStorage.getItem(SESSION_SESSION_KEY);
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw);
        parsed.user = user;
        sessionStorage.setItem(SESSION_SESSION_KEY, JSON.stringify(parsed));
      } catch (e) {}
    }
  }

  public login(
    identifier: string,
    passwordAttempt: string,
    rememberMe: boolean = true
  ): {
    success: boolean;
    message: string;
    user?: AdminUser;
    remainingAttempts?: number;
    lockoutSeconds?: number;
  } {
    const lockout = this.getLockoutState();
    if (lockout.isLocked) {
      return {
        success: false,
        message: `Account is temporarily locked due to consecutive failed attempts. Please retry in ${lockout.remainingSeconds}s.`,
        lockoutSeconds: lockout.remainingSeconds,
      };
    }

    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPassword = (passwordAttempt || '').trim();

    if (!cleanId || !cleanPassword) {
      return { success: false, message: 'Please enter both username/email and password.' };
    }

    const users = this.getAllUsers();
    const matchingUser = users.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId ||
        (cleanId === 'admin' && u.id === 'user_super_admin') ||
        (cleanId === 'admin@tripmytour.com' && u.id === 'user_super_admin')
    );

    if (!matchingUser || matchingUser.password !== cleanPassword) {
      const failInfo = this.recordFailedAttempt(identifier);
      if (failInfo.isLocked) {
        return {
          success: false,
          message: `Too many invalid attempts. Admin portal is locked for ${failInfo.remainingSeconds} seconds.`,
          lockoutSeconds: failInfo.remainingSeconds,
        };
      }
      return {
        success: false,
        message: `Invalid credentials. Please verify your username/email and password. (${failInfo.remainingAttempts} attempts remaining)`,
        remainingAttempts: failInfo.remainingAttempts,
      };
    }

    // Check if user is suspended / deactivated
    if (matchingUser.active === false) {
      return {
        success: false,
        message: 'This staff account has been deactivated or suspended by the Super Admin. Please contact operations management.',
      };
    }

    // Clear lockout on success
    this.clearFailedAttempts();

    const now = new Date().toISOString();
    const expiresAt = new Date(
      Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000)
    ).toISOString();

    // Update user's last login in records
    matchingUser.lastLoginAt = now;
    this.saveUsers(users);

    const sessionUser: AdminUser = {
      ...matchingUser,
      lastLoginAt: now,
      sessionExpiresAt: expiresAt,
    };
    // Ensure password is not in active session
    delete sessionUser.password;

    const sessionPayload = JSON.stringify({
      user: sessionUser,
      token: 'tmt_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      loginTimestamp: now,
      sessionExpiresAt: expiresAt,
      rememberMe,
    });

    if (rememberMe) {
      localStorage.setItem(SESSION_LOCAL_KEY, sessionPayload);
      sessionStorage.removeItem(SESSION_SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_SESSION_KEY, sessionPayload);
      localStorage.removeItem(SESSION_LOCAL_KEY);
    }

    this.logAudit({
      action: 'LOGIN_SUCCESS',
      details: `'${sessionUser.name}' (${sessionUser.role}) signed in successfully. Session validity: ${rememberMe ? '30 Days' : '12 Hours'}.`,
    });

    this.notify();

    return {
      success: true,
      message: `Welcome back, ${sessionUser.name}!`,
      user: sessionUser,
    };
  }

  public async loginAsync(
    identifier: string,
    passwordAttempt: string,
    rememberMe: boolean = true
  ): Promise<{
    success: boolean;
    message: string;
    user?: AdminUser;
    remainingAttempts?: number;
    lockoutSeconds?: number;
    validatedVia?: 'google_sheets_apps_script' | 'local_cache';
  }> {
    const lockout = this.getLockoutState();
    if (lockout.isLocked) {
      return {
        success: false,
        message: `Account is temporarily locked due to consecutive failed attempts. Please retry in ${lockout.remainingSeconds}s.`,
        lockoutSeconds: lockout.remainingSeconds,
      };
    }

    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPassword = (passwordAttempt || '').trim();

    if (!cleanId || !cleanPassword) {
      return { success: false, message: 'Please enter both username/email and password.' };
    }

    // Attempt live Google Apps Script validation against Staff_Users sheet
    const sheetsCfg = sheetsService.getConfig();
    const hasActiveSheets = !!sheetsCfg.webAppUrl && sheetsService.isValidWebAppUrl(sheetsCfg.webAppUrl);

    if (hasActiveSheets) {
      try {
        const valRes = await sheetsService.validateStaffWithAppsScript(cleanId, cleanPassword);

        if (valRes.success && valRes.user) {
          // Successfully validated directly against Google Sheets staff database!
          this.clearFailedAttempts();

          const remoteUser = valRes.user;
          let userPerms = remoteUser.permissions;
          if (typeof userPerms === 'string') {
            try {
              userPerms = JSON.parse(userPerms);
            } catch (e) {}
          }

          const now = new Date().toISOString();
          const expiresAt = new Date(
            Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000)
          ).toISOString();

          const sessionUser: AdminUser = {
            ...remoteUser,
            permissions: userPerms || DEFAULT_PERMISSIONS[remoteUser.role] || DEFAULT_PERMISSIONS['Lead Specialist'],
            lastLoginAt: now,
            sessionExpiresAt: expiresAt,
          };
          delete sessionUser.password;

          // Merge into local cache so future operations have the updated staff record
          const allUsers = this.getAllUsers();
          const existIdx = allUsers.findIndex(
            (u) =>
              u.id === sessionUser.id ||
              u.username.toLowerCase() === cleanId ||
              u.email.toLowerCase() === cleanId
          );
          if (existIdx >= 0) {
            allUsers[existIdx] = { ...allUsers[existIdx], ...sessionUser };
          } else {
            allUsers.push(sessionUser);
          }
          this.saveUsers(allUsers);

          const sessionPayload = JSON.stringify({
            user: sessionUser,
            token: 'tmt_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
            loginTimestamp: now,
            sessionExpiresAt: expiresAt,
            rememberMe,
            validatedVia: 'google_sheets_apps_script',
          });

          if (rememberMe) {
            localStorage.setItem(SESSION_LOCAL_KEY, sessionPayload);
            sessionStorage.removeItem(SESSION_SESSION_KEY);
          } else {
            sessionStorage.setItem(SESSION_SESSION_KEY, sessionPayload);
            localStorage.removeItem(SESSION_LOCAL_KEY);
          }

          this.logAudit({
            action: 'LOGIN_SUCCESS',
            details: `'${sessionUser.name}' (${sessionUser.role}) authenticated via Google Apps Script Staff_Users sheet.`,
          });

          this.notify();

          return {
            success: true,
            message: `Welcome back, ${sessionUser.name}! (Authenticated via Google Sheets Staff Database)`,
            user: sessionUser,
            validatedVia: 'google_sheets_apps_script',
          };
        } else if (
          valRes.error &&
          !valRes.error.includes('Failed to communicate') &&
          !valRes.error.includes('No active Google Apps Script')
        ) {
          // Explicit rejection from Google Apps Script (e.g., incorrect password or suspended in sheet)
          const failInfo = this.recordFailedAttempt(identifier);
          if (failInfo.isLocked) {
            return {
              success: false,
              message: `Too many invalid attempts. Admin portal is locked for ${failInfo.remainingSeconds} seconds.`,
              lockoutSeconds: failInfo.remainingSeconds,
            };
          }
          return {
            success: false,
            message: `${valRes.error} (${failInfo.remainingAttempts} attempts remaining)`,
            remainingAttempts: failInfo.remainingAttempts,
          };
        }
      } catch (err) {
        console.warn('Apps Script validation fallback to local cache:', err);
      }
    }

    // Local fallback when Google Sheets Web App is unreachable or offline
    const localRes = this.login(identifier, passwordAttempt, rememberMe);
    return {
      ...localRes,
      validatedVia: 'local_cache',
    };
  }

  public logout(): void {
    const user = this.getCurrentUser();
    localStorage.removeItem(SESSION_LOCAL_KEY);
    sessionStorage.removeItem(SESSION_SESSION_KEY);

    if (user) {
      this.logAudit({
        action: 'LOGOUT',
        details: `User '${user.name}' (${user.role}) logged out.`,
      });
    }

    this.notify();
  }

  public changePassword(
    currentPassword: string,
    newPassword: string
  ): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No active user session.' };

    const users = this.getAllUsers();
    const user = users.find((u) => u.id === currentUser.id);
    if (!user) return { success: false, message: 'User record not found.' };

    if (user.password !== currentPassword) {
      return { success: false, message: 'Current password does not match system records.' };
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: 'New password must be at least 4 characters long.' };
    }

    user.password = newPassword.trim();
    this.saveUsers(users);

    this.logAudit({
      action: 'PASSWORD_CHANGED',
      details: `Password changed for '${user.name}' (${user.username}).`,
    });

    return { success: true, message: 'Password updated successfully!' };
  }

  public updateProfile(
    name: string,
    email: string
  ): { success: boolean; message: string } {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No active session.' };

    return this.updateUser(currentUser.id, { name, email });
  }

  public resetToDefaults(): void {
    localStorage.removeItem(CREDENTIALS_KEY);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS_SEED));
    this.clearFailedAttempts();

    this.logAudit({
      action: 'CREDENTIALS_RESET',
      details: 'Staff users and permissions restored to system defaults.',
    });

    this.notify();
  }

  public getAuditLogs(): SecurityAuditLog[] {
    try {
      const raw = localStorage.getItem(AUDIT_LOGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [
      {
        id: 'audit_init',
        timestamp: new Date().toISOString(),
        action: 'LOGIN_SUCCESS',
        details: 'TripMyTour Role-Based Access Control & User Security System Initialized.',
      },
    ];
  }

  public clearAuditLogs(): void {
    localStorage.removeItem(AUDIT_LOGS_KEY);
    this.notify();
  }

  private logAudit(entry: Omit<SecurityAuditLog, 'id' | 'timestamp'>): void {
    try {
      const logs = this.getAuditLogs();
      const newEntry: SecurityAuditLog = {
        id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Client',
        ...entry,
      };
      const updated = [newEntry, ...logs].slice(0, 100);
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to log audit entry:', err);
    }
  }

  // =========================================================================
  // PERMISSION CHECK HELPERS
  // =========================================================================

  public isSuperAdmin(user: AdminUser | null): boolean {
    if (!user) return false;
    return user.role === 'Super Admin' || user.permissions?.userManagement?.manage === true;
  }

  public canView(user: AdminUser | null, module: keyof ModulePermissions): boolean {
    if (!user) return false;
    if (this.isSuperAdmin(user)) return true;
    const mod = user.permissions?.[module];
    if (!mod) return false;
    if ('view' in mod) return (mod as any).view;
    if ('manage' in mod) return (mod as any).manage;
    return false;
  }

  public canManage(user: AdminUser | null, module: keyof ModulePermissions): boolean {
    if (!user) return false;
    if (this.isSuperAdmin(user)) return true;
    const mod = user.permissions?.[module];
    if (!mod) return false;
    return (mod as any).manage === true;
  }

  public canManageLeadStatus(user: AdminUser | null): boolean {
    if (!user) return false;
    if (this.isSuperAdmin(user)) return true;
    return user.permissions?.leads?.manageStatus === true;
  }

  public canDeleteLeads(user: AdminUser | null): boolean {
    if (!user) return false;
    if (this.isSuperAdmin(user)) return true;
    return user.permissions?.leads?.delete === true;
  }
}

export const adminAuthService = new AdminAuthService();

