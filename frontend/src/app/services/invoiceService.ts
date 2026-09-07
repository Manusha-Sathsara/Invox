// Primary API Gateway endpoint for Invoice Service & Vite dev server proxy path
export const DIRECT_INVOICE_BASE_URL = 'https://localhost:8243/api/invoices/1.0.0'
export const PROXY_INVOICE_BASE_URL = '/api-gateway/api/invoices/1.0.0'

export interface InvoiceItemPayload {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

export interface InvoicePayload {
  id?: string
  number?: string
  invoiceNumber?: string
  customerId?: string
  customerName: string
  customerEmail: string
  creatorEmail?: string
  status?: string
  issueDate?: string
  dueDate?: string
  notes?: string
  currency?: string
  subtotal?: number
  taxTotal?: number
  grandTotal?: number
  items: InvoiceItemPayload[]
}

/**
 * Universal Request Dispatcher
 * Dispatches via Asgardeo Axios httpClient or native fetch with Vite dev proxy fallback
 */
async function makeRequest(
  method: string,
  endpointPath: string,
  body?: any,
  token?: string,
  httpClient?: any,
  isBlob: boolean = false,
  tenantId?: string
): Promise<any> {
  const cleanPath = endpointPath ? (endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`) : ''
  const directUrl = `${DIRECT_INVOICE_BASE_URL}${cleanPath}`
  const proxyUrl = `${PROXY_INVOICE_BASE_URL}${cleanPath}`

  const headers: Record<string, string> = {
    Accept: isBlob ? 'application/pdf, application/octet-stream, */*' : 'application/json',
  }
  if (!isBlob && body) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (tenantId && tenantId.trim() && tenantId !== 'default-tenant' && tenantId !== 'workspace') {
    headers['X-Tenant-Id'] = tenantId.trim()
    headers['X-Tenant-ID'] = tenantId.trim()
  }

  // 1. Attempt using Asgardeo getHttpClient() instance
  if (httpClient) {
    const config = {
      headers,
      ...(isBlob ? { responseType: 'blob' as const } : {}),
    }

    try {
      if (method.toUpperCase() === 'GET') {
        const res = await httpClient.get(directUrl, config)
        return res.data
      } else if (method.toUpperCase() === 'POST') {
        const res = await httpClient.post(directUrl, body || {}, config)
        return res.data
      }
    } catch (err: any) {
      console.warn(`[InvoiceService] Direct httpClient call to ${directUrl} failed, trying dev proxy:`, err)
      try {
        if (method.toUpperCase() === 'GET') {
          const res = await httpClient.get(proxyUrl, config)
          return res.data
        } else if (method.toUpperCase() === 'POST') {
          const res = await httpClient.post(proxyUrl, body || {}, config)
          return res.data
        }
      } catch (proxyErr: any) {
        console.error(`[InvoiceService] Both direct and proxy httpClient calls failed:`, proxyErr)
        throw proxyErr
      }
    }
  }

  // 2. Fetch fallback if httpClient is not provided
  try {
    const res = await fetch(directUrl, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`HTTP ${res.status}: ${errText || res.statusText}`)
    }

    if (isBlob) {
      return await res.blob()
    }
    return await res.json()
  } catch (directFetchErr: any) {
    console.warn(`[InvoiceService] Direct fetch failed to ${directUrl}, attempting proxy...`, directFetchErr)
    const proxyRes = await fetch(proxyUrl, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    if (!proxyRes.ok) {
      const errText = await proxyRes.text()
      throw new Error(`HTTP ${proxyRes.status}: ${errText || proxyRes.statusText}`)
    }

    if (isBlob) {
      return await proxyRes.blob()
    }
    return await proxyRes.json()
  }
}

/**
 * Calculates subtotal, taxTotal, and grandTotal from line items
 */
export function calculateInvoiceTotals(items: InvoiceItemPayload[]) {
  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
  const taxTotal = items.reduce((sum, it) => {
    const lineSub = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
    return sum + (lineSub * (Number(it.taxRate) || 0)) / 100
  }, 0)
  const grandTotal = subtotal + taxTotal
  return { subtotal, taxTotal, grandTotal }
}

/**
 * Fetch all invoices from backend
 * GET https://localhost:8243/api/invoices/1.0.0
 */
export async function fetchInvoicesFromBackend(token?: string, httpClient?: any, tenantId?: string): Promise<any[]> {
  try {
    const data = await makeRequest('GET', '', undefined, token, httpClient, false, tenantId)
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.content)) return data.content
    if (data && Array.isArray(data.invoices)) return data.invoices
    return []
  } catch (err) {
    // Retry with /api/invoices path in case WSO2 gateway is mapped with full resource subpath
    try {
      const data = await makeRequest('GET', '/api/invoices', undefined, token, httpClient, false, tenantId)
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.content)) return data.content
      return []
    } catch (fallbackErr) {
      throw err
    }
  }
}

/**
 * Fetch a single invoice by ID
 * GET https://localhost:8243/api/invoices/1.0.0/{id}
 */
export async function fetchInvoiceByIdFromBackend(id: string, token?: string, httpClient?: any): Promise<any> {
  return await makeRequest('GET', `/${id}`, undefined, token, httpClient)
}

/**
 * Create and Send a new invoice
 * POST https://localhost:8243/api/invoices/1.0.0
 * The backend saves the invoice, sets status to SENT, renders HTML to PDF, and emails the customer.
 */
export async function createAndSendInvoiceInBackend(
  invoiceData: InvoicePayload,
  token?: string,
  httpClient?: any
): Promise<any> {
  const { subtotal, taxTotal, grandTotal } = calculateInvoiceTotals(invoiceData.items || [])

  const payload = {
    number: invoiceData.number || invoiceData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
    customerId: invoiceData.customerId || '1',
    customerName: invoiceData.customerName,
    customerEmail: invoiceData.customerEmail,
    creatorEmail: invoiceData.creatorEmail,
    status: invoiceData.status || 'SENT',
    issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
    dueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0],
    notes: invoiceData.notes || '',
    currency: invoiceData.currency || 'USD',
    subtotal: invoiceData.subtotal !== undefined ? invoiceData.subtotal : subtotal,
    taxTotal: invoiceData.taxTotal !== undefined ? invoiceData.taxTotal : taxTotal,
    grandTotal: invoiceData.grandTotal !== undefined ? invoiceData.grandTotal : grandTotal,
    items: (invoiceData.items || []).map((it) => ({
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || 0,
      taxRate: Number(it.taxRate) || 0,
    })),
  }

  return await makeRequest('POST', '', payload, token, httpClient)
}

/**
 * Send an existing invoice
 * POST https://localhost:8243/api/invoices/1.0.0/{id}/send
 */
export async function sendExistingInvoiceInBackend(id: string, token?: string, httpClient?: any): Promise<any> {
  try {
    return await makeRequest('POST', `/${id}/send`, {}, token, httpClient)
  } catch (err) {
    // If /{id}/send isn't mapped, try /send or fallback
    return await makeRequest('POST', `/send/${id}`, {}, token, httpClient)
  }
}

/**
 * Mark an invoice as PAID
 * POST https://localhost:8243/api/invoices/1.0.0/{id}/pay
 */
export async function payInvoiceInBackend(id: string, token?: string, httpClient?: any): Promise<any> {
  return await makeRequest('POST', `/${id}/pay`, {}, token, httpClient)
}

/**
 * Download Invoice PDF
 * GET https://localhost:8243/api/invoices/1.0.0/{id}/pdf
 */
export async function downloadInvoicePdfFromBackend(
  id: string,
  invoiceNumber: string = 'invoice',
  token?: string,
  httpClient?: any
): Promise<void> {
  const blob = await makeRequest('GET', `/${id}/pdf`, undefined, token, httpClient, true)
  const blobInstance = blob instanceof Blob ? blob : new Blob([blob], { type: 'application/pdf' })

  const blobUrl = window.URL.createObjectURL(blobInstance)
  const link = document.createElement('a')
  link.href = blobUrl
  link.setAttribute('download', `${invoiceNumber.replace(/\s+/g, '_')}.pdf`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}
