
import { LucideIcon } from 'lucide-react';

export interface ServiceVariant {
  id: string;
  label: string;
  description?: string;
  // Added optional price property to allow variants to have specific prices in calculations
  price?: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit?: string;
  isVariablePrice?: boolean;
  hasVariants?: boolean; // Flag to enable variant selector
  isPriceEditable?: boolean; // Flag to allow manual price entry
  // Added optional variants property to allow specific services to define their own variant list
  variants?: ServiceVariant[];
}

export interface ServiceCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  items: ServiceItem[];
}

export interface CartItem extends ServiceItem {
  quantity: number;
  variantId?: string;
  variantLabel?: string;
}

export type PaymentMethod = 'cash' | 'card';

export interface Order {
  id: string;
  receiptNumber?: string;
  date: string; // ISO string (Order date)
  issueDate?: string; // ISO string (Delivery date)
  timestamp: number;
  items: {
    name: string;
    variant?: string;
    price: number;
    quantity: number;
    total: number;
    categoryId?: string; // To distinguish digital services later
  }[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  // New flags for checklist
  isPrinted?: boolean; // Физический чек (ККМ)
  isRecorded?: boolean; // Запись в тетрадь
}
