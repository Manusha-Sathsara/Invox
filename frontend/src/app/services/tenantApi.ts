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
        // use default error message
      }
      throw new Error(errorMsg);
    }

    return res.json();
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

  async inviteUser(payload: UserInvitePayload, token?: string): Promise<TenantUserResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
        // use default error message
      }
      throw new Error(errorMsg);
    }

    return res.json();
  },

  async getTenantUsers(token?: string): Promise<TenantUserResponse[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/tenants/users`, { headers });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  }
};
