'use client';

/**
 * lib/studio/demo-spine.ts — CHẾ ĐỘ HIỂN THỊ DEMO: "cả chuỗi trình bày đang ở đâu", tách khỏi
 * `hoat-dong-luong.ts` (đó trả lời "cái gì đang chạy NGAY BÂY GIỜ" — job/flowRun; đây trả lời
 * "từng chặng của kịch bản demo đã đi tới đâu" — một câu KHÁC, đơn vị KHÁC: bước, không phải job).
 *
 * [Đ2] NHÌN VÀO TRONG TRƯỚC — 9 bước đọc THẲNG từ dữ liệu đã có, KHÔNG bịa trạng thái:
 *   · Sơ phác 2D    ← `useCadStore.doc.entities.length` (DOC là nguồn sự thật, K1)
 *   · Thiết kế 3D   ← `useScene3D().groups.length` (PHU tính từ CHÍNH Doc trên)
 *   · Dựng ảnh      ← quét `useFlowStore.nodes` tìm node có `run.status==='done'` + output ảnh
 *   · Sửa có kiểm soát ← quét node có `run.editHistory.length > 1` (accept thật — xem
 *     `components/render-studio/controlled-edit.ts`)
 *   · Ảnh → Spec    ← MỐC do `CuaAnhThanhSpec.tsx` tự báo (`markDemoStep('imageToSpec', …)`)
 *     ĐÚNG lúc `/api/asset-representation` trả 200/201 thật — không suy, không đoán.
 *   · Đưa sang Trình bày ← MỐC do `PresentEditor.tsx` tự báo khi slide spec-handoff CHÈN THẬT.
 *   · Thiết lập trang · Hoạt động · Trang chủ — không có "trạng thái xong/chưa", đây là NĂNG LỰC
 *     luôn sẵn (`sanSang`), không phải việc-cần-làm-xong-một-lần.
 *
 * MỐC (marker) CHỈ ghi khi có SỰ KIỆN THẬT xảy ra (network 200/201, slide thật được chèn) — không
 * module nào được gọi `markDemoStep` để "trông như xong". Lưu localStorage để sống qua reload
 * giữa buổi demo (khuôn `persist()` thủ công của `tool-mode-ui.ts`, không kéo zustand/middleware).
 *
 * KHÔNG lộ tên provider/model/job kỹ thuật — nhãn ở đây là tên BƯỚC trong kịch bản demo, cố định,
 * không đọc từ NodeDefinition.title (khác `hoat-dong-luong.ts` — cố ý, vì bước demo là một khái
 * niệm cấp cao hơn "năng lực nào vừa chạy").
 */

import { useEffect, useState } from 'react';
import { useCadStore } from '@/lib/cad/store';
import { useFlowStore } from '@/lib/store';
import { useScene3D } from '@/lib/render-studio/use-scene3d';

export type TrangThaiBuoc = 'sanSang' | 'dangCho' | 'canXem' | 'xong';

export interface BuocDemo {
  id: string;
  nhan: { vi: string; en: string };
  trangThai: TrangThaiBuoc;
  /** Dự án/nguồn thật đang mang trạng thái này — không phải nhãn cố định. */
  nguon?: string;
  /** Đã sinh ra gì — một câu, không kỹ thuật. */
  ketQua?: { vi: string; en: string };
  /** Cửa người kế tiếp — CHỈ khi có việc thật cần người quyết. */
  cuaNguoiKeTiep?: { vi: string; en: string };
  /** Điều hướng khi bấm — null = bước này không có "nơi để tới" (Hoạt động = chính panel này). */
  href: string | null;
}

/* ── MỐC (marker) — chỉ hai mốc cần một sự kiện KHÔNG có trong store toàn cục sẵn ────────────── */

const KEY = 'if.demoSpine.markers_v1';

interface Moc {
  ts: number;
  nhan: string;
}

interface MocState {
  imageToSpec?: Moc;
  specPresent?: Moc;
}

let moc: MocState = {};
const nguoiNghe = new Set<() => void>();

function docTuLuu(): MocState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as MocState;
  } catch {
    /* localStorage chặn/hỏng — bắt đầu rỗng, không chặn demo */
  }
  return {};
}

