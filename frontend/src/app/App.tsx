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
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  initials: string
}

// ─── Static data ─────────────────────────────────────────────────────────────

export const TENANTS: Tenant[] = [
  { id: '1', name: 'Acme Corp',        plan: 'Pro',        initials: 'AC', color: '#6366f1', slug: 'acme'        },
  { id: '2', name: 'TechStart Inc',    plan: 'Starter',    initials: 'TS', color: '#8b5cf6', slug: 'techstart'   },
  { id: '3', name: 'Global Trade Ltd', plan: 'Enterprise', initials: 'GT', color: '#0ea5e9', slug: 'globaltrade'  },
]

export const APP_USERS: Record<UserRole, AppUser> = {
  Admin:      { id: '1', name: 'Alex Morgan', email: 'alex@acme.com',  role: 'Admin',      initials: 'AM' },
  Accountant: { id: '2', name: 'Jamie Lee',   email: 'jamie@acme.com', role: 'Accountant', initials: 'JL' },
  Viewer:     { id: '3', name: 'Sam Chen',    email: 'sam@acme.com',   role: 'Viewer',     initials: 'SC' },
}

export const CUSTOMERS = [
  { id: '1', name: 'Stripe Inc',    email: 'billing@stripe.com',  phone: '+1 415 123 4567', totalInvoiced: 45200, outstanding: 0,    country: 'USA'    },
  { id: '2', name: 'Vercel Corp',   email: 'finance@vercel.com',  phone: '+1 650 234 5678', totalInvoiced: 28750, outstanding: 5500, country: 'USA'    },
  { id: '3', name: 'Linear Labs',   email: 'accounts@linear.app', phone: '+1 628 345 6789', totalInvoiced: 18300, outstanding: 3200, country: 'Canada' },
  { id: '4', name: 'Notion HQ',     email: 'billing@notion.so',   phone: '+1 415 456 7890', totalInvoiced: 32100, outstanding: 8900, country: 'USA'    },
  { id: '5', name: 'Figma Corp',    email: 'ap@figma.com',        phone: '+1 415 567 8901', totalInvoiced: 52400, outstanding: 0,    country: 'USA'    },
  { id: '6', name: 'Loom Tech',     email: 'finance@loom.com',    phone: '+44 20 1234 5678',totalInvoiced: 14800, outstanding: 0,    country: 'UK'     },
  { id: '7', name: 'Webflow Inc',   email: 'billing@webflow.com', phone: '+1 888 987 6543', totalInvoiced: 9600,  outstanding: 0,    country: 'USA'    },
]

export const PRODUCTS = [
  { id: '1', name: 'Web Design Services',   description: 'Full-stack UI/UX and web design',    price: 1500, unit: 'project', taxRate: 10 },
  { id: '2', name: 'Monthly Retainer',      description: 'Ongoing monthly support',             price: 3000, unit: 'month',   taxRate: 10 },
  { id: '3', name: 'SEO Optimization',      description: 'Full SEO audit and optimization',     price: 800,  unit: 'month',   taxRate: 10 },
  { id: '4', name: 'Development Hours',     description: 'Custom development work',             price: 150,  unit: 'hour',    taxRate: 10 },
  { id: '5', name: 'Consulting Session',    description: 'Strategy and consulting calls',       price: 350,  unit: 'hour',    taxRate: 0  },
  { id: '6', name: 'Brand Identity Package',description: 'Logo, colors, typography system',     price: 2200, unit: 'project', taxRate: 10 },
]

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
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  items: LineItem[]
  notes: string
}

export const INVOICES: Invoice[] = [
  {
    id: '1', number: 'INV-2024-001', customerId: '5', customerName: 'Figma Corp',
    status: 'Paid', issueDate: '2024-01-05', dueDate: '2024-02-05',
    items: [
      { id: '1', description: 'Web Design Services',   quantity: 4, unitPrice: 1500, taxRate: 10 },
      { id: '2', description: 'Brand Identity Package', quantity: 1, unitPrice: 2200, taxRate: 10 },
    ], notes: 'Thank you for your business!',
  },
  {
    id: '2', number: 'INV-2024-002', customerId: '2', customerName: 'Vercel Corp',
    status: 'Sent', issueDate: '2024-01-15', dueDate: '2024-02-15',
    items: [
      { id: '1', description: 'Monthly Retainer',  quantity: 1,  unitPrice: 3000, taxRate: 10 },
      { id: '2', description: 'Development Hours', quantity: 16, unitPrice: 150,  taxRate: 10 },
    ], notes: '',
  },
  {
    id: '3', number: 'INV-2023-098', customerId: '3', customerName: 'Linear Labs',
    status: 'Overdue', issueDate: '2023-12-01', dueDate: '2024-01-01',
    items: [
      { id: '1', description: 'SEO Optimization', quantity: 4, unitPrice: 800, taxRate: 10 },
    ], notes: 'Payment is overdue.',
  },
  {
    id: '4', number: 'INV-2024-003', customerId: '4', customerName: 'Notion HQ',
    status: 'Draft', issueDate: '2024-01-20', dueDate: '2024-02-20',
    items: [
      { id: '1', description: 'Consulting Session', quantity: 8,  unitPrice: 350, taxRate: 0  },
      { id: '2', description: 'Development Hours',  quantity: 20, unitPrice: 150, taxRate: 10 },
    ], notes: 'Draft for review before sending.',
  },
  {
    id: '5', number: 'INV-2024-004', customerId: '1', customerName: 'Stripe Inc',
    status: 'Paid', issueDate: '2024-01-10', dueDate: '2024-02-10',
    items: [
      { id: '1', description: 'Monthly Retainer',      quantity: 2, unitPrice: 3000, taxRate: 10 },
      { id: '2', description: 'Brand Identity Package', quantity: 1, unitPrice: 2200, taxRate: 10 },
    ], notes: '',
  },
  {
    id: '6', number: 'INV-2024-005', customerId: '6', customerName: 'Loom Tech',
    status: 'Sent', issueDate: '2024-01-22', dueDate: '2024-02-22',
    items: [
      { id: '1', description: 'Web Design Services', quantity: 1, unitPrice: 1500, taxRate: 10 },
      { id: '2', description: 'SEO Optimization',    quantity: 2, unitPrice: 800,  taxRate: 10 },
    ], notes: '',
  },
]

// ─── App entry ───────────────────────────────────────────────────────────────

export default function App() {
  return <RouterProvider router={router} />
}
