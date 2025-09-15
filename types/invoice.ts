export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Attachment {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  paidAt?: string;
}