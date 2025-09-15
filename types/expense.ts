export interface Expense {
  id: string;
  date: string;
  merchant: string;
  category: ExpenseCategory;
  description: string;
  subtotal: number;
  tax: number;
  total: number;
  receiptUri?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 
  | 'office_supplies'
  | 'travel'
  | 'meals'
  | 'equipment'
  | 'utilities'
  | 'marketing'
  | 'professional_services'
  | 'insurance'
  | 'rent'
  | 'other';

export type PaymentMethod = 
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'check'
  | 'other';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals & Entertainment' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'marketing', label: 'Marketing & Advertising' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'rent', label: 'Rent' },
  { value: 'other', label: 'Other' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];