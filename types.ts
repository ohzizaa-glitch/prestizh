
import { LucideIcon } from 'lucide-react';

export interface ServiceVariant {
  id: string;
  label: string;
  description?: string;
  price?: number; // Индивидуальная цена для варианта
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit?: string;
  isVariablePrice?: boolean;
  hasVariants?: boolean; // Флаг включения селектора
  variants?: ServiceVariant[]; // Список специфичных вариантов для товара
  isPriceEditable?: boolean; // Флаг ручного ввода цены
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
  date: string; // ISO string
  issueDate?: string; // ISO string
  timestamp: number;
  items: {
    name: string;
    variant?: string;
    price: number;
    quantity: number;
    total: number;
    categoryId?: string;
  }[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
}
