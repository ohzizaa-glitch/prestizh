import { LucideIcon } from 'lucide-react';

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit?: string; // e.g., "шт", "мин", "кадр"
  isVariablePrice?: boolean; // If true, display "от"
}

export interface ServiceCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  items: ServiceItem[];
}

export interface CartItem extends ServiceItem {
  quantity: number;
}
