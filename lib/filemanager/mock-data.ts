// lib/filemanager/mock-data.ts — cây thư mục + file mock, theo đúng cây SPEC-FILE-MANAGER §3.
// matId trùng với lib/library/mock-data.ts (W-102/S-044/P-070) — cùng 1 ATLAS, 2 mặt tiền.

import type { FmFile, FmFolder } from './types';

const C = {
  ok: '#3fb984',
  logic: '#4a90e2',
  mood: '#e8804d',
  master: '#6a57f5',
  comment: '#e86a9a',
  warn: '#e0a43a',
};

export const FM_COLLABORATORS = [
  { id: 'u-an', name: 'KTS. An' },
  { id: 'u-binh', name: 'KTS. Bình' },
  { id: 'u-chi', name: 'KTS. Chi' },
  { id: 'u-atlas', name: 'ATLAS' },
];

export const FM_FOLDERS: FmFolder[] = [
  // roots
  { id: 'root-projects', parentId: null, name: 'Projects', root: 'projects', permission: 'rw' },
  { id: 'root-library', parentId: null, name: 'Library', root: 'library', permission: 'rw' },
  { id: 'root-knowledge', parentId: null, name: 'Knowledge', root: 'knowledge', permission: 'ro' },
  { id: 'root-system', parentId: null, name: '_System', root: 'system', permission: 'locked' },
  { id: 'root-backups', parentId: null, name: '_Backups', root: 'backups', permission: 'ro' },

  // Projects/2026-07 Nord Villa/*
  {
    id: 'proj-nord',
    parentId: 'root-projects',
    name: '2026-07 Nord Villa',
    root: 'projects',
    permission: 'rw',
    collaboratorIds: ['u-an', 'u-binh'],
  },
  { id: 'nord-input', parentId: 'proj-nord', name: '01-input', root: 'projects', permission: 'rw' },
  { id: 'nord-cad', parentId: 'proj-nord', name: '02-cad', root: 'projects', permission: 'rw' },
  { id: 'nord-render', parentId: 'proj-nord', name: '03-render', root: 'projects', permission: 'rw', source: 'local' },
  { id: 'nord-present', parentId: 'proj-nord', name: '04-present', root: 'projects', permission: 'rw' },
  { id: 'nord-output', parentId: 'proj-nord', name: '05-output', root: 'projects', permission: 'rw' },
  { id: 'nord-archive', parentId: 'proj-nord', name: '_archive', root: 'projects', permission: 'rw' },

  // Projects/2026-06 Riverside Office — dự án 2, đồng bộ Drive (icon nguồn khác local)
  {
    id: 'proj-riverside',
    parentId: 'root-projects',
    name: '2026-06 Riverside Office',
    root: 'projects',
    permission: 'rw',
    collaboratorIds: ['u-chi'],
    source: 'drive',
  },
  { id: 'riverside-input', parentId: 'proj-riverside', name: '01-input', root: 'projects', permission: 'rw', source: 'drive' },

  // Library/*
  { id: 'lib-materials', parentId: 'root-library', name: 'Materials', root: 'library', permission: 'rw' },
  { id: 'lib-blocks', parentId: 'root-library', name: 'Blocks', root: 'library', permission: 'rw' },
  { id: 'lib-templates', parentId: 'root-library', name: 'Templates', root: 'library', permission: 'rw' },
  { id: 'lib-images', parentId: 'root-library', name: 'Images', root: 'library', permission: 'rw' },
  { id: 'lib-fonts', parentId: 'root-library', name: 'Fonts', root: 'library', permission: 'rw' },
];

