'use client';

/**
 * components/present-editor/NguonLienKet.tsx — [marker: nguonLienKet] MÔ HÌNH NGUỒN-LIÊN-KẾT
 * của chặng Trình chiếu, nói ra thành chữ ngay ở màn trống.
 *
 * 🔴 LỖ ĐƯỢC VÁ (đo 20/08 trên app thật, tiền cảnh, dự án rỗng):
 * màn Trình chiếu khi chưa có hồ sơ hiện `PresentDocTypePicker` (thư viện mẫu — đẹp, có chủ
 * đích) NHƯNG **không chỗ nào nói hồ sơ sẽ lấy số/hình TỪ ĐÂU**. Người dùng đứng trước một kho
 * mẫu mà không biết mẫu đó sẽ được nuôi bằng gì, nên không biết vì sao mở ra lại trống. Cùng
 * lúc, ổ Navigator bên trái in câu *"Chuyển trang ở dải thumbnail dưới canvas"* trong khi
 * **chưa có canvas nào** — chỉ dẫn trỏ vào thứ không tồn tại.
 *
 * ⛔ KHÔNG DỰNG KHO THỨ HAI (**[Đ2]** nhìn-vào-trong-trước · NO-REBUILD §B25). Mọi con số ở đây
 * đọc từ ĐÚNG những cỗ máy đang chạy:
 *   · `getProjectDoc()`  (`lib/present-editor/project-doc.ts`) — CÙNG đường BOQ trong Trình
 *     chiếu vẫn đi: store trước, IndexedDB sau. Không tự fetch kiểu khác.
 *   · `docToObjScene()`  (`lib/three/cad-to-obj.ts`)           — CÙNG engine màn 3D dựng cảnh.
 *     Đếm `groups` chứ không đoán theo loại entity ⇒ số ở đây và số khối thấy ở 3D là MỘT.
 *   · `POST /api/boq/:projectId`                                — CÙNG đường `BoqScreen` đi.
 *
 * ⛔ CẤM BỊA % (Hoà chốt 16/08): trong lúc chờ BOQ, thanh dùng nhánh **không đo được** của
 * `lib/ui/tien-trinh.ts` (LightBar bỏ trống `value`) — không có con số nào được phát ra.
 *
 * ✅ LUẬT X2 "không màn nào được chặn": mỗi nguồn đang RỖNG vẫn là một **lối đi**, không phải
 * một lời từ chối — bấm vào là sang đúng chặng làm ra thứ còn thiếu. Nút không bấm được thì
 * `aria-disabled` + `aria-describedby` mang LÝ DO THẬT (không dùng `title` — `title` câm trên
 * cảm ứng và Tab bỏ qua nút `disabled`, bài học 16/08).
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PencilRuler, Box, Palette, FileSpreadsheet } from 'lucide-react';
import LightBar from '@/components/ui/LightBar';
import { useT } from '@/lib/i18n';
import { useFlowStore } from '@/lib/store';
import { effectiveUserId } from '@/lib/resume';
import { getProjectDoc } from '@/lib/present-editor/project-doc';
import { docToObjScene } from '@/lib/three/cad-to-obj';
import type { Doc } from '@/lib/cad/model';

/** Một nguồn nuôi hồ sơ. `so === null` = CHƯA ĐO XONG (khác hẳn `0` = đo rồi, thật sự rỗng). */
interface Nguon {
  khoa: 'ban-ve' | 'khoi-3d' | 'vat-lieu' | 'boq';
  icon: React.ReactNode;
  ten: [string, string];
  /** Nó góp GÌ vào hồ sơ — câu này mới là phần "liên kết", không phải con số. */
  gop: [string, string];
  so: number | null;
  donVi: [string, string];
  /** Chặng đi tới khi nguồn còn rỗng. */
  di: string;
  diNhan: [string, string];
}

