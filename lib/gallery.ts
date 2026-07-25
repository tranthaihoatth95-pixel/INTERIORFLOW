'use client';

import { newImgId } from '@/lib/img-id';

export interface GalleryItem {
  id: string;
  name: string;
  url: string;
  savedAt: number;
}

const KEY = 'interiorflow.gallery.v1';

export function listGallery(): GalleryItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as GalleryItem[];
  } catch {
    return [];
  }
}

export function saveToGallery(item: Omit<GalleryItem, 'id' | 'savedAt'>): GalleryItem {
  const entry: GalleryItem = {
    ...item,
    // Task #19: id ảnh chuẩn `img_…` (nguồn chân lý lib/img-id.ts), độc lập URL/tên file.
    // Backward-compat: entry cũ trong localStorage mang id `asset_…` vẫn list/remove được (id là khoá thuần).
    id: newImgId(),
    savedAt: Date.now(),
  };
  const items = [entry, ...listGallery()].slice(0, 200);
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    throw new Error('Gallery đầy (localStorage quota) — xoá bớt asset cũ.');
  }
  // báo panel refresh
  window.dispatchEvent(new CustomEvent('interiorflow:gallery'));
  return entry;
}

export function removeFromGallery(id: string) {
  localStorage.setItem(KEY, JSON.stringify(listGallery().filter((i) => i.id !== id)));
  window.dispatchEvent(new CustomEvent('interiorflow:gallery'));
}
