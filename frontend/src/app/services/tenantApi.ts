import { API_BASE_URL } from '../config/asgardeoConfig';

export interface TenantRegisterPayload {
  companyName: string;
  subdomain: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPassword?: string;
}

export interface TenantResponse {
  id: string;
  companyName: string;
  subdomain: string;
  asgardeoOrgId: string;
  asgardeoOrgHandle: string;
  status: string;
  plan: string;
  adminEmail: string;
  loginUrl?: string;
  createdAt?: string;
}

export interface UserInvitePayload {
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMINISTRATOR' | 'ACCOUNTANT' | 'VIEWER';
}

export interface UserUpdatePayload {
  firstName?: string;
  lastName?: string;
  role?: 'ADMINISTRATOR' | 'ACCOUNTANT' | 'VIEWER';
  active?: boolean;
}

export interface TenantUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
  createdAt?: string;
}

export const tenantApi = {
  async checkSubdomain(subdomain: string): Promise<boolean> {
    if (!subdomain || subdomain.trim().length === 0) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/tenants/check-subdomain/${encodeURIComponent(subdomain.trim().toLowerCase())}`);
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.available);
    } catch {
      return false;
    }
  },

  async registerTenant(payload: TenantRegisterPayload): Promise<TenantResponse> {
    const res = await fetch(`${API_BASE_URL}/tenants/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        subdomain: payload.subdomain.trim().toLowerCase(),
      }),
    });

    if (!res.ok) {
      let errorMsg = 'Tenant registration failed';
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorMsg;
      } catch {
        // fallback
      }
      throw new Error(errorMsg);
    }

    return res.json();
  },

  async getTenantBySubdomain(subdomain: string): Promise<TenantResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/tenants/by-subdomain/${encodeURIComponent(subdomain.trim().toLowerCase())}`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async getPublicTenants(): Promise<TenantResponse[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/tenants/public-list`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async inviteUser(payload: UserInvitePayload, token?: string, tenantId?: string): Promise<TenantUserResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const res = await fetch(`${API_BASE_URL}/tenants/users/invite`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMsg = 'Failed to send invitation';
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorMsg;
      } catch {
        // fallback
      }
      throw new Error(errorMsg);
    }

    return res.json();
  },

  async getTenantUsers(token?: string, tenantId?: string): Promise<TenantUserResponse[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/tenants/users`, { headers });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async updateUser(userId: string, payload: UserUpdatePayload, token?: string, tenantId?: string): Promise<TenantUserResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const res = await fetch(`${API_BASE_URL}/tenants/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Failed to update user');
    }
    return res.json();
  },

  async toggleUserStatus(userId: string, active: boolean, token?: string, tenantId?: string): Promise<TenantUserResponse> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const res = await fetch(`${API_BASE_URL}/tenants/users/${userId}/status?active=${active}`, {
      method: 'PATCH',
      headers,
    });

    if (!res.ok) {
      throw new Error('Failed to change user status');
    }
    return res.json();
  },

  async removeUser(userId: string, token?: string, tenantId?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const res = await fetch(`${API_BASE_URL}/tenants/users/${userId}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      throw new Error('Failed to remove user');
    }
  }
};
