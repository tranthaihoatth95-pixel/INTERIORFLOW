import { Cloud, FileArchive, FileCode2, FileImage, FileSpreadsheet, FileText, FileVideo, GitBranch, HardDrive, Lock, NotebookText, Palette, Ruler, type LucideIcon } from 'lucide-react';
import type { FmFileKind, FmSource } from '@/lib/filemanager/types';

export const SOURCE_ICON: Record<FmSource, LucideIcon> = {
  local: HardDrive,
  drive: Cloud,
  notion: NotebookText,
  git: GitBranch,
};

export const KIND_ICON: Record<FmFileKind, LucideIcon> = {
  idf: FileCode2,
  image: FileImage,
  cad: Ruler,
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
  video: FileVideo,
  material: Palette,
  archive: FileArchive,
  other: FileText,
};

export { Lock };
