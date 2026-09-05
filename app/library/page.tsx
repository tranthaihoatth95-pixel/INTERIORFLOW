'use client';

import { AppShell } from '@/components/studio/AppShell';
import { MasterLibrarySurface } from '@/components/library/MasterLibrarySurface';

export default function MasterLibraryPage() {
  return <AppShell active="home"><MasterLibrarySurface /></AppShell>;
}
