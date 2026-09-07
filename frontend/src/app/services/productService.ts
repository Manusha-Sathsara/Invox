import type { Product } from '../App'

// Primary API Gateway endpoint & Vite dev server proxy path
export const DIRECT_PRODUCT_BASE_URL = 'https://localhost:8243/invox/product/1.0.0'
export const PROXY_PRODUCT_BASE_URL = '/api-gateway/invox/product/1.0.0'

export interface CreateProductPayload {
  name: string
  unitPrice: number
  description?: string
  sku?: string
  currency?: string
  taxRate?: number
  unitOfMeasure?: string
  tenantId?: string
}

export interface UpdateProductPayload {
  name?: string
  unitPrice?: number
  description?: string
  sku?: string
  currency?: string
  taxRate?: number
  unitOfMeasure?: string
  tenantId?: string
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
 * Universal Request Dispatcher for Product Service
 * Always forwards:
 * 1. Authorization: Bearer <token>
 * 2. X-Tenant-Id: <tenantId> (Used by Product Service TenantContextFilter to scope DB operations)
 */
async function makeProductRequest(
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
  const proxyUrl = `${PROXY_PRODUCT_BASE_URL}${cleanPath}`
  const directUrl = `${DIRECT_PRODUCT_BASE_URL}${cleanPath}`
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
    console.warn('[ProductService] Warning: No Asgardeo access token available for request.')
  }

  // Attach X-Tenant-Id header for multitenancy
  if (resolvedTenantId) {
    headers['X-Tenant-Id'] = resolvedTenantId
    headers['X-Tenant-ID'] = resolvedTenantId
    console.info(`[ProductService] Dispatching ${method} with X-Tenant-Id: ${resolvedTenantId}`)
  } else {
    console.warn('[ProductService] Warning: No tenant ID found. Backend may default to default-tenant.')
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
      console.error(`[ProductService] ${method} ${targetUrl} failed (${res.status}):`, errMsg)
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
 * 1. Get All Products (Scoped by X-Tenant-Id)
 * GET https://localhost:8243/invox/product/1.0.0/
 */
export async function fetchProductsFromBackend(
  token?: string,
  httpClient?: any,
  tenantId?: string
): Promise<Product[]> {
  try {
    const data = await makeProductRequest('GET', '', undefined, token, httpClient, tenantId)
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.content)) return data.content
    if (data && Array.isArray(data.products)) return data.products
    return []
  } catch (err: any) {
    // Retry with trailing slash if WSO2 gateway routing requires it
    try {
      const data = await makeProductRequest('GET', '/', undefined, token, httpClient, tenantId)
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.content)) return data.content
      return []
    } catch (_) {
      throw err
    }
  }
}

/**
 * 2. Get Product by ID (Scoped by X-Tenant-Id)
 * GET https://localhost:8243/invox/product/1.0.0/{id}
 */
export async function fetchProductByIdFromBackend(
  id: string,
  token?: string,
  httpClient?: any,
  tenantId?: string
): Promise<Product> {
  return await makeProductRequest('GET', `/${id}`, undefined, token, httpClient, tenantId)
}

/**
 * 3. Create Product (Scoped by X-Tenant-Id)
 * POST https://localhost:8243/invox/product/1.0.0
 * The backend reads the tenant ID from the X-Tenant-Id header and saves it with the product.
 */
export async function createProductInBackend(
  productData: CreateProductPayload,
  token?: string,
  httpClient?: any,
  tenantId?: string
): Promise<Product> {
  const resolvedTenant = resolveTenantId(token, tenantId || productData.tenantId)

  const payload: any = {
    name: productData.name.trim(),
    unitPrice: Number(productData.unitPrice) >= 0 ? Number(productData.unitPrice) : 0,
  }
  if (resolvedTenant) payload.tenantId = resolvedTenant
  if (productData.description) payload.description = productData.description.trim()
  if (productData.sku) payload.sku = productData.sku.trim().toUpperCase()
  if (productData.currency) payload.currency = productData.currency
  if (productData.taxRate !== undefined && productData.taxRate !== null && !isNaN(Number(productData.taxRate))) {
    payload.taxRate = Number(productData.taxRate)
  }
  if (productData.unitOfMeasure) payload.unitOfMeasure = productData.unitOfMeasure

  return await makeProductRequest('POST', '', payload, token, httpClient, resolvedTenant)
}

/**
 * 4. Update Product (Scoped by X-Tenant-Id)
 * PUT https://localhost:8243/invox/product/1.0.0/{id}
 */
export async function updateProductInBackend(
  id: string,
  productData: UpdateProductPayload,
  token?: string,
  httpClient?: any,
  tenantId?: string
): Promise<Product> {
  const resolvedTenant = resolveTenantId(token, tenantId || productData.tenantId)

  const payload: any = {}
  if (productData.name !== undefined) payload.name = productData.name.trim()
  if (productData.unitPrice !== undefined) payload.unitPrice = Number(productData.unitPrice)
  if (productData.description !== undefined) payload.description = productData.description.trim()
  if (productData.sku !== undefined) payload.sku = productData.sku.trim().toUpperCase()
  if (productData.currency !== undefined) payload.currency = productData.currency
  if (productData.taxRate !== undefined && !isNaN(Number(productData.taxRate))) {
    payload.taxRate = Number(productData.taxRate)
  }
  if (productData.unitOfMeasure !== undefined) payload.unitOfMeasure = productData.unitOfMeasure

  return await makeProductRequest('PUT', `/${id}`, payload, token, httpClient, resolvedTenant)
}

/**
 * 5. Delete Product (Scoped by X-Tenant-Id)
 * DELETE /api/v1/products/{id} or DELETE base/{id}
 */
export async function deleteProductInBackend(
  id: string,
  token?: string,
  httpClient?: any,
  tenantId?: string
): Promise<boolean> {
  try {
    await makeProductRequest('DELETE', `/${id}`, undefined, token, httpClient, tenantId)
    return true
  } catch (err: any) {
    try {
      await makeProductRequest('DELETE', `/api/v1/products/${id}`, undefined, token, httpClient, tenantId)
      return true
    } catch (fallbackErr) {
      throw err
    }
  }
}
