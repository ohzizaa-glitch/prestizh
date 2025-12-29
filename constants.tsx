
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
  { 
    id: '3x4', 
    label: '3 × 4 см (Стандарт)', 
    description: 'Медкнижка, Пропуск, РОХа',
    widthMm: 30,
    heightMm: 40,
    faceHeightMin: 21,
    faceHeightMax: 26,
    topMarginMin: 2,
    topMarginMax: 4
  },
  { 
    id: '3x4_left', 
    label: '3 × 4 см (Минусинск)', 
    description: 'Левый уголок (Тракторные права)',
    widthMm: 30,
    heightMm: 40,
    faceHeightMin: 21,
    faceHeightMax: 26,
    topMarginMin: 2,
    topMarginMax: 4,
    cornerSide: 'left'
  },
  { 
    id: '3x4_right', 
    label: '3 × 4 см (Абакан)', 
    description: 'Правый уголок (Тракторные права)',
    widthMm: 30,
    heightMm: 40,
    faceHeightMin: 21,
    faceHeightMax: 26,
    topMarginMin: 2,
    topMarginMax: 4,
    cornerSide: 'right'
  },
  { 
    id: '3.5x4.5_rf', 
    label: '35 × 45 мм (Паспорт РФ / Новый загран)', 
    description: 'Шенген, Карта водителя, Тахограф',
    widthMm: 35,
    heightMm: 45,
    faceHeightMin: 32.7,
    faceHeightMax: 33,
    topMarginMin: 4.7,
    topMarginMax: 5
  },
  { 
    id: '3.5x4.5_old', 
    label: '35 × 45 мм (Загран 5 лет)', 
    description: 'Старый образец загранпаспорта',
    widthMm: 35,
    heightMm: 45,
    faceHeightMin: 28,
    faceHeightMax: 28,
    topMarginMin: 2,
    topMarginMax: 2
  },
  { 
    id: '2.5x3.5_mil', 
    label: '2,5 × 3,5 см (Военный)', 
    description: 'Военный билет (Ч/Б)',
    widthMm: 25,
    heightMm: 35,
    faceHeightMin: 24,
    faceHeightMax: 26,
    topMarginMin: 2,
    topMarginMax: 4,
    isGrayscale: true
  },
  { 
    id: '4x6', 
    label: '4 × 6 см (Личное дело)', 
    description: 'Лицензия охранника',
    widthMm: 40,
    heightMm: 60,
    faceHeightMin: 22,
    faceHeightMax: 36,
    topMarginMin: 8,
    topMarginMax: 10
  },
  { 
    id: '9x12', 
    label: '9 × 12 см (Личное дело)', 
    description: 'Для личного дела в ведомствах',
    widthMm: 90,
    heightMm: 120,
    faceHeightMin: 50,
    faceHeightMax: 55,
    topMarginMin: 10,
    topMarginMax: 10
  }
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'docs',
    title: 'Фото на документы',
    icon: Camera,
    items: [
      { id: 'doc_photo', name: 'Фото на документы', price: 350, unit: 'комплект', hasVariants: true },
      { id: 'doc_copy', name: 'Дополнительный комплект фото', price: 70, unit: 'комплект', hasVariants: true },
      { id: 'doc_retouch', name: 'Ретушь фото на документы', price: 50, unit: 'услуга' },
    ],
  },
  {
    id: 'processing',
    title: 'Обработка фото',
    icon: Scissors,
    items: [
      { id: 'crop', name: 'Кадрирование', price: 20, unit: 'фото' },
      { id: 'resize', name: 'Изменение размера', price: 50, unit: 'фото' },
      { id: 'convert', name: 'Конвертация в формат для печати', price: 10, unit: 'фото' },
      { id: 'enhance', name: 'Улучшение качества фото', price: 200, unit: 'фото' },
      { id: 'clothes', name: 'Замена одежды', price: 200, unit: 'фото' },
      { id: 'bg_change', name: 'Замена фона', price: 250, unit: 'фото' },
      { id: 'obj_remove', name: 'Удаление объекта', price: 100, unit: 'объект', isVariablePrice: true },
      { id: 'montage', name: 'Фотомонтаж', price: 400, unit: 'фото', isVariablePrice: true },
      { id: 'restoration', name: 'Ретушь / реставрация', price: 200, unit: 'фото', isVariablePrice: true },
      { id: 'colorization', name: 'Колоризация (ч/б в цвет)', price: 400, unit: 'фото', isVariablePrice: true },
      { id: 'text', name: 'Добавление надписи', price: 30, unit: 'строка' },
    ],
  },
  {
    id: 'goods',
    title: 'Товары',
    icon: Package,
    items: [
      { id: 'goods_frames', name: 'Рамки', price: 0, unit: 'шт', isPriceEditable: true },
      { id: 'goods_albums', name: 'Фотоальбомы', price: 0, unit: 'шт', isPriceEditable: true },
      { id: 'goods_flash', name: 'Флеш-карта', price: 0, unit: 'шт', isPriceEditable: true },
      { id: 'goods_batteries', name: 'Батарейки', price: 0, unit: 'шт', isPriceEditable: true },
      { id: 'goods_multifora', name: 'Мультифора', price: 4, unit: 'шт' },
      { id: 'goods_bag', name: 'Пакет', price: 5, unit: 'шт' },
    ],
  },
  {
    id: 'scanning',
    title: 'Сканирование',
    icon: Printer,
    items: [
      { id: 'scan_doc', name: 'Сканирование фото/документов', price: 20, unit: 'скан' },
      { id: 'scan_film_all', name: 'Сканирование плёнки (всё подряд)', price: 5, unit: 'кадр' },
      { id: 'scan_film_select', name: 'Сканирование плёнки (выборочно)', price: 20, unit: 'кадр' },
    ],
  },
  {
    id: 'transfer_files',
    title: 'Запись и передача файлов',
    icon: Save,
    items: [
      { id: 'write_flash', name: 'Запись файла на флэш-карту', price: 50, unit: 'файл' },
      { id: 'send_email', name: 'Отправка на email', price: 50, unit: 'файл' },
      { id: 'write_disc', name: 'Запись на диск', price: 200, unit: 'диск' },
      { id: 'rewrite_flash_disc', name: 'Перезапись с флэш-карты на диск', price: 150, unit: 'диск' },
    ],
  },
  {
    id: 'transfer_data',
    title: 'Перезапись данных',
    icon: Smartphone,
    items: [
      { id: 'phone_to_flash_sm', name: 'С телефона на флэш (до 1 Gb)', price: 100, unit: 'услуга' },
      { id: 'phone_to_flash_lg', name: 'С телефона на флэш (свыше 1 Gb)', price: 150, unit: 'услуга' },
      { id: 'flash_to_flash_sm', name: 'С флэш на флэш (до 4 Gb)', price: 100, unit: 'услуга' },
      { id: 'flash_to_flash_lg', name: 'С флэш на флэш (свыше 4 Gb)', price: 150, unit: 'услуга' },
    ],
  },
  {
    id: 'video',
    title: 'Видео и кассеты',
    icon: Video,
    items: [
      { id: 'digitize_vhs', name: 'Оцифровка видеокассет', price: 4, unit: 'мин' },
      { id: 'convert_video', name: 'Конвертация видео и запись', price: 250, unit: 'услуга' },
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
