import { AdminUser, SecurityAuditLog } from '../types';

const CREDENTIALS_KEY = 'tripmytour_admin_credentials';
const SESSION_LOCAL_KEY = 'tripmytour_admin_session';
const SESSION_SESSION_KEY = 'tripmytour_admin_session_transient';
const LOCKOUT_KEY = 'tripmytour_admin_lockout';
const AUDIT_LOGS_KEY = 'tripmytour_admin_audit_logs';

const DEFAULT_ADMIN = {
  username: 'admin',
  email: 'admin@tripmytour.com',
  password: 'admin',
  alternatePassword: 'admin123',
  name: 'Operations Lead',
  role: 'Super Admin' as const,
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds

class AdminAuthService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initDefaults();
  }

  private initDefaults(): void {
    if (!localStorage.getItem(CREDENTIALS_KEY)) {
      localStorage.setItem(
        CREDENTIALS_KEY,
        JSON.stringify({
          username: DEFAULT_ADMIN.username,
          email: DEFAULT_ADMIN.email,
          password: DEFAULT_ADMIN.password,
          alternatePassword: DEFAULT_ADMIN.alternatePassword,
          name: DEFAULT_ADMIN.name,
          role: DEFAULT_ADMIN.role,
        })
      );
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

  private getStoredCredentials() {
    try {
      const raw = localStorage.getItem(CREDENTIALS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return DEFAULT_ADMIN;
  }

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
          // Lockout period expired
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
      // Check localStorage first (remember me)
      const localRaw = localStorage.getItem(SESSION_LOCAL_KEY);
      if (localRaw) {
        const session = JSON.parse(localRaw);
        if (session && session.user) {
          // Check expiration if any
          if (session.sessionExpiresAt && new Date(session.sessionExpiresAt).getTime() < Date.now()) {
            this.logout();
            return null;
          }
          return session.user;
        }
      }

      // Check sessionStorage (transient session)
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

    const creds = this.getStoredCredentials();
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPassword = (passwordAttempt || '').trim();

    const isIdMatch =
      cleanId === creds.username.toLowerCase() ||
      cleanId === creds.email.toLowerCase() ||
      cleanId === 'admin' ||
      cleanId === 'admin@tripmytour.com';

    const isPasswordMatch =
      cleanPassword === creds.password ||
      (creds.alternatePassword && cleanPassword === creds.alternatePassword);

    if (!isIdMatch || !isPasswordMatch) {
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
        message: `Invalid credentials. Please verify username/email and password. (${failInfo.remainingAttempts} attempts remaining)`,
        remainingAttempts: failInfo.remainingAttempts,
      };
    }

    // Success! Clear lockout
    this.clearFailedAttempts();

    const now = new Date().toISOString();
    // 30 days if rememberMe, otherwise 12 hours
    const expiresAt = new Date(
      Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000)
    ).toISOString();

    const user: AdminUser = {
      id: 'admin_primary',
      email: creds.email,
      username: creds.username,
      name: creds.name || 'TripMyTour Administrator',
      role: creds.role || 'Super Admin',
      lastLoginAt: now,
      sessionExpiresAt: expiresAt,
    };

    const sessionPayload = JSON.stringify({
      user,
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
      details: `Administrator '${user.name}' signed in successfully. Session validity: ${rememberMe ? '30 Days' : '12 Hours'}.`,
    });

    this.notify();

    return {
      success: true,
      message: `Welcome back, ${user.name}!`,
      user,
    };
  }

  public logout(): void {
    const user = this.getCurrentUser();
    localStorage.removeItem(SESSION_LOCAL_KEY);
    sessionStorage.removeItem(SESSION_SESSION_KEY);

    if (user) {
      this.logAudit({
        action: 'LOGOUT',
        details: `Administrator '${user.name}' logged out.`,
      });
    }

    this.notify();
  }

  public changePassword(
    currentPassword: string,
    newPassword: string
  ): { success: boolean; message: string } {
    const creds = this.getStoredCredentials();

    if (
      currentPassword !== creds.password &&
      currentPassword !== creds.alternatePassword
    ) {
      return { success: false, message: 'Current password does not match existing records.' };
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: 'New password must be at least 4 characters long.' };
    }

    const updated = {
      ...creds,
      password: newPassword.trim(),
      alternatePassword: '', // clear fallback once customized
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updated));

    this.logAudit({
      action: 'PASSWORD_CHANGED',
      details: 'Administrator password was changed successfully.',
    });

    this.notify();
    return { success: true, message: 'Password updated successfully!' };
  }

  public updateProfile(
    name: string,
    email: string
  ): { success: boolean; message: string } {
    const creds = this.getStoredCredentials();
    const updated = {
      ...creds,
      name: (name || creds.name).trim(),
      email: (email || creds.email).trim().toLowerCase(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updated));

    // Update active session user if currently logged in
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      currentUser.name = updated.name;
      currentUser.email = updated.email;

      const raw = localStorage.getItem(SESSION_LOCAL_KEY) || sessionStorage.getItem(SESSION_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.user = currentUser;
        if (localStorage.getItem(SESSION_LOCAL_KEY)) {
          localStorage.setItem(SESSION_LOCAL_KEY, JSON.stringify(parsed));
        } else {
          sessionStorage.setItem(SESSION_SESSION_KEY, JSON.stringify(parsed));
        }
      }
    }

    this.logAudit({
      action: 'PROFILE_UPDATED',
      details: `Admin profile details updated: ${updated.name} (${updated.email}).`,
    });

    this.notify();
    return { success: true, message: 'Admin profile updated successfully!' };
  }

  public resetToDefaults(): void {
    localStorage.setItem(
      CREDENTIALS_KEY,
      JSON.stringify({
        username: DEFAULT_ADMIN.username,
        email: DEFAULT_ADMIN.email,
        password: DEFAULT_ADMIN.password,
        alternatePassword: DEFAULT_ADMIN.alternatePassword,
        name: DEFAULT_ADMIN.name,
        role: DEFAULT_ADMIN.role,
      })
    );
    this.clearFailedAttempts();

    this.logAudit({
      action: 'CREDENTIALS_RESET',
      details: 'Admin credentials restored to system defaults (admin / admin).',
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
        details: 'Admin Security Firewall initialized for TripMyTour portal.',
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
      // Keep up to 100 recent entries
      const updated = [newEntry, ...logs].slice(0, 100);
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to log audit entry:', err);
    }
  }

  public getDefaultCredentialsHint() {
    const creds = this.getStoredCredentials();
    return {
      username: creds.username,
      email: creds.email,
      passwordHint: creds.password === DEFAULT_ADMIN.password ? 'admin' : '••••••••',
    };
  }
}

export const adminAuthService = new AdminAuthService();
