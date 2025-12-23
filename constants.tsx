
import { 
  Camera, 
  Scissors, 
  Printer, 
  Save, 
  Smartphone, 
  Video, 
  Image as ImageIcon,
  Package
} from 'lucide-react';
import { ServiceCategory, ServiceVariant } from './types';

export interface PhotoSpecs extends ServiceVariant {
  widthMm: number;
  heightMm: number;
  faceHeightMin: number;
  faceHeightMax: number;
  topMarginMin: number;
  topMarginMax: number;
  isGrayscale?: boolean;
  cornerSide?: 'left' | 'right';
}

export const DIGITAL_CATEGORY_IDS = ['docs', 'processing', 'scanning', 'transfer_files', 'transfer_data', 'video'];

export const PHOTO_VARIANTS: PhotoSpecs[] = [
  { id: '3x4', label: '3 × 4 см (Стандарт)', widthMm: 30, heightMm: 40, faceHeightMin: 21, faceHeightMax: 26, topMarginMin: 2, topMarginMax: 4 },
  { id: '3x4_left', label: '3 × 4 см (Минусинск)', widthMm: 30, heightMm: 40, faceHeightMin: 21, faceHeightMax: 26, topMarginMin: 2, topMarginMax: 4, cornerSide: 'left' },
  { id: '3x4_right', label: '3 × 4 см (Абакан)', widthMm: 30, heightMm: 40, faceHeightMin: 21, faceHeightMax: 26, topMarginMin: 2, topMarginMax: 4, cornerSide: 'right' },
  { id: '3.5x4.5_rf', label: '35 × 45 мм (Паспорт РФ)', widthMm: 35, heightMm: 45, faceHeightMin: 32.7, faceHeightMax: 33, topMarginMin: 4.7, topMarginMax: 5 },
  { id: '3.5x4.5_old', label: '35 × 45 мм (Загран)', widthMm: 35, heightMm: 45, faceHeightMin: 28, faceHeightMax: 28, topMarginMin: 2, topMarginMax: 2 },
  { id: '2.5x3.5_mil', label: '2,5 × 3,5 см (Военный)', widthMm: 25, heightMm: 35, faceHeightMin: 24, faceHeightMax: 26, topMarginMin: 2, topMarginMax: 4, isGrayscale: true },
  { id: '4x6', label: '4 × 6 см (Личное дело)', widthMm: 40, heightMm: 60, faceHeightMin: 22, faceHeightMax: 36, topMarginMin: 8, topMarginMax: 10 },
  { id: '9x12', label: '9 × 12 см (Личное дело)', widthMm: 90, heightMm: 120, faceHeightMin: 50, faceHeightMax: 55, topMarginMin: 10, topMarginMax: 10 }
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'docs',
    title: 'Фото на документы',
    icon: Camera,
    items: [
      { id: 'doc_photo', name: 'Фото на документы', price: 350, unit: 'комплект', hasVariants: true },
      { id: 'doc_copy', name: 'Дополнительный комплект', price: 70, unit: 'комплект', hasVariants: true },
      { id: 'doc_retouch', name: 'Ретушь фото', price: 50, unit: 'услуга' },
    ],
  },
  {
    id: 'processing',
    title: 'Обработка фото',
    icon: Scissors,
    items: [
      { id: 'crop', name: 'Кадрирование', price: 20, unit: 'фото' },
      { id: 'resize', name: 'Изменение размера', price: 50, unit: 'фото' },
      { id: 'enhance', name: 'Улучшение качества', price: 200, unit: 'фото' },
      { id: 'bg_change', name: 'Замена фона', price: 250, unit: 'фото' },
      { id: 'restoration', name: 'Реставрация', price: 200, unit: 'фото', isVariablePrice: true },
    ],
  },
  {
    id: 'goods',
    title: 'Товары',
    icon: Package,
    items: [
      { 
        id: 'goods_flash', 
        name: 'Флешки', 
        price: 700, 
        unit: 'шт', 
        hasVariants: true,
        variants: [
          { id: '32gb', label: '32 ГБ', price: 700 },
          { id: '64gb', label: '64 ГБ', price: 800 }
        ]
      },
      { id: 'goods_frames', name: 'Рамки', price: 0, unit: 'шт', isPriceEditable: true },
      { id: 'goods_albums', name: 'Фотоальбомы', price: 0, unit: 'шт', isPriceEditable: true },
      { id: 'goods_multifora', name: 'Мультифора', price: 4, unit: 'шт' },
      { id: 'goods_bag', name: 'Пакет', price: 5, unit: 'шт' },
    ],
  },
  {
    id: 'scanning',
    title: 'Сканирование',
    icon: Printer,
    items: [
      { id: 'scan_doc', name: 'Сканирование документов', price: 20, unit: 'скан' },
      { id: 'scan_film', name: 'Сканирование плёнки', price: 5, unit: 'кадр' },
    ],
  },
  {
    id: 'transfer_files',
    title: 'Запись и передача',
    icon: Save,
    items: [
      { id: 'write_flash', name: 'Запись на флэшку', price: 50, unit: 'файл' },
      { id: 'send_email', name: 'Отправка на email', price: 50, unit: 'файл' },
    ],
  },
  {
    id: 'video',
    title: 'Видео и кассеты',
    icon: Video,
    items: [
      { id: 'digitize_vhs', name: 'Оцифровка VHS', price: 4, unit: 'мин' },
    ],
  },
];

export const PRINTING_CATEGORY: ServiceCategory = {
  id: 'printing',
  title: 'Печать фотографий',
  icon: ImageIcon,
  items: [
    { id: 'print_10x15', name: 'Печать 10 x 15', price: 20, unit: 'шт' },
    { id: 'print_15x20', name: 'Печать 15 x 20', price: 40, unit: 'шт' },
    { id: 'print_20x30', name: 'Печать 20 x 30', price: 80, unit: 'шт' },
  ]
};
