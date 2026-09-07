import { RouterProvider } from 'react-router'
import { router } from './routes'

// ─── Shared types ───────────────────────────────────────────────────────────

export type ViewType =
  | 'landing' | 'login' | 'register'
  | 'dashboard' | 'invoices' | 'invoice-editor'
  | 'customers' | 'products' | 'settings'

export type UserRole = 'Admin' | 'Accountant' | 'Viewer'

export interface Tenant {
  id: string
  name: string
  plan: string
  initials: string
  color: string
  slug: string
  adminEmail?: string
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  initials: string
}

export interface Customer {
  id: string
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
  totalInvoiced?: number
  outstanding?: number
  createdAt?: string
  updatedAt?: string
}

export interface Product {
  id: string
  name: string
  description?: string
  sku?: string
  unitPrice: number
  currency?: string
  taxRate?: number
  unitOfMeasure?: string
  tenantId?: string
  active?: boolean
  createdAt?: string
  updatedAt?: string
  // Legacy fallback fields for backwards compatibility
  price?: number
  unit?: string
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue'

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

export interface Invoice {
  id: string
  number: string
  customerId: string
  customerName: string
  customerEmail?: string
  creatorEmail?: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  notes?: string
  currency?: string
  subtotal?: number
  taxTotal?: number
  grandTotal?: number
  items: LineItem[]
  createdAt?: string
  updatedAt?: string
}

// ─── App entry ───────────────────────────────────────────────────────────────

export default function App() {
  return <RouterProvider router={router} />
}