export const FM_FILES: FmFile[] = [
  // proj-nord root
  {
    id: 'f-nord-idf',
    folderId: 'proj-nord',
    name: 'Nord Villa.idf',
    ext: 'idf',
    kind: 'idf',
    sizeBytes: 18_400_000,
    addedById: 'u-an',
    addedByName: 'KTS. An',
    source: 'local',
    lifecycle: 'chinh_thuc',
    description: 'File nguồn dự án — nhấp đúp mở thẳng app.',
  },
  // 01-input — CỐ TÌNH RỖNG, demo empty state (ref #6)

  // 02-cad
  {
    id: 'f-nord-cad-1',
    folderId: 'nord-cad',
    name: 'Nord-mattang-tang1-v3.dwg',
    ext: 'dwg',
    kind: 'cad',
    sizeBytes: 4_200_000,
    addedById: 'u-an',
    addedByName: 'KTS. An',
    source: 'local',
    lifecycle: 'chinh_thuc',
    description: 'Mặt bằng tầng 1, bản v3 — đã duyệt.',
  },
  {
    id: 'f-nord-cad-2',
    folderId: 'nord-cad',
    name: 'Nord-mattang-tang2-v1.dwg',
    ext: 'dwg',
    kind: 'cad',
    sizeBytes: 3_800_000,
    addedById: 'u-binh',
    addedByName: 'KTS. Bình',
    source: 'local',
    lifecycle: 'nhap',
    description: 'Mặt bằng tầng 2, đang vẽ.',
  },

  // 03-render
  {
    id: 'f-nord-render-1',
    folderId: 'nord-render',
    name: 'Nord-phongkhach-v3.jpg',
    ext: 'jpg',
    kind: 'image',
    sizeBytes: 6_100_000,
    addedById: 'u-binh',
    addedByName: 'KTS. Bình',
    source: 'local',
    lifecycle: 'chinh_thuc',
    thumbnail: [C.mood, C.warn],
    description: 'Render phòng khách, góc chính — v3 đã chốt.',
  },
  {
    id: 'f-nord-render-2',
    folderId: 'nord-render',
    name: 'Nord-bep-v2.jpg',
    ext: 'jpg',
    kind: 'image',
    sizeBytes: 5_400_000,
    addedById: 'u-binh',
    addedByName: 'KTS. Bình',
    source: 'local',
    lifecycle: 'nhap',
    thumbnail: [C.mood, C.ok],
    description: 'Render bếp, đang chờ duyệt ánh sáng.',
  },

  // 04-present
  {
    id: 'f-nord-present-1',
    folderId: 'nord-present',
    name: 'Nord-Deck-concept.ifpres',
    ext: 'ifpres',
    kind: 'doc',
    sizeBytes: 2_300_000,
    addedById: 'u-an',
    addedByName: 'KTS. An',
    source: 'local',
    lifecycle: 'nhap',
    description: 'Deck concept đang dựng trong Present.',
  },

  // 05-output
  {
    id: 'f-nord-output-1',
    folderId: 'nord-output',
    name: 'Nord-Villa-Deck.pptx',
    ext: 'pptx',
    kind: 'doc',
    sizeBytes: 34_000_000,
    addedById: 'u-an',
    addedByName: 'KTS. An',
    source: 'local',
    lifecycle: 'chinh_thuc',
    description: 'Deck xuất bản, gửi khách.',
  },
  {
    id: 'f-nord-output-2',
    folderId: 'nord-output',
    name: 'Nord-Villa-Presentation.pdf',
    ext: 'pdf',
    kind: 'pdf',
    sizeBytes: 21_000_000,
    addedById: 'u-an',
    addedByName: 'KTS. An',
    source: 'local',
    lifecycle: 'chinh_thuc',
    description: 'Bản PDF 300dpi A3 để in.',
  },

  // _archive
  {
    id: 'f-nord-archive-1',
    folderId: 'nord-archive',
    name: 'Nord-mattang-tang1-v1.dwg',
    ext: 'dwg',
    kind: 'cad',
    sizeBytes: 3_900_000,
    addedById: 'u-an',
    addedByName: 'KTS. An',
    source: 'local',
    lifecycle: 'luu_tru',
    description: 'Bản nháp đầu tiên — lưu trữ tham khảo.',
  },
  {
    id: 'f-nord-archive-2',
    folderId: 'nord-archive',
    name: 'Nord-mattang-tang1-v2.dwg',
    ext: 'dwg',
    kind: 'cad',
    sizeBytes: 4_000_000,
    addedById: 'u-binh',
    addedByName: 'KTS. Bình',
    source: 'local',
    lifecycle: 'luu_tru',
    description: 'Bản sửa lần 2 — lưu trữ tham khảo.',
  },

  // riverside-input — Drive-synced project, khác nguồn
  {
    id: 'f-riverside-input-1',
    folderId: 'riverside-input',
    name: 'brief-khach.pdf',
    ext: 'pdf',
    kind: 'pdf',
    sizeBytes: 1_800_000,
    addedById: 'u-chi',
    addedByName: 'KTS. Chi',
    source: 'drive',
    lifecycle: 'chinh_thuc',
    description: 'Brief khách hàng, đồng bộ từ Drive.',
  },

  // Library/Materials — matId trùng Thư viện
  {
    id: 'f-mat-1',
    folderId: 'lib-materials',
    name: 'W-102-go-oc-cho.mat',
    ext: 'mat',
    kind: 'material',
    sizeBytes: 820_000,
    addedById: 'u-atlas',
    addedByName: 'ATLAS',
    source: 'local',
    lifecycle: 'chinh_thuc',
    thumbnail: [C.warn, C.mood],
    description: 'Gỗ óc chó vân dọc — dùng chung V-Ray/D5/IF.',
    matId: 'W-102',
    brand: 'Timber & Co.',
    price: '1.850.000đ/m²',
  },
  {
    id: 'f-mat-2',
    folderId: 'lib-materials',
    name: 'S-044-travertine.mat',
    ext: 'mat',
    kind: 'material',
    sizeBytes: 760_000,
    addedById: 'u-atlas',
    addedByName: 'ATLAS',
    source: 'local',
    lifecycle: 'chinh_thuc',
    thumbnail: [C.logic, C.ok],
    description: 'Đá travertine be sáng.',
    matId: 'S-044',
    brand: 'StoneHouse',
    price: '980.000đ/m²',
  },
  {
    id: 'f-mat-3',
    folderId: 'lib-materials',
    name: 'P-070-son-xanh-reu.mat',
    ext: 'mat',
    kind: 'material',
    sizeBytes: 210_000,
    addedById: 'u-atlas',
    addedByName: 'ATLAS',
    source: 'local',
    lifecycle: 'chinh_thuc',
    thumbnail: [C.ok, C.comment],
    description: 'Sơn nội thất xanh rêu mờ.',
    matId: 'P-070',
    brand: 'ColorLab',
    price: '420.000đ/lít',
  },

  // Library/Blocks
  {
    id: 'f-block-1',
    folderId: 'lib-blocks',
    name: 'cua-2-canh-900.dwg',
    ext: 'dwg',
    kind: 'cad',
    sizeBytes: 90_000,
    addedById: 'u-an',
    addedByName: 'KTS. An',
    source: 'local',
    lifecycle: 'chinh_thuc',
    description: 'Block cửa 2 cánh 900 — dùng chung.',
  },

  // Library/Templates
  {
    id: 'f-tpl-1',
    folderId: 'lib-templates',
    name: 'Master-page-bien-toi-gian.ifpres',
    ext: 'ifpres',
    kind: 'doc',
    sizeBytes: 1_100_000,
    addedById: 'u-binh',
    addedByName: 'KTS. Bình',
    source: 'local',
    lifecycle: 'chinh_thuc',
    description: 'Master page trắng, biên rộng.',
  },
];
