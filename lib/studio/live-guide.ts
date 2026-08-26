'use client';

/**
 * lib/studio/live-guide.ts — LÕI của HƯỚNG DẪN SỐNG (Live Guide / Demo Conductor).
 *
 * KHÔNG phải tour tooltip, KHÔNG modal onboarding chặn việc: một lớp chỉ-dẫn NEO VÀO UI THẬT,
 * bước hiện tại TỰ TIẾN theo TRẠNG THÁI THẬT của dự án (không bấm Next từng bước), workspace
 * vẫn dùng bình thường.
 *
 * [Đ2] NHÌN VÀO TRONG TRƯỚC — mọi điều kiện "xong" đọc từ nguồn ĐÃ CÓ, cùng họ `demo-spine.ts`:
 *   · nguồn ảnh   ← `getNguonAnh().anhNguon` (sổ nguồn của Toolbelt) HOẶC node `input.image`
 *                    có `params.file` (hai cửa nạp ảnh thật đang sống).
 *   · sketch      ← node sketch có nét (params.file của node vẽ tay).
 *   · dựng ảnh    ← node `run.status==='done'` + output ảnh (đúng phép đo của demo-spine).
 *   · sửa có kiểm soát ← `run.editHistory.length > 1` (accept THẬT).
 *   · spec        ← mốc `markDemoStep('imageToSpec')` — ghi đúng lúc 201 thật.
 *   · present     ← mốc `markDemoStep('specPresent')` — ghi đúng lúc slide thật chèn.
 * KHÔNG có nhánh nào "đánh dấu xong cho đẹp" — thiếu dữ liệu thì bước đứng yên.
 *
 * NEO — mỗi bước khai một hàm `timNeo()` trả phần tử DOM THẬT đang có trên màn (tra bằng
 * aria-label/chữ thật của nút — không gắn class mới vào các component khác). Không thấy neo
 * (đang ở màn khác) thì callout đứng tự do kèm câu "mở … để thấy bước này" — không bịa vị trí.
 */

import { useEffect, useState } from 'react';
import { useFlowStore } from '@/lib/store';
import { getNguonAnh } from '@/lib/capabilities/nguon-anh';

/* ── bật/tắt + bước đang ghim tay — localStorage, cùng khuôn demo-spine ─────────────────────── */

const BAT_KEY = 'if.liveGuide.bat_v1';
let bat = false;
const nghe = new Set<() => void>();

function phatTin() {
  for (const f of nghe) f();
}

export function datGuide(v: boolean) {
  bat = v;
  try {
    localStorage.setItem(BAT_KEY, v ? '1' : '0');
  } catch {
    /* không lưu được — vẫn áp phiên này */
  }
  phatTin();
}

export function useGuideBat(): [boolean, (v: boolean) => void] {
  const [v, setV] = useState(false);
  useEffect(() => {
    try {
      bat = localStorage.getItem(BAT_KEY) === '1';
    } catch {
      bat = false;
    }
    setV(bat);
    const f = () => setV(bat);
    nghe.add(f);
    return () => {
      nghe.delete(f);
    };
  }, []);
  return [v, datGuide];
}

/* ── mốc dùng chung với demo-spine (một nguồn, không chép) ──────────────────────────────────── */

function docMoc(): { imageToSpec?: unknown; specPresent?: unknown } {
  try {
    const raw = localStorage.getItem('if.demoSpine.markers_v1');
    if (raw) return JSON.parse(raw) as { imageToSpec?: unknown; specPresent?: unknown };
  } catch {
    /* rơi xuống rỗng */
  }
  return {};
}

/* ── 6 bước của luồng node hiện tại ─────────────────────────────────────────────────────────── */

export interface BuocGuide {
  id: string;
  stt: number;
  hanhDong: { vi: string; en: string };
  viSao: { vi: string; en: string };
  /** Tìm phần tử neo THẬT trên màn — null khi màn hiện tại không có nó. */
  timNeo: () => HTMLElement | null;
  /** Gợi ý khi neo vắng mặt (đang ở màn khác). */
  goiYKhiVang: { vi: string; en: string };
}

function nutTheoAria(phan: string): HTMLElement | null {
  return (
    [...document.querySelectorAll<HTMLElement>('button[aria-label], a[aria-label], [role="button"][aria-label]')].find(
      (b) => (b.getAttribute('aria-label') ?? '').includes(phan),
    ) ?? null
  );
}

function nodeTheoChu(chu: string): HTMLElement | null {
  return (
    [...document.querySelectorAll<HTMLElement>('.react-flow__node')].find((n) =>
      (n.textContent ?? '').includes(chu),
    ) ?? null
  );
}

