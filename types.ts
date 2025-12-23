import { LucideIcon } from 'lucide-react';

export interface ServiceVariant {
  id: string;
  label: string;
  description?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit?: string;
  isVariablePrice?: boolean;
  hasVariants?: boolean; // Flag to enable variant selector
  isPriceEditable?: boolean; // Flag to allow manual price entry
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
  date: string; // ISO string
  timestamp: number;
  items: {
    name: string;
    variant?: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
}