'use client';

/**
 * components/site/useSiteContext.ts — hook nối `lib/site` (thuần) với React: đọc/ghi local-first, tự
 * suy diễn lại khi cũ, biết ngoại tuyến. Không fetch mạng nào — la bàn không cần mạng để chạy
 * (gói vùng do caller truyền vào; mặc định rỗng = app trung tính).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { kiemCu, nhanGoiY, suyDienSite } from '@/lib/site/derive';
import { nhanBangChung } from '@/lib/site/survey-bridge';
import { siteRong, siteStore } from '@/lib/site/store';
import type { MaBienSoNguCanh, SiteContext, SitePack, SitePin, SurveyEvidence } from '@/lib/site/types';

export function useNgoaiTuyen(): boolean {
  const [off, setOff] = useState(false);
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const cap = () => setOff(!navigator.onLine);
    cap();
    window.addEventListener('online', cap);
    window.addEventListener('offline', cap);
    return () => {
      window.removeEventListener('online', cap);
      window.removeEventListener('offline', cap);
    };
  }, []);
  return off;
}

export function useSiteContext(projectId: string, packs: SitePack[] = []) {
  const store = useMemo(() => siteStore(projectId), [projectId]);
  const [ctx, setCtx] = useState<SiteContext>(() => siteRong(projectId));
  const [daNap, setDaNap] = useState(false);
  const ngoaiTuyen = useNgoaiTuyen();

  useEffect(() => {
    let alive = true;
    store.hydrate().then(() => {
      if (!alive) return;
      setCtx(store.get());
      setDaNap(true);
    });
    return () => {
      alive = false;
    };
  }, [store]);

  const ghi = useCallback(
    (next: SiteContext) => {
      store.set(next);
      setCtx(next);
    },
    [store],
  );

  const suyLai = useCallback(
    (base: SiteContext): SiteContext => {
      const suyDien = suyDienSite(base, { packs });
      return { ...base, suyDien, capNhat: new Date().toISOString() };
    },
    [packs],
  );

  const datGhim = useCallback(
    (pin: SitePin | null) => ghi(suyLai({ ...ctx, pin })),
    [ctx, ghi, suyLai],
  );
  const themBangChung = useCallback(
    (moi: SurveyEvidence[]) => ghi(suyLai(nhanBangChung(ctx, moi))),
    [ctx, ghi, suyLai],
  );
  const nhan = useCallback(
    (ma: MaBienSoNguCanh) => ghi(suyLai(nhanGoiY(ctx, ma))),
    [ctx, ghi, suyLai],
  );
  const tinhLai = useCallback(() => ghi(suyLai(ctx)), [ctx, ghi, suyLai]);

  const cu = useMemo(() => kiemCu(ctx, { ngoaiTuyen }), [ctx, ngoaiTuyen]);

  return { ctx, daNap, ngoaiTuyen, cu, datGhim, themBangChung, nhan, tinhLai };
}