function ghiVaoLuu(next: MocState) {
  moc = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* không lưu được thì phiên sau mất mốc — không chặn thao tác hiện tại */
  }
  for (const f of nguoiNghe) f();
}

/** Gọi ĐÚNG lúc sự kiện thật xảy ra (network 200/201, slide thật chèn) — xem docstring đầu file. */
export function markDemoStep(id: 'imageToSpec' | 'specPresent', nhan: string) {
  ghiVaoLuu({ ...moc, [id]: { ts: Date.now(), nhan } });
}

function useMoc(): MocState {
  const [s, setS] = useState<MocState>(() => (typeof window === 'undefined' ? {} : moc));
  useEffect(() => {
    moc = docTuLuu();
    setS(moc);
    const f = () => setS(moc);
    nguoiNghe.add(f);
    return () => {
      nguoiNghe.delete(f);
    };
  }, []);
  return s;
}

/* ── TÍNH 9 BƯỚC — thuần đọc, không side-effect ──────────────────────────────────────────────── */

const NHAN: Record<string, { vi: string; en: string }> = {
  home: { vi: 'Trang chủ', en: 'Home' },
  sketch: { vi: 'Sơ phác 2D', en: '2D Sketch' },
  threeD: { vi: 'Thiết kế 3D', en: '3D Design' },
  visualGenerate: { vi: 'Dựng ảnh', en: 'Visual Generate' },
  controlledEdit: { vi: 'Sửa có kiểm soát', en: 'Controlled Edit' },
  imageToSpec: { vi: 'Ảnh → Spec', en: 'Image → Spec' },
  specPresent: { vi: 'Đưa sang Trình bày', en: 'Send to Present' },
  pageSetup: { vi: 'Thiết lập trang', en: 'Page Setup' },
  activity: { vi: 'Hoạt động', en: 'Activity' },
};