/** Đếm mã vật liệu RIÊNG BIỆT đang dùng trong bản vẽ — cùng khoá `matId` mà BOQ gom theo. */
function demMatId(doc: Doc): number {
  const set = new Set<string>();
  for (const e of doc.entities) {
    const m = (e as { matId?: unknown }).matId;
    if (typeof m === 'string' && m) set.add(m);
  }
  return set.size;
}

export function NguonLienKet() {
  const tr = useT();
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const projectId = params?.id ?? '';
  const storeUserId = useFlowStore((s) => s.user?.id);
  const userId = effectiveUserId(storeUserId) ?? '';

  const [demVe, setDemVe] = useState<number | null>(null);
  const [demKhoi, setDemKhoi] = useState<number | null>(null);
  const [demMat, setDemMat] = useState<number | null>(null);
  const [demBoq, setDemBoq] = useState<number | null>(null);
  /** BOQ hỏng (mạng/quyền) — khai THẬT, không để mãi ở trạng thái "đang đo". */
  const [boqLoi, setBoqLoi] = useState(false);

  useEffect(() => {
    let huy = false;
    (async () => {
      const { doc } = await getProjectDoc(userId, projectId).catch(() => ({ doc: null as Doc | null }));
      if (huy || !doc) return;
      setDemVe(doc.entities.length);
      setDemMat(demMatId(doc));
      // Dựng cảnh có thể ném khi Doc lạ — hỏng thì khai 0 chứ không treo mãi ở "đang đo".
      try {
        setDemKhoi(docToObjScene(doc).groups.length);
      } catch {
        setDemKhoi(0);
      }
      if (!projectId) { setDemBoq(0); return; }
      try {
        const res = await fetch(`/api/boq/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doc }),
        });
        if (huy) return;
        if (!res.ok) { setBoqLoi(true); return; }
        const js = (await res.json()) as { rows?: unknown[] };
        if (huy) return;
        setDemBoq(Array.isArray(js.rows) ? js.rows.length : 0);
      } catch {
        if (!huy) setBoqLoi(true);
      }
    })();
    return () => { huy = true; };
  }, [userId, projectId]);

  const nguon: Nguon[] = [
    {
      khoa: 'ban-ve', icon: <PencilRuler size={15} strokeWidth={1.7} aria-hidden="true" />,
      ten: ['Bản vẽ 2D', '2D drawing'],
      gop: ['mặt bằng, mặt cắt, ghi chú lên trang hồ sơ', 'plans, sections and notes on the sheet'],
      so: demVe, donVi: ['đối tượng', 'objects'],
      di: 'cad', diNhan: ['Sang Thiết kế 2D vẽ trước', 'Go to 2D Design and draw first'],
    },
    {
      khoa: 'khoi-3d', icon: <Box size={15} strokeWidth={1.7} aria-hidden="true" />,
      ten: ['Khối 3D', '3D blocks'],
      gop: ['ảnh phối cảnh và góc nhìn dựng từ chính khối', 'renders and views built from the blocks'],
      so: demKhoi, donVi: ['khối', 'blocks'],
      di: 'render', diNhan: ['Sang Thiết kế 3D dựng khối', 'Go to 3D Design and build'],
    },
    {
      khoa: 'vat-lieu', icon: <Palette size={15} strokeWidth={1.7} aria-hidden="true" />,
      ten: ['Vật liệu', 'Materials'],
      gop: ['bảng vật liệu A3 và thông số bày cho khách', 'the A3 material board and client specs'],
      so: demMat, donVi: ['mã đang dùng', 'codes in use'],
      di: 'cad', diNhan: ['Gán vật liệu ở Thiết kế 2D', 'Assign materials in 2D Design'],
    },
    {
      khoa: 'boq', icon: <FileSpreadsheet size={15} strokeWidth={1.7} aria-hidden="true" />,
      ten: ['Khối lượng (BOQ)', 'Bill of quantities'],
      gop: ['bảng khối lượng — chỉ nhận số ĐO ĐƯỢC từ bản vẽ', 'quantities — measured numbers only'],
      so: boqLoi ? 0 : demBoq, donVi: ['dòng', 'rows'],
      di: 'cad', diNhan: ['Cần bản vẽ có vật liệu để ra số', 'Needs a drawing with materials'],
    },
  ];

  const dangDo = nguon.some((n) => n.so === null);

  return (
    <section
      aria-label={tr('Nguồn nuôi hồ sơ', 'What feeds this document')}
      style={{
        maxWidth: 940, margin: '30px auto 0', padding: '16px 18px 14px',
        border: '1px solid var(--border)', borderRadius: 'var(--r-3)', background: 'var(--card)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <h2 style={{ margin: 0, color: 'var(--t2)', fontSize: 11, fontWeight: 750, letterSpacing: '.08em' }}>
          {tr('HỒ SƠ NÀY LẤY TỪ ĐÂU', 'WHERE THIS DOCUMENT PULLS FROM')}
        </h2>
        <p style={{ margin: 0, color: 'var(--t4)', fontSize: 11.5 }}>
          {tr('Liên kết, không sao chép — sửa ở chặng gốc là hồ sơ đổi theo.',
              'Linked, not copied — edit at the source and the document follows.')}
        </p>
      </header>

      {dangDo && !boqLoi ? (
        <div style={{ margin: '10px 0 2px' }}>
          {/* Không đo được: KHÔNG truyền `value` ⇒ không con số nào (lib/ui/tien-trinh.ts). */}
          <LightBar height={6} soVach={28} label={tr('Đang đọc dữ liệu dự án', 'Reading project data')} />
        </div>
      ) : null}

      <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, margin: '12px 0 0', padding: 0 }} className="nguon-lk-grid">
        {nguon.map((n) => {
          const rong = n.so === 0;
          const chuaDo = n.so === null;
          const lyDoId = `nguon-lk-lydo-${n.khoa}`;
          const soChu = chuaDo ? tr('đang đọc…', 'reading…') : `${n.so} ${tr(...n.donVi)}`;
          return (
            <li key={n.khoa} style={{ minWidth: 0 }}>
              <button
                type="button"
                aria-disabled={chuaDo || undefined}
                aria-describedby={rong ? lyDoId : undefined}
                onClick={chuaDo ? undefined : () => projectId && router.push(`/projects/${projectId}/${n.di}`)}
                style={{
                  width: '100%', height: '100%', textAlign: 'left', cursor: chuaDo ? 'default' : 'pointer',
                  padding: '11px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-2)',
                  background: 'transparent', color: 'inherit',
                  opacity: chuaDo ? 'var(--mo-vo-hieu)' : 1,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: rong ? 'var(--t3)' : 'var(--accent)' }}>
                  {n.icon}
                  <span style={{ color: 'var(--t1)', fontSize: 12.5, fontWeight: 650 }}>{tr(...n.ten)}</span>
                </span>
                <span style={{ display: 'block', marginTop: 6, color: rong ? 'var(--t4)' : 'var(--t1)', fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {soChu}
                </span>
                <span style={{ display: 'block', marginTop: 4, color: 'var(--t3)', fontSize: 11.5, lineHeight: 1.4 }}>
                  {tr(...n.gop)}
                </span>
                {rong ? (
                  <span id={lyDoId} style={{ display: 'block', marginTop: 6, color: 'var(--t4)', fontSize: 11, lineHeight: 1.4 }}>
                    {n.khoa === 'boq' && boqLoi
                      ? tr('Chưa đọc được bảng khối lượng lúc này.', 'Could not read the bill of quantities right now.')
                      : `${tr('Chưa có gì. ', 'Nothing yet. ')}${tr(...n.diNhan)} →`}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <style jsx>{`
        @media (max-width: 780px) { .nguon-lk-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }
        @media (max-width: 420px) { .nguon-lk-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

export default NguonLienKet;
