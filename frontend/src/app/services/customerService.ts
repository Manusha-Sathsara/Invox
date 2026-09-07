import type { Customer } from '../App'

// Primary API Gateway endpoint & Vite dev server proxy path
export const DIRECT_CUSTOMER_BASE_URL = 'https://localhost:8243/api/v1/test/customer/1.0.0'
export const PROXY_CUSTOMER_BASE_URL = '/api-gateway/api/v1/test/customer/1.0.0'

export interface CreateCustomerPayload {
  name: string
  email: string
  phone?: string
  country?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  currency?: string
  taxId?: string
  contactPerson?: string
  notes?: string
  tenantId?: string
  active?: boolean
}

export interface UpdateCustomerPayload {
  name?: string
  email?: string
  phone?: string
  country?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  currency?: string
  taxId?: string
  contactPerson?: string
  notes?: string
  tenantId?: string
  active?: boolean
}

/**
 * Decodes a JWT token payload without external libraries
 */
export function decodeJwtPayload(token: string): Record<string, any> | null {
  if (!token || typeof token !== 'string') return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(payloadBase64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch (_) {
    return null
  }
}

/**
 * Resolves the tenant ID / organization ID from:
 * 1. Explicit tenantId parameter
 * 2. Asgardeo Access Token JWT claims
 * 3. Asgardeo ID Token in sessionStorage
 * 4. Asgardeo session_data in sessionStorage
 */
export function resolveTenantId(token?: string, explicitTenantId?: string): string {
  if (
    explicitTenantId &&
    explicitTenantId.trim() &&
    explicitTenantId !== 'default-tenant' &&
    explicitTenantId !== 'default' &&
    explicitTenantId !== 'workspace'
  ) {
    return explicitTenantId.trim()
  }

  // Check token claims if token is a valid JWT
  if (token) {
    const claims = decodeJwtPayload(token)
    if (claims) {
      const extracted =
        claims.org_id ||
        claims.orgId ||
        claims.organization_id ||
        claims.tenant_id ||
        claims.tenantId ||
        claims.tenant_domain ||
        claims.user_org ||
        claims.ou ||
        (claims.iss && claims.iss.includes('/t/') ? claims.iss.split('/t/')[1].split('/')[0] : '')
      if (extracted && extracted !== 'default-tenant') {
        return String(extracted).trim()
      }
    }
  }

  // Inspect sessionStorage for Asgardeo tokens
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.includes('session_data') || key.includes('asgardeo'))) {
          const raw = sessionStorage.getItem(key)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed.id_token) {
              const idClaims = decodeJwtPayload(parsed.id_token)
              if (idClaims) {
                const extracted =
                  idClaims.org_id ||
                  idClaims.orgId ||
                  idClaims.organization_id ||
                  idClaims.tenant_id ||
                  idClaims.tenantId ||
                  idClaims.tenant_domain ||
                  idClaims.user_org ||
                  idClaims.ou ||
                  (idClaims.iss && idClaims.iss.includes('/t/')
                    ? idClaims.iss.split('/t/')[1].split('/')[0]
                    : '')
                if (extracted && extracted !== 'default-tenant') return String(extracted).trim()
              }
            }

            if (parsed.access_token) {
              const accessClaims = decodeJwtPayload(parsed.access_token)
              if (accessClaims) {
                const extracted =
                  accessClaims.org_id ||
                  accessClaims.orgId ||
                  accessClaims.organization_id ||
                  accessClaims.tenant_id ||
                  accessClaims.tenantId ||
                  accessClaims.tenant_domain ||
                  accessClaims.user_org ||
                  accessClaims.ou
                if (extracted && extracted !== 'default-tenant') return String(extracted).trim()
              }
            }

            if (parsed.tenant_domain && parsed.tenant_domain !== 'default-tenant') {
              return String(parsed.tenant_domain).trim()
            }
            if (parsed.org_id && parsed.org_id !== 'default-tenant') {
              return String(parsed.org_id).trim()
            }
          }
        }
      }
    } catch (_) {}

    try {
      const storedTenant = localStorage.getItem('invox_tenant_id')
      if (storedTenant && storedTenant !== 'default-tenant' && storedTenant !== 'workspace') {
        return storedTenant.trim()
      }
    } catch (_) {}
  }

  return explicitTenantId || ''
}

/**
 * Resolves the Asgardeo access token with robust fallbacks
 */