export function useDemoSpine(): BuocDemo[] {
  const projectId = useFlowStore((s) => s.currentProjectId);
  const doc = useCadStore((s) => s.doc);
  const nodes = useFlowStore((s) => s.nodes);
  const scene = useScene3D();
  const m = useMoc();

  const coBanVe2D = doc.entities.length > 0;
  const coKhoi3D = (scene?.groups.length ?? 0) > 0;

  const nodeAnhXong = nodes.find(
    (n) => n.data?.run?.status === 'done' && Object.values(n.data?.run?.outputs ?? {}).some((o) => o.dataType === 'image'),
  );
  const nodeDaSua = nodes.find((n) => (n.data?.run?.editHistory?.length ?? 0) > 1);

  const rProj = (path: string) => (projectId ? `/projects/${projectId}${path}` : null);

  const buoc: BuocDemo[] = [
    {
      id: 'home',
      nhan: NHAN.home,
      trangThai: 'sanSang',
      href: '/',
    },
    {
      id: 'sketch',
      nhan: NHAN.sketch,
      trangThai: coBanVe2D ? 'xong' : 'sanSang',
      nguon: coBanVe2D ? `${doc.entities.length} nét trong bản vẽ đang mở` : undefined,
      ketQua: coBanVe2D ? { vi: 'Có mặt bằng để dựng tiếp', en: 'A plan ready to build from' } : undefined,
      href: rProj('/cad'),
    },
    {
      id: 'threeD',
      nhan: NHAN.threeD,
      trangThai: coKhoi3D ? 'xong' : coBanVe2D ? 'sanSang' : 'dangCho',
      nguon: coKhoi3D ? `${scene?.groups.length} khối trong cảnh` : undefined,
      ketQua: coKhoi3D ? { vi: 'Không gian đã dựng khối', en: 'Space modelled in 3D' } : undefined,
      cuaNguoiKeTiep: !coBanVe2D ? { vi: 'Vẽ mặt bằng hoặc dựng khối trực tiếp ở đây', en: 'Draw a plan or model directly here' } : undefined,
      href: rProj('/render'),
    },
    {
      id: 'visualGenerate',
      nhan: NHAN.visualGenerate,
      trangThai: nodeAnhXong ? 'xong' : 'sanSang',
      nguon: nodeAnhXong ? 'Kết quả thật trong dự án đang mở' : undefined,
      ketQua: nodeAnhXong ? { vi: 'Một ảnh phối cảnh đã có', en: 'A rendered image exists' } : undefined,
      href: rProj('/render'),
    },
    {
      id: 'controlledEdit',
      nhan: NHAN.controlledEdit,
      trangThai: nodeDaSua ? 'xong' : nodeAnhXong ? 'sanSang' : 'dangCho',
      nguon: nodeDaSua ? 'Ảnh đã qua Cân trắng theo vùng' : undefined,
      ketQua: nodeDaSua ? { vi: 'Bản gốc còn nguyên, đã nhận 1 bản sửa', en: 'Original kept, one edit accepted' } : undefined,
      cuaNguoiKeTiep: !nodeAnhXong ? { vi: 'Cần một ảnh đã dựng trước', en: 'Needs a generated image first' } : undefined,
      href: rProj('/render'),
    },
    {
      id: 'imageToSpec',
      nhan: NHAN.imageToSpec,
      trangThai: m.imageToSpec ? 'xong' : 'sanSang',
      nguon: m.imageToSpec?.nhan,
      ketQua: m.imageToSpec ? { vi: 'Đã lưu spec, người đã duyệt', en: 'Spec saved, human-verified' } : undefined,
      href: rProj('/render'),
    },
    {
      id: 'specPresent',
      nhan: NHAN.specPresent,
      trangThai: m.specPresent ? 'xong' : m.imageToSpec ? 'sanSang' : 'dangCho',
      nguon: m.specPresent?.nhan,
      ketQua: m.specPresent ? { vi: 'Một trang trình bày đã có từ spec', en: 'A present page exists from the spec' } : undefined,
      cuaNguoiKeTiep: !m.imageToSpec ? { vi: 'Cần lưu một spec trước', en: 'Needs a saved spec first' } : undefined,
      href: '/present-editor',
    },
    {
      id: 'pageSetup',
      nhan: NHAN.pageSetup,
      trangThai: 'sanSang',
      ketQua: { vi: 'Xem trước sống theo khổ/tỉ lệ/lề', en: 'Live preview follows paper/scale/margin' },
      href: rProj('/present'),
    },
    {
      id: 'activity',
      nhan: NHAN.activity,
      trangThai: 'sanSang',
      href: null,
    },
  ];

  return buoc;
}

/* ── BẬT/TẮT — hiển thị demo là tuỳ chọn, không phải chrome thường trực (Hoà chốt 21/08) ─────── */

const BAT_KEY = 'if.demoSpine.bat_v1';
const boBat = new Set<() => void>();
let bat = false;

function docBatTuLuu(): boolean {
  try {
    return localStorage.getItem(BAT_KEY) === '1';
  } catch {
    return false;
  }
}

export function datCheDoDemo(v: boolean) {
  bat = v;
  try {
    localStorage.setItem(BAT_KEY, v ? '1' : '0');
  } catch {
    /* không lưu được — vẫn áp cho phiên này, chỉ là không nhớ qua lần sau */
  }
  for (const f of boBat) f();
}

export function useCheDoDemo(): [boolean, (v: boolean) => void] {
  const [v, setV] = useState(() => (typeof window === 'undefined' ? false : bat));
  useEffect(() => {
    bat = docBatTuLuu();
    setV(bat);
    const f = () => setV(bat);
    boBat.add(f);
    return () => {
      boBat.delete(f);
    };
  }, []);
  return [v, datCheDoDemo];
}

export function tomTatSpine(buoc: BuocDemo[]): { xong: number; tong: number; canXem: number } {
  // "activity"/"home" là điểm neo, không phải việc-cần-xong — không tính vào mẫu số.
  const dem = buoc.filter((b) => b.id !== 'home' && b.id !== 'activity');
  return {
    xong: dem.filter((b) => b.trangThai === 'xong').length,
    tong: dem.length,
    canXem: dem.filter((b) => b.trangThai === 'canXem').length,
  };
}