export const BUOC_GUIDE: BuocGuide[] = [
  {
    id: 'nguon',
    stt: 1,
    hanhDong: { vi: 'Chọn ảnh nguồn', en: 'Pick a source image' },
    viSao: { vi: 'Đây là nguồn hình ảnh cho cả flow.', en: 'This is the visual source for the whole flow.' },
    timNeo: () => nutTheoAria('Chọn ảnh nguồn') ?? nodeTheoChu('Nhập ảnh'),
    goiYKhiVang: { vi: 'Mở Thiết kế 3D để thấy bước này.', en: 'Open 3D Design to see this step.' },
  },
  {
    id: 'sketch',
    stt: 2,
    hanhDong: { vi: 'Phác ý tưởng', en: 'Sketch the idea' },
    viSao: { vi: 'Sketch đến từ chuột, bút, hoặc bản có sẵn.', en: 'Sketch comes from mouse, pen, or an existing input.' },
    timNeo: () => nodeTheoChu('Vẽ tay tự do'),
    goiYKhiVang: { vi: 'Bảng node của Thiết kế 3D có khối Vẽ tay tự do.', en: 'The 3D node board holds the Free Sketch block.' },
  },
  {
    id: 'dung-anh',
    stt: 3,
    hanhDong: { vi: 'Chạy Sketch → Ảnh thật', en: 'Run Sketch → Real image' },
    viSao: { vi: 'IF ghép nguồn + sketch + prompt thành phương án.', en: 'IF fuses source + sketch + prompt into an option.' },
    timNeo: () => nodeTheoChu('Sketch → Ảnh thật'),
    goiYKhiVang: { vi: 'Khối Sketch → Ảnh thật nằm trên bảng node.', en: 'The Sketch → Real image block lives on the node board.' },
  },
  {
    id: 'sua',
    stt: 4,
    hanhDong: { vi: 'Sửa có kiểm soát', en: 'Controlled Edit' },
    viSao: { vi: 'Chỉnh một vùng, so Trước/Sau, rồi Nhận.', en: 'Adjust one region, compare, then Accept.' },
    timNeo: () =>
      [...document.querySelectorAll<HTMLElement>('button[title]')].find((b) =>
        (b.getAttribute('title') ?? '').includes('Trước/Sau'),
      ) ?? nodeTheoChu('Sketch → Ảnh thật'),
    goiYKhiVang: { vi: 'Mở cửa sổ của khối ảnh để thấy lệnh Cân trắng.', en: "Open the image block's tool window for White balance." },
  },
  {
    id: 'spec',
    stt: 5,
    hanhDong: { vi: 'Ảnh → Spec', en: 'Image → Spec' },
    viSao: { vi: 'Ý đồ hình ảnh thành thông tin cần xác minh.', en: 'Visual intent becomes information to verify.' },
    timNeo: () => nutTheoAria('Ảnh thành khối'),
    goiYKhiVang: { vi: 'Nút Ảnh thành khối ở thanh năng lực của Thiết kế 3D.', en: 'The Image→Spec button sits in the 3D capability belt.' },
  },
  {
    id: 'present',
    stt: 6,
    hanhDong: { vi: 'Đưa sang Trình bày', en: 'Send to Present' },
    viSao: { vi: 'Kết quả đã quyết định đi vào giao tiếp.', en: 'Decided output moves into communication.' },
    timNeo: () =>
      [...document.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent?.includes('Đưa sang Trình bày')) ??
      nutTheoAria('Trình chiếu'),
    goiYKhiVang: { vi: 'Nút hiện sau khi spec đã lưu thật.', en: 'The button appears once a spec is truly saved.' },
  },
];

/** Bước nào ĐÃ XONG — mỗi id một phép đo thật, xem docstring đầu file. */
export function useBuocXong(): Set<string> {
  const nodes = useFlowStore((s) => s.nodes);
  const [moc, setMoc] = useState<{ imageToSpec?: unknown; specPresent?: unknown }>({});
  useEffect(() => {
    setMoc(docMoc());
    const t = setInterval(() => setMoc(docMoc()), 2000); // mốc ghi từ component khác — poll nhẹ 2s
    return () => clearInterval(t);
  }, []);

  const xong = new Set<string>();
  const coNguon = Boolean(getNguonAnh().anhNguon) || nodes.some((n) => n.data?.defType === 'input.image' && n.data?.params?.file);
  if (coNguon) xong.add('nguon');
  if (nodes.some((n) => String(n.data?.defType ?? '').startsWith('sketch') && (n.data?.params?.file || n.data?.run?.outputs))) {
    xong.add('sketch');
  }
  if (nodes.some((n) => n.data?.run?.status === 'done' && Object.values(n.data?.run?.outputs ?? {}).some((o) => o.dataType === 'image'))) {
    xong.add('dung-anh');
  }
  if (nodes.some((n) => (n.data?.run?.editHistory?.length ?? 0) > 1)) xong.add('sua');
  if (moc.imageToSpec) xong.add('spec');
  if (moc.specPresent) xong.add('present');
  return xong;
}

/** Bước hiện tại khi KHÔNG ghim tay = bước đầu tiên chưa xong (tự tiến theo trạng thái thật). */
export function buocHienTai(xong: Set<string>, ghimTay: number | null): number {
  if (ghimTay !== null) return Math.max(0, Math.min(BUOC_GUIDE.length - 1, ghimTay));
  const i = BUOC_GUIDE.findIndex((b) => !xong.has(b.id));
  return i === -1 ? BUOC_GUIDE.length - 1 : i;
}