export async function getAsgardeoAccessToken(tokenParam?: string): Promise<string> {
  if (tokenParam && tokenParam.trim() && tokenParam !== 'demo_access_token') {
    return tokenParam.trim()
  }

  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.includes('session_data') || key.includes('asgardeo'))) {
          const raw = sessionStorage.getItem(key)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed.access_token) {
              return parsed.access_token
            }
          }
        }
      }
    } catch (_) {}

    try {
      const localToken =
        localStorage.getItem('asgardeo_access_token') ||
        localStorage.getItem('invox_access_token') ||
        localStorage.getItem('invox_token')
      if (localToken) return localToken
    } catch (_) {}
  }

  return tokenParam || ''
}

/**
 * Universal Request Dispatcher for Customer Service
 * Always forwards:
 * 1. Authorization: Bearer <token>
 * 2. X-Tenant-Id: <tenantId> (Used by Customer Service TenantContextFilter to scope DB operations)
 */
async function makeCustomerRequest(
  method: string,
  endpointPath: string,
  body?: any,
  token?: string,
  httpClient?: any,
  tenantId?: string
): Promise<any> {
  const cleanPath = endpointPath
    ? (endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`)
    : ''

  const isBrowser = typeof window !== 'undefined'
  const proxyUrl = `${PROXY_CUSTOMER_BASE_URL}${cleanPath}`
  const directUrl = `${DIRECT_CUSTOMER_BASE_URL}${cleanPath}`
  const targetUrl = isBrowser ? proxyUrl : directUrl

  const resolvedToken = await getAsgardeoAccessToken(token)
  const resolvedTenantId = resolveTenantId(resolvedToken, tenantId)

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (body) {
    headers['Content-Type'] = 'application/json'
  }
  if (resolvedToken) {
    headers['Authorization'] = `Bearer ${resolvedToken}`
  } else {
    console.warn('[CustomerService] Warning: No Asgardeo access token available for request.')
  }

  // Attach X-Tenant-Id header for multitenancy
  if (resolvedTenantId) {
    headers['X-Tenant-Id'] = resolvedTenantId
    headers['X-Tenant-ID'] = resolvedTenantId
    console.info(`[CustomerService] Dispatching ${method} with X-Tenant-Id: ${resolvedTenantId}`)
  } else {
    console.warn('[CustomerService] Warning: No tenant ID found. Backend may default to default-tenant.')
  }

  // 1. Dispatch via fetch to proxy (handles SSL cert bypass on localhost:8243)
  try {
    const res = await fetch(targetUrl, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    if (!res.ok) {
      const errText = await res.text()
      let parsedErr: any = null
      try {
        parsedErr = JSON.parse(errText)
      } catch (_) {}

      const errMsg =
        parsedErr?.description ||
        parsedErr?.message ||
        parsedErr?.error_description ||
        errText ||
        res.statusText
      console.error(`[CustomerService] ${method} ${targetUrl} failed (${res.status}):`, errMsg)
      throw new Error(`HTTP ${res.status}: ${errMsg}`)
    }

    if (res.status === 204) return null
    const text = await res.text()
    return text ? JSON.parse(text) : null
  } catch (fetchErr: any) {
    // If proxy failed with network error, attempt directUrl or httpClient fallback
    if (isBrowser && targetUrl === proxyUrl) {
      try {
        if (httpClient) {
          const config = { headers }
          if (method.toUpperCase() === 'GET') {
            const res = await httpClient.get(directUrl, config)
            return res.data
          } else if (method.toUpperCase() === 'POST') {
            const res = await httpClient.post(directUrl, body || {}, config)
            return res.data
          } else if (method.toUpperCase() === 'PUT') {
            const res = await httpClient.put(directUrl, body || {}, config)
            return res.data
          } else if (method.toUpperCase() === 'DELETE') {
            const res = await httpClient.delete(directUrl, config)
            return res.data
          }
        }

        const directRes = await fetch(directUrl, {
          method,
          headers,
          ...(body ? { body: JSON.stringify(body) } : {}),
        })
        if (!directRes.ok) {
          const errText = await directRes.text()
          throw new Error(`HTTP ${directRes.status}: ${errText || directRes.statusText}`)
        }
        if (directRes.status === 204) return null
        const text = await directRes.text()
        return text ? JSON.parse(text) : null
      } catch (_) {
        // preserve original error
      }
    }
    throw fetchErr
  }
}

/**
 * 1. Get All Customers (Scoped by X-Tenant-Id)
 * GET https://localhost:8243/api/v1/test/customer/1.0.0/
 */
export async function fetchCustomersFromBackend(
  token?: string,
  httpClient?: any,
  tenantId?: string
): Promise<Customer[]> {
  try {
    const data = await makeCustomerRequest('GET', '', undefined, token, httpClient, tenantId)
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.content)) return data.content
    if (data && Array.isArray(data.customers)) return data.customers
    return []
  } catch (err: any) {
    // Retry with trailing slash if WSO2 gateway routing requires it
    try {
      const data = await makeCustomerRequest('GET', '/', undefined, token, httpClient, tenantId)
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.content)) return data.content
      return []
    } catch (_) {
      throw err
    }
  }
}

/**
 * 2. Get Customer by ID (Scoped by X-Tenant-Id)
 * GET https://localhost:8243/api/v1/test/customer/1.0.0/{id}
 */
export async function fetchCustomerByIdFromBackend(
  id: string,
  token?: string,
  httpClient?: any,
  tenantId?: string
): Promise<Customer> {
  return await makeCustomerRequest('GET', `/${id}`, undefined, token, httpClient, tenantId)
}

/**
 * 3. Create Customer (Scoped by X-Tenant-Id)
 * POST https://localhost:8243/api/v1/test/customer/1.0.0
 * The backend reads the tenant ID from the X-Tenant-Id header and saves it with the customer.
 */
export async function createCustomerInBackend(
  customerData: CreateCustomerPayload,
  token?: string,
  httpClient?: any,
  tenantId?: string
): Promise<Customer> {
  const resolvedTenant = resolveTenantId(token, tenantId || customerData.tenantId)

  const payload: any = {
    name: customerData.name.trim(),
    email: customerData.email.trim(),
  }
  if (resolvedTenant) payload.tenantId = resolvedTenant
  if (customerData.phone) payload.phone = customerData.phone.trim()
  if (customerData.country) payload.country = customerData.country.trim()
  if (customerData.addressLine1) payload.addressLine1 = customerData.addressLine1.trim()
  if (customerData.addressLine2) payload.addressLine2 = customerData.addressLine2.trim()
  if (customerData.city) payload.city = customerData.city.trim()
  if (customerData.state) payload.state = customerData.state.trim()
  if (customerData.postalCode) payload.postalCode = customerData.postalCode.trim()
  if (customerData.currency) payload.currency = customerData.currency.trim()
  if (customerData.taxId) payload.taxId = customerData.taxId.trim()
  if (customerData.contactPerson) payload.contactPerson = customerData.contactPerson.trim()
  if (customerData.notes) payload.notes = customerData.notes.trim()
  if (customerData.active !== undefined) payload.active = customerData.active

  return await makeCustomerRequest('POST', '', payload, token, httpClient, resolvedTenant)
}

/**
 * 4. Update Customer (Scoped by X-Tenant-Id)
 * PUT https://localhost:8243/api/v1/test/customer/1.0.0/{id}
 */
export async function updateCustomerInBackend(
  id: string,
  customerData: UpdateCustomerPayload,
  token?: string,
  httpClient?: any,
  tenantId?: string
): Promise<Customer> {
  const resolvedTenant = resolveTenantId(token, tenantId || customerData.tenantId)

  const payload: any = {}
  if (customerData.name !== undefined) payload.name = customerData.name.trim()
  if (customerData.email !== undefined) payload.email = customerData.email.trim()
  if (customerData.phone !== undefined) payload.phone = customerData.phone.trim()
  if (customerData.country !== undefined) payload.country = customerData.country.trim()
  if (customerData.addressLine1 !== undefined) payload.addressLine1 = customerData.addressLine1.trim()
  if (customerData.addressLine2 !== undefined) payload.addressLine2 = customerData.addressLine2.trim()
  if (customerData.city !== undefined) payload.city = customerData.city.trim()
  if (customerData.state !== undefined) payload.state = customerData.state.trim()
  if (customerData.postalCode !== undefined) payload.postalCode = customerData.postalCode.trim()
  if (customerData.currency !== undefined) payload.currency = customerData.currency.trim()
  if (customerData.taxId !== undefined) payload.taxId = customerData.taxId.trim()
  if (customerData.contactPerson !== undefined) payload.contactPerson = customerData.contactPerson.trim()
  if (customerData.notes !== undefined) payload.notes = customerData.notes.trim()
  if (customerData.active !== undefined) payload.active = customerData.active

  return await makeCustomerRequest('PUT', `/${id}`, payload, token, httpClient, resolvedTenant)
}

/**
 * 5. Delete Customer (Scoped by X-Tenant-Id)
 * DELETE https://localhost:8243/api/v1/test/customer/1.0.0/{id}
 */
export async function deleteCustomerInBackend(
  id: string,
  token?: string,
  httpClient?: any,
  tenantId?: string
): Promise<boolean> {
  try {
    await makeCustomerRequest('DELETE', `/${id}`, undefined, token, httpClient, tenantId)
    return true
  } catch (err: any) {
    try {
      await makeCustomerRequest('DELETE', `/api/v1/customers/${id}`, undefined, token, httpClient, tenantId)
      return true
    } catch (fallbackErr) {
      throw err
    }
  }
}
