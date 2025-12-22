import { 
  Camera, 
  Scissors, 
  Printer, 
  Save, 
  Smartphone, 
  Video, 
  Image as ImageIcon 
} from 'lucide-react';
import { ServiceCategory } from './types';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'docs',
    title: 'Фото на документы',
    icon: Camera,
    items: [
      { id: 'doc_photo', name: 'Фото на документы', price: 350, unit: 'комплект' },
      { id: 'doc_copy', name: 'Дополнительный комплект фото', price: 70, unit: 'комплект' },
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
